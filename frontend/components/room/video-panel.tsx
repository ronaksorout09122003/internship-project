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
  hasRemoteVideo: boolean;
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
  hasRemoteVideo,
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
  const effectiveCallState =
    hasRemoteVideo && callState !== "disconnected" ? "connected" : callState;
  const showRemotePlaceholder =
    (!hasRemoteVideo && effectiveCallState !== "connected") ||
    (!remoteCameraEnabled && !remoteScreenSharing);

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
  const callCopy =
    effectiveCallState === "connected"
      ? "Live"
      : effectiveCallState === "calling"
        ? "Connecting"
        : effectiveCallState === "disconnected"
          ? "Reconnection needed"
          : "Waiting";

  return (
    <section className="card-surface rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-kicker">Live classroom</p>
          <h2 className="display-font mt-1 text-2xl font-bold text-slate-950">
            Video and screen share
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={callCopy} />
          <Button variant="secondary" onClick={onReconnect} disabled={controlsDisabled}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reconnect
          </Button>
          <Button variant="danger" onClick={onLeaveCall} disabled={controlsDisabled}>
            <PhoneOff className="mr-2 h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>

      {mediaError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mediaError}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-3xl bg-slate-950 shadow-[0_30px_90px_-54px_rgba(2,6,23,0.95)]">
          <div className="relative flex aspect-video min-h-[260px] items-center justify-center bg-[radial-gradient(circle_at_25%_0%,rgba(20,184,166,0.2),transparent_34%),linear-gradient(180deg,#111827_0%,#020617_100%)] sm:min-h-[420px] xl:min-h-[520px]">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              data-testid="remote-video"
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
              <span className="toolbar-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {remoteParticipantLabel}
              </span>
              {remoteScreenSharing ? (
                <span className="rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-50 ring-1 ring-teal-300/30">
                  Sharing
                </span>
              ) : null}
              {!remoteMicrophoneEnabled ? (
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-50 ring-1 ring-red-300/30">
                  Mic muted
                </span>
              ) : null}
              {!remoteCameraEnabled && !remoteScreenSharing ? (
                <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-50 ring-1 ring-amber-300/30">
                  Camera off
                </span>
              ) : null}
            </div>
            {showRemotePlaceholder ? (
              <div className="absolute flex flex-col items-center gap-3 px-6 text-center text-slate-300">
                {remoteCameraEnabled ? (
                  <Video className="h-10 w-10" />
                ) : (
                  <VideoOff className="h-10 w-10" />
                )}
                <p className="max-w-xs text-sm font-medium">
                  {effectiveCallState !== "connected"
                    ? "Waiting for the other participant's video stream."
                    : "The other participant's camera is currently off."}
                </p>
              </div>
            ) : null}
            <div className="absolute inset-x-3 bottom-3 flex justify-center">
              <div className="toolbar-pill flex max-w-full flex-wrap justify-center gap-1 p-2">
                <Button
                  variant={localMediaState.isMicrophoneEnabled ? "ghost" : "secondary"}
                  className="shrink-0 bg-white/10 px-3 py-2 text-white ring-white/15 hover:bg-white hover:text-slate-950"
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
                  className="shrink-0 bg-white/10 px-3 py-2 text-white ring-white/15 hover:bg-white hover:text-slate-950"
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
                  className="shrink-0 bg-white/10 px-3 py-2 text-white ring-white/15 hover:bg-white hover:text-slate-950"
                  onClick={onToggleScreenShare}
                  disabled={controlsDisabled}
                >
                  {localMediaState.isScreenSharing ? (
                    <MonitorOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Monitor className="mr-2 h-4 w-4" />
                  )}
                  {localMediaState.isScreenSharing ? "Stop share" : "Share"}
                </Button>
              </div>
            </div>
          </div>

          {canControlRemoteMedia ? (
            <div className="flex flex-wrap gap-2 border-t border-white/10 px-4 py-4">
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

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="panel-muted overflow-hidden rounded-3xl p-2">
            <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-slate-200">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                data-testid="local-video"
                className="h-full w-full object-cover"
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 ring-1 ring-slate-200">
                  You
                </span>
                {localMediaState.isScreenSharing ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-700 ring-1 ring-teal-200">
                    Sharing
                  </span>
                ) : null}
              </div>
              {!localMediaState.isCameraEnabled && !localMediaState.isScreenSharing ? (
                <div className="absolute flex flex-col items-center gap-2 px-4 text-center text-slate-500">
                  <VideoOff className="h-8 w-8" />
                  <p className="text-sm font-medium">
                    {localMediaState.isCameraBlockedByMentor
                      ? "Paused by mentor"
                      : "Camera off"}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="panel-muted rounded-3xl p-4">
            <p className="section-kicker">Device status</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <span>Microphone</span>
                <span className="font-semibold text-slate-950">
                  {localMediaState.isMicrophoneBlockedByMentor
                    ? "Blocked"
                    : localMediaState.isMicrophoneEnabled
                      ? "On"
                      : "Muted"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Camera</span>
                <span className="font-semibold text-slate-950">
                  {localMediaState.isCameraBlockedByMentor
                    ? "Blocked"
                    : localMediaState.isCameraEnabled
                      ? "On"
                      : "Off"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Remote video</span>
                <span className="font-semibold text-slate-950">
                  {remoteScreenSharing ? "Screen" : remoteCameraEnabled ? "Camera" : "Off"}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
