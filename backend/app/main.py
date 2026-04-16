"""
main.py — Orchestration of the AI pipeline
Chains: OCR → OpenAI Extraction → HS Classification → Hybrid Compliance

process_document() delegates to pipeline.run_pipeline() which is the
single canonical path through the hybrid compliance engine.
"""

import logging
from pathlib import Path
from typing import Any
import os
from contextlib import asynccontextmanager

# config.setup_logging() - Disabled in favor of JSON stdout for Loki
from app.utils.logger import generate_request_id, log_info, log_error

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.requests import Request
from starlette.responses import Response

try:
    from app.services.pipeline import run_pipeline
    from app.models.db import create_db_and_tables
    from app.routes.auth import router as auth_router
    from app.routes.upload import router as upload_router
    from app.routes.result import router as result_router
except ModuleNotFoundError as exc:
    if exc.name != "app":
        raise
    from services.pipeline import run_pipeline
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

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = generate_request_id()
    request.state.request_id = request_id

    log_info("Incoming request",
             service="api",
             request_id=request_id,
             path=request.url.path,
             method=request.method)

    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

from app.routes.admin import router as admin_router

app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(result_router)
app.include_router(admin_router)

def process_document(file_path: str) -> dict[str, Any]:
    """
    Entry point called by Celery workers.
    Delegates to the unified pipeline which runs:
      OCR → Extraction → HS Classification → Hybrid Compliance (Rules + LLM)
    """
    file_path = Path(file_path)
    if not file_path.exists():
        return {"status": "error", "message": f"File not found: {file_path}"}
    
    log_info("🚀 Starting pipeline", filename=file_path.name)
    try:
        report = run_pipeline(file_path)

        return {
            "status": "success",
            "data": report.get("data"),
            "errors": report.get("errors", []),
            "warnings": report.get("warnings", []),
            "score": report.get("score", 0),
            "riskLevel": report.get("riskLevel", "Medium"),
            "llmReasoning": report.get("llmReasoning", "Semantic analysis complete."),
            "llmOverallAssessment": report.get("llmOverallAssessment", "review_required"),
            "llmRisks": report.get("llmRisks", []),
            "llmRecommendations": report.get("llmRecommendations", []),
            "message": "Processing successful",
        }
    except Exception as exc:
        log_error("❌ Pipeline failed", error=str(exc))
        return {"status": "error", "message": f"Pipeline error: {exc}"}

if __name__ == "__main__":
    pass
