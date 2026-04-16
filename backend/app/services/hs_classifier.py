"""
hs_classifier.py — Step 3 of the AI pipeline
Validates or predicts the HS (Harmonised System) code for a shipment.

Strategy:
  1. If a numeric HS code was already extracted → validate its format.
  2. If missing or invalid → ask OpenAI to predict one from the goods description.
"""

import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)

_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
_model = "gpt-4o"

# ---------------------------------------------------------------------------
# HS code format rules
# ---------------------------------------------------------------------------
# Valid formats: 6-digit (XXXX.XX), 8-digit (XXXX.XX.XX), 10-digit
# We normalise to digits-only for internal storage.

_HS_PATTERN = re.compile(r"^\d{6,10}$")


def classify(extracted_data: dict[str, Any]) -> dict[str, Any]:
    """
    Ensure `hs_code` in extracted_data is valid; predict it via OpenAI if not.

    Args:
        extracted_data: The dict returned by gemini_extractor.extract_fields().

    Returns:
        The same dict, with `hs_code` updated and a new key `hs_source` added:
          "extracted"  — code came from the document and is valid
          "predicted"  — code was absent/invalid; OpenAI predicted it
          "unknown"    — prediction also failed
    """
    raw_code = extracted_data.get("hs_code")
    normalised = _normalise(raw_code)

    if normalised and _HS_PATTERN.match(normalised):
        logger.info("HS code from document: %s", normalised)
        extracted_data["hs_code"] = normalised
        extracted_data["hs_source"] = "extracted"
        return extracted_data

    # Code is missing or badly formatted — try to predict
    logger.info("HS code missing or invalid (%r) — attempting OpenAI prediction.", raw_code)
    predicted = _predict_hs_code(extracted_data)

    if predicted:
        extracted_data["hs_code"] = predicted
        extracted_data["hs_source"] = "predicted"
    else:
        extracted_data["hs_code"] = None
        extracted_data["hs_source"] = "unknown"

    return extracted_data


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise(raw: Any) -> str:
    """Strip dots, spaces, dashes — keep only digits."""
    if raw is None:
        return ""
    return re.sub(r"[^\d]", "", str(raw))


def _predict_hs_code(data: dict[str, Any]) -> str | None:
    """
    Ask OpenAI to predict a 6-digit HS code based on available shipment context.
    Returns a digits-only string, or None if prediction fails.
    """
    context_parts = []
    if data.get("goods_description"):
        context_parts.append(f"Goods description: {data['goods_description']}")
    if data.get("country_of_origin"):
        context_parts.append(f"Country of origin: {data['country_of_origin']}")
    if data.get("exporter_name"):
        context_parts.append(f"Exporter: {data['exporter_name']}")

    if not context_parts:
        logger.warning("No context available for HS code prediction.")
        return None

    context = "\n".join(context_parts)
    prompt = (
        f"Based on the following shipment details, provide the most likely 6-digit "
        f"HS (Harmonised System) code. Return ONLY the 6 digits — no text, no dots.\n\n"
        f"{context}"
    )

    try:
        from openai import OpenAI
        client = OpenAI(api_key=_OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=_model,
            messages=[
                {"role": "system", "content": "You are a customs classification expert. Return only the numeric HS code."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=10
        )
        prediction = _normalise(response.choices[0].message.content or "")
        if len(prediction) >= 6:
            result = prediction[:6]          # take first 6 digits
            logger.info("OpenAI predicted HS code: %s", result)
            return result
        logger.warning("OpenAI HS prediction too short: %r", prediction)
        return None
    except Exception as exc:
        logger.error("OpenAI HS prediction failed: %s", exc)
        return None