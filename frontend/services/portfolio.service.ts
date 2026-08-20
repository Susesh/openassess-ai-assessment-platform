import api from "@/services/api";
import type { CertificateItem, CertificationVerification } from "@/types/portfolio.types";

export const portfolioService = {
  async getCertificates(): Promise<CertificateItem[]> {
    const response = await api.get<CertificateItem[]>("/certifications/me");
    return response.data;
  },
  async verifyCertificate(certCode: string): Promise<CertificationVerification> {
    const response = await api.get<CertificationVerification>(`/certifications/verify/${certCode}`);
    return response.data;
  },
  async explainAnswer(question: string, correctAnswer: string, userAnswer: string) {
    const response = await api.post("/ai/explain", {
      question,
      correct_answer: correctAnswer,
      user_answer: userAnswer,
    });
    return response.data;
  },
};
