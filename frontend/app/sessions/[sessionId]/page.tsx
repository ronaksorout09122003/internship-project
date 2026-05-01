"use client";

import Link from "next/link";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ChatPanel } from "@/components/room/chat-panel";
import { CodeEditorPanel } from "@/components/room/code-editor-panel";
import { ReconnectBanner } from "@/components/room/reconnect-banner";
import { SessionSidebar } from "@/components/room/session-sidebar";
import { VideoPanel } from "@/components/room/video-panel";
import { AvatarBadge } from "@/components/ui/avatar-badge";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/textarea-field";
import { useAuth } from "@/hooks/use-auth";
import { useSessionRealtime } from "@/hooks/use-session-realtime";
import { useWebRTC } from "@/hooks/use-webrtc";
import {
  endSession,
  getMessages,
  getSession,
  joinSession,
  updateSession
} from "@/services/session-service";
import type { ChatMessage, SignalMessage } from "@/types/realtime";
import type { Session } from "@/types/session";
import { getApiErrorMessage } from "@/utils/api-error";
import { formatDuration, formatSessionDate } from "@/utils/format";
import {
  clearStoredRoomDraft,
  getStoredRoomDraft,
  setStoredRoomDraft
} from "@/utils/storage";
import {
  buildInviteClipboardText,
  buildStarterCode,
  downloadSessionCalendar,
  getDifficultyLabel,
  getLanguageLabel,
  getTemplateLabel
} from "@/utils/session-options";

type PageErrorState = "forbidden" | "not-found" | "generic" | null;
type CodeRecoveryDraft = { code: string; updatedAt: string | null } | null;

export default function SessionRoomPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const sessionId = params.sessionId;
  const [session, setSession] = useState<Session | null>(null);
  const [seedMessages, setSeedMessages] = useState<ChatMessage[]>([]);
  const [seedCode, setSeedCode] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [pageError, setPageError] = useState<PageErrorState>(null);
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [localCodeRecovery, setLocalCodeRecovery] = useState<CodeRecoveryDraft>(null);
  const [mentorWorkspaceDraft, setMentorWorkspaceDraft] = useState({
    mentorNotes: "",
    homework: "",
    resourceLinks: "",
    nextSteps: ""
  });
  const [feedbackDraft, setFeedbackDraft] = useState({
    studentRating: 0,
    studentFeedback: ""
  });
  const joinAttemptedRef = useRef(false);
  const signalHandlerRef = useRef<(signal: SignalMessage) => void>(() => undefined);
  const sessionEndedRef = useRef(false);

  useEffect(() => {
    joinAttemptedRef.current = false;
    sessionEndedRef.current = false;
    setSession(null);
    setSeedMessages([]);
    setSeedCode("");
    setChatDraft("");
    setLocalCodeRecovery(null);
    setMentorWorkspaceDraft({
      mentorNotes: "",
      homework: "",
      resourceLinks: "",
      nextSteps: ""
    });
    setFeedbackDraft({
      studentRating: 0,
      studentFeedback: ""
    });
    setPageError(null);
    setPageErrorMessage(null);
  }, [sessionId]);

  const onSignal = useCallback((signal: SignalMessage) => {
    signalHandlerRef.current(signal);
  }, []);

  const realtime = useSessionRealtime({
    sessionId,
    token,
    currentUserId: user?.id ?? null,
    currentUserDisplayName: user?.displayName ?? null,
    initialMessages: seedMessages,
    initialCode: seedCode,
    onSignal,
    enabled: !!session
  });

  const webRtc = useWebRTC({
    session,
    currentUser: user,
    isRealtimeConnected: realtime.connectionState === "connected",
    sendSignal: realtime.sendSignal
  });

  useEffect(() => {
    signalHandlerRef.current = webRtc.handleSignal;
  }, [webRtc.handleSignal]);

  useEffect(() => {
    if (!session) {
      return;
    }

    realtime.updatePresence(
      {
        activity: "reviewing",
        isTyping: false
      },
      { immediate: true }
    );
  }, [session?.id, realtime.connectionState]);

  const hydrateRoom = useEffectEvent(async () => {
    if (!user || !token) {
      return;
    }

    setIsLoading(true);
    try {
      let roomSession: Session;

      try {
        roomSession = await getSession(sessionId);
      } catch (error) {
        if (
          user.role === "STUDENT" &&
          !joinAttemptedRef.current &&
          (error as { response?: { status?: number } }).response?.status === 403
        ) {
          joinAttemptedRef.current = true;
          roomSession = await joinSession(sessionId);
        } else {
          throw error;
        }
      }

      const history = await getMessages(sessionId);
      const roomDraft = getStoredRoomDraft(sessionId);
      setSession(roomSession);
      setSeedMessages(history);
      setSeedCode(roomSession.latestCode);
      setChatDraft(roomDraft.chatDraft);
      setLocalCodeRecovery(
        roomDraft.codeDraft && roomDraft.codeDraft !== roomSession.latestCode
          ? {
              code: roomDraft.codeDraft,
              updatedAt: roomDraft.codeDraftUpdatedAt
            }
          : null
      );
      setPageError(null);
      setPageErrorMessage(null);
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status;
      setPageError(status === 403 ? "forbidden" : status === 404 ? "not-found" : "generic");
      setPageErrorMessage(getApiErrorMessage(error, "Unable to open this session room."));
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!user || !token) {
      setIsLoading(false);
      return;
    }

    void hydrateRoom();
  }, [isAuthLoading, sessionId, token, user]);

  useEffect(() => {
    if (!session || !token) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const latest = await getSession(session.id);
        setSession(latest);
      } catch {
        // Keep the room usable even if a single refresh attempt fails.
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [session, token]);

  useEffect(() => {
    if (!session) {
      return;
    }

    setMentorWorkspaceDraft({
      mentorNotes: session.mentorNotes ?? "",
      homework: session.homework ?? "",
      resourceLinks: session.resourceLinks ?? "",
      nextSteps: session.nextSteps ?? ""
    });
    setFeedbackDraft({
      studentRating: session.studentRating ?? 0,
      studentFeedback: session.studentFeedback ?? ""
    });
  }, [session?.id]);

  useEffect(() => {
    if (!sessionId || !session || isLoading) {
      return;
    }

    setStoredRoomDraft(sessionId, {
      chatDraft,
      codeDraft: localCodeRecovery?.code ?? realtime.code,
      codeDraftUpdatedAt: localCodeRecovery?.updatedAt ?? new Date().toISOString()
    });
  }, [chatDraft, isLoading, localCodeRecovery, realtime.code, session, sessionId]);

  useEffect(() => {
    if (!session || session.status === "ENDED") {
      return;
    }

    const hasPendingDrafts =
      Boolean(chatDraft.trim()) || Boolean(localCodeRecovery) || realtime.isCodeSyncPending;

    if (!hasPendingDrafts) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [chatDraft, localCodeRecovery, realtime.isCodeSyncPending, session]);

  useEffect(() => {
    if (session?.status === "ENDED" && !sessionEndedRef.current) {
      sessionEndedRef.current = true;
      toast.info("This session has ended. Collaboration is now read-only.");
      webRtc.leaveCall();
    }
  }, [session?.status, webRtc]);

  const handleEndSession = async () => {
    if (!session) {
      return;
    }

    const shouldEndSession = window.confirm(
      "End this session for both participants? The room will become read-only."
    );
    if (!shouldEndSession) {
      return;
    }

    try {
      setIsEndingSession(true);
      const updated = await endSession(session.id);
      setSession(updated);
      clearStoredRoomDraft(session.id);
      toast.success("Session ended successfully.");
      webRtc.leaveCall();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to end the session."));
    } finally {
      setIsEndingSession(false);
    }
  };

  const handleLeaveRoom = () => {
    if (!session) {
      router.push("/dashboard");
      return;
    }

    const hasPendingDrafts =
      Boolean(chatDraft.trim()) || Boolean(localCodeRecovery) || realtime.isCodeSyncPending;

    if (
      hasPendingDrafts &&
      !window.confirm("Leave the room and keep your local recovery draft for later?")
    ) {
      return;
    }

    webRtc.leaveCall();
    router.push("/dashboard");
  };

  const handleCopyLink = async () => {
    if (!session) {
      return;
    }

    try {
      await navigator.clipboard.writeText(buildInviteClipboardText(session));
      toast.success("Session link and code copied to your clipboard.");
    } catch {
      toast.error("Copy failed. Please copy the room URL directly from your browser.");
    }
  };

  const handleDownloadCalendar = () => {
    if (!session) {
      return;
    }

    if (!downloadSessionCalendar(session)) {
      toast.error("Add a schedule before exporting this session to calendar.");
      return;
    }

    toast.success("Calendar file downloaded.");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(realtime.code);
      toast.success("Code snapshot copied.");
    } catch {
      toast.error("Unable to copy the current code snapshot.");
    }
  };

  const handleDownloadCode = () => {
    if (!session) {
      return;
    }

    const blob = new Blob([realtime.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedTopic = session.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `${sanitizedTopic || "mentora-session"}-${session.id.slice(0, 8)}.ts`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Code snapshot downloaded.");
  };

  const handleShareCodeSelection = (payload: {
    code: string;
    title: string;
    language: Session["language"];
  }) => {
    const sent = realtime.sendChat({
      content: `Shared ${payload.title.toLowerCase()} for discussion.`,
      snippetTitle: payload.title,
      snippetLanguage: getLanguageLabel(payload.language),
      snippetCode: payload.code
    });

    if (!sent) {
      toast.error("Realtime chat is reconnecting. Try sharing the snippet again in a moment.");
      return;
    }

    toast.success("Code snippet shared to the session chat.");
  };

  const handleRestoreLocalCodeDraft = () => {
    if (!sessionId || !localCodeRecovery) {
      return;
    }

    realtime.updateCodeFromUser(localCodeRecovery.code);
    setStoredRoomDraft(sessionId, {
      chatDraft,
      codeDraft: localCodeRecovery.code,
      codeDraftUpdatedAt: new Date().toISOString()
    });
    setLocalCodeRecovery(null);
    toast.success("Recovered browser draft restored to the editor.");
  };

  const handleDismissLocalCodeDraft = () => {
    if (!sessionId) {
      return;
    }

    setStoredRoomDraft(sessionId, {
      chatDraft,
      codeDraft: realtime.code,
      codeDraftUpdatedAt: new Date().toISOString()
    });
    setLocalCodeRecovery(null);
    toast.success("Browser recovery draft dismissed.");
  };

  const handlePersistLanguage = async (language: Session["language"]) => {
    if (!session || user?.role !== "MENTOR") {
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const updated = await updateSession(session.id, { language });
      setSession(updated);
      toast.success("Editor language updated for this room.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to update the editor language."));
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleLoadStarterTemplate = async (templateKey: string) => {
    if (!session || user?.role !== "MENTOR") {
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const updated = await updateSession(session.id, {
        language: session.language,
        templateKey
      });
      setSession(updated);
      realtime.updateCodeFromUser(
        buildStarterCode({
          topic: updated.topic,
          language: updated.language,
          templateKey: updated.templateKey
        })
      );
      toast.success("Starter template loaded into the shared editor.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to load the starter template."));
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleSaveMentorWorkspace = async () => {
    if (!session || user?.role !== "MENTOR") {
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const updated = await updateSession(session.id, {
        mentorNotes: mentorWorkspaceDraft.mentorNotes,
        homework: mentorWorkspaceDraft.homework,
        resourceLinks: mentorWorkspaceDraft.resourceLinks,
        nextSteps: mentorWorkspaceDraft.nextSteps
      });
      setSession(updated);
      setMentorWorkspaceDraft({
        mentorNotes: updated.mentorNotes ?? "",
        homework: updated.homework ?? "",
        resourceLinks: updated.resourceLinks ?? "",
        nextSteps: updated.nextSteps ?? ""
      });
      toast.success("Session notes and follow-up saved.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the session workspace."));
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!session || user?.role !== "STUDENT" || feedbackDraft.studentRating < 1) {
      toast.error("Select a rating before submitting feedback.");
      return;
    }

    setIsSavingWorkspace(true);
    try {
      const updated = await updateSession(session.id, {
        studentRating: feedbackDraft.studentRating,
        studentFeedback: feedbackDraft.studentFeedback
      });
      setSession(updated);
      setFeedbackDraft({
        studentRating: updated.studentRating ?? 0,
        studentFeedback: updated.studentFeedback ?? ""
      });
      toast.success("Feedback submitted.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to submit feedback."));
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const sendChatMessage = (message: string) => {
    const sent = realtime.sendChat(message);
    if (!sent) {
      toast.error("Realtime chat is reconnecting. Try again in a moment.");
      return false;
    }

    return true;
  };

  if (!user) {
    return <AuthGuard>{null}</AuthGuard>;
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
          <div className="card-surface rounded-[2rem] px-8 py-6 text-sm font-medium text-slate-600">
            Loading session room...
          </div>
        </main>
      </AuthGuard>
    );
  }

  if (pageError || !session) {
    return (
      <AuthGuard>
        <main className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
          <section className="card-surface soft-appear w-full max-w-2xl rounded-[2rem] p-10 text-center">
            <div className="mb-8 flex justify-center">
              <BrandMark />
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              {pageError === "forbidden"
                ? "Private room"
                : pageError === "not-found"
                  ? "Missing room"
                  : "Load error"}
            </p>
            <h1 className="display-font text-4xl font-bold text-slate-950">
              {pageError === "forbidden"
                ? "You are not a participant in this room."
                : pageError === "not-found"
                  ? "This session could not be found."
                  : "We could not open the collaboration room."}
            </h1>
            <p className="mt-4 text-base text-slate-600">
              {pageErrorMessage ?? "Try again from the dashboard or verify the shared link."}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button>Back to dashboard</Button>
              </Link>
            </div>
          </section>
        </main>
      </AuthGuard>
    );
  }

  const sessionEnded = session.status === "ENDED";
  const remotePresence = realtime.presence;
  const chatSendDisabled =
    sessionEnded || realtime.connectionState !== "connected";
  const chatStatusMessage = sessionEnded
    ? "This session has ended. Messages are read-only."
    : realtime.connectionState === "connected"
      ? "Shift + Enter for a new line. Share editor selections straight into the conversation."
      : "Keep typing while reconnecting. Your draft stays here until send is available again.";
  const canMentorControlRemoteMedia =
    user.role === "MENTOR" && Boolean(session.student);
  const remoteParticipantLabel =
    user.role === "MENTOR"
      ? session.student?.displayName ?? "Student"
      : session.mentor.displayName;

  return (
    <AuthGuard>
      <main className="page-shell min-h-screen px-6 py-8">
        <section className="mx-auto flex max-w-[1600px] flex-col gap-6">
          <header className="card-surface ambient-border soft-appear flex flex-col gap-4 rounded-[2rem] p-5 lg:flex-row lg:items-center lg:justify-between">
            <BrandMark />
            <div className="flex flex-col gap-3 lg:items-end">
              <p className="section-kicker">Private mentoring room</p>
              <h1 className="display-font text-3xl font-bold text-slate-950">
                {session.topic}
              </h1>
              <p className="text-sm text-slate-600">
                {getLanguageLabel(session.language)} | {getDifficultyLabel(session.difficulty)} | {formatSessionDate(session.scheduledAt)} | {formatDuration(session.durationMinutes)}
              </p>
            </div>
          </header>

          <ReconnectBanner
            isVisible={
              realtime.connectionState === "disconnected" ||
              realtime.connectionState === "error"
            }
            error={realtime.lastError}
          />

          <section className="grid gap-6 xl:grid-cols-[1.45fr_360px]">
            <VideoPanel
              localVideoRef={webRtc.localVideoRef}
              remoteVideoRef={webRtc.remoteVideoRef}
              callState={webRtc.callState}
              mediaError={webRtc.mediaError}
              localMediaState={webRtc.localMediaState}
              remoteMediaState={webRtc.remoteMediaState}
              remoteParticipantLabel={remoteParticipantLabel}
              canControlRemoteMedia={canMentorControlRemoteMedia}
              controlsDisabled={sessionEnded}
              onReconnect={webRtc.reconnectCall}
              onLeaveCall={webRtc.leaveCall}
              onToggleMicrophone={webRtc.toggleMicrophone}
              onToggleCamera={webRtc.toggleCamera}
              onToggleScreenShare={webRtc.toggleScreenShare}
              onSetRemoteMicrophoneEnabled={webRtc.setRemoteMicrophoneEnabled}
              onSetRemoteCameraEnabled={webRtc.setRemoteCameraEnabled}
            />
            <SessionSidebar
              session={session}
              currentUserId={user.id}
              connectionState={realtime.connectionState}
              presence={remotePresence}
              isEndingSession={isEndingSession}
              onCopyLink={handleCopyLink}
              onDownloadCalendar={handleDownloadCalendar}
              onLeave={handleLeaveRoom}
              onEndSession={handleEndSession}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
            <CodeEditorPanel
              code={realtime.code}
              onChange={realtime.updateCodeFromUser}
              connectionState={realtime.connectionState}
              lastCodeSyncedAt={realtime.lastCodeSyncedAt}
              isCodeSyncPending={realtime.isCodeSyncPending}
              recoveryDraftUpdatedAt={localCodeRecovery?.updatedAt}
              onRestoreDraft={handleRestoreLocalCodeDraft}
              onDismissDraft={handleDismissLocalCodeDraft}
              onCopyCode={handleCopyCode}
              onDownloadCode={handleDownloadCode}
              language={session.language}
              templateKey={session.templateKey}
              remotePresence={remotePresence}
              canManageWorkspace={user.role === "MENTOR" && !sessionEnded}
              isSavingWorkspaceSettings={isSavingWorkspace}
              onPersistLanguage={handlePersistLanguage}
              onLoadStarterTemplate={handleLoadStarterTemplate}
              onPresenceUpdate={realtime.updatePresence}
              onShareSelection={handleShareCodeSelection}
              disabled={sessionEnded}
            />
            <ChatPanel
              messages={realtime.messages}
              currentUserId={user.id}
              draft={chatDraft}
              draftDisabled={sessionEnded}
              sendDisabled={chatSendDisabled}
              statusMessage={chatStatusMessage}
              onDraftChange={setChatDraft}
              onSend={sendChatMessage}
              onTypingChange={(isTyping) =>
                realtime.updatePresence(
                  isTyping
                    ? {
                        activity: "chatting",
                        isTyping: true
                      }
                    : {
                        isTyping: false
                      },
                  { immediate: !isTyping }
                )
              }
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="card-surface ambient-border rounded-[2rem] p-6">
              <p className="section-kicker">Session outcomes</p>
              <h2 className="display-font mt-2 text-2xl font-bold text-slate-950">
                Notes, homework, and follow-up
              </h2>
              <div className="mt-6 grid gap-4">
                <TextareaField
                  label="Mentor notes"
                  value={mentorWorkspaceDraft.mentorNotes}
                  onChange={(event) =>
                    setMentorWorkspaceDraft((current) => ({
                      ...current,
                      mentorNotes: event.target.value
                    }))
                  }
                  disabled={user.role !== "MENTOR"}
                />
                <TextareaField
                  label="Homework"
                  value={mentorWorkspaceDraft.homework}
                  onChange={(event) =>
                    setMentorWorkspaceDraft((current) => ({
                      ...current,
                      homework: event.target.value
                    }))
                  }
                  disabled={user.role !== "MENTOR"}
                />
                <TextareaField
                  label="Resource links"
                  value={mentorWorkspaceDraft.resourceLinks}
                  onChange={(event) =>
                    setMentorWorkspaceDraft((current) => ({
                      ...current,
                      resourceLinks: event.target.value
                    }))
                  }
                  disabled={user.role !== "MENTOR"}
                />
                <TextareaField
                  label="Next steps"
                  value={mentorWorkspaceDraft.nextSteps}
                  onChange={(event) =>
                    setMentorWorkspaceDraft((current) => ({
                      ...current,
                      nextSteps: event.target.value
                    }))
                  }
                  disabled={user.role !== "MENTOR"}
                />
                {user.role === "MENTOR" ? (
                  <Button onClick={handleSaveMentorWorkspace} disabled={isSavingWorkspace}>
                    {isSavingWorkspace ? "Saving..." : "Save follow-up"}
                  </Button>
                ) : (
                  <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600 ring-1 ring-slate-200">
                    Students can review these notes after the mentor saves them.
                  </div>
                )}
              </div>
            </article>

            <article className="card-surface ambient-border rounded-[2rem] p-6">
              <p className="section-kicker">Session context</p>
              <h2 className="display-font mt-2 text-2xl font-bold text-slate-950">
                People, goals, and feedback
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[session.mentor, session.student].filter(Boolean).map((participant) => (
                  <div key={participant!.id} className="rounded-[1.6rem] bg-white/84 p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-3">
                      <AvatarBadge name={participant!.displayName} tone={participant!.id === session.mentor.id ? "accent" : "neutral"} />
                      <div>
                        <p className="font-semibold text-slate-950">{participant!.displayName}</p>
                        <p className="text-sm text-slate-600">{participant!.email}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{participant!.headline ?? participant!.role}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.6rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-950">Session setup</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">Starter: {getTemplateLabel(session.templateKey)}</p>
                <p className="text-sm leading-7 text-slate-600">Student goal: {session.studentGoal ?? "Aligned live collaboration"}</p>
                <p className="text-sm leading-7 text-slate-600">Agenda: {session.agenda ?? "No written agenda yet."}</p>
              </div>

              <div className="mt-6 rounded-[1.6rem] bg-white/84 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-950">Student feedback</p>
                <div className="mt-4 flex gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        user.role === "STUDENT" &&
                        setFeedbackDraft((current) => ({
                          ...current,
                          studentRating: value
                        }))
                      }
                      className={`rounded-2xl px-3 py-2 text-sm font-semibold ${feedbackDraft.studentRating >= value ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}
                      disabled={user.role !== "STUDENT"}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <TextareaField
                  label="Feedback"
                  value={feedbackDraft.studentFeedback}
                  onChange={(event) =>
                    setFeedbackDraft((current) => ({
                      ...current,
                      studentFeedback: event.target.value
                    }))
                  }
                  disabled={user.role !== "STUDENT"}
                  className="mt-4"
                />
                {user.role === "STUDENT" ? (
                  <Button className="mt-4" onClick={handleSubmitFeedback} disabled={isSavingWorkspace}>
                    {isSavingWorkspace ? "Submitting..." : "Submit feedback"}
                  </Button>
                ) : session.studentRating ? (
                  <p className="mt-4 text-sm text-slate-600">
                    Feedback received: {session.studentRating}/5. {session.studentFeedback ?? ""}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">
                    The student has not submitted feedback yet.
                  </p>
                )}
              </div>
            </article>
          </section>
        </section>
      </main>
    </AuthGuard>
  );
}
