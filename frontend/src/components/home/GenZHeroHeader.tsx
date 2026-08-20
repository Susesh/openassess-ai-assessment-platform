"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap, Briefcase, Sparkles, ArrowRight, Flame, Target, Shield, Trophy, User, Network, Hexagon, GitCommit, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";

const taglines = [
  "The AI Arcade for JEE, NEET, UPSC & Beyond",
  "Level Up Your Mastery, Beat the Clock",
  "Build an Unshakeable Talent Score",
  "Gamify Your Way to Academic Excellence",
];

export function GenZHeroHeader() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const [currentTagline, setCurrentTagline] = useState(0);

  const handleEnterArcade = () => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Mesh Gradient Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        {/* Dynamic Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 rounded-full mb-8 backdrop-blur-sm"
        >
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span className="text-sm font-medium text-white">
            10,000+ Students Gaming Their PYQs Today
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Stop Cramming.{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
            Start Conquering.
          </span>
        </motion.h1>

        {/* Specific Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto"
        >
          The ultimate gamified assessment engine for JEE, NEET, and UPSC. Master 10-years of PYQs with natively integrated Gemini AI, unlimited practice, and real-time skill tracking.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            onClick={handleEnterArcade}
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl font-semibold text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all hover:scale-105 animate-pulse"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span>Enter Assessment Arcade</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl" />
          </button>

          <Link
            href="/employer"
            className="group relative px-8 py-4 bg-slate-900/50 backdrop-blur-xl border border-white/20 rounded-2xl font-semibold text-white hover:border-white/40 hover:bg-slate-900/70 transition-all"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <span>Recruiter Portal</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>

        {/* Feature Icons Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
        >
          {[
            { 
              icon: Target, 
              label: "Speed-Run PYQ", 
              tagline: "Race Against the Clock. Master Past Papers.",
              color: "from-cyan-500 to-blue-500",
              type: "timer"
            },
            { 
              icon: Shield, 
              label: "AI Proctor Zen", 
              tagline: "Zero Distractions. Absolute Integrity.",
              color: "from-emerald-500 to-teal-500",
              type: "proctor"
            },
            { 
              icon: Sparkles, 
              label: "SkillsDrome RPG", 
              tagline: "Level Up Your Weaknesses.",
              color: "from-violet-500 to-purple-500",
              type: "skilltree"
            },
            { 
              icon: Trophy, 
              label: "EduCIBIL Score", 
              tagline: "Your Verifiable Academic Credit Score.",
              color: "from-amber-500 to-orange-500",
              type: "badge"
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 hover:border-slate-700/50 transition-all"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mx-auto mb-3`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-medium text-white mb-1">{feature.label}</p>
              <p className="text-xs text-gray-400 mb-3">{feature.tagline}</p>
              
              {/* Feature-specific visuals */}
              {feature.type === "timer" && (
                <div className="mt-3 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-cyan-400">02:45</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 text-xs">1</span>
                      </div>
                      <span className="text-gray-400">Rahul - 95%</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                        <span className="text-violet-400 text-xs">2</span>
                      </div>
                      <span className="text-gray-400">Priya - 92%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {feature.type === "proctor" && (
                <div className="mt-3 rounded-lg overflow-hidden relative">
                  <img 
                    src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=800&auto=format&fit=crop"
                    alt="Student focused on laptop"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <div className="absolute top-1 right-1 px-2 py-0.5 bg-emerald-500 rounded-full flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-white">Recording</span>
                  </div>
                </div>
              )}
              
              {feature.type === "skilltree" && (
                <div className="mt-3 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 p-3">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Network className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-4 h-0.5 bg-emerald-500" />
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Hexagon className="w-3 h-3 text-white" />
                    </div>
                    <div className="w-4 h-0.5 bg-gray-600" />
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                      <GitCommit className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                      <GitCommit className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="w-4 h-0.5 bg-gray-600" />
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                      <Network className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                </div>
              )}
              
              {feature.type === "badge" && (
                <div className="mt-3 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-3">
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-2 border border-amber-500/50">
                    <div className="flex items-center justify-between mb-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-400">98/100</span>
                    </div>
                    <div className="h-1.5 bg-amber-500/30 rounded-full overflow-hidden">
                      <div className="h-full w-[98%] bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-center">Trust Score</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
