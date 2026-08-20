"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Sparkles, Trophy, Clock, Flame, Target, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    id: 1,
    icon: Zap,
    title: "Speed-Run PYQ Arena",
    description: "Timed battle mode with streaks and XP multipliers",
    color: "from-cyan-500 to-blue-500",
    features: ["⚡ 60-sec Speed Rounds", "🔥 Streak Multipliers", "🏆 Live Leaderboard"],
  },
  {
    id: 2,
    icon: Shield,
    title: "AI Proctor Zen Mode",
    description: "Clean test UI with live floating webcam PiP",
    color: "from-emerald-500 to-teal-500",
    features: ["🛡️ Distraction-Free UI", "📹 Live PiP Camera", "🤖 AI Integrity Check"],
  },
  {
    id: 3,
    icon: Sparkles,
    title: "SkillsDrome RPG Skill Tree",
    description: "Unlock nodes from Mechanics to Quantum Physics",
    color: "from-violet-500 to-purple-500",
    features: ["🌳 Interactive Skill Tree", "✨ Unlock Mastery Nodes", "📊 Progress Visualization"],
  },
  {
    id: 4,
    icon: Trophy,
    title: "EduCIBIL Integrity Passport",
    description: "Verified credential score for employers",
    color: "from-amber-500 to-orange-500",
    features: ["💳 Verified Credentials", "📈 Talent Score", "🎓 Employer Showcase"],
  },
];

export function HeroSlideboard() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-20">
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-800/50 overflow-x-auto">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-all ${
                currentSlide === index
                  ? "bg-slate-800/50 border-b-2 border-cyan-500"
                  : "hover:bg-slate-800/30"
              }`}
            >
              <slide.icon
                className={`w-5 h-5 ${
                  currentSlide === index ? "text-cyan-400" : "text-slate-400"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  currentSlide === index ? "text-white" : "text-slate-400"
                }`}
              >
                {slide.title}
              </span>
            </button>
          ))}
        </div>

        {/* Slide Content */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 p-8 md:p-12"
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Left - Visual Preview */}
                <div className="relative">
                  <div
                    className={`aspect-video bg-gradient-to-br ${slides[currentSlide].color} rounded-2xl overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4"
                        >
                          {(() => {
                            const Icon = slides[currentSlide].icon;
                            return <Icon className="w-12 h-12 text-white" />;
                          })()}
                        </motion.div>
                        <p className="text-white/80 text-sm">Interactive Preview</p>
                      </div>
                    </div>
                  </div>

                  {/* Floating Stats */}
                  <div className="absolute -bottom-4 -right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-sm text-slate-400">Active Users</div>
                        <div className="text-lg font-bold text-white">2,847</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Features */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {slides[currentSlide].title}
                    </h3>
                    <p className="text-slate-400">{slides[currentSlide].description}</p>
                  </div>

                  <div className="space-y-3">
                    {slides[currentSlide].features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
                      >
                        <Target className="w-5 h-5 text-cyan-400" />
                        <span className="text-white">{feature}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={prevSlide}
                      className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <div className="flex gap-2">
                      {slides.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentSlide === index
                              ? "bg-cyan-500 w-8"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={nextSlide}
                      className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
