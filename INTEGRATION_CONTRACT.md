# 🔗 INTEGRATION CONTRACT - PERSON A ↔ PERSON B

## THE ONE FUNCTION THAT MATTERS

```python
def process_document(file_path: str) -> dict:
    """
    Person A's complete AI pipeline.
    
    Location: app/main.py
    Args:
        file_path: Absolute path to document (PDF or image)
    
    Returns ALWAYS:
    {
        "status": "success" | "error",
        "data": {
            "exporter_name": str | None,
            "exporter_address": str | None,
            "importer_name": str | None,
            "importer_address": str | None,
            "invoice_number": str | None,
            "invoice_date": str | None,           # ISO format: YYYY-MM-DD
            "currency": str | None,               # ISO 4217 code: USD, EUR, etc.
            "total_value": float | None,
            "incoterms": str | None,              # FOB, CIF, etc.
            "country_of_origin": str | None,
            "country_of_destination": str | None,
            "port_of_loading": str | None,
            "port_of_discharge": str | None,
            "goods_description": str | None,
            "hs_code": str | None,                # 6-10 digits
            "hs_source": "extracted" | "predicted" | "unknown",
            "net_weight_kg": float | None,
            "gross_weight_kg": float | None,
            "quantity": float | None,
            "unit_of_measure": str | None,
        },
        "errors": [
            {
                "code": "MISSING_REQUIRED_FIELD" | "INVALID_VALUE" | ... (see below),
                "field": "field_name",
                "message": "Human readable message",
                "severity": "error"
            },
            ...
        ],
        "warnings": [
            {
                "code": "MISSING_RECOMMENDED_FIELD" | "HS_CODE_PREDICTED" | ... (see below),
                "field": "field_name",
                "message": "Human readable message",
                "severity": "warning"
            },
            ...
        ],
        "score": int,  # 0-100, higher is better
        "message": str | None,  # Summary message on failure
    }
```

---

## POSSIBLE ERROR CODES (severity: "error")

|Code|Field|Meaning|
|----|-----|-------|
|`MISSING_REQUIRED_FIELD`|various|A required field is missing or empty|
|`INVALID_VALUE`|total_value|Value is not a positive number|
|`INVALID_CURRENCY`|currency|Not a recognized ISO 4217 code|
|`MISSING_HS_CODE`|hs_code|HS code is missing (critical)|
|`INVALID_HS_CODE`|hs_code|HS code is invalid format|

---

## POSSIBLE WARNING CODES (severity: "warning")

|Code|Field|Meaning|
|----|-----|-------|
|`MISSING_RECOMMENDED_FIELD`|various|A recommended field is missing|
|`HS_CODE_PREDICTED`|hs_code|AI had to predict the HS code (verify it!)|
|`UNRECOGNISED_INCOTERM`|incoterms|Incoterm not in standard list|
|`FUTURE_INVOICE_DATE`|invoice_date|Date is in the future|
|`UNPARSEABLE_DATE`|invoice_date|Date format is unclear|
|`WEIGHT_MISMATCH`|gross_weight_kg|Gross < Net (physically impossible)|

---

## HOW PERSON B USES THIS

### In tasks.py (Celery task):
```python
from app.main import process_document
from app.services import encryption

@celery_app.task
def process_document_task(file_path: str):
    # Step 1: Run Person A's pipeline
    result = process_document(file_path)
    
    if result["status"] == "error":
        # Handle failure
        return result
    
    # Step 2: Extract data
    extracted_data = result["data"]
    
    # Step 3: Encrypt PII
    encrypted = encryption.mask_pii(extracted_data)
    
    # Step 4: Store in DB
    db_record = db.create_document_record(
        extracted_data=encrypted,
        compliance_score=result["score"],
        errors=result["errors"],
        warnings=result["warnings"]
    )
    
    # Step 5: Return to API
    return {
        "status": result["status"],
        "document_id": db_record.id,
        "score": result["score"],
        "errors": result["errors"],
        "warnings": result["warnings"],
    }
```

### In upload.py (FastAPI endpoint):
```python
from celery import Celery
from .workers.tasks import process_document_task

@router.post("/upload")
async def upload_document(file: UploadFile):
    # Save file
    file_path = f"/tmp/{file.filename}"
    
    # Queue task
    task = process_document_task.delay(file_path)
    
    # Return task ID
    return {"task_id": task.id}
```

---

## SCORING RULES (Person A)

```
Score = (required_fields_met / 10) × 100

Each required field:
- exporter_name
- importer_name
- invoice_number
- invoice_date
- currency
- total_value
- country_of_origin
- country_of_destination
- goods_description
- hs_code

Score ranges:
  100 = Perfect (all required + no errors)
   90+ = Excellent (missing 1 optional field)
   75+ = Good (missing 1-2 recommended)
   50+ = Fair (some warnings)
    0  = Failed (missing required fields or critical errors)
```

---

## PROMISE: THIS CONTRACT NEVER CHANGES

✅ `process_document()` signature is FIXED
✅ Return dict format is LOCKED
✅ Field names won't change
✅ Error/warning codes are stable
✅ Score calculation is sealed

**Person B can build with confidence** 🎯

---

## TESTING THE CONTRACT

```bash
# Mock test (no API calls, works offline)
python test_pipeline_mock.py

# Real test (with Gemini API)
python test_with_sample_text.py
```

Both return the same contract dict format! ✓

---

**Made: April 16, 2026 | Person A**
