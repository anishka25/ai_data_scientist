"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, User, CheckCircle, Code } from "@phosphor-icons/react";

export default function MessageBubble({ message, sessionId }: { message: any; sessionId: string }) {
  const isUser = message.role === "user";

  const components = {
    img({ node, ...props }: any) {
      let src = props.src || "";
      if (src.startsWith("/files/")) {
        src = `http://localhost:8000${src}`;
      } else if (!src.startsWith("http")) {
        src = `http://localhost:8000/files/${sessionId}/${src}`;
      }
      return <img {...props} src={src} alt={props.alt || "chart"} className="rounded-xl border border-slate-200 my-2 max-h-64" />;
    },
  };

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white ${isUser ? "bg-zinc-800" : "bg-brand-600"}`}>
        {isUser ? <User size={16} weight="bold" /> : <Brain size={16} weight="bold" />}
      </div>
      <div className={`max-w-[80%] space-y-3 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && message.reasoning && (
          <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 text-xs text-slate-600 font-mono">
            <div className="flex items-center gap-1.5 mb-1 text-slate-500 font-semibold uppercase tracking-wider">
              <Brain size={12} /> Reasoning
            </div>
            {message.reasoning}
          </div>
        )}

        {(message.toolCalls || []).map((tc: any, idx: number) => (
          <div key={idx} className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700">
            <div className="flex items-center gap-1.5 mb-1 font-semibold uppercase tracking-wider">
              <Code size={12} /> Tool Call: {tc.name}
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap">{JSON.stringify(tc.args, null, 2)}</pre>
          </div>
        ))}

        {(message.toolResults || []).map((tr: any, idx: number) => (
          <div key={idx} className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 mb-1 font-semibold uppercase tracking-wider">
              <CheckCircle size={12} /> Result: {tr.name}
            </div>
            {tr.result?.images?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tr.result.images.map((img: string, i: number) => (
                  <img key={i} src={`http://localhost:8000${img}`} alt="Generated chart" className="h-32 rounded-lg border border-emerald-200" />
                ))}
              </div>
            )}
            <pre className="overflow-x-auto whitespace-pre-wrap">{typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result, null, 2)}</pre>
          </div>
        ))}

        {message.content && (
          <div className={`rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${isUser ? "bg-zinc-900 text-white" : "bg-white border border-slate-200 text-zinc-800"}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
