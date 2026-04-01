"use client";

import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_100%)] text-white ring-1 ring-slate-950 shadow-[0_20px_44px_-24px_rgba(15,23,42,0.88)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.88)] active:translate-y-0",
  secondary:
    "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-200 shadow-[0_14px_32px_-26px_rgba(16,185,129,0.7)] hover:-translate-y-0.5 hover:bg-emerald-100 hover:ring-emerald-300 active:translate-y-0",
  ghost:
    "bg-white/88 text-slate-900 ring-1 ring-slate-300 shadow-[0_14px_30px_-26px_rgba(15,23,42,0.7)] hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white hover:ring-slate-950 active:translate-y-0",
  danger:
    "bg-rose-600 text-white ring-1 ring-rose-600 shadow-[0_18px_40px_-22px_rgba(225,29,72,0.75)] hover:-translate-y-0.5 hover:bg-rose-500 hover:ring-rose-500 active:translate-y-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});
