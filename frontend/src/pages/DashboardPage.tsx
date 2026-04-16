import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchDashboardStats, fetchDocuments } from "../lib/api";
import type { DashboardStats, DocumentRecord } from "../types";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);

  useEffect(() => {
    void (async () => {
      const [statsPayload, docsPayload] = await Promise.all([fetchDashboardStats(), fetchDocuments()]);
      setStats(statsPayload);
      setDocuments(docsPayload);
    })();
  }, []);

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Executive Portal</p>
        <h2 className="hero-title">DASHBOARD</h2>
        <p className="hero-copy">Monitor active audits, compliance drift, and high-priority document risks.</p>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <label>Total Documents</label>
          <strong>{stats?.totalDocuments ?? 0}</strong>
        </article>
        <article className="metric-card">
          <label>Average Score</label>
          <strong>{stats?.averageScore ?? 0}%</strong>
        </article>
        <article className="metric-card">
          <label>Pending</label>
          <strong>{stats?.pending ?? 0}</strong>
        </article>
        <article className="metric-card metric-card-alert">
          <label>Flagged</label>
          <strong>{stats?.flagged ?? 0}</strong>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Recent Documents</h3>
          <button className="plain-link" onClick={() => navigate("/history")} type="button">
            View archive
          </button>
        </div>

        <div className="table-wrap">
          <table className="obs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Filename</th>
                <th>Status</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {documents.slice(0, 6).map((document) => (
                <tr key={document.id} onClick={() => navigate(`/document/${document.id}`)}>
                  <td>{document.id}</td>
                  <td>{document.fileName}</td>
                  <td>
                    <span className={`status-pill ${document.status.toLowerCase()}`}>{document.status}</span>
                  </td>
                  <td>{document.score || "--"}</td>
                  <td>{new Date(document.uploadedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
