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


def test_hybrid_compliance_fallback_when_api_key_missing(monkeypatch):
    monkeypatch.setattr(hybrid_compliance, "_OPENAI_API_KEY", "")

    result = hybrid_compliance.hybrid_compliance_check(_valid_extracted_data())

    assert "data" in result
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result
    assert result["llm_overall_assessment"] == "unavailable"
    assert isinstance(result["llm_reasoning"], str)
    assert isinstance(result["llm_risks"], list)
    assert isinstance(result["llm_recommendations"], list)


def test_hybrid_compliance_merges_rule_and_llm_outputs(monkeypatch):
    fake_llm = {
        "llm_reasoning": "Document is mostly compliant but consignee address should be validated.",
        "llm_overall_assessment": "review_required",
        "llm_risks": ["Address ambiguity may delay customs clearance."],
        "llm_recommendations": ["Confirm consignee address against bill of lading."],
    }

    monkeypatch.setattr(hybrid_compliance, "_llm_reasoning_openai", lambda **_: fake_llm)

    result = hybrid_compliance.hybrid_compliance_check(_valid_extracted_data())

    assert result["llm_overall_assessment"] == "review_required"
    assert result["llm_reasoning"].startswith("Document is mostly compliant")
    assert len(result["llm_risks"]) == 1
    assert len(result["llm_recommendations"]) == 1
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result
