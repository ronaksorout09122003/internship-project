"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { useAuth } from "@/hooks/use-auth";
import { login as loginUser } from "@/services/auth-service";
import { getApiErrorMessage } from "@/utils/api-error";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await loginUser({ email, password });
      login(response);
      toast.success("Welcome back.");
      router.push(searchParams.get("redirect") ?? "/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to sign in right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="grid w-full max-w-6xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card-surface ambient-border hidden rounded-[2.5rem] p-10 xl:block">
          <BrandMark />
          <p className="section-kicker mt-10">Return to workflow</p>
          <h1 className="display-font mt-5 text-5xl font-bold text-slate-950">
            Re-enter the room with scheduling, notes, and collaboration context intact.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            The workspace now carries richer profile context, session planning, and post-session
            follow-up so live mentoring feels more complete.
          </p>
        </div>

        <div className="card-surface ambient-border rounded-[2.5rem] p-8 sm:p-10">
          <BrandMark />
          <div className="mt-10">
            <p className="section-kicker">Sign in</p>
            <h2 className="display-font mt-3 text-4xl font-bold text-slate-950">
              Open your mentoring dashboard
            </h2>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            <InputField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 rounded-3xl bg-white/80 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
            <p className="font-semibold text-slate-900">Demo access</p>
            <p className="mt-2">Mentor: mentor@mentora.dev / DemoPass123!</p>
            <p>Student: student@mentora.dev / DemoPass123!</p>
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-slate-950">
              Create one
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
