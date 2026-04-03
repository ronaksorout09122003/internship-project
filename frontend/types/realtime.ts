import type { UserRole } from "@/types/auth";

export type ChatMessageKind = "CHAT" | "SYSTEM" | "CODE_SNIPPET";
export type PresenceActivity = "editing" | "chatting" | "reviewing";

export interface ChatMessage {
  type: "CHAT_MESSAGE";
  messageKind: ChatMessageKind;
  id: string;
  sessionId: string;
  senderId: string;
  senderEmail: string;
  senderRole: UserRole;
  content: string;
  snippetTitle: string | null;
  snippetLanguage: string | null;
  snippetCode: string | null;
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
  isScreenSharing: boolean;
}

export interface ParticipantPresence {
  senderId: string;
  senderEmail: string;
  senderRole: UserRole;
  displayName: string;
  activity: PresenceActivity;
  isTyping: boolean;
  cursorLine: number | null;
  cursorColumn: number | null;
  selectionStartLine: number | null;
  selectionStartColumn: number | null;
  selectionEndLine: number | null;
  selectionEndColumn: number | null;
  lastSeenAt: string;
}

export interface PresenceDraft {
  activity?: PresenceActivity;
  isTyping?: boolean;
  cursorLine?: number | null;
  cursorColumn?: number | null;
  selectionStartLine?: number | null;
  selectionStartColumn?: number | null;
  selectionEndLine?: number | null;
  selectionEndColumn?: number | null;
}

export type SignalType =
  | "READY"
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "HANGUP"
  | "MEDIA_STATE"
  | "MEDIA_CONTROL"
  | "PRESENCE_STATE";

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
