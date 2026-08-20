"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge, Card, EmptyState, PageHeader, SkeletonCard } from "@/components/ui";
import { getCertificates } from "@/lib/api";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import { Certificate3D } from "@/src/components/certificates/Certificate3D";
import type { Certificate } from "@/lib/types";
import { Award, Download, Share2, Eye, Filter, Sparkles, Calendar, Trophy, FileText, Search, ChevronDown, Medal, Star, Zap, Box, Layers } from "lucide-react";

export default function CertificatesPage() {
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "achievement" | "participation">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewMode, setPreviewMode] = useState<"2d" | "3d">("2d");
  const [showAchievements, setShowAchievements] = useState(true);

  useEffect(() => {
    getCertificates()
      .then(setCertificates)
      .catch((err) => setError(err.message ?? "Failed to load certificates"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = certificates.filter(
    (c) => {
      const matchesFilter = filter === "all" || c.certificate_type === filter;
      const matchesSearch = !searchQuery || 
        c.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.certificate_id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    }
  );

  const achievementCount = certificates.filter((c) => c.certificate_type === "achievement").length;
  const participationCount = certificates.filter((c) => c.certificate_type === "participation").length;

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
              <Award className="w-6 h-6 text-white/80" />
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Certificates</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              My Achievements
            </h1>
            <p className="text-lg text-white/90">
              Your earned participation and achievement certificates. Download, share, or verify them.
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setPreviewMode(previewMode === "2d" ? "3d" : "2d")}
              className="px-4 py-2 rounded-xl font-semibold transition bg-white/10 text-white hover:bg-white/20 flex items-center gap-2"
            >
              <Box className="w-4 h-4" />
              {previewMode === "2d" ? "3D Preview" : "2D Preview"}
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${viewMode === 'grid' ? 'bg-white text-[#2B2E33]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl font-semibold transition ${viewMode === 'list' ? 'bg-white text-[#2B2E33]' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <FileText className="w-4 h-4 inline mr-2 rotate-90" />
              List
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Stats - Bento Grid */}
      <div className="bento-grid">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Total Certificates</p>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Achievement</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {achievementCount}
              </motion.p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide">Participation</p>
              <motion.p
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-3xl font-bold text-[#2B2E33]"
              >
                {participationCount}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Achievement Badges */}
      {showAchievements && achievementCount > 0 && (
        <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Medal className="w-6 h-6 text-[#2B2E33]" />
              <div>
                <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">Achievement Badges</h2>
                <p className="text-sm text-[#7B7F85]">Earn badges for exceptional performance</p>
              </div>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Star, name: "First Achievement", color: "from-amber-400 to-amber-600", unlocked: achievementCount >= 1 },
              { icon: Zap, name: "Speed Demon", color: "from-cyan-400 to-cyan-600", unlocked: achievementCount >= 3 },
              { icon: Trophy, name: "Master", color: "from-violet-400 to-violet-600", unlocked: achievementCount >= 5 },
              { icon: Medal, name: "Legend", color: "from-rose-400 to-rose-600", unlocked: achievementCount >= 10 },
            ].map((badge, index) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    badge.unlocked 
                      ? 'border-[#2B2E33] bg-gradient-to-br from-[#2B2E33]/10 to-[#7B7F85]/10' 
                      : 'border-[#C1C4C8] bg-[#F5F6F7] opacity-50'
                  }`}
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${badge.color} mb-3 ${badge.unlocked ? '' : 'grayscale'}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-[#2B2E33]">{badge.name}</p>
                  <p className="text-xs text-[#7B7F85]">{badge.unlocked ? 'Unlocked' : 'Locked'}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter and Search */}
      <section className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2" role="tablist" aria-label="Filter certificates">
            {(["all", "achievement", "participation"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                onClick={() => setFilter(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-300 ${
                  filter === tab
                    ? "bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg"
                    : "bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8] hover:bg-[#C1C4C8]/20"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== "all" && (
                  <span className="ml-2 text-xs opacity-75">
                    ({tab === "achievement" ? achievementCount : participationCount})
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7B7F85]" />
            <input
              type="search"
              placeholder="Search certificates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] placeholder-[#7B7F85] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="bento-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bento-item col-span-4 md:col-span-3 lg:col-span-4 shimmer h-80 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-[#C1C4C8]/20 flex items-center justify-center">
              {filter === "achievement" ? (
                <Trophy className="w-10 h-10 text-[#7B7F85]" />
              ) : (
                <Award className="w-10 h-10 text-[#7B7F85]" />
              )}
            </div>
          </div>
          <h3 className="text-xl font-bold text-[#2B2E33] mb-2">
            {filter === "all" ? "No certificates yet" : `No ${filter} certificates`}
          </h3>
          <p className="text-[#7B7F85] mb-6">
            {filter === "all"
              ? "Complete your first assessment to earn a participation certificate."
              : "Pass with 80%+ to earn an achievement certificate."}
          </p>
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          >
            Take an Assessment
            <Award className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'bento-grid' : 'space-y-4'}>
          {filtered.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} viewMode={viewMode} previewMode={previewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function CertificateCard({ cert, viewMode, previewMode }: { cert: Certificate; viewMode: "grid" | "list"; previewMode: "2d" | "3d" }) {
  const isAchievement = cert.certificate_type === "achievement";
  const [copying, setCopying] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/verify/${cert.certificate_id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch {
      // fallback: prompt
      window.prompt("Copy this verification link:", url);
    }
  }

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4 p-6 rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] shadow-lg hover-lift"
      >
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl shadow-lg ${isAchievement ? "bg-[#2B2E33]/10 text-[#2B2E33]" : "bg-[#7B7F85]/10 text-[#7B7F85]"}`}>
          {isAchievement ? <Trophy className="w-7 h-7" /> : <Award className="w-7 h-7" />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-[#2B2E33] tracking-tight">{cert.topic_name}</h3>
            <Badge variant={isAchievement ? "success" : "brand"}>{cert.percentage}%</Badge>
          </div>
          <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide mb-2">
            {isAchievement ? "Certificate of Achievement" : "Certificate of Participation"}
          </p>
          <div className="flex gap-4 text-sm text-[#7B7F85]">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(cert.issued_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span>Score: {cert.score}/{cert.total}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/certificates/${cert.certificate_id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            View
          </Link>
          <button
            type="button"
            onClick={() => downloadCertificatePdf(cert)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={handleShare}
            title="Copy share link"
            className="inline-flex items-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-4 py-2 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
          >
            {copying ? "✓" : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-item col-span-4 md:col-span-3 lg:col-span-4 bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-lg hover-lift relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${isAchievement ? "bg-gradient-to-r from-[#2B2E33] to-[#7B7F85]" : "bg-gradient-to-r from-[#7B7F85] to-[#C1C4C8]"} rounded-t-lg`} />
      
      <div className="flex gap-4">
        {/* 3D Preview or Icon */}
        {previewMode === "3d" ? (
          <div className="flex-shrink-0">
            <Certificate3D isAchievement={isAchievement} color={isAchievement ? "#2B2E33" : "#7B7F85"} />
          </div>
        ) : (
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl shadow-lg flex-shrink-0 ${isAchievement ? "bg-[#2B2E33]/10 text-[#2B2E33]" : "bg-[#7B7F85]/10 text-[#7B7F85]"}`}>
            {isAchievement ? <Trophy className="w-6 h-6" /> : <Award className="w-6 h-6" />}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-bold text-[#2B2E33] tracking-tight truncate">{cert.topic_name}</h3>
            <Badge variant={isAchievement ? "success" : "brand"}>{cert.percentage}%</Badge>
          </div>
          <p className="text-xs font-semibold text-[#7B7F85] uppercase tracking-wide mb-3">
            {isAchievement ? "Certificate of Achievement" : "Certificate of Participation"}
          </p>

          <div className="space-y-1 mb-4 text-sm text-[#7B7F85]">
            <p>Score: {cert.score}/{cert.total}</p>
            <p className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Issued{" "}
              {new Date(cert.issued_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="truncate text-xs font-mono">{cert.certificate_id}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/dashboard/certificates/${cert.certificate_id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] px-3 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              View
            </Link>
            <button
              type="button"
              onClick={() => downloadCertificatePdf(cert)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2.5 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              type="button"
              onClick={handleShare}
              title="Copy share link"
              className="inline-flex items-center justify-center rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] px-3 py-2.5 text-sm font-semibold text-[#2B2E33] transition hover:bg-[#C1C4C8]/20"
            >
              {copying ? "✓" : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
