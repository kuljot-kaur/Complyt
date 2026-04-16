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
}

export interface AnalysisResult {
  taskId: string;
  status: "success" | "error";
  score: number;
  summary: string;
  errors: AnalysisIssue[];
  warnings: AnalysisIssue[];
  extractedData: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
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

export interface UploadResponse {
  taskId: string;
  documentId?: string;
}
