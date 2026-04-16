"""
openai_extractor.py — Step 2 of the AI pipeline
Sends raw OCR text to OpenAI GPT-4o and returns structured customs data as a dict.
Uses OpenAI's native JSON mode for high reliability.
"""

import json
import logging
import os
import re
from typing import Any

from openai import OpenAI

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# OpenAI client — configured once at import time
# ---------------------------------------------------------------------------

_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
_model = "gpt-4o"

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_EXTRACTION_PROMPT = """\
You are a customs document parser.
Given the raw text extracted from a customs/shipping document, extract the following fields and return as a JSON object.

Required fields (use null if not found):
{{
  "exporter_name": string | null,
  "exporter_address": string | null,
  "importer_name": string | null,
  "importer_address": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,          // ISO format YYYY-MM-DD when possible
  "currency": string | null,              // ISO 4217 code, e.g. "USD"
  "total_value": number | null,
  "incoterms": string | null,             // e.g. "FOB", "CIF"
  "country_of_origin": string | null,
  "country_of_destination": string | null,
  "port_of_loading": string | null,
  "port_of_discharge": string | null,
  "goods_description": string | null,
  "hs_code": string | null,               // Harmonised System code, digits only
  "net_weight_kg": number | null,
  "gross_weight_kg": number | null,
  "quantity": number | null,
  "unit_of_measure": string | null
}}

Raw document text:
---
{raw_text}
---
"""

# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def extract_fields(raw_text: str) -> dict[str, Any]:
    """
    Use OpenAI to extract structured fields from raw OCR text.
    """
    if not raw_text.strip():
        logger.warning("extract_fields called with empty text — returning empty extraction.")
        return _empty_extraction()

    prompt = _EXTRACTION_PROMPT.format(raw_text=raw_text[:12_000])

    try:
        client = OpenAI(api_key=_OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=_model,
            messages=[
                {"role": "system", "content": "You are a professional customs data extraction engine. Always output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1024
        )
        raw_output = response.choices[0].message.content or "{}"
        return _parse_json_response(raw_output)
    except Exception as exc:
        logger.error("OpenAI API call failed: %s", exc)
        raise RuntimeError(f"OpenAI extraction failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_json_response(raw_output: str) -> dict[str, Any]:
    """Safely parse OpenAI's JSON response."""
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse OpenAI JSON: %s", raw_output[:500])
        raise RuntimeError(f"OpenAI returned non-JSON: {exc}") from exc

    # Fill missing keys with None
    for key in _empty_extraction():
        data.setdefault(key, None)
    return data


def _empty_extraction() -> dict[str, Any]:
    return {
        "exporter_name": None,
        "exporter_address": None,
        "importer_name": None,
        "importer_address": None,
        "invoice_number": None,
        "invoice_date": None,
        "currency": None,
        "total_value": None,
        "incoterms": None,
        "country_of_origin": None,
        "country_of_destination": None,
        "port_of_loading": None,
        "port_of_discharge": None,
        "goods_description": None,
        "hs_code": None,
        "net_weight_kg": None,
        "gross_weight_kg": None,
        "quantity": None,
        "unit_of_measure": None,
    }
