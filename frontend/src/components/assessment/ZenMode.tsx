"use client";

import { useState, useEffect, useRef } from "react";
import { X, Maximize2, Minimize2, Clock, AlertCircle } from "lucide-react";

interface ZenModeProps {
  isActive: boolean;
  onToggle: () => void;
  timeRemaining: number;
  questionNumber: number;
  totalQuestions: number;
  children: React.ReactNode;
}

export function ZenMode({
  isActive,
  onToggle,
  timeRemaining,
  questionNumber,
  totalQuestions,
  children,
}: ZenModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && !isFullscreen) {
      enterFullscreen();
    }
    return () => {
      if (isFullscreen) {
        exitFullscreen();
      }
    };
  }, [isActive]);

  const enterFullscreen = async () => {
    try {
      if (containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Exit fullscreen failed:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-slate-950 z-50 flex flex-col"
    >
      {/* Minimal Zen Mode Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900/50 border-b border-slate-800/50">
        <div className="flex items-center gap-6">
          {/* Time Display */}
          <div className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-indigo-400" />
            <span className="text-2xl font-mono font-bold">
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Question Progress */}
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
        </div>

        {/* Exit Zen Mode Button */}
        <button
          onClick={() => {
            exitFullscreen();
            onToggle();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Exit Zen Mode
        </button>
      </div>

      {/* Content Area - Distraction Free */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">{children}</div>
      </div>

      {/* Minimal Footer */}
      <div className="px-6 py-2 bg-slate-900/50 border-t border-slate-800/50">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Proctored Assessment Mode - All navigation disabled</span>
        </div>
      </div>
    </div>
  );
}
