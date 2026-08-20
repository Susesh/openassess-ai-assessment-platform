"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IconArrowRight, IconSparkles, IconFilter } from "@/components/icons";
import { Badge, Card, Input, PageHeader, Select, SkeletonCard } from "@/components/ui";
import { getExamCriteria, getExamModules, getHeatmap, getTopics } from "@/lib/api";
import { questionPaperService } from "@/services/question-paper.service";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import { TopicCard3D } from "@/src/components/assessment/TopicCard3D";
import type { ExamCriteria, ExamModule, HeatmapItem, QuestionPaper, Topic } from "@/lib/types";
import { Search, Filter, Bookmark, TrendingUp, BookOpen, Zap, Target, ChevronDown, X, Save, Sparkles, BarChart3, Users, Clock } from "lucide-react";

const ACCENTS = [
  "from-cyan-500 to-emerald-500",
  "from-violet-500 to-purple-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-emerald-500 to-green-500",
  "from-blue-500 to-cyan-500",
];

const DIFFICULTY_LABELS = ["All", "Easy", "Medium", "Hard", "Adaptive"] as const;
const EXAM_TRACK_KEYWORDS = ["cbse", "icse", "neet", "jee", "upsc", "state board", "board exam", "university exam", "entrance exam"];

const BOARD_OPTIONS = ["All", "CBSE", "ICSE", "Karnataka State", "Maharashtra State", "Tamil Nadu State", "IIT-JEE", "NEET", "UPSC", "IB", "Cambridge IGCSE"];
const CLASS_OPTIONS = ["All", "Class 10", "Class 12", "Year 1", "Year 2", "Year 3"];
const SUBJECT_OPTIONS = ["All", "Mathematics", "Physics", "Chemistry", "Biology", "Science", "Social Science", "English", "Computer Science"];

export default function AssessmentLibraryPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [examModules, setExamModules] = useState<ExamModule[]>([]);
  const [criteria, setCriteria] = useState<ExamCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  
  // Advanced filtering
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [viewMode, setViewMode] = useState<"2d" | "3d">("2d");
  
  // Question paper filters
  const [paperSearch, setPaperSearch] = useState("");
  const [paperCategoryFilter, setPaperCategoryFilter] = useState("All");
  const [paperBoardFilter, setPaperBoardFilter] = useState("All");
  const [paperYearFilter, setPaperYearFilter] = useState("All");
  const [paperSubjectFilter, setPaperSubjectFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    getTopics()
      .then((topicList) => {
        if (cancelled) return;
        if (Array.isArray(topicList)) {
          setTopics(topicList);
        } else {
          console.warn("getTopics returned non-array data:", topicList);
          setTopics([]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load topics:", err);
        setError(err instanceof Error ? err.message : "Failed to load topics");
        setTopics([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    getHeatmap()
      .then((heat) => {
        if (cancelled) return;
        setHeatmap(heat);
      })
      .catch((err) => {
        if (cancelled) return;
        setHeatmap([]);
        setInsightsError(err instanceof Error ? err.message : "Progress insights are temporarily unavailable");
      });

    questionPaperService.getQuestionPapers()
      .then((items) => {
        if (cancelled) return;
        setPapers(items);
      })
      .catch((err) => {
        if (cancelled) return;
        setPapers([]);
        setInsightsError(err instanceof Error ? err.message : "Question papers are temporarily unavailable");
      });

    getExamCriteria()
      .then((items) => {
        if (cancelled) return;
        setCriteria(items);
      })
      .catch(() => {
        if (cancelled) return;
        setCriteria([]);
      });

    getExamModules()
      .then((items) => {
        if (cancelled) return;
        setExamModules(items);
      })
      .catch(() => {
        if (cancelled) return;
        setExamModules([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const criteriaDifficultyByTopic = useMemo(() => {
    const next = new Map<number, Set<string>>();
    for (const item of criteria) {
      const entry = next.get(item.topic_id) ?? new Set<string>();
      entry.add(item.difficulty.toLowerCase());
      next.set(item.topic_id, entry);
    }
    return next;
  }, [criteria]);

  function masteryFor(topicName: string): number | null {
    const item = heatmap.find(
      (h) => h.topic.toLowerCase() === topicName.toLowerCase()
    );
    return item ? item.avg_score : null;
  }

  function attemptsFor(topicName: string): number {
    const item = heatmap.find(
      (h) => h.topic.toLowerCase() === topicName.toLowerCase()
    );
    return item ? item.attempts : 0;
  }

  const subjects = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const t of topics) {
      if (t.subject) set.add(t.subject);
    }
    return Array.from(set);
  }, [topics]);

  const paperBoards = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.board))).sort()], [papers]);
  const paperCategories = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.exam_category))).sort()], [papers]);
  const paperYears = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => String(paper.year)))).sort((a, b) => Number(b) - Number(a))], [papers]);
  const paperSubjects = useMemo(() => ["All", ...Array.from(new Set(papers.map((paper) => paper.subject))).sort()], [papers]);

  const visibleTopics = useMemo(() => {
    const deduped = topics.filter(
      (t, i, arr) => i === arr.findIndex((x) => x.name === t.name)
    );
    return deduped.filter((t) => {
      const matchesSearch =
        !search ||
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesSubject =
        subjectFilter === "All" || t.subject === subjectFilter;
      const matchesDifficulty = difficultyFilter === "All"
        || criteriaDifficultyByTopic.get(t.id)?.has(difficultyFilter.toLowerCase())
        || false;
      const matchesBoard = boardFilter === "All" || 
        (t.subject?.toLowerCase().includes(boardFilter.toLowerCase()) || false);
      const matchesClass = classFilter === "All" || 
        (t.description?.toLowerCase().includes(classFilter.toLowerCase()) || false);
      return matchesSearch && matchesSubject && matchesDifficulty && matchesBoard && matchesClass;
    });
  }, [criteriaDifficultyByTopic, topics, search, subjectFilter, difficultyFilter, boardFilter, classFilter]);

  const visiblePapers = useMemo(() => {
    const filtered = papers.filter((paper) => {
      const matchesSearch =
        !paperSearch ||
        paper.exam_name.toLowerCase().includes(paperSearch.toLowerCase()) ||
        paper.subject.toLowerCase().includes(paperSearch.toLowerCase()) ||
        (paper.topic_name ?? "").toLowerCase().includes(paperSearch.toLowerCase());
      const matchesCategory = paperCategoryFilter === "All" || paper.exam_category === paperCategoryFilter;
      const matchesBoard = paperBoardFilter === "All" || paper.board === paperBoardFilter;
      const matchesYear = paperYearFilter === "All" || String(paper.year) === paperYearFilter;
      const matchesSubject = paperSubjectFilter === "All" || paper.subject === paperSubjectFilter;
      return matchesSearch && matchesCategory && matchesBoard && matchesYear && matchesSubject;
    });
    return filtered.sort((a, b) => {
      const aReady = a.total_questions > 40 ? 1 : 0;
      const bReady = b.total_questions > 40 ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      return b.year - a.year;
    });
  }, [paperBoardFilter, paperCategoryFilter, paperSearch, paperYearFilter, paperSubjectFilter, papers]);

  const examTrackTopics = useMemo(() => {
    return visibleTopics.filter((topic) => {
      const haystack = `${topic.name} ${topic.subject ?? ""} ${topic.description ?? ""}`.toLowerCase();
      return EXAM_TRACK_KEYWORDS.some((keyword) => haystack.includes(keyword));
    });
  }, [visibleTopics]);

  const courseTopics = useMemo(() => {
    const examTopicIds = new Set(examTrackTopics.map((topic) => topic.id));
    return visibleTopics.filter((topic) => !examTopicIds.has(topic.id));
  }, [examTrackTopics, visibleTopics]);

  // Save current filters as preset
  const saveFilterPreset = () => {
    const preset = {
      name: `Custom ${savedPresets.length + 1}`,
      filters: {
        search, subjectFilter, difficultyFilter, boardFilter, classFilter
      }
    };
    setSavedPresets([...savedPresets, preset]);
  };

  // Load preset
  const loadPreset = (preset: any) => {
    setSearch(preset.filters.search);
    setSubjectFilter(preset.filters.subjectFilter);
    setDifficultyFilter(preset.filters.difficultyFilter);
    setBoardFilter(preset.filters.boardFilter);
    setClassFilter(preset.filters.classFilter);
  };

  // Process natural language query
  const processNaturalLanguage = () => {
    const query = naturalLanguageQuery.toLowerCase();
    if (query.includes("math")) setSubjectFilter("Mathematics");
    if (query.includes("physics")) setSubjectFilter("Physics");
    if (query.includes("chemistry")) setSubjectFilter("Chemistry");
    if (query.includes("biology")) setSubjectFilter("Biology");
    if (query.includes("easy")) setDifficultyFilter("Easy");
    if (query.includes("hard")) setDifficultyFilter("Hard");
    if (query.includes("cbse")) setBoardFilter("CBSE");
    if (query.includes("icse")) setBoardFilter("ICSE");
    if (query.includes("jee")) setBoardFilter("IIT-JEE");
    if (query.includes("neet")) setBoardFilter("NEET");
  };

  const renderTopicGrid = (topicList: Topic[]) => (
    <div className="bento-grid">
      {topicList.map((topic, index) => {
        const mastery = masteryFor(topic.name);
        const attempts = attemptsFor(topic.name);
        const subtopicCount = topic.subtopics.length;
        const questionCount = topic.question_count ?? topic.total_questions ?? 0;
        const topicDifficulties = Array.from(criteriaDifficultyByTopic.get(topic.id) ?? []).sort();

        return (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
          >
            <div className="flex gap-4">
              {/* 3D Card or 2D Accent */}
              {viewMode === "3d" ? (
                <div className="flex-shrink-0">
                  <TopicCard3D mastery={mastery || 0} color={ACCENTS[index % ACCENTS.length].split(' ')[1]} />
                </div>
              ) : (
                <div className={`flex-shrink-0 w-1.5 h-full bg-gradient-to-b ${ACCENTS[index % ACCENTS.length]} rounded-full`} />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight truncate">{topic.name}</h2>
                  <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                    {topic.subject && <Badge variant="brand">{topic.subject}</Badge>}
                    {mastery !== null && mastery >= 80 && <Badge variant="success">Mastered</Badge>}
                    {topicDifficulties.slice(0, 2).map((level) => (
                      <Badge key={level} variant="default">{level}</Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-[#7B7F85] mb-4 line-clamp-2">
                  {topic.description ?? "Click to start this assessment topic."}
                </p>

                {subtopicCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {topic.subtopics.slice(0, 3).map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded-full bg-[#2B2E33]/10 border border-[#C1C4C8] text-[#2B2E33] text-xs px-3 py-1 font-medium"
                      >
                        {sub.name}
                      </span>
                    ))}
                    {subtopicCount > 3 && (
                      <span className="rounded-full bg-[#2B2E33]/10 border border-[#C1C4C8] text-[#2B2E33] text-xs px-3 py-1 font-medium">
                        +{subtopicCount - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-medium text-[#7B7F85] mb-4">
                  <span>{questionCount} questions</span>
                  <span>{subtopicCount} subtopic{subtopicCount !== 1 ? "s" : ""}</span>
                  {topic.duration && <span>{topic.duration} min</span>}
                  {topic.passing_score && <span>Pass at {topic.passing_score}%</span>}
                  {attempts > 0 && (
                    <span className="text-[#2B2E33]">
                      {attempts} attempt{attempts !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {mastery !== null && (
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-[#7B7F85]">Mastery</span>
                      <span
                        className={
                          mastery >= 80
                            ? "font-semibold text-emerald-600"
                            : mastery >= 60
                              ? "font-semibold text-cyan-600"
                              : "font-semibold text-amber-600"
                        }
                      >
                        {mastery}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#C1C4C8]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          mastery >= 80
                            ? "bg-emerald-500"
                            : mastery >= 60
                              ? "bg-cyan-500"
                              : "bg-amber-400"
                        }`}
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href={`/dashboard/assessment/take?topic_id=${topic.id}&topic_name=${encodeURIComponent(topic.name)}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                >
                  {mastery !== null ? "Retry Assessment" : "Start Assessment"}
                  <IconArrowRight />
                </Link>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-2xl border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-6 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-white/80" />
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Assessment Library</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Browse & Assess
            </h1>
            <p className="text-lg text-white/90">
              Filter by board/class/subject, start assessments, and track your progress with unlimited retries.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Sparkles className="w-4 h-4" />
              {viewMode === "2d" ? "3D View" : "2D View"}
            </button>
            <Link
              href="/dashboard/assessment/criteria"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Bookmark className="w-4 h-4" />
              Question Papers
            </Link>
            <Link
              href="/dashboard/assessment/generate"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#2B2E33] px-6 py-3 text-sm font-bold shadow-lg transition hover:scale-105"
            >
              <IconSparkles className="h-4 w-4" />
              AI Generate
            </Link>
          </div>
        </div>
      </section>

      {/* Advanced Filters */}
      <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
        {/* Natural Language Search */}
        <div className="mb-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
              <Input
                type="search"
                placeholder="Try: 'Show me CBSE math easy topics' or 'NEET physics hard'"
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="pl-10"
                aria-label="Natural language search"
              />
            </div>
            <button
              onClick={processNaturalLanguage}
              className="px-6 py-3 rounded-xl bg-[#2B2E33] text-white font-semibold hover:bg-[#7B7F85] transition flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              AI Filter
            </button>
          </div>
        </div>

        {/* Standard Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
              <Input
                type="search"
                placeholder="Search topics by name, subject, or description…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search topics"
              />
            </div>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] font-semibold hover:bg-[#C1C4C8]/20 transition"
            >
              <Filter className="w-4 h-4" />
              Advanced Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={saveFilterPreset}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] font-semibold hover:bg-[#C1C4C8]/20 transition"
            >
              <Save className="w-4 h-4" />
              Save Preset
            </button>
          </div>

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => loadPreset(preset)}
                  className="px-4 py-2 rounded-full border border-[#C1C4C8] bg-[#F5F6F7] text-sm text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition flex items-center gap-2"
                >
                  <Bookmark className="w-3 h-3" />
                  {preset.name}
                </button>
              ))}
            </div>
          )}

          {/* Advanced Filter Options */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-[#C1C4C8]"
            >
              <Select
                value={boardFilter}
                onChange={(e) => setBoardFilter(e.target.value)}
                aria-label="Filter by board"
              >
                {BOARD_OPTIONS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </Select>
              <Select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                aria-label="Filter by class"
              >
                {CLASS_OPTIONS.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </Select>
              <Select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                aria-label="Filter by subject"
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <Select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                aria-label="Filter by difficulty"
              >
                {DIFFICULTY_LABELS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </motion.div>
          )}
        </div>

        {/* Active Filters Display */}
        {(search || subjectFilter !== 'All' || difficultyFilter !== 'All' || boardFilter !== 'All' || classFilter !== 'All') && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#C1C4C8]">
            <span className="text-sm font-semibold text-[#7B7F85]">Active filters:</span>
            {search && (
              <span className="px-3 py-1 rounded-full bg-[#2B2E33] text-white text-sm flex items-center gap-2">
                Search: {search}
                <button onClick={() => setSearch('')} className="hover:text-[#7B7F85]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {subjectFilter !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-[#2B2E33] text-white text-sm flex items-center gap-2">
                Subject: {subjectFilter}
                <button onClick={() => setSubjectFilter('All')} className="hover:text-[#7B7F85]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {difficultyFilter !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-[#2B2E33] text-white text-sm flex items-center gap-2">
                Difficulty: {difficultyFilter}
                <button onClick={() => setDifficultyFilter('All')} className="hover:text-[#7B7F85]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {boardFilter !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-[#2B2E33] text-white text-sm flex items-center gap-2">
                Board: {boardFilter}
                <button onClick={() => setBoardFilter('All')} className="hover:text-[#7B7F85]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {classFilter !== 'All' && (
              <span className="px-3 py-1 rounded-full bg-[#2B2E33] text-white text-sm flex items-center gap-2">
                Class: {classFilter}
                <button onClick={() => setClassFilter('All')} className="hover:text-[#7B7F85]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* AI Recommendations */}
      {insights.length > 0 && (
        <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Recommendations</h2>
              <p className="text-sm text-[#7B7F85]">Personalized topic suggestions based on your performance</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.slice(0, 3).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${
                  insight.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                  insight.type === ' warning' ? 'bg-amber-50 border-amber-200' :
                  insight.type === 'recommendation' ? 'bg-blue-50 border-blue-200' :
                  'bg-[#F5F6F7] border-[#C1C4C8]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    insight.type === 'success' ? 'bg-emerald-100' :
                    insight.type === ' warning' ? 'bg-amber-100' :
                    insight.type === 'recommendation' ? 'bg-blue-100' :
                    'bg-[#C1C4C8]'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2B2E33] mb-1">{insight.title}</p>
                    <p className="text-xs text-[#7B7F85]">{insight.description}</p>
                    {insight.confidence && (
                      <p className="text-xs text-[#7B7F85] mt-2">Confidence: {Math.round(insight.confidence * 100)}%</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Collaborative Learning */}
      <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">What Peers Are Studying</h2>
              <p className="text-sm text-[#7B7F85]">Popular topics among learners</p>
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleTopics.slice(0, 4).map((topic, index) => {
            const mastery = masteryFor(topic.name);
            const peerCount = Math.floor(Math.random() * 50) + 10; // Simulated peer count
            
            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift cursor-pointer"
                onClick={() => setSearch(topic.name)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#7B7F85]" />
                  <span className="text-xs font-semibold text-[#7B7F85]">{peerCount} studying</span>
                </div>
                <p className="text-sm font-bold text-[#2B2E33] mb-1 truncate">{topic.name}</p>
                {topic.subject && (
                  <Badge variant="brand">{topic.subject}</Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Difficulty Heatmap */}
      <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Difficulty Distribution</h2>
              <p className="text-sm text-[#7B7F85]">Visual overview of topic difficulty levels</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {DIFFICULTY_LABELS.slice(1).map((difficulty) => {
            const count = criteria.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase()).length;
            const percentage = criteria.length > 0 ? (count / criteria.length) * 100 : 0;
            const colors = {
              'Easy': 'from-emerald-400 to-emerald-600',
              'Medium': 'from-cyan-400 to-cyan-600',
              'Hard': 'from-amber-400 to-amber-600',
              'Adaptive': 'from-violet-400 to-violet-600',
            };
            
            return (
              <motion.div
                key={difficulty}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: DIFFICULTY_LABELS.slice(1).indexOf(difficulty) * 0.1 }}
                className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift"
              >
                <div className="text-center">
                  <div className={`h-2 w-full rounded-full bg-gradient-to-r ${colors[difficulty as keyof typeof colors]} mb-3`} />
                  <p className="text-sm font-semibold text-[#2B2E33] mb-1">{difficulty}</p>
                  <p className="text-2xl font-bold text-[#2B2E33]">{count}</p>
                  <p className="text-xs text-[#7B7F85]">{percentage.toFixed(0)}%</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Philosophy Banner */}
      <div className="rounded-2xl border border-[#C1C4C8] bg-gradient-to-r from-[#2B2E33]/10 to-[#7B7F85]/10 px-6 py-4 flex items-center justify-between">
        <p className="text-sm text-[#2B2E33]">
          <span className="font-semibold text-[#2B2E33]">Philosophy:</span> Learn → Assess → Improve → Retry → Mastery
        </p>
        <Badge variant="brand">Unlimited retries</Badge>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {insightsError && !error && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {insightsError}
        </div>
      )}

      {loading ? (
        <div className="bento-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bento-item col-span-4 md:col-span-3 lg:col-span-4 shimmer h-80 rounded-2xl" />
          ))}
        </div>
      ) : visibleTopics.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7]">
          <Search className="w-16 h-16 text-[#7B7F85] mb-4" />
          <h3 className="text-xl font-bold text-[#2B2E33] tracking-tight">No topics found</h3>
          <p className="mt-2 text-sm text-[#7B7F85]">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {examTrackTopics.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-[#2B2E33]" />
                <div>
                  <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Board & Competitive Exam Assessments</h2>
                  <p className="text-sm text-[#7B7F85]">CBSE, ICSE, State Boards, IIT-JEE, NEET, UPSC, and other exam-focused practice topics.</p>
                </div>
              </div>
              {renderTopicGrid(examTrackTopics)}
            </section>
          ) : null}

          {courseTopics.length > 0 ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-[#2B2E33]" />
                <div>
                  <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Course Assessments</h2>
                  <p className="text-sm text-[#7B7F85]">Programming and regular curriculum topics.</p>
                </div>
              </div>
              {renderTopicGrid(courseTopics)}
            </section>
          ) : null}
        </div>
      )}

      <p className="text-center text-sm text-[#7B7F85]">
        {visibleTopics.length} topic{visibleTopics.length !== 1 ? "s" : ""} shown
      </p>

      {/* Exam Modules Section */}
      <section className="space-y-4">
        {examModules.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Exam Modules</h2>
                <p className="text-sm text-[#7B7F85]">Open dedicated modules for CBSE, ICSE, State Board, IIT-JEE, NEET, UPSC, and University Exams.</p>
              </div>
            </div>

            <div className="bento-grid">
              {examModules.map((module) => (
                <motion.div
                  key={module.slug}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#2B2E33] mb-2">{module.display_name}</p>
                  <p className="text-sm text-[#7B7F85] mb-4">{module.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    <Badge variant="brand">{module.published_papers} published</Badge>
                    <Badge variant="brand">{module.rules.default_duration_minutes} min</Badge>
                    <Badge variant="brand">{module.rules.minimum_question_count}+ questions</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/assessment/exams/${module.slug}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                    >
                      Open Module
                    </Link>
                    <Link
                      href={`/dashboard/assessment/criteria?category=${module.slug}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2.5 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
                    >
                      Question Papers
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* Previous Year Question Papers Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Previous Year Question Papers</h2>
              <p className="text-sm text-[#7B7F85]">Browse published papers, preview questions, or jump into a full-paper attempt.</p>
            </div>
          </div>
          <Link
            href="/dashboard/assessment/criteria"
            className="inline-flex items-center justify-center rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
          >
            Open Repository
          </Link>
        </div>

        <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
          <div className="grid gap-3 lg:grid-cols-5 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
              <Input type="search" value={paperSearch} onChange={(e) => setPaperSearch(e.target.value)} placeholder="Search papers" className="pl-10" />
            </div>
            <Select value={paperCategoryFilter} onChange={(e) => setPaperCategoryFilter(e.target.value)}>
              {paperCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Select value={paperBoardFilter} onChange={(e) => setPaperBoardFilter(e.target.value)}>
              {paperBoards.map((boardName) => (
                <option key={boardName} value={boardName}>
                  {boardName}
                </option>
              ))}
            </Select>
            <Select value={paperSubjectFilter} onChange={(e) => setPaperSubjectFilter(e.target.value)}>
              {paperSubjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
            <Select value={paperYearFilter} onChange={(e) => setPaperYearFilter(e.target.value)}>
              {paperYears.map((paperYear) => (
                <option key={paperYear} value={paperYear}>
                  {paperYear}
                </option>
              ))}
            </Select>
          </div>

          {visiblePapers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C1C4C8] bg-[#F5F6F7] px-6 py-10 text-center text-sm text-[#7B7F85]">
              No question papers match the current filters.
            </div>
          ) : (
            <div className="bento-grid">
              {visiblePapers.slice(0, 6).map((paper) => (
                <motion.div
                  key={paper.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${ACCENTS[paper.id % ACCENTS.length]} rounded-t-lg mb-4`} />
                  {paper.total_questions < 60 ? (
                    <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                      This paper has fewer than 60 questions. Preview metadata only.
                    </p>
                  ) : null}

                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#2B2E33]">{paper.exam_category}</p>
                      <h3 className="mt-1 text-lg font-bold text-[#2B2E33] tracking-tight">{paper.exam_name}</h3>
                      <p className="mt-1 text-sm text-[#7B7F85]">{paper.board} · {paper.subject} · {paper.year}</p>
                    </div>
                    <Badge variant={paper.is_published ? "success" : "warning"}>{paper.is_published ? "Published" : "Draft"}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    {paper.class_name ? <Badge variant="brand">{paper.class_name}</Badge> : null}
                    {paper.topic_name ? <Badge variant="brand">{paper.topic_name}</Badge> : null}
                    {paper.difficulty ? <Badge variant="brand">{paper.difficulty}</Badge> : null}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/assessment/criteria?paper_id=${paper.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105"
                    >
                      Preview
                    </Link>
                    {paper.total_questions >= 60 ? (
                      <Link
                        href={`/dashboard/assessment/take?paper_id=${paper.id}&topic_name=${encodeURIComponent(paper.exam_name)}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2.5 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
                      >
                        Attempt
                      </Link>
                    ) : (
                      <span className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2.5 text-sm font-semibold text-[#7B7F85]">
                        Attempt Unavailable
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
