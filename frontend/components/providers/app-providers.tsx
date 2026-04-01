"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/auth-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "18px",
            border: "1px solid rgba(148, 163, 184, 0.22)",
            background: "rgba(255, 255, 255, 0.96)",
            color: "#0f172a"
          }
        }}
      />
    </AuthProvider>
  );
}
