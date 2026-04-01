import { apiClient } from "@/services/api-client";
import type { ChatMessage } from "@/types/realtime";
import type {
  CreateSessionPayload,
  Session,
  SessionSummary,
  UpdateSessionPayload
} from "@/types/session";

type JoinSessionInput = string | { sessionCode: string };

export async function createSession(payload: CreateSessionPayload) {
  const { data } = await apiClient.post<Session>("/sessions", payload);
  return data;
}

export async function joinSession(reference: JoinSessionInput) {
  if (typeof reference === "string") {
    const { data } = await apiClient.post<Session>(`/sessions/${reference}/join`);
    return data;
  }

  const { data } = await apiClient.post<Session>("/sessions/join", reference);
  return data;
}

export async function endSession(sessionId: string) {
  const { data } = await apiClient.post<Session>(`/sessions/${sessionId}/end`);
  return data;
}

export async function getSession(sessionId: string) {
  const { data } = await apiClient.get<Session>(`/sessions/${sessionId}`);
  return data;
}

export async function getMySessions() {
  const { data } = await apiClient.get<SessionSummary[]>("/sessions");
  return data;
}

export async function getMessages(sessionId: string) {
  const { data } = await apiClient.get<ChatMessage[]>(`/sessions/${sessionId}/messages`);
  return data;
}

export async function updateSession(sessionId: string, payload: UpdateSessionPayload) {
  const { data } = await apiClient.patch<Session>(`/sessions/${sessionId}`, payload);
  return data;
}
