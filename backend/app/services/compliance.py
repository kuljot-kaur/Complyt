"""
compliance.py — Step 4 of the AI pipeline
Rule-based compliance checks on extracted customs data.

Returns a structured report:
  {
    "data": { ...extracted fields... },
    "errors": [ {"code": str, "field": str, "message": str, "severity": str}, ... ],
    "warnings": [ ... ],
    "score": int   # 0-100, higher is better
  }
"""

import logging
from datetime import datetime, date
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Accepted / known values
# ---------------------------------------------------------------------------

_VALID_INCOTERMS = {
    "EXW", "FCA", "FAS", "FOB", "CFR", "CIF",
    "CPT", "CIP", "DAP", "DPU", "DDP",
}

_VALID_CURRENCIES = {
    "USD", "EUR", "GBP", "JPY", "CNY", "AUD", "CAD", "CHF",
    "HKD", "SGD", "INR", "MYR", "THB", "IDR", "VND", "PHP",
    "AED", "SAR", "ZAR", "BRL", "MXN",
}

# Fields that MUST be present for a document to be compliant
_REQUIRED_FIELDS = [
    "exporter_name",
    "importer_name",
    "invoice_number",
    "invoice_date",
    "currency",
    "total_value",
    "country_of_origin",
    "country_of_destination",
    "goods_description",
    "hs_code",
]

# Fields that are strongly recommended (warnings, not errors)
_RECOMMENDED_FIELDS = [
    "exporter_address",
    "importer_address",
    "incoterms",
    "net_weight_kg",
    "gross_weight_kg",
    "quantity",
    "unit_of_measure",
    "port_of_loading",
    "port_of_discharge",
]

# Weight of each required field in the compliance score
_FIELD_WEIGHT = 100 / len(_REQUIRED_FIELDS)

# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def check(extracted_data: dict[str, Any]) -> dict[str, Any]:
    """
    Run all compliance rules against the extracted data.

    Args:
        extracted_data: Dict returned by hs_classifier.classify().

    Returns:
        {
            "data": <the original extracted_data>,
            "errors": [...],
            "warnings": [...],
            "score": int (0–100)
        }
    """
    errors: list[dict] = []
    warnings: list[dict] = []

    _check_required_fields(extracted_data, errors)
    _check_recommended_fields(extracted_data, warnings)
    _check_value_integrity(extracted_data, errors, warnings)
    _check_currency(extracted_data, errors)
    _check_hs_code(extracted_data, errors, warnings)
    _check_incoterms(extracted_data, warnings)
    _check_date_format(extracted_data, warnings)
    _check_weight_logic(extracted_data, warnings)

    score = _calculate_score(extracted_data, errors)

    logger.info(
        "Compliance check complete — score: %d, errors: %d, warnings: %d",
        score, len(errors), len(warnings),
    )

    return {
        "data": extracted_data,
        "errors": errors,
        "warnings": warnings,
        "score": score,
    }


# ---------------------------------------------------------------------------
# Rule implementations
# ---------------------------------------------------------------------------

def _check_required_fields(data: dict, errors: list) -> None:
    """RULE: All required fields must be non-null and non-empty."""
    for field in _REQUIRED_FIELDS:
        val = data.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            errors.append(_error(
                code="MISSING_REQUIRED_FIELD",
                field=field,
                message=f"Required field '{field}' is missing.",
                severity="error",
            ))


def _check_recommended_fields(data: dict, warnings: list) -> None:
    """RULE: Recommended fields should be present (soft warning)."""
    for field in _RECOMMENDED_FIELDS:
        val = data.get(field)
        if val is None or (isinstance(val, str) and not val.strip()):
            warnings.append(_error(
                code="MISSING_RECOMMENDED_FIELD",
                field=field,
                message=f"Recommended field '{field}' is absent.",
                severity="warning",
            ))


def _check_value_integrity(data: dict, errors: list, warnings: list) -> None:
    """RULE: total_value must be a positive number."""
    total = data.get("total_value")
    if total is not None:
        try:
            fval = float(total)
            if fval <= 0:
                errors.append(_error(
                    code="INVALID_VALUE",
                    field="total_value",
                    message=f"total_value must be > 0, got {fval}.",
                    severity="error",
                ))
        except (TypeError, ValueError):
            errors.append(_error(
                code="INVALID_VALUE",
                field="total_value",
                message=f"total_value is not a valid number: {total!r}.",
                severity="error",
            ))


def _check_currency(data: dict, errors: list) -> None:
    """RULE: currency must be a known ISO 4217 code."""
    currency = data.get("currency")
    if currency is not None:
        if str(currency).upper() not in _VALID_CURRENCIES:
            errors.append(_error(
                code="INVALID_CURRENCY",
                field="currency",
                message=(
                    f"Currency '{currency}' is not a recognised ISO 4217 code. "
                    f"Expected one of: {', '.join(sorted(_VALID_CURRENCIES)[:8])}…"
                ),
                severity="error",
            ))
        else:
            # Normalise to uppercase
            data["currency"] = str(currency).upper()


def _check_hs_code(data: dict, errors: list, warnings: list) -> None:
    """
    RULE: hs_code must be present.
    If it came from prediction (hs_source == 'predicted'), add a warning.
    If it's unknown, add an error.
    """
    hs_code = data.get("hs_code")
    hs_source = data.get("hs_source", "extracted")

    if hs_code is None:
        errors.append(_error(
            code="MISSING_HS_CODE",
            field="hs_code",
            message="HS code is missing and could not be predicted.",
            severity="error",
        ))
    elif hs_source == "predicted":
        warnings.append(_error(
            code="HS_CODE_PREDICTED",
            field="hs_code",
            message=(
                f"HS code '{hs_code}' was predicted by AI — not found in the document. "
                "Please verify before submission."
            ),
            severity="warning",
        ))
    elif len(str(hs_code)) < 6:
        errors.append(_error(
            code="INVALID_HS_CODE",
            field="hs_code",
            message=f"HS code '{hs_code}' is too short (minimum 6 digits).",
            severity="error",
        ))


def _check_incoterms(data: dict, warnings: list) -> None:
    """RULE: incoterms should be a recognised term."""
    incoterm = data.get("incoterms")
    if incoterm is not None:
        if str(incoterm).upper() not in _VALID_INCOTERMS:
            warnings.append(_error(
                code="UNRECOGNISED_INCOTERM",
                field="incoterms",
                message=(
                    f"Incoterm '{incoterm}' is not in the standard list. "
                    f"Valid: {', '.join(sorted(_VALID_INCOTERMS))}."
                ),
                severity="warning",
            ))


def _check_date_format(data: dict, warnings: list) -> None:
    """RULE: invoice_date should be parseable and not in the future."""
    raw_date = data.get("invoice_date")
    if raw_date is None:
        return
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            parsed = datetime.strptime(str(raw_date), fmt).date()
            if parsed > date.today():
                warnings.append(_error(
                    code="FUTURE_INVOICE_DATE",
                    field="invoice_date",
                    message=f"Invoice date '{raw_date}' is in the future.",
                    severity="warning",
                ))
            # Normalise to ISO format
            data["invoice_date"] = parsed.isoformat()
            return
        except ValueError:
            continue
    warnings.append(_error(
        code="UNPARSEABLE_DATE",
        field="invoice_date",
        message=f"Could not parse invoice_date: '{raw_date}'.",
        severity="warning",
    ))


def _check_weight_logic(data: dict, warnings: list) -> None:
    """RULE: gross_weight must be >= net_weight."""
    net = data.get("net_weight_kg")
    gross = data.get("gross_weight_kg")
    if net is not None and gross is not None:
        try:
            if float(gross) < float(net):
                warnings.append(_error(
                    code="WEIGHT_MISMATCH",
                    field="gross_weight_kg",
                    message=(
                        f"gross_weight_kg ({gross}) is less than net_weight_kg ({net}). "
                        "This is physically impossible."
                    ),
                    severity="warning",
                ))
        except (TypeError, ValueError):
            pass


# ---------------------------------------------------------------------------
# Score calculation
# ---------------------------------------------------------------------------

def _calculate_score(data: dict, errors: list) -> int:
    """
    Score based on required fields present and error-free.
    Each required field is worth an equal share of 100 points.
    Deduct points for each error on a required field.
    """
    error_fields = {e["field"] for e in errors if e["severity"] == "error"}
    present_required = sum(
        1 for f in _REQUIRED_FIELDS
        if data.get(f) not in (None, "")
        and f not in error_fields
    )
    score = int((present_required / len(_REQUIRED_FIELDS)) * 100)
    return max(0, min(100, score))


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _error(code: str, field: str, message: str, severity: str) -> dict:
    return {"code": code, "field": field, "message": message, "severity": severity}