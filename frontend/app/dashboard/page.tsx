"use client";

import Link from "next/link";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { Bell, LogOut, MoveRight, Save, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { StatusPill } from "@/components/ui/status-pill";
import { TextareaField } from "@/components/ui/textarea-field";
import { useAuth } from "@/hooks/use-auth";
import { updateCurrentUser } from "@/services/auth-service";
import { createSession, getMySessions, joinSession } from "@/services/session-service";
import type {
  SessionDifficulty,
  SessionLanguage,
  SessionStatus,
  SessionSummary
} from "@/types/session";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDuration, formatSessionDate, formatTimestamp } from "@/utils/format";
import { extractSessionJoinReference } from "@/utils/session-link";
import {
  buildStarterCode,
  getDifficultyLabel,
  getLanguageLabel,
  SESSION_DIFFICULTY_OPTIONS,
  SESSION_LANGUAGE_OPTIONS,
  SESSION_TEMPLATE_OPTIONS
} from "@/utils/session-options";
import {
  clearStoredDashboardDraft,
  getStoredDashboardDraft,
  setStoredDashboardDraft
} from "@/utils/storage";

const statusFilters: Array<SessionStatus | "ALL"> = ["ALL", "ACTIVE", "CREATED", "ENDED"];

export default function DashboardPage() {
  const router = useRouter();
  const { logout, refreshUser, user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    topic: "",
    agenda: "",
    scheduledAt: "",
    durationMinutes: 60,
    difficulty: "INTERMEDIATE" as SessionDifficulty,
    language: "TYPESCRIPT" as SessionLanguage,
    templateKey: "PAIR_PROGRAMMING",
    studentGoal: "",
    initialCode: "",
    joinInput: ""
  });
  const [profile, setProfile] = useState({
    displayName: "",
    headline: "",
    bio: "",
    timezone: "",
    skills: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">("ALL");
  const [draftsReady, setDraftsReady] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (!user) {
      return;
    }
    setProfile({
      displayName: user.displayName,
      headline: user.headline ?? "",
      bio: user.bio ?? "",
      timezone: user.timezone,
      skills: user.skills ?? ""
    });
  }, [user]);

  useEffect(() => {
    void (async () => {
      try {
        setSessions(await getMySessions());
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to load your sessions."));
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const draft = getStoredDashboardDraft();
    setForm({
      topic: draft.topic,
      agenda: draft.agenda,
      scheduledAt: draft.scheduledAt,
      durationMinutes: Number(draft.durationMinutes) || 60,
      difficulty: (draft.difficulty as SessionDifficulty) || "INTERMEDIATE",
      language: (draft.language as SessionLanguage) || "TYPESCRIPT",
      templateKey: draft.templateKey || "PAIR_PROGRAMMING",
      studentGoal: draft.studentGoal,
      initialCode: draft.initialCode,
      joinInput: draft.joinInput
    });
    setDraftsReady(true);
  }, []);

  useEffect(() => {
    if (!draftsReady) {
      return;
    }
    setStoredDashboardDraft(form);
  }, [draftsReady, form]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    setNotificationPermission(Notification.permission);
  }, []);

  const refreshSessions = async () => setSessions(await getMySessions());
  const updateForm = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateProfileField = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) =>
    setProfile((current) => ({ ...current, [key]: value }));

  const handleCreateSession = async () => {
    if (!form.topic.trim()) {
      toast.error("Session topic is required.");
      return;
    }
    setIsCreating(true);
    try {
      const session = await createSession({
        topic: form.topic.trim(),
        agenda: form.agenda.trim() || undefined,
        scheduledAt: form.scheduledAt || null,
        durationMinutes: form.durationMinutes,
        difficulty: form.difficulty,
        language: form.language,
        templateKey: form.templateKey,
        studentGoal: form.studentGoal.trim() || undefined,
        initialCode: form.initialCode.trim() || undefined
      });
      setForm({
        topic: "",
        agenda: "",
        scheduledAt: "",
        durationMinutes: 60,
        difficulty: "INTERMEDIATE",
        language: "TYPESCRIPT",
        templateKey: "PAIR_PROGRAMMING",
        studentGoal: "",
        initialCode: "",
        joinInput: ""
      });
      clearStoredDashboardDraft();
      await refreshSessions();
      toast.success("Session created.");
      startTransition(() => router.push(`/sessions/${session.id}`));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create the session."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    const reference = extractSessionJoinReference(form.joinInput);
    if (!reference) {
      toast.error("Paste a valid room link, session ID, or session code.");
      return;
    }
    setIsJoining(true);
    try {
      const session = await joinSession("sessionId" in reference ? reference.sessionId : { sessionCode: reference.sessionCode });
      updateForm("joinInput", "");
      await refreshSessions();
      toast.success("Session joined.");
      startTransition(() => router.push(`/sessions/${session.id}`));
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to join this session."));
    } finally {
      setIsJoining(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateCurrentUser(profile);
      await refreshUser();
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save your profile."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Desktop alerts are not supported.");
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    toast[result === "granted" ? "success" : "error"](result === "granted" ? "Desktop alerts enabled." : "Desktop alerts not enabled.");
  };

  const query = deferredSearchQuery.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) => {
    const matchesStatus = statusFilter === "ALL" || session.status === statusFilter;
    const matchesQuery =
      !query ||
      session.topic.toLowerCase().includes(query) ||
      session.sessionCode.toLowerCase().includes(query) ||
      session.mentor.displayName.toLowerCase().includes(query) ||
      session.mentor.email.toLowerCase().includes(query) ||
      session.student?.displayName.toLowerCase().includes(query) ||
      session.student?.email.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  const rated = sessions.filter((session) => session.studentRating);
  const averageRating = rated.length ? (rated.reduce((sum, session) => sum + (session.studentRating ?? 0), 0) / rated.length).toFixed(1) : "0.0";
  const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMinutes, 0);

  return (
    <AuthGuard>
      <main className="page-shell min-h-screen px-6 py-8">
        <section className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="card-surface ambient-border rounded-[2.4rem] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-4xl">
                <BrandMark />
                <p className="section-kicker mt-8">{user?.role === "MENTOR" ? "Mentor command center" : "Student workspace"}</p>
                <h1 className="display-font mt-3 text-4xl font-bold text-slate-950 sm:text-5xl">
                  Sessions, scheduling, profiles, feedback, and follow-up now live in one polished workspace.
                </h1>
              </div>
              <Button variant="ghost" onClick={() => { logout(); router.push("/login"); }}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {[["Rooms", `${sessions.length}`], ["Live", `${sessions.filter((s) => s.status === "ACTIVE").length}`], ["Scheduled", `${sessions.filter((s) => s.status === "CREATED").length}`], ["Avg rating", averageRating], ["Booked time", formatDuration(totalMinutes)]].map(([title, value]) => (
                <div key={title} className="rounded-[1.8rem] bg-white/84 p-5 ring-1 ring-white/75">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
                  <p className="display-font mt-3 text-3xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </header>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <article className="card-surface ambient-border rounded-[2rem] p-6">
              <p className="section-kicker">{user?.role === "MENTOR" ? "Create session" : "Join session"}</p>
              <h2 className="display-font mt-2 text-3xl font-bold text-slate-950">{user?.role === "MENTOR" ? "Launch a structured room" : "Open your mentor room"}</h2>
              {user?.role === "MENTOR" ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <InputField label="Topic" value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} />
                  <InputField label="Scheduled at" type="datetime-local" value={form.scheduledAt} onChange={(e) => updateForm("scheduledAt", e.target.value)} />
                  <TextareaField label="Agenda" value={form.agenda} onChange={(e) => updateForm("agenda", e.target.value)} />
                  <TextareaField label="Student goal" value={form.studentGoal} onChange={(e) => updateForm("studentGoal", e.target.value)} />
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Difficulty</span><select className="rounded-[1.6rem] border border-slate-200 bg-white/92 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value as SessionDifficulty)}>{SESSION_DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Language</span><select className="rounded-[1.6rem] border border-slate-200 bg-white/92 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={form.language} onChange={(e) => updateForm("language", e.target.value as SessionLanguage)}>{SESSION_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Starter</span><select className="rounded-[1.6rem] border border-slate-200 bg-white/92 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={form.templateKey} onChange={(e) => updateForm("templateKey", e.target.value)}>{SESSION_TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Duration</span><select className="rounded-[1.6rem] border border-slate-200 bg-white/92 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100" value={form.durationMinutes} onChange={(e) => updateForm("durationMinutes", Number(e.target.value))}>{[30, 45, 60, 75, 90, 120].map((value) => <option key={value} value={value}>{value} min</option>)}</select></label>
                  <TextareaField label="Starter code" value={form.initialCode} onChange={(e) => updateForm("initialCode", e.target.value)} className="min-h-[220px] font-mono text-[13px] lg:col-span-2" />
                  <div className="flex flex-wrap gap-3 lg:col-span-2">
                    <Button variant="secondary" onClick={() => updateForm("initialCode", buildStarterCode({ topic: form.topic, language: form.language, templateKey: form.templateKey }))}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate starter
                    </Button>
                    <Button onClick={handleCreateSession} disabled={isCreating || !form.topic.trim()}>{isCreating ? "Creating..." : "Create session"}</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <InputField label="Invite link or room code" value={form.joinInput} onChange={(e) => updateForm("joinInput", e.target.value)} />
                  <Button onClick={handleJoinSession} disabled={isJoining || !form.joinInput.trim()}>
                    <MoveRight className="mr-2 h-4 w-4" />
                    {isJoining ? "Joining..." : "Join session"}
                  </Button>
                </div>
              )}
            </article>

            <aside className="space-y-6">
              <article className="card-surface ambient-border rounded-[2rem] p-6">
                <div className="flex items-start gap-4">
                  <AvatarBadge name={user?.displayName ?? "Mentora"} size="lg" tone="accent" />
                  <div>
                    <p className="section-kicker">Profile</p>
                    <h2 className="display-font mt-2 text-2xl font-bold text-slate-950">{user?.displayName}</h2>
                    <p className="mt-2 text-sm text-slate-600">{user?.headline ?? "Sharpen your profile for a more real-world product feel."}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <InputField label="Display name" value={profile.displayName} onChange={(e) => updateProfileField("displayName", e.target.value)} />
                  <InputField label="Headline" value={profile.headline} onChange={(e) => updateProfileField("headline", e.target.value)} />
                  <InputField label="Timezone" value={profile.timezone} onChange={(e) => updateProfileField("timezone", e.target.value)} />
                  <InputField label="Skills" value={profile.skills} onChange={(e) => updateProfileField("skills", e.target.value)} />
                  <TextareaField label="Bio" value={profile.bio} onChange={(e) => updateProfileField("bio", e.target.value)} />
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}><Save className="mr-2 h-4 w-4" />{isSavingProfile ? "Saving..." : "Save profile"}</Button>
                </div>
              </article>
              <article className="card-surface ambient-border rounded-[2rem] p-6">
                <p className="section-kicker">Workspace extras</p>
                <h2 className="display-font mt-2 text-2xl font-bold text-slate-950">Launch polish</h2>
                <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600">
                  <div className="rounded-[1.6rem] bg-white/80 p-4 ring-1 ring-slate-200">Upcoming sessions: {sessions.filter((session) => session.scheduledAt && new Date(session.scheduledAt).getTime() > Date.now()).length}</div>
                  <div className="rounded-[1.6rem] bg-white/80 p-4 ring-1 ring-slate-200">Completed sessions: {sessions.filter((session) => session.status === "ENDED").length}</div>
                  <Button variant={notificationPermission === "granted" ? "secondary" : "ghost"} onClick={handleNotifications} disabled={notificationPermission === "unsupported"}><Bell className="mr-2 h-4 w-4" />{notificationPermission === "granted" ? "Desktop alerts enabled" : notificationPermission === "unsupported" ? "Desktop alerts unavailable" : "Enable desktop alerts"}</Button>
                </div>
              </article>
            </aside>
          </section>

          <section className="card-surface ambient-border rounded-[2rem] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Session library</p>
                <h2 className="display-font mt-2 text-3xl font-bold text-slate-950">Searchable room history with richer metadata</h2>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <InputField label="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="flex flex-wrap gap-2">{statusFilters.map((filter) => <Button key={filter} variant={statusFilter === filter ? "primary" : "secondary"} onClick={() => setStatusFilter(filter)}>{filter === "ALL" ? "All" : filter}</Button>)}</div>
              </div>
            </div>
            {isLoading ? <div className="mt-6 rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">Loading your sessions...</div> : filteredSessions.length === 0 ? <div className="mt-6 rounded-3xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">No sessions match your current filters.</div> : <div className="mt-6 grid gap-4 xl:grid-cols-2">{filteredSessions.map((session) => <article key={session.id} className="rounded-[1.9rem] bg-white/88 p-5 ring-1 ring-slate-200"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{session.sessionCode}</p><h3 className="display-font mt-2 text-2xl font-bold text-slate-950">{session.topic}</h3><p className="mt-2 text-sm text-slate-500">{formatSessionDate(session.scheduledAt)} | {formatDuration(session.durationMinutes)}</p></div><StatusPill label={session.status} /></div><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{getLanguageLabel(session.language)}</span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{getDifficultyLabel(session.difficulty)}</span>{session.studentRating ? <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"><Star className="mr-1 h-3.5 w-3.5" />{session.studentRating}/5</span> : null}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-[1.4rem] bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mentor</p><p className="mt-3 font-semibold text-slate-950">{session.mentor.displayName}</p><p className="text-sm text-slate-600">{session.mentor.email}</p></div><div className="rounded-[1.4rem] bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Student</p><p className="mt-3 font-semibold text-slate-950">{session.student?.displayName ?? "Waiting to join"}</p><p className="text-sm text-slate-600">{session.student?.email ?? "Seat not claimed"}</p></div></div><div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4"><span className="text-sm text-slate-500">Created {formatTimestamp(session.createdAt)}</span><Link href={`/sessions/${session.id}`}><Button>Open room</Button></Link></div></article>)}</div>}
          </section>
        </section>
      </main>
    </AuthGuard>
  );
}
