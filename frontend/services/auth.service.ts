import api from "@/services/api";
import type { AuthResponse, User } from "@/types/user.types";

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    const response = await api.post<AuthResponse>("/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
  async register(name: string, email: string, password: string, role: string = "student"): Promise<User> {
    console.log("Register request data:", { full_name: name, email, password, role });
    const response = await api.post<User>("/auth/register", { full_name: name, email, password, role });
    console.log("Register response:", response.data);
    return response.data;
  },
  async getMe(): Promise<User> {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },
};
