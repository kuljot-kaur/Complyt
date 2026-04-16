"""
main.py — Orchestration of the AI pipeline
Chains: OCR → OpenAI Extraction → HS Classification → Hybrid Compliance
"""

import json
import logging
from pathlib import Path
from typing import Any
import os
import uuid
from contextlib import asynccontextmanager

# IMPORTANT: Import config first to load .env variables
try:
    from app import config
except ModuleNotFoundError as exc:
    if exc.name != "app":
        raise
    import config

config.setup_logging()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import Response

try:
    from app.services import ocr, openai_extractor, hs_classifier, hybrid_compliance, compliance_ai
    from app.models.db import create_db_and_tables
    from app.routes.auth import router as auth_router
    from app.routes.upload import router as upload_router
    from app.routes.result import router as result_router
except ModuleNotFoundError as exc:
    if exc.name != "app":
        raise
    from services import ocr, openai_extractor, hs_classifier, hybrid_compliance, compliance_ai
    from models.db import create_db_and_tables
    from routes.auth import router as auth_router
    from routes.upload import router as upload_router
    from routes.result import router as result_router

@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Complyt AI", version="1.0.0", lifespan=lifespan)

# CORS configuration - Outermost layer
# We use a broad default but allow explicitly configured origins
allowed_origins = [
    origin.strip() 
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173").split(",") 
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET_KEY", os.getenv("JWT_SECRET_KEY", "oauth-session-secret"))
)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(result_router)

def process_document(file_path: str) -> dict[str, Any]:
    file_path = Path(file_path)
    if not file_path.exists():
        return {"status": "error", "message": f"File not found: {file_path}"}
    
    logger.info("🚀 Starting pipeline for: %s", file_path.name)
    try:
        # Step 1: OCR
        raw_text = ocr.extract_text(file_path)
        if not raw_text.strip():
            return {"status": "error", "message": "OCR failed to extract any text"}
        
        # Step 2: OpenAI extraction
        extracted_data = openai_extractor.extract_fields(raw_text)
        
        # Step 3: HS classification
        extracted_data = hs_classifier.classify(extracted_data)
        
        # Step 4: Hybrid compliance
        hybrid_result = hybrid_compliance.hybrid_compliance_check(extracted_data)
        
        # Step 5: AI Reasoning (Enrich issues with Impact/Suggestion)
        all_issues = hybrid_result.get("errors", []) + hybrid_result.get("warnings", [])
        enriched_issues = compliance_ai.analyze(hybrid_result.get("data", {}), all_issues)
        
        return {
            "status": "success",
            "data": hybrid_result.get("data"),
            "errors": [i for i in enriched_issues if i.get("severity") == "error"],
            "warnings": [i for i in enriched_issues if i.get("severity") == "warning"],
            "score": hybrid_result.get("score"),
            "message": "Processing successful",
        }
    except Exception as exc:
        logger.error("❌ Pipeline failed: %s", exc, exc_info=True)
        return {"status": "error", "message": f"Pipeline error: {exc}"}

if __name__ == "__main__":
    pass
