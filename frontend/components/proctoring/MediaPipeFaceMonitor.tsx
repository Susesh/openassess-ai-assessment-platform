"use client";

import { useEffect, useRef, useState } from "react";
// import { FaceMesh, FACEMESH_TESSELATION } from "@mediapipe/face_mesh/face_mesh";
// import { Camera } from "@mediapipe/camera_utils/camera_utils";

interface MediaPipeFaceMonitorProps {
  active: boolean;
  onViolation?: (type: string, message: string) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
}

export function MediaPipeFaceMonitor({ active, onViolation, videoRef: externalVideoRef }: MediaPipeFaceMonitorProps) {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const faceMeshRef = useRef<FaceMesh | null>(null);
  // const cameraRef = useRef<Camera | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [headPose, setHeadPose] = useState<HeadPose>({ pitch: 0, yaw: 0, roll: 0 });
  const [eyeDirection, setEyeDirection] = useState<string>("center");
  
  const videoRef = externalVideoRef || internalVideoRef;

  // Thresholds for violation detection
  const HEAD_TILT_THRESHOLD = 30; // degrees
  const GAZE_AWAY_THRESHOLD = 0.5; // normalized gaze score

  useEffect(() => {
    if (!active) {
      stopMonitoring();
      return;
    }

    initializeMediaPipe();
    return () => stopMonitoring();
  }, [active]);

  const initializeMediaPipe = async () => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // try {
    //   const faceMesh = new FaceMesh({
    //     locateFile: (file) => {
    //       return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    //     },
    //   });

    //   faceMesh.setOptions({
    //     maxNumFaces: 1,
    //     refineLandmarks: true,
    //     minDetectionConfidence: 0.5,
    //     minTrackingConfidence: 0.5,
    //   });

    //   faceMesh.onResults(onResults);
    //   faceMeshRef.current = faceMesh;

    //   const video = videoRef.current;
    //   if (!video) return;

    //   const camera = new Camera(video, {
    //     onFrame: async () => {
    //       if (faceMeshRef.current && video.readyState >= 2) {
    //         await faceMeshRef.current.send({ image: video });
    //       }
    //     },
    //     width: 640,
    //     height: 480,
    //   });

    //   await camera.start();
    //   cameraRef.current = camera;
    //   setIsInitialized(true);
    // } catch (error) {
    //   console.error("Failed to initialize MediaPipe Face Mesh:", error);
    //   onViolation?.("camera_init_failed", "Failed to initialize AI proctoring system");
    // }
  };

  const onResults = (results: any) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // const canvas = canvasRef.current;
    // if (!canvas) return;

    // const ctx = canvas.getContext("2d");
    // if (!ctx) return;

    // canvas.width = videoRef.current?.videoWidth || 640;
    // canvas.height = videoRef.current?.videoHeight || 480;

    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    //   const landmarks = results.multiFaceLandmarks[0];
      
    //   // Draw face mesh
    //   drawFaceMesh(ctx, landmarks);
      
    //   // Calculate head pose
    //   const pose = calculateHeadPose(landmarks);
    //   setHeadPose(pose);
      
    //   // Detect head movement violations
    //   detectHeadMovementViolations(pose);
      
    //   // Detect eye direction
    //   const direction = detectEyeDirection(landmarks);
    //   setEyeDirection(direction);
    //   detectGazeViolations(direction);
    // } else {
    //   onViolation?.("face_not_detected", "No face detected in camera feed");
    // }
  };

  const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // ctx.save();
    // ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    // ctx.lineWidth = 1;

    // // Draw tessellation
    // for (const connection of FACEMESH_TESSELATION) {
    //   const start = landmarks[connection[0]];
    //   const end = landmarks[connection[1]];
      
    //   ctx.beginPath();
    //   ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
    //   ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
    //   ctx.stroke();
    // }
    
    // ctx.restore();
  };

  const calculateHeadPose = (landmarks: any[]): HeadPose => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    return { pitch: 0, yaw: 0, roll: 0 };
  };

  const detectHeadMovementViolations = (pose: HeadPose) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
  };

  const detectEyeDirection = (landmarks: any[]): string => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    return "center";
  };

  const calculateEyeCenter = (landmarks: any[], eyeIndices: number[]) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    return { x: 0, y: 0 };
  };

  const detectGazeViolations = (direction: string) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
  };

  const stopMonitoring = () => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // if (cameraRef.current) {
    //   cameraRef.current.stop();
    //   cameraRef.current = null;
    // }
    // if (faceMeshRef.current) {
    //   faceMeshRef.current.close();
    //   faceMeshRef.current = null;
    // }
    setIsInitialized(false);
  };

  return (
    <div className="relative">
      {!externalVideoRef && (
        <video
          ref={internalVideoRef}
          autoPlay
          muted
          playsInline
          className="hidden"
          style={{ width: 640, height: 480 }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="hidden"
        style={{ width: 640, height: 480 }}
      />
      {isInitialized && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
          AI Proctoring Active
        </div>
      )}
    </div>
  );
}
