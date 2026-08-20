"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Button, Card, PageHeader, Select, SkeletonCard, useToast } from "@/components/ui";
import { aiService, GeneratedQuestion as AIGeneratedQuestion } from "@/services/ai.service";
import { quizService } from "@/services/quiz.service";
import type { GeneratedQuestion, Topic } from "@/lib/types";

const DIFFICULTIES = ["easy", "medium", "hard"];
const COUNTS = [5, 10, 15, 20];

export default function AIGeneratePage() {
  const { toast } = useToast();
  const questionsContainerRef = useRef<HTMLDivElement>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [subtopicId, setSubtopicId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(10);
  const [language, setLanguage] = useState("en");
  const [questions, setQuestions] = useState<AIGeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Set<number>>(new Set());
  const EXAM_MODULES = [
    { value: "", label: "None" },
    { value: "CBSE", label: "CBSE" },
    { value: "ICSE", label: "ICSE" },
    { value: "State Board", label: "State Board" },
    { value: "IIT-JEE", label: "IIT-JEE" },
    { value: "NEET", label: "NEET" },
    { value: "UPSC", label: "UPSC" },
    { value: "University Exams", label: "University Exams" },
  ];
  const LANGUAGES = [
    { value: "en", label: "English" },
    { value: "hi", label: "Hindi" },
    { value: "kn", label: "Kannada" },
  ];
  const [examModule, setExamModule] = useState<string>("");

  useEffect(() => {
    quizService.getTopics()
      .then((t) => {
        const deduped = t.filter((x: Topic, i: number, a: Topic[]) => i === a.findIndex((y) => y.name === x.name));
        setTopics(deduped);
        if (deduped.length > 0) setTopicId(deduped[0].id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setTopicsLoading(false));
  }, []);

  useEffect(() => {
    if (questions.length > 0 && questionsContainerRef.current) {
      questionsContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [questions.length]);

  async function handleGenerate(saveToDb = false) {
    if (!topicId) return;
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    setError(null);
    setQuestions([]);
    setSelectedOptions({});
    setRevealedQuestions(new Set());
    if (saveToDb) {
      setSaving(true);
    } else {
      setLoading(true);
    }
    try {
      const selectedSubtopic = selectedTopic?.subtopics?.find(s => s.id === subtopicId);
      console.log("PAYLOAD SENDING TO BACKEND:", {
        topic: topic.name,
        subject: topic.subject || topic.name,
        subtopic: selectedSubtopic?.name || "",
        subtopic_id: subtopicId || null,
        difficulty,
        count,
        language,
        exam_module: examModule || null,
      });
      const generated = await aiService.generateAIQuestions({
        topic_id: topicId,
        subtopic_id: subtopicId || null,
        subtopic_name: selectedSubtopic?.name || "",
        topic_name: topic.name,
        subject: topic.subject || topic.name,  // Pass subject for strict relevance enforcement
        difficulty,
        count,
        language,
        save_to_db: saveToDb,
        exam_module: examModule || null,
      });
      setQuestions(generated);
      if (saveToDb) {
        toast(`Saved ${generated.length} AI-generated questions to ${topic.name}.`, "success");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate questions");
    } finally {
      if (saveToDb) {
        setSaving(false);
      } else {
        setLoading(false);
      }
    }
  }

  const selectedTopic = topics.find((t) => t.id === topicId);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in-up space-y-8">
      <PageHeader
        title="AI Question Generator"
        description="Use AI to generate practice questions for any topic, with custom difficulty and count."
      />

      {/* Config Panel */}
      <Card className="p-6 border border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <h2 className="mb-5 text-base font-semibold text-slate-100">
          Configure Generation
        </h2>

        {topicsLoading ? (
          <SkeletonCard lines={2} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label htmlFor="topic-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Topic
              </label>
              <Select
                id="topic-select"
                value={topicId ?? ""}
                onChange={(e) => {
                  setTopicId(Number(e.target.value));
                  setSubtopicId(null);
                }}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="subtopic-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Subtopic
              </label>
              <Select
                id="subtopic-select"
                value={subtopicId ?? ""}
                onChange={(e) => setSubtopicId(Number(e.target.value) || null)}
                disabled={!selectedTopic?.subtopics?.length}
              >
                <option value="">All Subtopics</option>
                {selectedTopic?.subtopics?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="difficulty-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Difficulty
              </label>
              <Select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="language-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Language
              </label>
              <Select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="count-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Question Count
              </label>
              <Select
                id="count-select"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {COUNTS.map((c) => (
                  <option key={c} value={c}>
                    {c} questions
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="exam-module-select" className="mb-1.5 block text-sm font-medium text-slate-300">
                Exam Module
              </label>
              <Select
                id="exam-module-select"
                value={examModule}
                onChange={(e) => setExamModule(e.target.value)}
              >
                {EXAM_MODULES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {selectedTopic && (
          <div className="mt-4 rounded-xl bg-slate-800/80 border border-cyan-500/30 px-4 py-3">
            <span className="font-semibold text-cyan-400 text-base">{selectedTopic.name}</span>
            {selectedTopic.subject && ` · ${selectedTopic.subject}`}
            {selectedTopic.description && (
              <p className="mt-1 text-slate-200 text-sm font-medium">{selectedTopic.description}</p>
            )}
          </div>
        )}

              
        <div className="mt-5 flex gap-3">
          <Button
            onClick={() => void handleGenerate(false)}
            disabled={loading || saving || !topicId}
            className="flex-1 sm:flex-none sm:px-8"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Gemini AI is crafting your questions...
              </span>
            ) : (
              "✦ Generate Questions"
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void handleGenerate(true)}
            disabled={loading || saving || !topicId}
          >
            {saving ? "Saving…" : "Generate & Save"}
          </Button>
          {questions.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => void handleGenerate(false)}
              disabled={loading || saving}
            >
              Regenerate
            </Button>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </Card>

      {/* Skeleton Loaders during AI generation */}
      {loading && (
        <div className="space-y-4">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-100">
              Generated Questions
            </h2>
            <Badge variant="brand">Generating...</Badge>
          </div>
          {[0, 1, 2].map((i) => (
            <Card key={i} className="overflow-hidden border border-slate-700/60 bg-slate-900/90">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 shrink-0 animate-pulse rounded-full bg-slate-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-slate-700" />
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-700/60 px-5 pb-5 pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-700" />
                      <div className="flex-1 h-10 animate-pulse rounded-lg bg-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Generated Questions */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-100">
              Generated Questions
            </h2>
            <Badge variant="brand">{questions.length} questions</Badge>
            <Badge
              variant={
                difficulty === "hard" ? "warning" : difficulty === "medium" ? "brand" : "success"
              }
            >
              {difficulty}
            </Badge>
          </div>

          <div className="space-y-4" ref={questionsContainerRef}>
            {questions.map((q, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
              >
                <Card className="relative overflow-hidden border border-slate-700/60 bg-slate-900/90">
                  {/* AI Badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 bg-violet-900/30 border border-violet-700 rounded-full px-2.5 py-1 shadow-lg shadow-violet-500/20">
                      <span className="text-xs">✨</span>
                      AI Generated
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400 shadow-lg shadow-cyan-500/20">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-sm font-medium text-white leading-relaxed">
                        {q.question}
                      </p>
                    </div>
                  </div>

                <div className="border-t border-gray-800 px-5 pb-5 pt-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt: string, optIdx: number) => {
                        const label = ["A", "B", "C", "D"][optIdx];
                        const isCorrect = label === q.answer;
                        const isRevealed = revealedQuestions.has(index);
                        const selectedOption = selectedOptions[index];
                        const isSelected = selectedOption === label;

                        let bgClass = "bg-[#1E293B]/50 hover:bg-[#1E293B] cursor-pointer border border-gray-700";
                        let ringClass = "";
                        let badgeClass = "bg-gray-700 text-slate-400 border border-gray-600";
                        let textClass = "text-slate-300";
                        let showCorrectBadge = false;

                        if (isRevealed) {
                          if (isCorrect) {
                            bgClass = "bg-emerald-500/10 ring-1 ring-emerald-500/50 border border-emerald-500/30";
                            ringClass = "ring-1 ring-emerald-500/50";
                            badgeClass = "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
                            textClass = "font-medium text-emerald-300";
                            showCorrectBadge = true;
                          } else if (isSelected && !isCorrect) {
                            bgClass = "bg-red-500/10 ring-1 ring-red-500/50 border border-red-500/30";
                            ringClass = "ring-1 ring-red-500/50";
                            badgeClass = "bg-red-500/20 text-red-400 border border-red-500/30";
                            textClass = "font-medium text-red-300";
                          }
                        } else if (isSelected) {
                          bgClass = "bg-cyan-500/10 ring-1 ring-cyan-500/50 border border-cyan-500/30";
                          ringClass = "ring-1 ring-cyan-500/50";
                          badgeClass = "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30";
                          textClass = "font-medium text-cyan-300";
                        }

                        return (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              if (!isRevealed) {
                                setSelectedOptions(prev => ({ ...prev, [index]: label }));
                                setRevealedQuestions(prev => new Set([...prev, index]));
                              }
                            }}
                            disabled={isRevealed}
                            className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm transition ${bgClass} ${ringClass} ${isRevealed ? 'cursor-default' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${badgeClass}`}
                            >
                              {label}
                            </span>
                            <span className={textClass}>
                              {opt}
                              {showCorrectBadge && (
                                <span className="ml-2 text-xs font-semibold text-emerald-400">
                                  ✓ Correct
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {revealedQuestions.has(index) && q.explanation && (
                      <div className="mt-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400">
                          Explanation
                        </p>
                        <p className="mt-1 text-sm text-cyan-200">{q.explanation}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="brand">
                        {difficulty}
                      </Badge>
                      {!revealedQuestions.has(index) && (
                        <span className="text-xs text-slate-400">Click an option to reveal the answer</span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-700/60 bg-[#131B2B]/50 px-4 py-3 text-center text-sm text-slate-300">
            These are AI-generated practice questions. Use them to prepare for your assessment or save them directly to the topic question bank.
          </div>
        </motion.div>
      )}

      {/* Empty state if nothing generated yet */}
      {!loading && questions.length === 0 && !error && (
        <div className="flex flex-col items-center py-16 text-center">
          <span className="text-5xl">✦</span>
          <h3 className="mt-4 text-lg font-semibold text-white">
            Ready to generate
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Configure your topic, difficulty, and count above, then click Generate Questions.
          </p>
        </div>
      )}
    </div>
  );
}
