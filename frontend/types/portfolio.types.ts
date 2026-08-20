export interface CertificateItem {
  id: number;
  topic_id: number;
  topic_name: string;
  score: number;
  issued_at: string;
  certificate_code: string;
}

export interface PortfolioRecord {
  id: string;
  topic_name: string;
  board: string;
  subject: string;
  average_score: number;
  attempts: number;
  status: "passed" | "attempted" | "weak" | "not_tried";
}

export interface CertificationVerification {
  valid: boolean;
  student_name?: string;
  topic_name?: string;
  score?: number;
  issued_at?: string;
  cert_code?: string;
}
