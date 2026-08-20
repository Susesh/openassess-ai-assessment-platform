'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { Target, Clock, TrendingUp, AlertCircle, BookOpen, Lightbulb } from 'lucide-react';

interface DiagnosticDashboardProps {
  userId?: string;
}

const DiagnosticDashboard: React.FC<DiagnosticDashboardProps> = ({ userId }) => {
  const [subjectData, setSubjectData] = useState([
    { subject: 'Physics', mastery: 85, attempts: 45 },
    { subject: 'Chemistry', mastery: 72, attempts: 38 },
    { subject: 'Mathematics', mastery: 90, attempts: 52 },
    { subject: 'Biology', mastery: 65, attempts: 28 },
    { subject: 'Hindi', mastery: 78, attempts: 35 },
    { subject: 'Kannada', mastery: 82, attempts: 40 },
    { subject: 'General Studies', mastery: 70, attempts: 33 },
  ]);

  const [activityData, setActivityData] = useState(() => {
    const data = [];
    const today = new Date();
    for (let week = 0; week < 52; week++) {
      const weekDate = new Date(today);
      weekDate.setDate(today.getDate() - (51 - week) * 7);
      
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekDate);
        dayDate.setDate(weekDate.getDate() + day);
        
        const activity = Math.floor(Math.random() * 5);
        data.push({
          date: dayDate.toISOString().split('T')[0],
          activity,
          attempts: activity * Math.floor(Math.random() * 3) + 1,
        });
      }
    }
    return data;
  });

  const [metrics, setMetrics] = useState({
    avgResponseTime: 45,
    accuracyRate: 78,
    weakAreas: ['Optics - Refraction', 'Organic Chemistry', 'Genetics'],
    strongAreas: ['Calculus', 'Newton\'s Laws', 'Algebra'],
  });

  const [recommendations, setRecommendations] = useState([
    {
      type: 'weakness',
      icon: AlertCircle,
      title: 'Focus on Optics',
      description: 'Based on your recent Physics quiz, you should revise "Optics - Refraction" today.',
      priority: 'high',
    },
    {
      type: 'strength',
      icon: TrendingUp,
      title: 'Build on Calculus',
      description: 'Great performance in Calculus! Try advanced integration problems next.',
      priority: 'medium',
    },
    {
      type: 'consistency',
      icon: Clock,
      title: 'Maintain Streak',
      description: 'You\'re on a 7-day streak! Complete one more quiz today to keep it going.',
      priority: 'low',
    },
  ]);

  const getActivityColor = (activity: number) => {
    switch (activity) {
      case 0: return 'bg-[#C1C4C8]/20';
      case 1: return 'bg-[#C1C4C8]/50';
      case 2: return 'bg-[#7B7F85]';
      case 3: return 'bg-[#2B2E33]/70';
      case 4: return 'bg-[#2B2E33]';
      default: return 'bg-[#C1C4C8]/20';
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 75) return '#2B2E33';
    return '#7B7F85';
  };

  return (
    <div className="min-h-screen bg-[#F5F6F7] p-6 text-[#2B2E33]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6 max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2B2E33] mb-2">Diagnostic Analytics</h1>
            <p className="text-[#7B7F85]">Track your learning progress and identify areas for improvement</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#2B2E33] text-[#F5F6F7] rounded-lg font-medium hover:bg-[#2B2E33]/90 transition-colors">
              Last 7 Days
            </button>
            <button className="px-4 py-2 bg-[#F5F6F7] text-[#7B7F85] rounded-lg border border-[#C1C4C8] hover:text-[#2B2E33] transition-colors">
              Last 30 Days
            </button>
          </div>
        </div>

        {/* AI Study Recommendations Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
        >
          <div className="flex items-center gap-3 mb-4">
            <Lightbulb className="w-6 h-6 text-[#2B2E33]" />
            <h2 className="text-xl font-bold text-[#2B2E33]">AI Study Recommendations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => {
              const Icon = rec.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7]"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-1 text-[#2B2E33]" />
                    <div>
                      <h3 className="font-semibold text-[#2B2E33] mb-1">{rec.title}</h3>
                      <p className="text-sm text-[#7B7F85]">{rec.description}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Speed Metric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-[#2B2E33]" />
                <h3 className="font-semibold text-[#2B2E33]">Avg Response Time</h3>
              </div>
              <span className="text-2xl font-bold text-[#2B2E33]">{metrics.avgResponseTime}s</span>
            </div>
            <div className="h-2 bg-[#C1C4C8]/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="h-full bg-[#2B2E33] rounded-full"
              />
            </div>
            <p className="text-xs text-[#7B7F85] mt-2">65% faster than average</p>
          </motion.div>

          {/* Accuracy Metric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-[#2B2E33]" />
                <h3 className="font-semibold text-[#2B2E33]">Accuracy Rate</h3>
              </div>
              <span className="text-2xl font-bold text-[#2B2E33]">{metrics.accuracyRate}%</span>
            </div>
            <div className="h-2 bg-[#C1C4C8]/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metrics.accuracyRate}%` }}
                className="h-full bg-[#2B2E33] rounded-full"
              />
            </div>
            <p className="text-xs text-[#7B7F85] mt-2">Top 15% accuracy rate</p>
          </motion.div>

          {/* Weak Areas Metric */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-[#7B7F85]" />
              <h3 className="font-semibold text-[#2B2E33]">Weak Areas</h3>
            </div>
            <div className="space-y-2">
              {metrics.weakAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7B7F85]" />
                  <span className="text-sm text-[#7B7F85]">{area}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Mastery Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
          >
            <h3 className="text-xl font-bold text-[#2B2E33] mb-6 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2B2E33]" />
              Subject Mastery
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={subjectData}>
                <PolarGrid stroke="#C1C4C8" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7B7F85', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#7B7F85' }} />
                <Radar
                  name="Mastery"
                  dataKey="mastery"
                  stroke="#2B2E33"
                  fill="#2B2E33"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Activity Heatmap */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
          >
            <h3 className="text-xl font-bold text-[#2B2E33] mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#2B2E33]" />
              Activity Heatmap (52 Weeks)
            </h3>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-52 gap-1 min-w-[800px]">
                {activityData.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.001 }}
                    className={`w-3 h-3 rounded-sm ${getActivityColor(day.activity)} cursor-pointer hover:ring-2 hover:ring-[#2B2E33] transition-all`}
                    title={`${day.date}: ${day.attempts} attempts`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-[#7B7F85]">Less</span>
              <div className="w-3 h-3 rounded-sm bg-[#C1C4C8]/20" />
              <div className="w-3 h-3 rounded-sm bg-[#C1C4C8]/50" />
              <div className="w-3 h-3 rounded-sm bg-[#7B7F85]" />
              <div className="w-3 h-3 rounded-sm bg-[#2B2E33]/70" />
              <div className="w-3 h-3 rounded-sm bg-[#2B2E33]" />
              <span className="text-xs text-[#7B7F85]">More</span>
            </div>
          </motion.div>
        </div>

        {/* Subject Performance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#F5F6F7] rounded-2xl p-6 border border-[#C1C4C8]"
        >
          <h3 className="text-xl font-bold text-[#2B2E33] mb-6">Subject Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#C1C4C8" />
              <XAxis dataKey="subject" tick={{ fill: '#7B7F85' }} />
              <YAxis tick={{ fill: '#7B7F85' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#F5F6F7',
                  border: '1px solid #C1C4C8',
                  borderRadius: '8px',
                  color: '#2B2E33',
                }}
              />
              <Legend />
              <Bar dataKey="mastery" name="Mastery %" radius={[4, 4, 0, 0]}>
                {subjectData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getMasteryColor(entry.mastery)} />
                ))}
              </Bar>
              <Bar dataKey="attempts" name="Attempts" fill="#7B7F85" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DiagnosticDashboard;

