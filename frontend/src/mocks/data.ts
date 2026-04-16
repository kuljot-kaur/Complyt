import type { AnalysisResult, DashboardStats, DocumentRecord, ProcessingSnapshot } from "../types";

export const mockDocuments: DocumentRecord[] = [
  {
    id: "CMP-9821-X",
    fileName: "Q4_Financial_Disclosure_v2.pdf",
    status: "Compliant",
    score: 98,
    uploadedAt: "2026-04-15T12:22:00Z",
    size: "2.4 MB",
    type: "application/pdf",
    taskId: "task-9821",
  },
  {
    id: "CMP-7742-A",
    fileName: "Vendor_Master_Agreement_01.docx",
    status: "Flagged",
    score: 42,
    uploadedAt: "2026-04-14T10:11:00Z",
    size: "840 KB",
    type: "application/msword",
    taskId: "task-7742",
  },
  {
    id: "CMP-1139-Q",
    fileName: "Shipment_Manifest_AsiaPacific.xlsx",
    status: "Pending",
    score: 0,
    uploadedAt: "2026-04-14T08:35:00Z",
    size: "680 KB",
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    taskId: "task-1139",
  },
  {
    id: "CMP-4318-D",
    fileName: "Privacy_Impact_Assessment.pdf",
    status: "Compliant",
    score: 91,
    uploadedAt: "2026-04-13T14:05:00Z",
    size: "1.8 MB",
    type: "application/pdf",
    taskId: "task-4318",
  },
];

export const mockDashboardStats: DashboardStats = {
  totalDocuments: 128,
  averageScore: 89,
  pending: 4,
  flagged: 12,
};

export function buildMockProcessing(taskId: string, progress: number): ProcessingSnapshot {
  if (progress >= 100) {
    return {
      taskId,
      status: "completed",
      progress: 100,
      message: "Pipeline complete. Compliance packet finalized.",
      score: 92,
    };
  }

  return {
    taskId,
    status: "processing",
    progress,
    message: "Cross-referencing global compliance datasets and validating obligations.",
  };
}

export function buildMockResult(taskId: string): AnalysisResult {
  return {
    taskId,
    status: "success",
    score: 92,
    summary: "Autonomous cross-verification complete. Two high-priority clauses require legal revision.",
    errors: [
      {
        code: "MISSING_INDEMNITY",
        field: "section_14_2",
        message: "Section 14.2 does not define liability cap required by Internal Policy 4A-22.",
        severity: "error",
      },
      {
        code: "DATA_RETENTION_GAP",
        field: "section_8",
        message: "Data retention clause exceeds maximum permissible duration for customer data.",
        severity: "error",
      },
    ],
    warnings: [
      {
        code: "GOVERNING_LAW_AMBIGUOUS",
        field: "section_21",
        message: "Jurisdictional precedence order should be clarified to avoid dispute ambiguity.",
        severity: "warning",
      },
    ],
    extractedData: {
      invoiceNumber: "INV-2026-001",
      exporterName: "Global Logics Ltd",
      importerName: "Complyt Corp",
      currency: "USD",
      hsCode: "8471.30.0100",
      totalValue: "42,150.00",
      incoterm: "DDP",
      countryOfOrigin: "DE",
      destinationCountry: "US",
      issueDate: "2026-04-10",
      dueDate: "2026-04-30",
    },
  };
}
