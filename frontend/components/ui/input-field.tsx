"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function InputField({ label, hint, error, className, ...props }: InputFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className={cn(
          "field-control px-4 py-3 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100",
          error && "border-rose-300 focus:border-rose-400 focus:ring-rose-100",
          className
        )}
        {...props}
      />
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
