"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { quizService } from "@/services/quiz.service";
import { useQuizStore } from "@/store/quiz.store";

export default function AssessPage() {
  const params = useParams<{ topicId: string }>();
  const topicId = params?.topicId ?? "1";
  const [topicName, setTopicName] = useState("Topic Preview");
  const [difficulty, setDifficulty] = useState("medium");
  const { setQuestions, setAttemptId, setTopicId } = useQuizStore();

  useEffect(() => {
    quizService.getTopics().then((data) => {
      const topics = Array.isArray(data) ? data : [];
      const topic = topics.find((item: { id?: number; name?: string }) => String(item.id) === String(topicId));
      if (topic) {
        setTopicName(topic.name ?? "Topic Preview");
      }
    }).catch(() => undefined);
    quizService.getAdaptiveDifficulty(topicId).then((response) => setDifficulty(response?.difficulty ?? "medium")).catch(() => undefined);
  }, [topicId, setQuestions, setAttemptId, setTopicId]);

  async function handleStart() {
    const { reset } = useQuizStore.getState();
    reset(); // Clear any previous quiz state
    const questions = await quizService.getQuestions(topicId, difficulty, 10);
    setQuestions(questions);
    setAttemptId(`attempt-${topicId}-${Date.now()}`);
    setTopicId(topicId);
    window.location.assign(`/dashboard/quiz/${topicId}`);
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#7B7F85]">Assessment preview</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#2B2E33]">{topicName}</h1>
            <p className="mt-3 max-w-2xl text-[#7B7F85]">You will answer 10 mixed-difficulty questions, receive instant feedback, and build a verified micro-certificate on completion.</p>
            <div className="mt-6 rounded-[20px] border border-[#C1C4C8] bg-[#F5F6F7] p-5">
              <p className="text-sm font-semibold text-[#7B7F85]">Recommended difficulty</p>
              <p className="mt-1 text-lg font-semibold text-[#2B2E33] uppercase">{difficulty}</p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={handleStart} className="rounded-full bg-[#2B2E33] px-6 py-3 font-semibold text-[#F5F6F7] hover:bg-[#2B2E33]/90 transition-colors">Start quiz</button>
              <Link href="/dashboard/assessment" className="rounded-full border border-[#C1C4C8] px-6 py-3 font-semibold text-[#7B7F85] hover:text-[#2B2E33] hover:border-[#2B2E33] transition-colors">Back to library</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

