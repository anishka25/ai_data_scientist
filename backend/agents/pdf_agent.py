import os
import base64
import fitz
from openai import OpenAI
from agents.prompts import PDF_ANALYST_PROMPT

client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY", ""),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "workspace"))
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

async def analyze_pdf_document(pdf_path: str, query: str, session_id: str):
    abs_path = os.path.abspath(pdf_path)
    allowed_roots = [WORKSPACE_ROOT, DATA_DIR]
    if not any(abs_path.startswith(r) for r in allowed_roots):
        return {"error": "Access denied: PDF path outside allowed directories."}
    if not os.path.exists(abs_path):
        return {"error": f"PDF not found at {abs_path}"}

    doc = fitz.open(abs_path)
    total = len(doc)
    chunk_size = 50
    overlap = 5
    step = chunk_size - overlap
    summaries = []

    for start in range(0, total, step):
        end = min(start + chunk_size, total)
        images = []
        for i in range(start, end):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=150)
            b64 = base64.b64encode(pix.tobytes("png")).decode()
            images.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}})

        messages = [
            {"role": "system", "content": PDF_ANALYST_PROMPT},
            {"role": "user", "content": [
                {"type": "text", "text": f"User query: {query}\nAnalyze the following pages (chunk {start}-{end-1} of {total}). Extract key facts, tables, and insights. Return a concise structured analysis."}
            ] + images}
        ]

        response = client.chat.completions.create(
            model="gemini-3-flash-preview",
            messages=messages,
            temperature=0.2
        )
        summaries.append(response.choices[0].message.content)

    synthesis_prompt = (
        f"You are a senior data analyst synthesizing PDF chunk analyses for the query: '{query}'.\n"
        "Combine the following chunk summaries into a single coherent report with sections: Executive Summary, Key Findings, Data Extracted, and Recommendations.\n\n"
        + "\n---CHUNK---\n".join(summaries)
    )
    final = client.chat.completions.create(
        model="gemini-3-flash-preview",
        messages=[{"role": "user", "content": synthesis_prompt}],
        temperature=0.3
    )
    return {"summary": final.choices[0].message.content, "chunks_analyzed": len(summaries)}
