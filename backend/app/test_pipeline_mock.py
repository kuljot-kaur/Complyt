"""
test_pipeline_mock.py — Full pipeline test with MOCK data (no API calls)

This demonstrates the complete end-to-end pipeline:
  Mock OCR → Mock Gemini → HS Classification → Compliance Check

Use this to verify the compliance engine and architecture work correctly.
When you upgrade your Gemini API key/library, switch to test_with_sample_text.py
"""

import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Import config first to load .env
import config
config.setup_logging()

# Import only the non-Gemini services
from services import hs_classifier, compliance

def test_pipeline_mock() -> None:
    """Run complete pipeline with mock extracted data."""
    
    print("\n" + "="*80)
    print("MOCK PIPELINE TEST - Full Flow with Mock Data")
    print("="*80 + "\n")
    
    # STEP 1: Mock OCR extraction (simulating what OCR would extract)
    print("Step 1/4: OCR Extraction (MOCK)")
    raw_text = """
    COMMERCIAL INVOICE
    Invoice No: INV-2024-001567
    Invoice Date: 2024-03-15
    ...typical OCR output...
    """
    print(f"[OK] Simulated OCR: {len(raw_text)} chars\n")
    
    # STEP 2: Mock Gemini extraction (simulating AI field extraction)
    print("Step 2/4: Gemini Field Extraction (MOCK)")
    extracted_data = {
        "exporter_name": "ABC Manufacturing Co., Ltd.",
        "exporter_address": "123 Industrial Park, Shanghai, China 201234",
        "importer_name": "Global Imports Inc.",
        "importer_address": "456 Commerce Street, New York, NY 10001, USA",
        "invoice_number": "INV-2024-001567",
        "invoice_date": "2024-03-15",
        "currency": "USD",
        "total_value": 5250.00,
        "incoterms": "FOB",
        "country_of_origin": "China",
        "country_of_destination": "United States",
        "port_of_loading": "Shanghai",
        "port_of_discharge": "Newark",
        "goods_description": "Electronic Components - Computer Circuit Boards",
        "hs_code": "853400",
        "net_weight_kg": 125.5,
        "gross_weight_kg": 150.0,
        "quantity": 500,
        "unit_of_measure": "PCS"
    }
    print("[OK] Extracted 19 fields\n")
    
    try:
        # STEP 3: HS Classification (REAL - validates/predicts HS codes)
        print("Step 3/4: HS Code Classification (REAL)")
        extracted_data = hs_classifier.classify(extracted_data)
        hs_source = extracted_data.get("hs_source", "unknown")
        print(f"[OK] HS Code: {extracted_data.get('hs_code')} (source: {hs_source})\n")
        
        # STEP 4: Compliance Engine (REAL - validates all rules)
        print("Step 4/4: Compliance Checks (REAL)")
        compliance_result = compliance.check(extracted_data)
        errors = compliance_result.get("errors", [])
        warnings = compliance_result.get("warnings", [])
        score = compliance_result.get("score", 0)
        print(f"[OK] Compliance engine complete\n")
        
        # RESULTS
        print("="*80)
        print("[RESULTS]")
        print("="*80 + "\n")
        
        result = {
            "status": "success",
            "pipeline": "MOCK OCR + MOCK Gemini + REAL HS Classification + REAL Compliance",
            "score": score,
            "errors": errors,
            "warnings": warnings,
            "extracted_data": extracted_data,
        }
        
        print(json.dumps(result, indent=2, default=str))
        
        print(f"\n{'='*80}")
        print(f"[SUCCESS] Pipeline executed end-to-end!")
        print(f"   Compliance Score: {score}/100")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        print(f"{'='*80}\n")
        
        # Show data highlights
        print("[DATA EXTRACTED]")
        print(f"   Exporter: {extracted_data.get('exporter_name')}")
        print(f"   Importer: {extracted_data.get('importer_name')}")
        print(f"   Invoice: {extracted_data.get('invoice_number')}")
        print(f"   HS Code: {extracted_data.get('hs_code')} (source: {hs_source})")
        print(f"   Value: {extracted_data.get('total_value')} {extracted_data.get('currency')}")
        print(f"   Goods: {extracted_data.get('goods_description')}\n")
        
        if errors:
            print("[ERRORS - Document fails compliance]")
            for err in errors:
                print(f"   [{err['code']}] {err['field']}: {err['message']}")
            print()
        
        if warnings:
            print("[WARNINGS - Review recommended]")
            for warn in warnings:
                print(f"   [{warn['code']}] {warn['field']}: {warn['message']}")
            print()
        
        if not errors and not warnings:
            print("[CHECK] Document passes all compliance checks!\n")
    
    except Exception as exc:
        print(f"[FAILED] Pipeline error: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    test_pipeline_mock()
