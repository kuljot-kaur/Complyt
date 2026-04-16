import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { uploadDocument } from "../lib/api";

export default function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Select a document before upload.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await uploadDocument(selectedFile);
      navigate(`/processing/${response.taskId}`);
    } catch {
      setError("Upload failed. Verify backend availability or try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Central Repository</p>
        <h2 className="hero-title">UPLOAD</h2>
        <p className="hero-copy">
          Securely ingest institutional documentation into the Complyt AI core for OCR, extraction, HS classification,
          and compliance verification.
        </p>
      </header>

      <div className="split-grid">
        <section className="panel upload-dropzone">
          <span className="material-symbols-outlined upload-icon">upload_file</span>
          <h3>Drag and Drop Documents</h3>
          <p>PDF, PNG, JPG, and DOCX are supported. Maximum file size: 25MB.</p>

          <form className="stack" onSubmit={handleUpload}>
            <label className="btn btn-secondary" htmlFor="file-input">
              Browse Files
              <input
                hidden
                id="file-input"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                type="file"
              />
            </label>
            <button className="btn btn-primary" disabled={submitting} type="submit">
              {submitting ? "Uploading..." : "Upload and Analyze"}
            </button>
            {selectedFile ? <p className="mono">Selected: {selectedFile.name}</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </section>

        <aside className="panel">
          <h3>AI Processing Protocol</h3>
          <ul className="step-list">
            <li>
              <span className="material-symbols-outlined">check</span>
              OCR extraction with multilingual support
            </li>
            <li>
              <span className="material-symbols-outlined">check</span>
              Field detection across core trade and finance entities
            </li>
            <li>
              <span className="material-symbols-outlined">check</span>
              HS code classification against global tariff standards
            </li>
            <li>
              <span className="material-symbols-outlined">hourglass_empty</span>
              Compliance validation against active jurisdictional rules
            </li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
