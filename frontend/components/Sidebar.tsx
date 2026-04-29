"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ChatTeardropText, ChartLineUp, Brain } from "@phosphor-icons/react";

const links = [
  { href: "/chat", label: "Ask Cogitx", icon: ChatTeardropText },
  { href: "/realtime", label: "Realtime Ops", icon: ChartLineUp },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-4 top-4 bottom-4 w-16 md:w-64 flex flex-col gap-2 z-40">
      <div className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        <div className="p-6 pb-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
            <Brain weight="bold" size={18} />
          </div>
          <span className="hidden md:block font-semibold text-zinc-900 tracking-tight">Cogitx</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {links.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "text-brand-700" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-brand-50 border border-brand-100 rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon size={20} weight={active ? "bold" : "regular"} />
                </span>
                <span className="relative z-10 hidden md:block">{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
