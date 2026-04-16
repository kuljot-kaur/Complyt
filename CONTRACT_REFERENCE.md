# INTEGRATION CONTRACT REFERENCE - MAIN.PY

## THE FIXED FUNCTION (main.py - Lines 20-179)

```python
def process_document(file_path: str) -> dict[str, Any]:
    """
    End-to-end document processing pipeline.
    
    This function is the INTEGRATION POINT between Person A (you) and Person B.
    
    Person B: NEVER modify this function signature!
    PERSON A: This signature is LOCKED after April 16, 2026.
    """
    file_path = Path(file_path)
    
    # ALWAYS return this structure:
    if file_path.exists() == False:
        return {
            "status": "error",
            "data": None,
            "errors": [{"code": "FILE_NOT_FOUND", "message": f"File not found: {file_path}"}],
            "warnings": [],
            "score": None,
            "message": f"File not found: {file_path}",
        }
    
    # ... processing ...
    
    # ALWAYS return this structure on success:
    return {
        "status": "success",
        "data": compliance_result.get("data"),
        "errors": errors,
        "warnings": warnings,
        "score": score,
        "message": f"Document processed successfully (compliance score: {score})",
    }
    
    # ALWAYS return this structure on error:
    return {
        "status": "error",
        "data": None,
        "errors": [{"code": "...", "message": str(exc)}],
        "warnings": [],
        "score": None,
        "message": str(exc),
    }
```

---

## HOW PERSON B WILL CALL IT (Example)

```python
# In tasks.py (Celery worker)
from app.main import process_document
from app.services import encryption, db

@celery_app.task
def process_document_task(file_path: str):
    # PERSON A's PIPELINE
    result = process_document(file_path)  # ← THE CONTRACT
    
    # Always has these keys:
    assert "status" in result
    assert "data" in result
    assert "errors" in result
    assert "warnings" in result
    assert "score" in result
    assert "message" in result
    
    # Handle based on status
    if result["status"] == "error":
        logger.error(f"Pipeline failed: {result['message']}")
        return result
    
    # Success: Extract and store
    extracted_data = result["data"]  # Dict with 19 fields
    compliance_score = result["score"]  # 0-100
    errors = result["errors"]  # List of error dicts
    warnings = result["warnings"]  # List of warning dicts
    
    # Mask PII
    masked_data = encryption.mask_sensitive_fields(extracted_data)
    
    # Store in DB
    doc = db.Document.create(
        extracted_data=masked_data,
        compliance_score=compliance_score,
        errors_count=len(errors),
        warnings_count=len(warnings),
    )
    
    # Return same format or custom response
    return {
        "status": "success",
        "document_id": doc.id,
        "score": compliance_score,
        "errors": errors,
        "warnings": warnings,
    }
```

---

## EVERY PATH RETURNS THE CONTRACT

```
Person A writes process_document()
    ↓
Error while checking file exists
    ↓ Returns: {"status": "error", "data": None, ...}
    ↓
OCR fails
    ↓ Returns: {"status": "error", "data": None, ...}
    ↓
Gemini API fails
    ↓ Returns: {"status": "error", "data": None, ...}
    ↓
Success!
    ↓ Returns: {"status": "success", "data": {...}, ...}
```

**Every code path** returns the same structure. Person B always knows what to expect.

---

## PERSON B UNIT TEST EXAMPLE

```python
import pytest
from app.main import process_document

def test_contract_structure():
    """Verify the integration contract is maintained."""
    
    # Load a test file
    result = process_document("sample_invoice.txt")
    
    # ASSERT STRUCTURE
    assert isinstance(result, dict)
    assert "status" in result
    assert result["status"] in ["success", "error"]
    assert "data" in result
    assert "errors" in result
    assert isinstance(result["errors"], list)
    assert "warnings" in result
    assert isinstance(result["warnings"], list)
    assert "score" in result
    assert "message" in result
    
    # If success, verify data structure
    if result["status"] == "success":
        assert result["data"] is not None
        assert isinstance(result["data"], dict)
        assert "exporter_name" in result["data"]
        assert "hs_code" in result["data"]
        assert "total_value" in result["data"]
        assert result["score"] is not None
        assert 0 <= result["score"] <= 100

def test_error_handling():
    """Verify errors follow contract."""
    
    result = process_document("/nonexistent/file.pdf")
    
    assert result["status"] == "error"
    assert result["data"] is None
    assert len(result["errors"]) > 0
    assert result["errors"][0]["code"] in [
        "FILE_NOT_FOUND",
        "UNSUPPORTED_FILE_TYPE",
        "PIPELINE_ERROR"
    ]
```

---

## THE PROMISE

```
PERSON A GUARANTEES:
✅ process_document(file_path: str) → always returns dict
✅ Return dict has EXACTLY these keys: status, data, errors, warnings, score, message
✅ "errors" is always a list of {"code": str, "field": str, "message": str, "severity": str}
✅ "warnings" is always a list of the same structure
✅ "score" is always int or None
✅ "data" is either None (error) or dict with 19 fields
✅ No breaking changes to this contract

PERSON B CAN RELY ON:
✅ Consistent structure for all responses
✅ Predictable error codes
✅ Stable scoring algorithm
✅ Fixed field names
✅ Business logic locked and tested
```

---

## QUICK REFERENCE TABLE

| Situation | status | data | score | errors | message |
|-----------|--------|------|-------|--------|---------|
| Success | "success" | dict (19 fields) | 0-100 | [] | Summary |
| File not found | "error" | None | None | [FILE_NOT_FOUND] | Details |
| Invalid file type | "error" | None | None | [UNSUPPORTED] | Details |
| OCR failure | "error" | None | None | [PIPELINE_ERROR] | Details |
| Gemini API failure | "error" | None | None | [PIPELINE_ERROR] | Details |
| Missing required fields | "success" | dict | 0-50 | [list] | Score + errors |
| All fields present | "success" | dict | 100 | [] | Success message |

---

**This contract was finalized on April 16, 2026 by Person A**  
**Status: IMMUTABLE until project completion**
