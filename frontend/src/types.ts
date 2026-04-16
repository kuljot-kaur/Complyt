export type DocumentStatus = "Compliant" | "Flagged" | "Pending" | "Processing";

export interface DocumentRecord {
  id: string;
  fileName: string;
  status: DocumentStatus;
  score: number;
  uploadedAt: string;
  size: string;
  type: string;
  taskId?: string;
}

export interface DashboardStats {
  totalDocuments: number;
  averageScore: number;
  pending: number;
  flagged: number;
}

export interface ProcessingSnapshot {
  taskId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
  score?: number;
}

export interface AnalysisIssue {
  code: string;
  field?: string;
  message: string;
  severity: "error" | "warning";
  reason?: string;
  suggestion?: string;
  impact?: string;
  confidence?: number;
}

export interface AnalysisResult {
  taskId: string;
  documentId?: string;
  status: "success" | "error";
  score: number;
  summary: string;
  errors: AnalysisIssue[];
  warnings: AnalysisIssue[];
  extractedData: Record<string, string>;
  riskLevel?: string;
  llmReasoning?: string;
  llmOverallAssessment?: "compliant" | "review_required" | "non_compliant" | "unavailable";
  llmRisks?: string[];
  llmRecommendations?: string[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  mfa_enabled: boolean;
  created_at: string;
}

export interface AdminUserStat {
  id: string;
  email: string;
  full_name: string;
  role: string;
  runs: number;
}

export interface AdminAddUserPayload {
  email: string;
  password?: string;
  full_name?: string;
  role: "user" | "admin";
}

export interface RegistrationPayload {
  email: string;
  password?: string;
  full_name?: string;
}

export interface ProfileUpdatePayload {
  full_name: string;
}

export interface PasswordChangePayload {
  current_password: string;
  new_password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token?: string;
  requires_mfa?: boolean;
  requires_mfa_setup?: boolean;
  mfa_token?: string;
  token_type?: string;
  user?: User;
}

export interface UploadResponse {
  taskId: string;
  documentId?: string;
}

export interface MfaVerifyPayload {
  mfa_token: string;
  otp_code: string;
}
