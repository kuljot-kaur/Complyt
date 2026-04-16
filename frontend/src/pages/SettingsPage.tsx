import AppShell from "../components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Workspace Controls</p>
        <h2 className="hero-title">SETTINGS</h2>
        <p className="hero-copy">Configure API targets, audit behavior, and operator preferences.</p>
      </header>

      <section className="panel">
        <h3>Environment</h3>
        <div className="field-grid">
          <div className="field-item">
            <label>API URL</label>
            <strong>{import.meta.env.VITE_API_URL ?? "http://localhost:8000"}</strong>
          </div>
          <div className="field-item">
            <label>App Name</label>
            <strong>{import.meta.env.VITE_APP_NAME ?? "Complyt AI"}</strong>
          </div>
          <div className="field-item">
            <label>Demo Login</label>
            <strong>{String(import.meta.env.VITE_ALLOW_DEMO ?? false)}</strong>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
