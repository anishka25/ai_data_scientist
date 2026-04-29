import os
from fpdf import FPDF

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))

class PDF(FPDF):
    def header(self):
        self.set_font("Arial", "B", 16)
        self.cell(0, 10, "Q1 2025 Financial & Operations Report", ln=True, align="C")
        self.ln(5)
    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def generate():
    pdf = PDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, (
        "Executive Summary\n\n"
        "Q1 2025 has shown remarkable resilience across all business units. "
        "Total revenue reached $42.8M, representing a 12.4% YoY increase. "
        "The Alpha Processor line continues to dominate North American markets, "
        "while APAC shows the fastest growth trajectory at 18.2%.\n\n"
        "Key Financial Metrics\n"
        "- Gross Margin: 47.2%\n"
        "- Operating Margin: 22.8%\n"
        "- EBITDA: $9.4M\n"
        "- R&D Expenditure: $4.1M (9.6% of revenue)\n\n"
        "Operational Highlights\n"
        "Warehouse WHA underwent a full automation retrofit in February, "
        "reducing picking errors by 34%. However, WHC is operating at 94% capacity, "
        "triggering a capital expansion request of $2.3M for Q2.\n\n"
        "Risk Factors\n"
        "Supply chain volatility in the Beta Module semiconductor market has "
        "increased lead times by 14 days on average. A dual-sourcing strategy "
        "is under negotiation with suppliers in Vietnam and Germany.\n\n"
        "Strategic Initiatives\n"
        "1. Launch Gamma Core v3 by end of Q2.\n"
        "2. Expand EMEA sales headcount by 15.\n"
        "3. Implement AI-driven demand forecasting (pilot results: 11% accuracy improvement).\n"
    ))

    pdf.add_page()
    pdf.set_font("Arial", size=11)
    pdf.cell(0, 10, "Monthly Revenue Breakdown (in thousands USD)", ln=True)
    pdf.ln(2)
    data = [("January", 13_420), ("February", 14_105), ("March", 15_275)]
    for month, rev in data:
        pdf.cell(60, 10, month, border=1)
        pdf.cell(60, 10, f"${rev:,}", border=1, align="R")
        pdf.ln()

    pdf.ln(5)
    pdf.cell(0, 10, "Forecast vs Actual - Inventory Turnover", ln=True)
    turnover = [("Alpha Processor", 8.2, 7.9), ("Beta Module", 5.4, 5.1), ("Gamma Core", 6.1, 6.3)]
    pdf.set_fill_color(230, 230, 230)
    pdf.cell(60, 10, "Product", border=1, fill=True)
    pdf.cell(40, 10, "Forecast", border=1, fill=True, align="C")
    pdf.cell(40, 10, "Actual", border=1, fill=True, align="C")
    pdf.ln()
    for prod, f, a in turnover:
        pdf.cell(60, 10, prod, border=1)
        pdf.cell(40, 10, str(f), border=1, align="C")
        pdf.cell(40, 10, str(a), border=1, align="C")
        pdf.ln()

    out_path = os.path.join(DATA_DIR, "sample_report.pdf")
    pdf.output(out_path)
    print(f"Generated {out_path}")

if __name__ == "__main__":
    generate()
