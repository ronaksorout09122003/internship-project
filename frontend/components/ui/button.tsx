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
    "bg-slate-950 text-white ring-1 ring-slate-950 shadow-[0_16px_34px_-26px_rgba(15,23,42,0.9)] hover:-translate-y-0.5 hover:bg-slate-800 active:translate-y-0",
  secondary:
    "bg-teal-50 text-teal-950 ring-1 ring-teal-200 shadow-[0_12px_26px_-24px_rgba(15,118,110,0.65)] hover:-translate-y-0.5 hover:bg-teal-100 hover:ring-teal-300 active:translate-y-0",
  ghost:
    "bg-white/90 text-slate-900 ring-1 ring-slate-200 shadow-[0_12px_26px_-25px_rgba(15,23,42,0.65)] hover:-translate-y-0.5 hover:bg-slate-100 hover:ring-slate-300 active:translate-y-0",
  danger:
    "bg-red-600 text-white ring-1 ring-red-600 shadow-[0_16px_34px_-24px_rgba(220,38,38,0.75)] hover:-translate-y-0.5 hover:bg-red-500 hover:ring-red-500 active:translate-y-0"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-200/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});
