"use client";

import { useState } from "react";
import { Play, BookOpen, Target, CheckCircle, AlertCircle, TrendingUp, ArrowRight } from "lucide-react";

interface Gap {
  concept: string;
  missedQuestions: number;
  totalQuestions: number;
  severity: "high" | "medium" | "low";
  recommendedVideo: {
    title: string;
    duration: string;
    thumbnail: string;
    url: string;
  };
}

interface GapAnalysisProps {
  gaps: Gap[];
  overallScore: number;
  onVideoSelect?: (videoUrl: string) => void;
}

export function GapAnalysis({ gaps, overallScore, onVideoSelect }: GapAnalysisProps) {
  const [selectedGap, setSelectedGap] = useState<Gap | null>(gaps[0] || null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <Target className="w-4 h-4" />;
      case "low":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Assessment Gap Analysis</h1>
            <p className="text-slate-400">Actionable insights to improve your performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-slate-400">Overall Score</div>
              <div className="text-3xl font-bold text-white">{overallScore}%</div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Critical Gaps</div>
                <div className="text-xl font-bold text-white">
                  {gaps.filter((g) => g.severity === "high").length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Areas to Improve</div>
                <div className="text-xl font-bold text-white">
                  {gaps.filter((g) => g.severity === "medium").length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-sm text-slate-400">Quick Wins</div>
                <div className="text-xl font-bold text-white">
                  {gaps.filter((g) => g.severity === "low").length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Split Screen View */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Gap List */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800/50">
            <h2 className="text-lg font-semibold text-white">Identified Knowledge Gaps</h2>
            <p className="text-sm text-slate-400 mt-1">Select a gap to view recommended remediation</p>
          </div>
          
          <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto">
            {gaps.map((gap, index) => (
              <div
                key={index}
                onClick={() => setSelectedGap(gap)}
                className={`p-4 cursor-pointer transition-colors ${
                  selectedGap === gap
                    ? "bg-indigo-500/10 border-l-4 border-indigo-500"
                    : "hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(
                          gap.severity
                        )}`}
                      >
                        {getSeverityIcon(gap.severity)}
                        <span className="ml-1 capitalize">{gap.severity}</span>
                      </span>
                    </div>
                    <h3 className="font-medium text-white">{gap.concept}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">
                      {gap.missedQuestions}/{gap.totalQuestions} missed
                    </div>
                    <div className="text-xs text-slate-500">
                      {Math.round((gap.missedQuestions / gap.totalQuestions) * 100)}% error rate
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Recommended Video */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl overflow-hidden">
          {selectedGap ? (
            <>
              <div className="px-6 py-4 border-b border-slate-800/50">
                <h2 className="text-lg font-semibold text-white">Recommended Remediation</h2>
                <p className="text-sm text-slate-400 mt-1">
                  SkillsDrome video to master: {selectedGap.concept}
                </p>
              </div>

              <div className="p-6">
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden mb-6 group cursor-pointer">
                  <img
                    src={selectedGap.recommendedVideo.thumbnail}
                    alt={selectedGap.recommendedVideo.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs text-white">
                    {selectedGap.recommendedVideo.duration}
                  </div>
                </div>

                {/* Video Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {selectedGap.recommendedVideo.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      This video covers the fundamental concepts you missed in the assessment.
                      Watch it to strengthen your understanding of {selectedGap.concept}.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={() => onVideoSelect?.(selectedGap.recommendedVideo.url)}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      Watch Now
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors">
                      <BookOpen className="w-4 h-4" />
                      Add to Study Plan
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Resources */}
              <div className="px-6 py-4 border-t border-slate-800/50 bg-slate-800/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Target className="w-4 h-4" />
                    <span>Target mastery: 85%+</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-indigo-400">
                    <span>Practice questions available</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a knowledge gap to view recommended remediation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
