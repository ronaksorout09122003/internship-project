"use client";

import { useEffect, useRef } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { ChatMessage } from "@/types/realtime";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUserId: string;
  draft: string;
  draftDisabled?: boolean;
  sendDisabled?: boolean;
  statusMessage?: string;
  onDraftChange: (value: string) => void;
  onSend: (message: string) => boolean;
}

export function ChatPanel({
  messages,
  currentUserId,
  draft,
  draftDisabled = false,
  sendDisabled = false,
  statusMessage,
  onDraftChange,
  onSend
}: ChatPanelProps) {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages.length]);

  const submitDraft = () => {
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || sendDisabled) {
      return;
    }

    const sent = onSend(trimmedDraft);
    if (sent) {
      onDraftChange("");
    }
  };

  return (
    <section className="card-surface flex min-h-[420px] flex-col rounded-[2rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Live Chat
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
            Session conversation
          </h2>
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
          {draft.trim() ? "Draft saved locally" : "Ready to send"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            Messages exchanged during the session will appear here.
          </div>
        ) : null}

        {messages.map((message) => {
          const ownMessage = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                "rounded-3xl px-4 py-3",
                ownMessage
                  ? "ml-10 bg-slate-950 text-white"
                  : "mr-10 bg-white/90 text-slate-900 ring-1 ring-slate-200"
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                  {message.senderRole}
                </span>
                <span className="text-xs opacity-70">
                  {formatRelativeTime(message.createdAt)}
                </span>
              </div>
              <p className="text-sm leading-6">{message.content}</p>
            </div>
          );
        })}
        <div ref={endOfMessagesRef} />
      </div>

      <form
        className="mt-4 flex gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          submitDraft();
        }}
      >
        <textarea
          rows={2}
          maxLength={2000}
          className="min-h-[72px] flex-1 resize-none rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          placeholder="Send a note, hint, or explanation..."
          value={draft}
          disabled={draftDisabled}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitDraft();
            }
          }}
        />
        <Button
          type="submit"
          disabled={sendDisabled || !draft.trim()}
          className="self-end rounded-3xl px-5 py-3"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
      <div className="mt-2 flex items-center justify-between px-1 text-xs text-slate-500">
        <span>{statusMessage ?? "Shift + Enter for a new line"}</span>
        <span>{draft.length}/2000</span>
      </div>
    </section>
  );
}
