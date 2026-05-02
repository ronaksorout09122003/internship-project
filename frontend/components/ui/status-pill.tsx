"use client";

import { cn } from "@/utils/cn";

const statusClasses: Record<string, string> = {
  CREATED: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  ACTIVE: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  ENDED: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  connecting: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  connected: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  waiting: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  calling: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  disconnected: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  error: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  Live: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  Connecting: "bg-sky-100 text-sky-800 ring-1 ring-sky-200",
  Waiting: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  "Reconnection needed": "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
};

export function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
        statusClasses[label] ?? "bg-slate-100 text-slate-700"
      )}
    >
      {label}
    </span>
  );
}
