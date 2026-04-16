import logging
import os
import base64
from pathlib import Path
from typing import Union
from openai import OpenAI
from PIL import Image

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OpenAI OCR Utility
# ---------------------------------------------------------------------------

_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
_model = "gpt-4o"

def _encode_image(image_path: Path) -> str:
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def extract_text(file_path: Union[str, Path]) -> str:
    """
    Extract text using OpenAI GPT-4o (Vision) multimodal capability.
    """
    file_path = Path(file_path)
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = file_path.suffix.lower()
    
    try:
        client = OpenAI(api_key=_OPENAI_API_KEY, timeout=25.0)
        
        if ext == ".pdf":
            return _ocr_pdf_via_openai(client, file_path)
        
        # Standard image handling
        base64_image = _encode_image(file_path)
        response = client.chat.completions.create(
            model=_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract all text from this document as raw text lines. Maintain the visual order."},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                        },
                    ],
                }
            ],
        )
        return response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("OpenAI OCR failed for %s: %s", file_path.name, exc)
        raise RuntimeError(f"OCR Pipeline Error: {exc}")

def _ocr_pdf_via_openai(client: OpenAI, pdf_path: Path) -> str:
    """Convert PDF to images and process each via OpenAI."""
    from pdf2image import convert_from_path
    import tempfile
    
    pages = convert_from_path(str(pdf_path), dpi=200)
    all_text = []
    
    for i, page_image in enumerate(pages, start=1):
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            page_image.save(tmp.name, "JPEG")
            base64_image = _encode_image(Path(tmp.name))
            os.unlink(tmp.name)
            
        response = client.chat.completions.create(
            model=_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Extract text from page {i} of this document:"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                        },
                    ],
                }
            ],
        )
        all_text.append(f"--- Page {i} ---\n{response.choices[0].message.content}")
        
    return "\n\n".join(all_text)