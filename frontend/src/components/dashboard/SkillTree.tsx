'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Trophy, Lock, Play, CheckCircle, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SkillNode {
  id: string;
  title: string;
  subject: string;
  status: 'locked' | 'in-progress' | 'mastered';
  xpReward: number;
  position: { x: number; y: number };
}

interface SkillTreeProps {
  onNodeClick?: (nodeId: string) => void;
}

const SkillTree: React.FC<SkillTreeProps> = ({ onNodeClick }) => {
  const [streak, setStreak] = useState(7);
  const [xp, setXp] = useState(1250);
  const [rank, setRank] = useState('Top 5%');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  // Sample skill tree data - in production, this would come from API
  const skillNodes: SkillNode[] = [
    { id: '1', title: 'Physics Basics', subject: 'Physics', status: 'mastered', xpReward: 100, position: { x: 10, y: 20 } },
    { id: '2', title: 'Newton\'s Laws', subject: 'Physics', status: 'mastered', xpReward: 150, position: { x: 30, y: 15 } },
    { id: '3', title: 'Optics', subject: 'Physics', status: 'in-progress', xpReward: 200, position: { x: 50, y: 25 } },
    { id: '4', title: 'Thermodynamics', subject: 'Physics', status: 'locked', xpReward: 250, position: { x: 70, y: 20 } },
    { id: '5', title: 'Chemistry Basics', subject: 'Chemistry', status: 'mastered', xpReward: 100, position: { x: 15, y: 45 } },
    { id: '6', title: 'Organic Chemistry', subject: 'Chemistry', status: 'in-progress', xpReward: 200, position: { x: 35, y: 55 } },
    { id: '7', title: 'Periodic Table', subject: 'Chemistry', status: 'locked', xpReward: 150, position: { x: 55, y: 45 } },
    { id: '8', title: 'Mathematics', subject: 'Mathematics', status: 'mastered', xpReward: 100, position: { x: 20, y: 75 } },
    { id: '9', title: 'Calculus', subject: 'Mathematics', status: 'in-progress', xpReward: 250, position: { x: 40, y: 80 } },
    { id: '10', title: 'Statistics', subject: 'Mathematics', status: 'locked', xpReward: 200, position: { x: 60, y: 70 } },
    { id: '11', title: 'Biology Basics', subject: 'Biology', status: 'locked', xpReward: 100, position: { x: 75, y: 55 } },
    { id: '12', title: 'Genetics', subject: 'Biology', status: 'locked', xpReward: 200, position: { x: 85, y: 75 } },
  ];

  const triggerConfetti = () => {
    setCelebrating(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    });
    setTimeout(() => setCelebrating(false), 3000);
  };

  const handleNodeClick = (node: SkillNode) => {
    if (node.status === 'locked') return;
    
    setSelectedNode(node.id);
    if (onNodeClick) {
      onNodeClick(node.id);
    }
    
    // Trigger confetti for mastered nodes
    if (node.status === 'mastered') {
      triggerConfetti();
    }
  };

  const getNodeStyle = (status: SkillNode['status']) => {
    switch (status) {
      case 'locked':
        return 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed';
      case 'in-progress':
        return 'bg-slate-900 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]';
      case 'mastered':
        return 'bg-slate-900 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]';
      default:
        return '';
    }
  };

  const getNodeIcon = (status: SkillNode['status']) => {
    switch (status) {
      case 'locked':
        return <Lock className="w-4 h-4 text-gray-500" />;
      case 'in-progress':
        return <Play className="w-4 h-4 text-blue-400" />;
      case 'mastered':
        return <CheckCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Gamification Header Bar */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-slate-700/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Streak Counter */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-orange-500/20 rounded-xl px-4 py-2 border border-orange-500/30"
            >
              <Flame className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-xs text-orange-300 font-medium">Day Streak</p>
                <p className="text-xl font-bold text-orange-400">{streak}</p>
              </div>
            </motion.div>

            {/* XP Counter */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-blue-500/20 rounded-xl px-4 py-2 border border-blue-500/30"
            >
              <Zap className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-xs text-blue-300 font-medium">Total XP</p>
                <p className="text-xl font-bold text-blue-400">{xp.toLocaleString()}</p>
              </div>
            </motion.div>

            {/* Global Rank Badge */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 bg-yellow-500/20 rounded-xl px-4 py-2 border border-yellow-500/30"
            >
              <Trophy className="w-6 h-6 text-yellow-400" />
              <div>
                <p className="text-xs text-yellow-300 font-medium">Global Rank</p>
                <p className="text-xl font-bold text-yellow-400">{rank}</p>
              </div>
            </motion.div>
          </div>

          {/* Level Progress */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">Level 12</p>
              <p className="text-xs text-slate-400">2,500 / 3,000 XP</p>
            </div>
            <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '83%' }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skill Tree Visualization */}
      <div className="relative bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 min-h-[600px]">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400" />
          Learning Path
        </h2>

        {/* Horizontal Scrollable Learning Path */}
        <div className="flex items-center gap-8 overflow-x-auto py-8 px-6 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
          {skillNodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-8 flex-shrink-0">
              {/* Node Card */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                whileHover={{ scale: node.status !== 'locked' ? 1.05 : 1 }}
                whileTap={{ scale: node.status !== 'locked' ? 0.95 : 1 }}
                onClick={() => handleNodeClick(node)}
                className={`min-w-[140px] rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all duration-300 ${getNodeStyle(node.status)}`}
              >
                {getNodeIcon(node.status)}
                <span className="text-sm font-bold text-white text-center px-1 leading-tight">
                  {node.title}
                </span>
                <span className="text-xs text-slate-300">
                  +{node.xpReward} XP
                </span>
                
                {/* Glow effect for in-progress nodes */}
                {node.status === 'in-progress' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
                
                {/* Star effect for mastered nodes */}
                {node.status === 'mastered' && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </motion.div>
              
              {/* Connector Line */}
              {index < skillNodes.length - 1 && (
                <div className={`h-[2px] w-12 ${skillNodes[index].status === 'mastered' ? 'bg-gradient-to-r from-emerald-500 to-slate-700' : skillNodes[index].status === 'in-progress' ? 'bg-gradient-to-r from-cyan-500 to-slate-700' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex gap-4 bg-slate-900/80 backdrop-blur-lg rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <span className="text-xs text-slate-300">Mastered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
            <span className="text-xs text-slate-300">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
            <span className="text-xs text-slate-300">Locked</span>
          </div>
        </div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SkillTree;
