"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { analyticsService } from "@/services/analytics.service";
import { quizService } from "@/services/quiz.service";
import type { GapTopic } from "@/types/analytics.types";

interface TopicCardItem {
  id: number;
  title: string;
  board: string;
  subject: string;
  difficulty: string;
  questions: number;
  bestScore: number;
}

const sampleTopics: TopicCardItem[] = [
  { id: 1, title: "Algebra Foundations", board: "CBSE", subject: "Mathematics", difficulty: "Easy", questions: 10, bestScore: 82 },
  { id: 2, title: "Chemical Bonding", board: "CBSE", subject: "Chemistry", difficulty: "Medium", questions: 10, bestScore: 68 },
  { id: 3, title: "Mechanics", board: "JEE", subject: "Physics", difficulty: "Hard", questions: 10, bestScore: 58 },
  { id: 4, title: "Ecology", board: "NEET", subject: "Biology", difficulty: "Medium", questions: 10, bestScore: 76 },
];

export default function LibraryPage() {
  const [topics, setTopics] = useState<TopicCardItem[]>(sampleTopics);
  const [gaps, setGaps] = useState<GapTopic[]>([]);
  const [search, setSearch] = useState("");
  const [board, setBoard] = useState("All");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  useEffect(() => {
    analyticsService.getGaps().then(setGaps).catch(() => setGaps([]));
    quizService.getTopics().then((data) => {
      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          id: Number(item.id),
          title: item.name ?? item.title ?? "Topic",
          board: item.board ?? "CBSE",
          subject: item.subject ?? "General",
          difficulty: item.difficulty ?? "Medium",
          questions: item.question_count ?? 10,
          bestScore: item.best_score ?? 0,
        }));
        setTopics(mapped);
      }
    }).catch(() => setTopics(sampleTopics));
  }, []);

  const filteredTopics = useMemo(() => topics.filter((topic) => {
    const matchesSearch = !search || topic.title.toLowerCase().includes(search.toLowerCase());
    const matchesBoard = board === "All" || topic.board === board;
    const matchesSubject = subject === "All" || topic.subject === subject;
    const matchesDifficulty = difficulty === "All" || topic.difficulty === difficulty;
    return matchesSearch && matchesBoard && matchesSubject && matchesDifficulty;
  }), [board, difficulty, search, subject, topics]);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_16px_rgba(13,27,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#1A56DB]">Assessment library</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#0D1B2A]">Choose a topic and begin</h1>
              </div>
              <div className="w-full max-w-md">
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="search">Search topics</label>
                <input id="search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Search by topic" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <select value={board} onChange={(event) => setBoard(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="All">All boards</option>
                <option value="CBSE">CBSE</option>
                <option value="ICSE">ICSE</option>
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="UPSC">UPSC</option>
              </select>
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="All">All subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics">Physics</option>
                <option value="Biology">Biology</option>
              </select>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="All">All difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </section>

          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_16px_rgba(13,27,42,0.08)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#0D1B2A]">Recommended for you</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {gaps.length > 0 ? gaps.map((gap) => (
                <div key={gap.topic_id} className="min-w-[220px] rounded-[20px] border border-slate-200 bg-[#F8FAFF] p-4">
                  <p className="font-semibold text-slate-900">{gap.topic_name}</p>
                  <p className="mt-2 text-sm text-slate-600">{gap.recommendation}</p>
                </div>
              )) : <div className="text-sm text-slate-600">Nothing to recommend right now.</div>}
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTopics.length > 0 ? filteredTopics.map((topic) => (
              <article key={topic.id} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_16px_rgba(13,27,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-[#0D1B2A]">{topic.title}</h3>
                  <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1A56DB]">{topic.difficulty}</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{topic.board} • {topic.subject}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{topic.questions} questions</span>
                  <span className="font-semibold text-[#059669]">Best score {topic.bestScore}%</span>
                </div>
                <Link href={`/assess/${topic.id}`} className="mt-5 inline-flex rounded-full bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white">Start assessment</Link>
              </article>
            )) : <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">No topics match the current filters. Try another combination.</div>}
          </section>
        </main>
      </div>
    </div>
  );
}
