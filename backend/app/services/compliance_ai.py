"""
compliance_ai.py — The Intelligent Reasoning Layer
Uses OpenAI to explain WHY compliance issues matter and suggest fixes.
"""

import json
import logging
import os
from typing import Any
from openai import OpenAI

logger = logging.getLogger(__name__)

_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

def analyze(extracted_data: dict[str, Any], rule_issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Enriches rule-based issues with AI reasoning (Impact and Suggestion).
    """
    if not _OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set — skipping AI reasoning enrichment.")
        return rule_issues

    if not rule_issues:
        return []

    prompt = f"""
    You are a professional customs compliance officer.
    I have extracted data from a shipping document and ran it through a rule-based engine.
    The engine found the following issues.
    
    Extracted Data:
    {json.dumps(extracted_data, indent=2)}
    
    Found Issues:
    {json.dumps(rule_issues, indent=2)}
    
    For EACH issue, provide:
    1. A brief "impact" (why this matters for customs clearance or legal compliance).
    2. A practical "suggestion" (how to fix it or what the likely missing value is).
    
    Return the result as a JSON array of objects, keeping the original 'code', 'field', 'message', and 'severity', but adding 'impact' and 'suggestion'.
    
    Example response:
    [
      {{
        "code": "MISSING_HS_CODE",
        "field": "hs_code",
        "message": "HS code is missing",
        "severity": "error",
        "impact": "Required for tax calculation and security screening.",
        "suggestion": "Likely HS Code 8471 based on description 'Laptop'."
      }}
    ]
    """

    try:
        client = OpenAI(api_key=_OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {{"role": "system", "content": "You are an expert customs compliance advisor. Always output valid JSON."}},
                {{"role": "user", "content": prompt}}
            ],
            response_format={{"type": "json_object"}},
            temperature=0.2
        )
        
        raw_output = response.choices[0].message.content or "{}"
        data = json.loads(raw_output)
        
        # Expecting either {"issues": [...]} or just the array directly
        enriched = data.get("issues") if isinstance(data, dict) and "issues" in data else data
        
        if not isinstance(enriched, list):
            logger.error("AI returned unexpected format: %s", raw_output)
            return rule_issues
            
        return enriched

    except Exception as exc:
        logger.error("AI Compliance Analysis failed: %s", exc)
        return rule_issues # Graceful fallback to rule-based only
