import api from "@/services/api";
import type { AnalyticsSummary, GapTopic, TopicProgressItem } from "@/types/analytics.types";

export const analyticsService = {
  async getSummary(): Promise<AnalyticsSummary> {
    try {
      const response = await api.get<AnalyticsSummary>("/analytics/summary");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch analytics summary:", error);
      return {
        total_attempts: 0,
        average_score: 0,
        topics_attempted: 0,
        strongest_topic: null,
        weakest_topic: null,
        pass_rate: 0,
        certificates_earned: 0,
        topics_mastered: 0,
        weak_areas: [],
        streak_days: 0,
      } as AnalyticsSummary;
    }
  },
  async getTopicProgress(): Promise<TopicProgressItem[]> {
    try {
      const response = await api.get<TopicProgressItem[]>("/analytics/topic-progress");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch topic progress:", error);
      return [];
    }
  },
  async getGaps(): Promise<GapTopic[]> {
    try {
      const response = await api.get<GapTopic[]>("/analytics/gaps");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch gaps:", error);
      return [];
    }
  },
  async getRecentAttempt(): Promise<any> {
    try {
      const response = await api.get("/analytics/recent-attempt");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch recent attempt:", error);
      return null;
    }
  },
};
