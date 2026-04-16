"""
gemini_extractor.py — Step 2 of the AI pipeline
Sends raw OCR text to Google Gemini and returns structured customs data as a dict.
Uses the new google-genai library (successor to google-generativeai).
"""

import json
import logging
import os
import re
from typing import Any

import google.genai as genai

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Gemini client — configured once at import time
# ---------------------------------------------------------------------------

_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# New google-genai doesn't need configure() — just pass API key to Client()

_model = "gemini-2.0-flash"  # Latest available model in google-genai

# ---------------------------------------------------------------------------
# Prompt template
# ---------------------------------------------------------------------------

_EXTRACTION_PROMPT = """\
You are a customs document parser.
Given the raw text extracted from a customs/shipping document, extract the following fields and return ONLY valid JSON — no markdown, no explanation.

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

Return only the JSON object. No markdown fences.
"""

# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def extract_fields(raw_text: str) -> dict[str, Any]:
    """
    Use Gemini to extract structured fields from raw OCR text.

    Args:
        raw_text: The full text output from the OCR step.

    Returns:
        A dict with the extracted customs fields (values may be None).

    Raises:
        RuntimeError: If the Gemini API call fails or returns unparseable output.
    """
    if not raw_text.strip():
        logger.warning("extract_fields called with empty text — returning empty extraction.")
        return _empty_extraction()

    prompt = _EXTRACTION_PROMPT.format(raw_text=raw_text[:12_000])  # token safety cap

    try:
        # Use the new google-genai API
        client = genai.Client(api_key=_GEMINI_API_KEY) if _GEMINI_API_KEY else genai.Client()
        response = client.models.generate_content(
            model=_model,
            contents=prompt,
            config={
                "temperature": 0.1,        # low randomness — deterministic extraction
                "max_output_tokens": 1024,
            },
        )
        raw_output = response.text.strip()
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise RuntimeError(f"Gemini extraction failed: {exc}") from exc

    return _parse_json_response(raw_output)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_json_response(raw_output: str) -> dict[str, Any]:
    """
    Safely parse Gemini's response.
    Strips markdown fences if the model adds them despite instructions.
    """
    # Strip ```json ... ``` fences defensively
    cleaned = re.sub(r"^```(?:json)?\s*", "", raw_output, flags=re.MULTILINE)
    cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini JSON. Raw output:\n%s", raw_output[:500])
        raise RuntimeError(
            f"Gemini returned non-JSON output: {exc}"
        ) from exc

    # Ensure all expected keys are present (fill missing with None)
    for key in _empty_extraction():
        data.setdefault(key, None)

    return data


def _empty_extraction() -> dict[str, Any]:
    """Return a fully-keyed dict with all None values — the safe fallback."""
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