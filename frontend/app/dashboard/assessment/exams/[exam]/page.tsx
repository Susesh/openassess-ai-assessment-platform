"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Card, Input, PageHeader, Select, SkeletonCard } from "@/components/ui";
import { getExamModule, getHeatmap, getResults } from "@/lib/api";
import type { ExamModuleDetail, HeatmapItem, ResultSummary } from "@/lib/types";

export default function ExamModulePage() {
  const params = useParams<{ exam: string }>();
  const examSlug = typeof params?.exam === "string" ? params.exam : "";

  const [moduleData, setModuleData] = useState<ExamModuleDetail | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [selectedPaperId, setSelectedPaperId] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  useEffect(() => {
    if (!examSlug) return;

    let cancelled = false;

    Promise.all([getExamModule(examSlug), getHeatmap(), getResults()])
      .then(([moduleResponse, heat, attempts]) => {
        if (cancelled) return;
        const minCount = moduleResponse?.rules?.minimum_question_count ?? 60;
        const sortedPapers = [...moduleResponse.papers].sort((a, b) => {
          const aReady = a.total_questions >= minCount ? 1 : 0;
          const bReady = b.total_questions >= minCount ? 1 : 0;
          if (aReady !== bReady) return bReady - aReady;
          return b.year - a.year;
        });
        setModuleData(moduleResponse);
        setHeatmap(heat);
        setResults(attempts);
        const firstReady = sortedPapers.find((paper) => paper.total_questions >= minCount);
        setSelectedPaperId(firstReady?.id ?? sortedPapers[0]?.id ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load exam module");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examSlug]);

  const selectedPaper = useMemo(
    () => moduleData?.papers.find((paper) => paper.id === selectedPaperId) ?? null,
    [moduleData?.papers, selectedPaperId]
  );

  const subjects = useMemo(() => ["All", ...(moduleData?.subjects ?? [])], [moduleData?.subjects]);
  const years = useMemo(
    () => ["All", ...((moduleData?.years ?? []).map(String))],
    [moduleData?.years]
  );
  const topics = useMemo(() => ["All", ...(moduleData?.topics ?? [])], [moduleData?.topics]);

  const filteredPapers = useMemo(() => {
    if (!moduleData) return [];
    const filtered = moduleData.papers.filter((paper) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q
        || paper.exam_name.toLowerCase().includes(q)
        || paper.subject.toLowerCase().includes(q)
        || (paper.topic_name ?? "").toLowerCase().includes(q)
        || String(paper.year).includes(q);
      const matchesSubject = subjectFilter === "All" || paper.subject === subjectFilter;
      const matchesTopic = topicFilter === "All" || (paper.topic_name ?? "") === topicFilter;
      const matchesYear = yearFilter === "All" || String(paper.year) === yearFilter;
      return matchesSearch && matchesSubject && matchesTopic && matchesYear;
    });
    return filtered.sort((a, b) => {
      const aReady = a.total_questions > 40 ? 1 : 0;
      const bReady = b.total_questions > 40 ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      return b.year - a.year;
    });
  }, [moduleData, search, subjectFilter, topicFilter, yearFilter]);

  const relatedAttempts = useMemo(() => {
    if (!moduleData) return [];
    const subjectWords = new Set(moduleData.subjects.map((subject) => subject.toLowerCase()));
    return results.filter((attempt) => {
      const topic = attempt.topic_name.toLowerCase();
      if (topic.includes(moduleData.display_name.toLowerCase())) return true;
      return Array.from(subjectWords).some((word) => topic.includes(word));
    });
  }, [moduleData, results]);

  const moduleAttemptCount = relatedAttempts.length;
  const moduleAverage = moduleAttemptCount
    ? Math.round((relatedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / moduleAttemptCount) * 10) / 10
    : 0;
  const recentHeat = heatmap.slice(0, 5);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <SkeletonCard lines={4} />
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SkeletonCard lines={10} />
          <SkeletonCard lines={12} />
        </div>
      </div>
    );
  }

  if (error || !moduleData) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="text-sm font-semibold">Unable to open exam module.</p>
        <p className="mt-1 text-sm">{error ?? "Module not found"}</p>
        <Link
          href="/dashboard/assessment"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Back to Assessment Library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up space-y-6">
      <PageHeader
        title={`${moduleData.display_name} Previous Year Papers`}
        description={moduleData.description}
        action={
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Assessment Library
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setShowLibrary((prev) => !prev)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {showLibrary ? "Hide" : "Show"} Question Library
        </button>
        <button
          type="button"
          onClick={() => setShowInsights((prev) => !prev)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
        >
          {showInsights ? "Hide" : "Show"} Assessment Details
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        {showLibrary ? (
          <section className="space-y-4">
            <Card className="p-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  type="search"
                  placeholder="Search by year, subject, or topic"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                  {subjects.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
                <Select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)}>
                  {topics.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
                <Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  {years.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            </Card>

            <div className="grid gap-4">
              {filteredPapers.map((paper) => (
                <Card
                  key={paper.id}
                  className={`cursor-pointer overflow-hidden transition ${selectedPaperId === paper.id ? "ring-2 ring-indigo-500" : "hover:shadow-lg"}`}
                  onClick={() => setSelectedPaperId(paper.id)}
                >
                  <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{paper.year} · {paper.subject}</p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900">{paper.exam_name}</h3>
                        <p className="mt-1 text-sm text-slate-600">{paper.board} · {paper.total_questions} Questions · {Math.max(60, paper.total_questions)} Minutes</p>
                      </div>
                      <Badge variant={paper.total_questions >= (moduleData?.rules?.minimum_question_count ?? 60) ? "success" : "warning"}>
                        {paper.total_questions >= (moduleData?.rules?.minimum_question_count ?? 60) ? "Assessment Ready" : "Preview Only"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">Board: {paper.board}</div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">Marks: {paper.total_marks}</div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">Difficulty: {paper.difficulty ?? "mixed"}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedPaperId(paper.id);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Preview
                      </button>
                      {paper.total_questions >= (moduleData?.rules?.minimum_question_count ?? 60) ? (
                        <Link
                          href={`/dashboard/assessment/take?paper_id=${paper.id}&topic_name=${encodeURIComponent(paper.exam_name)}`}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Start Assessment
                        </Link>
                      ) : (
                        <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                          Start Disabled
                        </span>
                      )}
                      {paper.pdf_url ? (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Download
                        </a>
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredPapers.length === 0 ? (
                <Card className="p-6 text-center text-sm text-slate-500">
                  No papers match the current filters.
                </Card>
              ) : null}
            </div>
          </section>
        ) : null}

        {showInsights ? (
          <section className="space-y-4">
            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Exam Information</h3>
              <p className="mt-2 text-sm text-slate-600">{moduleData.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="brand">{moduleData.published_papers} published papers</Badge>
                <Badge variant="brand">{moduleData.rules.default_duration_minutes} min default</Badge>
                <Badge variant="brand">{moduleData.rules.minimum_question_count}+ questions required</Badge>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Instructions</h3>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-600">
                {moduleData.instructions.map((instruction) => (
                  <li key={instruction}>{instruction}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">AI Generated Practice</h3>
              <p className="mt-2 text-sm text-slate-600">Generate additional practice sets for weak topics before starting the full paper.</p>
              <Link
                href={`/dashboard/assessment/generate?exam=${encodeURIComponent(moduleData.display_name)}&subject=${encodeURIComponent(subjectFilter === "All" ? "" : subjectFilter)}`}
                className="mt-3 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Generate Practice Questions
              </Link>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Previous Attempts</h3>
              <p className="mt-2 text-sm text-slate-600">Attempts in this exam track: {moduleAttemptCount}</p>
              <p className="mt-1 text-sm text-slate-600">Average score: {moduleAverage}%</p>
            </Card>

            <Card className="p-5">
              <h3 className="text-lg font-semibold text-slate-900">Progress & Statistics</h3>
              <div className="mt-3 space-y-2">
                {recentHeat.map((item) => (
                  <div key={item.topic} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-800">{item.topic}</p>
                    <p className="text-xs text-slate-500">Attempts: {item.attempts} · Avg score: {item.avg_score}%</p>
                  </div>
                ))}
                {recentHeat.length === 0 ? <p className="text-sm text-slate-500">No progress stats available yet.</p> : null}
              </div>
            </Card>

            {selectedPaper ? (
              <Card className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">Selected Paper Preview</h3>
                <p className="mt-2 text-sm text-slate-600">{selectedPaper.exam_name}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedPaper.board} · {selectedPaper.subject} · {selectedPaper.year}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Badge variant="brand">Questions: {selectedPaper.total_questions}</Badge>
                  <Badge variant="brand">Marks: {selectedPaper.total_marks}</Badge>
                </div>
              </Card>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
