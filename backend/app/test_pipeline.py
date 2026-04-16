"""
test_pipeline.py — Quick test of the Person A AI pipeline

This script reads a sample customs document and runs it through the full pipeline.
Use this to verify everything is working before Person B integrates it with FastAPI.
"""

import sys
import json
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from main import process_document

def test_pipeline(document_path: str) -> None:
    """Run a test on a document."""
    print(f"\n{'='*80}")
    print(f"Testing AI Pipeline with: {document_path}")
    print(f"{'='*80}\n")
    
    result = process_document(document_path)
    
    # Pretty print the result
    print(json.dumps(result, indent=2, default=str))
    
    print(f"\n{'='*80}")
    if result["status"] == "success":
        print(f"✅ SUCCESS")
        print(f"   Compliance Score: {result['score']}/100")
        print(f"   Errors: {len(result['errors'])}")
        print(f"   Warnings: {len(result['warnings'])}")
    else:
        print(f"❌ FAILED: {result['message']}")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_pipeline.py <document_path>")
        print("Example: python test_pipeline.py /path/to/invoice.pdf")
        sys.exit(1)
    
    test_pipeline(sys.argv[1])
