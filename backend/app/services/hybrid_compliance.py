"""
hybrid_compliance.py — Hybrid intelligence layer for customs compliance.
Combines deterministic rule checks with OpenAI semantic reasoning.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from openai import OpenAI

try:
    from app.services import compliance
except ModuleNotFoundError as exc:
    if exc.name != "app":
        raise
    from services import compliance

logger = logging.getLogger(__name__)

_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
_OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
_MAX_EXTRACTED_DATA_CHARS = 12_000
_MAX_ISSUES_CHARS = 8_000


def hybrid_compliance_check(extracted_data: dict[str, Any]) -> dict[str, Any]:
    """
    Run compliance using hybrid intelligence:
      1) Deterministic rule engine
      2) LLM semantic reasoning

    Returns the rule-engine report plus LLM reasoning fields.
    """
    rule_report = compliance.check(extracted_data)
    llm_result = _llm_reasoning_openai(
        extracted_data=rule_report.get("data", {}),
        errors=rule_report.get("errors", []),
        warnings=rule_report.get("warnings", []),
    )

    return {
        "data": rule_report.get("data", {}),
        "errors": rule_report.get("errors", []),
        "warnings": rule_report.get("warnings", []),
        "score": rule_report.get("score", 0),
        "llm_reasoning": llm_result.get("llm_reasoning"),
        "llm_overall_assessment": llm_result.get("llm_overall_assessment"),
        "llm_risks": llm_result.get("llm_risks", []),
        "llm_recommendations": llm_result.get("llm_recommendations", []),
    }


def _llm_reasoning_openai(
    extracted_data: dict[str, Any],
    errors: list[dict[str, Any]],
    warnings: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Ask OpenAI for semantic compliance reasoning.
    Falls back safely if the API key is missing or request fails.
    """
    fallback = {
        "llm_reasoning": "LLM reasoning unavailable; rule-based compliance still applied.",
        "llm_overall_assessment": "unavailable",
        "llm_risks": [],
        "llm_recommendations": [],
    }

    if not _OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set — skipping hybrid LLM reasoning.")
        return fallback

    extracted_json = json.dumps(extracted_data, ensure_ascii=True, default=str)
    issues_json = json.dumps(
        {"errors": errors, "warnings": warnings},
        ensure_ascii=True,
        default=str,
    )

    prompt = f"""
You are a senior customs compliance analyst.

Analyze this customs document extraction and rule-engine findings.
Determine whether the document appears customs compliant overall,
and explain semantic risks beyond deterministic checks.

Extracted Data:
{extracted_json[:_MAX_EXTRACTED_DATA_CHARS]}

Rule Findings:
{issues_json[:_MAX_ISSUES_CHARS]}

Return ONLY valid JSON in this schema:
{{
  "overall_assessment": "compliant" | "review_required" | "non_compliant",
  "reasoning_summary": "short paragraph",
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["action 1", "action 2"]
}}
"""

    try:
        client = OpenAI(api_key=_OPENAI_API_KEY)
        response = client.chat.completions.create(
            model=_OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You evaluate customs compliance. Always return strict JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=700,
        )
        raw_output = response.choices[0].message.content or "{}"
        parsed = json.loads(raw_output)

        assessment = str(parsed.get("overall_assessment", "")).strip().lower()
        if assessment not in {"compliant", "review_required", "non_compliant"}:
            assessment = "review_required"

        reasoning = str(parsed.get("reasoning_summary") or "No LLM reasoning returned.").strip()
        risks = _coerce_string_list(parsed.get("risks"))
        recommendations = _coerce_string_list(parsed.get("recommendations"))

        return {
            "llm_reasoning": reasoning,
            "llm_overall_assessment": assessment,
            "llm_risks": risks,
            "llm_recommendations": recommendations,
        }
    except Exception as exc:
        logger.error("Hybrid LLM reasoning failed: %s", exc)
        return fallback


def _coerce_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
