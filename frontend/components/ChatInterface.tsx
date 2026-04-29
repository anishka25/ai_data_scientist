"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneRight, Spinner } from "@phosphor-icons/react";
import { streamChat } from "@/lib/api";
import MessageBubble from "./MessageBubble";

type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: any[];
  toolResults?: any[];
  reasoning?: string;
};

function generateSessionId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const assistantMsg: Message = { role: "assistant", content: "", toolCalls: [], toolResults: [], reasoning: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    let current = { ...assistantMsg };

    try {
      for await (const ev of streamChat(history, sessionId)) {
        if (ev.type === "error") {
          current.content = `**Error:** ${ev.content}`;
        } else if (ev.type === "reasoning") {
          current.reasoning = (current.reasoning || "") + ev.content;
        } else if (ev.type === "tool_call") {
          current.toolCalls = [...(current.toolCalls || []), { name: ev.name, args: ev.arguments }];
        } else if (ev.type === "tool_result") {
          current.toolResults = [...(current.toolResults || []), { name: ev.name, result: ev.result }];
        } else if (ev.type === "message") {
          current.content = ev.content;
        }
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { ...current };
          return copy;
        });
      }
    } catch (e: any) {
      console.error("Chat stream error:", e);
      current.content = `**Connection Error:** ${e.message || "Unable to reach the analysis engine. Make sure the backend is running on port 8000."}`;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...current };
        return copy;
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-2rem)] max-w-5xl mx-auto">
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900">Ask your data anything</h1>
            <p className="text-zinc-500 max-w-md">
              Cogitx connects to your SQL estate, ERP logs, market feeds, and PDFs to explain, forecast, and test hypotheses.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={m} sessionId={sessionId} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="p-4">
        <div className="relative max-w-3xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Query your data estate..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 pr-12 text-zinc-900 shadow-sm outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 transition-all"
          />
          <button
            onClick={send}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.96] transition-all disabled:opacity-50"
          >
            {loading ? <Spinner className="animate-spin" size={18} /> : <PaperPlaneRight size={18} weight="bold" />}
          </button>
        </div>
      </div>
    </div>
  );
}
