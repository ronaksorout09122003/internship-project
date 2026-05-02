"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { buildIceServers } from "@/lib/ice-servers";
import { getRuntimeConfig } from "@/lib/runtime-config";
import type { User } from "@/types/auth";
import type {
  ParticipantMediaState,
  SignalMessage,
  SignalType
} from "@/types/realtime";
import type { Session } from "@/types/session";

interface UseWebRtcArgs {
  session: Session | null;
  currentUser: User | null;
  isRealtimeConnected: boolean;
  sendSignal: (signalType: SignalType, payload?: Record<string, unknown>) => void;
}

type CallState = "waiting" | "calling" | "connected" | "disconnected";
type CreateOfferOptions = {
  force?: boolean;
  iceRestart?: boolean;
};

const DEFAULT_MEDIA_STATE: ParticipantMediaState = {
  isMicrophoneEnabled: true,
  isCameraEnabled: true,
  isMicrophoneBlockedByMentor: false,
  isCameraBlockedByMentor: false,
  isScreenSharing: false
};

export function useWebRTC({
  session,
  currentUser,
  isRealtimeConnected,
  sendSignal
}: UseWebRtcArgs) {
  const [callState, setCallState] = useState<CallState>("waiting");
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isLocalMediaReady, setIsLocalMediaReady] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [localMediaState, setLocalMediaState] =
    useState<ParticipantMediaState>(DEFAULT_MEDIA_STATE);
  const [remoteMediaState, setRemoteMediaState] =
    useState<ParticipantMediaState | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const readySignalAtRef = useRef(0);
  const offerInFlightRef = useRef(false);
  const lastOfferAtRef = useRef(0);
  const iceServersRef = useRef<RTCIceServer[]>(buildIceServers());
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const desiredLocalMediaRef = useRef({
    microphoneEnabled: true,
    cameraEnabled: true
  });
  const mentorLocksRef = useRef({
    microphoneForcedOff: false,
    cameraForcedOff: false
  });

  const attachLocalStream = useEffectEvent(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      void localVideoRef.current.play().catch(() => undefined);
    }
  });

  const attachRemoteStream = useEffectEvent(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
      void remoteVideoRef.current.play().catch(() => undefined);
    }
  });

  const cleanupPeerConnection = useEffectEvent(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];
    offerInFlightRef.current = false;
    remoteStreamRef.current = null;
    setHasRemoteVideo(false);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  });

  const buildLocalMediaState = useEffectEvent((): ParticipantMediaState => {
    const isScreenSharing = screenTrackRef.current != null;

    return {
      isMicrophoneEnabled:
        desiredLocalMediaRef.current.microphoneEnabled &&
        !mentorLocksRef.current.microphoneForcedOff,
      isCameraEnabled: isScreenSharing
        ? screenTrackRef.current?.enabled !== false
        : desiredLocalMediaRef.current.cameraEnabled &&
          !mentorLocksRef.current.cameraForcedOff,
      isMicrophoneBlockedByMentor: mentorLocksRef.current.microphoneForcedOff,
      isCameraBlockedByMentor:
        !isScreenSharing && mentorLocksRef.current.cameraForcedOff,
      isScreenSharing
    };
  });

  const broadcastLocalMediaState = useEffectEvent(
    (nextState: ParticipantMediaState) => {
      if (!session || !currentUser || !session.student || !isRealtimeConnected) {
        return;
      }

      sendSignal("MEDIA_STATE", {
        microphoneEnabled: nextState.isMicrophoneEnabled,
        cameraEnabled: nextState.isCameraEnabled,
        microphoneBlockedByMentor: nextState.isMicrophoneBlockedByMentor,
        cameraBlockedByMentor: nextState.isCameraBlockedByMentor,
        screenSharingEnabled: nextState.isScreenSharing
      });
    }
  );

  const syncLocalMediaState = useEffectEvent(() => {
    const nextState = buildLocalMediaState();

    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = nextState.isMicrophoneEnabled;
    });
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = nextState.isCameraEnabled;
    });

    setLocalMediaState(nextState);
    broadcastLocalMediaState(nextState);
    attachLocalStream();
  });

  const replaceLocalVideoTrack = useEffectEvent(async (nextTrack: MediaStreamTrack | null) => {
    if (!localStreamRef.current) {
      localStreamRef.current = new MediaStream();
    }

    for (const track of localStreamRef.current.getVideoTracks()) {
      localStreamRef.current.removeTrack(track);
    }

    if (nextTrack) {
      localStreamRef.current.addTrack(nextTrack);
    }

    const sender = peerConnectionRef.current
      ?.getSenders()
      .find((candidate) => candidate.track?.kind === "video");

    if (sender) {
      await sender.replaceTrack(nextTrack);
    } else if (nextTrack && peerConnectionRef.current && localStreamRef.current) {
      peerConnectionRef.current.addTrack(nextTrack, localStreamRef.current);
      if (currentUser?.role === "MENTOR") {
        void createOffer({ force: true });
      }
    }

    attachLocalStream();
  });

  const stopScreenShare = useEffectEvent(async () => {
    const previousScreenStream = screenStreamRef.current;

    screenTrackRef.current = null;
    screenStreamRef.current = null;
    previousScreenStream?.getTracks().forEach((track) => track.stop());

    await replaceLocalVideoTrack(cameraTrackRef.current);
    syncLocalMediaState();
  });

  const ensurePeerConnection = useEffectEvent(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const connection = new RTCPeerConnection({
      iceServers: iceServersRef.current
    });
    remoteStreamRef.current = new MediaStream();
    attachRemoteStream();

    localStreamRef.current?.getTracks().forEach((track) => {
      connection.addTrack(track, localStreamRef.current!);
    });

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal("ICE_CANDIDATE", {
          candidate: event.candidate.toJSON()
        });
      }
    };

    connection.onnegotiationneeded = () => {
      if (currentUser?.role === "MENTOR") {
        void createOffer({ force: true });
      }
    };

    connection.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      const incomingTracks =
        event.streams.length > 0
          ? event.streams.flatMap((stream) => stream.getTracks())
          : [event.track];

      incomingTracks.forEach((track) => {
        const alreadyAdded = remoteStreamRef.current
          ?.getTracks()
          .some((existingTrack) => existingTrack.id === track.id);

        if (!alreadyAdded) {
          remoteStreamRef.current?.addTrack(track);
        }

        if (track.kind === "video") {
          setHasRemoteVideo(true);
          track.onended = () => setHasRemoteVideo(false);
        }

        track.onunmute = () => {
          setCallState("connected");
          attachRemoteStream();
        };
      });
      setCallState("connected");
      attachRemoteStream();
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        setCallState("connected");
      }

      if (
        connection.connectionState === "failed" ||
        connection.connectionState === "disconnected" ||
        connection.connectionState === "closed"
      ) {
        setCallState("disconnected");
      }
    };

    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === "failed") {
        setCallState("disconnected");
        connection.restartIce?.();

        if (currentUser?.role === "MENTOR") {
          void createOffer({ force: true, iceRestart: true });
        }
      }
    };

    peerConnectionRef.current = connection;
    return connection;
  });

  const flushPendingCandidates = useEffectEvent(async () => {
    const connection = peerConnectionRef.current;
    if (!connection || !connection.remoteDescription) {
      return;
    }

    for (const candidate of pendingCandidatesRef.current) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidatesRef.current = [];
  });

  const createOffer = useEffectEvent(async (options: CreateOfferOptions = {}) => {
    if (!currentUser || currentUser.role !== "MENTOR" || !localStreamRef.current) {
      return;
    }

    if (offerInFlightRef.current || (!options.force && callState === "connected")) {
      return;
    }

    const existingConnection = peerConnectionRef.current;
    const hasLiveRemoteMedia =
      remoteStreamRef.current
        ?.getTracks()
        .some((track) => track.readyState === "live") ?? false;
    if (
      !options.iceRestart &&
      (existingConnection?.connectionState === "connected" ||
        (callState === "connected" && hasLiveRemoteMedia))
    ) {
      return;
    }

    const now = Date.now();
    if (now - lastOfferAtRef.current < 1200) {
      return;
    }

    offerInFlightRef.current = true;
    try {
      const connection = ensurePeerConnection();
      if (connection.signalingState !== "stable") {
        return;
      }

      lastOfferAtRef.current = now;
      setCallState("calling");
      const offer = await connection.createOffer({
        iceRestart: options.iceRestart === true
      });
      await connection.setLocalDescription(offer);
      sendSignal("OFFER", {
        sdp: connection.localDescription ?? offer,
        iceRestart: options.iceRestart === true
      });
    } finally {
      offerInFlightRef.current = false;
    }
  });

  const startScreenShare = useEffectEvent(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setMediaError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      const screenTrack = stream.getVideoTracks()[0];

      if (!screenTrack) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      screenTrack.onended = () => {
        void stopScreenShare();
      };

      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = stream;
      screenTrackRef.current = screenTrack;
      await replaceLocalVideoTrack(screenTrack);
      setMediaError(null);
      syncLocalMediaState();
    } catch {
      setMediaError("Screen sharing permission was denied.");
    }
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      if (typeof window === "undefined" || !navigator.mediaDevices) {
        setMediaError("Camera access is not supported in this browser.");
        return;
      }

      try {
        const runtimeConfig = await getRuntimeConfig();
        if (!active) {
          return;
        }

        iceServersRef.current = buildIceServers(runtimeConfig);

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        cameraTrackRef.current = stream.getVideoTracks()[0] ?? null;
        setIsLocalMediaReady(true);
        attachLocalStream();
        syncLocalMediaState();
      } catch {
        setIsLocalMediaReady(false);
        setMediaError("Camera or microphone permission was denied.");
      }
    })();

    return () => {
      active = false;
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      setIsLocalMediaReady(false);
      cleanupPeerConnection();
    };
  }, []);

  useEffect(() => {
    mentorLocksRef.current = {
      microphoneForcedOff: false,
      cameraForcedOff: false
    };
    cleanupPeerConnection();
    setCallState("waiting");
    setRemoteMediaState(null);
    void stopScreenShare();
    syncLocalMediaState();
  }, [session?.id]);

  useEffect(() => {
    if (
      !session ||
      !currentUser ||
      !session.student ||
      !isRealtimeConnected ||
      !localStreamRef.current ||
      !isLocalMediaReady ||
      callState === "connected"
    ) {
      return;
    }

    setCallState((current) =>
      current === "disconnected" ? "waiting" : current
    );
    const publishReady = () => {
      sendSignal("READY", {
        from: currentUser.role,
        mediaReady: true
      });
      syncLocalMediaState();
    };

    publishReady();
    const interval = window.setInterval(publishReady, 2000);

    return () => window.clearInterval(interval);
  }, [
    callState,
    currentUser?.id,
    currentUser?.role,
    isLocalMediaReady,
    isRealtimeConnected,
    session?.id,
    session?.student?.id
  ]);

  const handleSignal = useEffectEvent(async (signal: SignalMessage) => {
    if (!currentUser || signal.senderId === currentUser.id) {
      return;
    }

    if (
      signal.signalType !== "MEDIA_STATE" &&
      signal.signalType !== "HANGUP" &&
      !localStreamRef.current
    ) {
      return;
    }

    switch (signal.signalType) {
      case "READY": {
        if (currentUser.role === "STUDENT") {
          const now = Date.now();
          if (now - readySignalAtRef.current > 1500) {
            readySignalAtRef.current = now;
            sendSignal("READY", {
              acknowledged: true
            });
          }
          return;
        }

        const connection = peerConnectionRef.current;
        const hasLiveConnection =
          connection?.connectionState === "connected" ||
          connection?.iceConnectionState === "connected" ||
          connection?.iceConnectionState === "completed";
        await createOffer({ force: !hasLiveConnection });
        return;
      }
      case "OFFER": {
        let connection = ensurePeerConnection();
        if (connection.signalingState !== "stable") {
          cleanupPeerConnection();
          connection = ensurePeerConnection();
        }

        const offer = signal.payload.sdp as RTCSessionDescriptionInit;
        await connection.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates();
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);
        setCallState("calling");
        sendSignal("ANSWER", {
          sdp: answer
        });
        return;
      }
      case "ANSWER": {
        const connection = ensurePeerConnection();
        if (connection.signalingState === "stable") {
          return;
        }

        const answer = signal.payload.sdp as RTCSessionDescriptionInit;
        await connection.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates();
        return;
      }
      case "ICE_CANDIDATE": {
        const candidate = signal.payload.candidate as RTCIceCandidateInit | undefined;
        if (!candidate) {
          return;
        }

        const connection = ensurePeerConnection();
        if (connection.remoteDescription) {
          try {
            await connection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            pendingCandidatesRef.current.push(candidate);
          }
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
        return;
      }
      case "HANGUP": {
        cleanupPeerConnection();
        setCallState("disconnected");
        return;
      }
      case "MEDIA_STATE": {
        setRemoteMediaState({
          isMicrophoneEnabled: signal.payload.microphoneEnabled !== false,
          isCameraEnabled: signal.payload.cameraEnabled !== false,
          isMicrophoneBlockedByMentor:
            signal.payload.microphoneBlockedByMentor === true,
          isCameraBlockedByMentor:
            signal.payload.cameraBlockedByMentor === true,
          isScreenSharing: signal.payload.screenSharingEnabled === true
        });
        return;
      }
      case "MEDIA_CONTROL": {
        if (currentUser.role !== "STUDENT" || signal.senderRole !== "MENTOR") {
          return;
        }

        const targetUserId = signal.payload.targetUserId;
        if (typeof targetUserId !== "string" || targetUserId !== currentUser.id) {
          return;
        }

        if (typeof signal.payload.microphoneEnabled === "boolean") {
          mentorLocksRef.current.microphoneForcedOff =
            !signal.payload.microphoneEnabled;
          if (signal.payload.microphoneEnabled) {
            desiredLocalMediaRef.current.microphoneEnabled = true;
          }
        }

        if (typeof signal.payload.cameraEnabled === "boolean") {
          mentorLocksRef.current.cameraForcedOff =
            !signal.payload.cameraEnabled;
          if (signal.payload.cameraEnabled) {
            desiredLocalMediaRef.current.cameraEnabled = true;
          }
        }

        syncLocalMediaState();
        return;
      }
      default:
        return;
    }
  });

  const reconnectCall = async () => {
    cleanupPeerConnection();
    setCallState("calling");

    if (currentUser?.role === "MENTOR") {
      await createOffer({ force: true, iceRestart: true });
      return;
    }

    sendSignal("READY", {
      manualReconnect: true
    });
  };

  const leaveCall = () => {
    if (screenTrackRef.current) {
      void stopScreenShare();
    }
    cleanupPeerConnection();
    sendSignal("HANGUP", {
      reason: "participant-left"
    });
    setCallState("disconnected");
  };

  const toggleMicrophone = () => {
    if (!localStreamRef.current || localMediaState.isMicrophoneBlockedByMentor) {
      return;
    }

    desiredLocalMediaRef.current.microphoneEnabled =
      !desiredLocalMediaRef.current.microphoneEnabled;
    syncLocalMediaState();
  };

  const toggleCamera = () => {
    if (!localStreamRef.current || localMediaState.isCameraBlockedByMentor) {
      return;
    }

    desiredLocalMediaRef.current.cameraEnabled =
      !desiredLocalMediaRef.current.cameraEnabled;
    syncLocalMediaState();
  };

  const toggleScreenShare = async () => {
    if (screenTrackRef.current) {
      await stopScreenShare();
      return;
    }

    await startScreenShare();
  };

  const setRemoteMicrophoneEnabled = (enabled: boolean) => {
    if (!currentUser || currentUser.role !== "MENTOR" || !session?.student) {
      return;
    }

    sendSignal("MEDIA_CONTROL", {
      targetUserId: session.student.id,
      microphoneEnabled: enabled
    });
  };

  const setRemoteCameraEnabled = (enabled: boolean) => {
    if (!currentUser || currentUser.role !== "MENTOR" || !session?.student) {
      return;
    }

    sendSignal("MEDIA_CONTROL", {
      targetUserId: session.student.id,
      cameraEnabled: enabled
    });
  };

  return {
    localVideoRef,
    remoteVideoRef,
    callState,
    hasRemoteVideo,
    mediaError,
    localMediaState,
    remoteMediaState,
    handleSignal,
    reconnectCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    setRemoteMicrophoneEnabled,
    setRemoteCameraEnabled
  };
}
