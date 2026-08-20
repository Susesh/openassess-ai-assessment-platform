"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Input, PageHeader, Select, SkeletonCard } from "@/components/ui";
import { questionPaperService } from "@/services/question-paper.service";
import type { QuestionPaper } from "@/lib/types";

const CATEGORY_OPTIONS = ["All", "CBSE", "ICSE", "State Board", "IIT-JEE", "NEET", "UPSC", "University Exams", "Custom Assessments"];

export default function QuestionPaperLibraryPage() {
  const searchParams = useSearchParams();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [board, setBoard] = useState("All");
  const [subject, setSubject] = useState("All");
  const [year, setYear] = useState("All");
  const [paperId, setPaperId] = useState<number | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<QuestionPaper | null>(null);

  useEffect(() => {
    let cancelled = false;
    questionPaperService.getQuestionPapers()
      .then((items) => {
        if (cancelled) return;
        setPapers(items);
        const requestedPaperId = Number(searchParams.get("paper_id"));
        if (!Number.isNaN(requestedPaperId) && requestedPaperId > 0) {
          setPaperId(requestedPaperId);
        } else {
          setPaperId((current) => current ?? items[0]?.id ?? null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load question papers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!paperId) {
      return;
    }

    let cancelled = false;
    questionPaperService.getQuestionPaper(paperId)
      .then((paper) => {
        if (!cancelled) setSelectedPaper(paper);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load question paper details");
      });

    return () => {
      cancelled = true;
    };
  }, [paperId]);

  const boards = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.board))).sort()], [papers]);
  const subjects = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.subject))).sort()], [papers]);
  const years = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => String(paper.year)))).sort((a, b) => Number(b) - Number(a))], [papers]);
  const activeSelectedPaper = paperId ? selectedPaper : null;
  const selectedLoading = Boolean(paperId) && activeSelectedPaper?.id !== paperId;

  const visible = useMemo(() => {
    return papers.filter((paper) => {
      const matchesSearch =
        !search ||
        paper.exam_name.toLowerCase().includes(search.toLowerCase()) ||
        paper.subject.toLowerCase().includes(search.toLowerCase()) ||
        (paper.topic_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (paper.subtopic_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || paper.exam_category === category;
      const matchesBoard = board === "All" || paper.board === board;
      const matchesSubject = subject === "All" || paper.subject === subject;
      const matchesYear = year === "All" || String(paper.year) === year;
      return matchesSearch && matchesCategory && matchesBoard && matchesSubject && matchesYear;
    });
  }, [board, category, papers, search, subject, year]);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in-up space-y-6">
      <PageHeader
        title="Question Paper Repository"
        description="Browse the last ten years of papers by category, board, subject, and year. Preview questions or start a full paper attempt."
        action={
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Back to Assessments
          </Link>
        }
      />

      <div className="grid gap-3 lg:grid-cols-5">
        <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search papers" />
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={board} onChange={(e) => setBoard(e.target.value)}>
          {boards.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {subjects.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} lines={5} />
            ))}
          </div>
          <SkeletonCard lines={8} />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="📄"
          title="No question papers found"
          description="Try a broader search or another board/year combination."
          action={
            <Link
              href="/dashboard/assessment"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Open Assessments
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((paper) => (
              <Card
                key={paper.id}
                className={`cursor-pointer overflow-hidden transition hover:shadow-lg ${paperId === paper.id ? "ring-2 ring-indigo-500" : ""}`}
                onClick={() => setPaperId(paper.id)}
              >
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{paper.exam_category}</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">{paper.exam_name}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {paper.board} · {paper.subject} · {paper.year}
                      </p>
                    </div>
                    <Badge variant={paper.is_published ? "success" : "warning"}>
                      {paper.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase text-slate-500">Questions</p>
                      <p className="mt-1 font-semibold text-slate-800">{paper.total_questions}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase text-slate-500">Marks</p>
                      <p className="mt-1 font-semibold text-slate-800">{paper.total_marks}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {paper.class_name ? <Badge variant="brand">{paper.class_name}</Badge> : null}
                    {paper.topic_name ? <Badge variant="brand">{paper.topic_name}</Badge> : null}
                    {paper.difficulty ? <Badge variant="brand">{paper.difficulty}</Badge> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {paper.total_questions > 0 ? (
                      <Link
                        href={`/dashboard/assessment/take?paper_id=${paper.id}&topic_name=${encodeURIComponent(paper.exam_name)}`}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        onClick={(event) => event.stopPropagation()}
                      >
                        Attempt Full Paper
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                        Attempt Unavailable
                      </span>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={(event) => {
                        event.stopPropagation();
                        setPaperId(paper.id);
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Paper Preview</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {activeSelectedPaper?.exam_name ?? "Select a paper"}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {activeSelectedPaper ? `${activeSelectedPaper.board} · ${activeSelectedPaper.subject} · ${activeSelectedPaper.year}` : "Browse a paper to preview the questions."}
                </p>
              </div>
              {activeSelectedPaper ? <Badge variant={activeSelectedPaper.is_published ? "success" : "warning"}>{activeSelectedPaper.is_published ? "Published" : "Draft"}</Badge> : null}
            </div>

            {selectedLoading ? (
              <div className="mt-4 space-y-3">
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} lines={2} />
                ))}
              </div>
            ) : activeSelectedPaper ? (
              <div className="mt-5 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="brand">{activeSelectedPaper.exam_category}</Badge>
                  <Badge variant="brand">{activeSelectedPaper.year}</Badge>
                  <Badge variant="brand">{activeSelectedPaper.total_questions} questions</Badge>
                  <Badge variant="brand">{activeSelectedPaper.total_marks} marks</Badge>
                </div>

                {activeSelectedPaper.total_questions <= 0 ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    This paper is published without imported questions, so full-paper attempts are disabled until questions are added.
                  </div>
                ) : null}

                <div className="space-y-3">
                  {(activeSelectedPaper.questions ?? []).slice(0, 6).map((question) => (
                    <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">
                          Q{question.question_number}. {question.question_text_snapshot ?? `Question ${question.question_number}`}
                        </p>
                        <Badge variant="brand">{question.difficulty}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span>{question.question_type}</span>
                        <span>{question.marks} mark{question.marks !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeSelectedPaper.total_questions > 0 ? (
                    <Link
                      href={`/dashboard/assessment/take?paper_id=${activeSelectedPaper.id}&topic_name=${encodeURIComponent(activeSelectedPaper.exam_name)}`}
                      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                      Attempt Full Paper
                    </Link>
                  ) : null}
                  {activeSelectedPaper.answer_key_url ? (
                    <a
                      href={activeSelectedPaper.answer_key_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Answer Key
                    </a>
                  ) : null}
                  {activeSelectedPaper.pdf_url ? (
                    <a
                      href={activeSelectedPaper.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Download PDF
                    </a>
                  ) : null}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Full topic-wise attempts can still start from the topic library. This paper view is for browsing and full-paper practice.
                </div>
              </div>
            ) : (
              <div className="mt-6 text-sm text-slate-500">
                Choose a paper to inspect its questions and start a full-paper attempt.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
