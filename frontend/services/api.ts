import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configured) {
    try {
      const parsed = new URL(configured);
      if (typeof window !== "undefined" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
        return "/api";
      }
    } catch {
      // Ignore malformed URLs and fall back to the proxy.
    }

    return configured;
  }

  if (typeof window !== "undefined") {
    return "/api";
  }

  return process.env.INTERNAL_API_URL?.trim() || "http://127.0.0.1:8000";
}

const api: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minutes timeout for AI generation calls
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("openassess_token");
    const skipAuth = config.headers?.Authorization === undefined && config.headers?.['X-Skip-Auth'] === '1';
    if (token && !skipAuth) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Only log detailed error info for non-network errors
    if (error.code !== 'ERR_NETWORK') {
      console.error("API Error:", error);
      console.error("Response data:", error.response?.data);
      console.error("Response status:", error.response?.status);
      console.error("Request config:", error.config);
    } else {
      console.warn("Network error - API request failed:", error.message);
    }
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("openassess_token");
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export default api;
