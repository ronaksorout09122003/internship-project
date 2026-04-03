"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { WS_URL } from "@/lib/constants";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type {
  ChatMessage,
  CodeSyncMessage,
  ParticipantPresence,
  PresenceDraft,
  RealtimeConnectionState,
  SignalMessage,
  SignalType
} from "@/types/realtime";

interface SendChatInput {
  content?: string;
  snippetTitle?: string;
  snippetLanguage?: string;
  snippetCode?: string;
}

interface UseSessionRealtimeArgs {
  sessionId: string | null;
  token: string | null;
  currentUserId: string | null;
  currentUserDisplayName?: string | null;
  initialMessages: ChatMessage[];
  initialCode: string;
  onSignal?: (signal: SignalMessage) => void;
  enabled?: boolean;
}

interface PresenceStateSnapshot {
  activity: "editing" | "chatting" | "reviewing";
  isTyping: boolean;
  cursorLine: number | null;
  cursorColumn: number | null;
  selectionStartLine: number | null;
  selectionStartColumn: number | null;
  selectionEndLine: number | null;
  selectionEndColumn: number | null;
}

const DEFAULT_PRESENCE_STATE: PresenceStateSnapshot = {
  activity: "reviewing",
  isTyping: false,
  cursorLine: null,
  cursorColumn: null,
  selectionStartLine: null,
  selectionStartColumn: null,
  selectionEndLine: null,
  selectionEndColumn: null
};

function toNumberOrNull(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePresenceSignal(signal: SignalMessage): ParticipantPresence {
  const payload = signal.payload;

  return {
    senderId: signal.senderId,
    senderEmail: signal.senderEmail,
    senderRole: signal.senderRole,
    displayName:
      typeof payload.displayName === "string" && payload.displayName.trim()
        ? payload.displayName.trim()
        : signal.senderEmail,
    activity:
      payload.activity === "editing" ||
      payload.activity === "chatting" ||
      payload.activity === "reviewing"
        ? payload.activity
        : "reviewing",
    isTyping: payload.isTyping === true,
    cursorLine: toNumberOrNull(payload.cursorLine),
    cursorColumn: toNumberOrNull(payload.cursorColumn),
    selectionStartLine: toNumberOrNull(payload.selectionStartLine),
    selectionStartColumn: toNumberOrNull(payload.selectionStartColumn),
    selectionEndLine: toNumberOrNull(payload.selectionEndLine),
    selectionEndColumn: toNumberOrNull(payload.selectionEndColumn),
    lastSeenAt: signal.sentAt
  };
}

export function useSessionRealtime({
  sessionId,
  token,
  currentUserId,
  currentUserDisplayName,
  initialMessages,
  initialCode,
  onSignal,
  enabled = true
}: UseSessionRealtimeArgs) {
  const clientRef = useRef<Client | null>(null);
  const codeRef = useRef(initialCode);
  const presenceStateRef = useRef<PresenceStateSnapshot>(DEFAULT_PRESENCE_STATE);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [code, setCode] = useState(initialCode);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, ParticipantPresence>>({});
  const [connectionState, setConnectionState] =
    useState<RealtimeConnectionState>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastCodeSyncedAt, setLastCodeSyncedAt] = useState<string | null>(null);
  const [isCodeSyncPending, setIsCodeSyncPending] = useState(false);
  const pendingCodeSyncRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setCode(initialCode);
    codeRef.current = initialCode;
    setLastCodeSyncedAt(null);
    setIsCodeSyncPending(false);
    pendingCodeSyncRef.current = false;
  }, [initialCode, sessionId]);

  useEffect(() => {
    setPresenceByUserId({});
    presenceStateRef.current = DEFAULT_PRESENCE_STATE;
  }, [sessionId]);

  const handleSignalEvent = useEffectEvent((signal: SignalMessage) => {
    onSignal?.(signal);
  });

  const publishCodeNow = useEffectEvent((nextCode: string) => {
    if (!clientRef.current?.connected || !sessionId) {
      return false;
    }

    clientRef.current.publish({
      destination: "/app/code.sync",
      body: JSON.stringify({
        sessionId,
        code: nextCode
      })
    });

    return true;
  });

  const publishPresenceNow = useEffectEvent((snapshot: PresenceStateSnapshot) => {
    if (!clientRef.current?.connected || !sessionId) {
      return false;
    }

    clientRef.current.publish({
      destination: "/app/signal.send",
      body: JSON.stringify({
        sessionId,
        signalType: "PRESENCE_STATE",
        payload: {
          ...snapshot,
          displayName: currentUserDisplayName?.trim() || "Participant"
        },
        clientTimestamp: new Date().toISOString()
      })
    });

    return true;
  });

  const publishCode = useDebouncedCallback((nextCode: string) => {
    publishCodeNow(nextCode);
  }, 250);

  const publishPresence = useDebouncedCallback((snapshot: PresenceStateSnapshot) => {
    publishPresenceNow(snapshot);
  }, 120);

  useEffect(() => {
    if (!enabled || !sessionId || !token || !currentUserId) {
      if (!enabled && connectionState !== "idle") {
        setConnectionState("idle");
      }
      return;
    }

    setConnectionState("connecting");
    setLastError(null);

    const client = new Client({
      reconnectDelay: 3000,
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      webSocketFactory: () => new SockJS(WS_URL),
      onConnect: () => {
        setConnectionState("connected");
        setLastError(null);

        client.subscribe(`/topic/sessions/${sessionId}/chat`, (frame) => {
          const nextMessage = JSON.parse(frame.body) as ChatMessage;
          setMessages((current) =>
            current.some((message) => message.id === nextMessage.id)
              ? current
              : [...current, nextMessage]
          );
        });

        client.subscribe(`/topic/sessions/${sessionId}/code`, (frame) => {
          const nextMessage = JSON.parse(frame.body) as CodeSyncMessage;
          if (nextMessage.senderId === currentUserId) {
            setLastCodeSyncedAt(nextMessage.updatedAt);
            setIsCodeSyncPending(false);
            pendingCodeSyncRef.current = false;
            return;
          }

          codeRef.current = nextMessage.code;
          setCode(nextMessage.code);
          setLastCodeSyncedAt(nextMessage.updatedAt);
        });

        client.subscribe(`/topic/sessions/${sessionId}/signal`, (frame) => {
          const nextSignal = JSON.parse(frame.body) as SignalMessage;
          if (nextSignal.senderId === currentUserId) {
            return;
          }

          if (nextSignal.signalType === "PRESENCE_STATE") {
            const nextPresence = normalizePresenceSignal(nextSignal);
            setPresenceByUserId((current) => ({
              ...current,
              [nextPresence.senderId]: nextPresence
            }));
            return;
          }

          handleSignalEvent(nextSignal);
        });

        if (pendingCodeSyncRef.current) {
          publishCodeNow(codeRef.current);
        }

        publishPresenceNow(presenceStateRef.current);
      },
      onDisconnect: () => {
        setConnectionState("disconnected");
      },
      onStompError: (frame) => {
        setConnectionState("error");
        setLastError(frame.headers.message ?? "Realtime channel error");
      },
      onWebSocketClose: () => {
        setConnectionState("disconnected");
      },
      onWebSocketError: () => {
        setConnectionState("error");
        setLastError("WebSocket connection failed");
      }
    });

    clientRef.current = client;
    client.activate();

    return () => {
      void client.deactivate();
      clientRef.current = null;
    };
  }, [currentUserDisplayName, currentUserId, enabled, sessionId, token]);

  useEffect(() => {
    if (!enabled || !sessionId || !token || !currentUserId) {
      return;
    }

    const heartbeat = window.setInterval(() => {
      publishPresenceNow(presenceStateRef.current);
    }, 5000);

    return () => window.clearInterval(heartbeat);
  }, [currentUserId, enabled, sessionId, token]);

  useEffect(() => {
    const cleanup = window.setInterval(() => {
      setPresenceByUserId((current) => {
        const activeEntries = Object.entries(current).filter(([, value]) => {
          return Date.now() - new Date(value.lastSeenAt).getTime() < 15000;
        });

        return Object.fromEntries(activeEntries);
      });
    }, 4000);

    return () => window.clearInterval(cleanup);
  }, []);

  const sendChat = useCallback(
    (input: string | SendChatInput) => {
      if (!clientRef.current?.connected || !sessionId) {
        return false;
      }

      const payload =
        typeof input === "string"
          ? { content: input }
          : input;

      if (!payload.content?.trim() && !payload.snippetCode?.trim()) {
        return false;
      }

      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          sessionId,
          content: payload.content?.trim() || undefined,
          snippetTitle: payload.snippetTitle?.trim() || undefined,
          snippetLanguage: payload.snippetLanguage?.trim() || undefined,
          snippetCode: payload.snippetCode ?? undefined
        })
      });

      const nextPresenceState = {
        ...presenceStateRef.current,
        activity: "chatting" as const,
        isTyping: false
      };
      presenceStateRef.current = nextPresenceState;
      publishPresenceNow(nextPresenceState);
      return true;
    },
    [sessionId]
  );

  const updateCodeFromUser = useCallback(
    (nextCode: string | undefined) => {
      if (typeof nextCode !== "string") {
        return;
      }

      codeRef.current = nextCode;
      setCode(nextCode);
      setIsCodeSyncPending(true);
      pendingCodeSyncRef.current = true;
      publishCode(nextCode);
    },
    [publishCode]
  );

  const updatePresence = useCallback(
    (draft: PresenceDraft, options?: { immediate?: boolean }) => {
      const nextPresenceState: PresenceStateSnapshot = {
        ...presenceStateRef.current,
        ...draft
      };

      presenceStateRef.current = nextPresenceState;

      if (options?.immediate) {
        publishPresenceNow(nextPresenceState);
        return;
      }

      publishPresence(nextPresenceState);
    },
    [publishPresence]
  );

  const sendSignal = useCallback(
    (signalType: SignalType, payload: Record<string, unknown> = {}) => {
      if (!clientRef.current?.connected || !sessionId) {
        return;
      }

      clientRef.current.publish({
        destination: "/app/signal.send",
        body: JSON.stringify({
          sessionId,
          signalType,
          payload,
          clientTimestamp: new Date().toISOString()
        })
      });
    },
    [sessionId]
  );

  const presence = useMemo(
    () =>
      Object.values(presenceByUserId).sort(
        (left, right) =>
          new Date(right.lastSeenAt).getTime() - new Date(left.lastSeenAt).getTime()
      ),
    [presenceByUserId]
  );

  return {
    messages,
    code,
    presence,
    connectionState,
    lastError,
    lastCodeSyncedAt,
    isCodeSyncPending,
    sendChat,
    updateCodeFromUser,
    updatePresence,
    sendSignal,
    setMessages,
    setCode
  };
}
