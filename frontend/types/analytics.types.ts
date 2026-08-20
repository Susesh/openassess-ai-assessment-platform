export interface TopicProgressItem {
  topic_id: number;
  topic_name: string;
  average_score: number;
  attempts: number;
  mastered: boolean;
}

export interface AnalyticsSummary {
  total_attempts: number;
  average_score: number;
  topics_attempted: number;
  strongest_topic: string | null;
  weakest_topic: string | null;
  pass_rate: number;
  certificates_earned: number;
  topics_mastered: number;
  streak_days: number;
  weak_areas: Array<{ topic_name: string; gap: number }>;
}

export interface GapTopic {
  topic_id: number;
  topic_name: string;
  weakness_score: number;
  recommendation: string;
}
