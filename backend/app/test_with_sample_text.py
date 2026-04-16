"""
test_with_sample_text.py — Test the pipeline without needing an actual image/PDF

This script reads the sample_invoice.txt and runs it through:
  Gemini extraction → HS classification → Compliance check

Skips OCR since we already have raw text.
"""

import sys
import json
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# CRITICAL: Load config and .env FIRST before importing services
import config
config.setup_logging()

# Now import services (after .env is loaded)
from services import gemini_extractor, hs_classifier, compliance

def test_pipeline_with_sample_text(sample_file: str) -> None:
    """Run pipeline with sample raw text (no OCR needed)."""
    
    sample_path = Path(sample_file)
    if not sample_path.exists():
        print(f"❌ Sample file not found: {sample_file}")
        sys.exit(1)
    
    print(f"\n{'='*80}")
    print(f"Testing AI Pipeline with Sample Text: {sample_path.name}")
    print(f"{'='*80}\n")
    
    # Read the sample text
    print(">>> Reading sample invoice text...")
    raw_text = sample_path.read_text()
    print(f"OK Read {len(raw_text)} characters\n")
    
    try:
        # Step 1: Gemini extraction
        print("Step 1/3: Extracting fields via Gemini...")
        extracted_data = gemini_extractor.extract_fields(raw_text)
        print("OK Gemini extraction complete\n")
        
        # Step 2: HS classification
        print("Step 2/3: Classifying HS code...")
        extracted_data = hs_classifier.classify(extracted_data)
        print(f"OK HS classification complete (source: {extracted_data.get('hs_source')})\n")
        
        # Step 3: Compliance check
        print("Step 3/3: Running compliance checks...")
        compliance_result = compliance.check(extracted_data)
        errors = compliance_result.get("errors", [])
        warnings = compliance_result.get("warnings", [])
        score = compliance_result.get("score", 0)
        print(f"OK Compliance check complete\n")
        
        # Display results
        print(f"{'='*80}")
        print("PIPELINE RESULT")
        print(f"{'='*80}\n")
        
        result = {
            "status": "success",
            "score": score,
            "errors": errors,
            "warnings": warnings,
            "data": compliance_result.get("data"),
        }
        
        print(json.dumps(result, indent=2, default=str))
        
        print(f"\n{'='*80}")
        print(f"[SUCCESS]")
        print(f"   Compliance Score: {score}/100")
        print(f"   Errors: {len(errors)}")
        print(f"   Warnings: {len(warnings)}")
        print(f"{'='*80}\n")
        
        # Show extracted data highlights
        print("[EXTRACTED DATA HIGHLIGHTS]")
        print(f"   Exporter: {extracted_data.get('exporter_name')}")
        print(f"   Importer: {extracted_data.get('importer_name')}")
        print(f"   Invoice: {extracted_data.get('invoice_number')}")
        print(f"   HS Code: {extracted_data.get('hs_code')} (source: {extracted_data.get('hs_source')})")
        print(f"   Total Value: {extracted_data.get('total_value')} {extracted_data.get('currency')}")
        print(f"   Goods: {extracted_data.get('goods_description')}\n")
        
        if errors:
            print("[ERRORS]")
            for err in errors:
                print(f"   - {err['field']}: {err['message']}")
            print()
        
        if warnings:
            print("[WARNINGS]")
            for warn in warnings:
                print(f"   - {warn['field']}: {warn['message']}")
            print()
    
    except Exception as exc:
        print(f"[FAILED] Pipeline failed: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    sample_file = Path(__file__).parent / "sample_invoice.txt"
    test_pipeline_with_sample_text(str(sample_file))
