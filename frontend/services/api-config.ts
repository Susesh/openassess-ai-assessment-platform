/**
 * Resolves the backend API base URL dynamically based on the current environment and hostname.
 */
export const getApiBaseUrl = (): string => {
  // 1. If explicit environment variable is defined, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Client-side browser execution: match current browser hostname (e.g., 192.168.29.56)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }

  // 3. Fallback for Server-Side Rendering (SSR)
  return "http://localhost:8000";
};

/**
 * Universal fetch wrapper for OpenAssess backend API calls
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Request failed with status ${response.status}`);
  }

  return response.json();
}
