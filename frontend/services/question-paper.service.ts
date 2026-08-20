import api from "./api";
import type { QuestionPaper, QuestionPaperInput } from "@/lib/types";

export const questionPaperService = {
  async getQuestionPapers(): Promise<QuestionPaper[]> {
    const response = await api.get<{ items: QuestionPaper[]; total: number }>("/question-papers");
    return response.data.items;
  },

  async getQuestionPaper(paperId: number): Promise<QuestionPaper> {
    const response = await api.get<QuestionPaper>(`/question-papers/${paperId}`);
    return response.data;
  },

  async createQuestionPaper(data: QuestionPaperInput): Promise<QuestionPaper> {
    const response = await api.post<QuestionPaper>("/question-papers", data);
    return response.data;
  },

  async updateQuestionPaper(paperId: number, data: Partial<QuestionPaperInput>): Promise<QuestionPaper> {
    const response = await api.put<QuestionPaper>(`/question-papers/${paperId}`, data);
    return response.data;
  },

  async deleteQuestionPaper(paperId: number): Promise<void> {
    await api.delete(`/question-papers/${paperId}`);
  },

  async importQuestionPaper(data: any): Promise<QuestionPaper> {
    const response = await api.post<QuestionPaper>("/question-papers/import", data);
    return response.data;
  },

  async getExamModules(): Promise<any[]> {
    const response = await api.get("/question-papers/exam-modules");
    return response.data.items;
  },

  async getExamModule(examSlug: string): Promise<any> {
    const response = await api.get(`/question-papers/exam-modules/${examSlug}`);
    return response.data;
  },
};
