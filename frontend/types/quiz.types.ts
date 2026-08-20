export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  topic_id?: number;
  text: string;
  options: QuestionOption[];
  correct_option?: string;
  explanation?: string;
  difficulty?: string;
}

export interface QuizAttemptSummary {
  attempt_id: string;
  topic_id?: number;
  topic_name?: string;
  score: number;
  total_questions: number;
  passed: boolean;
  created_at?: string;
}

export interface QuizSubmissionPayload {
  attempt_id?: number;
  topic_id?: number;
  answers: Array<{ question_id: string | number; selected_option: string | null }>;
  time_taken?: number;
  submission_reason?: "manual" | "timeout" | "proctoring_auto_submit";
}

export interface QuizResult {
  attempt_id: number;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  completed_at: string;
  participation_certificate?: any;
  achievement_certificate?: any;
  results: Array<{
    question_id: number;
    selected_option: string;
    correct_option: string;
    is_correct: boolean;
    explanation?: string;
    ai_explanation?: string;
  }>;
  weak_topics: string[];
  gap_analysis?: string;
  learning_resources?: string[];
  reattempt_recommended: boolean;
  subtopic_certifications_awarded?: number;
  portfolio_updated?: boolean;
  next_difficulty_unlocked?: string;
  passing_percentage: number;
}
