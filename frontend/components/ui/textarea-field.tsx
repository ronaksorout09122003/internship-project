"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function TextareaField({
  label,
  hint,
  error,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className={cn(
          "field-control min-h-[120px] px-4 py-3 text-sm placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100",
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
