"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TopicPerformance } from "@/components/topic-performance";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import { SkillTree3D } from "@/src/components/portfolio/SkillTree3D";
import { generatePortfolioPdf, getAnalytics, getCertificates, getHeatmap, getMyPortfolio } from "@/lib/api";
import { getInitials } from "@/lib/auth";
import { normalizeHeatmapItems } from "@/lib/heatmap";
import type {
  AnalyticsSummary,
  Certificate,
  HeatmapItem,
  PortfolioData,
} from "@/lib/types";
import { Share2, Download, Award, Clock, TrendingUp, CheckCircle, User, Calendar, BarChart3, Sparkles, Target, FileText, ExternalLink, Brain, Network, Zap, Layers, Edit3, Plus } from "lucide-react";

export default function PortfolioPage() {
  const { user } = useAuth();
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'certificates' | 'skills'>('overview');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showPortfolioBuilder, setShowPortfolioBuilder] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  useEffect(() => {
    Promise.all([getAnalytics(), getHeatmap(), getCertificates(), getMyPortfolio().catch(() => null)])
      .then(([summary, heat, certs, port]) => {
        setAnalytics(summary);
        setHeatmap(heat);
        setCertificates(certs);
        setPortfolio(port);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load portfolio");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleShareLink(cert: Certificate) {
    const url = `${window.location.origin}/dashboard/certificates/${cert.certificate_id}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setShareMsg("Certificate link copied!");
    setTimeout(() => setShareMsg(null), 3000);
  }

  async function handleSharePortfolio() {
    const url = `${window.location.origin}/dashboard/portfolio`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setShareMsg("Portfolio link copied!");
    setTimeout(() => setShareMsg(null), 3000);
  }

  async function handleShareLinkedIn(cert: Certificate) {
    const url = `${window.location.origin}/dashboard/certificates/${cert.certificate_id}`;
    const text = `I just earned a certificate in ${cert.topic_name} with ${cert.percentage}% score!`;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank');
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      const result = await generatePortfolioPdf();
      if (result.pdf_url) {
        window.open(result.pdf_url, "_blank");
      }
    } catch {
      // silently fail, feature may not be available
    } finally {
      setPdfLoading(false);
    }
  }

  const initials = user ? getInitials(user.full_name) : "VS";
  const memberSince = user
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";
  const uniqueHeatmap = normalizeHeatmapItems(heatmap);

  // Certificate statistics
  const participationCertCount = certificates.filter(
    (c) => c.certificate_type === "participation"
  ).length;
  const achievementCertCount = certificates.filter(
    (c) => c.certificate_type === "achievement"
  ).length;
  const totalCertificates = certificates.length;
  const avgCertificateScore =
    certificates.length > 0
      ? Math.round(
          certificates.reduce((sum, c) => sum + c.percentage, 0) /
            certificates.length
        )
      : 0;

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6 text-white/80" />
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Knowledge Portfolio</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              My Portfolio
            </h1>
            <p className="text-lg text-white/90">
              Your verified achievements, mastery levels, and performance — powered by live API data.
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {shareMsg && (
              <span className="rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white">
                {shareMsg}
              </span>
            )}
            <button
              onClick={() => setViewMode(viewMode === "2d" ? "3d" : "2d")}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Network className="w-4 h-4" />
              {viewMode === "2d" ? "3D View" : "2D View"}
            </button>
            <button
              onClick={() => setShowPortfolioBuilder(!showPortfolioBuilder)}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Customize
            </button>
            <Button
              variant="secondary"
              onClick={handleSharePortfolio}
              className="bg-white/10 text-white hover:bg-white/20 border-white/30"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="bg-white/10 text-white hover:bg-white/20 border-white/30"
            >
              <Download className="w-4 h-4 mr-2" />
              {pdfLoading ? "Generating…" : "PDF"}
            </Button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Portfolio Builder */}
      {showPortfolioBuilder && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Portfolio Builder</h2>
                <p className="text-sm text-[#7B7F85]">Customize which sections appear in your portfolio</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { id: 'profile', name: 'Profile Card', icon: User },
              { id: 'certificates', name: 'Certificates', icon: Award },
              { id: 'skills', name: 'Skill Tree', icon: Network },
              { id: 'activity', name: 'Topic Activity', icon: BarChart3 },
            ].map((section) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={section.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl border-2 border-[#2B2E33] bg-[#2B2E33]/10 hover:bg-[#2B2E33]/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-[#2B2E33]" />
                    <span className="font-medium text-[#2B2E33]">{section.name}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* AI Analysis */}
      {showAIAnalysis && insights.length > 0 && (
        <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Portfolio Analysis</h2>
              <p className="text-sm text-[#7B7F85]">AI-powered insights about your learning journey</p>
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
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Profile Card - Bento Grid */}
      <div className="bento-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-item col-span-12 md:col-span-8 lg:col-span-8 bg-[#F5F6F7] border border-[#C1C4C8] p-8 shadow-lg"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] text-3xl font-bold text-[#F5F6F7] shadow-lg">
              {initials}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-[#2B2E33]">
                {user?.full_name ?? "Verified Student"}
              </h2>
              <p className="mt-1 text-[#7B7F85]">{user?.email ?? "student@openassess.io"}</p>
              {memberSince ? (
                <p className="mt-1 text-sm text-[#7B7F85] flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {memberSince}
                </p>
              ) : null}
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#2B2E33]/10 px-4 py-1.5 text-xs font-semibold text-[#2B2E33] border border-[#C1C4C8]">
                <CheckCircle className="w-4 h-4" />
                Verified Learner
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bento-item col-span-12 md:col-span-4 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Certificates",
                value: loading ? "—" : String(totalCertificates),
                subtext: `${participationCertCount} Participation, ${achievementCertCount} Achievement`,
                icon: Award,
              },
              {
                label: "Avg Score",
                value: loading ? "—" : `${avgCertificateScore}%`,
                subtext: analytics ? `Overall: ${analytics.average_score}%` : "",
                icon: BarChart3,
              },
              {
                label: "Assessments",
                value: loading ? "—" : String(analytics?.total_attempts ?? 0),
                subtext: `${analytics?.pass_rate ?? 0}% pass rate`,
                icon: Target,
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-5 h-5 mx-auto text-[#7B7F85] mb-2" />
                <motion.p
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-xl font-bold text-[#2B2E33]"
                >
                  {stat.value}
                </motion.p>
                <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Achievement Certificates Section */}
      {achievementCertCount > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-[#2B2E33]" />
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">
                Achievement Certificates
              </h2>
            </div>
            <Badge variant="success">{achievementCertCount}</Badge>
          </div>
          <div className="bento-grid">
            {certificates
              .filter((c) => c.certificate_type === "achievement")
              .map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2B2E33]/10 text-[#2B2E33] shadow-lg">
                      <Award className="w-6 h-6" />
                    </div>
                    <Badge variant="success">{cert.percentage}%</Badge>
                  </div>
                  <h3 className="font-bold text-[#2B2E33] tracking-tight mb-1">
                    {cert.topic_name}
                  </h3>
                  <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide mb-3">
                    {cert.certificate_id}
                  </p>
                  <p className="text-sm text-[#7B7F85] mb-2">
                    Score: {cert.score}/{cert.total}
                  </p>
                  <p className="text-xs text-[#7B7F85] flex items-center gap-1 mb-4">
                    <Clock className="w-3 h-3" />
                    Issued{" "}
                    {new Date(cert.issued_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/certificates/${cert.certificate_id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105"
                    >
                      <CheckCircle className="w-3 h-3" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadCertificatePdf(cert)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2 text-xs font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#C1C4C8] flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareLink(cert)}
                      className="flex-1 rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-1.5 text-xs font-medium text-[#2B2E33] transition hover:bg-[#C1C4C8]/20 flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareLinkedIn(cert)}
                      className="flex-1 rounded-lg border border-[#0077B5] bg-[#0077B5]/10 px-3 py-1.5 text-xs font-medium text-[#0077B5] transition hover:bg-[#0077B5]/20 flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      LinkedIn
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* Participation Certificates Section */}
      {participationCertCount > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#7B7F85]" />
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">
                Participation Certificates
              </h2>
            </div>
            <Badge variant="brand">{participationCertCount}</Badge>
          </div>
          <div className="bento-grid">
            {certificates
              .filter((c) => c.certificate_type === "participation")
              .map((cert, index) => (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7B7F85]/10 text-[#7B7F85] shadow-lg">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <Badge variant="brand">{cert.percentage}%</Badge>
                  </div>
                  <h3 className="font-bold text-[#2B2E33] tracking-tight mb-1">
                    {cert.topic_name}
                  </h3>
                  <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide mb-3">
                    {cert.certificate_id}
                  </p>
                  <p className="text-sm text-[#7B7F85] mb-2">
                    Score: {cert.score}/{cert.total}
                  </p>
                  <p className="text-xs text-[#7B7F85] flex items-center gap-1 mb-4">
                    <Clock className="w-3 h-3" />
                    Issued{" "}
                    {new Date(cert.issued_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/certificates/${cert.certificate_id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7B7F85] to-[#C1C4C8] px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:scale-105"
                    >
                      <CheckCircle className="w-3 h-3" />
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => downloadCertificatePdf(cert)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2 text-xs font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-[#C1C4C8] flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleShareLink(cert)}
                      className="flex-1 rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-1.5 text-xs font-medium text-[#2B2E33] transition hover:bg-[#C1C4C8]/20 flex items-center justify-center gap-1"
                    >
                      <Share2 className="w-3 h-3" />
                      Copy Link
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareLinkedIn(cert)}
                      className="flex-1 rounded-lg border border-[#0077B5] bg-[#0077B5]/10 px-3 py-1.5 text-xs font-medium text-[#0077B5] transition hover:bg-[#0077B5]/20 flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      LinkedIn
                    </button>
                  </div>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* No Certificates State */}
      {!loading && totalCertificates === 0 && (
        <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#C1C4C8]/20 flex items-center justify-center">
              <Award className="w-10 h-10 text-[#7B7F85]" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-[#2B2E33] mb-2">No certificates yet</h3>
          <p className="text-[#7B7F85] mb-6">
            Complete assessments to earn participation and achievement certificates.
          </p>
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          >
            Take an Assessment
            <Award className="w-4 h-4" />
          </Link>
        </section>
      )}

      {/* In-Progress Topics Section */}
      {uniqueHeatmap.filter((h) => h.avg_score < 80 && h.avg_score >= 60).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#7B7F85]" />
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">
                In-Progress Topics
              </h2>
            </div>
            <Badge variant="brand">
              {uniqueHeatmap.filter((h) => h.avg_score < 80 && h.avg_score >= 60).length}
            </Badge>
          </div>
          <div className="bento-grid">
            {uniqueHeatmap
              .filter((h) => h.avg_score < 80 && h.avg_score >= 60)
              .sort((a, b) => b.avg_score - a.avg_score)
              .map((item, index) => (
                <motion.div
                  key={item.topic}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-[#2B2E33] tracking-tight">{item.topic}</h3>
                    <Badge variant="brand">{item.avg_score}%</Badge>
                  </div>
                  <p className="text-sm text-[#7B7F85] mb-4">
                    {item.attempts} attempt{item.attempts !== 1 ? "s" : ""} • Close to mastery
                  </p>
                  <Link
                    href="/dashboard/assessment"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#2B2E33] hover:text-[#7B7F85] transition-colors"
                  >
                    Continue Learning
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {/* Topic Mastery & Activity - Bento Grid */}
      <section className="bento-grid">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <Network className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
              Skill Tree
            </h2>
          </div>
          {loading ? (
            <p className="text-[#7B7F85]">Loading…</p>
          ) : viewMode === "3d" ? (
            <SkillTree3D skills={uniqueHeatmap.map(h => ({ name: h.topic, level: h.avg_score }))} />
          ) : (
            <TopicPerformance items={uniqueHeatmap} />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bento-item col-span-12 md:col-span-6 lg:col-span-6 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">
              Topic Activity
            </h2>
          </div>
          <p className="mb-6 text-sm text-[#7B7F85]">
            Attempt counts and average scores from your assessment history.
          </p>
          {loading ? (
            <p className="text-[#7B7F85]">Loading…</p>
          ) : uniqueHeatmap.length === 0 ? (
            <p className="text-sm text-[#7B7F85]">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {uniqueHeatmap.map((item, index) => (
                <motion.li
                  key={`${item.topic}-${index}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-3 text-sm hover:border-[#2B2E33] hover-lift transition-all duration-300"
                >
                  <span className="font-bold text-[#2B2E33] tracking-tight">{item.topic}</span>
                  <span className="text-[#7B7F85] font-semibold">
                    {item.attempts}× · {item.avg_score}%
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </motion.div>
      </section>
    </div>
  );
}
