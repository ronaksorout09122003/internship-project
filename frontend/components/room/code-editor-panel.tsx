"use client";

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Copy, Download, RotateCcw, SendHorizontal, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type {
  ParticipantPresence,
  PresenceDraft,
  RealtimeConnectionState
} from "@/types/realtime";
import type { SessionLanguage } from "@/types/session";
import {
  SESSION_LANGUAGE_OPTIONS,
  SESSION_TEMPLATE_OPTIONS,
  getLanguageMonacoValue
} from "@/utils/session-options";
import { formatRelativeTime } from "@/utils/format";

interface SharedSnippetPayload {
  code: string;
  title: string;
  language: SessionLanguage;
}

interface CodeEditorPanelProps {
  code: string;
  onChange: (value: string | undefined) => void;
  connectionState: RealtimeConnectionState;
  lastCodeSyncedAt: string | null;
  isCodeSyncPending: boolean;
  recoveryDraftUpdatedAt?: string | null;
  onRestoreDraft?: () => void;
  onDismissDraft?: () => void;
  onCopyCode: () => void;
  onDownloadCode: () => void;
  language: SessionLanguage;
  templateKey: string;
  remotePresence?: ParticipantPresence[];
  canManageWorkspace?: boolean;
  isSavingWorkspaceSettings?: boolean;
  onPersistLanguage: (language: SessionLanguage) => void;
  onLoadStarterTemplate: (templateKey: string) => void;
  onPresenceUpdate?: (update: PresenceDraft, options?: { immediate?: boolean }) => void;
  onShareSelection?: (payload: SharedSnippetPayload) => void;
  disabled?: boolean;
}

export function CodeEditorPanel({
  code,
  onChange,
  connectionState,
  lastCodeSyncedAt,
  isCodeSyncPending,
  recoveryDraftUpdatedAt,
  onRestoreDraft,
  onDismissDraft,
  onCopyCode,
  onDownloadCode,
  language,
  templateKey,
  remotePresence = [],
  canManageWorkspace = false,
  isSavingWorkspaceSettings = false,
  onPersistLanguage,
  onLoadStarterTemplate,
  onPresenceUpdate,
  onShareSelection,
  disabled = false
}: CodeEditorPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SessionLanguage>(language);
  const [selectedTemplate, setSelectedTemplate] = useState(templateKey);
  const [selectedSnippet, setSelectedSnippet] = useState<SharedSnippetPayload | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationIdsRef = useRef<string[]>([]);
  const disposablesRef = useRef<Array<{ dispose: () => void }>>([]);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  useEffect(() => {
    setSelectedTemplate(templateKey);
  }, [templateKey]);

  useEffect(() => {
    return () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel?.();

    if (!editor || !monaco || !model) {
      return;
    }

    const lineCount = model.getLineCount();
    const clampLine = (value: number | null) =>
      value == null ? null : Math.min(Math.max(value, 1), lineCount);
    const clampColumn = (line: number, value: number | null) =>
      Math.min(Math.max(value ?? 1, 1), model.getLineMaxColumn(line));

    const nextDecorations = remotePresence.flatMap((presence) => {
      const line = clampLine(presence.cursorLine);
      if (!line) {
        return [];
      }

      const roleClass = presence.senderRole === "MENTOR" ? "mentor" : "student";
      const decorations: Array<{ range: any; options: any }> = [
        {
          range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
          options: {
            isWholeLine: true,
            className: `remote-presence-line-${roleClass}`
          }
        }
      ];

      const startLine = clampLine(presence.selectionStartLine);
      const endLine = clampLine(presence.selectionEndLine);

      if (startLine && endLine) {
        const startColumn = clampColumn(startLine, presence.selectionStartColumn);
        const endColumn = clampColumn(endLine, presence.selectionEndColumn);
        const hasSelection =
          startLine !== endLine || startColumn !== endColumn;

        if (hasSelection) {
          decorations.push({
            range: new monaco.Range(startLine, startColumn, endLine, endColumn),
            options: {
              className: `remote-presence-selection-${roleClass}`
            }
          });
        }
      }

      return decorations;
    });

    decorationIdsRef.current = editor.deltaDecorations(
      decorationIdsRef.current,
      nextDecorations
    );
  }, [code, remotePresence]);

  const updateSelectedSnippet = (editor: any) => {
    const selection = editor.getSelection?.();
    const model = editor.getModel?.();

    if (!selection || !model || selection.isEmpty()) {
      setSelectedSnippet(null);
      return;
    }

    const snippetCode = model.getValueInRange(selection).trimEnd();
    if (!snippetCode.trim()) {
      setSelectedSnippet(null);
      return;
    }

    const title =
      selection.startLineNumber === selection.endLineNumber
        ? `Line ${selection.startLineNumber} excerpt`
        : `Lines ${selection.startLineNumber}-${selection.endLineNumber} excerpt`;

    setSelectedSnippet({
      code: snippetCode,
      title,
      language
    });
  };

  const emitEditorPresence = (editor: any, options?: { immediate?: boolean }) => {
    const selection = editor.getSelection?.();

    onPresenceUpdate?.(
      {
        activity: "editing",
        cursorLine: selection?.endLineNumber ?? null,
        cursorColumn: selection?.endColumn ?? null,
        selectionStartLine: selection?.startLineNumber ?? null,
        selectionStartColumn: selection?.startColumn ?? null,
        selectionEndLine: selection?.endLineNumber ?? null,
        selectionEndColumn: selection?.endColumn ?? null,
        isTyping: false
      },
      options
    );
  };

  const statusCopy = disabled
    ? "This session has ended. The final code snapshot is now read-only."
    : connectionState === "connected"
      ? "Changes are throttled, synced live, and visible with collaborator presence overlays."
      : "You can keep editing locally while realtime reconnects. The latest draft will sync when the room is back.";

  return (
    <section className="card-surface rounded-[2rem] p-5">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="section-kicker">
            Shared editor
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
            Collaborative coding workspace
          </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <StatusPill label={connectionState} />
          <Button variant="secondary" onClick={onCopyCode}>
            <Copy className="mr-2 h-4 w-4" />
            Copy code
          </Button>
          <Button variant="secondary" onClick={onDownloadCode}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            variant="ghost"
            disabled={disabled || connectionState !== "connected" || !selectedSnippet || !onShareSelection}
            onClick={() => selectedSnippet && onShareSelection?.(selectedSnippet)}
          >
            <SendHorizontal className="mr-2 h-4 w-4" />
            Share selection
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-3xl bg-white/75 px-4 py-3 text-xs text-slate-600 ring-1 ring-slate-200">
        <span className="font-semibold uppercase tracking-[0.18em] text-slate-500">
          {isCodeSyncPending
            ? "Sync pending"
            : lastCodeSyncedAt
              ? `Synced ${formatRelativeTime(lastCodeSyncedAt)}`
              : "Ready to sync"}
        </span>
        <span>
          {statusCopy}
        </span>
      </div>

      {remotePresence.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2 rounded-[1.75rem] bg-slate-50/95 px-4 py-4 ring-1 ring-slate-200">
          {remotePresence.map((presence) => (
            <div
              key={presence.senderId}
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
            >
              {presence.displayName}{" "}
              {presence.activity === "editing" && presence.cursorLine
                ? `on line ${presence.cursorLine}`
                : presence.activity}
              {presence.isTyping ? " typing..." : ""}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-4 grid gap-4 rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(15,23,42,0.03),rgba(16,185,129,0.08))] p-4 ring-1 ring-white/70 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end">
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Language
          </span>
          <select
            className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={selectedLanguage}
            onChange={(event) => setSelectedLanguage(event.target.value as SessionLanguage)}
            disabled={!canManageWorkspace || disabled}
          >
            {SESSION_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Starter
          </span>
          <select
            className="rounded-[1.3rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            value={selectedTemplate}
            onChange={(event) => setSelectedTemplate(event.target.value)}
            disabled={!canManageWorkspace || disabled}
          >
            {SESSION_TEMPLATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <Button
          variant="secondary"
          disabled={!canManageWorkspace || disabled || isSavingWorkspaceSettings}
          onClick={() => onPersistLanguage(selectedLanguage)}
          className="px-5 py-3"
        >
          {isSavingWorkspaceSettings ? "Saving..." : "Apply language"}
        </Button>

        <Button
          variant="ghost"
          disabled={!canManageWorkspace || disabled}
          onClick={() => onLoadStarterTemplate(selectedTemplate)}
          className="px-5 py-3"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Load starter
        </Button>
      </div>

      {recoveryDraftUpdatedAt ? (
        <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Browser recovery draft available</p>
            <p className="mt-1 text-amber-800">
              A newer local draft from {formatRelativeTime(recoveryDraftUpdatedAt)} can be restored if you want to recover unsynced work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onRestoreDraft}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore draft
            </Button>
            <Button variant="ghost" onClick={onDismissDraft}>
              <X className="mr-2 h-4 w-4" />
              Dismiss
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
        <Editor
          height="560px"
          language={getLanguageMonacoValue(language)}
          theme="vs-light"
          value={code}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
            updateSelectedSnippet(editor);

            disposablesRef.current.forEach((disposable) => disposable.dispose());
            disposablesRef.current = [
              editor.onDidFocusEditorText(() => {
                onPresenceUpdate?.({ activity: "editing", isTyping: false }, { immediate: true });
              }),
              editor.onDidBlurEditorText(() => {
                onPresenceUpdate?.({ activity: "reviewing", isTyping: false }, { immediate: true });
              }),
              editor.onDidChangeCursorSelection(() => {
                updateSelectedSnippet(editor);
                emitEditorPresence(editor);
              })
            ];
          }}
          onChange={(nextValue) => {
            onChange(nextValue);
            if (editorRef.current) {
              updateSelectedSnippet(editorRef.current);
              emitEditorPresence(editorRef.current);
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            smoothScrolling: true,
            scrollBeyondLastLine: false,
            readOnly: disabled,
            wordWrap: "on",
            automaticLayout: true
          }}
        />
      </div>
    </section>
  );
}
