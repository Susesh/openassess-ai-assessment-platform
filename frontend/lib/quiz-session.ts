import type { StoredQuizSession } from "./types";

const SESSION_KEY = "openassess_quiz_result";

export function saveQuizSession(session: StoredQuizSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadQuizSession(): StoredQuizSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredQuizSession;
  } catch {
    return null;
  }
}

export function clearQuizSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
