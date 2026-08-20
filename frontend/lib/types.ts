export type User = {
  id: number;
  full_name: string;
  email: string;
  role?: string;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  role?: string;
};

export type Subtopic = {
  id: number;
  name: string;
  description: string | null;
};

export type Topic = {
  id: number;
  name: string;
  description: string | null;
  subtopics: Subtopic[];
  question_count: number;
  subject?: string;
  duration?: number;
  total_questions?: number;
  passing_score?: number;
};

export type QuizQuestion = {
  id: number;
  topic_id: number;
  subtopic_id: number | null;
  text: string;
  options: string[];
  difficulty: string;
  board?: string | null;
  class_name?: string | null;
  subject?: string | null;
  year?: number | null;
  question_type?: string;
  source?: string | null;
};

export type ExamModuleRules = {
  minimum_duration_minutes: number;
  default_duration_minutes: number;
  minimum_question_count: number;
  randomized_question_order: boolean;
  auto_save_answers: boolean;
  resume_assessment: boolean;
  fullscreen_required: boolean;
  timer_required: boolean;
  auto_submit_on_timeout: boolean;
  video_recording_integration: boolean;
  ai_proctoring_integration: boolean;
};

export type ExamModule = {
  exam_category: string;
  slug: string;
  display_name: string;
  description: string;
  instructions: string[];
  rules: ExamModuleRules;
  total_papers: number;
  published_papers: number;
  years: number[];
  subjects: string[];
  topics: string[];
};

export type ExamModuleDetail = ExamModule & {
  papers: QuestionPaper[];
};

export type ExamModuleListResponse = {
  items: ExamModule[];
  total: number;
};

export type ExamCriteria = {
  id: number;
  exam_name: string;
  board: string;
  subject: string;
  topic_id: number;
  subtopic_id: number | null;
  topic_name?: string | null;
  subtopic_name?: string | null;
  difficulty: "easy" | "medium" | "hard" | "adaptive";
  total_questions: number;
  total_marks: number;
  passing_percentage: number;
  negative_marking: number;
  maximum_attempts: number;
  duration_minutes: number;
  video_recording_enabled: boolean;
  ai_proctoring_enabled: boolean;
  certificate_enabled: boolean;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ExamCriteriaInput = {
  exam_name: string;
  board: "CBSE" | "ICSE" | "State Board" | "IIT-JEE" | "NEET" | "UPSC" | "University" | "Custom";
  subject: string;
  topic_id: number;
  subtopic_id?: number | null;
  difficulty: "easy" | "medium" | "hard" | "adaptive";
  total_questions: number;
  total_marks: number;
  passing_percentage: number;
  negative_marking: number;
  maximum_attempts: number;
  duration_minutes: number;
  video_recording_enabled: boolean;
  ai_proctoring_enabled: boolean;
  certificate_enabled: boolean;
  instructions?: string | null;
  is_active: boolean;
};

export type ExamCriteriaListResponse = {
  items: ExamCriteria[];
  total: number;
};

export type QuestionPaperQuestion = {
  id: number;
  question_number: number;
  question_id: number;
  topic_id: number | null;
  subtopic_id: number | null;
  question_type: string;
  difficulty: string;
  marks: number;
  question_text_snapshot: string | null;
  options_snapshot: string[] | null;
  correct_option_snapshot: string | null;
  explanation_snapshot: string | null;
  meta_data: Record<string, unknown> | null;
};

export type QuestionPaper = {
  id: number;
  exam_category: string;
  board: string;
  exam_name: string;
  year: number;
  academic_year: string | null;
  class_name: string | null;
  subject: string;
  topic_name: string | null;
  subtopic_name: string | null;
  question_type: string | null;
  difficulty: string | null;
  language: string;
  total_questions: number;
  total_marks: number;
  pdf_url: string | null;
  answer_key_url: string | null;
  source: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  meta_data?: Record<string, unknown> | null;
  questions?: QuestionPaperQuestion[];
};

export type QuestionPaperListResponse = {
  items: QuestionPaper[];
  total: number;
};

export type QuestionPaperInput = {
  exam_category: string;
  board: string;
  exam_name: string;
  year: number;
  academic_year?: string | null;
  class_name?: string | null;
  subject: string;
  topic_name?: string | null;
  subtopic_name?: string | null;
  question_type?: string | null;
  difficulty?: string | null;
  language?: string;
  total_marks?: number;
  pdf_url?: string | null;
  answer_key_url?: string | null;
  source?: string | null;
  meta_data?: Record<string, unknown> | null;
  is_published?: boolean;
  questions?: Array<{
    question_number: number;
    question_id: number;
    topic_id?: number | null;
    subtopic_id?: number | null;
    question_type?: string;
    difficulty?: string;
    marks?: number;
    question_text_snapshot?: string | null;
    options_snapshot?: string[] | null;
    correct_option_snapshot?: string | null;
    explanation_snapshot?: string | null;
    meta_data?: Record<string, unknown> | null;
  }>;
};

export type QuizStartResponse = {
  attempt_id: number;
  questions: QuizQuestion[];
  exam_name?: string | null;
  duration_minutes: number;
  server_started_at?: string | null;
  deadline_at?: string | null;
  remaining_seconds?: number | null;
  total_marks: number;
  passing_percentage: number;
  negative_marking: number;
  video_recording_enabled: boolean;
  ai_proctoring_enabled: boolean;
  certificate_enabled: boolean;
  instructions?: string | null;
  saved_answers: Record<string, string | null>;
  per_question_time: Record<string, number>;
};

export type QuestionPaperQuizInput = {
  paperId: number;
  topicId?: number;
  subtopicId?: number | null;
};

export type QuizAnswer = {
  question_id: number;
  selected_option: string | null;
  time_spent_seconds?: number;
};

export type QuizStatus = {
  attempt_id: number;
  is_submitted: boolean;
  remaining_seconds: number;
  server_now: string;
  deadline_at: string | null;
  saved_answers: Record<string, string | null>;
  per_question_time: Record<string, number>;
};

export type QuizResumeResponse = QuizStartResponse & {
  is_submitted: boolean;
};

export type QuizAutosaveResponse = {
  attempt_id: number;
  saved_at: string;
  remaining_seconds: number;
  is_submitted: boolean;
};

export type QuestionResult = {
  question_id: number;
  selected_option: string;
  correct_option: string;
  is_correct: boolean;
  explanation: string | null;
  ai_explanation: string | null;
};

export type QuizResult = {
  score: number;
  total: number;
  passed: boolean;
  percentage: number;
  completed_at: string;
  participation_certificate: Certificate | null;
  achievement_certificate: Certificate | null;
  results: QuestionResult[];
  total_marks: number;
  raw_score: number;
  passing_percentage: number;
  submission_reason: string;
  adaptive_recommendation: {
    action: string;
    current_difficulty: string;
    next_difficulty: string;
    confidence_score: number;
  } | null;
  weak_topics: string[];
  remedial_plan: string[];
  gap_analysis?: string | null;
  learning_resources?: string[];
  reattempt_recommended?: boolean;
  reattempt_available?: boolean;
  subtopic_certifications_awarded?: number;
  portfolio_updated?: boolean;
  next_difficulty_unlocked?: string | null;
};

export type StoredQuizSession = {
  topicName: string;
  questions: QuizQuestion[];
  result: QuizResult;
  proctoringReport?: ProctoringReport;
};

export type ProctoringEventType =
  | "camera_disconnected"
  | "face_not_detected"
  | "multiple_faces_detected"
  | "tab_switch"
  | "browser_minimized"
  | "fullscreen_exit"
  | "copy_paste_attempt"
  | "right_click_attempt"
  | "devtools_attempt";

export type ProctoringSeverity = "info" | "warning" | "critical";

export type ProctorLogEvent = {
  id: number;
  user_id: number;
  attempt_id: number;
  event_type: ProctoringEventType;
  event_description: string;
  timestamp: string;
  severity: ProctoringSeverity;
};

export type ProctoringLogResponse = {
  message: string;
  log_id: number;
  warning_count: number;
  should_auto_submit: boolean;
};

export type ProctoringReport = {
  attempt_id: number;
  total_events: number;
  warning_count: number;
  risk_level: "low" | "medium" | "high";
  events: ProctorLogEvent[];
};

export type AdminProctoringReport = {
  assessment_id: number;
  student_name: string;
  violation_count: number;
  risk_level: "low" | "medium" | "high";
  proctoring_report: ProctoringReport;
};

export type AdminProctoringReportResponse = {
  reports: AdminProctoringReport[];
};

export type AnalyticsSummary = {
  total_attempts: number;
  average_score: number;
  topics_attempted: number;
  strongest_topic: string | null;
  weakest_topic: string | null;
  pass_rate: number;
};

export type HeatmapItem = {
  topic: string;
  attempts: number;
  avg_score: number;
  last_attempted: string | null;
};

export type Certification = {
  id: number;
  topic_id: number;
  topic_name: string;
  score: number;
  issued_at: string;
  certificate_code: string;
};

export type Certificate = {
  id: number;
  certificate_id: string;
  user_id: number;
  topic_id: number;
  topic_name: string;
  student_name: string;
  certificate_type: "participation" | "achievement";
  score: number;
  total: number;
  percentage: number;
  issued_at: string;
  pdf_url: string | null;
  qr_code_data_url?: string | null;
};

// ── Result Summary ───────────────────────────────────────────────────────────

export type ResultSummary = {
  attempt_id: number;
  topic_id: number;
  topic_name: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
};

// ── Remediation ──────────────────────────────────────────────────────────────

export type RemediationPlan = {
  topic_id: number;
  topic_name: string;
  attempt_id: number;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  weak_subtopics: string[];
  strong_subtopics: string[];
  wrong_question_count: number;
  total_question_count: number;
  study_plan: string[];
  resources: {
    courses: string[];
    videos: string[];
    practice: string[];
    notes: string[];
  };
  next_steps: string[];
};

export type RemediationHistory = {
  attempts: Array<{
    attempt_id: number;
    topic_id: number;
    topic_name: string;
    score: number;
    total: number;
    percentage: number;
    completed_at: string;
  }>;
};

// ── Tutors ────────────────────────────────────────────────────────────────────

export type TutorProfile = {
  id: number;
  user_id: number;
  name: string;
  bio: string | null;
  subjects: string[];
  hourly_rate: number;
  rating: number;
  total_sessions: number;
  is_active: boolean;
};

export type TutorAvailability = {
  id: number;
  tutor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

export type TutorSession = {
  id: number;
  tutor_id: number;
  student_id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: "scheduled" | "completed" | "cancelled";
  meeting_link: string | null;
  notes: string | null;
};

// ── Video Recordings ──────────────────────────────────────────────────────────

export type VideoRecording = {
  id: number;
  attempt_id: number;
  user_id: number;
  recording_type: string;
  status: "pending" | "recording" | "processing" | "completed" | "failed";
  file_path: string | null;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  cloud_storage_url: string | null;
  resolution: string | null;
  frame_rate: number | null;
  bitrate_kbps: number | null;
  processing_error: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  started_at: string | null;
  stopped_at: string | null;
  uploaded_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

// ── AI Proctoring ─────────────────────────────────────────────────────────────

export type AIProctoringSession = {
  id: number;
  attempt_id: number;
  user_id: number;
  started_at: string;
  ended_at: string | null;
  integrity_score: number | null;
  face_detected_pct: number | null;
  eye_contact_pct: number | null;
  total_violations: number;
};

export type AIViolation = {
  id: number;
  session_id: number;
  violation_type: string;
  confidence_score: number;
  description: string | null;
  timestamp: string;
};

// ── Portfolio ─────────────────────────────────────────────────────────────────

export type PortfolioData = {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  public_slug: string | null;
  is_public: boolean;
  skills_summary: string | null;
  resume_text: string | null;
  video_links: string[] | null;
  view_count: number;
  portfolio_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type PortfolioUpdate = {
  is_public: boolean;
  skills_summary: string;
  resume_text: string;
  video_links: string[];
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  total: number;
  skip: number;
  limit: number;
};

export type AdminTopicEntry = {
  id: number;
  name: string;
  description: string | null;
  subject: string | null;
  duration: number | null;
  total_questions: number | null;
  passing_score: number | null;
};

export type AdminTopicsResponse = {
  topics: AdminTopicEntry[];
  total: number;
};

// ── AI Generated Questions ────────────────────────────────────────────────────

export type GeneratedQuestion = {
  id?: number;
  text: string;
  options: string[];
  correct_option: "A" | "B" | "C" | "D";
  difficulty: string;
  explanation: string | null;
};

