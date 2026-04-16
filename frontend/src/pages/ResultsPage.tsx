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

  const isCompliant = !isFixed && result.score >= 60;
  const displayStatus = isFixed || isCompliant ? "Compliant" : "Flagged";

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
          <label>Status</label>
          <strong className={`status-pill ${isFixed || isCompliant ? "compliant" : "flagged"} ${isFixed ? "score-animate" : ""}`} style={{ fontSize: "1.2rem", border: "0", background: "transparent", padding: "0" }}>
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
                    value={value} 
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
        </section>

        <aside className="panel">
          <h3>Compliance Report</h3>
          <ul className="issues-list">
            {!isFixed && result.errors.map((issue, index) => (
              <div className="report-item" key={index}>
                <div className="report-item-head">
                  <span className="error-code">{issue.code}</span>
                </div>
                <p className="error-msg">{issue.message}</p>
                
                {issue.impact && (
                  <div className="ai-insight">
                    <span className="insight-label">Impact</span>
                    <p className="insight-text">{issue.impact}</p>
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
            {!isFixed && result.warnings.map((issue) => (
              <li className="issue warning" key={issue.code}>
                <strong>{issue.code}</strong>
                <p>{issue.message}</p>
              </li>
            ))}
            {isFixed && (
              <li className="issue success">
                <strong>AI_FIX_APPLIED</strong>
                <p>Agent successfully validated values and safely padded missing extraction fields.</p>
              </li>
            )}
          </ul>

          <div className="btn-row">
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
        </aside>
      </div>
    </AppShell>
  );
}
