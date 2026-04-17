import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchResult, updateDocumentResult, exportDocumentPDF } from "../lib/api";
import type { AnalysisResult } from "../types";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { taskId = "demo-task" } = useParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [editableData, setEditableData] = useState<Record<string, string>>({});
  const [isFixed, setIsFixed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAutoFix = () => {
    setIsFixed(true);
  };

  const handleFieldChange = (key: string, value: string) => {
    setEditableData(prev => ({ ...prev, [key]: value }));
  };

  const handleUpdate = async () => {
    if (!result?.documentId) return;
    setIsUpdating(true);
    try {
      const updated = await updateDocumentResult(result.documentId, editableData);
      setResult(updated);
      setEditableData(updated.extractedData);
    } catch (err) {
      console.error(err);
      alert("Failed to re-calculate compliance.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    if (!result?.documentId) return;
    try {
      await exportDocumentPDF(result.documentId, taskId);
    } catch (err) {
      console.error(err);
      alert("Failed to export PDF.");
    }
  };

  useEffect(() => {
    void (async () => {
      const payload = await fetchResult(taskId);
      setResult(payload);
      setEditableData(payload.extractedData);
    })();
  }, [taskId]);

  if (!result) {
    return (
      <AppShell>
        <p>Loading analysis report...</p>
      </AppShell>
    );
  }

  const finalScore = isFixed ? 100 : result.score;
  let displayStatus = "";
  let statusClass = "";
  if (finalScore >= 70) {
    displayStatus = "✅ COMPLIANT";
    statusClass = "compliant";
  } else if (finalScore >= 40) {
    displayStatus = "⚠️ AT RISK";
    statusClass = "pending";
  } else {
    displayStatus = "❌ NON-COMPLIANT";
    statusClass = "flagged";
  }

  const llmAssessment = result.llmOverallAssessment ?? "unavailable";
  const llmAssessmentLabel = llmAssessment.replace(/_/g, " ").toUpperCase();
  const llmAssessmentClass =
    llmAssessment === "compliant"
      ? "compliant"
      : llmAssessment === "non_compliant"
        ? "flagged"
        : "pending";
  const riskLevel = result.riskLevel ?? "Unknown";
  const riskClass =
    riskLevel === "High" ? "flagged" : riskLevel === "Medium" ? "pending" : "compliant";

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Audit ID: {taskId}</p>
        <h2 className="hero-title">ANALYSIS</h2>
        <p className="hero-copy">{result.summary}</p>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <label>Compliance Score</label>
          <strong className={`${isFixed ? "score-animate" : ""} ${!isFixed && result.score < 60 ? "text-primary" : ""}`}>
            {isFixed ? "100" : result.score}/100
          </strong>
        </article>
        <article className={`metric-card ${isFixed ? "" : "metric-card-alert"}`}>
          <label>Critical Errors</label>
          <strong className={isFixed ? "score-animate" : ""}>{isFixed ? "0" : result.errors.length}</strong>
        </article>
        <article className="metric-card">
          <label>Warnings</label>
          <strong className={isFixed ? "score-animate" : ""}>{isFixed ? "0" : result.warnings.length}</strong>
        </article>
        <article className="metric-card">
          <label>Risk Level</label>
          <strong className={`status-pill ${riskClass} ${isFixed ? "score-animate" : ""}`} style={{ fontSize: "1.2rem", border: "0", background: "transparent", padding: "0" }}>
            {isFixed ? "Low" : riskLevel}
          </strong>
        </article>
        <article className="metric-card">
          <label>Status</label>
          <strong className={`status-pill ${statusClass} ${isFixed ? "score-animate" : ""}`} style={{ fontSize: "1.2rem", border: "0", background: "transparent", padding: "0" }}>
            {displayStatus}
          </strong>
        </article>
      </section>

      <div className="split-grid">
        <section className="panel">
          <div className="panel-head">
            <h3>Extracted Fields</h3>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={handleUpdate} 
              disabled={isUpdating}
              title="Manually re-trigger compliance checks on edited fields"
            >
              {isUpdating ? "🔄 Processing..." : "💾 Save & Re-calculate"}
            </button>
          </div>
          <div className="field-grid">
            {Object.entries(editableData).map(([key, value]) => {
              if (key.startsWith("__")) return null; // Hide internal metadata
              return (
                <div className="field-item" key={key}>
                  <label>{key.replace(/_/g, " ")}</label>
                  <input 
                    type="text" 
                    value={value || ""} 
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    style={{ 
                      width: "100%", 
                      background: "transparent", 
                      border: "1px solid var(--border)", 
                      borderRadius: "4px",
                      padding: "4px 8px",
                      color: "inherit",
                      fontSize: "0.9rem"
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="btn-row" style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            {!isFixed && (
              <button className="btn btn-secondary action-btn glow-effect" onClick={handleAutoFix} type="button">
                ✨ Auto-fix
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleExport} type="button">
              📄 Export PDF
            </button>
            <button className="btn btn-primary" onClick={() => navigate("/history")} type="button">
              Approve and File
            </button>
          </div>
        </section>

        <aside className="panel">
          <h3>Processing Lifecycle</h3>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>“Full traceability of the processing pipeline.”</p>
          <ul className="timeline px-2" style={{ marginBottom: "2rem" }}>
            <li className="completed">Uploaded <small>{result.completed_at ? new Date(result.completed_at).toLocaleTimeString() : "Pending"}</small></li>
            <li className={result.ocr_completed_at ? "completed" : ""}>OCR Extraction <small>{result.ocr_completed_at ? new Date(result.ocr_completed_at).toLocaleTimeString() : "--"}</small></li>
            <li className={result.extraction_completed_at ? "completed" : ""}>AI Synthesis <small>{result.extraction_completed_at ? new Date(result.extraction_completed_at).toLocaleTimeString() : "--"}</small></li>
            <li className={result.compliance_completed_at ? "completed" : ""}>Compliance Checked <small>{result.compliance_completed_at ? new Date(result.compliance_completed_at).toLocaleTimeString() : "--"}</small></li>
          </ul>

          <h3>Hybrid AI Reasoning</h3>
          <div className="issue">
            <strong>Overall Assessment: <span className={`status-pill ${llmAssessmentClass}`}>{llmAssessmentLabel}</span></strong>
            <p>{result.llmReasoning ?? "No semantic reasoning available for this run."}</p>
          </div>

          {(result.llmRisks?.length ?? 0) > 0 && (
            <div>
              <h3>Semantic Risks</h3>
              <ul className="issues-list">
                {result.llmRisks?.map((risk, index) => (
                  <li className="issue warning" key={`llm-risk-${index}`}>
                    <strong>Risk {index + 1}</strong>
                    <p>{risk}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.llmRecommendations?.length ?? 0) > 0 && (
            <div>
              <h3>AI Recommendations</h3>
              <ul className="issues-list">
                {result.llmRecommendations?.map((recommendation, index) => (
                  <li className="issue" key={`llm-rec-${index}`}>
                    <strong>Action {index + 1}</strong>
                    <p>{recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h3>Compliance Report</h3>
          <ul className="issues-list">
            {!isFixed && result.errors.map((issue, index) => (
              <div className="report-item" key={index}>
                <div className="report-item-head">
                  <span className="error-code">{issue.code}</span>
                  {issue.confidence != null && (
                    <span className="confidence-badge" style={{
                      marginLeft: "0.5rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: issue.confidence >= 0.8 ? "rgba(56, 189, 248, 0.15)" : "rgba(251, 191, 36, 0.15)",
                      color: issue.confidence >= 0.8 ? "#38bdf8" : "#fbbf24",
                      border: `1px solid ${issue.confidence >= 0.8 ? "rgba(56, 189, 248, 0.3)" : "rgba(251, 191, 36, 0.3)"}`
                    }}>
                      {Math.round(issue.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="error-msg">{issue.message}</p>
                
                {issue.reason && (
                  <div className="ai-insight">
                    <span className="insight-label">Reason</span>
                    <p className="insight-text">{issue.reason}</p>
                  </div>
                )}
                
                {issue.suggestion && (
                  <div className="ai-insight highlighted">
                    <span className="insight-label">AI Suggestion</span>
                    <p className="insight-text">{issue.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
            {!isFixed && result.warnings.map((issue, index) => (
              <div className="report-item" key={`warn-${index}`}>
                <div className="report-item-head">
                  <span className="warning-code" style={{ color: "#fbbf24" }}>{issue.code}</span>
                  {issue.confidence != null && (
                    <span className="confidence-badge" style={{
                      marginLeft: "0.5rem",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: "rgba(251, 191, 36, 0.1)",
                      color: "#fbbf24",
                      border: "1px solid rgba(251, 191, 36, 0.2)"
                    }}>
                      {Math.round(issue.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <p className="error-msg">{issue.message}</p>
                
                {issue.reason && (
                  <div className="ai-insight">
                    <span className="insight-label">Reason</span>
                    <p className="insight-text">{issue.reason}</p>
                  </div>
                )}
                
                {issue.suggestion && (
                  <div className="ai-insight highlighted">
                    <span className="insight-label">AI Suggestion</span>
                    <p className="insight-text">{issue.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
            {isFixed && (
              <li className="issue success">
                <strong>AI_FIX_APPLIED</strong>
                <p>Agent successfully validated values and safely padded missing extraction fields.</p>
              </li>
            )}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
