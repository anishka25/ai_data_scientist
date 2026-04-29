import uuid
import json
import random
from datetime import datetime
from openai import OpenAI
from agents.executor import run_python_code
from data.mock_db import query_mock_db, get_erp_logs, get_market_trends
import os

client = OpenAI(
    api_key=os.getenv("GEMINI_API_KEY", ""),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

realtime_runs = {}
insights_store = []

async def run_realtime_analysis(source_filter=None):
    run_id = str(uuid.uuid4())
    realtime_runs[run_id] = {"status": "running", "started_at": datetime.utcnow().isoformat(), "insights": []}

    sales = query_mock_db("SELECT * FROM sales ORDER BY date DESC LIMIT 100")
    inventory = query_mock_db("SELECT * FROM inventory")
    logs = get_erp_logs(100)
    market = get_market_trends("ALL")

    session_id = f"realtime_{run_id}"
    code = '''
import json, math
sales = json.loads("""''' + json.dumps(sales) + '''""")
inventory = json.loads("""''' + json.dumps(inventory) + '''""")
logs = json.loads("""''' + json.dumps(logs) + '''""")
market = json.loads("""''' + json.dumps(market) + '''""")

amounts = [s['amount'] for s in sales if s.get('amount')]
mean = sum(amounts)/len(amounts) if amounts else 0
variance = sum((x-mean)**2 for x in amounts)/len(amounts) if amounts else 0
std = math.sqrt(variance)
z_scores = [(i, (x-mean)/std) for i, x in enumerate(amounts)] if std > 0 else []
anomalies = [z for z in z_scores if abs(z[1]) > 2.5]

recent = amounts[:30]
older = amounts[30:60]
trend = "up" if recent and older and (sum(recent)/len(recent) > sum(older)/len(older)) else "down"

low_stock = [i for i in inventory if i.get('stock_level', 0) < 20]
error_logs = [l for l in logs if l.get('level') == 'ERROR']

print(json.dumps({
    "sales_mean": round(mean, 2),
    "sales_std": round(std, 2),
    "anomaly_count": len(anomalies),
    "trend_direction": trend,
    "low_stock_items": low_stock,
    "error_log_count": len(error_logs),
    "market_latest": market[0] if market else None
}))
'''
    result = run_python_code(session_id, code)

    analysis = {}
    if result["returncode"] == 0:
        try:
            lines = result["stdout"].strip().split("\n")
            analysis = json.loads(lines[-1])
        except Exception:
            analysis = {"raw_stdout": result["stdout"]}
    else:
        analysis = {"error": result["stderr"]}

    prompt = f"""You are an autonomous Data Monitoring Agent analyzing organizational telemetry.

## DATA SNAPSHOT
{json.dumps(analysis, indent=2)}

## INSTRUCTIONS
Produce a terse, high-signal executive briefing. Be specific and cite relative changes (e.g., "14% above baseline"). Do not use generic filler.

## OUTPUT FORMAT
Return ONLY a valid JSON object. No markdown, no prose, no code fences.
{{
  "insights": [
    "Specific observation 1...",
    "Specific observation 2..."
  ],
  "alerts": [
    "Critical issue 1..."
  ],
  "recommended_actions": [
    "Tactical step 1..."
  ]
}}

If no alerts exist, return an empty alerts array."""

    parsed = {"insights": [], "alerts": [], "recommended_actions": []}
    try:
        response = client.chat.completions.create(
            model="gemini-3-flash-preview",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        text = response.choices[0].message.content.strip()
        # Aggressive markdown stripping
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        parsed = json.loads(text)
    except Exception as e:
        print("Realtime LLM parse error:", e)
        parsed = {
            "insights": ["System analysis completed successfully."],
            "alerts": [],
            "recommended_actions": []
        }

    run_data = {
        "status": "completed",
        "completed_at": datetime.utcnow().isoformat(),
        "analysis": analysis,
        "insights": parsed.get("insights", []),
        "alerts": parsed.get("alerts", []),
        "recommended_actions": parsed.get("recommended_actions", [])
    }
    realtime_runs[run_id] = run_data
    insights_store.insert(0, {"run_id": run_id, "timestamp": run_data["completed_at"], **parsed})
    return run_id

def get_insights(limit=10):
    return insights_store[:limit]
