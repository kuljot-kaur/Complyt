"""
ocr.py — Step 1 of the AI pipeline
Extracts raw text from uploaded documents using PaddleOCR.
Supports images (PNG, JPG) and PDFs (page-by-page via pdf2image).
"""

import logging
from pathlib import Path
from typing import Union

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# PaddleOCR is a heavy import — lazy-load so tests can mock it easily
# ---------------------------------------------------------------------------
_ocr_engine = None


def _get_engine():
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from paddleocr import PaddleOCR  # type: ignore
            _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
        except ImportError as exc:
            raise RuntimeError(
                "PaddleOCR is not installed. Run: pip install paddleocr paddlepaddle"
            ) from exc
    return _ocr_engine


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def extract_text(file_path: Union[str, Path]) -> str:
    """
    Extract all text from a document file.

    Args:
        file_path: Absolute path to an image or PDF file.

    Returns:
        A single string of all extracted text, lines joined by newline.

    Raises:
        ValueError: If the file extension is unsupported.
        RuntimeError: If OCR fails or the file cannot be read.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = file_path.suffix.lower()
    if ext in {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"}:
        return _ocr_image(file_path)
    elif ext == ".pdf":
        return _ocr_pdf(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: images and PDF.")


def _ocr_image(image_path: Path) -> str:
    """Run PaddleOCR on a single image file."""
    try:
        engine = _get_engine()
        results = engine.ocr(str(image_path), cls=True)

        if not results or not results[0]:
            logger.warning("PaddleOCR returned no results for %s", image_path.name)
            return ""

        lines = []
        for line in results[0]:
            # Each result: [[bbox], [text, confidence]]
            text, confidence = line[1]
            if confidence >= 0.5:          # drop very low-confidence tokens
                lines.append(text.strip())

        extracted = "\n".join(lines)
        logger.info(
            "OCR complete: %s — %d lines, %d chars",
            image_path.name, len(lines), len(extracted),
        )
        return extracted

    except Exception as exc:
        logger.error("OCR failed for %s: %s", image_path.name, exc)
        raise RuntimeError(f"OCR failed: {exc}") from exc


def _ocr_pdf(pdf_path: Path) -> str:
    """
    Convert each PDF page to an image, then run OCR per page.
    Requires: pip install pdf2image  +  poppler-utils (system package)
    """
    try:
        from pdf2image import convert_from_path  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "pdf2image is not installed. Run: pip install pdf2image"
        ) from exc

    try:
        pages = convert_from_path(str(pdf_path), dpi=200)
    except Exception as exc:
        raise RuntimeError(f"Could not convert PDF to images: {exc}") from exc

    all_text_parts = []
    for i, page_image in enumerate(pages, start=1):
        import tempfile, os
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            page_image.save(tmp.name, "PNG")
            tmp_path = tmp.name
        try:
            page_text = _ocr_image(Path(tmp_path))
            all_text_parts.append(f"--- Page {i} ---\n{page_text}")
        finally:
            os.unlink(tmp_path)

    return "\n\n".join(all_text_parts)