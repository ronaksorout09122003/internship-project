"use client";

import { cn } from "@/utils/cn";

interface AvatarBadgeProps {
  name: string;
  size?: "sm" | "md" | "lg";
  tone?: "neutral" | "accent" | "dark";
}

const sizeClasses = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-lg"
};

const toneClasses = {
  neutral: "bg-white text-slate-950 ring-1 ring-slate-200",
  accent: "bg-[linear-gradient(135deg,#0f172a_0%,#0f766e_100%)] text-white",
  dark: "bg-slate-950 text-white"
};

export function AvatarBadge({
  name,
  size = "md",
  tone = "neutral"
}: AvatarBadgeProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("") || "M";

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-semibold shadow-[0_18px_40px_-30px_rgba(15,23,42,0.65)]",
        sizeClasses[size],
        toneClasses[tone]
      )}
    >
      {initials}
    </div>
  );
}
