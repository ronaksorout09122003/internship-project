"use client";

import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { WS_URL } from "@/lib/constants";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type {
  ChatMessage,
  CodeSyncMessage,
  RealtimeConnectionState,
  SignalMessage,
  SignalType
} from "@/types/realtime";

interface UseSessionRealtimeArgs {
  sessionId: string | null;
  token: string | null;
  currentUserId: string | null;
  initialMessages: ChatMessage[];
  initialCode: string;
  onSignal?: (signal: SignalMessage) => void;
  enabled?: boolean;
}

export function useSessionRealtime({
  sessionId,
  token,
  currentUserId,
  initialMessages,
  initialCode,
  onSignal,
  enabled = true
}: UseSessionRealtimeArgs) {
  const clientRef = useRef<Client | null>(null);
  const codeRef = useRef(initialCode);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [code, setCode] = useState(initialCode);
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

  const publishCode = useDebouncedCallback((nextCode: string) => {
    publishCodeNow(nextCode);
  }, 250);

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

          handleSignalEvent(nextSignal);
        });

        if (pendingCodeSyncRef.current) {
          publishCodeNow(codeRef.current);
        }
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
  }, [currentUserId, enabled, sessionId, token]);

  const sendChat = useCallback(
    (content: string) => {
      if (!clientRef.current?.connected || !sessionId) {
        return false;
      }

      clientRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({
          sessionId,
          content
        })
      });
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

  return {
    messages,
    code,
    connectionState,
    lastError,
    lastCodeSyncedAt,
    isCodeSyncPending,
    sendChat,
    updateCodeFromUser,
    sendSignal,
    setMessages,
    setCode
  };
}
