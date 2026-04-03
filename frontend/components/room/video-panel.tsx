"use client";

import type { RefObject } from "react";
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  RefreshCcw,
  Video,
  VideoOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { ParticipantMediaState } from "@/types/realtime";

interface VideoPanelProps {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  callState: "waiting" | "calling" | "connected" | "disconnected";
  mediaError: string | null;
  localMediaState: ParticipantMediaState;
  remoteMediaState: ParticipantMediaState | null;
  remoteParticipantLabel: string;
  canControlRemoteMedia: boolean;
  controlsDisabled?: boolean;
  onReconnect: () => void;
  onLeaveCall: () => void;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onSetRemoteMicrophoneEnabled: (enabled: boolean) => void;
  onSetRemoteCameraEnabled: (enabled: boolean) => void;
}

export function VideoPanel({
  localVideoRef,
  remoteVideoRef,
  callState,
  mediaError,
  localMediaState,
  remoteMediaState,
  remoteParticipantLabel,
  canControlRemoteMedia,
  controlsDisabled = false,
  onReconnect,
  onLeaveCall,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
  onSetRemoteMicrophoneEnabled,
  onSetRemoteCameraEnabled
}: VideoPanelProps) {
  const remoteMicrophoneEnabled = remoteMediaState?.isMicrophoneEnabled !== false;
  const remoteCameraEnabled = remoteMediaState?.isCameraEnabled !== false;
  const remoteScreenSharing = remoteMediaState?.isScreenSharing === true;
  const showRemotePlaceholder =
    callState !== "connected" || (!remoteCameraEnabled && !remoteScreenSharing);

  const localMicrophoneActionLabel = localMediaState.isMicrophoneEnabled
    ? "Mute mic"
    : "Unmute mic";
  const localCameraActionLabel = localMediaState.isScreenSharing
    ? localMediaState.isCameraEnabled
      ? "Pause share"
      : "Resume share"
    : localMediaState.isCameraEnabled
      ? "Stop camera"
      : "Start camera";
  const remoteMicrophoneActionLabel = remoteMicrophoneEnabled
    ? "Mute student"
    : "Unmute student";
  const remoteCameraActionLabel = remoteCameraEnabled
    ? "Stop camera"
    : "Start camera";

  return (
    <section className="card-surface rounded-[2rem] p-5">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Video Room
          </p>
          <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
            1-on-1 call
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={callState} />
          <Button
            variant={localMediaState.isMicrophoneEnabled ? "ghost" : "secondary"}
            onClick={onToggleMicrophone}
            disabled={controlsDisabled || localMediaState.isMicrophoneBlockedByMentor}
          >
            {localMediaState.isMicrophoneEnabled ? (
              <Mic className="mr-2 h-4 w-4" />
            ) : (
              <MicOff className="mr-2 h-4 w-4" />
            )}
            {localMicrophoneActionLabel}
          </Button>
          <Button
            variant={localMediaState.isCameraEnabled ? "ghost" : "secondary"}
            onClick={onToggleCamera}
            disabled={controlsDisabled || localMediaState.isCameraBlockedByMentor}
          >
            {localMediaState.isCameraEnabled ? (
              <Video className="mr-2 h-4 w-4" />
            ) : (
              <VideoOff className="mr-2 h-4 w-4" />
            )}
            {localCameraActionLabel}
          </Button>
          <Button
            variant={localMediaState.isScreenSharing ? "secondary" : "ghost"}
            onClick={onToggleScreenShare}
            disabled={controlsDisabled}
          >
            {localMediaState.isScreenSharing ? (
              <MonitorOff className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            {localMediaState.isScreenSharing ? "Stop sharing" : "Share screen"}
          </Button>
          <Button variant="secondary" onClick={onReconnect} disabled={controlsDisabled}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
          <Button variant="danger" onClick={onLeaveCall} disabled={controlsDisabled}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave call
          </Button>
        </div>
      </div>

      {mediaError ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {mediaError}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-3xl bg-white/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-950">Your call controls</p>
          <p className="mt-1">
            {localMediaState.isMicrophoneBlockedByMentor || localMediaState.isCameraBlockedByMentor
              ? "Some device controls are currently managed by the mentor."
              : localMediaState.isScreenSharing
                ? "Your screen is live in the room. You can pause the outgoing feed or stop sharing at any time."
                : "Mute your mic, pause your camera, share your screen, or leave the call without leaving the room."}
          </p>
        </div>
        <div className="rounded-3xl bg-white/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-950">
            {canControlRemoteMedia ? "Mentor remote controls" : "Remote participant status"}
          </p>
          <p className="mt-1">
            {canControlRemoteMedia
              ? "You can mute the student or pause their camera directly from this panel while still seeing screen sharing status in realtime."
              : "The room reflects the other participant's microphone, camera, and screen-sharing state in realtime."}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="overflow-hidden rounded-[1.75rem] bg-slate-950 p-1 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.9)]">
          <div className="relative flex aspect-video items-center justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_45%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)]">
            <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                {remoteParticipantLabel}
              </span>
              {remoteScreenSharing ? (
                <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-100 ring-1 ring-sky-300/30">
                  Screen sharing
                </span>
              ) : null}
              {!remoteMicrophoneEnabled ? (
                <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-100 ring-1 ring-rose-300/30">
                  Mic muted
                </span>
              ) : null}
              {!remoteCameraEnabled && !remoteScreenSharing ? (
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100 ring-1 ring-amber-300/30">
                  Camera off
                </span>
              ) : null}
            </div>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full rounded-[1.4rem] object-cover"
            />
            {showRemotePlaceholder ? (
              <div className="absolute flex flex-col items-center gap-3 px-6 text-center text-slate-300">
                {remoteCameraEnabled ? (
                  <Video className="h-10 w-10" />
                ) : (
                  <VideoOff className="h-10 w-10" />
                )}
                <p className="text-sm font-medium">
                  {callState !== "connected"
                    ? "Waiting for the other participant's stream..."
                    : "The other participant's camera is currently off."}
                </p>
              </div>
            ) : null}
          </div>

          {canControlRemoteMedia ? (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-4">
              <Button
                variant={remoteMicrophoneEnabled ? "danger" : "secondary"}
                onClick={() => onSetRemoteMicrophoneEnabled(!remoteMicrophoneEnabled)}
                disabled={controlsDisabled}
              >
                {remoteMicrophoneEnabled ? (
                  <MicOff className="mr-2 h-4 w-4" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                {remoteMicrophoneActionLabel}
              </Button>
              <Button
                variant={remoteCameraEnabled ? "danger" : "secondary"}
                onClick={() => onSetRemoteCameraEnabled(!remoteCameraEnabled)}
                disabled={controlsDisabled}
              >
                {remoteCameraEnabled ? (
                  <VideoOff className="mr-2 h-4 w-4" />
                ) : (
                  <Video className="mr-2 h-4 w-4" />
                )}
                {remoteCameraActionLabel}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[1.75rem] bg-slate-100 p-1 ring-1 ring-slate-200">
          <div className="relative flex aspect-video items-center justify-center rounded-[1.5rem] bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)]">
            <div className="absolute left-5 top-5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 ring-1 ring-slate-200">
                You
              </span>
              {localMediaState.isScreenSharing ? (
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 ring-1 ring-sky-200">
                  Screen sharing
                </span>
              ) : null}
              {!localMediaState.isMicrophoneEnabled ? (
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 ring-1 ring-rose-200">
                  {localMediaState.isMicrophoneBlockedByMentor
                    ? "Muted by mentor"
                    : "Mic muted"}
                </span>
              ) : null}
              {!localMediaState.isCameraEnabled && !localMediaState.isScreenSharing ? (
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 ring-1 ring-amber-200">
                  {localMediaState.isCameraBlockedByMentor
                    ? "Camera paused by mentor"
                    : "Camera off"}
                </span>
              ) : null}
            </div>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full rounded-[1.4rem] object-cover"
            />
            {!localMediaState.isCameraEnabled && !localMediaState.isScreenSharing ? (
              <div className="absolute flex flex-col items-center gap-3 px-6 text-center text-slate-500">
                <VideoOff className="h-10 w-10" />
                <p className="text-sm font-medium">
                  {localMediaState.isCameraBlockedByMentor
                    ? "Your camera has been paused by the mentor."
                    : "Your camera is currently off."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
