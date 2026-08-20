"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { logProctoringEvent } from "@/lib/api";
import type { ProctoringEventType, ProctoringSeverity } from "@/lib/types";

type ProctoringContextValue = {
  attemptId: number | null;
  setAttemptId: (attemptId: number | null) => void;
  warningCount: number;
  warningMessage: string | null;
  autoSubmitRequested: boolean;
  clearAutoSubmitRequest: () => void;
  startCamera: () => Promise<boolean>;
  requestMicrophonePermission: () => Promise<void>;
  enableFullscreen: () => Promise<boolean>;
  verifyFaceBeforeStart: () => Promise<boolean>;
  startFaceDetection: () => void;
  stopFaceDetection: () => void;
  startFullscreenMonitoring: () => void;
  startTabMonitoring: () => void;
  startViolationTracking: () => void;
  startCameraMonitoring: () => void;
  stopCamera: () => void;
  stopAllMonitoring: () => void;
};

type ProctoringProviderProps = {
  children: React.ReactNode;
};

const ProctoringContext = createContext<ProctoringContextValue | null>(null);

const VIOLATION_DEDUP_MS = 8000;
const FACE_CHECK_INTERVAL_MS = 7000;

type FaceDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<unknown>>;
};

export function ProctoringProvider({ children }: ProctoringProviderProps) {
  // Proctoring enabled for now; flip to false to disable client-side monitoring
  const PROCTORING_ENABLED = true;

  if (!PROCTORING_ENABLED) {
    const noop = async () => true;
    const noopVoid = async () => {};
    const stubValue: ProctoringContextValue = {
      attemptId: null,
      setAttemptId: () => {},
      warningCount: 0,
      warningMessage: null,
      autoSubmitRequested: false,
      clearAutoSubmitRequest: () => {},
      startCamera: noop,
      requestMicrophonePermission: noopVoid,
      enableFullscreen: noop,
      verifyFaceBeforeStart: noop,
      startFaceDetection: () => {},
      stopFaceDetection: () => {},
      startFullscreenMonitoring: () => {},
      startTabMonitoring: () => {},
      startViolationTracking: () => {},
      startCameraMonitoring: () => {},
      stopCamera: () => {},
      stopAllMonitoring: () => {},
    };

    return <ProctoringContext.Provider value={stubValue}>{children}</ProctoringContext.Provider>;
  }
  const [attemptId, setAttemptIdState] = useState<number | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [autoSubmitRequested, setAutoSubmitRequested] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const faceIntervalRef = useRef<number | null>(null);
  const fullscreenListenerRef = useRef<(() => void) | null>(null);
  const visibilityListenerRef = useRef<(() => void) | null>(null);
  const blurListenerRef = useRef<(() => void) | null>(null);
  const contextMenuListenerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const copyListenerRef = useRef<(() => void) | null>(null);
  const pasteListenerRef = useRef<((event: ClipboardEvent) => void) | null>(null);
  const keydownListenerRef = useRef<((event: KeyboardEvent) => void) | null>(null);
  const cameraMonitoringRef = useRef(false);
  const cameraEndedListenerRef = useRef<(() => void) | null>(null);
  const lastEventAtRef = useRef<Record<string, number>>({});
  const autoSubmittedRef = useRef(false);

  const setAttemptId = useCallback((nextAttemptId: number | null) => {
    setAttemptIdState(nextAttemptId);
    autoSubmittedRef.current = false;
    setWarningCount(0);
    setWarningMessage(null);
    setAutoSubmitRequested(false);
    lastEventAtRef.current = {};
  }, []);

  const detectFaceCount = useCallback(async (): Promise<number | null> => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) {
      return 0;
    }

    const FaceDetectorCtor = (window as unknown as { FaceDetector?: new () => FaceDetectorLike }).FaceDetector;
    if (!FaceDetectorCtor) {
      return null;
    }

    if (video.readyState < 2) {
      await new Promise((resolve) => window.setTimeout(resolve, 350));
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, video.videoWidth || 640);
    canvas.height = Math.max(1, video.videoHeight || 480);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return 0;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const detector = new FaceDetectorCtor();
    const faces = await detector.detect(canvas);
    return faces.length;
  }, []);

  const recordViolation = useCallback(
    async (
      eventType: ProctoringEventType,
      eventDescription: string,
      severity: ProctoringSeverity = "warning"
    ) => {
      const now = Date.now();
      const key = `${eventType}:${eventDescription}`;
      const previous = lastEventAtRef.current[key] || 0;
      if (now - previous < VIOLATION_DEDUP_MS) {
        return;
      }
      lastEventAtRef.current[key] = now;

      if (!attemptId) {
        return;
      }

      try {
        const response = await logProctoringEvent({
          attempt_id: attemptId,
          event_type: eventType,
          event_description: eventDescription,
          severity,
        });

        setWarningCount(response.warning_count);

        if (response.warning_count === 1) {
          setWarningMessage("Warning 1 of 3: A proctoring violation was detected.");
        }
        if (response.warning_count === 2) {
          setWarningMessage("Warning 2 of 3: Next violation will auto-submit your assessment.");
        }

        if (response.should_auto_submit && !autoSubmittedRef.current) {
          autoSubmittedRef.current = true;
          setWarningMessage("Third violation detected. Assessment is being auto-submitted.");
          setAutoSubmitRequested(true);
        }
      } catch {
        // Non-blocking. Assessment should continue even if logging fails.
      }
    },
    [attemptId]
  );

  const clearAutoSubmitRequest = useCallback(() => {
    setAutoSubmitRequested(false);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (streamRef.current) {
      return true;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }

      return true;
    } catch {
      return false;
    }
  }, []);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      micStream.getTracks().forEach((track) => track.stop());
    } catch {
      // Optional by requirement.
    }
  }, []);

  const enableFullscreen = useCallback(async (): Promise<boolean> => {
    if (document.fullscreenElement) {
      return true;
    }

    try {
      // Try standard fullscreen API
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
      // Fallback for older browsers
      else if ((document.documentElement as any).webkitRequestFullscreen) {
        await (document.documentElement as any).webkitRequestFullscreen();
        return true;
      }
      else if ((document.documentElement as any).mozRequestFullScreen) {
        await (document.documentElement as any).mozRequestFullScreen();
        return true;
      }
      else if ((document.documentElement as any).msRequestFullscreen) {
        await (document.documentElement as any).msRequestFullscreen();
        return true;
      }
      else {
        console.error("Fullscreen API not supported in this browser");
        return false;
      }
    } catch (error) {
      console.error("Fullscreen request failed:", error);
      return false;
    }
  }, []);

  const verifyFaceBeforeStart = useCallback(async (): Promise<boolean> => {
    // Wait for video to stabilize after camera starts
    await new Promise((resolve) => window.setTimeout(resolve, 800));

    const FaceDetectorCtor = (window as unknown as { FaceDetector?: new () => FaceDetectorLike }).FaceDetector;
    if (!FaceDetectorCtor) {
      // FaceDetector API not supported in this browser — skip face check.
      return true;
    }

    // Try up to 4 times with 800ms between attempts to detect face
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const count = await detectFaceCount();
        if (count === null) return true; // API not available, skip
        if (count >= 1) return true; // Face detected
      } catch {
        return true; // Don't block on errors
      }
      if (attempt < 3) {
        await new Promise((resolve) => window.setTimeout(resolve, 800));
      }
    }
    // Return true to not block start — face monitoring during quiz will handle violations
    return true;
  }, [detectFaceCount]);

  const startFaceDetection = useCallback(() => {
    if (faceIntervalRef.current !== null) {
      return;
    }

    faceIntervalRef.current = window.setInterval(async () => {
      const stream = streamRef.current;
      if (!stream) {
        await recordViolation(
          "camera_disconnected",
          "Camera stream is unavailable during assessment."
        );
        return;
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        await recordViolation(
          "camera_disconnected",
          "Camera was disconnected during assessment."
        );
        return;
      }

      try {
        const count = await detectFaceCount();
        if (count === null) {
          return;
        }
        if (count === 0) {
          await recordViolation(
            "face_not_detected",
            "Face not detected in camera feed."
          );
        } else if (count > 1) {
          await recordViolation(
            "multiple_faces_detected",
            "Multiple faces detected in camera feed."
          );
        }
      } catch {
        await recordViolation(
          "face_not_detected",
          "Face verification failed during monitoring."
        );
      }
    }, FACE_CHECK_INTERVAL_MS);
  }, [detectFaceCount, recordViolation]);

  const stopFaceDetection = useCallback(() => {
    if (faceIntervalRef.current !== null) {
      window.clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
  }, []);

  const startCameraMonitoring = useCallback(() => {
    if (cameraMonitoringRef.current) {
      return;
    }
    cameraMonitoringRef.current = true;

    const stream = streamRef.current;
    const track = stream?.getVideoTracks()[0];
    if (!track) {
      return;
    }

    const handleEnded = () => {
      void recordViolation(
        "camera_disconnected",
        "Camera track ended while assessment is active."
      );
    };

    cameraEndedListenerRef.current = handleEnded;
    track.addEventListener("ended", handleEnded);
  }, [recordViolation]);

  const startFullscreenMonitoring = useCallback(() => {
    if (fullscreenListenerRef.current) {
      return;
    }

    const handleFullscreenExit = () => {
      if (!document.fullscreenElement) {
        void recordViolation(
          "fullscreen_exit",
          "User exited fullscreen mode during assessment."
        );
      }
    };

    fullscreenListenerRef.current = handleFullscreenExit;
    document.addEventListener("fullscreenchange", handleFullscreenExit);
  }, [recordViolation]);

  const startTabMonitoring = useCallback(() => {
    if (visibilityListenerRef.current || blurListenerRef.current) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        void recordViolation("tab_switch", "User switched tab during assessment.");
      }
    };

    const handleWindowBlur = () => {
      void recordViolation("browser_minimized", "Browser window lost focus during assessment.");
    };

    visibilityListenerRef.current = handleVisibilityChange;
    blurListenerRef.current = handleWindowBlur;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
  }, [recordViolation]);

  const startViolationTracking = useCallback(() => {
    if (contextMenuListenerRef.current || keydownListenerRef.current) {
      return;
    }

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      void recordViolation("right_click_attempt", "Right click attempt detected.");
    };

    const handleCopy = () => {
      void recordViolation("copy_paste_attempt", "Copy action attempted.");
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      void recordViolation("copy_paste_attempt", "Paste action attempted.");
    };

    const handleKeydown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const devToolsAttempt =
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));

      if (devToolsAttempt) {
        event.preventDefault();
        void recordViolation("devtools_attempt", "Developer tools attempt detected.");
        return;
      }

      if (event.ctrlKey && ["c", "v", "x", "a"].includes(key)) {
        event.preventDefault();
        void recordViolation("copy_paste_attempt", "Keyboard copy/paste/select-all attempt detected.");
      }
    };

    contextMenuListenerRef.current = handleContextMenu;
    copyListenerRef.current = handleCopy;
    pasteListenerRef.current = handlePaste;
    keydownListenerRef.current = handleKeydown;

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeydown);
  }, [recordViolation]);

  const stopCamera = useCallback(() => {
    stopFaceDetection();

    const stream = streamRef.current;
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track && cameraEndedListenerRef.current) {
        track.removeEventListener("ended", cameraEndedListenerRef.current);
      }
      stream.getTracks().forEach((track) => track.stop());
    }
    cameraEndedListenerRef.current = null;
    cameraMonitoringRef.current = false;
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stopFaceDetection]);

  const stopAllMonitoring = useCallback(() => {
    stopFaceDetection();
    if (fullscreenListenerRef.current) {
      document.removeEventListener("fullscreenchange", fullscreenListenerRef.current);
      fullscreenListenerRef.current = null;
    }
    if (visibilityListenerRef.current) {
      document.removeEventListener("visibilitychange", visibilityListenerRef.current);
      visibilityListenerRef.current = null;
    }
    if (blurListenerRef.current) {
      window.removeEventListener("blur", blurListenerRef.current);
      blurListenerRef.current = null;
    }
    if (contextMenuListenerRef.current) {
      document.removeEventListener("contextmenu", contextMenuListenerRef.current);
      contextMenuListenerRef.current = null;
    }
    if (copyListenerRef.current) {
      document.removeEventListener("copy", copyListenerRef.current);
      copyListenerRef.current = null;
    }
    if (pasteListenerRef.current) {
      document.removeEventListener("paste", pasteListenerRef.current);
      pasteListenerRef.current = null;
    }
    if (keydownListenerRef.current) {
      document.removeEventListener("keydown", keydownListenerRef.current);
      keydownListenerRef.current = null;
    }

    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }

    stopCamera();
  }, [stopCamera, stopFaceDetection]);

  useEffect(() => {
    return () => {
      stopAllMonitoring();
    };
  }, [stopAllMonitoring]);

  const value = useMemo<ProctoringContextValue>(
    () => ({
      attemptId,
      setAttemptId,
      warningCount,
      warningMessage,
      autoSubmitRequested,
      clearAutoSubmitRequest,
      startCamera,
      requestMicrophonePermission,
      enableFullscreen,
      verifyFaceBeforeStart,
      startFaceDetection,
      stopFaceDetection,
      startFullscreenMonitoring,
      startTabMonitoring,
      startViolationTracking,
      startCameraMonitoring,
      stopCamera,
      stopAllMonitoring,
    }),
    [
      attemptId,
      setAttemptId,
      warningCount,
      warningMessage,
      autoSubmitRequested,
      clearAutoSubmitRequest,
      startCamera,
      requestMicrophonePermission,
      enableFullscreen,
      verifyFaceBeforeStart,
      startFaceDetection,
      stopFaceDetection,
      startFullscreenMonitoring,
      startTabMonitoring,
      startViolationTracking,
      startCameraMonitoring,
      stopCamera,
      stopAllMonitoring,
    ]
  );

  return (
    <ProctoringContext.Provider value={value}>
      {children}
      {/* Must be off-screen (not display:none) so videoWidth/videoHeight are real values for face detection */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
    </ProctoringContext.Provider>
  );
}

export function useProctoring() {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error("useProctoring must be used within ProctoringProvider");
  }
  return context;
}
