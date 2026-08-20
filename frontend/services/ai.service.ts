import api from "@/services/api";

export interface GenerateAIQuestionsParams {
  topic_id: number | null;
  subtopic_id: number | null;
  subtopic_name?: string;  // NEW: Subtopic name for AI prompt
  topic_name: string;
  subject?: string;  // NEW: Subject for strict relevance enforcement
  difficulty: string;
  count: number;
  language: string;
  save_to_db: boolean;
  exam_module: string | null;
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export const aiService = {
  async generateAIQuestions(params: GenerateAIQuestionsParams): Promise<GeneratedQuestion[]> {
    const payload = {
      topic: params.topic_name,
      subject: params.subject,
      subtopic: params.subtopic_name || "",
      difficulty: params.difficulty,
      count: params.count,
      save_to_db: params.save_to_db,
      topic_id: params.topic_id,
      subtopic_id: params.subtopic_id,
      language: params.language,
      exam_module: params.exam_module,
    };
    console.log("🚀 ATTEMPTING TO REACH BACKEND AT:", { url: "/ai/generate-questions", payload });
    try {
      const response = await api.post("/ai/generate-questions", payload, {
        headers: {
          "X-Skip-Auth": "1",
        },
      });
      return response.data.questions;
    } catch (error: any) {
      console.error("❌ AXIOS ERROR DETAILS:", error.message, error.code, error.response);
      throw error;
    }
  },

  async explainAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<{ explanation: string }> {
    const response = await api.post("/ai/explain", {
      question,
      correct_answer: correctAnswer,
      user_answer: userAnswer,
    });
    return response.data;
  },
};
