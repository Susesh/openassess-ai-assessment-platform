import api from "./api";
import type { AxiosError } from "axios";

export interface LandingStats {
  total_users: number;
  total_topics: number;
  total_questions: number;
  total_attempts: number;
  total_subjects: number;
  subject_categories: Array<{
    subject: string;
    topic_count: number;
  }>;
}

export const DEFAULT_LANDING_STATS: LandingStats = {
  total_users: 0,
  total_topics: 0,
  total_questions: 0,
  total_attempts: 0,
  total_subjects: 0,
  subject_categories: [],
};

const isNetworkError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const axiosError = error as AxiosError;
  return (
    axiosError.code === "ERR_NETWORK" ||
    axiosError.code === "ECONNABORTED" ||
    axiosError.code === "ETIMEDOUT" ||
    axiosError.message?.toLowerCase().includes("network error")
  );
};

export const landingService = {
  getStats: async (): Promise<LandingStats> => {
    try {
      const response = await api.get("/landing/stats");
      const data = response.data ?? {};

      return {
        total_users: Number(data.total_users ?? 0),
        total_topics: Number(data.total_topics ?? 0),
        total_questions: Number(data.total_questions ?? 0),
        total_attempts: Number(data.total_attempts ?? 0),
        total_subjects: Number(data.total_subjects ?? 0),
        subject_categories: Array.isArray(data.subject_categories)
          ? data.subject_categories.map((item: { subject?: string; topic_count?: number }) => ({
              subject: item.subject ?? "",
              topic_count: Number(item.topic_count ?? 0),
            }))
          : [],
      };
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn("Landing stats unavailable, using fallback values.");
        return DEFAULT_LANDING_STATS;
      }

      throw error;
    }
  },
};
