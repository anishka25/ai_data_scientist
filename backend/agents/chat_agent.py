import json
import os
import asyncio
from openai import AsyncOpenAI
from agents.prompts import CHAT_SYSTEM_PROMPT
from agents.tools import TOOLS
from agents.executor import run_python_code, install_packages
from agents.pdf_agent import analyze_pdf_document
from data.mock_db import query_mock_db, get_erp_logs, get_market_trends

client = AsyncOpenAI(
    api_key=os.getenv("GEMINI_API_KEY", ""),
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

async def execute_tool(name, args, session_id):
    if name == "query_database":
        return query_mock_db(args.get("query"))
    elif name == "execute_python":
        return run_python_code(session_id, args.get("code"))
    elif name == "install_python_packages":
        return install_packages(session_id, args.get("packages", []))
    elif name == "analyze_pdf":
        return await analyze_pdf_document(args.get("pdf_path"), args.get("query", "Summarize"), session_id)
    elif name == "get_erp_logs":
        return get_erp_logs(args.get("limit", 50))
    elif name == "get_market_trends":
        return get_market_trends(args.get("symbol", "ALL"))
    else:
        return {"error": f"Unknown tool {name}"}

async def run_chat_agent(messages, session_id):
    system_msg = {"role": "system", "content": CHAT_SYSTEM_PROMPT}
    current_messages = [system_msg] + messages

    try:
        while True:
            response = await client.chat.completions.create(
                model="gemini-3-flash-preview",
                messages=current_messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.2
            )
            choice = response.choices[0]

            if choice.finish_reason == "stop" or not choice.message.tool_calls:
                content = choice.message.content or ""
                yield {"type": "message", "content": content}
                break

            if choice.message.content:
                yield {"type": "reasoning", "content": choice.message.content}

            current_messages.append({
                "role": "assistant",
                "content": choice.message.content or "",
                "tool_calls": [tc.model_dump() for tc in choice.message.tool_calls]
            })

            for tc in choice.message.tool_calls:
                fn_name = tc.function.name
                fn_args = json.loads(tc.function.arguments)
                yield {"type": "tool_call", "name": fn_name, "arguments": fn_args}

                result = await execute_tool(fn_name, fn_args, session_id)
                yield {"type": "tool_result", "name": fn_name, "result": result}

                current_messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result)
                })
    except Exception as e:
        yield {"type": "error", "content": f"Backend error: {str(e)}"}
