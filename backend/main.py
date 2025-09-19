# backend/main.py
import os
import re
import logging
import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# -----------------------------
# Environment Setup
# -----------------------------
load_dotenv()

# Configure logging (avoid logging secrets)
logging.basicConfig(level=logging.INFO)
has_gemini = bool(os.getenv("GEMINI_API_KEY"))
has_openai = bool(os.getenv("OPENAI_API_KEY"))
logging.info("GEMINI key present: %s | OPENAI key present: %s", has_gemini, has_openai)

# -----------------------------
# Model Clients
# -----------------------------
USE_GEMINI = False
USE_OPENAI = False
genai = None
openai_client = None

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

# Try Gemini first
if has_gemini:
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        USE_GEMINI = True
        logging.info("Configured Google Gemini model: %s", GEMINI_MODEL)
    except Exception as e:
        logging.error("Failed to configure Gemini: %s", e)

# Fallback to OpenAI
if not USE_GEMINI and has_openai:
    try:
        from openai import OpenAI
        openai_client = OpenAI()  # Reads from env
        USE_OPENAI = True
        logging.info("Using OpenAI client with model: %s", OPENAI_MODEL)
    except Exception as e:
        logging.error("Failed to initialize OpenAI client: %s", e)

# -----------------------------
# FastAPI App
# -----------------------------
app = FastAPI()

# Allow local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Utilities
# -----------------------------
def redact_text(text: str) -> str:
    """Redact sensitive information from logs."""
    patterns = [
        # Emails
        (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[REDACTED_EMAIL]"),
        # IPv4
        (r"\b(?:\d{1,3}\.){3}\d{1,3}\b", "[REDACTED_IP]"),
        # API Keys / Tokens
        (r"(?i)(?:api[_-]?key|token|sk-)[\s:=]*([A-Za-z0-9\-_\.]{8,})", "[REDACTED_KEY]"),
        # sk- prefix specifically
        (r"\bsk-[A-Za-z0-9]{20,}", "[REDACTED_KEY]"),
    ]
    for patt, repl in patterns:
        text = re.sub(patt, repl, text)
    return text

def call_llm(system_prompt: str, user_msg: str) -> (str, str):
    """Call Gemini (if available) or OpenAI. Returns (answer, model_used)."""
    prompt_text = system_prompt + "\n\n" + user_msg

    # Try Gemini first
    if USE_GEMINI and genai is not None:
        try:
            model_obj = genai.GenerativeModel(GEMINI_MODEL)
            resp = model_obj.generate_content(prompt_text)
            text = getattr(resp, "text", None) or str(resp)
            return text, GEMINI_MODEL
        except Exception as e:
            logging.error("Gemini call failed: %s", e)

    # Fallback to OpenAI
    if USE_OPENAI and openai_client is not None:
        try:
            resp = openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_msg},
                ],
                max_tokens=800,
                temperature=0.2,
            )
            answer = resp.choices[0].message.content
            return answer, OPENAI_MODEL
        except Exception as e:
            logging.error("OpenAI call failed: %s", e)

    # Final fallback: mock response
    mock_answer = (
        "## Mock answer (no LLM configured)\n"
        "LLM not available (no GEMINI_API_KEY / OPENAI_API_KEY or calls failed). "
        "This is a placeholder."
    )
    return mock_answer, "mock"

# -----------------------------
# Models
# -----------------------------
class LogRequest(BaseModel):
    text: str
    metadata: dict = {}
    mode: str = "beginner"

# -----------------------------
# Endpoints
# -----------------------------
@app.post("/redact_log")
def redact_log(req: LogRequest):
    redacted = redact_text(req.text)
    return {"redacted": redacted}

@app.post("/ai_troubleshoot")
def ai_troubleshoot(req: LogRequest):
    redacted = redact_text(req.text)

    # Mode-aware system prompt
    if req.mode.lower() == "advanced":
        system_prompt = (
            "use plain text only dont bold or italicize anything. "
            "You are an expert engineer writing for professionals. "
            "Provide a succinct triage, then 3 prioritized remediation steps "
            "with exact commands and verification commands, plus a confidence level. "
            "Avoid destructive commands."
        )
    else:
        system_prompt = (
            "use plain text only dont bold or italicize anything. "
            "You are an expert engineer who explains simply. "
            "Provide a short triage, then 3 clear step-by-step fixes with explicit commands "
            "and how to verify, plus a confidence level. "
            "Avoid destructive commands."
        )

    user_msg = f"MODE: {req.mode}\nMETADATA: {req.metadata}\nLOG:\n{redacted}"

    try:
        answer_text, model_used = call_llm(system_prompt, user_msg)
        return {"answer": answer_text, "redacted": redacted, "model_used": model_used}
    except Exception:
        logging.exception("ai_troubleshoot failed")
        return {
            "answer": "Error: unexpected failure while calling the LLM.",
            "redacted": redacted,
            "model_used": "error",
        }

@app.get("/")
def root():
    return {
        "message": "LogLore API v1.0",
        "status": "running",
        "endpoints": ["/redact_log", "/ai_troubleshoot", "/health", "/docs"]
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "gemini_configured": USE_GEMINI,
        "openai_configured": USE_OPENAI,
        "version": "1.0"
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://*.netlify.app"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
