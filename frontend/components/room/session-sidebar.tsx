"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Copy, DoorOpen, Link2, Power, Users } from "lucide-react";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { ParticipantPresence } from "@/types/realtime";
import type { Session } from "@/types/session";
import { formatDuration, formatSessionDate, formatTimestamp } from "@/utils/format";
import { getDifficultyLabel, getLanguageLabel, getTemplateLabel } from "@/utils/session-options";

interface SessionSidebarProps {
  session: Session;
  currentUserId: string;
  connectionState: string;
  presence?: ParticipantPresence[];
  isEndingSession?: boolean;
  onCopyLink: () => void;
  onDownloadCalendar: () => void;
  onLeave: () => void;
  onEndSession: () => void;
}

export function SessionSidebar({
  session,
  currentUserId,
  connectionState,
  presence = [],
  isEndingSession = false,
  onCopyLink,
  onDownloadCalendar,
  onLeave,
  onEndSession
}: SessionSidebarProps) {
  const [now, setNow] = useState(() => Date.now());
  const isMentor = session.mentor.id === currentUserId;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const sessionPulse = useMemo(() => {
    if (!session.scheduledAt) {
      return {
        title: "Flexible schedule",
        detail: "This room starts whenever both participants are ready.",
        progress: 0,
        toneClass: "bg-slate-300"
      };
    }

    const scheduledAt = new Date(session.scheduledAt).getTime();
    const endsAt = scheduledAt + session.durationMinutes * 60_000;

    if (session.status === "ENDED") {
      return {
        title: "Session complete",
        detail: "The room has been closed and is now read-only.",
        progress: 100,
        toneClass: "bg-slate-500"
      };
    }

    if (now < scheduledAt) {
      const minutesUntilStart = Math.max(1, Math.ceil((scheduledAt - now) / 60_000));
      return {
        title: `Starts in ${formatDuration(minutesUntilStart)}`,
        detail: `Planned duration ${formatDuration(session.durationMinutes)}.`,
        progress: 0,
        toneClass: "bg-amber-400"
      };
    }

    if (now <= endsAt) {
      const elapsed = now - scheduledAt;
      const progress = Math.min(100, (elapsed / (session.durationMinutes * 60_000)) * 100);
      const remainingMinutes = Math.max(1, Math.ceil((endsAt - now) / 60_000));
      return {
        title: `${formatDuration(remainingMinutes)} remaining`,
        detail: "Live session window is in progress right now.",
        progress,
        toneClass: "bg-emerald-500"
      };
    }

    const overrunMinutes = Math.max(1, Math.ceil((now - endsAt) / 60_000));
    return {
      title: `Running ${formatDuration(overrunMinutes)} over`,
      detail: "Good moment to wrap with recap, homework, and feedback.",
      progress: 100,
      toneClass: "bg-rose-500"
    };
  }, [now, session.durationMinutes, session.scheduledAt, session.status]);

  return (
    <aside className="card-surface ambient-border h-full rounded-[2rem] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="section-kicker">
            Session brief
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
            {session.topic}
          </h2>
        </div>
        <StatusPill label={session.status} />
      </div>

      <div className="space-y-4 text-sm text-slate-600">
        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Session pulse
          </p>
          <p className="mt-3 text-lg font-semibold text-slate-950">{sessionPulse.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{sessionPulse.detail}</p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${sessionPulse.toneClass}`}
              style={{ width: `${sessionPulse.progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Session Code
          </p>
          <div className="mt-2 flex flex-col gap-3">
            <span className="display-font text-2xl font-bold text-slate-950">
              {session.sessionCode}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={onCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy invite
              </Button>
              <Button
                variant="ghost"
                onClick={onDownloadCalendar}
                disabled={!session.scheduledAt}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </Button>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-slate-500">
            Students can join with the invite link or by entering this session code.
          </p>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Session posture
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {getLanguageLabel(session.language)}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {getDifficultyLabel(session.difficulty)}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {getTemplateLabel(session.templateKey)}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p>Schedule: {formatSessionDate(session.scheduledAt)}</p>
            <p>Duration: {formatDuration(session.durationMinutes)}</p>
            <p>Goal: {session.studentGoal ?? "Shared live problem solving"}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Participants
          </p>
          <div className="mt-3 space-y-4">
            <div className="flex items-center gap-3">
              <AvatarBadge name={session.mentor.displayName} tone="accent" />
              <div>
                <p className="font-semibold text-slate-900">{session.mentor.displayName}</p>
                <p>{session.mentor.email}</p>
                <p className="text-xs text-slate-500">{session.mentor.headline ?? "Mentor"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={session.student?.displayName ?? "Student"}
                tone={session.student ? "neutral" : "dark"}
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {session.student?.displayName ?? "Waiting to join"}
                </p>
                <p>{session.student?.email ?? "Invite link shared but not yet used"}</p>
                <p className="text-xs text-slate-500">
                  {session.student?.headline ?? "Student seat"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Collaborator presence
          </p>
          <div className="mt-3 space-y-3">
            {presence.length > 0 ? (
              presence.map((entry) => (
                <div
                  key={entry.senderId}
                  className="rounded-[1.3rem] bg-slate-50 px-4 py-3"
                >
                  <p className="font-semibold text-slate-900">{entry.displayName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {entry.activity}
                    {entry.cursorLine ? ` • line ${entry.cursorLine}` : ""}
                    {entry.isTyping ? " • typing" : ""}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Presence badges will appear here once the other participant becomes active in the room.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Room Health
          </p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-sky-600" />
              <span className="capitalize">Realtime {connectionState}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <span>{session.student ? "Both participants present" : "Waiting for student join"}</span>
            </div>
            <p>Created {formatTimestamp(session.createdAt)}</p>
            <p>Last updated {formatTimestamp(session.updatedAt)}</p>
          </div>
        </div>

        {session.agenda ? (
          <div className="rounded-3xl bg-white/80 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Agenda
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{session.agenda}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {isMentor ? (
          <Button variant="danger" onClick={onEndSession} disabled={isEndingSession}>
            <Power className="mr-2 h-4 w-4" />
            {isEndingSession ? "Ending session..." : "End session"}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onLeave}>
          <DoorOpen className="mr-2 h-4 w-4" />
          Leave room
        </Button>
      </div>
    </aside>
  );
}
