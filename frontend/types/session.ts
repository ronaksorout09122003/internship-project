import type { UserRole } from "@/types/auth";

export type SessionStatus = "CREATED" | "ACTIVE" | "ENDED";
export type SessionDifficulty = "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
export type SessionLanguage =
  | "TYPESCRIPT"
  | "JAVASCRIPT"
  | "PYTHON"
  | "JAVA"
  | "CPP"
  | "GO";

export interface SessionParticipant {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  headline: string | null;
  timezone: string;
}

export interface Session {
  id: string;
  sessionCode: string;
  topic: string;
  agenda: string | null;
  scheduledAt: string | null;
  durationMinutes: number;
  difficulty: SessionDifficulty;
  language: SessionLanguage;
  templateKey: string;
  studentGoal: string | null;
  mentorNotes: string | null;
  homework: string | null;
  resourceLinks: string | null;
  nextSteps: string | null;
  studentRating: number | null;
  studentFeedback: string | null;
  feedbackSubmittedAt: string | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  mentor: SessionParticipant;
  student: SessionParticipant | null;
  latestCode: string;
}

export interface SessionSummary {
  id: string;
  sessionCode: string;
  topic: string;
  scheduledAt: string | null;
  durationMinutes: number;
  difficulty: SessionDifficulty;
  language: SessionLanguage;
  studentRating: number | null;
  status: SessionStatus;
  createdAt: string;
  mentor: SessionParticipant;
  student: SessionParticipant | null;
}

export interface CreateSessionPayload {
  topic: string;
  agenda?: string;
  scheduledAt?: string | null;
  durationMinutes?: number;
  difficulty?: SessionDifficulty;
  language?: SessionLanguage;
  templateKey?: string;
  studentGoal?: string;
  initialCode?: string;
}

export interface UpdateSessionPayload {
  topic?: string;
  agenda?: string;
  scheduledAt?: string | null;
  durationMinutes?: number;
  difficulty?: SessionDifficulty;
  language?: SessionLanguage;
  templateKey?: string;
  studentGoal?: string;
  mentorNotes?: string;
  homework?: string;
  resourceLinks?: string;
  nextSteps?: string;
  studentRating?: number;
  studentFeedback?: string;
}
