import type { UserRole } from "@/types/auth";

export interface ChatMessage {
  type: "CHAT_MESSAGE";
  id: string;
  sessionId: string;
  senderId: string;
  senderEmail: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface CodeSyncMessage {
  type: "CODE_SYNC";
  sessionId: string;
  senderId: string;
  code: string;
  updatedAt: string;
}

export interface ParticipantMediaState {
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  isMicrophoneBlockedByMentor: boolean;
  isCameraBlockedByMentor: boolean;
}

export type SignalType =
  | "READY"
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "HANGUP"
  | "MEDIA_STATE"
  | "MEDIA_CONTROL";

export interface SignalMessage {
  type: "SIGNAL";
  sessionId: string;
  signalType: SignalType;
  senderId: string;
  senderEmail: string;
  senderRole: UserRole;
  payload: Record<string, unknown>;
  sentAt: string;
}

export type RealtimeConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";
