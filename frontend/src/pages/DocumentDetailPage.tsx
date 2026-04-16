import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchDocumentDetail } from "../lib/api";
import type { AnalysisResult } from "../types";

export default function DocumentDetailPage() {
  const { documentId = "" } = useParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    void (async () => {
      const detail = await fetchDocumentDetail(documentId);
      setResult(detail);
    })();
  }, [documentId]);

  const displayName = result?.extractedData?.invoiceNumber || result?.documentId || documentId;

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Document Analysis</p>
        <h2 className="hero-title">{displayName}</h2>
        <p className="hero-copy">ID: {result?.documentId ?? documentId}</p>
      </header>

      <div className="split-grid">
        <section className="panel">
          <div className="document-preview">
            <span className="material-symbols-outlined">description</span>
            <p>Document Preview Canvas</p>
            <small>{result?.status ?? "unknown"}</small>
          </div>

          <h3>Processing Timeline</h3>
          <ul className="timeline">
            <li>Uploaded</li>
            <li>OCR Extraction</li>
            <li>AI Synthesis</li>
            <li>Validation</li>
            <li>Archived</li>
          </ul>
        </section>

        <aside className="panel">
          <h3>Compliance Health</h3>
          {result ? (
            <>
              <p className="hero-copy">Compliance score: {result.score}/100</p>
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
            </>
          ) : (
            <p className="hero-copy">No result payload available for this document yet.</p>
          )}
        </aside>
      </div>
    </AppShell>
  );
}
