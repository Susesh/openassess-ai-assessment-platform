import { getToken } from "./auth";
import type {
  AdminProctoringReportResponse,
  AdminTopicsResponse,
  AdminUsersResponse,
  AIProctoringSession,
  AIViolation,
  AnalyticsSummary,
  Certificate,
  Certification,
  ExamModule,
  ExamModuleDetail,
  ExamModuleListResponse,
  ExamCriteria,
  ExamCriteriaInput,
  ExamCriteriaListResponse,
  GeneratedQuestion,
  HeatmapItem,
  QuestionPaper,
  QuestionPaperInput,
  QuestionPaperListResponse,
  QuestionPaperQuizInput,
  PortfolioData,
  PortfolioUpdate,
  ProctoringEventType,
  ProctoringLogResponse,
  ProctoringReport,
  ProctoringSeverity,
  QuizQuestion,
  QuizResult,
  QuizStartResponse,
  QuizStatus,
  QuizResumeResponse,
  QuizAutosaveResponse,
  RemediationHistory,
  RemediationPlan,
  ResultSummary,
  TokenResponse,
  Topic,
  TutorAvailability,
  TutorProfile,
  TutorSession,
  User,
  VideoRecording,
} from "./types";

function resolveApiUrl(): string {
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (publicApiUrl) {
    const normalizedPublicUrl = publicApiUrl.replace(/\/$/, "");

    // If the env points to localhost, always use the Next dev-server proxy (`/api`)
    // to avoid CORS issues. The proxy will forward requests to the backend.
    if (typeof window !== "undefined") {
      try {
        const parsed = new URL(normalizedPublicUrl);
        const isEnvLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

        if (isEnvLocalHost) {
          return `/api`;
        }
      } catch {
        // Ignore malformed URL and fall through to use provided env value.
      }
    }

    return normalizedPublicUrl;
  }

  if (typeof window !== "undefined") {
    // In dev, prefer a relative `/api` proxy to avoid CORS issues.
    return `/api`;
  }

  const internalApiUrl = process.env.INTERNAL_API_URL?.trim();
  if (internalApiUrl) {
    return internalApiUrl.replace(/\/$/, "");
  }

  return "http://127.0.0.1:8000";
}

export const API_URL = resolveApiUrl();

const BACKEND_UNREACHABLE =
  "Cannot reach the backend API. Make sure it is running at " + API_URL;

function fallbackLoopbackUrl(input: RequestInfo | URL): string | null {
  const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : null;
  if (!raw) return null;

  if (raw.includes("://localhost:8000")) {
    return raw.replace("://localhost:8000", "://127.0.0.1:8000");
  }

  if (raw.includes("://127.0.0.1:8000")) {
    return raw.replace("://127.0.0.1:8000", "://localhost:8000");
  }

  return null;
}

async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch {
    const fallback = fallbackLoopbackUrl(input);
    if (fallback) {
      try {
        return await fetch(fallback, init);
      } catch {
        // Ignore and throw standard API unreachable error below.
      }
    }

    throw new ApiError(0, BACKEND_UNREACHABLE);
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg ?? "Error").join(", ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  const shouldKeepAlive = Boolean(init.body) && init.keepalive !== false;

  if (init.body && !(init.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // DEBUG: log outgoing request URL and auth header for troubleshooting.
  // This logs before the network call so we can see headers even if fetch fails.
  try {
    // eslint-disable-next-line no-console
    console.log("API request", {
      url: `${API_URL}${path}`,
      method: init.method ?? "GET",
      authorization: headers.get("Authorization"),
    });
  } catch {
    /* ignore */
  }

  const res = await safeFetch(`${API_URL}${path}`, { ...init, headers, keepalive: shouldKeepAlive });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);

  const res = await safeFetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  return res.json();
}

export async function register(
  fullName: string,
  email: string,
  password: string,
  role = "student"
): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
      role,
    }),
  });
}

export async function getMe(): Promise<User> {
  return request<User>("/auth/me");
}

export async function getTopics(): Promise<Topic[]> {
  return request<Topic[]>("/topics");
}

export async function getTopic(topicId: number): Promise<Topic> {
  return request<Topic>(`/topics/${topicId}`);
}

export async function getTopicDetails(topicId: number): Promise<Topic> {
  return getTopic(topicId);
}

export async function startQuiz(
  topicId: number,
  numQuestions = 10
): Promise<QuizStartResponse> {
  return request<QuizStartResponse>("/quiz/start", {
    method: "POST",
    body: JSON.stringify({
      topic_id: topicId,
      num_questions: numQuestions,
    }),
  });
}

export async function startCriteriaQuiz(
  examCriteriaId: number,
  numQuestions?: number
): Promise<QuizStartResponse> {
  const body: Record<string, unknown> = { exam_criteria_id: examCriteriaId };
  if (typeof numQuestions === "number") body.num_questions = numQuestions;
  return request<QuizStartResponse>("/quiz/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function startPaperQuiz(data: QuestionPaperQuizInput, numQuestions?: number): Promise<QuizStartResponse> {
  const body: Record<string, unknown> = {
    paper_id: data.paperId,
    topic_id: data.topicId ?? null,
    subtopic_id: data.subtopicId ?? null,
  };
  if (typeof numQuestions === "number") body.num_questions = numQuestions;
  return request<QuizStartResponse>("/quiz/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function submitQuiz(
  attemptId: number,
  answers: {
    question_id: number;
    selected_option: string | null;
    time_spent_seconds?: number;
  }[],
  submissionReason: "manual" | "timeout" | "proctoring_auto_submit" = "manual"
): Promise<QuizResult> {
  return request<QuizResult>("/quiz/submit", {
    method: "POST",
    body: JSON.stringify({
      attempt_id: attemptId,
      answers,
      submission_reason: submissionReason,
    }),
  });
}

export async function autosaveQuiz(
  attemptId: number,
  answers: {
    question_id: number;
    selected_option: string | null;
    time_spent_seconds?: number;
  }[],
  currentQuestionId?: number,
  questionStatus?: Record<string, string>,
  markedForReview?: number[]
): Promise<QuizAutosaveResponse> {
  return request<QuizAutosaveResponse>("/quiz/autosave", {
    method: "POST",
    body: JSON.stringify({
      attempt_id: attemptId,
      answers,
      current_question_id: currentQuestionId,
      question_status: questionStatus,
      marked_for_review: markedForReview,
    }),
  });
}

export async function getQuizStatus(attemptId: number): Promise<QuizStatus> {
  return request<QuizStatus>(`/quiz/status/${attemptId}`);
}

export async function resumeQuiz(attemptId: number): Promise<QuizResumeResponse> {
  return request<QuizResumeResponse>(`/quiz/resume/${attemptId}`);
}

export async function getExamCriteria(): Promise<ExamCriteria[]> {
  const response = await request<ExamCriteriaListResponse>("/exam-criteria");
  return response.items;
}

export async function getExamCriterion(criteriaId: number): Promise<ExamCriteria> {
  return request<ExamCriteria>(`/exam-criteria/${criteriaId}`);
}

export async function adminGetExamCriteria(): Promise<ExamCriteria[]> {
  const response = await request<ExamCriteriaListResponse>("/exam-criteria/admin");
  return response.items;
}

export async function createExamCriteria(data: ExamCriteriaInput): Promise<ExamCriteria> {
  return request<ExamCriteria>("/exam-criteria", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExamCriteria(
  criteriaId: number,
  data: Partial<ExamCriteriaInput>
): Promise<ExamCriteria> {
  return request<ExamCriteria>(`/exam-criteria/${criteriaId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExamCriteria(criteriaId: number): Promise<void> {
  await request<void>(`/exam-criteria/${criteriaId}`, {
    method: "DELETE",
  });
}

export async function getQuestionPapers(params: {
  query?: string;
  exam_category?: string;
  board?: string;
  subject?: string;
  year?: number;
  class_name?: string;
  question_type?: string;
  difficulty?: string;
} = {}): Promise<QuestionPaper[]> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const path = search.toString() ? `/question-papers?${search.toString()}` : "/question-papers";
  const response = await request<QuestionPaperListResponse>(path);
  return response.items;
}

export async function getQuestionPaper(paperId: number): Promise<QuestionPaper> {
  return request<QuestionPaper>(`/question-papers/${paperId}`);
}

export async function getExamModules(): Promise<ExamModule[]> {
  const response = await request<ExamModuleListResponse>("/question-papers/exam-modules");
  return response.items;
}

export async function getExamModule(slug: string): Promise<ExamModuleDetail> {
  return request<ExamModuleDetail>(`/question-papers/exam-modules/${encodeURIComponent(slug)}`);
}

export async function createQuestionPaper(data: QuestionPaperInput): Promise<QuestionPaper> {
  return request<QuestionPaper>("/question-papers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateQuestionPaper(
  paperId: number,
  data: Partial<QuestionPaperInput>
): Promise<QuestionPaper> {
  return request<QuestionPaper>(`/question-papers/${paperId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteQuestionPaper(paperId: number): Promise<void> {
  await request<void>(`/question-papers/${paperId}`, {
    method: "DELETE",
  });
}

export async function importQuestionPaper(data: { paper: QuestionPaperInput }): Promise<QuestionPaper> {
  return request<QuestionPaper>("/question-papers/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return request<AnalyticsSummary>("/analytics/me");
}

export async function getHeatmap(): Promise<HeatmapItem[]> {
  return request<HeatmapItem[]>("/analytics/heatmap");
}

export async function getCertifications(): Promise<Certification[]> {
  return request<Certification[]>("/certifications/me");
}

export async function getCertificates(): Promise<Certificate[]> {
  return request<Certificate[]>("/certificates");
}

export async function getCertificate(certificateId: string): Promise<Certificate> {
  return request<Certificate>(`/certificates/${certificateId}`);
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await safeFetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function logProctoringEvent(data: {
  attempt_id: number;
  event_type: ProctoringEventType;
  event_description: string;
  severity?: ProctoringSeverity;
  timestamp?: string;
}): Promise<ProctoringLogResponse> {
  return request<ProctoringLogResponse>("/proctoring/log", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      severity: data.severity ?? "warning",
      timestamp: data.timestamp ?? new Date().toISOString(),
    }),
  });
}

export async function getProctoringReport(
  attemptId: number
): Promise<ProctoringReport> {
  return request<ProctoringReport>(`/proctoring/report/${attemptId}`);
}

export async function getAdminProctoringReports(): Promise<AdminProctoringReportResponse> {
  return request<AdminProctoringReportResponse>("/proctoring/admin/reports");
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function updateProfile(data: {
  full_name?: string;
  current_password?: string;
  new_password?: string;
}): Promise<User> {
  return request<User>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── Results history ──────────────────────────────────────────────────────────

export async function getResults(): Promise<ResultSummary[]> {
  return request<ResultSummary[]>("/results");
}

// ── Remediation ──────────────────────────────────────────────────────────────

export async function getRemediationPlan(attemptId: number): Promise<RemediationPlan> {
  return request<RemediationPlan>(`/remediation/plan/${attemptId}`);
}

export async function getRemediationHistory(): Promise<RemediationHistory> {
  return request<RemediationHistory>("/remediation/history");
}

// Payment endpoints removed - all assessments are now free

// ── Tutors ────────────────────────────────────────────────────────────────────

export async function getTutors(): Promise<TutorProfile[]> {
  return request<TutorProfile[]>("/tutors/");
}

export async function getTutorAvailability(tutorId: number): Promise<TutorAvailability[]> {
  return request<TutorAvailability[]>(`/tutors/${tutorId}/availability`);
}

export async function bookTutorSession(data: {
  tutor_id: number;
  scheduled_at: string;
  duration_minutes: number;
}): Promise<TutorSession> {
  return request<TutorSession>("/tutors/book", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyTutorSessions(): Promise<TutorSession[]> {
  return request<TutorSession[]>("/tutors/sessions/my");
}

// ── Video Recordings ─────────────────────────────────────────────────────────

export async function startVideoRecording(data: {
  attempt_id: number;
  recording_type?: string;
  resolution?: string;
  frame_rate?: number;
}): Promise<VideoRecording> {
  return request<VideoRecording>("/video-recordings/start", {
    method: "POST",
    body: JSON.stringify({ recording_type: "webcam", resolution: "720p", frame_rate: 30, ...data }),
  });
}

export async function stopVideoRecording(data: {
  attempt_id: number;
  duration_seconds?: number;
  file_size_bytes?: number;
}): Promise<VideoRecording> {
  return request<VideoRecording>("/video-recordings/stop", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyVideoRecordings(): Promise<VideoRecording[]> {
  return request<VideoRecording[]>("/video-recordings/my-recordings");
}

export async function getVideoRecordingByAttempt(attemptId: number): Promise<VideoRecording> {
  return request<VideoRecording>(`/video-recordings/attempt/${attemptId}`);
}

// ── AI Proctoring ─────────────────────────────────────────────────────────────

export async function startAIProctoringSession(attemptId: number): Promise<AIProctoringSession> {
  return request<AIProctoringSession>("/ai-proctoring/session/start", {
    method: "POST",
    body: JSON.stringify({ attempt_id: attemptId }),
  });
}

export async function endAIProctoringSession(attemptId: number): Promise<AIProctoringSession> {
  return request<AIProctoringSession>("/ai-proctoring/session/end", {
    method: "POST",
    body: JSON.stringify({ attempt_id: attemptId }),
  });
}

export async function logAIViolation(data: {
  attempt_id: number;
  violation_type: string;
  confidence_score?: number;
  description?: string;
}): Promise<AIViolation> {
  return request<AIViolation>("/ai-proctoring/violations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getAIProctoringSession(attemptId: number): Promise<AIProctoringSession> {
  return request<AIProctoringSession>(`/ai-proctoring/session/${attemptId}`);
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export async function getMyPortfolio(): Promise<PortfolioData> {
  return request<PortfolioData>("/portfolio/my");
}

export async function updatePortfolio(data: Partial<PortfolioUpdate>): Promise<PortfolioData> {
  return request<PortfolioData>("/portfolio/my", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function generatePortfolioPdf(): Promise<{ pdf_url: string }> {
  return request<{ pdf_url: string }>("/portfolio/generate-pdf", {
    method: "POST",
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function adminGetUsers(skip = 0, limit = 50): Promise<AdminUsersResponse> {
  return request<AdminUsersResponse>(`/admin/users?skip=${skip}&limit=${limit}`);
}

export async function adminGetTopics(): Promise<AdminTopicsResponse> {
  return request<AdminTopicsResponse>("/admin/topics");
}

export async function adminPromoteUser(userId: number): Promise<{ message: string }> {
  return request<{ message: string }>(`/admin/promote-admin?user_id=${userId}`, {
    method: "POST",
  });
}

// ── AI Question Generator ─────────────────────────────────────────────────────

type RawAIQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

function isRawAIQuestion(value: unknown): value is RawAIQuestion {
  return typeof value === "object"
    && value !== null
    && "question" in value
    && "options" in value
    && Array.isArray((value as { options?: unknown }).options)
    && "answer" in value;
}

export async function generateAIQuestions(data: {
  topic_id: number;
  topic_name: string;
  difficulty?: string;
  count?: number;
  save_to_db?: boolean;
  exam_module?: string | null;
}): Promise<GeneratedQuestion[]> {
  const raw = await request<unknown>("/ai/generate-questions", {
    method: "POST",
    body: JSON.stringify({
      topic: data.topic_name,
      difficulty: data.difficulty ?? "medium",
      count: data.count ?? 10,
      save_to_db: data.save_to_db ?? false,
      topic_id: data.topic_id,
      exam_module: data.exam_module ?? null,
    }),
  });
  const items = Array.isArray(raw)
    ? raw
    : (typeof raw === "object" && raw !== null && "questions" in raw
        ? (raw as { questions?: unknown }).questions
        : null);

  if (!Array.isArray(items) || items.length === 0 || !items.every(isRawAIQuestion)) {
    throw new Error("AI question generator returned an unexpected response.");
  }

  return items.map((q) => ({
    text: q.question,
    options: q.options,
    correct_option: q.answer as "A" | "B" | "C" | "D",
    difficulty: data.difficulty ?? "medium",
    explanation: q.explanation ?? null,
  }));
}

export async function getQuestions(topicId?: number): Promise<QuizQuestion[]> {
  const path = topicId ? `/questions?topic_id=${topicId}` : "/questions";
  return request<QuizQuestion[]>(path);
}

