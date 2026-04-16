from __future__ import annotations

from app.services import hybrid_compliance


def _valid_extracted_data() -> dict:
    return {
        "exporter_name": "ABC Exports",
        "importer_name": "XYZ Imports",
        "invoice_number": "INV-2026-001",
        "invoice_date": "2026-04-10",
        "currency": "USD",
        "total_value": 1500.00,
        "country_of_origin": "India",
        "country_of_destination": "UAE",
        "goods_description": "Electronic components",
        "hs_code": "853400",
        "hs_source": "extracted",
    }


def _missing_fields_data() -> dict:
    """Data with missing required fields to trigger errors."""
    return {
        "exporter_name": "ABC Exports",
        "importer_name": "XYZ Imports",
        "invoice_number": "INV-2026-002",
        "invoice_date": "2026-04-10",
        "currency": "USD",
        "total_value": 500.00,
        # Missing: country_of_origin, country_of_destination,
        #          goods_description, hs_code
    }


# ---------------------------------------------------------------------------
# Fallback (no API key)
# ---------------------------------------------------------------------------

def test_hybrid_compliance_fallback_when_api_key_missing(monkeypatch):
    monkeypatch.setattr(hybrid_compliance, "_OPENAI_API_KEY", "")

    result = hybrid_compliance.hybrid_compliance_check(_valid_extracted_data())

    assert "data" in result
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result
    assert "riskLevel" in result
    assert result["llmOverallAssessment"] == "unavailable"
    assert isinstance(result["llmReasoning"], str)
    assert isinstance(result["llmRisks"], list)
    assert isinstance(result["llmRecommendations"], list)


# ---------------------------------------------------------------------------
# LLM merge behavior
# ---------------------------------------------------------------------------

def test_hybrid_compliance_merges_rule_and_llm_outputs(monkeypatch):
    fake_llm = {
        "assessment": "review_required",
        "reasoning": "Document is mostly compliant but consignee address should be validated.",
        "risks": ["Address ambiguity may delay customs clearance."],
        "recommendations": ["Confirm consignee address against bill of lading."],
        "enriched_issues": [],
    }

    monkeypatch.setattr(
        hybrid_compliance,
        "_llm_consolidated_analysis",
        lambda **_: fake_llm,
    )

    result = hybrid_compliance.hybrid_compliance_check(_valid_extracted_data())

    assert result["llmOverallAssessment"] == "review_required"
    assert result["llmReasoning"].startswith("Document is mostly compliant")
    assert len(result["llmRisks"]) == 1
    assert len(result["llmRecommendations"]) == 1
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result


# ---------------------------------------------------------------------------
# Per-issue enrichment merge
# ---------------------------------------------------------------------------

def test_enrichment_merges_reason_suggestion_confidence(monkeypatch):
    """LLM enrichments are merged onto rule issues by (code, field) key."""
    monkeypatch.setattr(hybrid_compliance, "_OPENAI_API_KEY", "")

    # Run with missing fields to get errors
    result = hybrid_compliance.hybrid_compliance_check(_missing_fields_data())
    errors = result["errors"]

    # Should have errors for missing required fields
    assert len(errors) > 0

    # Now test the merge logic directly
    rule_issues = [
        {"code": "MISSING_REQUIRED_FIELD", "field": "hs_code", "message": "Required field 'hs_code' is missing.", "severity": "error"},
        {"code": "MISSING_REQUIRED_FIELD", "field": "country_of_origin", "message": "Required field 'country_of_origin' is missing.", "severity": "error"},
    ]
    llm_enrichments = [
        {"code": "MISSING_REQUIRED_FIELD", "field": "hs_code", "reason": "HS code is mandatory for customs classification", "suggestion": "Add the 6-digit HS code", "confidence": 0.95},
        {"code": "MISSING_REQUIRED_FIELD", "field": "country_of_origin", "reason": "Origin country determines duty rates", "suggestion": "Specify ISO country code", "confidence": 0.88},
    ]
    enriched = hybrid_compliance._merge_enrichments(rule_issues, llm_enrichments)

    assert len(enriched) == 2
    assert enriched[0]["reason"] == "HS code is mandatory for customs classification"
    assert enriched[0]["suggestion"] == "Add the 6-digit HS code"
    assert enriched[0]["confidence"] == 0.95
    assert enriched[1]["reason"] == "Origin country determines duty rates"
    assert enriched[1]["confidence"] == 0.88
    # Original fields preserved
    assert enriched[0]["code"] == "MISSING_REQUIRED_FIELD"
    assert enriched[0]["severity"] == "error"


def test_enrichment_ignores_extra_llm_issues():
    """LLM returning issues not in rules should be safely ignored."""
    rule_issues = [
        {"code": "MISSING_REQUIRED_FIELD", "field": "hs_code", "message": "Missing", "severity": "error"},
    ]
    llm_enrichments = [
        {"code": "MISSING_REQUIRED_FIELD", "field": "hs_code", "reason": "Important", "suggestion": "Add it", "confidence": 0.9},
        {"code": "FAKE_ISSUE", "field": "fake_field", "reason": "Hallucinated", "suggestion": "Ignore", "confidence": 0.5},
    ]
    enriched = hybrid_compliance._merge_enrichments(rule_issues, llm_enrichments)

    # Only the real rule issue should be returned
    assert len(enriched) == 1
    assert enriched[0]["code"] == "MISSING_REQUIRED_FIELD"
    assert enriched[0]["reason"] == "Important"


def test_enrichment_handles_missing_llm_data():
    """If LLM returns no enrichment for an issue, original issue is preserved."""
    rule_issues = [
        {"code": "INVALID_CURRENCY", "field": "currency", "message": "Bad currency", "severity": "error"},
    ]
    enriched = hybrid_compliance._merge_enrichments(rule_issues, [])

    assert len(enriched) == 1
    assert enriched[0]["code"] == "INVALID_CURRENCY"
    assert "reason" not in enriched[0]
    assert "confidence" not in enriched[0]


# ---------------------------------------------------------------------------
# Risk level calculation
# ---------------------------------------------------------------------------

def test_risk_level_high():
    assert hybrid_compliance._calculate_risk_level(0) == "High"
    assert hybrid_compliance._calculate_risk_level(39) == "High"


def test_risk_level_medium():
    assert hybrid_compliance._calculate_risk_level(40) == "Medium"
    assert hybrid_compliance._calculate_risk_level(74) == "Medium"


def test_risk_level_low():
    assert hybrid_compliance._calculate_risk_level(75) == "Low"
    assert hybrid_compliance._calculate_risk_level(100) == "Low"


# ---------------------------------------------------------------------------
# Confidence clamping
# ---------------------------------------------------------------------------

def test_confidence_clamped_to_0_1():
    """Confidence values outside 0-1 range should be clamped."""
    rule_issues = [
        {"code": "TEST", "field": "test", "message": "Test", "severity": "error"},
    ]
    llm_enrichments = [
        {"code": "TEST", "field": "test", "confidence": 1.5},
    ]
    enriched = hybrid_compliance._merge_enrichments(rule_issues, llm_enrichments)
    assert enriched[0]["confidence"] == 1.0

    llm_enrichments[0]["confidence"] = -0.5
    enriched = hybrid_compliance._merge_enrichments(rule_issues, llm_enrichments)
    assert enriched[0]["confidence"] == 0.0


# ---------------------------------------------------------------------------
# Integration: full report structure
# ---------------------------------------------------------------------------

def test_full_report_structure(monkeypatch):
    """Verify the full hybrid report has all required keys."""
    monkeypatch.setattr(hybrid_compliance, "_OPENAI_API_KEY", "")

    result = hybrid_compliance.hybrid_compliance_check(_valid_extracted_data())

    # Core keys
    assert "data" in result
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result
    assert "riskLevel" in result

    # LLM keys (fallback values when no API key)
    assert "llmReasoning" in result
    assert "llmOverallAssessment" in result
    assert "llmRisks" in result
    assert "llmRecommendations" in result

    # Score should be valid for healthy data
    assert 0 <= result["score"] <= 100
    assert result["riskLevel"] in {"High", "Medium", "Low"}
