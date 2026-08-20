import api from "@/services/api";

export const remediationService = {
  async getTutorRecommendations(attemptId: number) {
    const response = await api.get(`/remediation/tutor-recommendations/${attemptId}`);
    return response.data;
  },
  
  async bookRemedialClass(attemptId: number, tutorId: number, scheduledAt: string) {
    const response = await api.post("/remediation/book-class", {
      attempt_id: attemptId,
      tutor_id: tutorId,
      scheduled_at: scheduledAt,
    });
    return response.data;
  },
  
  async autoScheduleRemedial(attemptId: number) {
    const response = await api.post(`/remediation/auto-schedule/${attemptId}`);
    return response.data;
  },
};
