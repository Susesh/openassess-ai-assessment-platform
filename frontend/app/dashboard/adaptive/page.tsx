"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Card, PageHeader, ProgressBar, SkeletonCard } from "@/components/ui";
import { getAnalytics, getHeatmap, getResults } from "@/lib/api";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import type { AnalyticsSummary, HeatmapItem, ResultSummary } from "@/lib/types";
import { Brain, TrendingUp, Target, Zap, AlertTriangle, Trophy, Lightbulb, ArrowRight, BarChart3, Sparkles, CheckCircle, Route, Calendar, Gauge, LineChart } from "lucide-react";

type DifficultyLevel = "beginner" | "intermediate" | "advanced";

function inferDifficulty(avgScore: number): DifficultyLevel {
  if (avgScore >= 80) return "advanced";
  if (avgScore >= 55) return "intermediate";
  return "beginner";
}

function nextDifficulty(current: DifficultyLevel): DifficultyLevel {
  if (current === "beginner") return "intermediate";
  if (current === "intermediate") return "advanced";
  return "advanced";
}

export default function AdaptiveDifficultyPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAILearningPath, setShowAILearningPath] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<'progress' | 'timeline'>('progress');

  useEffect(() => {
    Promise.all([getAnalytics(), getHeatmap(), getResults()])
      .then(([a, h, r]) => {
        setAnalytics(a);
        setHeatmap(h);
        setResults(r);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const overallDifficulty = analytics
    ? inferDifficulty(analytics.average_score)
    : "beginner";

  const confidence =
    analytics && analytics.total_attempts > 0
      ? Math.min(100, Math.round((analytics.total_attempts / 20) * 100))
      : 0;

  const topicDifficulties = heatmap.map((h) => ({
    topic: h.topic,
    avgScore: h.avg_score,
    attempts: h.attempts,
    difficulty: inferDifficulty(h.avg_score),
    recommendation: inferDifficulty(h.avg_score) !== "advanced" ? "increase difficulty" : "maintain",
  }));

  const recentTrend =
    results.length >= 3
      ? results
          .slice(-5)
          .reduce((sum, r) => sum + r.percentage, 0) /
        Math.min(5, results.length)
      : null;

  const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    beginner: "bg-[#C1C4C8]/20 text-[#7B7F85] border border-[#C1C4C8]",
    intermediate: "bg-[#7B7F85]/20 text-[#7B7F85] border border-[#7B7F85]",
    advanced: "bg-[#2B2E33]/20 text-[#2B2E33] border border-[#2B2E33]",
  };

  const DIFFICULTY_ICONS: Record<DifficultyLevel, string> = {
    beginner: "🟢",
    intermediate: "🟡",
    advanced: "🔵",
  };

  if (loading) {
    return (
      <div className="min-h-screen space-y-6">
        <div className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Adaptive Difficulty</p>
          </div>
          <h1 className="text-4xl font-bold text-white">Loading difficulty analysis…</h1>
        </div>
        <div className="bento-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bento-item col-span-4 md:col-span-3 lg:col-span-4 shimmer h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Adaptive Difficulty</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            AI-Powered Learning Paths
          </h1>
          <p className="text-lg text-white/90">
            Your current difficulty profile and personalised mastery recommendations.
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* AI Learning Path */}
      {showAILearningPath && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Route className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Learning Path</h2>
                <p className="text-sm text-[#7B7F85]">Personalized learning journey based on your performance</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setVisualizationMode('progress')}
                className={`px-4 py-2 rounded-xl font-semibold transition ${visualizationMode === 'progress' ? 'bg-[#2B2E33] text-white' : 'bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8]'}`}
              >
                <Gauge className="w-4 h-4 inline mr-2" />
                Progress
              </button>
              <button
                onClick={() => setVisualizationMode('timeline')}
                className={`px-4 py-2 rounded-xl font-semibold transition ${visualizationMode === 'timeline' ? 'bg-[#2B2E33] text-white' : 'bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8]'}`}
              >
                <LineChart className="w-4 h-4 inline mr-2" />
                Timeline
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { step: 1, name: "Foundation Building", status: "completed", topics: ["Basic Concepts", "Introduction"] },
              { step: 2, name: "Skill Development", status: overallDifficulty === "beginner" ? "current" : "completed", topics: ["Intermediate Topics"] },
              { step: 3, name: "Advanced Mastery", status: overallDifficulty === "advanced" ? "current" : "upcoming", topics: ["Advanced Concepts"] },
            ].map((milestone, index) => (
              <motion.div
                key={milestone.step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 ${
                  milestone.status === "completed" 
                    ? "border-[#2B2E33] bg-[#2B2E33]/10" 
                    : milestone.status === "current"
                      ? "border-[#7B7F85] bg-[#7B7F85]/10"
                      : "border-[#C1C4C8] bg-[#F5F6F7] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      milestone.status === "completed" 
                        ? "bg-[#2B2E33] text-white" 
                        : milestone.status === "current"
                          ? "bg-[#7B7F85] text-white"
                          : "bg-[#C1C4C8] text-[#7B7F85]"
                    }`}>
                      {milestone.status === "completed" ? "✓" : milestone.step}
                    </div>
                    <div>
                      <p className="font-semibold text-[#2B2E33]">{milestone.name}</p>
                      <p className="text-xs text-[#7B7F85]">{milestone.topics.join(", ")}</p>
                    </div>
                  </div>
                  <Badge variant={milestone.status === "completed" ? "success" : milestone.status === "current" ? "brand" : "default"}>
                    {milestone.status}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Current Level - Bento Grid */}
      <div className="bento-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-6 h-6 text-[#2B2E33]" />
            <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Current Level</p>
          </div>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-5xl mb-2"
          >
            {DIFFICULTY_ICONS[overallDifficulty]}
          </motion.p>
          <p className="text-2xl font-bold capitalize text-[#2B2E33] tracking-tight">
            {overallDifficulty}
          </p>
          <p className="text-sm text-[#7B7F85] mt-2">
            Based on {analytics?.average_score ?? 0}% avg score
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-[#2B2E33]" />
            <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Mastery Score</p>
          </div>
          <motion.p
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-3xl font-bold text-[#2B2E33] tracking-tight"
          >
            {analytics?.average_score ?? 0}%
          </motion.p>
          <div className="mt-3">
            <ProgressBar
              value={analytics?.average_score ?? 0}
              className={
                (analytics?.average_score ?? 0) >= 80
                  ? "bg-[#2B2E33]"
                  : (analytics?.average_score ?? 0) >= 55
                    ? "bg-[#7B7F85]"
                    : "bg-[#C1C4C8]"
              }
            />
          </div>
          <p className="text-xs text-[#7B7F85] mt-2">
            {analytics?.total_attempts ?? 0} attempts across {analytics?.topics_attempted ?? 0} topics
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-[#2B2E33]" />
            <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Confidence Meter</p>
          </div>
          <div className="relative pt-2">
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#C1C4C8"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#2B2E33"
                    strokeWidth="8"
                    strokeDasharray={`${confidence * 2.83} 283`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.p
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-3xl font-bold text-[#2B2E33]"
                  >
                    {confidence}%
                  </motion.p>
                </div>
              </div>
            </div>
            <p className="text-xs text-[#7B7F85] text-center">
              Based on {analytics?.total_attempts ?? 0} attempts
            </p>
          </div>
        </motion.div>
      </div>

      {/* Difficulty Progression */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-[#2B2E33]" />
          <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
            Difficulty Progression
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${DIFFICULTY_COLORS[overallDifficulty]}`}
            >
              {overallDifficulty}
            </span>
            <p className="mt-1 text-xs text-[#7B7F85]">Current</p>
          </div>
          <div className="flex-1 h-0.5 bg-[#C1C4C8]/40">
            <div
              className="h-full bg-[#2B2E33]"
              style={{
                width: `${overallDifficulty === "beginner" ? 33 : overallDifficulty === "intermediate" ? 66 : 100}%`,
              }}
            />
          </div>
          <div className="flex flex-col items-center">
            <span
              className={`rounded-full px-4 py-2 text-sm font-bold ${DIFFICULTY_COLORS[nextDifficulty(overallDifficulty)]}`}
            >
              {nextDifficulty(overallDifficulty)}
            </span>
            <p className="mt-1 text-xs text-[#7B7F85]">Next target</p>
          </div>
        </div>

        {recentTrend !== null && (
          <div className="mt-4 rounded-xl bg-[#C1C4C8]/20 border border-[#C1C4C8] px-4 py-3">
            <p className="text-sm text-[#2B2E33]">
              <span className="font-semibold text-[#7B7F85]">Recent trend:</span>{" "}
              {recentTrend.toFixed(1)}% average in last {Math.min(5, results.length)} attempts.
              {recentTrend >= 80
                ? " You're ready to advance! 🚀"
                : recentTrend >= 60
                  ? " Keep practicing to unlock the next level. 💪"
                  : " Focus on foundational topics first. 📚"}
            </p>
          </div>
        )}
      </motion.div>

      {/* Predictive Progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <LineChart className="w-5 h-5 text-[#2B2E33]" />
          <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
            Predictive Progress
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-xl bg-[#C1C4C8]/20 border border-[#C1C4C8] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-[#2B2E33]">Projected Mastery</span>
              <span className="text-sm font-bold text-[#2B2E33]">
                {Math.min(100, Math.round((analytics?.average_score ?? 0) + (confidence * 0.2)))}%
              </span>
            </div>
            <ProgressBar 
              value={Math.min(100, (analytics?.average_score ?? 0) + (confidence * 0.2))} 
              className="bg-[#2B2E33]" 
            />
            <p className="text-xs text-[#7B7F85] mt-2">
              Based on current trajectory and confidence level
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#2B2E33]/10 border border-[#2B2E33] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#2B2E33]" />
                <span className="text-xs font-semibold text-[#2B2E33]">Time to Next Level</span>
              </div>
              <p className="text-lg font-bold text-[#2B2E33]">
                {overallDifficulty === "advanced" ? "—" : 
                 overallDifficulty === "intermediate" ? "~2 weeks" : "~1 week"}
              </p>
            </div>
            <div className="rounded-xl bg-[#7B7F85]/10 border border-[#7B7F85] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#7B7F85]" />
                <span className="text-xs font-semibold text-[#7B7F85]">Assessments Needed</span>
              </div>
              <p className="text-lg font-bold text-[#7B7F85]">
                {overallDifficulty === "advanced" ? "—" : 
                 overallDifficulty === "intermediate" ? "3-5" : "2-3"}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Per-topic Difficulty */}
      {topicDifficulties.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
              Per-Topic Difficulty
            </h2>
          </div>
          <div className="space-y-3">
            {topicDifficulties
              .sort((a, b) => b.avgScore - a.avgScore)
              .map((td, index) => (
                <motion.div
                  key={td.topic}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-36 truncate text-sm font-bold text-[#2B2E33] tracking-tight">
                    {td.topic}
                  </div>
                  <div className="flex-1">
                    <ProgressBar
                      value={td.avgScore}
                      className={
                        td.difficulty === "advanced"
                          ? "bg-[#2B2E33]"
                          : td.difficulty === "intermediate"
                            ? "bg-[#7B7F85]"
                            : "bg-[#C1C4C8]"
                      }
                    />
                  </div>
                  <span
                    className={`w-24 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${DIFFICULTY_COLORS[td.difficulty]}`}
                  >
                    {td.difficulty}
                  </span>
                  <span className="w-8 text-right text-xs text-[#7B7F85]">
                    {td.avgScore}%
                  </span>
                </motion.div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-[#2B2E33]" />
          <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
            AI Recommendations
          </h2>
        </div>
        <div className="space-y-3">
          {analytics?.weakest_topic && (
            <div className="flex items-start gap-3 rounded-xl bg-[#C1C4C8]/20 border border-[#C1C4C8] px-4 py-3">
              <AlertTriangle className="w-5 h-5 text-[#7B7F85] mt-0.5" />
              <div>
                <p className="font-semibold text-[#7B7F85]">Focus area</p>
                <p className="text-sm text-[#7B7F85]">
                  Review <strong>{analytics.weakest_topic}</strong> — this is your weakest area.
                  Start with beginner-level questions.
                </p>
              </div>
            </div>
          )}
          {analytics?.strongest_topic && (
            <div className="flex items-start gap-3 rounded-xl bg-[#2B2E33]/10 border border-[#2B2E33] px-4 py-3">
              <Trophy className="w-5 h-5 text-[#2B2E33] mt-0.5" />
              <div>
                <p className="font-semibold text-[#2B2E33]">Strength</p>
                <p className="text-sm text-[#7B7F85]">
                  You excel at <strong>{analytics.strongest_topic}</strong>. Challenge yourself
                  with advanced questions in this area.
                </p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-[#C1C4C8]/20 border border-[#C1C4C8] px-4 py-3">
            <CheckCircle className="w-5 h-5 text-[#7B7F85] mt-0.5" />
            <div>
              <p className="font-semibold text-[#7B7F85]">Next step</p>
              <p className="text-sm text-[#7B7F85]">
                To advance to{" "}
                <strong>{nextDifficulty(overallDifficulty)}</strong> level,
                aim for 80%+ on your next 3 assessments.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          >
            Take an Assessment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
