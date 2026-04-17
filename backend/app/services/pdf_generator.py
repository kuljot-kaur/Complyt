from fpdf import FPDF
from datetime import datetime
from typing import Any

class ComplianceReportPDF(FPDF):
    def header(self):
        # Header with Logo/Text
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(40, 70, 160) # Sleek blue
        self.cell(0, 10, "COMPLYT AI - Audit Report", ln=True, align="C")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=True, align="C")
        self.ln(10)

    def footer(self):
        # Footer with page number
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(169, 169, 169)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def add_watermark(self):
        self.set_font("Helvetica", "B", 60)
        self.set_text_color(240, 240, 240)
        # Rotate and place watermark
        with self.rotation(45, x=105, y=155):
            self.text(40, 155, "COMPLYT AI")

def _safe_text(text: str) -> str:
    """Replaces common non-Latin1 characters that crash FPDF's default font."""
    if not text: return ""
    text = str(text)
    replacements = {
        "’": "'", "‘": "'",
        "“": '"', "”": '"',
        "–": "-", "—": "-",
        "…": "...", "•": "-"
    }
    for search, replace in replacements.items():
        text = text.replace(search, replace)
    return text.encode('latin-1', 'replace').decode('latin-1')

def generate_compliance_pdf(document_name: str, result_payload: dict[str, Any]) -> bytes:
    pdf = ComplianceReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.add_watermark()
    
    # Summary Section
    pdf.set_font("Helvetica", "B", 14)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, f"Document: {_safe_text(document_name)}", ln=True)
    
    score = result_payload.get("score", 0)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(50, 10, "Compliance Score:", ln=0)
    
    # Color coding score
    if score >= 80: pdf.set_text_color(0, 128, 0)
    elif score >= 50: pdf.set_text_color(255, 165, 0)
    else: pdf.set_text_color(200, 0, 0)
    
    pdf.cell(0, 10, f"{score}/100", ln=True)
    pdf.set_text_color(0, 0, 0)
    pdf.ln(5)

    # Extracted Data Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(240, 242, 245)
    pdf.cell(0, 10, "Extracted Data Details", ln=True, fill=True)
    pdf.ln(2)
    
    data = result_payload.get("data", {})
    if not data: # Compatibility check
        data = result_payload.get("extractedData", {})

    for key, value in data.items():
        if key.startswith("__"): continue # Internal fields
        # Lock in current Y
        start_y = pdf.get_y()
        
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_xy(10, start_y)
        pdf.cell(60, 8, f"{key.replace('_', ' ').title()}:", border=0)
        
        pdf.set_font("Helvetica", "", 10)
        remaining_width = pdf.epw - 60
        pdf.set_xy(10 + 60, start_y)
        pdf.multi_cell(remaining_width, 8, _safe_text(str(value)) if value else "N/A", border=0)
        
        # In FPDF2, multi_cell leaves cursor at the right margin sometimes. Reset X.
        pdf.set_x(10)
    
    pdf.ln(10)

    # Issues Section (Errors & Warnings)
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_fill_color(255, 235, 235)
    pdf.cell(0, 10, "Identified Compliance Issues", ln=True, fill=True)
    pdf.ln(2)

    errors = result_payload.get("errors", [])
    warnings = result_payload.get("warnings", [])

    if not errors and not warnings:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(0, 128, 0)
        pdf.cell(pdf.epw, 10, "No issues detected. Document is compliant.", ln=True)
    else:
        for idx, err in enumerate(errors + warnings):
            severity = err.get("severity", "error").upper()
            is_error = severity == "ERROR"
            
            # Label
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(200, 0, 0) if is_error else pdf.set_text_color(180, 100, 0)
            pdf.multi_cell(pdf.epw, 8, f"{severity}: {err.get('code')} - {_safe_text(err.get('message'))}")
            pdf.set_x(10)
            
            # Impact & Suggestion (AI Insights)
            if err.get("impact") or err.get("suggestion"):
                pdf.set_font("Helvetica", "I", 9)
                pdf.set_text_color(100, 100, 100)
                if err.get("impact"):
                    pdf.multi_cell(pdf.epw, 6, f"  > Impact: {_safe_text(err['impact'])}")
                    pdf.set_x(10)
                if err.get("suggestion"):
                    pdf.set_text_color(0, 100, 100) # Subtle teal
                    pdf.multi_cell(pdf.epw, 6, f"  > AI Suggestion: {_safe_text(err['suggestion'])}")
                    pdf.set_x(10)
            
            pdf.ln(2)

    return pdf.output()
