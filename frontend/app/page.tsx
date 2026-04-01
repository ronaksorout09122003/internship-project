import Link from "next/link";
import { ArrowRight, CalendarDays, Code2, LayoutPanelTop, ShieldCheck, Star } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";

const highlights = [
  ["Private 1-on-1 rooms", "JWT-secured mentor and student access"],
  ["Structured session planning", "Agenda, schedule, difficulty, and outcomes"],
  ["Realtime collaboration", "Video, code, and chat in one room"],
  ["Post-session continuity", "Notes, homework, and feedback built in"]
];

export default function HomePage() {
  return (
    <main className="page-shell min-h-screen px-6 py-8">
      <section className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="card-surface ambient-border flex items-center justify-between rounded-[2rem] px-6 py-5">
          <BrandMark />
          <div className="flex items-center gap-3">
            <Link href="/login"><Button variant="ghost">Log in</Button></Link>
            <Link href="/register"><Button>Get started</Button></Link>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="card-surface ambient-border overflow-hidden rounded-[2.5rem] p-8 sm:p-12">
            <p className="section-kicker">Premium mentoring workspace</p>
            <h1 className="display-font mt-4 max-w-4xl text-5xl font-bold leading-tight text-slate-950 sm:text-6xl">
              Realtime mentoring that feels closer to a real product than a basic demo.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
              Mentora combines secure rooms, session scheduling, live coding, video, chat,
              feedback, and post-session follow-up in a clean industry-style interface.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/register"><Button className="px-6 py-3">Create an account <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="/login"><Button variant="secondary" className="px-6 py-3">Open dashboard</Button></Link>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map(([title, value]) => (
                <div key={title} className="rounded-[1.75rem] bg-white/82 p-5 ring-1 ring-white/70">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="card-surface ambient-border rounded-[2.2rem] p-8">
              <p className="section-kicker">Why it feels stronger now</p>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <li className="flex items-start gap-3"><LayoutPanelTop className="mt-1 h-4 w-4 text-emerald-700" /> Product-grade dashboard with analytics and search</li>
                <li className="flex items-start gap-3"><CalendarDays className="mt-1 h-4 w-4 text-emerald-700" /> Scheduling and session planning without any paid API</li>
                <li className="flex items-start gap-3"><Code2 className="mt-1 h-4 w-4 text-emerald-700" /> Language-aware shared editor with reusable starters</li>
                <li className="flex items-start gap-3"><Star className="mt-1 h-4 w-4 text-emerald-700" /> Homework, notes, and feedback for continuity</li>
              </ul>
            </div>

            <div className="card-surface ambient-border rounded-[2.2rem] p-8">
              <p className="section-kicker">Demo credentials</p>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-950">Mentor</p>
                  <p className="mt-1">mentor@mentora.dev</p>
                  <p>DemoPass123!</p>
                </div>
                <div className="rounded-3xl bg-white/85 p-4 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-950">Student</p>
                  <p className="mt-1">student@mentora.dev</p>
                  <p>DemoPass123!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Secure access", description: "Private rooms restricted to mentor and student participants only." },
            { icon: CalendarDays, title: "Scheduled rooms", description: "Agenda, timing, difficulty, and student goals captured before the session starts." },
            { icon: Code2, title: "Realtime coding", description: "Shared editor, chat, and WebRTC calling keep the session tightly coordinated." },
            { icon: Star, title: "Outcomes tracked", description: "Feedback, homework, and notes turn one live session into a reusable learning record." }
          ].map(({ icon: Icon, title, description }) => (
            <article key={title} className="card-surface ambient-border rounded-[2rem] p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="display-font mt-5 text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
