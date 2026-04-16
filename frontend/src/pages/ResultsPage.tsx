import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchResult } from "../lib/api";
import type { AnalysisResult } from "../types";

export default function ResultsPage() {
  const navigate = useNavigate();
  const { taskId = "demo-task" } = useParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    void (async () => {
      const payload = await fetchResult(taskId);
      setResult(payload);
    })();
  }, [taskId]);

  if (!result) {
    return (
      <AppShell>
        <p>Loading analysis report...</p>
      </AppShell>
    );
  }

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
          <strong>{result.score}/100</strong>
        </article>
        <article className="metric-card metric-card-alert">
          <label>Critical Errors</label>
          <strong>{result.errors.length}</strong>
        </article>
        <article className="metric-card">
          <label>Warnings</label>
          <strong>{result.warnings.length}</strong>
        </article>
        <article className="metric-card">
          <label>Status</label>
          <strong>{result.status === "success" ? "Compliant" : "Failed"}</strong>
        </article>
      </section>

      <div className="split-grid">
        <section className="panel">
          <h3>Extracted Fields</h3>
          <div className="field-grid">
            {Object.entries(result.extractedData).map(([key, value]) => (
              <div className="field-item" key={key}>
                <label>{key}</label>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel">
          <h3>Compliance Report</h3>
          <ul className="issues-list">
            {result.errors.map((issue) => (
              <li className="issue error" key={issue.code}>
                <strong>{issue.code}</strong>
                <p>{issue.message}</p>
              </li>
            ))}
            {result.warnings.map((issue) => (
              <li className="issue warning" key={issue.code}>
                <strong>{issue.code}</strong>
                <p>{issue.message}</p>
              </li>
            ))}
          </ul>

          <div className="btn-row">
            <button className="btn btn-secondary" onClick={() => navigate("/upload")} type="button">
              Re-Scan
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
