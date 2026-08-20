"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface Insight {
  id: string;
  type: "recommendation" | "prediction" | " warning" | "success";
  title: string;
  description: string;
  actionable: boolean;
  confidence: number;
  timestamp: Date;
  category: "learning" | "performance" | "engagement" | "collaboration";
}

interface AIInsightsState {
  insights: Insight[];
  isProcessing: boolean;
  lastUpdate: Date | null;
}

interface AIInsightsContextType {
  insights: Insight[];
  isProcessing: boolean;
  generateInsights: (data: any) => Promise<void>;
  dismissInsight: (insightId: string) => void;
  actOnInsight: (insightId: string) => void;
  getInsightsByCategory: (category: Insight["category"]) => Insight[];
}

const AIInsightsContext = createContext<AIInsightsContextType | undefined>(undefined);

export function AIInsightsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AIInsightsState>({
    insights: [],
    isProcessing: false,
    lastUpdate: null,
  });

  // Generate AI-powered insights from data
  const generateInsights = useCallback(async (data: any) => {
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newInsights: Insight[] = [];

      // Learning insights
      if (data.performance) {
        const { averageScore, topicsAttempted, streakDays } = data.performance;
        
        if (averageScore < 70) {
          newInsights.push({
            id: `insight-${Date.now()}-1`,
            type: " warning",
            title: "Performance Alert",
            description: `Your average score of ${averageScore}% is below target. Focus on weak areas to improve.`,
            actionable: true,
            confidence: 0.85,
            timestamp: new Date(),
            category: "learning",
          });
        } else if (averageScore > 85) {
          newInsights.push({
            id: `insight-${Date.now()}-2`,
            type: "success",
            title: "Excellent Performance",
            description: `Your average score of ${averageScore}% is outstanding. Consider tackling advanced topics.`,
            actionable: true,
            confidence: 0.92,
            timestamp: new Date(),
            category: "learning",
          });
        }

        if (streakDays > 5) {
          newInsights.push({
            id: `insight-${Date.now()}-3`,
            type: "success",
            title: "Great Streak!",
            description: `You've maintained a ${streakDays}-day learning streak. Keep it up!`,
            actionable: false,
            confidence: 1.0,
            timestamp: new Date(),
            category: "engagement",
          });
        }
      }

      // Predictive insights
      if (data.topics) {
        const weakTopics = data.topics.filter((t: any) => t.averageScore < 60);
        if (weakTopics.length > 0) {
          newInsights.push({
            id: `insight-${Date.now()}-4`,
            type: "recommendation",
            title: "Focus Areas Identified",
            description: `Based on your performance, prioritize: ${weakTopics.slice(0, 3).map((t: any) => t.name).join(", ")}`,
            actionable: true,
            confidence: 0.78,
            timestamp: new Date(),
            category: "learning",
          });
        }
      }

      // Engagement insights
      if (data.activity) {
        const { sessionsThisWeek, avgSessionDuration } = data.activity;
        if (sessionsThisWeek < 3) {
          newInsights.push({
            id: `insight-${Date.now()}-5`,
            type: "recommendation",
            title: "Increase Learning Frequency",
            description: "Consistent practice improves retention. Aim for at least 3 sessions per week.",
            actionable: true,
            confidence: 0.88,
            timestamp: new Date(),
            category: "engagement",
          });
        }
      }

      setState(prev => ({
        ...prev,
        insights: [...newInsights, ...prev.insights].slice(0, 20), // Keep last 20 insights
        isProcessing: false,
        lastUpdate: new Date(),
      }));
    } catch (error) {
      console.error("Error generating insights:", error);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []);

  // Dismiss an insight
  const dismissInsight = useCallback((insightId: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.filter(i => i.id !== insightId),
    }));
  }, []);

  // Act on an insight
  const actOnInsight = useCallback((insightId: string) => {
    setState(prev => ({
      ...prev,
      insights: prev.insights.map(i =>
        i.id === insightId ? { ...i, actionable: false } : i
      ),
    }));
  }, []);

  // Get insights by category
  const getInsightsByCategory = useCallback((category: Insight["category"]) => {
    return state.insights.filter(i => i.category === category);
  }, [state.insights]);

  // Auto-generate insights periodically - only on dashboard
  useEffect(() => {
    // Only run insights generation on dashboard pages
    if (typeof window === 'undefined' || !window.location.pathname.includes('/dashboard')) {
      return;
    }
    
    const interval = setInterval(() => {
      // In production, this would fetch actual data
      const mockData = {
        performance: {
          averageScore: Math.random() * 40 + 60,
          topicsAttempted: Math.floor(Math.random() * 10) + 5,
          streakDays: Math.floor(Math.random() * 10),
        },
        topics: Array.from({ length: 5 }, (_, i) => ({
          name: `Topic ${i + 1}`,
          averageScore: Math.random() * 100,
        })),
        activity: {
          sessionsThisWeek: Math.floor(Math.random() * 5),
          avgSessionDuration: Math.random() * 60 + 30,
        },
      };
      generateInsights(mockData);
    }, 60000); // Reduced to every 60 seconds

    return () => clearInterval(interval);
  }, [generateInsights]);

  const value: AIInsightsContextType = {
    insights: state.insights,
    isProcessing: state.isProcessing,
    generateInsights,
    dismissInsight,
    actOnInsight,
    getInsightsByCategory,
  };

  return (
    <AIInsightsContext.Provider value={value}>
      {children}
    </AIInsightsContext.Provider>
  );
}

export function useAIInsights() {
  const context = useContext(AIInsightsContext);
  if (context === undefined) {
    throw new Error("useAIInsights must be used within an AIInsightsProvider");
  }
  return context;
}
