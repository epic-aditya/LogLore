import os
import re
import logging
import datetime
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Environment Setup
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
has_gemini = bool(os.getenv("GEMINI_API_KEY"))
logging.info("GEMINI key present: %s", has_gemini)

# Model Setup
USE_GEMINI = False
genai = None

if has_gemini:
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        USE_GEMINI = True
        logging.info("Configured Google Gemini successfully")
    except Exception as e:
        logging.error("Failed to configure Gemini: %s", e)

# FastAPI App
app = FastAPI()

# CRITICAL: Single CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Utilities
def redact_text(text: str) -> str:
    patterns = [
        (r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", "[REDACTED_EMAIL]"),
        (r"\b(?:\d{1,3}\.){3}\d{1,3}\b", "[REDACTED_IP]"),
        (r"(?i)(?:api[_-]?key|token|sk-)[\s:=]*([A-Za-z0-9\-_\.]{8,})", "[REDACTED_KEY]"),
        (r"\bsk-[A-Za-z0-9]{20,}", "[REDACTED_KEY]"),
    ]
    for patt, repl in patterns:
        text = re.sub(patt, repl, text)
    return text

def call_gemini(system_prompt: str, user_msg: str) -> str:
    if USE_GEMINI and genai is not None:
        try:
            model_obj = genai.GenerativeModel("gemini-2.0-flash")
            prompt_text = system_prompt + "\n\n" + user_msg
            resp = model_obj.generate_content(prompt_text)
            return getattr(resp, "text", str(resp))
        except Exception as e:
            logging.error("Gemini call failed: %s", e)
    
    # Mock response fallback
    return """## Error Analysis
This appears to be a connection or authentication issue.

## Quick Fix Steps
1. Check your database connection settings
2. Verify credentials are correct
3. Restart the service

## Verification
Test the connection to confirm the fix works.

*Note: This is a mock response while AI API is being configured.*"""

# Models
class LogRequest(BaseModel):
    text: str
    metadata: dict = {}
    mode: str = "beginner"

# Endpoints
@app.post("/redact_log")
def redact_log(req: LogRequest):
    redacted = redact_text(req.text)
    return {"redacted": redacted}

@app.post("/ai_troubleshoot")
def ai_troubleshoot(req: LogRequest):
    redacted = redact_text(req.text)
    
    if req.mode.lower() == "advanced":
        system_prompt = (
            "Use plain text only no bold letters nor italic"
            "You are an expert engineer. Provide technical analysis with "
            "specific commands and verification steps."
        )
    else:
        system_prompt = (
            "Use plain text only no bold letters nor italic"
            "You are a helpful technical mentor. Explain errors simply "
            "with clear step-by-step fixes."
        )
    
    user_msg = f"MODE: {req.mode}\nLOG:\n{redacted}"
    
    try:
        answer = call_gemini(system_prompt, user_msg)
        return {"answer": answer, "redacted": redacted}
    except Exception as e:
        logging.error("ai_troubleshoot failed: %s", e)
        return {
            "answer": "Error: Failed to analyze the log.",
            "redacted": redacted
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
        "version": "1.0"
    }
