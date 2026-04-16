import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchDocuments, deleteDocument } from "../lib/api";
import type { DocumentRecord, DocumentStatus } from "../types";

const FILTERS: Array<DocumentStatus | "All"> = ["All", "Compliant", "Flagged", "Pending", "Processing"];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<DocumentStatus | "All">("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      const payload = await fetchDocuments();
      setDocuments(payload);
    })();
  }, []);

  const filtered = useMemo(() => {
    return documents
      .filter((doc) => (activeFilter === "All" ? true : doc.status === activeFilter))
      .filter((doc) => doc.fileName.toLowerCase().includes(query.toLowerCase()) || doc.id.toLowerCase().includes(query.toLowerCase()));
  }, [activeFilter, documents, query]);

  const handleDelete = async (id: string, fileName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${fileName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch {
      alert("Failed to delete document. Please try again.");
    }
  };

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Historical Archive</p>
        <h2 className="hero-title">DOCUMENT HISTORY</h2>
        <p className="hero-copy">Review every processed document with immutable audit metadata and compliance outcomes.</p>
      </header>

      <section className="panel">
        <div className="panel-head wrap">
          <div className="btn-row">
            {FILTERS.map((filter) => (
              <button
                className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
                key={filter}
                onClick={() => setActiveFilter(filter)}
                type="button"
              >
                {filter}
              </button>
            ))}
          </div>
          <input
            className="obs-input compact"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by file or ID"
            type="search"
            value={query}
          />
        </div>

        <div className="table-wrap">
          <table className="obs-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Filename</th>
                <th>Status</th>
                <th>Score</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((document) => (
                <tr key={document.id}>
                  <td className="mono">{document.id}</td>
                  <td>{document.fileName}</td>
                  <td>
                    <span className={`status-pill ${document.status.toLowerCase()}`}>{document.status}</span>
                  </td>
                  <td>{document.score || "--"}</td>
                  <td>{new Date(document.uploadedAt).toLocaleString()}</td>
                  <td>
                    <button className="plain-link" onClick={() => navigate(`/document/${document.id}`)} type="button">
                      Open
                    </button>
                    <span className="divider">|</span>
                    <button className="plain-link error-text" onClick={() => handleDelete(document.id, document.fileName)} type="button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
