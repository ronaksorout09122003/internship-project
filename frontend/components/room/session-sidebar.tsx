"use client";

import { CalendarDays, Copy, DoorOpen, Link2, Power, Users } from "lucide-react";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDuration, formatSessionDate, formatTimestamp } from "@/utils/format";
import { getDifficultyLabel, getLanguageLabel, getTemplateLabel } from "@/utils/session-options";
import type { Session } from "@/types/session";

interface SessionSidebarProps {
  session: Session;
  currentUserId: string;
  connectionState: string;
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
  isEndingSession = false,
  onCopyLink,
  onDownloadCalendar,
  onLeave,
  onEndSession
}: SessionSidebarProps) {
  const isMentor = session.mentor.id === currentUserId;

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
