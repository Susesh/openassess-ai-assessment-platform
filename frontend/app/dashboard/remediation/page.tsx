"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getRemediationHistory, getRemediationPlan } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";
import type { RemediationHistory, RemediationPlan } from "@/lib/types";
import { ArrowRight, Clock, Target, BookOpen, Video, FileText, CheckCircle, Circle, Play } from "lucide-react";

export default function RemediationPage() {
  const [history, setHistory] = useState<RemediationHistory | null>(null);
  const [plan, setPlan] = useState<RemediationPlan | null>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getRemediationHistory()
      .then(setHistory)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!history?.attempts?.length) {
      return;
    }
    if (selectedAttemptId !== null) {
      return;
    }
    void loadPlan(history.attempts[0].attempt_id);
  }, [history, selectedAttemptId]);

  async function loadPlan(attemptId: number) {
    setSelectedAttemptId(attemptId);
    setPlanLoading(true);
    setPlan(null);
    try {
      const data = await getRemediationPlan(attemptId);
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plan");
    } finally {
      setPlanLoading(false);
    }
  }

  const displayedWrongCount = plan
    ? Math.max(0, (plan.total_question_count ?? plan.total) - (plan.score ?? 0))
    : 0;
  const displayedTotalCount = plan ? (plan.total_question_count ?? plan.total) : 0;

  return (
    <div className="mx-auto max-w-6xl animate-fade-in-up">
      <PageHeader
        title="Adaptive Learning Path"
        description="Personalised remediation recommendations based on your performance."
      />

      {loading ? (
        <p className="text-[#7B7F85]">Loading your learning path…</p>
      ) : error ? (
        <p className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</p>
      ) : !history?.attempts.length ? (
        <Card className="p-8 text-center transition-all duration-300 hover:border-[#059669]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
          <CheckCircle className="w-16 h-16 mx-auto text-[#059669]" />
          <p className="mt-3 text-lg font-bold text-[#F5F6F7] tracking-tight">All caught up!</p>
          <p className="mt-1 text-sm text-[#7B7F85]">
            No failed assessments found. Keep up the great work!
          </p>
          <Link
            href="/dashboard/assessment"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#059669]/80 px-5 py-2.5 text-sm font-bold text-[#F5F6F7] shadow-lg shadow-[#059669]/30 hover:from-[#059669]/90 hover:to-[#059669]/70 transition-all duration-300"
          >
            Take an Assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Learning Path */}
          <div className="lg:col-span-1">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#7B7F85]">
              Your Learning Path
            </h2>
            <div className="space-y-3">
              {history.attempts.map((a, index) => (
                <div key={a.attempt_id} className="relative">
                  {/* Path line */}
                  {index < history.attempts.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-[#C1C4C8]" />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => void loadPlan(a.attempt_id)}
                    className={`relative w-full rounded-xl border p-4 text-left transition-all duration-300 ${
                      selectedAttemptId === a.attempt_id
                        ? "border-[#EA580C] bg-[#EA580C]/10 shadow-lg shadow-[#EA580C]/20"
                        : "border-[#C1C4C8]/30 bg-[#2B2E33]/50 hover:border-[#EA580C]/50 hover:bg-[#EA580C]/10 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        selectedAttemptId === a.attempt_id
                          ? "bg-[#EA580C] text-[#F5F6F7]"
                          : "bg-[#C1C4C8] text-[#7B7F85]"
                      }`}>
                        {selectedAttemptId === a.attempt_id ? (
                          <Target className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[#F5F6F7] tracking-tight text-sm">{a.topic_name}</p>
                        <p className="mt-0.5 text-xs text-[#7B7F85]">
                          Score: {a.score}/{a.total} ({a.percentage}%)
                        </p>
                        <p className="text-xs text-[#7B7F85] flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(a.completed_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Remediation Recommendations */}
          <div className="lg:col-span-2">
            {planLoading ? (
              <Card className="flex items-center justify-center p-12 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                <div className="text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#C1C4C8] border-t-[#1A56DB]" />
                  <p className="mt-3 text-sm text-[#7B7F85]">Generating personalised plan…</p>
                </div>
              </Card>
            ) : plan ? (
              <div className="space-y-4">
                {/* Topic Overview */}
                <Card className="p-6 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#F5F6F7] tracking-tight">{plan.topic_name}</h3>
                      <p className="mt-0.5 text-sm text-[#7B7F85]">
                        Score: {plan.score}/{plan.total} ({plan.percentage}%)
                      </p>
                    </div>
                    <span className="rounded-full bg-[#EA580C]/20 border border-[#EA580C]/30 px-3 py-1 text-xs font-bold text-[#EA580C]">
                      Needs Improvement
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#C1C4C8]/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#EA580C] to-[#EA580C]/80 shadow-lg shadow-[#EA580C]/30"
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-[#7B7F85]">
                    {displayedWrongCount} wrong out of {displayedTotalCount} questions
                  </p>
                </Card>

                {/* Weak Areas as Actionable Cards */}
                {plan.weak_subtopics.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-sm font-bold text-[#F5F6F7] tracking-tight flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#EA580C]" />
                      Focus Areas
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {plan.weak_subtopics.map((subtopic, i) => (
                        <Card
                          key={`${subtopic}-${i}`}
                          className="p-4 transition-all duration-300 hover:border-[#EA580C]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-[#F5F6F7] text-sm">{subtopic}</h5>
                            <span className="text-xs text-[#EA580C] font-medium">Priority {i + 1}</span>
                          </div>
                          <p className="text-xs text-[#7B7F85] mb-3">
                            This area needs focused practice to improve your overall score.
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs text-[#7B7F85]">
                              <Clock className="w-3 h-3" />
                              <span>~15 min</span>
                            </div>
                            <button className="text-xs font-medium text-[#1A56DB] hover:text-[#1A56DB]/80 transition-colors flex items-center gap-1">
                              Start Practice
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Plan as Actionable Steps */}
                <Card className="p-6 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                  <h4 className="mb-4 text-sm font-bold text-[#F5F6F7] tracking-tight flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1A56DB]" />
                    Recommended Study Path
                  </h4>
                  <div className="space-y-3">
                    {plan.study_plan.map((step, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1A56DB]/20 text-xs font-bold text-[#1A56DB] border border-[#1A56DB]/30">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-[#F5F6F7]">{step}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-[#7B7F85]">
                            <Clock className="w-3 h-3" />
                            <span>~{10 + (i * 5)} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Resources as Actionable Cards */}
                <div>
                  <h4 className="mb-3 text-sm font-bold text-[#F5F6F7] tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#1A56DB]" />
                    Learning Resources
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {plan.resources.courses?.length && (
                      <Card className="p-4 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-4 h-4 text-[#1A56DB]" />
                          <h5 className="text-xs font-bold uppercase tracking-wide text-[#7B7F85]">Courses</h5>
                        </div>
                        <ul className="space-y-1">
                          {plan.resources.courses.map((item, i) => (
                            <li key={i} className="text-xs text-[#F5F6F7]">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                    )}
                    {plan.resources.videos?.length && (
                      <Card className="p-4 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="w-4 h-4 text-[#1A56DB]" />
                          <h5 className="text-xs font-bold uppercase tracking-wide text-[#7B7F85]">Videos</h5>
                        </div>
                        <ul className="space-y-1">
                          {plan.resources.videos.map((item, i) => (
                            <li key={i} className="text-xs text-[#F5F6F7]">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                    )}
                    {plan.resources.practice?.length && (
                      <Card className="p-4 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-[#1A56DB]" />
                          <h5 className="text-xs font-bold uppercase tracking-wide text-[#7B7F85]">Practice</h5>
                        </div>
                        <ul className="space-y-1">
                          {plan.resources.practice.map((item, i) => (
                            <li key={i} className="text-xs text-[#F5F6F7]">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                    )}
                    {plan.resources.notes?.length && (
                      <Card className="p-4 transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-[#1A56DB]" />
                          <h5 className="text-xs font-bold uppercase tracking-wide text-[#7B7F85]">Notes</h5>
                        </div>
                        <ul className="space-y-1">
                          {plan.resources.notes.map((item, i) => (
                            <li key={i} className="text-xs text-[#F5F6F7]">• {item}</li>
                          ))}
                        </ul>
                      </Card>
                    )}
                  </div>
                </div>

                {/* Next Steps with Direct Action */}
                <Card className="p-6 transition-all duration-300 hover:border-[#059669]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                  <h4 className="mb-4 text-sm font-bold text-[#F5F6F7] tracking-tight flex items-center gap-2">
                    <Play className="w-4 h-4 text-[#059669]" />
                    Next Steps
                  </h4>
                  <div className="space-y-2 mb-4">
                    {plan.next_steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-[#7B7F85]">
                        <CheckCircle className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/assessment"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#059669]/80 px-5 py-2.5 text-sm font-bold text-[#F5F6F7] shadow-lg shadow-[#059669]/30 hover:from-[#059669]/90 hover:to-[#059669]/70 transition-all duration-300"
                  >
                    Retry Assessment
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              </div>
            ) : (
              <Card className="flex items-center justify-center p-12 text-center transition-all duration-300 hover:border-[#1A56DB]/50 hover:shadow-lg border border-[#C1C4C8]/30 bg-[#2B2E33]/80 backdrop-blur-md">
                <div>
                  <Target className="w-16 h-16 mx-auto text-[#7B7F85]" />
                  <p className="mt-3 text-sm text-[#7B7F85]">
                    Select a failed assessment to see your personalised learning path
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
