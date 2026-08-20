import api from "@/services/api";
import type { QuizAttemptSummary, QuizQuestion, QuizSubmissionPayload } from "@/types/quiz.types";

export const quizService = {
  async getTopics() {
    try {
      const response = await api.get("/questions/topics");
      return response.data;
    } catch (error) {
      console.warn("Failed to fetch topics:", error);
      return [];
    }
  },
  async getQuestions(topicId: string, difficulty = "medium", limit = 10): Promise<QuizQuestion[]> {
    const response = await api.get<QuizQuestion[]>("/questions/", {
      params: { topic_id: topicId, difficulty, limit },
    });
    return response.data;
  },
  async submit(payload: QuizSubmissionPayload) {
    const normalizedPayload = {
      attempt_id: payload.attempt_id,
      answers: (payload.answers ?? []).map((answer) => ({
        question_id: Number(answer.question_id),
        selected_option: answer.selected_option,
        time_spent_seconds: typeof (payload as any).time_taken === "number" ? (payload as any).time_taken : 0,
      })),
      submission_reason: (payload as any).submission_reason ?? "manual",
    };
    const response = await api.post("/quiz/submit", normalizedPayload);
    return response.data;
  },
  async getHistory(): Promise<QuizAttemptSummary[]> {
    const response = await api.get<QuizAttemptSummary[]>("/quiz/history");
    return response.data;
  },
  async getAdaptiveDifficulty(topicId: string) {
    const response = await api.get(`/quiz/adaptive-difficulty/${topicId}`);
    return response.data;
  },
  async adaptiveAdjustment(attemptId: number, currentDifficulty: string, answeredQuestions: Record<number, boolean>) {
    const response = await api.post("/quiz/adaptive-adjustment", {
      attempt_id: attemptId,
      current_difficulty: currentDifficulty,
      answered_questions: answeredQuestions,
    });
    return response.data;
  },
};
