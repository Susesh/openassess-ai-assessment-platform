"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Minimize2, Maximize2, X, Shield, AlertCircle } from "lucide-react";

interface PipCameraProps {
  isActive: boolean;
  onViolation?: (type: string, message: string) => void;
  className?: string;
}

export function PipCamera({ isActive, onViolation, className = "" }: PipCameraProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Camera access failed:", error);
      onViolation?.("camera_failed", "Unable to access camera for proctoring");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMinimized) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed z-50 ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden transition-all duration-300 ${
          isMinimized ? "w-16 h-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-slate-700/50">
          {!isMinimized && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-white">Live Proctoring</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3 text-slate-400" />
              ) : (
                <Minimize2 className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Video Feed */}
        {!isMinimized && (
          <div className="relative aspect-video bg-slate-950">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay Indicators */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] font-medium text-emerald-400">Secure</span>
              </div>
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full">
                <Camera className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-medium text-blue-400">HD</span>
              </div>
            </div>
          </div>
        )}

        {/* Minimized State */}
        {isMinimized && (
          <div className="w-16 h-16 flex items-center justify-center">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <Camera className="w-5 h-5 text-slate-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-slate-900" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
