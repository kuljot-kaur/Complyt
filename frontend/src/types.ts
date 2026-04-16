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

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UploadResponse {
  taskId: string;
  documentId?: string;
}
