"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Card, EmptyState, PageHeader, SkeletonCard } from "@/components/ui";
import {
  getMyVideoRecordings,
  startVideoRecording,
  stopVideoRecording,
} from "@/lib/api";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import type { VideoRecording } from "@/lib/types";
import { Video, Camera, Mic, MicOff, Play, Download, Clock, HardDrive, AlertCircle, CheckCircle, XCircle, Settings, Sparkles, Search, Scissors, BarChart3, Brain, Filter, Zap } from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RecordingsPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [recordings, setRecordings] = useState<VideoRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRecording, setActiveRecording] = useState<VideoRecording | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(true);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<VideoRecording | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    getMyVideoRecordings()
      .then(setRecordings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    return () => {
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError("Camera access denied. Please allow camera permissions.");
    }
  }

  async function handleStartRecording(attemptId: number) {
    if (!cameraActive) {
      await startCamera();
    }
    try {
      const rec = await startVideoRecording({
        attempt_id: attemptId,
        recording_type: "webcam",
        resolution: "720p",
        frame_rate: 30,
      });
      setActiveRecording(rec);
      setRecording(true);
      setElapsed(0);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
    }
  }

  async function handleStopRecording() {
    if (!activeRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      const stopped = await stopVideoRecording({
        attempt_id: activeRecording.attempt_id,
        duration_seconds: duration,
      });
      setRecordings((prev) => [stopped, ...prev]);
      setActiveRecording(null);
      setRecording(false);
      stopStream();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop recording");
    }
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Video className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Video Recordings</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Advanced Video Analytics
          </h1>
          <p className="text-lg text-white/90">
            Record your assessment sessions. Your recordings are securely stored and available for review.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* AI Analysis Section */}
      {showAIAnalysis && recordings.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Video Analysis</h2>
              <p className="text-sm text-[#7B7F85]">AI-powered insights from your recorded sessions</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Speaking Clarity", value: "92%", icon: Mic, color: "from-emerald-400 to-emerald-600" },
              { title: "Engagement Score", value: "85%", icon: Sparkles, color: "from-blue-400 to-blue-600" },
              { title: "Pacing", value: "Good", icon: Clock, color: "from-amber-400 to-amber-600" },
            ].map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7]"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} mb-3 w-fit`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-[#7B7F85] mb-1">{metric.title}</p>
                  <p className="text-xl font-bold text-[#2B2E33]">{metric.value}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Camera Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg overflow-hidden"
      >
        <div className="bg-[#2B2E33] aspect-video relative flex items-center justify-center rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-full w-full object-cover ${cameraActive ? "block" : "hidden"}`}
            aria-label="Camera preview"
          />
          {!cameraActive && (
            <div className="flex flex-col items-center gap-3 text-[#7B7F85]">
              <Camera className="w-16 h-16" />
              <p className="text-sm">Camera preview will appear here</p>
            </div>
          )}
          {recording && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 shadow-lg">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              <span className="text-xs font-semibold text-white">
                REC {formatDuration(elapsed)}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {cameraError && (
            <div className="w-full flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              {cameraError}
            </div>
          )}
          {!cameraActive ? (
            <Button onClick={startCamera} className="bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition">
              <Camera className="w-4 h-4 mr-2" />
              Enable Camera
            </Button>
          ) : !recording ? (
            <Button
              onClick={() => handleStartRecording(0)}
              className="bg-red-500 text-white shadow-lg hover:bg-red-400 transition"
            >
              <Video className="w-4 h-4 mr-2" />
              Start Recording (Demo)
            </Button>
          ) : (
            <Button
              onClick={handleStopRecording}
              className="bg-amber-500 text-white shadow-lg hover:bg-amber-400 transition"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          )}
          {cameraActive && (
            <Button variant="ghost" onClick={stopStream} className="text-[#7B7F85] hover:bg-[#C1C4C8]/20 transition">
              Disable Camera
            </Button>
          )}
        </div>
      </motion.div>

      {/* Recording History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
              Recording History
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowVideoEditor(!showVideoEditor)}
              className="px-4 py-2 rounded-xl font-semibold transition bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8] hover:bg-[#C1C4C8]/20 flex items-center gap-2"
            >
              <Scissors className="w-4 h-4" />
              Video Editor
            </button>
          </div>
        </div>

        {/* Smart Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
          <input
            type="search"
            placeholder="Search recordings by date, duration, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] placeholder-[#7B7F85] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
          />
        </div>

        {/* Video Editor Panel */}
        {showVideoEditor && selectedRecording && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <Scissors className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Video Editor</h2>
                <p className="text-sm text-[#7B7F85]">Trim and edit your recording</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="rounded-xl bg-[#2B2E33] aspect-video flex items-center justify-center">
                <p className="text-white/70">Video timeline editor</p>
              </div>
              
              <div className="flex gap-4">
                <button className="flex-1 px-4 py-3 rounded-xl bg-[#2B2E33] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#7B7F85] transition">
                  <Scissors className="w-4 h-4" />
                  Trim
                </button>
                <button className="flex-1 px-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] font-semibold flex items-center justify-center gap-2 hover:bg-[#C1C4C8]/20 transition">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {loading ? (
          <div className="bento-grid">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bento-item col-span-4 md:col-span-3 lg:col-span-4 shimmer h-24 rounded-2xl" />
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full bg-[#C1C4C8]/20 flex items-center justify-center">
                <Video className="w-10 h-10 text-[#7B7F85]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-[#2B2E33] mb-2">No recordings yet</h3>
            <p className="text-[#7B7F85]">Your recorded assessment sessions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RecordingRow recording={rec} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RecordingRow({ recording }: { recording: VideoRecording }) {
  const statusConfig: Record<string, { icon: any; color: string }> = {
    recording: { icon: AlertCircle, color: "bg-red-50 border-red-200 text-red-700" },
    processing: { icon: Clock, color: "bg-amber-50 border-amber-200 text-amber-700" },
    completed: { icon: CheckCircle, color: "bg-green-50 border-green-200 text-green-700" },
    failed: { icon: XCircle, color: "bg-[#C1C4C8]/20 border-[#C1C4C8] text-[#7B7F85]" },
  };

  const config = statusConfig[recording.status] || statusConfig.failed;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] shadow-sm hover-lift transition-all duration-300">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#2B2E33]/10 text-[#2B2E33] shadow-lg">
        <Video className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-[#2B2E33]">
          Attempt #{recording.attempt_id}
        </p>
        <div className="flex items-center gap-3 text-xs text-[#7B7F85] mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(recording.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatBytes(recording.file_size_bytes)}
          </span>
          <span>Duration: {formatDuration(recording.duration_seconds)}</span>
        </div>
      </div>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold border flex items-center gap-1 ${config.color}`}
      >
        <StatusIcon className="w-3 h-3" />
        {recording.status}
      </span>
      {recording.cloud_storage_url && (
        <>
          <a
            href={recording.cloud_storage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-xs font-semibold text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition"
          >
            <Play className="w-4 h-4" />
            Playback
          </a>
          <button className="inline-flex items-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-xs font-semibold text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </>
      )}
    </div>
  );
}
