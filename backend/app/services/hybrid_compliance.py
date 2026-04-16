"""
hybrid_compliance.py — Hybrid intelligence layer for customs compliance.
Combines deterministic rule checks with OpenAI semantic reasoning.

Architecture:
  Layer 1 (Rules)  → SOURCE OF TRUTH.  Decides pass/fail.
  Layer 2 (LLM)    → ADVISOR ONLY.     Explains, enriches, suggests.

The LLM NEVER overrides rule decisions.  It only adds:
  - reason:     WHY this issue matters
  - suggestion: HOW to fix it
  - confidence: 0.0–1.0  (LLM's self-assessed certainty)
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


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def hybrid_compliance_check(extracted_data: dict[str, Any]) -> dict[str, Any]:
    """
    Run compliance using hybrid intelligence:
      1) Deterministic rule engine  (authority)
      2) LLM semantic reasoning     (advisor)

    Returns the rule-engine report enriched with LLM fields.
    """
    rule_report = compliance.check(extracted_data)

    all_issues = rule_report.get("errors", []) + rule_report.get("warnings", [])

    llm_result = _llm_consolidated_analysis(
        extracted_data=rule_report.get("data", {}),
        issues=all_issues,
    )

    # Merge per-issue enrichments back onto rule issues
    enriched_errors = _merge_enrichments(
        rule_report.get("errors", []),
        llm_result.get("enriched_issues", []),
    )
    enriched_warnings = _merge_enrichments(
        rule_report.get("warnings", []),
        llm_result.get("enriched_issues", []),
    )

    score = rule_report.get("score", 0)
    risk_level = _calculate_risk_level(score)

    return {
        "data": rule_report.get("data", {}),
        "errors": enriched_errors,
        "warnings": enriched_warnings,
        "score": score,
        "riskLevel": risk_level,
        "llmReasoning": llm_result.get("reasoning"),
        "llmOverallAssessment": llm_result.get("assessment"),
        "llmRisks": llm_result.get("risks", []),
        "llmRecommendations": llm_result.get("recommendations", []),
    }


# ---------------------------------------------------------------------------
# Risk level calculation
# ---------------------------------------------------------------------------

def _calculate_risk_level(score: int) -> str:
    """Deterministic risk classification based on compliance score."""
    if score < 40:
        return "High"
    elif score < 75:
        return "Medium"
    return "Low"


# ---------------------------------------------------------------------------
# LLM consolidated analysis (single call for cost efficiency)
# ---------------------------------------------------------------------------

def _llm_consolidated_analysis(
    extracted_data: dict[str, Any],
    issues: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Single LLM call that returns:
      - Overall assessment + reasoning
      - Per-issue enrichments (reason, suggestion, confidence)
      - Semantic risks and recommendations

    Falls back safely if the API key is missing or request fails.
    """
    fallback = {
        "assessment": "unavailable",
        "reasoning": "LLM reasoning unavailable; rule-based compliance still applied.",
        "risks": [],
        "recommendations": [],
        "enriched_issues": [],
    }

    if not _OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set — skipping hybrid LLM reasoning.")
        return fallback

    if not issues:
        # No issues to enrich — still get overall assessment
        pass

    extracted_json = json.dumps(extracted_data, ensure_ascii=True, default=str)
    issues_json = json.dumps(issues, ensure_ascii=True, default=str)

    prompt = f"""You are a senior customs compliance analyst.

Analyze this customs document extraction and its rule-engine findings.

Extracted Data:
{extracted_json[:_MAX_EXTRACTED_DATA_CHARS]}

Rule Findings (errors + warnings):
{issues_json[:_MAX_ISSUES_CHARS]}

TASKS:
1. Overall Assessment: "compliant", "review_required", or "non_compliant".
2. Reasoning: A 2-3 sentence summary of the document's compliance posture.
3. Per-Issue Enrichment: For EACH issue in Rule Findings, provide:
   - code: the exact issue code from the input
   - field: the exact field name from the input
   - reason: WHY this issue matters for customs compliance (1-2 sentences)
   - suggestion: HOW to fix this issue (1-2 sentences, actionable)
   - confidence: your confidence in the assessment (0.0 to 1.0)
4. Semantic Risks: 1-3 risks that rules might miss (broader compliance concerns).
5. Recommendations: 1-3 actionable recommendations.

Return ONLY valid JSON in this exact schema:
{{
  "assessment": "compliant" | "review_required" | "non_compliant",
  "reasoning": "...",
  "enriched_issues": [
    {{
      "code": "EXACT_CODE_FROM_INPUT",
      "field": "exact_field",
      "reason": "why this matters",
      "suggestion": "how to fix it",
      "confidence": 0.92
    }}
  ],
  "risks": ["risk 1", "risk 2"],
  "recommendations": ["action 1", "action 2"]
}}"""

    try:
        client = OpenAI(api_key=_OPENAI_API_KEY, timeout=30.0)
        response = client.chat.completions.create(
            model=_OPENAI_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional customs auditor. "
                        "Always output strictly valid JSON. "
                        "Never invent issues that aren't in the input."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=1500,
        )
        raw_output = response.choices[0].message.content or "{}"
        parsed = json.loads(raw_output)

        # Validate assessment
        assessment = str(parsed.get("assessment", "")).strip().lower()
        if assessment not in {"compliant", "review_required", "non_compliant"}:
            assessment = "review_required"

        reasoning = str(
            parsed.get("reasoning") or "No LLM reasoning returned."
        ).strip()
        risks = _coerce_string_list(parsed.get("risks"))
        recommendations = _coerce_string_list(parsed.get("recommendations"))
        enriched_issues = parsed.get("enriched_issues", [])
        if not isinstance(enriched_issues, list):
            enriched_issues = []

        return {
            "assessment": assessment,
            "reasoning": reasoning,
            "risks": risks,
            "recommendations": recommendations,
            "enriched_issues": enriched_issues,
        }
    except Exception as exc:
        logger.error("Hybrid LLM analysis failed: %s", exc)
        return fallback


# ---------------------------------------------------------------------------
# Merge LLM enrichments onto rule issues
# ---------------------------------------------------------------------------

def _merge_enrichments(
    rule_issues: list[dict[str, Any]],
    llm_enrichments: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Merge LLM-provided reason/suggestion/confidence onto rule issues.

    Matching is done by (code, field) pair.
    Rules are authoritative — LLM can only ADD explanation fields,
    never add/remove/change the issue itself.
    """
    # Build lookup: (code, field) -> enrichment
    enrichment_map: dict[tuple[str, str], dict] = {}
    for item in llm_enrichments:
        key = (
            str(item.get("code", "")).strip(),
            str(item.get("field", "")).strip(),
        )
        if key[0]:  # Must have a code
            enrichment_map[key] = item

    enriched: list[dict[str, Any]] = []
    for issue in rule_issues:
        merged = dict(issue)  # shallow copy
        key = (
            str(issue.get("code", "")).strip(),
            str(issue.get("field", "")).strip(),
        )
        llm_data = enrichment_map.get(key, {})

        # Only add LLM fields — never overwrite rule fields
        if llm_data.get("reason"):
            merged["reason"] = str(llm_data["reason"]).strip()
        if llm_data.get("suggestion"):
            merged["suggestion"] = str(llm_data["suggestion"]).strip()
        if llm_data.get("confidence") is not None:
            try:
                conf = float(llm_data["confidence"])
                merged["confidence"] = round(max(0.0, min(1.0, conf)), 2)
            except (TypeError, ValueError):
                pass

        enriched.append(merged)

    return enriched


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _coerce_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]
