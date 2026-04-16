"""
main.py — Orchestration of the AI pipeline
Chains: OCR → Gemini Extraction → HS Classification → Compliance Check
"""

import json
import logging
from pathlib import Path
from typing import Any
import os
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

try:
    from app.services import ocr, gemini_extractor, hs_classifier, compliance
    from app.models.db import create_db_and_tables
    from app.routes.auth import router as auth_router
    from app.routes.upload import router as upload_router
    from app.routes.result import router as result_router
except ModuleNotFoundError as exc:
    if exc.name != "app":
        raise
    from services import ocr, gemini_extractor, hs_classifier, compliance
    from models.db import create_db_and_tables
    from routes.auth import router as auth_router
    from routes.upload import router as upload_router
    from routes.result import router as result_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(title="Complyt API", version="1.0.0", lifespan=lifespan)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(result_router)


def process_document(file_path: str) -> dict[str, Any]:
    """
    End-to-end document processing pipeline.
    
    Takes a file (PDF or image) and runs it through:
      1. OCR extraction
      2. Gemini field extraction
      3. HS code classification
      4. Compliance checking
    
    Args:
        file_path: Absolute path to the document file (PDF or image).
    
    Returns:
        {
            "status": "success" | "error",
            "data": { ...extracted fields... } | None,
            "errors": [...],
            "warnings": [...],
            "score": int | None,
            "message": str | None,
        }
    
    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file type is unsupported.
    """
    file_path = Path(file_path)
    
    if not file_path.exists():
        return {
            "status": "error",
            "data": None,
            "errors": [{"code": "FILE_NOT_FOUND", "message": f"File not found: {file_path}"}],
            "warnings": [],
            "score": None,
            "message": f"File not found: {file_path}",
        }
    
    logger.info("🚀 Starting pipeline for: %s", file_path.name)
    
    try:
        # Step 1: OCR
        logger.info("Step 1/4: Running OCR...")
        raw_text = ocr.extract_text(file_path)
        logger.info("✓ OCR complete (%d chars)", len(raw_text))
        
        if not raw_text.strip():
            return {
                "status": "error",
                "data": None,
                "errors": [{"code": "OCR_NO_TEXT", "message": "OCR extracted no text from document"}],
                "warnings": [],
                "score": None,
                "message": "OCR failed to extract any text",
            }
        
        # Step 2: Gemini extraction
        logger.info("Step 2/4: Extracting fields via Gemini...")
        extracted_data = gemini_extractor.extract_fields(raw_text)
        logger.info("✓ Gemini extraction complete")
        
        # Step 3: HS classification
        logger.info("Step 3/4: Classifying HS code...")
        extracted_data = hs_classifier.classify(extracted_data)
        logger.info("✓ HS classification complete (source: %s)", extracted_data.get("hs_source"))
        
        # Step 4: Compliance check
        logger.info("Step 4/4: Running compliance checks...")
        compliance_result = compliance.check(extracted_data)
        errors = compliance_result.get("errors", [])
        warnings = compliance_result.get("warnings", [])
        score = compliance_result.get("score", 0)
        logger.info("✓ Compliance check complete (score: %d, errors: %d, warnings: %d)", 
                   score, len(errors), len(warnings))
        
        logger.info("✅ Pipeline complete — processing succeeded")
        
        return {
            "status": "success",
            "data": compliance_result.get("data"),
            "errors": errors,
            "warnings": warnings,
            "score": score,
            "message": f"Document processed successfully (compliance score: {score})",
        }
    
    except FileNotFoundError as exc:
        logger.error("❌ File not found: %s", exc)
        return {
            "status": "error",
            "data": None,
            "errors": [{"code": "FILE_NOT_FOUND", "message": str(exc)}],
            "warnings": [],
            "score": None,
            "message": str(exc),
        }
    
    except ValueError as exc:
        logger.error("❌ Unsupported file type: %s", exc)
        return {
            "status": "error",
            "data": None,
            "errors": [{"code": "UNSUPPORTED_FILE_TYPE", "message": str(exc)}],
            "warnings": [],
            "score": None,
            "message": str(exc),
        }
    
    except Exception as exc:
        logger.error("❌ Pipeline failed: %s", exc, exc_info=True)
        return {
            "status": "error",
            "data": None,
            "errors": [{"code": "PIPELINE_ERROR", "message": str(exc)}],
            "warnings": [],
            "score": None,
            "message": f"Pipeline error: {exc}",
        }


def demo_pipeline() -> None:
    """
    Demo function for local testing.
    Pass a document file path as an argument to test the pipeline.
    
    Usage:
        python -c "from main import demo_pipeline; demo_pipeline('path/to/document.pdf')"
    """
    import sys
    
    if len(sys.argv) < 2:
        print("❌ Usage: python main.py <path_to_document>")
        print("   Supported: PDF, PNG, JPG, BMP, TIFF, WEBP")
        sys.exit(1)
    
    file_path = sys.argv[1]
    result = process_document(file_path)
    
    print("\n" + "=" * 80)
    print("PIPELINE RESULT")
    print("=" * 80)
    print(json.dumps(result, indent=2, default=str))
    print("=" * 80 + "\n")
    
    if result["status"] == "success":
        print(f"✅ Success! Compliance Score: {result['score']}")
    else:
        print(f"❌ Failed: {result['message']}")


if __name__ == "__main__":
    demo_pipeline()
