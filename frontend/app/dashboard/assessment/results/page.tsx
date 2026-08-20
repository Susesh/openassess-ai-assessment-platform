"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheckCircle, IconSparkles } from "@/components/icons";
import { Badge, Button, ButtonLink, Card, EmptyState, Modal } from "@/components/ui";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import { loadQuizSession } from "@/lib/quiz-session";
import { remediationService } from "@/services/remediation.service";
import type { StoredQuizSession } from "@/lib/types";

function scoreRingColor(percent: number): string {
  if (percent >= 80) return "text-emerald-600";
  if (percent >= 60) return "text-indigo-600";
  return "text-amber-600";
}

export default function AssessmentResultsPage() {
  const [session, setSession] = useState<StoredQuizSession | null>(null);
  const [checkedSession, setCheckedSession] = useState(false);
  const [showRemedialModal, setShowRemedialModal] = useState(false);
  const [loadingRemedial, setLoadingRemedial] = useState(false);
  const [remedialError, setRemedialError] = useState<string | null>(null);
  const [tutorRecommendations, setTutorRecommendations] = useState<any>(null);

  const downloadResultSummary = () => {
    if (!session) return;
    const content = [
      `${session.topicName} Assessment Result`,
      `Score: ${session.result.score}/${session.result.total}`,
      `Percentage: ${session.result.percentage}%`,
      `Status: ${session.result.passed ? "PASS" : "FAIL"}`,
      `Weak Topics: ${session.result.weak_topics.join(", ") || "None"}`,
      "",
      "Question Breakdown:",
      ...session.result.results.map((item) => `- Q${item.question_id}: ${item.is_correct ? "Correct" : "Needs review"}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${session.topicName.replace(/\s+/g, "-").toLowerCase()}-result.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleBookRemedialClass = async () => {
    if (!session) return;
    setLoadingRemedial(true);
    setRemedialError(null);
    
    try {
      // Get attempt_id from session - it might be stored differently
      const attemptId = (session.result as any).attempt_id || (session as any).attemptId;
      if (!attemptId) {
        setRemedialError("Attempt ID not found. Please try again.");
        return;
      }
      const recommendations = await remediationService.getTutorRecommendations(attemptId);
      setTutorRecommendations(recommendations);
      setShowRemedialModal(true);
    } catch (error) {
      setRemedialError("Failed to load tutor recommendations. Please try again.");
    } finally {
      setLoadingRemedial(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (!session) return;
    setLoadingRemedial(true);
    setRemedialError(null);
    
    try {
      const attemptId = (session.result as any).attempt_id || (session as any).attemptId;
      if (!attemptId) {
        setRemedialError("Attempt ID not found. Please try again.");
        return;
      }
      const result = await remediationService.autoScheduleRemedial(attemptId);
      if (result.success) {
        setShowRemedialModal(false);
        alert(`Remedial class scheduled with ${result.tutor_name} at ${new Date(result.scheduled_at).toLocaleString()}`);
      } else {
        setRemedialError(result.error || "Failed to schedule remedial class");
      }
    } catch (error) {
      setRemedialError("Failed to schedule remedial class. Please try again.");
    } finally {
      setLoadingRemedial(false);
    }
  };

  const handleBookWithTutor = async (tutorId: number, scheduledAt: string) => {
    if (!session) return;
    setLoadingRemedial(true);
    setRemedialError(null);
    
    try {
      const attemptId = (session.result as any).attempt_id || (session as any).attemptId;
      if (!attemptId) {
        setRemedialError("Attempt ID not found. Please try again.");
        return;
      }
      const result = await remediationService.bookRemedialClass(attemptId, tutorId, scheduledAt);
      setShowRemedialModal(false);
      alert(`Remedial class booked successfully! Meeting link: ${result.meeting_link}`);
    } catch (error) {
      setRemedialError("Failed to book remedial class. Please try again.");
    } finally {
      setLoadingRemedial(false);
    }
  };

  useEffect(() => {
    const data = loadQuizSession();
    const timeoutId = window.setTimeout(() => {
      setSession(data);
      setCheckedSession(true);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!session) {
    if (checkedSession) {
      return (
        <EmptyState
          icon="📊"
          title="No assessment result is available"
          description="This page needs a completed assessment session. Start or resume an assessment to view results here."
          action={
            <Link
              href="/dashboard/assessment"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Open Assessment Library
            </Link>
          }
        />
      );
    }

    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading results…
      </div>
    );
  }

  const { result, questions, topicName } = session;
  const proctoringReport = session.proctoringReport;
  const participationCertificate = result.participation_certificate;
  const scorePercent =
    result.total > 0 ? Math.round(result.percentage) : 0;
  const incorrectCount = result.total - result.score;
  const completionDate = new Date(result.completed_at);

  const strengths = result.results
    .filter((r) => r.is_correct)
    .map((r) => {
      const q = questions.find((q) => q.id === r.question_id);
      return q ? q.text.slice(0, 48) + (q.text.length > 48 ? "…" : "") : "Correct answer";
    });

  const review = result.results
    .filter((r) => !r.is_correct)
    .map((r) => {
      const q = questions.find((q) => q.id === r.question_id);
      return q ? q.text.slice(0, 48) + (q.text.length > 48 ? "…" : "") : "Review needed";
    });

  const aiSummary =
    result.results.find((r) => r.ai_explanation)?.ai_explanation ??
    (result.passed
      ? "Excellent work! You demonstrated strong understanding across this topic."
      : "Review the explanations below and retry when ready to improve your mastery.");

  const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center py-4 animate-fade-in-up sm:py-8">
      <div
        className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
          result.passed ? "bg-emerald-100" : "bg-amber-100"
        }`}
      >
        <IconCheckCircle
          className={`h-10 w-10 ${result.passed ? "text-emerald-600" : "text-amber-600"}`}
        />
      </div>

      <Badge variant={result.passed ? "success" : "warning"}>
        {result.passed
          ? `Mastery threshold met (${result.passing_percentage}%+)`
          : "Keep practicing and complete remediation before reattempt"}
      </Badge>

      <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {topicName} Assessment
      </h1>
      <p className="mt-2 max-w-md text-center text-slate-600">
        Completed on {completionDate.toLocaleDateString()} with backend scoring and AI feedback.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={downloadResultSummary}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Download Result
        </button>
        <Link
          href="/dashboard/assessment"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Retry Assessment
        </Link>
      </div>

      <Card className="mt-8 w-full p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Final Score
        </p>
        <p
          className={`mt-3 text-6xl font-bold tabular-nums ${scoreRingColor(scorePercent)}`}
        >
          {scorePercent}%
        </p>
        <p className="mt-2 text-lg font-medium text-slate-700">
          {result.score} of {result.total} questions correct
        </p>
        <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Questions
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{result.total}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Correct Answers
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-900">{result.score}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Incorrect Answers
            </p>
            <p className="mt-1 text-xl font-bold text-red-900">{incorrectCount}</p>
          </div>
          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Status
            </p>
            <p className="mt-1 text-xl font-bold text-indigo-900">
              {result.passed ? "PASS" : "FAIL"}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-6 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </Card>

      <Card className="mt-6 w-full p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Certificates Earned
        </p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">
          {result.achievement_certificate
            ? "Participation & Achievement Certificates" 
            : result.participation_certificate
              ? "Participation Certificate"
              : "Certificates not enabled for this assessment"}
        </h2>
        
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Participation Certificate */}
          {participationCertificate ? (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
              <p className="font-semibold text-indigo-900">✓ Participation</p>
              <p className="mt-1 text-sm text-indigo-700">
                {participationCertificate.certificate_id}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/dashboard/certificates/${participationCertificate.certificate_id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => downloadCertificatePdf(participationCertificate)}
                  className="inline-flex items-center justify-center rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-700">Participation</p>
              <p className="mt-1 text-sm text-slate-500">Not generated for this assessment.</p>
            </div>
          )}

          {/* Achievement Certificate (if earned) */}
          {result.achievement_certificate && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="font-semibold text-emerald-900">🏆 Achievement</p>
              <p className="mt-1 text-sm text-emerald-700">
                {result.achievement_certificate.certificate_id}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/dashboard/certificates/${result.achievement_certificate.certificate_id}`}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                >
                  View
                </Link>
                <button
                  type="button"
                  onClick={() => downloadCertificatePdf(result.achievement_certificate!)}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6 w-full p-6">
        <h2 className="text-sm font-bold text-slate-900">Assessment Outcome Actions</h2>
        {result.passed ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>PASS: Your score met the configured threshold.</p>
            {result.subtopic_certifications_awarded ? (
              <p>Subtopic certifications awarded: {result.subtopic_certifications_awarded}</p>
            ) : (
              <p>Subtopic certifications will be issued where eligibility thresholds are met.</p>
            )}
            {result.portfolio_updated ? <p>Knowledge portfolio has been updated with this result.</p> : null}
            {result.next_difficulty_unlocked ? (
              <p>Next difficulty unlocked: {result.next_difficulty_unlocked}</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p>FAIL: Complete remediation and reattempt to improve mastery.</p>
            {result.gap_analysis ? <p>{result.gap_analysis}</p> : null}
            {(result.learning_resources ?? []).map((item, idx) => (
              <p key={`${item}-${idx}`}>• {item}</p>
            ))}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="font-semibold text-slate-900 mb-2">Need extra help? Book a remedial class:</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleBookRemedialClass}
                  disabled={loadingRemedial}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  {loadingRemedial ? "Loading..." : "Book Remedial Class"}
                </Button>
                <Button
                  onClick={handleAutoSchedule}
                  disabled={loadingRemedial}
                  variant="secondary"
                >
                  Auto-Schedule
                </Button>
              </div>
              {remedialError && (
                <p className="mt-2 text-sm text-red-600">{remedialError}</p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="mt-6 w-full border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <IconSparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-indigo-900">AI Insight</h2>
            <p className="mt-2 text-sm leading-relaxed text-indigo-900/90">
              {aiSummary}
            </p>
          </div>
        </div>
      </Card>

      {proctoringReport ? (
        <Card className="mt-6 w-full p-6">
          <h2 className="text-sm font-bold text-slate-900">Proctoring Report</h2>
          <p className="mt-2 text-sm text-slate-600">
            Violations: {proctoringReport.warning_count} | Risk level: {proctoringReport.risk_level}
          </p>

          <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-slate-200">
            {proctoringReport.events.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">No proctoring events logged.</p>
            ) : (
              proctoringReport.events.map((event) => (
                <div key={event.id} className="border-b border-slate-100 p-3 text-sm last:border-0">
                  <p className="font-semibold text-slate-800">
                    {event.event_type.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{event.event_description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(event.timestamp).toLocaleString()} | Severity: {event.severity}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : null}

      <section className="mt-6 grid w-full gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              ✓
            </span>
            Strengths
          </h2>
          <ul className="mt-4 space-y-2">
            {strengths.length > 0 ? (
              strengths.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-900 ring-1 ring-emerald-100"
                >
                  {item}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">None this attempt</li>
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              !
            </span>
            Areas for Review
          </h2>
          <ul className="mt-4 space-y-2">
            {review.length > 0 ? (
              review.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-950 ring-1 ring-amber-100"
                >
                  {item}
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">All correct — great job!</li>
            )}
          </ul>
        </Card>
      </section>

      <Card className="mt-6 w-full p-6">
        <h2 className="text-sm font-bold text-slate-900">Topic-wise Analysis</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Strong Topics</p>
            <ul className="mt-3 space-y-2 text-sm text-emerald-900">
              <li>• {topicName}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Weak Topics</p>
            <ul className="mt-3 space-y-2 text-sm text-amber-900">
              {(result.weak_topics.length > 0 ? result.weak_topics : ["No weak topics identified"]).map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card className="mt-6 w-full p-6">
        <h2 className="mb-4 text-sm font-bold text-slate-900">
          Question Breakdown
        </h2>
        <ol className="space-y-4">
          {result.results.map((item, i) => {
            const q = questionsById[item.question_id];
            return (
              <li
                key={item.question_id}
                className="border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      item.is_correct
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.is_correct ? "Correct" : "Incorrect"}
                  </span>
                  <p className="text-xs font-semibold text-indigo-600">
                    Q{i + 1}
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {q?.text ?? `Question ${item.question_id}`}
                </p>
                {!item.is_correct && item.ai_explanation ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-700">AI: </span>
                    {item.ai_explanation}
                  </p>
                ) : item.explanation ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {item.explanation}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <ButtonLink href="/dashboard">Return to Dashboard</ButtonLink>
        <ButtonLink href="/dashboard/assessment" variant="secondary">
          Retry Assessment
        </ButtonLink>
        <Link
          href="/dashboard/portfolio"
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
        >
          View Portfolio
        </Link>
      </div>

      {/* Remedial Booking Modal */}
      <Modal
        open={showRemedialModal}
        onClose={() => setShowRemedialModal(false)}
        title="Book Remedial Class"
      >
        {tutorRecommendations && tutorRecommendations.success ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Based on your weak topics: <strong>{tutorRecommendations.weak_topics.join(", ")}</strong>
            </p>
            
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Recommended Tutors</h3>
              {tutorRecommendations.recommended_tutors.map((tutor: any) => (
                <div key={tutor.tutor_id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{tutor.tutor_name}</p>
                      <p className="text-sm text-slate-600">
                        ⭐ {tutor.rating} • {tutor.total_sessions} sessions • £{tutor.hourly_rate}/hr
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Subjects: {tutor.subjects.join(", ")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {tutorRecommendations.tutor_slots[tutor.tutor_id]?.slice(0, 2).map((slot: any) => (
                        <Button
                          key={slot.scheduled_at}
                          onClick={() => handleBookWithTutor(tutor.tutor_id, slot.scheduled_at)}
                          disabled={loadingRemedial}
                          className="text-xs py-1 px-2"
                        >
                          {new Date(slot.scheduled_at).toLocaleString([], {weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={handleAutoSchedule}
                disabled={loadingRemedial}
                variant="secondary"
                className="w-full"
              >
                Auto-Schedule Best Option
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {tutorRecommendations?.error || "No tutor recommendations available at this time."}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
