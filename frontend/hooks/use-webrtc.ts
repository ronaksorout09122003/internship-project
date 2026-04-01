"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { buildIceServers } from "@/lib/ice-servers";
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

const rtcConfig: RTCConfiguration = {
  iceServers: buildIceServers()
};

const DEFAULT_MEDIA_STATE: ParticipantMediaState = {
  isMicrophoneEnabled: true,
  isCameraEnabled: true,
  isMicrophoneBlockedByMentor: false,
  isCameraBlockedByMentor: false
};

export function useWebRTC({
  session,
  currentUser,
  isRealtimeConnected,
  sendSignal
}: UseWebRtcArgs) {
  const [callState, setCallState] = useState<CallState>("waiting");
  const [mediaError, setMediaError] = useState<string | null>(null);
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
  const desiredLocalMediaRef = useRef({
    microphoneEnabled: true,
    cameraEnabled: true
  });
  const mentorLocksRef = useRef({
    microphoneForcedOff: false,
    cameraForcedOff: false
  });

  const attachRemoteStream = useEffectEvent(() => {
    if (remoteVideoRef.current && remoteStreamRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current;
    }
  });

  const cleanupPeerConnection = useEffectEvent(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    pendingCandidatesRef.current = [];
    remoteStreamRef.current = null;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  });

  const buildLocalMediaState = useEffectEvent((): ParticipantMediaState => ({
    isMicrophoneEnabled:
      desiredLocalMediaRef.current.microphoneEnabled &&
      !mentorLocksRef.current.microphoneForcedOff,
    isCameraEnabled:
      desiredLocalMediaRef.current.cameraEnabled &&
      !mentorLocksRef.current.cameraForcedOff,
    isMicrophoneBlockedByMentor: mentorLocksRef.current.microphoneForcedOff,
    isCameraBlockedByMentor: mentorLocksRef.current.cameraForcedOff
  }));

  const broadcastLocalMediaState = useEffectEvent(
    (nextState: ParticipantMediaState) => {
      if (!session || !currentUser || !session.student || !isRealtimeConnected) {
        return;
      }

      sendSignal("MEDIA_STATE", {
        microphoneEnabled: nextState.isMicrophoneEnabled,
        cameraEnabled: nextState.isCameraEnabled,
        microphoneBlockedByMentor: nextState.isMicrophoneBlockedByMentor,
        cameraBlockedByMentor: nextState.isCameraBlockedByMentor
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
  });

  const ensurePeerConnection = useEffectEvent(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const connection = new RTCPeerConnection(rtcConfig);
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

    connection.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      event.streams[0]?.getTracks().forEach((track) => {
        const alreadyAdded = remoteStreamRef.current
          ?.getTracks()
          .some((existingTrack) => existingTrack.id === track.id);

        if (!alreadyAdded) {
          remoteStreamRef.current?.addTrack(track);
        }
      });
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

  const createOffer = useEffectEvent(async () => {
    if (!currentUser || currentUser.role !== "MENTOR" || !localStreamRef.current) {
      return;
    }

    if (offerInFlightRef.current || callState === "connected") {
      return;
    }

    offerInFlightRef.current = true;
    try {
      const connection = ensurePeerConnection();
      setCallState("calling");
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      sendSignal("OFFER", {
        sdp: offer
      });
    } finally {
      offerInFlightRef.current = false;
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
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        syncLocalMediaState();
      } catch {
        setMediaError("Camera or microphone permission was denied.");
      }
    })();

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      cleanupPeerConnection();
    };
  }, []);

  useEffect(() => {
    mentorLocksRef.current = {
      microphoneForcedOff: false,
      cameraForcedOff: false
    };
    setRemoteMediaState(null);
    syncLocalMediaState();
  }, [session?.id]);

  useEffect(() => {
    if (
      !session ||
      !currentUser ||
      !session.student ||
      !isRealtimeConnected ||
      !localStreamRef.current
    ) {
      return;
    }

    setCallState((current) => (current === "connected" ? current : "waiting"));
    sendSignal("READY", {
      from: currentUser.role
    });
    syncLocalMediaState();
  }, [currentUser, isRealtimeConnected, session]);

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

        await createOffer();
        return;
      }
      case "OFFER": {
        cleanupPeerConnection();
        const connection = ensurePeerConnection();
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
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
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
            signal.payload.cameraBlockedByMentor === true
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
      await createOffer();
      return;
    }

    sendSignal("READY", {
      manualReconnect: true
    });
  };

  const leaveCall = () => {
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
    mediaError,
    localMediaState,
    remoteMediaState,
    handleSignal,
    reconnectCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
    setRemoteMicrophoneEnabled,
    setRemoteCameraEnabled
  };
}
