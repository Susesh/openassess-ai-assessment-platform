"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock, Shield, Download, Camera } from "lucide-react";
import api from "@/services/api";

interface TimelineEvent {
  timestamp: string;
  event_type: string;
  description: string;
  severity: string;
}

interface SessionDetail {
  session_id: number;
  candidate_name: string;
  test_title: string;
  completion_date: string;
  score: number;
  integrity_score: number | null;
  risk_category: string;
  violation_count: number;
  timeline_events: TimelineEvent[];
  webcam_snapshots: string[];
}

export default function ProctoringAuditPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = parseInt(params.sessionId as string);
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/employer/proctoring/sessions/${sessionId}`);
      setSession(response.data);
      if (response.data.timeline_events.length > 0) {
        setSelectedEvent(response.data.timeline_events[0]);
      }
    } catch (err) {
      console.error("Failed to fetch session detail:", err);
      setError("Failed to load session data");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-700 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const getRiskBadge = (category: string) => {
    switch (category) {
      case "LOW_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 border border-green-200">
            <CheckCircle className="w-4 h-4" />
            Low Risk
          </span>
        );
      case "MEDIUM_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            Medium Risk
          </span>
        );
      case "HIGH_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-4 h-4 text-red-600" />
            High Risk
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleAction = async (action: string) => {
    try {
      const response = await api.post(`/employer/proctoring/sessions/${sessionId}/action`, {
        action,
        notes: `Recruiter action: ${action}`
      });
      alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action recorded successfully`);
      // Refresh session data to show updated status
      fetchSessionDetail();
    } catch (error) {
      console.error("Failed to record action:", error);
      alert("Failed to record action. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 font-medium">Loading session telemetry...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-900 font-medium">{error || "Session not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proctoring Audit</h1>
              <p className="text-gray-600 text-sm">Session ID: {session.session_id}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-900 rounded-xl font-semibold text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="py-8 space-y-6">
        {/* Candidate Overview Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Candidate Name</div>
              <div className="text-lg font-bold text-gray-900">{session.candidate_name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Test Title</div>
              <div className="text-lg font-bold text-gray-900">{session.test_title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Final Score</div>
              <div className="text-lg font-bold text-gray-900">{session.score.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1 font-semibold uppercase tracking-wider">Integrity Score</div>
              <div className="text-lg font-bold text-gray-900">
                {session.integrity_score ? `${session.integrity_score.toFixed(1)}%` : "N/A"}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  Completed: {new Date(session.completion_date).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">
                  {session.violation_count} violations detected
                </span>
              </div>
            </div>
            {getRiskBadge(session.risk_category)}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Visual Telemetry Timeline</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {session.timeline_events.map((event, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedEvent(event)}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedEvent === event
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-mono ${selectedEvent === event ? "text-white" : "text-gray-900"} font-bold`}>
                          {formatTime(event.timestamp)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${getSeverityColor(event.severity)}`}
                        >
                          {event.severity}
                        </span>
                      </div>
                      <div className={`text-sm font-semibold ${selectedEvent === event ? "text-white" : "text-gray-900"}`}>{event.event_type}</div>
                      <div className={`text-sm ${selectedEvent === event ? "text-gray-200" : "text-gray-600"} mt-1`}>{event.description}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {session.timeline_events.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  No violations detected during this session
                </div>
              )}
            </div>
          </div>

          {/* Snapshot Viewer */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Violation Snapshot</h2>
            
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                  <div className="text-center text-gray-600">
                    <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 text-gray-400" />
                    <p className="text-sm font-medium">Webcam frame at {formatTime(selectedEvent.timestamp)}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-2">Event Details</div>
                  <div className="text-gray-900 font-bold">{selectedEvent.event_type}</div>
                  <div className="text-gray-600 text-sm mt-1">{selectedEvent.description}</div>
                  <div className="text-gray-600 text-xs mt-2">
                    {new Date(selectedEvent.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                <div className="text-center text-gray-600">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50 text-gray-400" />
                  <p className="text-sm font-medium">Select an event to view snapshot</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recruiter Action Bar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Recruiter Actions</h2>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleAction("approve")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Approve Result
            </button>
            
            <button
              onClick={() => handleAction("flag")}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold text-sm transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Flag for Re-examination
            </button>
            
            <button
              onClick={() => handleAction("disqualify")}
              className="flex items-center gap-2 px-6 py-3 border border-red-300 bg-white hover:bg-red-50 text-red-600 rounded-xl font-semibold text-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Disqualify Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
