"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
// import { FaceMesh, FACEMESH_TESSELATION } from "@mediapipe/face_mesh/face_mesh";
// import { Camera } from "@mediapipe/camera_utils/camera_utils";
import { AlertTriangle, Eye, Users, Activity, X } from "lucide-react";

interface AIProctorProps {
  active: boolean;
  attemptId?: number | null;
  onViolation?: (type: string, message: string, count: number) => void;
}

interface HeadPose {
  pitch: number;
  yaw: number;
  roll: number;
}

interface ViolationWarning {
  type: string;
  message: string;
  timestamp: number;
}

export function AIProctor({ active, attemptId, onViolation }: AIProctorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const faceMeshRef = useRef<FaceMesh | null>(null);
  // const cameraRef = useRef<Camera | null>(null);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [headPose, setHeadPose] = useState<HeadPose>({ pitch: 0, yaw: 0, roll: 0 });
  const [faceCount, setFaceCount] = useState(0);
  const [eyeDirection, setEyeDirection] = useState<string>("center");
  const [violationCount, setViolationCount] = useState(0);
  const [currentWarning, setCurrentWarning] = useState<ViolationWarning | null>(null);
  
  // Time tracking for sustained violations
  const noFaceStartTimeRef = useRef<number | null>(null);
  const multipleFacesStartTimeRef = useRef<number | null>(null);
  const headAwayStartTimeRef = useRef<number | null>(null);
  
  // Thresholds
  const HEAD_TILT_THRESHOLD = 30; // degrees
  const GAZE_AWAY_THRESHOLD = 0.5; // normalized gaze score
  const VIOLATION_DURATION_THRESHOLD = 3000; // 3 seconds in milliseconds
  const WARNING_DISPLAY_DURATION = 5000; // 5 seconds to show warning

  // Log violation to backend
  const logViolationToBackend = async (type: string, message: string) => {
    if (!attemptId) return;

    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('openassess_token') : null;
      
      const response = await fetch('/proctoring/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          attempt_id: attemptId,
          event_type: type,
          event_description: message,
          severity: 'warning',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setViolationCount(data.warning_count || violationCount + 1);
        onViolation?.(type, message, data.warning_count || violationCount + 1);
        
        // Check if should auto-submit
        if (data.should_auto_submit) {
          onViolation?.("auto_submit", "Maximum violations reached. Assessment will be auto-submitted.", violationCount + 1);
        }
      }
    } catch (error) {
      console.error('Failed to log violation to backend:', error);
      // Still increment local count even if backend fails
      setViolationCount(prev => prev + 1);
      onViolation?.(type, message, violationCount + 1);
    }
  };

  // Show warning UI
  const showWarning = (type: string, message: string) => {
    setCurrentWarning({
      type,
      message,
      timestamp: Date.now(),
    });

    // Auto-hide warning after duration
    setTimeout(() => {
      setCurrentWarning(null);
    }, WARNING_DISPLAY_DURATION);
  };

  useEffect(() => {
    if (!active) {
      stopMonitoring();
      return;
    }

    initializeMediaPipe();
    return () => stopMonitoring();
  }, [active]);

  const initializeMediaPipe = async () => {
    // Using backend AI proctoring instead of client-side MediaPipe
    setIsInitialized(true);
  };

  const onResults = (results: any) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // const canvas = canvasRef.current;
    // if (!canvas) return;

    // const ctx = canvas.getContext("2d");
    // if (!ctx) return;

    // canvas.width = 640;
    // canvas.height = 480;

    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // if (results.image) {
    //   ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    // }

    // const detectedFaces = results.multiFaceLandmarks || [];
    // setFaceCount(detectedFaces.length);

    // // Face count violations
    // if (detectedFaces.length === 0) {
    //   handleNoFaceViolation();
    // } else if (detectedFaces.length > 1) {
    //   handleMultipleFacesViolation();
    // } else {
    //   resetFaceCountViolations();
    // }

    // // Process first face for head pose and gaze detection
    // if (detectedFaces.length > 0) {
    //   const landmarks = detectedFaces[0];
      
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
    //   resetHeadPoseViolations();
    // }
  };

  const drawFaceMesh = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // MediaPipe FaceMesh temporarily disabled due to import issues
    // ctx.save();
    // ctx.strokeStyle = "rgba(0, 255, 0, 0.3)";
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
    // Use nose tip (landmark 1) and other facial landmarks to estimate head pose
    const noseTip = landmarks[1];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // Calculate yaw (left-right rotation)
    const yaw = Math.atan2(
      rightCheek.x - leftCheek.x,
      rightCheek.z - leftCheek.z
    ) * (180 / Math.PI);

    // Calculate pitch (up-down rotation)
    const pitch = Math.atan2(
      chin.y - forehead.y,
      chin.z - forehead.z
    ) * (180 / Math.PI);

    // Calculate roll (tilt)
    const roll = Math.atan2(
      leftCheek.y - rightCheek.y,
      leftCheek.x - rightCheek.x
    ) * (180 / Math.PI);

    return { pitch, yaw, roll };
  };

  const detectHeadMovementViolations = (pose: HeadPose) => {
    const { pitch, yaw, roll } = pose;
    const isHeadAway = 
      Math.abs(yaw) > HEAD_TILT_THRESHOLD ||
      Math.abs(pitch) > HEAD_TILT_THRESHOLD ||
      Math.abs(roll) > HEAD_TILT_THRESHOLD;

    if (isHeadAway) {
      if (headAwayStartTimeRef.current === null) {
        headAwayStartTimeRef.current = Date.now();
      } else {
        const duration = Date.now() - headAwayStartTimeRef.current;
        if (duration > VIOLATION_DURATION_THRESHOLD) {
          let direction = "";
          if (Math.abs(yaw) > HEAD_TILT_THRESHOLD) {
            direction = yaw > 0 ? "right" : "left";
          } else if (Math.abs(pitch) > HEAD_TILT_THRESHOLD) {
            direction = pitch > 0 ? "down" : "up";
          } else if (Math.abs(roll) > HEAD_TILT_THRESHOLD) {
            direction = "rolled to side";
          }
          const message = `Head turned too far ${direction} for extended period`;
          logViolationToBackend("head_away", message);
          showWarning("head_away", "WARNING: Please look at the screen");
          headAwayStartTimeRef.current = null; // Reset after triggering
        }
      }
    } else {
      headAwayStartTimeRef.current = null;
    }
  };

  const detectEyeDirection = (landmarks: any[]): string => {
    // Use eye landmarks to estimate gaze direction
    const leftEye = [33, 160, 158, 133, 153, 144];
    const rightEye = [362, 385, 387, 263, 373, 380];
    
    const leftEyeCenter = calculateEyeCenter(landmarks, leftEye);
    const rightEyeCenter = calculateEyeCenter(landmarks, rightEye);
    
    const nose = landmarks[1];
    const faceCenter = {
      x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
      y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
    };

    // Determine gaze direction based on nose position relative to eye centers
    const horizontalOffset = nose.x - faceCenter.x;
    const verticalOffset = nose.y - faceCenter.y;

    let direction = "center";
    
    if (Math.abs(horizontalOffset) > 0.05) {
      direction = horizontalOffset > 0 ? "right" : "left";
    }
    
    if (Math.abs(verticalOffset) > 0.05) {
      direction = verticalOffset > 0 ? "down" : "up";
    }

    return direction;
  };

  const calculateEyeCenter = (landmarks: any[], eyeIndices: number[]) => {
    let x = 0, y = 0;
    for (const idx of eyeIndices) {
      x += landmarks[idx].x;
      y += landmarks[idx].y;
    }
    return { x: x / eyeIndices.length, y: y / eyeIndices.length };
  };

  const detectGazeViolations = (direction: string) => {
    if (direction !== "center") {
      if (headAwayStartTimeRef.current === null) {
        headAwayStartTimeRef.current = Date.now();
      } else {
        const duration = Date.now() - headAwayStartTimeRef.current;
        if (duration > VIOLATION_DURATION_THRESHOLD) {
          const message = `Looking ${direction} instead of at screen for extended period`;
          logViolationToBackend("gaze_away", message);
          showWarning("gaze_away", "WARNING: Please look at the screen");
          headAwayStartTimeRef.current = null; // Reset after triggering
        }
      }
    } else {
      // Only reset if not also tracking head pose violation
      const { pitch, yaw, roll } = headPose;
      const isHeadAway = 
        Math.abs(yaw) > HEAD_TILT_THRESHOLD ||
        Math.abs(pitch) > HEAD_TILT_THRESHOLD ||
        Math.abs(roll) > HEAD_TILT_THRESHOLD;
      
      if (!isHeadAway) {
        headAwayStartTimeRef.current = null;
      }
    }
  };

  const handleNoFaceViolation = () => {
    if (noFaceStartTimeRef.current === null) {
      noFaceStartTimeRef.current = Date.now();
    } else {
      const duration = Date.now() - noFaceStartTimeRef.current;
      if (duration > VIOLATION_DURATION_THRESHOLD) {
        const message = "No face detected in camera frame for extended period";
        logViolationToBackend("no_face_detected", message);
        showWarning("no_face_detected", "WARNING: Face not detected - please return to camera");
        noFaceStartTimeRef.current = null; // Reset after triggering
      }
    }
  };

  const handleMultipleFacesViolation = () => {
    if (multipleFacesStartTimeRef.current === null) {
      multipleFacesStartTimeRef.current = Date.now();
    } else {
      const duration = Date.now() - multipleFacesStartTimeRef.current;
      if (duration > VIOLATION_DURATION_THRESHOLD) {
        const message = "Multiple faces detected in camera frame for extended period";
        logViolationToBackend("multiple_faces", message);
        showWarning("multiple_faces", "WARNING: Multiple faces detected");
        multipleFacesStartTimeRef.current = null; // Reset after triggering
      }
    }
  };

  const resetFaceCountViolations = () => {
    noFaceStartTimeRef.current = null;
    multipleFacesStartTimeRef.current = null;
  };

  const resetHeadPoseViolations = () => {
    headAwayStartTimeRef.current = null;
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
    
    // Reset all violation timers
    noFaceStartTimeRef.current = null;
    multipleFacesStartTimeRef.current = null;
    headAwayStartTimeRef.current = null;
  };

  // Process video frames with backend AI proctoring
  useEffect(() => {
    console.log('AIProctor - Frame processing useEffect called', { active, attemptId, hasWebcam: !!webcamRef.current });
    
    if (!active || !webcamRef.current || !attemptId) {
      console.log('AIProctor - Frame processing not starting', { active, hasWebcam: !!webcamRef.current, attemptId });
      return;
    }

    const video = webcamRef.current.video as HTMLVideoElement;
    console.log('AIProctor - Video element state', { video: !!video, readyState: video?.readyState });
    
    let frameInterval: NodeJS.Timeout | null = null;
    
    const startFrameProcessing = () => {
      console.log('AIProctor - Starting frame processing interval');
      const processFrame = async () => {
        const currentVideo = webcamRef.current?.video as HTMLVideoElement;
        if (currentVideo && currentVideo.readyState >= 2) {
          try {
            // Capture frame from webcam
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
              const frameData = canvas.toDataURL('image/jpeg', 0.8);

              // Send to backend for AI processing
              const token = typeof window !== 'undefined' ? window.localStorage.getItem('openassess_token') : null;
              const sessionTime = Math.floor((Date.now() - (attemptId ? 0 : Date.now())) / 1000);

              console.log('Sending frame to backend for AI proctoring...');
              
              try {
                const response = await fetch('/api/ai-proctoring/process-frame', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                  },
                  body: JSON.stringify({
                    attempt_id: attemptId,
                    frame_data: frameData,
                    session_time_seconds: sessionTime,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  console.log('AI proctoring result:', result);
                  
                  // Update UI with detection results
                  setFaceCount(result.faces_detected || 0);
                  
                  if (result.head_pose) {
                    setHeadPose({
                      pitch: 0,
                      yaw: result.head_pose === 'left' ? -45 : result.head_pose === 'right' ? 45 : 0,
                      roll: 0,
                    });
                  }
                  
                  if (result.violations_detected > 0) {
                    result.violations.forEach((violation: any) => {
                      console.log('Violation detected:', violation);
                      if (violation.type === 'head_pose') {
                        setEyeDirection(violation.data.head_pose || 'center');
                      }
                      showWarning(violation.type, violation.data.alert || 'Violation detected');
                    });
                  }
                } else {
                  console.error('AI proctoring request failed:', response.status, response.statusText);
                  const errorText = await response.text();
                  console.error('Error response:', errorText);
                }
              } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                // Don't throw - just log and continue
              }
            }
          } catch (error) {
            console.error('Failed to process frame:', error);
          }
        }
      };

      frameInterval = setInterval(processFrame, 1000); // Process every 1 second
    };
    
    if (!video || video.readyState < 2) {
      console.log('AIProctor - Video not ready, waiting...');
      const checkVideoReady = setInterval(() => {
        const v = webcamRef.current?.video as HTMLVideoElement;
        if (v && v.readyState >= 2) {
          console.log('AIProctor - Video now ready');
          clearInterval(checkVideoReady);
          startFrameProcessing();
        }
      }, 500);
      return () => {
        console.log('AIProctor - Cleaning up video ready check');
        clearInterval(checkVideoReady);
      };
    } else {
      startFrameProcessing();
    }

    return () => {
      console.log('AIProctor - Cleaning up frame processing interval');
      if (frameInterval) {
        clearInterval(frameInterval);
      }
    };
  }, [active, attemptId]);

  return (
    <>
      {/* Warning Banner */}
      {currentWarning && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-red-600 to-red-500 text-white px-6 py-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
              <div>
                <p className="font-bold text-xl">⚠️ WARNING: {currentWarning.type.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-sm opacity-90">{currentWarning.message}. Please look directly at the screen.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Activity className="w-5 h-5" />
                <span className="text-sm font-medium">Violations: {violationCount}/3</span>
              </div>
              <button
                onClick={() => setCurrentWarning(null)}
                className="text-white hover:text-red-200 transition p-2 hover:bg-white/10 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PiP Video Feed */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-green-500/50 backdrop-blur-xl" style={{ width: '160px', height: '120px' }}>
          {/* PiP Video Feed */}
          <Webcam
            ref={webcamRef}
            audio={false}
            width={160}
            height={120}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 160,
              height: 120,
              facingMode: "user",
            }}
            className="block"
            style={{ width: '160px', height: '120px' }}
          />
          
          {/* Canvas for face mesh overlay */}
          <canvas
            ref={canvasRef}
            width={160}
            height={120}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ width: '160px', height: '120px' }}
          />
          
          {/* Status Indicator */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
            <div className={`w-2.5 h-2.5 rounded-full ${isInitialized ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50" : "bg-red-500"}`} />
            <span className="text-white text-xs font-semibold">
              {isInitialized ? "🟢 AI Monitoring Active" : "Initializing..."}
            </span>
          </div>
          
          {/* Face Count Indicator */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Users className="w-4 h-4 text-white/80" />
            <span className="text-white text-xs font-medium">
              {faceCount}
            </span>
          </div>
          
          {/* Head Pose Indicator */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <Eye className="w-4 h-4 text-white/80" />
            <span className="text-white text-xs font-medium">
              {eyeDirection}
            </span>
          </div>
          
          {/* Violation Count */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${violationCount > 0 ? "text-red-400" : "text-white/80"}`} />
            <span className="text-white text-xs font-medium">
              {violationCount}/3
            </span>
          </div>
          
          {/* Violation Alert */}
          {(faceCount === 0 || faceCount > 1 || eyeDirection !== "center") && (
            <div className="absolute top-12 left-3 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-red-400 animate-pulse">
              <span className="text-white text-xs font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Alert
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
