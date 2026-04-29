"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Lightning,
  Warning,
  TrendUp,
  TrendDown,
  Database,
  FileText,
  Spinner,
  ChartBar,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Bug,
  CaretDown,
  CaretUp,
} from "@phosphor-icons/react";
import { runRealtimeAnalysis, getRealtimeFeed, getRunStatus } from "@/lib/api";

type Insight = {
  run_id: string;
  timestamp: string;
  insights: string[];
  alerts: string[];
  recommended_actions: string[];
};

type Analysis = {
  sales_mean?: number;
  sales_std?: number;
  anomaly_count?: number;
  trend_direction?: string;
  low_stock_items?: any[];
  error_log_count?: number;
  market_latest?: any;
};

export default function RealtimeDashboard() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const feed = await getRealtimeFeed();
      setInsights(Array.isArray(feed) ? feed : []);
    } catch (e: any) {
      setError(e.message || "Failed to load feed");
      setInsights([]);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await runRealtimeAnalysis();
      if (!data.run_id) {
        throw new Error("Backend did not return a run ID.");
      }
      const poll = setInterval(async () => {
        try {
          const status = await getRunStatus(data.run_id);
          if (status.status === "completed") {
            clearInterval(poll);
            setLastRun(status);
            setRunning(false);
            load();
          }
        } catch {
          clearInterval(poll);
          setRunning(false);
          setError("Polling failed.");
        }
      }, 2000);
    } catch (e: any) {
      setRunning(false);
      setError(e.message || "Failed to start analysis");
    }
  };

  const analysis: Analysis = lastRun?.analysis || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-zinc-900">Realtime Operations</h1>
          <p className="text-zinc-500 mt-1">Autonomous data surveillance and anomaly detection.</p>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 active:scale-[0.97] transition-all disabled:opacity-50 shadow-sm"
        >
          {running ? <Spinner size={18} className="animate-spin" /> : <Play size={18} weight="fill" />}
          {running ? "Running Analysis..." : "Run Agent Now"}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-center gap-2">
          <Warning size={18} />
          {error}
        </div>
      )}

      {/* Data Source Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard icon={Database} label="SQL Sales DB" status="Healthy" sub="500 rows ingested" tone="neutral" />
        <StatusCard icon={FileText} label="ERP Logs" status="Healthy" sub="200 events tracked" tone="neutral" />
        <StatusCard icon={ChartBar} label="Market Trends" status="Healthy" sub="3 indices monitored" tone="neutral" />
      </div>

      {/* Key Metrics from Last Run */}
      {lastRun && (
        <section>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Last Run Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Sales Mean"
              value={analysis.sales_mean !== undefined ? `$${analysis.sales_mean.toLocaleString()}` : "—"}
              icon={analysis.trend_direction === "up" ? ArrowUpRight : ArrowDownRight}
              tone={analysis.trend_direction === "up" ? "positive" : "negative"}
            />
            <MetricCard
              label="Anomalies"
              value={analysis.anomaly_count ?? "—"}
              icon={Bug}
              tone={analysis.anomaly_count && analysis.anomaly_count > 0 ? "negative" : "positive"}
            />
            <MetricCard
              label="Error Logs"
              value={analysis.error_log_count ?? "—"}
              icon={Warning}
              tone={analysis.error_log_count && analysis.error_log_count > 25 ? "negative" : "neutral"}
            />
            <MetricCard
              label="Low Stock"
              value={analysis.low_stock_items ? `${analysis.low_stock_items.length} items` : "—"}
              icon={Package}
              tone={analysis.low_stock_items && analysis.low_stock_items.length > 0 ? "negative" : "positive"}
            />
          </div>
        </section>
      )}

      {/* Insights & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Column */}
        <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Latest Insights</h2>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-lg">{insights.length} runs</span>
          </div>
          <div className="space-y-3">
            {insights.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 mb-3">
                  <ChartBar size={24} />
                </div>
                <p className="text-sm text-zinc-400">No insights yet. Run the agent to begin surveillance.</p>
              </div>
            )}
            <AnimatePresence initial={false}>
              {insights.map((ins, i) => (
                <motion.div
                  key={ins.run_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 24 }}
                  className="group"
                >
                  <div className="rounded-2xl border border-slate-100 bg-zinc-50/50 hover:bg-white hover:border-slate-200 transition-colors p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        {new Date(ins.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {ins.insights.map((s, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-zinc-700">
                          <CheckCircle size={14} className="text-brand-500 mt-0.5 shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Alerts & Actions Column */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-6">Alerts</h2>
            <div className="space-y-3">
              {insights.flatMap((i) => i.alerts).length === 0 && (
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                  <span className="text-sm text-emerald-800 font-medium">All systems nominal. No active alerts.</span>
                </div>
              )}
              {insights.flatMap((i, idx) => i.alerts.map((a, j) => (
                <motion.div
                  key={`${idx}-${j}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-3 items-start rounded-2xl bg-rose-50 border border-rose-100 p-4"
                >
                  <Warning size={18} className="text-rose-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-rose-800 font-medium">{a}</span>
                </motion.div>
              )))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-white border border-slate-200/60 rounded-[2rem] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-6">Recommended Actions</h2>
            <div className="space-y-3">
              {insights.flatMap((i) => i.recommended_actions).length === 0 && (
                <p className="text-sm text-zinc-400">No pending actions.</p>
              )}
              {insights.flatMap((i) => i.recommended_actions).map((a, j) => (
                <motion.div
                  key={j}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: j * 0.05 }}
                  className="flex gap-3 items-start rounded-2xl bg-amber-50 border border-amber-100 p-4"
                >
                  <Lightning size={18} className="text-amber-600 mt-0.5 shrink-0" />
                  <span className="text-sm text-amber-800 font-medium">{a}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Raw Analysis */}
      {lastRun?.analysis && (
        <div className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
          <button
            onClick={() => setShowRaw((s) => !s)}
            className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-zinc-50 transition-colors"
          >
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Raw Analysis Data</h2>
            {showRaw ? <CaretUp size={18} className="text-zinc-400" /> : <CaretDown size={18} className="text-zinc-400" />}
          </button>
          <AnimatePresence>
            {showRaw && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-8">
                  <pre className="text-xs font-mono bg-zinc-50 rounded-xl p-4 overflow-x-auto border border-zinc-100 leading-relaxed">
                    {JSON.stringify(lastRun.analysis, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatusCard({ icon: Icon, label, status, sub, tone }: any) {
  const toneMap: any = {
    neutral: "bg-zinc-100 text-zinc-700",
    positive: "bg-emerald-100 text-emerald-700",
    negative: "bg-rose-100 text-rose-700",
  };
  return (
    <div className="bg-white border border-slate-200/60 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex items-center gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${toneMap[tone] || toneMap.neutral}`}>
        <Icon size={20} weight="bold" />
      </div>
      <div>
        <div className="text-sm font-medium text-zinc-500">{label}</div>
        <div className="text-base font-semibold text-zinc-900">{status}</div>
        <div className="text-xs text-zinc-400">{sub}</div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone }: any) {
  const toneMap: any = {
    neutral: "bg-zinc-100 text-zinc-600",
    positive: "bg-emerald-100 text-emerald-600",
    negative: "bg-rose-100 text-rose-600",
  };
  return (
    <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${toneMap[tone] || toneMap.neutral}`}>
          <Icon size={14} weight="bold" />
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight text-zinc-900">{value}</div>
    </div>
  );
}
