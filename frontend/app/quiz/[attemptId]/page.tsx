"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIProctor } from "@/components/proctoring/AIProctor";
import { useAntiCheat } from "@/hooks/useAntiCheat";
import { useCamera } from "@/hooks/useCamera";
import { useTimer } from "@/hooks/useTimer";
import { portfolioService } from "@/services/portfolio.service";
import { quizService } from "@/services/quiz.service";
import { useQuizStore } from "@/store/quiz.store";

export default function QuizPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const attemptId = params?.attemptId ?? null;
  const { questions, currentIndex, answers, selectAnswer, nextQuestion, prevQuestion, setIsSubmitting, setTimeSpent, topicId } = useQuizStore();
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const { videoRef, isActive, startCamera, stopCamera } = useCamera();
  const { timeLeft, formattedTime, isExpired } = useTimer(600, () => {
    handleSubmit();
  });
  const { cheatCount, isFlagged } = useAntiCheat(attemptId);

  useEffect(() => {
    if (!attemptId) return;
    void startCamera();
    setProctoringActive(true);
    return () => {
      stopCamera();
      setProctoringActive(false);
    };
  }, [attemptId, startCamera, stopCamera]);

  useEffect(() => {
    if (questions.length > 0) {
      const question = questions[currentIndex];
      setSelectedAnswer(question ? answers[question.id] ?? null : null);
    }
  }, [answers, currentIndex, questions]);

  // Reset local state when questions change (new quiz started)
  useEffect(() => {
    setSelectedAnswer(null);
    setIsSubmitted(false);
  }, [questions]);

  const currentQuestion = questions[currentIndex];
  const progress = useMemo(() => (questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0), [currentIndex, questions.length]);

  const handleViolation = (type: string, message: string, count: number) => {
    console.log(`Proctoring violation: ${type} - ${message} (Count: ${count})`);
    if (count >= 3) {
      handleSubmit();
    }
  };

  async function handleSubmit() {
    if (isSubmitted) return;
    setIsSubmitting(true);
    setIsSubmitted(true);
    setProctoringActive(false);
    setTimeSpent(600 - timeLeft);
    const payload = {
      attempt_id: Number(attemptId),
      topic_id: Number(topicId ?? 1),
      answers: Object.entries(answers).map(([question_id, selected_option]) => ({ question_id: Number(question_id), selected_option })),
      time_taken: 600 - timeLeft,
      submission_reason: "manual" as const,
    };
    try {
      const result = await quizService.submit(payload);
      router.push(`/result/${result?.attempt_id ?? attemptId}`);
    } catch {
      router.push(`/result/${attemptId}`);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#7B7F85]">Live quiz</p>
                <h1 className="mt-2 text-2xl font-semibold text-[#2B2E33]">Question {currentIndex + 1} of {questions.length || 10}</h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[#C1C4C8]/20 px-4 py-2 text-sm font-semibold text-[#2B2E33]">{formattedTime}</div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isFlagged ? "bg-[#C1C4C8] text-[#7B7F85]" : "bg-[#2B2E33] text-[#F5F6F7]"}`}>{isFlagged ? "Flagged" : "Proctoring healthy"}</div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#C1C4C8]/40"><div className="h-full rounded-full bg-[#2B2E33] transition-all" style={{ width: `${progress}%` }} /></div>
            {currentQuestion ? (
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6">
                  <h2 className="font-['var(--font-space-grotesk)'] text-xl font-semibold text-[#2B2E33]">{currentQuestion.text}</h2>
                  <div className="mt-5 space-y-3">
                    {currentQuestion.options.map((option: any) => {
                      const optionId = typeof option === 'string' ? option : option.id;
                      const optionText = typeof option === 'string' ? option : option.text;
                      const isSelected = selectedAnswer === optionId;
                      return (
                        <button key={optionId} type="button" onClick={() => { setSelectedAnswer(optionId); selectAnswer(currentQuestion.id, optionId); }} className={`flex w-full items-center justify-between rounded-[20px] border px-4 py-4 text-left ${isSelected ? "border-[#2B2E33] bg-[#C1C4C8]/20" : "border-[#C1C4C8] bg-[#F5F6F7]"}`}>
                          <span className="font-semibold text-[#2B2E33]">{optionId}</span>
                          <span className="flex-1 pl-3 text-[#7B7F85]">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={() => prevQuestion()} className="rounded-full border border-[#C1C4C8] px-4 py-2 text-sm font-semibold text-[#7B7F85] hover:text-[#2B2E33]">Previous</button>
                    {currentIndex === questions.length - 1 ? <button type="button" onClick={handleSubmit} className="rounded-full bg-[#2B2E33] px-4 py-2 text-sm font-semibold text-[#F5F6F7] hover:bg-[#2B2E33]/90">Submit</button> : <button type="button" onClick={() => nextQuestion()} className="rounded-full bg-[#2B2E33] px-4 py-2 text-sm font-semibold text-[#F5F6F7] hover:bg-[#2B2E33]/90">Next</button>}
                  </div>
                </div>
                <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6">
                  <div className="rounded-[20px] border border-[#C1C4C8] bg-[#F5F6F7] p-4">
                    <div className="flex items-center justify-between text-sm font-semibold text-[#7B7F85]">
                      <span>Camera preview</span>
                      <span className={`rounded-full px-3 py-1 ${isActive ? "bg-[#2B2E33] text-[#F5F6F7]" : "bg-[#C1C4C8] text-[#7B7F85]"}`}>{isActive ? "Live" : "Offline"}</span>
                    </div>
                    <video ref={videoRef} autoPlay playsInline muted className="mt-4 h-56 w-full rounded-[20px] bg-[#2B2E33] object-cover" />
                  </div>
                  <div className="mt-4 rounded-[20px] border border-[#C1C4C8] bg-[#F5F6F7] p-4">
                    <p className="text-sm font-semibold text-[#7B7F85]">Proctoring status</p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[#7B7F85]"><span className={`h-3 w-3 rounded-full ${isFlagged ? "bg-[#C1C4C8]" : "bg-[#2B2E33]"}`} />{isFlagged ? `Face missing • ${cheatCount} anomalies` : "Face detected"}</div>
                  </div>
                </div>
              </div>
            ) : <div className="mt-6 text-[#7B7F85]">Loading quiz…</div>}
          </section>
        </main>
      </div>
      
      {/* AI Proctoring Component */}
      {attemptId && (
        <AIProctor
          active={proctoringActive}
          attemptId={Number(attemptId)}
          onViolation={handleViolation}
        />
      )}
    </div>
  );
}
