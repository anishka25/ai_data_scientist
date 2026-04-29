const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function* streamChat(messages: any[], sessionId: string) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, session_id: sessionId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  if (!res.body) throw new Error("No response body");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          yield JSON.parse(line.slice(6));
        } catch {}
      }
    }
  }
}

export async function runRealtimeAnalysis() {
  const res = await fetch(`${API_BASE}/realtime/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getRealtimeFeed() {
  const res = await fetch(`${API_BASE}/realtime/feed`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function getRunStatus(runId: string) {
  const res = await fetch(`${API_BASE}/realtime/runs/${runId}`);
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}
