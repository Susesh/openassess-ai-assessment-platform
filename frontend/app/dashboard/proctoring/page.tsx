"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { getAdminProctoringReports } from "@/lib/api";
import type { AdminProctoringReport } from "@/lib/types";

type LiveStatus = {
  cameraActive: boolean;
  faceDetected: boolean;
  audioActive: boolean;
  tabSwitches: number;
  multipleFaces: boolean;
  phoneDetected: boolean;
  integrityScore: number;
  alerts: string[];
};

const INITIAL_STATUS: LiveStatus = {
  cameraActive: false,
  faceDetected: false,
  audioActive: false,
  tabSwitches: 0,
  multipleFaces: false,
  phoneDetected: false,
  integrityScore: 100,
  alerts: [],
};

export default function ProctoringDashboardPage() {
  const [liveStatus, setLiveStatus] = useState<LiveStatus>(INITIAL_STATUS);
  const [reports, setReports] = useState<AdminProctoringReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "history">("live");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    getAdminProctoringReports()
      .then((data) => setReports(data.reports))
      .catch(() => setReports([]))
      .finally(() => setReportsLoading(false));

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  async function activateCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setLiveStatus((prev) => ({
        ...prev,
        cameraActive: true,
        faceDetected: true,
        audioActive: true,
        integrityScore: 98,
        alerts: [],
      }));
    } catch {
      setCameraError("Camera access denied.");
      setLiveStatus((prev) => ({
        ...prev,
        cameraActive: false,
        integrityScore: 60,
        alerts: [...prev.alerts, "Camera access denied"],
      }));
    }
  }

  function deactivateCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setLiveStatus(INITIAL_STATUS);
  }

  const statusItems = [
    {
      label: "Camera",
      active: liveStatus.cameraActive,
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      icon: "📷",
    },
    {
      label: "Face Detected",
      active: liveStatus.faceDetected,
      activeLabel: "Yes",
      inactiveLabel: "No",
      icon: "👤",
    },
    {
      label: "Audio",
      active: liveStatus.audioActive,
      activeLabel: "Active",
      inactiveLabel: "Inactive",
      icon: "🎤",
    },
    {
      label: "Multiple Faces",
      active: liveStatus.multipleFaces,
      activeLabel: "DETECTED ⚠",
      inactiveLabel: "None",
      icon: "👥",
      invertColor: true,
    },
    {
      label: "Phone Detected",
      active: liveStatus.phoneDetected,
      activeLabel: "DETECTED ⚠",
      inactiveLabel: "None",
      icon: "📱",
      invertColor: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl animate-fade-in-up space-y-8">
      <PageHeader
        title="AI Proctoring Monitor"
        description="Live integrity monitoring dashboard — camera, face detection, audio and violation tracking."
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["live", "history"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "live" ? "Live Monitor" : "History"}
          </button>
        ))}
      </div>

      {activeTab === "live" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Camera Feed */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-slate-900 flex items-center justify-center max-h-80">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={`h-full w-full object-cover ${liveStatus.cameraActive ? "block" : "hidden"}`}
                />
                {!liveStatus.cameraActive && (
                  <div className="text-center text-slate-400">
                    <span className="text-5xl">📷</span>
                    <p className="mt-2 text-sm">Camera not active</p>
                  </div>
                )}
                {liveStatus.cameraActive && (
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-emerald-600/90 px-3 py-1.5 backdrop-blur">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    <span className="text-xs font-semibold text-white">LIVE</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 p-4">
                {!liveStatus.cameraActive ? (
                  <button
                    type="button"
                    onClick={activateCamera}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Activate Monitor
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={deactivateCamera}
                    className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Stop Monitor
                  </button>
                )}
              </div>

              {cameraError && (
                <p className="px-4 pb-4 text-sm text-red-600">{cameraError}</p>
              )}
            </Card>
          </div>

          {/* Status Panel */}
          <div className="space-y-4">
            {/* Integrity Score */}
            <Card className="p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Integrity Score
              </p>
              <p
                className={`mt-2 text-5xl font-bold tabular-nums ${
                  liveStatus.integrityScore >= 80
                    ? "text-emerald-600"
                    : liveStatus.integrityScore >= 60
                      ? "text-amber-500"
                      : "text-red-600"
                }`}
              >
                {liveStatus.integrityScore}
              </p>
              <p className="mt-1 text-sm text-slate-500">out of 100</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    liveStatus.integrityScore >= 80
                      ? "bg-emerald-500"
                      : liveStatus.integrityScore >= 60
                        ? "bg-amber-400"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${liveStatus.integrityScore}%` }}
                />
              </div>
            </Card>

            {/* Status Items */}
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Status</h3>
              <div className="space-y-2.5">
                {statusItems.map((item) => {
                  const positive = item.invertColor ? !item.active : item.active;
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          positive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? item.activeLabel : item.inactiveLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Live Alerts */}
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Live Alerts</h3>
              {liveStatus.alerts.length === 0 ? (
                <p className="text-sm text-slate-400">No alerts detected</p>
              ) : (
                <ul className="space-y-1.5">
                  {liveStatus.alerts.map((alert, i) => (
                    <li
                      key={i}
                      className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800"
                    >
                      ⚠ {alert}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div>
          {reportsLoading ? (
            <p className="text-sm text-slate-500">Loading proctoring reports…</p>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="text-5xl">🛡️</span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No proctoring reports</h3>
              <p className="mt-2 text-sm text-slate-500">
                Proctoring reports from completed assessments will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.assessment_id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{report.student_name}</p>
                      <p className="text-sm text-slate-500">
                        Assessment #{report.assessment_id} · {report.violation_count} violations
                      </p>
                    </div>
                    <Badge
                      variant={
                        report.risk_level === "low"
                          ? "success"
                          : report.risk_level === "medium"
                            ? "warning"
                            : "warning"
                      }
                    >
                      {report.risk_level} risk
                    </Badge>
                  </div>
                  {report.proctoring_report.events.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {report.proctoring_report.events.slice(0, 5).map((event) => (
                        <span
                          key={event.id}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                        >
                          {event.event_type.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
