"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { Badge, Card, PageHeader, ProgressBar, Skeleton, SkeletonCard, StatCard } from "@/components/ui";
import { getAnalytics, getCertificates, getHeatmap, getResults } from "@/lib/api";
import { normalizeHeatmapItems } from "@/lib/heatmap";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import { Chart3D } from "@/src/components/analytics/Chart3D";
import type { AnalyticsSummary, Certificate, HeatmapItem, ResultSummary } from "@/lib/types";
import { ArrowRight, AlertTriangle, TrendingUp, Target, BarChart3, Brain, Zap, Sparkles, Calendar, Clock, Award, Activity, Settings, Layout, Download, Share2 } from "lucide-react";

function ScoreColor(score: number): string {
  if (score >= 70) return "#2B2E33";
  return "#7B7F85";
}

export default function AnalyticsPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [results, setResults] = useState<ResultSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<string[]>(['trend', 'heatmap', 'radar', 'performance', 'strengths', 'weaknesses']);

  useEffect(() => {
    Promise.all([getAnalytics(), getHeatmap(), getCertificates(), getResults()])
      .then(([a, h, c, r]) => {
        setAnalytics(a);
        setHeatmap(h);
        setCertificates(c);
        setResults(r);
      })
      .catch((err) => setError(err.message ?? "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const uniqueHeatmap = normalizeHeatmapItems(heatmap);

  // Build score trend data from results (last 20)
  const trendData = [...results]
    .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
    .slice(-20)
    .map((r, i) => ({
      attempt: i + 1,
      score: r.percentage,
      passed: r.passed,
      topic: r.topic_name,
    }));

  // Topic bar chart data
  const topicBarData = uniqueHeatmap
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, 10)
    .map((h) => ({
      topic: h.topic.length > 12 ? h.topic.slice(0, 12) + "…" : h.topic,
      fullTopic: h.topic,
      score: h.avg_score,
      attempts: h.attempts,
    }));

  // Radar chart for topic mastery
  const radarData = uniqueHeatmap.slice(0, 6).map((h) => ({
    subject: h.topic.length > 10 ? h.topic.slice(0, 10) + "…" : h.topic,
    score: h.avg_score,
    fullMark: 100,
  }));

  const participationCount = certificates.filter((c) => c.certificate_type === "participation").length;
  const achievementCount = certificates.filter((c) => c.certificate_type === "achievement").length;
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;

  if (loading) {
    return (
      <div className="min-h-screen space-y-6">
        <div className="rounded-2xl border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Progress Analytics</p>
          </div>
          <h1 className="text-4xl font-bold text-white">Loading your performance data…</h1>
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
      <section className="rounded-2xl border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-6 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-white/80" />
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Progress Analytics</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              Performance Dashboard
            </h1>
            <p className="text-lg text-white/90">
              In-depth view of your learning journey, scores, trends, and topic mastery with AI-powered insights.
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Brain className="w-4 h-4" />
              {viewMode === "2d" ? "3D View" : "2D View"}
            </button>
            <button
              onClick={() => setShowCustomBuilder(!showCustomBuilder)}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Layout className="w-4 h-4" />
              Customize
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${timeRange === 'week' ? 'bg-white text-[#2B2E33]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${timeRange === 'month' ? 'bg-white text-[#2B2E33]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${timeRange === 'all' ? 'bg-white text-[#2B2E33]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Custom Dashboard Builder */}
      {showCustomBuilder && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Layout className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Custom Dashboard Builder</h2>
                <p className="text-sm text-[#7B7F85]">Drag and drop widgets to customize your analytics view</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] font-semibold hover:bg-[#C1C4C8]/20 transition">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] font-semibold hover:bg-[#C1C4C8]/20 transition">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { id: 'trend', name: 'Score Trend', icon: Activity },
              { id: 'heatmap', name: 'Topic Heatmap', icon: BarChart3 },
              { id: 'radar', name: 'Topic Radar', icon: Target },
              { id: 'performance', name: 'Topic Performance', icon: TrendingUp },
              { id: 'strengths', name: 'Strongest Topics', icon: Award },
              { id: 'weaknesses', name: 'Weak Areas', icon: AlertTriangle },
            ].map((widget) => {
              const Icon = widget.icon;
              const isSelected = customWidgets.includes(widget.id);
              
              return (
                <motion.button
                  key={widget.id}
                  onClick={() => {
                    if (isSelected) {
                      setCustomWidgets(customWidgets.filter(w => w !== widget.id));
                    } else {
                      setCustomWidgets([...customWidgets, widget.id]);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-[#2B2E33] bg-[#2B2E33]/10' 
                      : 'border-[#C1C4C8] bg-[#F5F6F7] hover:border-[#2B2E33]/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#2B2E33]' : 'text-[#7B7F85]'}`} />
                    <span className={`font-medium ${isSelected ? 'text-[#2B2E33]' : 'text-[#7B7F85]'}`}>
                      {widget.name}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* AI Insights Panel */}
      {insights.length > 0 && (
        <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI-Powered Insights</h2>
              <p className="text-sm text-[#7B7F85]">Intelligent analysis of your learning patterns</p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {insights.slice(0, 6).map((insight, index) => (
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

      {/* Summary Stats - Bento Grid */}
      <div className="bento-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Total Attempts</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {analytics?.total_attempts ?? 0}
              </motion.p>
            </div>
          </div>
          <p className="text-sm text-[#7B7F85]">{analytics?.topics_attempted ?? 0} topics covered</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#C1C4C8]">
            <div
              className="h-full rounded-full bg-[#2B2E33] transition-all"
              style={{ width: `${Math.min(100, (analytics?.total_attempts ?? 0) * 5)}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Average Score</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {analytics?.average_score ?? 0}%
              </motion.p>
            </div>
          </div>
          <p className="text-sm text-[#7B7F85]">{analytics?.strongest_topic ? `Best: ${analytics.strongest_topic}` : "No data yet"}</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#C1C4C8]">
            <div
              className="h-full rounded-full bg-[#2B2E33] transition-all"
              style={{ width: `${analytics?.average_score ?? 0}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Pass Rate</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {analytics?.pass_rate ?? 0}%
              </motion.p>
            </div>
          </div>
          <p className="text-sm text-[#7B7F85]">{passCount} passed, {failCount} failed</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#C1C4C8]">
            <div
              className="h-full rounded-full bg-[#2B2E33] transition-all"
              style={{ width: `${analytics?.pass_rate ?? 0}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Certificates</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {certificates.length}
              </motion.p>
            </div>
          </div>
          <p className="text-sm text-[#7B7F85]">{achievementCount} achievement, {participationCount} participation</p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#C1C4C8]">
            <div
              className="h-full rounded-full bg-[#2B2E33] transition-all"
              style={{ width: `${Math.min(100, certificates.length * 10)}%` }}
            />
          </div>
        </motion.div>
      </div>

      {/* Charts Section - Bento Grid */}
      {customWidgets.includes('trend') || customWidgets.includes('heatmap') ? (
        <div className="bento-grid">
          {customWidgets.includes('trend') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-8 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Score Trend Over Time
                </h2>
              </div>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C1C4C8" />
                    <XAxis dataKey="attempt" tick={{ fontSize: 11, fill: "#7B7F85" }} label={{ value: "Attempt #", position: "insideBottom", offset: -2, fontSize: 11, fill: "#7B7F85" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#7B7F85" }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2 text-xs shadow-lg text-[#2B2E33]">
                            <p className="font-semibold">{d.topic}</p>
                            <p>Score: {d.score}%</p>
                            <p className="font-medium text-[#7B7F85]">
                              {d.passed ? "PASS" : "FAIL"}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2B2E33"
                      strokeWidth={2}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill={payload.passed ? "#2B2E33" : "#7B7F85"}
                            stroke="#F5F6F7"
                            strokeWidth={2}
                          />
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-52 items-center justify-center text-sm text-[#7B7F85]">
                  Take some assessments to see your trend
                </div>
              )}
            </motion.div>
          )}

          {customWidgets.includes('heatmap') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Topic Mastery Heatmap
                </h2>
              </div>
              {topicBarData.length > 0 ? (
                viewMode === "3d" ? (
                  <Chart3D data={topicBarData.map(d => ({ label: d.topic, value: d.score }))} type="bar" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={topicBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#C1C4C8" />
                      <XAxis dataKey="topic" tick={{ fontSize: 10, fill: "#7B7F85" }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#7B7F85" }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2 text-xs shadow-lg text-[#2B2E33]">
                              <p className="font-semibold">{d.fullTopic}</p>
                              <p>Avg Score: {d.score}%</p>
                              <p className="text-[#7B7F85]">Attempts: {d.attempts}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {topicBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ScoreColor(entry.score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="flex h-52 items-center justify-center text-sm text-[#7B7F85]">
                  No topic data available yet
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : null}

      {/* Radar Chart + Topic Performance - Bento Grid */}
      {customWidgets.includes('radar') || customWidgets.includes('performance') ? (
        <div className="bento-grid">
          {customWidgets.includes('radar') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Topic Mastery Radar
                </h2>
              </div>
              {radarData.length >= 3 ? (
                viewMode === "3d" ? (
                  <Chart3D data={radarData.map(d => ({ label: d.subject, value: d.score }))} type="sphere" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#C1C4C8" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#7B7F85" }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#7B7F85" }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#2B2E33"
                        fill="#2B2E33"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-[#7B7F85]">
                  Attempt at least 3 topics to see radar
                </div>
              )}
            </motion.div>
          )}

          {customWidgets.includes('performance') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Topic Performance
                </h2>
              </div>
              {uniqueHeatmap.length > 0 ? (
                <div className="space-y-3">
                  {uniqueHeatmap
                    .sort((a, b) => b.avg_score - a.avg_score)
                    .slice(0, 7)
                    .map((item) => (
                      <div key={item.topic}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-[#2B2E33] truncate max-w-[60%]">
                            {item.topic}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#7B7F85]">
                              {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                            </span>
                            <Badge variant={item.avg_score >= 70 ? "default" : "warning"}>
                              {item.avg_score}%
                            </Badge>
                          </div>
                        </div>
                        <ProgressBar
                          value={item.avg_score}
                          className={item.avg_score >= 70 ? "bg-[#2B2E33]" : "bg-[#7B7F85]"}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-[#7B7F85]">
                  No performance data yet
                </div>
              )}
            </motion.div>
          )}
        </div>
      ) : null}

      {/* Strengths & Weaknesses - Bento Grid */}
      {customWidgets.includes('strengths') || customWidgets.includes('weaknesses') ? (
        <div className="bento-grid">
          {customWidgets.includes('strengths') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-[#2B2E33]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Strongest Topics
                </h2>
              </div>
              {analytics?.strongest_topic ? (
                <div className="space-y-2">
                  {uniqueHeatmap
                    .filter((h) => h.avg_score >= 75)
                    .sort((a, b) => b.avg_score - a.avg_score)
                    .slice(0, 5)
                    .map((h) => (
                      <motion.div
                        key={h.topic}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between rounded-xl bg-[#2B2E33] text-[#F5F6F7] px-4 py-2.5 hover-lift"
                      >
                        <span className="text-sm font-medium">{h.topic}</span>
                        <span className="text-sm font-bold">{h.avg_score}%</span>
                      </motion.div>
                    ))}
                  {uniqueHeatmap.filter((h) => h.avg_score >= 75).length === 0 && (
                    <p className="text-sm text-[#7B7F85]">Keep practicing to build strong topics</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#7B7F85]">No data yet</p>
              )}
            </motion.div>
          )}

          {customWidgets.includes('weaknesses') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-[#7B7F85]" />
                <h2 className="text-base font-bold text-[#2B2E33] tracking-tight">
                  Weak Areas
                </h2>
              </div>
              {analytics?.weakest_topic ? (
                <div className="space-y-3">
                  {uniqueHeatmap
                    .filter((h) => h.avg_score < 60)
                    .sort((a, b) => a.avg_score - b.avg_score)
                    .slice(0, 5)
                    .map((h) => (
                      <Link
                        key={h.topic}
                        href={`/dashboard/remediation?topic=${encodeURIComponent(h.topic)}`}
                        className="block transition-all duration-200 hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-between rounded-xl bg-[#F5F6F7] border border-[#C1C4C8] px-4 py-3 hover:border-[#2B2E33] hover-lift">
                          <div className="flex items-center gap-3">
                            <Target className="w-4 h-4 text-[#7B7F85]" />
                            <span className="text-sm font-medium text-[#2B2E33]">{h.topic}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#7B7F85]">{h.avg_score}%</span>
                            <ArrowRight className="w-4 h-4 text-[#7B7F85]" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  {uniqueHeatmap.filter((h) => h.avg_score < 60).length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#7B7F85]">
                      <TrendingUp className="w-4 h-4 text-[#2B2E33]" />
                      No weak topics — great work!
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[#7B7F85]">No data yet</p>
              )}
            </motion.div>
          )}
        </div>
      ) : null}
    </div>
  );
}

