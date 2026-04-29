# AI Data Scientist

## Backend Setup

1.  Navigate to `backend/`.
2.  Create a virtual environment: `python -m venv venv`
3.  Activate it:
    -   Windows: `venv\Scripts\activate`
    -   macOS/Linux: `source venv/bin/activate`
4.  Install dependencies: `pip install -r requirements.txt`
5.  Set your Gemini API key:
    -   Windows: `$env:GEMINI_API_KEY="your_key"`
    -   macOS/Linux: `export GEMINI_API_KEY=your_key`
6.  Run: `uvicorn main:app --reload --host 0.0.0.0 --port 8000`

## Frontend Setup

1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`
3.  Run dev server: `npm run dev`
4.  Open `http://localhost:3000`

## Features

-   **Chat Mode:** Conversational data analysis with tool use (SQL, Python, PDF analysis, ERP/Market data).
-   **Realtime Mode:** Trigger background monitoring agents that analyze mock data and produce insights/alerts.
-   **Python Execution:** Isolated per-session venvs with package installation and image generation support.
-   **PDF Analysis:** Visual sub-agents process overlapping 50-page chunks as images for high-fidelity extraction.
