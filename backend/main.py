import os
import re
import logging
import datetime
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import google.generativeai as genai


try:
    from backend.redaction_patterns import PATTERNS
except ModuleNotFoundError:
    from redaction_patterns import PATTERNS


load_dotenv()

# Configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class AIService:
    def __init__(self):
        self.model = None
        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                self.model = genai.GenerativeModel("gemini-2.0-flash")
                logger.info("Gemini AI initialized.")
            except Exception as e:
                logger.error(f"Failed to init Gemini: {e}")
        else:
            logger.warning("GEMINI_API_KEY not set. AI features disabled.")

    def analyze(self, log_text: str, mode: str = "beginner") -> str:
        if not self.model:
            return "AI service unavailable. Check server configuration."

        prompts = {
            "beginner": (
                "You are a friendly technical mentor. Explain this error simply and clearly.\n"
                "IMPORTANT: Do NOT use markdown symbols like * or # or - for bullets. Use plain text numbering or spacing.\n\n"
                "Structure your response like this:\n"
                "WHAT HAPPENED\n"
                "A simple, one-sentence summary of the error.\n\n"
                "WHY IT HAPPENED\n"
                "A brief, non-technical explanation of the cause.\n\n"
                "HOW TO FIX IT\n"
                "1. Step-by-step instructions.\n"
                "2. Clear commands or actions.\n\n"
                "VERIFICATION\n"
                "How to check if the fix worked."
            ),
            "advanced": (
                "You are a Senior Systems Engineer. Provide a technical Root Cause Analysis (RCA).\n"
                "IMPORTANT: Do NOT use markdown symbols like * or # or - for bullets. Use plain text numbering or spacing.\n\n"
                "Structure your response like this:\n"
                "ROOT CAUSE ANALYSIS\n"
                "Technical explanation of the failure. Specific components, dependencies, or code paths involved.\n\n"
                "RESOLUTION STEPS\n"
                "Exact commands, code patches, or configuration changes.\n\n"
                "PREVENTION & OPTIMIZATION\n"
                "Long-term fixes (e.g., architectural changes, monitoring alerts). Performance or security implications."
            )
        }
        
        system_instruction = prompts.get(mode, prompts["beginner"])
        try:
            response = self.model.generate_content(f"{system_instruction}\n\nLOG:\n{log_text}")
            return response.text
        except Exception as e:
            logger.error(f"Analysis error: {e}")
            return "Error analyzing log."

class Redactor:
    def __init__(self):
        self.patterns = [(re.compile(p, f), r) for p, r, f in PATTERNS]
        self.placeholder_re = re.compile(r"\[REDACTED[^\]]*\]")

    def redact(self, text: str) -> str:
        # Protect existing redactions
        preserved = {}
        
        def save_token(match):
            key = f"__P{len(preserved)}__"
            preserved[key] = match.group(0)
            return key

        processed = self.placeholder_re.sub(save_token, text)

        # Apply patterns
        for pattern, replacement in self.patterns:
            processed = pattern.sub(replacement, processed)

        # Heuristics for leftovers
        processed = re.sub(r'(?<![A-Za-z0-9])[A-Za-z0-9_\-+/=]{24,}(?![A-Za-z0-9])', '[REDACTED_TOKEN]', processed)
        
        # Restore protected tokens
        for key, val in preserved.items():
            processed = processed.replace(key, val)
            
        return processed

# App Setup
ai_service = AIService()
redactor = Redactor()

app = FastAPI(title="LogLore API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class LogRequest(BaseModel):
    text: str
    mode: str = "beginner"
    metadata: Dict[str, Any] = {}

@app.get("/")
async def root():
    return {"status": "ok", "ai_ready": bool(ai_service.model)}

@app.get("/health")
async def health_check():
    return {
        "status": "operational",
        "gemini_configured": bool(ai_service.model),
        "api_key_set": bool(GEMINI_API_KEY),
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.post("/redact_log")
async def redact_log(req: LogRequest):
    try:
        redacted = redactor.redact(req.text)
        count = len(re.findall(r'\[REDACTED', redacted))
        return {
            "original_length": len(req.text),
            "redacted_text": redacted,
            "redactions_count": count
        }
    except Exception as e:
        logger.error(f"Redaction error: {e}")
        raise HTTPException(500, "Processing failed")

@app.post("/ai_troubleshoot")
async def analyze_log(req: LogRequest):
    try:
        clean_log = redactor.redact(req.text)
        analysis = ai_service.analyze(clean_log, req.mode)
        return {
            "answer": analysis,
            "redacted": clean_log,
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(500, "Analysis failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

