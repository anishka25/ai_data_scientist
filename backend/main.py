import os
import sys
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.chat_agent import run_chat_agent
from agents.realtime_agent import run_realtime_analysis, get_insights, realtime_runs
from data import mock_db

WORKSPACE_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "workspace"))
os.makedirs(WORKSPACE_ROOT, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    mock_db.init()
    try:
        from data.generate_sample_pdf import generate
        generate()
    except Exception as e:
        print("PDF generation skipped or failed:", e)
    yield

app = FastAPI(title="Cogitx AI Data Scientist", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "Cogitx AI Backend Running"}

@app.get("/health")
def health():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    messages: list
    session_id: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    async def event_generator():
        async for event in run_chat_agent(req.messages, req.session_id):
            yield f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

class RealtimeRunRequest(BaseModel):
    source_filter: list[str] | None = None

@app.post("/realtime/run")
async def realtime_run(req: RealtimeRunRequest | None = None):
    run_id = await run_realtime_analysis(req.source_filter if req else None)
    return {"run_id": run_id, "status": "started"}

@app.get("/realtime/runs/{run_id}")
async def realtime_run_status(run_id: str):
    return realtime_runs.get(run_id, {"error": "not found"})

@app.get("/realtime/feed")
async def realtime_feed(limit: int = 10):
    return get_insights(limit)

@app.get("/files/{session_id}/{filename}")
async def serve_file(session_id: str, filename: str):
    file_path = os.path.join(WORKSPACE_ROOT, session_id, filename)
    abs_path = os.path.abspath(file_path)
    if not abs_path.startswith(os.path.abspath(WORKSPACE_ROOT)):
        raise HTTPException(403, "Access denied")
    if not os.path.exists(abs_path):
        raise HTTPException(404, "File not found")
    return FileResponse(abs_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
