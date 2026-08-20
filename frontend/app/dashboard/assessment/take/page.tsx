"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CameraMonitor } from "@/components/proctoring/CameraMonitor";
import { FaceMonitor } from "@/components/proctoring/FaceMonitor";
import { FullscreenMonitor } from "@/components/proctoring/FullscreenMonitor";
import { TabMonitor } from "@/components/proctoring/TabMonitor";
import { MediaPipeFaceMonitor } from "@/components/proctoring/MediaPipeFaceMonitor";
import { AIProctor } from "@/components/proctoring/AIProctor";
import { Badge, Card } from "@/components/ui";
import { ProctoringProvider, useProctoring } from "@/contexts/proctoring-context";
import {
  ApiError,
  autosaveQuiz,
  getExamCriterion,
  getProctoringReport,
  getQuizStatus,
  startAIProctoringSession,
  startCriteriaQuiz,
  startPaperQuiz,
  startQuiz,
  startVideoRecording,
  stopVideoRecording,
  submitQuiz,
} from "@/lib/api";
import { questionPaperService } from "@/services/question-paper.service";
import {
  clearActiveAttempt,
  saveActiveAttempt,
  useAssessmentRecovery,
} from "@/hooks/use-assessment-recovery";
import { saveQuizSession } from "@/lib/quiz-session";
import type { ExamCriteria, QuestionPaper, QuizQuestion } from "@/lib/types";

const FALLBACK_QUESTION_COUNT = 50;
const WARNING_SECONDS = new Set([15 * 60, 10 * 60, 5 * 60, 60]);
const ASSESSMENT_CAMERA_ENABLED = true;

function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

function formatTimeRemaining(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type AnswerMap = Record<number, string | null>;
type TimeMap = Record<number, number>;

function TakeAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = Number(searchParams.get("topic_id"));
  const criteriaId = Number(searchParams.get("criteria_id"));
  const paperId = Number(searchParams.get("paper_id"));
  const topicName = searchParams.get("topic_name") ?? "Assessment";
  const {
    setAttemptId: setProctorAttemptId,
    warningCount,
    warningMessage,
    autoSubmitRequested,
    clearAutoSubmitRequest,
    startCamera,
    requestMicrophonePermission,
    enableFullscreen,
    verifyFaceBeforeStart,
    startFaceDetection,
    startFullscreenMonitoring,
    startTabMonitoring,
    startViolationTracking,
    startCameraMonitoring,
    stopCamera,
    stopFaceDetection,
    stopAllMonitoring,
  } = useProctoring();

  const [criteria, setCriteria] = useState<ExamCriteria | null>(null);
  const [paperMeta, setPaperMeta] = useState<QuestionPaper | null>(null);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [paperLoading, setPaperLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<AnswerMap>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [questionTime, setQuestionTime] = useState<TimeMap>({});
  const [questionStatus, setQuestionStatus] = useState<Record<number, string>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(60 * 60);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const autoSubmitRef = useRef(false);
  const currentQuestionStartedAtRef = useRef<number>(0);
  const warningSeenRef = useRef<Set<number>>(new Set());
  const recoveryAppliedRef = useRef(false);
  const stateRef = useRef({ attemptId, questions, selectedAnswers, questionTime, questionStatus, markedForReview });

  const {
    loading: recoveryLoading,
    error: recoveryError,
    data: recoveredAttempt,
  } = useAssessmentRecovery(topicId, criteriaId, paperId);
  const displayError = error ?? recoveryError;

  useEffect(() => {
    stateRef.current = { attemptId, questions, selectedAnswers, questionTime, questionStatus, markedForReview };
  }, [attemptId, questions, selectedAnswers, questionTime, questionStatus, markedForReview]);

  useEffect(() => {
    if (!criteriaId || Number.isNaN(criteriaId)) return;
    setCriteriaLoading(true);
    setCriteria(null);

    getExamCriterion(criteriaId)
      .then(setCriteria)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load criteria"))
      .finally(() => setCriteriaLoading(false));
  }, [criteriaId]);

  useEffect(() => {
    if (!paperId || Number.isNaN(paperId)) {
      return;
    }
    setPaperLoading(true);
    setPaperMeta(null);

    questionPaperService.getQuestionPaper(paperId)
      .then(setPaperMeta)
      .catch(() => setPaperMeta(null))
      .finally(() => setPaperLoading(false));
  }, [paperId]);

  const examName = criteria?.exam_name ?? topicName;
  const isPaperMode = Boolean(paperId && !Number.isNaN(paperId));
  const introQuestionCount = Math.max(
    isPaperMode ? (paperMeta?.total_questions ?? FALLBACK_QUESTION_COUNT) : (criteria?.total_questions ?? FALLBACK_QUESTION_COUNT),
    FALLBACK_QUESTION_COUNT
  );
  const expectedPaperDuration = Math.max(60, introQuestionCount * 3);
  const durationMinutes = isPaperMode ? expectedPaperDuration : Math.max(60, criteria?.duration_minutes ?? 60);
  const introLabel = isPaperMode ? "Question Paper" : "Examination Criteria";

  const answersPayload = useCallback(() => {
    const { questions: qs, selectedAnswers: answers, questionTime: times } = stateRef.current;
    return qs.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id] ?? null,
      time_spent_seconds: times[q.id] ?? 0,
    }));
  }, []);

  const statusPayload = useCallback(() => {
    const { questionStatus: status, markedForReview: review } = stateRef.current;
    const questionStatusMap: Record<string, string> = {};
    const markedForReviewList: number[] = [];
    
    for (const [qid, stat] of Object.entries(status)) {
      questionStatusMap[qid] = stat;
    }
    
    for (const [qid, marked] of Object.entries(review)) {
      if (marked) {
        markedForReviewList.push(Number(qid));
      }
    }
    
    return {
      question_status: questionStatusMap,
      marked_for_review: markedForReviewList,
    };
  }, []);

  const persistRecovery = useCallback(
    (aid: number) => {
      saveActiveAttempt({
        attemptId: aid,
        topicName: examName,
        criteriaId: criteriaId || null,
        topicId: topicId || null,
        paperId: paperId || null,
      });
    },
    [criteriaId, examName, paperId, topicId]
  );

  const mergeServerState = useCallback(
    (savedAnswers: Record<string, string | null>, savedTime: Record<string, number>, savedQuestionStatus?: Record<string, string>, savedMarkedForReview?: number[]) => {
      setSelectedAnswers((prev) => {
        const next = { ...prev };
        for (const [qid, value] of Object.entries(savedAnswers)) {
          next[Number(qid)] = value;
        }
        return next;
      });
      setQuestionTime((prev) => {
        const next = { ...prev };
        for (const [qid, value] of Object.entries(savedTime)) {
          next[Number(qid)] = value ?? 0;
        }
        return next;
      });
      if (savedQuestionStatus) {
        setQuestionStatus((prev) => {
          const next = { ...prev };
          for (const [qid, status] of Object.entries(savedQuestionStatus)) {
            next[Number(qid)] = status;
          }
          return next;
        });
      }
      if (savedMarkedForReview) {
        setMarkedForReview((prev) => {
          const next = { ...prev };
          for (const qid of savedMarkedForReview) {
            next[qid] = true;
          }
          return next;
        });
      }
    },
    []
  );

  const saveProgress = useCallback(
    async (forceAttemptId?: number) => {
      const aid = forceAttemptId ?? stateRef.current.attemptId;
      const current = stateRef.current.questions[currentQuestionIndex];
      if (!aid || stateRef.current.questions.length === 0 || autoSubmitRef.current) return;

      try {
        const response = await autosaveQuiz(
          aid,
          answersPayload(),
          current?.id,
          stateRef.current.questionStatus,
          Object.entries(stateRef.current.markedForReview)
            .filter(([, marked]) => marked)
            .map(([qid]) => Number(qid))
        );
        setSecondsRemaining(response.remaining_seconds);
        setLastSavedAt(new Date(response.saved_at).toLocaleTimeString());
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Auto-save failed. Your work is still in progress.");
      }
    },
    [answersPayload, currentQuestionIndex]
  );

  const submitCurrentAttempt = useCallback(
    async (reason: "manual" | "timeout" | "proctoring_auto_submit" = "manual") => {
      const { attemptId: aid, questions: qs } = stateRef.current;
      if (!aid || qs.length === 0 || autoSubmitRef.current) return;

      autoSubmitRef.current = true;
      setSubmitting(true);

      try {
        try {
          await saveProgress(aid);
        } catch (saveError) {
          // Autosave is best-effort. If it fails, keep submitting the attempt.
          console.warn("Autosave failed before submit", saveError);
        }
        const result = await submitQuiz(aid, answersPayload(), reason);

        try {
          await stopVideoRecording({ attempt_id: aid });
        } catch {
          // Recording can be unavailable if disabled by criteria or permission was denied.
        }

        stopCamera();
        stopFaceDetection();
        stopAllMonitoring();

        let proctoringReport;
        try {
          proctoringReport = await getProctoringReport(aid);
        } catch {
          proctoringReport = undefined;
        }

        clearActiveAttempt({ attemptId: aid, topicId, criteriaId, paperId });
        saveQuizSession({ topicName: examName, questions: qs, result, proctoringReport });
        router.push("/dashboard/assessment/results");
      } catch (err) {
        autoSubmitRef.current = false;
        setSubmitting(false);
        setError(err instanceof ApiError ? err.message : "Submit failed");
      }
    },
    [answersPayload, criteriaId, examName, paperId, router, saveProgress, stopAllMonitoring, stopCamera, stopFaceDetection, topicId]
  );

  useEffect(() => {
    if (!recoveredAttempt || recoveryAppliedRef.current) return;

    recoveryAppliedRef.current = true;
    setRecoveryMessage("Recovered your in-progress assessment.");

    const recoveredQuestions = recoveredAttempt.questions;
    setAttemptId(recoveredAttempt.attempt_id);
    setProctorAttemptId(recoveredAttempt.attempt_id);
    setQuestions(recoveredQuestions);
    setSecondsRemaining(recoveredAttempt.remaining_seconds ?? recoveredAttempt.duration_minutes * 60);
    mergeServerState(
      recoveredAttempt.saved_answers ?? {},
      recoveredAttempt.per_question_time ?? {},
      (recoveredAttempt as any).question_status ?? {},
      (recoveredAttempt as any).marked_for_review ?? []
    );
    persistRecovery(recoveredAttempt.attempt_id);
    setMonitoringActive(true);
    setHasStarted(true);

    void (async () => {
      if (ASSESSMENT_CAMERA_ENABLED) {
        const cameraReady = await startCamera();
        if (!cameraReady) {
          setError("Assessment resumed, but camera is unavailable. Re-enable camera to continue securely.");
          return;
        }

        await requestMicrophonePermission();
        startFaceDetection();
        startCameraMonitoring();
      }

      await enableFullscreen();
      startFullscreenMonitoring();
      startTabMonitoring();
      startViolationTracking();
    })();
  }, [
    enableFullscreen,
    mergeServerState,
    persistRecovery,
    recoveredAttempt,
    requestMicrophonePermission,
    setProctorAttemptId,
    startCamera,
    startCameraMonitoring,
    startFaceDetection,
    startFullscreenMonitoring,
    startTabMonitoring,
    startViolationTracking,
  ]);

  async function handleStartAssessment() {
    if ((!topicId || Number.isNaN(topicId)) && (!criteriaId || Number.isNaN(criteriaId)) && (!paperId || Number.isNaN(paperId))) {
      setError("Invalid assessment. Please select an assessment first.");
      return;
    }

    setStarting(true);
    setError(null);

    try {
      // Start quiz first to get questions immediately (performance optimization)
      const data = paperId && !Number.isNaN(paperId)
        ? await startPaperQuiz({ paperId, topicId: undefined, subtopicId: undefined }, FALLBACK_QUESTION_COUNT)
        : criteriaId && !Number.isNaN(criteriaId)
        ? await startCriteriaQuiz(criteriaId, FALLBACK_QUESTION_COUNT)
        : await startQuiz(topicId, FALLBACK_QUESTION_COUNT);

      setAttemptId(data.attempt_id);
      setProctorAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setSecondsRemaining(data.remaining_seconds ?? data.duration_minutes * 60);
      
      // Only merge server state if this is a recovered attempt (has saved answers)
      // For new assessments, start with clean state
      if (Object.keys(data.saved_answers ?? {}).length > 0) {
        mergeServerState(
          data.saved_answers ?? {},
          data.per_question_time ?? {},
          (data as any).question_status ?? {},
          (data as any).marked_for_review ?? []
        );
      } else {
        // Reset all state for new assessment
        setSelectedAnswers({});
        setQuestionTime({});
        setQuestionStatus({});
        setMarkedForReview({});
      }
      
      persistRecovery(data.attempt_id);

      // Show assessment immediately, then setup proctoring in background
      setHasStarted(true);
      currentQuestionStartedAtRef.current = Date.now();

      // Setup proctoring in background after questions are visible
      if (ASSESSMENT_CAMERA_ENABLED) {
        try {
          const cameraReady = await startCamera();
          if (!cameraReady) {
            setError("Camera permission is required for secure assessment.");
            return;
          }
          await requestMicrophonePermission();
          await verifyFaceBeforeStart();
        } catch (cameraError) {
          console.error("Camera setup error:", cameraError);
          setError("Camera setup failed. Please enable camera for secure assessment.");
          return;
        }
      }

      const fullscreenReady = await enableFullscreen();
      if (!fullscreenReady) {
        setError("Fullscreen mode is required for secure assessment.");
        return;
      }

      if (ASSESSMENT_CAMERA_ENABLED && data.video_recording_enabled) {
        try {
          await startVideoRecording({ attempt_id: data.attempt_id, recording_type: "combined" });
        } catch {
          // Keep the assessment available; proctoring logs can still record issues.
        }
      }

      if (ASSESSMENT_CAMERA_ENABLED && data.ai_proctoring_enabled) {
        try {
          await startAIProctoringSession(data.attempt_id);
        } catch {
          // AI proctoring may be disabled on machines without optional dependencies.
        }
      }

      if (ASSESSMENT_CAMERA_ENABLED) {
        startFaceDetection();
        startCameraMonitoring();
      }
      startFullscreenMonitoring();
      startTabMonitoring();
      startViolationTracking();

      setMonitoringActive(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start assessment");
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    if (!hasStarted || !attemptId) return;
    const intervalId = window.setInterval(() => {
      getQuizStatus(attemptId)
        .then((status) => {
          setSecondsRemaining(status.remaining_seconds);
          mergeServerState(status.saved_answers, status.per_question_time);
          if (status.is_submitted) void submitCurrentAttempt("timeout");
        })
        .catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(intervalId);
  }, [attemptId, hasStarted, mergeServerState, submitCurrentAttempt]);

  useEffect(() => {
    if (!hasStarted || !attemptId) return;
    const intervalId = window.setInterval(() => {
      void saveProgress(attemptId).catch(() => undefined);
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [attemptId, hasStarted, saveProgress]);

  useEffect(() => {
    if (!hasStarted || questions.length === 0) return;
    const intervalId = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
      const current = stateRef.current.questions[currentQuestionIndex];
      if (current) {
        setQuestionTime((prev) => ({
          ...prev,
          [current.id]: (prev[current.id] ?? 0) + 1,
        }));
      }
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [currentQuestionIndex, hasStarted, questions.length]);

  useEffect(() => {
    if (!hasStarted) return;
    if (WARNING_SECONDS.has(secondsRemaining) && !warningSeenRef.current.has(secondsRemaining)) {
      warningSeenRef.current.add(secondsRemaining);
      setTimeWarning(`${Math.ceil(secondsRemaining / 60)} minute${secondsRemaining === 60 ? "" : "s"} remaining`);
    }
    if (secondsRemaining === 0) {
      const timeoutId = window.setTimeout(() => {
        void submitCurrentAttempt("timeout");
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [hasStarted, secondsRemaining, submitCurrentAttempt]);

  useEffect(() => {
    if (!autoSubmitRequested) return;
    clearAutoSubmitRequest();
    const timeoutId = window.setTimeout(() => {
      void submitCurrentAttempt("proctoring_auto_submit");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [autoSubmitRequested, clearAutoSubmitRequest, submitCurrentAttempt]);

  useEffect(() => {
    return () => {
      setProctorAttemptId(null);
      stopAllMonitoring();
    };
  }, [setProctorAttemptId, stopAllMonitoring]);

  const selectOption = (questionId: number, optionValue: string) => {
    if (submitting || secondsRemaining <= 0) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionValue }));
    setQuestionStatus((prev) => ({ ...prev, [questionId]: "answered" }));
    window.setTimeout(() => {
      void saveProgress().catch(() => undefined);
    }, 0);
  };

  const updateFreeTextResponse = (questionId: number, value: string) => {
    if (submitting || secondsRemaining <= 0) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: value || null }));
    setQuestionStatus((prev) => ({ ...prev, [questionId]: value ? "answered" : "unanswered" }));
  };

  const toggleMultiSelectOption = (questionId: number, optionValue: string) => {
    if (submitting || secondsRemaining <= 0) return;
    setSelectedAnswers((prev) => {
      const current = prev[questionId];
      const parts = new Set((current ?? "").split(",").map((item) => item.trim()).filter(Boolean));
      if (parts.has(optionValue)) {
        parts.delete(optionValue);
      } else {
        parts.add(optionValue);
      }
      const nextValue = Array.from(parts).sort().join(",");
      return { ...prev, [questionId]: nextValue || null };
    });
    setQuestionStatus((prev) => ({ ...prev, [questionId]: "answered" }));
    window.setTimeout(() => {
      void saveProgress().catch(() => undefined);
    }, 0);
  };

  const toggleReview = (questionId: number) => {
    setMarkedForReview((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
    setQuestionStatus((prev) => ({ ...prev, [questionId]: prev[questionId] === "review" ? "answered" : "review" }));
  };

  const clearResponse = (questionId: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: null }));
    setQuestionStatus((prev) => ({ ...prev, [questionId]: "unanswered" }));
    window.setTimeout(() => {
      void saveProgress().catch(() => undefined);
    }, 0);
  };

  const navigateToQuestion = (index: number) => {
    if (submitting || secondsRemaining <= 0) return;
    const qid = questions[index]?.id;
    if (qid) {
      setQuestionStatus((prev) => ({ ...prev, [qid]: "visited" }));
    }
    currentQuestionStartedAtRef.current = Date.now();
    setCurrentQuestionIndex(index);
  };

  const answeredCount = useMemo(
    () => Object.values(selectedAnswers).filter((value) => value !== null).length,
    [selectedAnswers]
  );
  const reviewCount = useMemo(
    () => Object.values(markedForReview).filter(Boolean).length,
    [markedForReview]
  );

  if (!hasStarted) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col animate-fade-in-up">
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">{introLabel}</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">{examName}</h1>
              <p className="mt-2 text-sm text-slate-600">
                Review the instructions and complete device checks before starting. The timer starts only after you click Start Assessment.
              </p>
            </div>
            <Badge variant="brand">{durationMinutes} minutes</Badge>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Questions</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{introQuestionCount}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Pass Mark</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{criteria?.passing_percentage ?? 40}%</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-500">Negative Marking</p>
              <p className="mt-1 text-xl font-semibold text-slate-950">{criteria?.negative_marking ?? 0}</p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Instructions</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Minimum duration is 60 minutes. Longer configured durations are honored.</li>
              <li>Fullscreen and anti-tab-switch monitoring remain active during the assessment.</li>
              <li>Camera, microphone, recording, and AI proctoring are enabled for this assessment flow.</li>
              <li>Answers auto-save every 30 seconds and after each answer.</li>
              <li>The timer is synchronized with the backend and the exam auto-submits at expiry.</li>
              <li>Warnings appear at 15, 10, 5, and 1 minute remaining.</li>
              {criteria?.instructions ? <li>{criteria.instructions}</li> : null}
            </ul>
          </div>

          {recoveryLoading || criteriaLoading || paperLoading ? (
            <p className="mt-5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {recoveryLoading
                ? "Checking for an in-progress assessment..."
                : "Loading assessment details..."}
            </p>
          ) : null}

          {recoveryMessage ? (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {recoveryMessage}
            </p>
          ) : null}

          {displayError ? (
            <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {displayError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleStartAssessment()}
              disabled={starting || recoveryLoading || criteriaLoading || paperLoading}
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting || criteriaLoading || paperLoading ? "Starting..." : "Start Assessment"}
            </button>
            <Link
              href="/dashboard/assessment"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOption = currentQuestion ? selectedAnswers[currentQuestion.id] : null;
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isLowTime = secondsRemaining <= 5 * 60;

  if (!currentQuestion) {
    return <p className="text-center text-slate-500">Loading assessment...</p>;
  }

  const questionType = (currentQuestion.question_type ?? "mcq").toLowerCase();
  const questionElapsed = questionTime[currentQuestion.id] ?? 0;
  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const selectedMultiValues = new Set((selectedOption ?? "").split(",").map((value) => value.trim()).filter(Boolean));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col animate-fade-in-up">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">{examName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {answeredCount}/{totalQuestions} answered · {reviewCount} marked for review · {unansweredCount} remaining {lastSavedAt ? `· saved ${lastSavedAt}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div
            className={`inline-flex items-center gap-2 self-start rounded-lg px-4 py-2 text-sm font-semibold tabular-nums ${
              isLowTime ? "bg-red-50 text-red-700 ring-1 ring-red-200" : "bg-slate-900 text-white"
            }`}
          >
            <span className={isLowTime ? "text-red-500" : "text-slate-300"}>Overall</span>
            {formatTimeRemaining(secondsRemaining)}
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            <span>Question</span>
            {formatTimeRemaining(questionElapsed)}
          </div>
        </div>
      </div>

      {timeWarning ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {timeWarning}
        </p>
      ) : null}
      {warningMessage ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {warningMessage}
        </p>
      ) : null}
      {warningCount > 0 ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Proctoring Warning {Math.min(warningCount, 3)} of 3
        </p>
      ) : null}
      {displayError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </p>
      ) : null}

      {ASSESSMENT_CAMERA_ENABLED ? <CameraMonitor active={monitoringActive} /> : null}
      {ASSESSMENT_CAMERA_ENABLED ? <FaceMonitor active={monitoringActive} /> : null}
      {ASSESSMENT_CAMERA_ENABLED ? <MediaPipeFaceMonitor active={monitoringActive} onViolation={(type, message) => console.log(`AI Proctoring: ${type} - ${message}`)} /> : null}
      {ASSESSMENT_CAMERA_ENABLED ? <AIProctor active={monitoringActive} attemptId={attemptId} onViolation={(type, message, count) => console.log(`AI Proctoring: ${type} - ${message} (Count: ${count})`)} /> : null}
      <TabMonitor active={monitoringActive} />
      <FullscreenMonitor active={monitoringActive} />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question Palette</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((q, index) => {
              const answered = selectedAnswers[q.id] !== null && selectedAnswers[q.id] !== undefined;
              const review = Boolean(markedForReview[q.id]);
              const isCurrent = index === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => navigateToQuestion(index)}
                  disabled={submitting || secondsRemaining <= 0}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-slate-900 text-white"
                      : review
                        ? "bg-amber-100 text-amber-700"
                        : answered
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-600">
            <p><span className="inline-block h-2 w-2 rounded-full bg-indigo-500" /> Answered</p>
            <p><span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> Marked for review</p>
            <p><span className="inline-block h-2 w-2 rounded-full bg-slate-400" /> Not answered</p>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-slate-700">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-slate-500">{currentQuestion.difficulty} · {questionType.replace("_", " ")}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {criteria?.subject ?? topicName}
          </p>
          <h2 className="mt-3 text-lg font-semibold leading-relaxed text-slate-950 sm:text-xl">
            {currentQuestion.text}
          </h2>

          {questionType === "multiple_select" ? (
            <ul className="mt-8 space-y-3">
              {currentQuestion.options.map((option: any, index: number) => {
                const letter = optionLabel(index);
                const optionId = typeof option === 'string' ? letter : option.id;
                const optionText = typeof option === 'string' ? option : option.text;
                const checked = selectedMultiValues.has(optionId);
                return (
                  <li key={optionId}>
                    <button
                      type="button"
                      onClick={() => toggleMultiSelectOption(currentQuestion.id, optionId)}
                      disabled={submitting || secondsRemaining <= 0}
                      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition ${
                        checked ? "border-indigo-600 bg-indigo-50" : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="h-4 w-4" />
                      <span className="text-sm font-semibold text-slate-600">{optionId}</span>
                      <span className="text-base font-medium text-slate-900">{optionText}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : questionType === "true_false" ? (
            <ul className="mt-8 space-y-3">
              {["True", "False"].map((option) => {
                const isSelected = selectedOption === option;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => selectOption(currentQuestion.id, option)}
                      disabled={submitting || secondsRemaining <= 0}
                      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {option[0]}
                      </span>
                      <span className="text-base font-medium text-slate-900">{option}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : questionType === "fill_in_blank" || questionType === "numerical" ? (
            <div className="mt-8 space-y-2">
              <input
                type={questionType === "numerical" ? "number" : "text"}
                value={selectedOption ?? ""}
                onChange={(event) => updateFreeTextResponse(currentQuestion.id, event.target.value)}
                onBlur={() => {
                  void saveProgress().catch(() => undefined);
                }}
                disabled={submitting || secondsRemaining <= 0}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                placeholder={questionType === "numerical" ? "Enter numeric answer" : "Type your answer"}
              />
              <p className="text-xs text-slate-500">Enter your answer in the field above.</p>
            </div>
          ) : questionType === "assertion_reason" ? (
            <div className="mt-8 space-y-6">
              {(currentQuestion as any).assertion_statement && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Assertion (A):</p>
                  <p className="mt-2 text-sm text-slate-900">{(currentQuestion as any).assertion_statement}</p>
                </div>
              )}
              {(currentQuestion as any).reason_statement && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Reason (R):</p>
                  <p className="mt-2 text-sm text-slate-900">{(currentQuestion as any).reason_statement}</p>
                </div>
              )}
              <ul className="space-y-3">
                {["Both A and R are true and R is the correct explanation of A", "Both A and R are true but R is not the correct explanation of A", "A is true but R is false", "A is false but R is true"].map((option, index) => {
                  const letter = optionLabel(index);
                  const isSelected = selectedOption === letter;
                  return (
                    <li key={letter}>
                      <button
                        type="button"
                        onClick={() => selectOption(currentQuestion.id, letter)}
                        disabled={submitting || secondsRemaining <= 0}
                        className={`flex w-full items-start gap-4 rounded-lg border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                            isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-medium text-slate-900">{option}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : ["short_answer", "long_answer", "case_study"].includes(questionType) ? (
            <div className="mt-8 space-y-2">
              {(currentQuestion as any).case_study_text && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Case Study:</p>
                  <p className="mt-2 text-sm text-slate-900">{(currentQuestion as any).case_study_text}</p>
                </div>
              )}
              <textarea
                value={selectedOption ?? ""}
                onChange={(event) => updateFreeTextResponse(currentQuestion.id, event.target.value)}
                onBlur={() => {
                  void saveProgress().catch(() => undefined);
                }}
                disabled={submitting || secondsRemaining <= 0}
                rows={questionType === "long_answer" || questionType === "case_study" ? 8 : 4}
                className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400"
                placeholder={questionType === "numerical" ? "Enter numeric answer" : "Type your answer"}
              />
              <p className="text-xs text-slate-500">Subjective responses are saved and can be reviewed in results.</p>
            </div>
          ) : (
            <ul className="mt-8 space-y-3">
              {currentQuestion.options.map((option: any, index: number) => {
                const letter = optionLabel(index);
                const optionId = typeof option === 'string' ? letter : option.id;
                const optionText = typeof option === 'string' ? option : option.text;
                const isSelected = selectedOption === optionId;
                return (
                  <li key={optionId}>
                    <button
                      type="button"
                      onClick={() => selectOption(currentQuestion.id, optionId)}
                      disabled={submitting || secondsRemaining <= 0}
                      className={`flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {optionId}
                      </span>
                      <span className="text-base font-medium text-slate-900">{optionText}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toggleReview(currentQuestion.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${markedForReview[currentQuestion.id] ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}
            >
              {markedForReview[currentQuestion.id] ? "Unmark Review" : "Mark for Review"}
            </button>
            <button
              type="button"
              onClick={() => clearResponse(currentQuestion.id)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Clear Response
            </button>
          </div>

          <footer className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0 || submitting}
              className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submitCurrentAttempt("manual")}
                disabled={submitting || secondsRemaining <= 0}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </button>
              {!isLastQuestion && (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next Question
                </button>
              )}
            </div>
          </footer>
        </Card>
      </div>
    </div>
  );
}

export default function TakeAssessmentPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Loading...</p>}>
      <ProctoringProvider>
        <TakeAssessmentContent />
      </ProctoringProvider>
    </Suspense>
  );
}
