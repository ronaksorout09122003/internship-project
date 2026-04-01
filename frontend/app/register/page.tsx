"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useAuth } from "@/hooks/use-auth";
import { register as registerUser, updateCurrentUser } from "@/services/auth-service";
import type { UserRole } from "@/types/auth";
import { cn } from "@/utils/cn";
import { getApiErrorMessage } from "@/utils/api-error";
import { getPasswordPolicyError, PASSWORD_POLICY_HINT } from "@/utils/password-policy";

const roles: Array<{ value: UserRole; title: string; description: string }> = [
  { value: "MENTOR", title: "Mentor", description: "Lead sessions, plan agendas, assign homework, and review outcomes." },
  { value: "STUDENT", title: "Student", description: "Join sessions, learn live, keep notes, and submit structured feedback." }
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>("MENTOR");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [timezone, setTimezone] = useState("");
  const [skills, setSkills] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, []);

  const passwordError = password ? getPasswordPolicyError(password) : null;
  const confirmPasswordError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (confirmPasswordError) {
      toast.error(confirmPasswordError);
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await registerUser({
        email,
        displayName,
        password,
        headline,
        timezone,
        skills,
        role
      });
      login(response);
      await updateCurrentUser({
        displayName,
        headline,
        bio,
        timezone,
        skills
      });
      toast.success("Account created.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create your account."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <section className="grid w-full max-w-6xl gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card-surface ambient-border hidden rounded-[2.5rem] p-10 xl:block">
          <BrandMark />
          <p className="section-kicker mt-10">Industry-style onboarding</p>
          <h1 className="display-font mt-5 text-5xl font-bold text-slate-950">
            Set up a profile that already feels ready for real mentoring workflows.
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600">
            We now capture identity, focus, timezone, and skills so the workspace feels closer
            to a real product from the first session.
          </p>
        </div>

        <section className="card-surface ambient-border rounded-[2.5rem] p-8 sm:p-10">
          <BrandMark />
          <div className="mt-10">
            <p className="section-kicker">Create account</p>
            <h2 className="display-font mt-3 text-4xl font-bold text-slate-950">
              Launch your mentoring workspace
            </h2>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              {roles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "rounded-[1.75rem] border px-5 py-5 text-left transition",
                    role === option.value
                      ? "border-slate-950 bg-slate-950 text-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.9)]"
                      : "border-slate-200 bg-white/80 text-slate-900 hover:bg-white"
                  )}
                >
                  <p className="display-font text-2xl font-bold">{option.title}</p>
                  <p className={cn("mt-2 text-sm leading-7", role === option.value ? "text-slate-200" : "text-slate-600")}>
                    {option.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <InputField label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
              <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
              <InputField label="Headline" value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Frontend mentor for interview prep" />
              <InputField label="Timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
              <InputField label="Skills" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="React, Spring Boot, DSA" />
              <InputField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} hint={PASSWORD_POLICY_HINT} error={passwordError ?? undefined} autoComplete="new-password" required />
            </div>

            <InputField label="Confirm password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} error={confirmPasswordError ?? undefined} autoComplete="new-password" required />
            <TextareaField label="Bio" value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Optional now, but useful later for a stronger profile feel." />

            <Button type="submit" className="w-full py-3" disabled={isSubmitting || Boolean(passwordError) || Boolean(confirmPasswordError) || !displayName.trim() || !timezone.trim()}>
              {isSubmitting ? "Creating account..." : `Create ${role.toLowerCase()} account`}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-950">
              Sign in
            </Link>
          </p>
        </section>
      </section>
    </main>
  );
}
