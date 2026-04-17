import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import { fetchDashboardStats, fetchDocuments, getMe, fetchAdminUsers, addAdminUser, deleteAdminUser } from "../lib/api";
import type { DashboardStats, DocumentRecord, User, AdminUserStat } from "../types";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Admin specific state
  const [adminUsers, setAdminUsers] = useState<AdminUserStat[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin">("user");

  const loadAdminUsers = async () => {
    try {
      const users = await fetchAdminUsers();
      setAdminUsers(users);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const u = await getMe();
        setCurrentUser(u);

        const [statsPayload, docsPayload] = await Promise.all([fetchDashboardStats(), fetchDocuments()]);
        setStats(statsPayload);
        setDocuments(docsPayload);

        if (u.role === "admin") {
          await loadAdminUsers();
        }
      } catch (err) {
        console.error("Dashboard initialization error:", err);
        // Force redirect to login if session has expired or fetch failed unrecoverably
        localStorage.removeItem("complyt_token");
        window.location.href = "/login";
      }
    })();
  }, []);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addAdminUser({ email: newEmail, full_name: newFullName, password: newPassword, role: newRole });
      setShowAddForm(false);
      setNewEmail("");
      setNewFullName("");
      setNewPassword("");
      setNewRole("user");
      await loadAdminUsers();
    } catch (err: any) {
      alert(err.message || "Failed to add user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user and ALL their documents?")) return;
    try {
      await deleteAdminUser(id);
      await loadAdminUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">{currentUser?.role === "admin" ? "Admin Portal" : "Executive Portal"} - {currentUser?.email || "loading..."}</p>
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

      {currentUser?.role === "admin" && (
        <section className="panel" style={{ marginTop: "2rem" }}>
          <div className="panel-head">
            <h3>Directory Management</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(!showAddForm)} type="button">
              {showAddForm ? "Cancel" : "Add User"}
            </button>
          </div>

          {showAddForm && (
            <div style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid var(--border)", borderRadius: "8px" }}>
              <form className="stack" onSubmit={handleAddUser}>
                <div className="split-grid" style={{ gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px" }}>Email</label>
                    <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px" }}>Full Name</label>
                    <input type="text" required value={newFullName} onChange={(e) => setNewFullName(e.target.value)} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px" }}>Password</label>
                    <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: "8px", background: "transparent", border: "1px solid var(--border)", color: "#fff" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "4px" }}>Role</label>
                    <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} style={{ width: "100%", padding: "8px", background: "var(--surface)", border: "1px solid var(--border)", color: "#fff" }}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary glow-effect" style={{ marginTop: "1rem" }}>Create System User</button>
              </form>
            </div>
          )}

          <div className="table-wrap">
            <table className="obs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Total Runs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id.split("-")[0]}</td>
                    <td>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td><span className={`status-pill ${u.role === 'admin' ? 'active' : ''}`}>{u.role}</span></td>
                    <td><span className="mono">{u.runs}</span></td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: "4px 8px", borderColor: "rgba(220, 38, 38, 0.5)", color: "#fca5a5" }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteUser(u.id); }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {adminUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No users found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="panel" style={{ marginTop: "2rem" }}>
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
              {documents.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>No documents recorded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
