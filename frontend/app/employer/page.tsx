"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Download, Shield, Users, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import api from "@/services/api";

interface EmployerMetrics {
  total_assessments: number;
  candidates_screened: number;
  flagged_violations: number;
  avg_integrity_score: number;
}

interface Assessment {
  id: number;
  title: string;
  subject: string;
  candidate_count: number;
  avg_score: number;
  created_at: string;
}

interface ProctoringSession {
  session_id: number;
  candidate_name: string;
  test_title: string;
  completion_date: string;
  score: number;
  integrity_score: number | null;
  risk_category: string;
  violation_count: number;
}

export default function EmployerDashboard() {
  const [metrics, setMetrics] = useState<EmployerMetrics | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, assessmentsRes, sessionsRes] = await Promise.all([
        api.get("/employer/metrics"),
        api.get("/employer/assessments"),
        api.get("/employer/proctoring/sessions"),
      ]);

      setMetrics(metricsRes.data);
      setAssessments(assessmentsRes.data);
      setSessions(sessionsRes.data);
    } catch (err) {
      console.error("Failed to fetch employer data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (category: string) => {
    switch (category) {
      case "LOW_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#2B2E33] text-[#F5F6F7] border border-[#2B2E33]">
            <CheckCircle className="w-3 h-3" />
            Clear
          </span>
        );
      case "MEDIUM_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F6F7] text-[#7B7F85] border border-[#C1C4C8]">
            <AlertTriangle className="w-3 h-3 text-[#7B7F85]" />
            Caution
          </span>
        );
      case "HIGH_RISK":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F6F7] text-[#2B2E33] border border-[#7B7F85]">
            <XCircle className="w-3 h-3 text-[#2B2E33]" />
            Flagged
          </span>
        );
      default:
        return null;
    }
  };

  const exportCSV = () => {
    const csvContent = [
      ["Candidate Name", "Test Title", "Completion Date", "Score", "Integrity Score", "Risk Category", "Violations"],
      ...sessions.map(s => [
        s.candidate_name,
        s.test_title,
        new Date(s.completion_date).toLocaleDateString(),
        s.score.toFixed(1),
        s.integrity_score?.toFixed(1) || "N/A",
        s.risk_category,
        s.violation_count,
      ]),
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proctoring_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex items-center justify-center">
        <div className="text-[#2B2E33] font-medium">Loading employer portal...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex items-center justify-center">
        <div className="text-[#2B2E33] font-medium">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-[#2B2E33]">
      {/* Header */}
      <div className="border-b border-[#C1C4C8] bg-[#F5F6F7] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#2B2E33]">Employer Portal</h1>
            <p className="text-[#7B7F85] text-sm mt-1">AI-Powered Assessment & Candidate Integrity Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/employer/tests/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2B2E33] hover:bg-[#2B2E33]/90 text-[#F5F6F7] rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Create Assessment
            </Link>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#F5F6F7] hover:bg-[#C1C4C8]/20 border border-[#C1C4C8] text-[#2B2E33] rounded-xl font-semibold text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2B2E33] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#F5F6F7]" />
              </div>
              <span className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Active</span>
            </div>
            <div className="text-3xl font-bold text-[#2B2E33] mb-1">{metrics?.total_assessments || 0}</div>
            <div className="text-sm text-[#7B7F85]">Total Assessments</div>
          </div>

          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2B2E33] flex items-center justify-center">
                <Users className="w-6 h-6 text-[#F5F6F7]" />
              </div>
              <span className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Screened</span>
            </div>
            <div className="text-3xl font-bold text-[#2B2E33] mb-1">{metrics?.candidates_screened || 0}</div>
            <div className="text-sm text-[#7B7F85]">Candidates Tested</div>
          </div>

          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#7B7F85] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#F5F6F7]" />
              </div>
              <span className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Flagged</span>
            </div>
            <div className="text-3xl font-bold text-[#2B2E33] mb-1">{metrics?.flagged_violations || 0}</div>
            <div className="text-sm text-[#7B7F85]">Integrity Violations</div>
          </div>

          <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-[#2B2E33] flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-[#F5F6F7]" />
              </div>
              <span className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Score</span>
            </div>
            <div className="text-3xl font-bold text-[#2B2E33] mb-1">{metrics?.avg_integrity_score?.toFixed(1) || 0}%</div>
            <div className="text-sm text-[#7B7F85]">Avg Integrity Score</div>
          </div>
        </div>

        {/* Proctoring Audit Table */}
        <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#C1C4C8]">
            <h2 className="text-lg font-bold text-[#2B2E33]">AI Proctoring Live Audit Stream</h2>
            <p className="text-sm text-[#7B7F85] mt-1">Real-time integrity monitoring for candidate sessions</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#C1C4C8]/20 border-b border-[#C1C4C8]">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Test Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Completion Date</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Integrity</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C1C4C8]">
                {sessions.map((session) => (
                  <tr key={session.session_id} className="hover:bg-[#C1C4C8]/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#2B2E33]">{session.candidate_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#2B2E33]">{session.test_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#7B7F85]">
                        {new Date(session.completion_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#2B2E33]">{session.score.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[#2B2E33]">
                        {session.integrity_score ? `${session.integrity_score.toFixed(1)}%` : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRiskBadge(session.risk_category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/employer/proctoring/${session.session_id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-[#2B2E33] hover:underline rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Audit Telemetry
                      </Link>
                    </td>
                  </tr>
                ))}
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-[#7B7F85]">
                      No proctoring sessions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Assessments */}
        <div className="bg-[#F5F6F7] border border-[#C1C4C8] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#C1C4C8]">
            <h2 className="text-lg font-bold text-[#2B2E33]">Recent Assessments</h2>
            <p className="text-sm text-[#7B7F85] mt-1">Assessments created and their performance metrics</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#C1C4C8]/20 border-b border-[#C1C4C8]">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Candidates</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Avg Score</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-[#7B7F85] uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C1C4C8]">
                {assessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-[#C1C4C8]/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-[#2B2E33]">{assessment.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#7B7F85]">{assessment.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#2B2E33]">{assessment.candidate_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[#2B2E33]">{assessment.avg_score.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#7B7F85]">
                        {new Date(assessment.created_at).toLocaleDateString()}
                      </div>
                    </td>
                  </tr>
                ))}
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#7B7F85]">
                      No assessments found. Create your first assessment to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

