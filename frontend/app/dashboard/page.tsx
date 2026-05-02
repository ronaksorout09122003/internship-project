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
  const { logout, refreshUser, user, isLoading: isAuthLoading } = useAuth();
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
    if (isAuthLoading) {
      return;
    }

    if (!user) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const nextSessions = await getMySessions();
        if (isActive) {
          setSessions(nextSessions);
        }
      } catch (error) {
        if (isActive) {
          toast.error(getApiErrorMessage(error, "Unable to load your sessions."));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isAuthLoading, user]);

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

  const refreshSessions = async () => {
    if (!user) {
      return;
    }

    setSessions(await getMySessions());
  };
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
  const activeSessions = sessions.filter((session) => session.status === "ACTIVE").length;
  const scheduledSessions = sessions.filter((session) => session.status === "CREATED").length;
  const completedSessions = sessions.filter((session) => session.status === "ENDED").length;
  const upcomingSessions = sessions.filter((session) => session.scheduledAt && new Date(session.scheduledAt).getTime() > Date.now()).length;
  const selectClassName = "field-control px-4 py-3 text-sm";

  return (
    <AuthGuard>
      <main className="page-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
        <section className="mx-auto flex max-w-[1500px] flex-col gap-5">
          <header className="card-surface ambient-border rounded-3xl p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <BrandMark />
                <div className="hidden h-8 w-px bg-slate-200 sm:block" />
                <div>
                  <p className="section-kicker">{user?.role === "MENTOR" ? "Mentor console" : "Student desk"}</p>
                  <h1 className="display-font text-2xl font-bold text-slate-950 sm:text-3xl">
                    {user?.role === "MENTOR" ? "Plan, run, and review sessions" : "Join rooms and keep your learning work organized"}
                  </h1>
                </div>
              </div>
              <Button variant="ghost" onClick={() => { logout(); router.push("/login"); }}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[["Rooms", `${sessions.length}`], ["Live", `${activeSessions}`], ["Scheduled", `${scheduledSessions}`], ["Avg rating", averageRating], ["Booked", formatDuration(totalMinutes)]].map(([title, value]) => (
                <div key={title} className="panel-muted rounded-2xl px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
                  <p className="display-font mt-2 text-2xl font-bold text-slate-950">{value}</p>
                </div>
              ))}
            </div>
          </header>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
            <article className="card-surface ambient-border rounded-3xl p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-kicker">{user?.role === "MENTOR" ? "Create session" : "Join session"}</p>
                  <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
                    {user?.role === "MENTOR" ? "Start a focused live room" : "Enter your mentor room"}
                  </h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-slate-600">
                  {user?.role === "MENTOR" ? "Keep setup lean: topic, goal, starter code, then open the room." : "Paste an invite link, session ID, or short room code."}
                </p>
              </div>
              {user?.role === "MENTOR" ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <InputField label="Topic" value={form.topic} onChange={(e) => updateForm("topic", e.target.value)} />
                  <InputField label="Scheduled at" type="datetime-local" value={form.scheduledAt} onChange={(e) => updateForm("scheduledAt", e.target.value)} />
                  <TextareaField label="Agenda" value={form.agenda} onChange={(e) => updateForm("agenda", e.target.value)} />
                  <TextareaField label="Student goal" value={form.studentGoal} onChange={(e) => updateForm("studentGoal", e.target.value)} />
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Difficulty</span><select className={selectClassName} value={form.difficulty} onChange={(e) => updateForm("difficulty", e.target.value as SessionDifficulty)}>{SESSION_DIFFICULTY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Language</span><select className={selectClassName} value={form.language} onChange={(e) => updateForm("language", e.target.value as SessionLanguage)}>{SESSION_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Starter</span><select className={selectClassName} value={form.templateKey} onChange={(e) => updateForm("templateKey", e.target.value)}>{SESSION_TEMPLATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                  <label className="flex flex-col gap-2"><span className="text-sm font-medium text-slate-700">Duration</span><select className={selectClassName} value={form.durationMinutes} onChange={(e) => updateForm("durationMinutes", Number(e.target.value))}>{[30, 45, 60, 75, 90, 120].map((value) => <option key={value} value={value}>{value} min</option>)}</select></label>
                  <TextareaField label="Starter code" value={form.initialCode} onChange={(e) => updateForm("initialCode", e.target.value)} className="min-h-[210px] font-mono text-[13px] lg:col-span-2" />
                  <div className="flex flex-wrap gap-3 lg:col-span-2">
                    <Button variant="secondary" onClick={() => updateForm("initialCode", buildStarterCode({ topic: form.topic, language: form.language, templateKey: form.templateKey }))}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate starter
                    </Button>
                    <Button onClick={handleCreateSession} disabled={isCreating || !form.topic.trim()}>{isCreating ? "Creating..." : "Create session"}</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <InputField label="Invite link or room code" value={form.joinInput} onChange={(e) => updateForm("joinInput", e.target.value)} />
                  </div>
                  <Button onClick={handleJoinSession} disabled={isJoining || !form.joinInput.trim()}>
                    <MoveRight className="mr-2 h-4 w-4" />
                    {isJoining ? "Joining..." : "Join session"}
                  </Button>
                </div>
              )}
            </article>

            <aside className="space-y-5">
              <article className="card-surface ambient-border rounded-3xl p-5">
                <div className="flex items-center gap-4">
                  <AvatarBadge name={user?.displayName ?? "Mentora"} size="lg" tone="accent" />
                  <div>
                    <p className="section-kicker">Profile</p>
                    <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">{user?.displayName}</h2>
                    <p className="text-sm text-slate-600">{user?.headline ?? "Add a headline for better room context."}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  <InputField label="Display name" value={profile.displayName} onChange={(e) => updateProfileField("displayName", e.target.value)} />
                  <InputField label="Headline" value={profile.headline} onChange={(e) => updateProfileField("headline", e.target.value)} />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <InputField label="Timezone" value={profile.timezone} onChange={(e) => updateProfileField("timezone", e.target.value)} />
                    <InputField label="Skills" value={profile.skills} onChange={(e) => updateProfileField("skills", e.target.value)} />
                  </div>
                  <TextareaField label="Bio" value={profile.bio} onChange={(e) => updateProfileField("bio", e.target.value)} />
                  <Button onClick={handleSaveProfile} disabled={isSavingProfile}><Save className="mr-2 h-4 w-4" />{isSavingProfile ? "Saving..." : "Save profile"}</Button>
                </div>
              </article>
              <article className="card-surface ambient-border rounded-3xl p-5">
                <p className="section-kicker">Workspace</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="panel-muted rounded-2xl p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Upcoming</p><p className="mt-2 text-2xl font-bold text-slate-950">{upcomingSessions}</p></div>
                  <div className="panel-muted rounded-2xl p-4"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">Complete</p><p className="mt-2 text-2xl font-bold text-slate-950">{completedSessions}</p></div>
                </div>
                <Button className="mt-4 w-full" variant={notificationPermission === "granted" ? "secondary" : "ghost"} onClick={handleNotifications} disabled={notificationPermission === "unsupported"}><Bell className="mr-2 h-4 w-4" />{notificationPermission === "granted" ? "Desktop alerts enabled" : notificationPermission === "unsupported" ? "Desktop alerts unavailable" : "Enable desktop alerts"}</Button>
              </article>
            </aside>
          </section>

          <section className="card-surface ambient-border rounded-3xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="section-kicker">Session library</p>
                <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">Rooms and history</h2>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                <InputField label="Search" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <div className="flex flex-wrap gap-2">{statusFilters.map((filter) => <Button key={filter} variant={statusFilter === filter ? "primary" : "secondary"} onClick={() => setStatusFilter(filter)}>{filter === "ALL" ? "All" : filter}</Button>)}</div>
              </div>
            </div>
            {isLoading ? <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">Loading your sessions...</div> : filteredSessions.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">No sessions match your current filters.</div> : <div className="mt-5 grid gap-3 xl:grid-cols-2">{filteredSessions.map((session) => <article key={session.id} className="rounded-2xl bg-white/88 p-4 ring-1 ring-slate-200"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{session.sessionCode}</p><h3 className="display-font mt-1 text-xl font-bold text-slate-950">{session.topic}</h3><p className="mt-1 text-sm text-slate-500">{formatSessionDate(session.scheduledAt)} | {formatDuration(session.durationMinutes)}</p></div><StatusPill label={session.status} /></div><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{getLanguageLabel(session.language)}</span><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">{getDifficultyLabel(session.difficulty)}</span>{session.studentRating ? <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"><Star className="mr-1 h-3.5 w-3.5" />{session.studentRating}/5</span> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="panel-muted rounded-xl p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Mentor</p><p className="mt-2 font-semibold text-slate-950">{session.mentor.displayName}</p><p className="truncate text-sm text-slate-600">{session.mentor.email}</p></div><div className="panel-muted rounded-xl p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student</p><p className="mt-2 font-semibold text-slate-950">{session.student?.displayName ?? "Waiting to join"}</p><p className="truncate text-sm text-slate-600">{session.student?.email ?? "Seat not claimed"}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-3"><span className="text-sm text-slate-500">Created {formatTimestamp(session.createdAt)}</span><Link href={`/sessions/${session.id}`}><Button>Open room</Button></Link></div></article>)}</div>}
          </section>
        </section>
      </main>
    </AuthGuard>
  );
}
