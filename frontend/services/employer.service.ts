import api from "@/services/api";

export const employerService = {
  async searchStudents(query: string) {
    const response = await api.get(`/employer/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
  async getStudent(id: string) {
    const response = await api.get(`/employer/student/${id}`);
    return response.data;
  },
};
