"""
compliance_ai.py — DEPRECATED: Use hybrid_compliance.py instead.

This module previously contained a standalone LLM analysis function.
All LLM reasoning is now consolidated inside hybrid_compliance.py
to ensure a single, efficient LLM call per document.

This thin wrapper exists only for backward compatibility.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


def analyze(
    extracted_data: dict[str, Any],
    rule_issues: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    DEPRECATED — hybrid_compliance.py now handles all LLM reasoning.

    Returns a pass-through so callers don't break.
    """
    logger.warning(
        "compliance_ai.analyze() is deprecated. "
        "Use hybrid_compliance.hybrid_compliance_check() instead."
    )
    return {
        "enriched_issues": rule_issues,
        "assessment": "unavailable",
        "reasoning": "Redirected to hybrid_compliance module.",
    }
