"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Target, Trophy, CheckCircle, Lock, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { analyticsService } from "@/services/analytics.service";
import type { AnalyticsSummary } from "@/types/analytics.types";

const dailyQuests = [
  { id: 1, title: "Solve 5 Physics PYQs", progress: 3, total: 5, completed: false, xp: 100 },
  { id: 2, title: "Maintain 80%+ Accuracy in Chemistry", progress: 1, total: 1, completed: true, xp: 150 },
  { id: 3, title: "Complete 1 Proctored Speed-Run", progress: 0, total: 1, completed: false, xp: 200 },
];

const leaderboardData = [
  { name: "Arjun_K", badge: "🏆", xp: 15420, gain: "+250" },
  { name: "Priya_S", badge: "⚡", xp: 14890, gain: "+180" },
  { name: "Rahul_M", badge: "🎯", xp: 14230, gain: "+320" },
  { name: "Sneha_P", badge: "🔥", xp: 13850, gain: "+210" },
  { name: "Vikram_R", badge: "⭐", xp: 13400, gain: "+190" },
];

// Calculate level based on XP (every 1000 XP = 1 level)
function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

// Calculate streak based on consecutive days with attempts
function calculateStreak(attempts: number): number {
  // Simplified: 1 streak per 5 attempts (real implementation would use actual dates)
  return Math.floor(attempts / 5);
}

export function DuolingoGamificationBar() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [maxXP] = useState(5000);
  const [level, setLevel] = useState(1);
  const [leaderboardIndex, setLeaderboardIndex] = useState(0);

  useEffect(() => {
    // Load real user analytics data
    analyticsService.getSummary()
      .then((data) => {
        setSummary(data);
        // Calculate real gamification stats from actual user data
        const calculatedXP = data.total_attempts * 50 + (data.average_score * 10);
        setCurrentXP(calculatedXP);
        setLevel(calculateLevel(calculatedXP));
        setStreakCount(calculateStreak(data.total_attempts));
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
        // Fallback to zero values if API fails
        setCurrentXP(0);
        setLevel(1);
        setStreakCount(0);
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboardIndex((prev) => (prev + 1) % leaderboardData.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-[#F5F6F7]/90 backdrop-blur-xl border-b border-[#C1C4C8]/50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Streak Counter */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl"
          >
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            <div>
              <div className="text-xs text-orange-600 font-medium">{streakCount}-Day Streak!</div>
              <div className="text-xs text-[#5B6168]">Don't let it freeze</div>
            </div>
          </motion.div>

          {/* XP Bar */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-medium text-[#2B2E33]">Level {level} Scholar</span>
              </div>
              <span className="text-xs text-[#5B6168]">
                {currentXP.toLocaleString()} / {maxXP.toLocaleString()} XP
              </span>
            </div>
            <div className="h-2 bg-[#E9E9EB] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(currentXP / maxXP) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Daily Quests */}
          <div className="hidden md:flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            <div className="flex gap-1">
              {dailyQuests.slice(0, 3).map((quest) => (
                <div
                  key={quest.id}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    quest.completed
                      ? "bg-emerald-500/10 border border-emerald-500/30"
                      : "bg-[#E9E9EB]/50 border border-[#C1C4C8]/50"
                  }`}
                  title={`${quest.title} (${quest.progress}/${quest.total})`}
                >
                  {quest.completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-xs text-[#5B6168]">{quest.progress}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Leaderboard Ticker */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#E9E9EB]/50 border border-[#C1C4C8]/50 rounded-xl overflow-hidden">
            <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div className="w-32 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={leaderboardIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-[#2B2E33]">
                    {leaderboardData[leaderboardIndex].name}
                  </span>
                  <span className="text-xs text-[#5B6168]">
                    {leaderboardData[leaderboardIndex].badge}
                  </span>
                  <span className="text-xs text-emerald-600">
                    {leaderboardData[leaderboardIndex].gain}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Expand Button */}
          <button className="p-2 hover:bg-[#E9E9EB] rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-[#7B7F85]" />
          </button>
        </div>
      </div>
    </div>
  );
}
