"""
pipeline.py — Integration point between Person A and Person B.

Person B's tasks.py calls `run_pipeline(file_path)` and gets back the
compliance report dict. That's the entire handoff.

Usage (from tasks.py):
    from app.services.pipeline import run_pipeline
    result = run_pipeline("/path/to/uploaded/file.pdf")
"""

import logging
from pathlib import Path
from typing import Any

from app.services import ocr, openai_extractor, hs_classifier, compliance

logger = logging.getLogger(__name__)


def run_pipeline(file_path: str | Path) -> dict[str, Any]:
    """
    Execute the full AI processing pipeline on one document.

    Steps:
        1. OCR          — extract raw text
        2. Gemini       — parse text into structured fields
        3. HS classifier — validate / predict HS code
        4. Compliance   — run rule-based checks and compute score

    Args:
        file_path: Absolute path to the uploaded document file.

    Returns:
        {
            "data": { ...all extracted fields + hs_source... },
            "errors": [ {code, field, message, severity}, ... ],
            "warnings": [ ... ],
            "score": int  # 0-100
        }

    Raises:
        FileNotFoundError: If the file doesn't exist.
        RuntimeError: If OCR or Gemini fails unrecoverably.
    """
    file_path = Path(file_path)
    logger.info("Pipeline started for: %s", file_path.name)

    # ── Step 1: OCR ──────────────────────────────────────────────────────────
    raw_text = ocr.extract_text(file_path)
    logger.info("OCR complete — %d characters extracted.", len(raw_text))

    # ── Step 2: OpenAI extraction ─────────────────────────────────────────────
    extracted = openai_extractor.extract_fields(raw_text)
    logger.info("OpenAI extraction complete — %d fields.", len(extracted))

    # ── Step 3: HS classification ─────────────────────────────────────────────
    classified = hs_classifier.classify(extracted)
    logger.info("HS classification complete — source: %s.", classified.get("hs_source"))

    # ── Step 4: Compliance engine ─────────────────────────────────────────────
    report = compliance.check(classified)
    logger.info(
        "Compliance check complete — score: %d, errors: %d.",
        report["score"], len(report["errors"]),
    )

    return report