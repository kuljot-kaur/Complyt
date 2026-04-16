import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchTaskStatus } from "../lib/api";

export default function ProcessingPage() {
  const navigate = useNavigate();
  const { taskId = "demo-task" } = useParams();
  const [progress, setProgress] = useState(24);
  const [message, setMessage] = useState("Initializing compliance pipeline...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 2, 96));
    }, 700);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const poll = async () => {
      const snapshot = await fetchTaskStatus(taskId, progress);
      setProgress(snapshot.progress);
      setMessage(snapshot.message);

      if (snapshot.status === "failed") {
        setFailed(true);
      }

      if (snapshot.status === "completed") {
        window.setTimeout(() => {
          navigate(`/results/${taskId}`);
        }, 800);
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [navigate, progress, taskId]);

  const phase = useMemo(() => {
    if (progress < 20) return "Bootstrapping";
    if (progress < 40) return "OCR Extraction";
    if (progress < 60) return "AI Field Synthesis";
    if (progress < 80) return "HS Classification";
    return "Compliance Validation";
  }, [progress]);

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Processing Pipeline</p>
        <h2 className="hero-title">{progress}%</h2>
        <p className="hero-copy">{message}</p>
      </header>

      <div className="split-grid">
        <section className="panel">
          <div className="progress-rail">
            <div style={{ width: `${progress}%` }} />
          </div>
          <div className="meta-row">
            <div>
              <label>Current Phase</label>
              <strong>{phase}</strong>
            </div>
            <div>
              <label>Task ID</label>
              <strong className="mono">{taskId}</strong>
            </div>
          </div>

          <ul className="step-list">
            <li className={progress >= 20 ? "done" : ""}>OCR extraction</li>
            <li className={progress >= 45 ? "done" : ""}>AI field extraction</li>
            <li className={progress >= 65 ? "done" : ""}>HS classification</li>
            <li className={progress >= 85 ? "active" : ""}>Compliance validation</li>
            <li className={progress >= 100 ? "done" : ""}>Final scoring</li>
          </ul>
        </section>

        <aside className="panel">
          <h3>System Notice</h3>
          <p>
            Autonomous compliance engine is active. Keep this viewport open while immutable audit entries are produced.
          </p>
          {failed ? <p className="error-text">Pipeline encountered an error. Retry upload or inspect backend logs.</p> : null}
        </aside>
      </div>
    </AppShell>
  );
}
