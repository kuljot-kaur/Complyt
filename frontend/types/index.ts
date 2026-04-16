export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'error' | 'flagged';

export type ProcessingStep = 'ocr' | 'extraction' | 'classification' | 'validation' | 'completed';

export interface Document {
  id: string;
  filename: string;
  status: DocumentStatus;
  score: number | null;
  uploadedAt: Date;
  processedAt?: Date;
  extractedData?: ExtractedData | null;
  errors: ComplianceError[];
  warnings: ComplianceWarning[];
}

export interface ExtractedData {
  exporterName: string | null;
  exporterAddress: string | null;
  importerName: string | null;
  importerAddress: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  currency: string | null;
  totalValue: number | null;
  incoterms: string | null;
  countryOfOrigin: string | null;
  countryOfDestination: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
  goodsDescription: string | null;
  hsCode: string | null;
  hsSource?: 'extracted' | 'predicted';
  netWeightKg: number | null;
  grossWeightKg: number | null;
  quantity: number | null;
  unitOfMeasure: string | null;
}

export interface ComplianceError {
  code: string;
  field: string | null;
  message: string;
  severity: 'error';
}

export interface ComplianceWarning {
  code: string;
  field: string | null;
  message: string;
  severity: 'warning';
}

export interface ProcessingResponse {
  status: 'success' | 'error';
  data: ExtractedData | null;
  errors: ComplianceError[];
  warnings: ComplianceWarning[];
  score: number | null;
  message: string | null;
}

export interface DashboardStats {
  totalDocuments: number;
  avgComplianceScore: number;
  pendingDocuments: number;
  flaggedDocuments: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}
