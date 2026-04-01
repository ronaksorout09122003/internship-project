import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function BrandMark() {
  return (
    <Link href="/" className="inline-flex items-center gap-3 transition hover:scale-[1.01] hover:opacity-95">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_100%)] text-sm font-bold text-white shadow-[0_16px_36px_-26px_rgba(15,23,42,0.85)]">
        Me
      </span>
      <span className="flex flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-800">
          Live mentoring OS
        </span>
        <span className="text-xl font-bold text-slate-950">{APP_NAME}</span>
      </span>
    </Link>
  );
}
