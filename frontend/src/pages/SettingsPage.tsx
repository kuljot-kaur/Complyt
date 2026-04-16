import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { getMe, updateProfile, changePassword, deleteAccount } from "../lib/api";
import { User } from "../types";
import { clearAuthToken } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import MfaSetup from "../components/Settings/MfaSetup";
import { disableMfa } from "../lib/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [passwordFlow, setPasswordFlow] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data);
        setFullName(data.full_name);
      })
      .catch(() => setMessage({ text: "Failed to load profile", type: "error" }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setMessage(null);
    try {
      const updated = await updateProfile({ full_name: fullName });
      setUser(updated);
      setMessage({ text: "Profile updated successfully", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordFlow.new !== passwordFlow.confirm) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    setUpdatingPassword(true);
    setMessage(null);
    try {
      await changePassword({ 
        current_password: passwordFlow.current, 
        new_password: passwordFlow.new 
      });
      setMessage({ text: "Password changed successfully", type: "success" });
      setPasswordFlow({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL: This will permanently delete your account and ALL your compliance documents. This action cannot be undone. Proceed?")) return;
    
    setDeletingAccount(true);
    try {
      await deleteAccount();
      clearAuthToken();
      navigate("/login");
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
      setDeletingAccount(false);
    }
  };

  const handleMfaComplete = async () => {
    setShowMfaSetup(false);
    setMessage({ text: "MFA enabled successfully", type: "success" });
    const updated = await getMe();
    setUser(updated);
  };

  const handleDisableMfa = async () => {
    if (!window.confirm("Disabling MFA will significantly reduce your account security. Proceed?")) return;
    try {
      await disableMfa();
      const updated = await getMe();
      setUser(updated);
      setMessage({ text: "MFA disabled successfully", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    }
  };

  if (loading) return <AppShell><div className="loading-state">Initializing Secure Session...</div></AppShell>;

  return (
    <AppShell>
      <header className="page-header">
        <p className="eyebrow">Operator Controls</p>
        <h2 className="hero-title">SETTINGS</h2>
        <p className="hero-copy">Manage your identity, security credentials, and workspace presence.</p>
      </header>

      {message && (
        <div className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`} style={{ marginBottom: "2rem" }}>
          {message.text}
        </div>
      )}

      <div className="settings-grid">
        {/* Profile Section */}
        <section className="panel">
          <div className="panel-header">
            <span className="material-symbols-outlined">person</span>
            <h3>Identity Profile</h3>
          </div>
          <form className="stack" onSubmit={handleUpdateProfile}>
            <div className="field-item">
              <label>Operator Name</label>
              <input 
                className="obs-input" 
                onChange={(e) => setFullName(e.target.value)}
                required 
                type="text" 
                value={fullName} 
              />
            </div>
            <div className="field-item">
              <label>System Identifier (Read-only)</label>
              <input 
                className="obs-input" 
                disabled 
                type="email" 
                value={user?.email || ""} 
              />
              <p className="field-hint">Identifier mapping is managed by organization admin.</p>
            </div>
            <button className="btn btn-primary" disabled={updatingProfile} type="submit">
              {updatingProfile ? "Committing..." : "Update Identity"}
            </button>
          </form>
        </section>

        {/* Security Section */}
        <section className="panel">
          <div className="panel-header">
            <span className="material-symbols-outlined">security</span>
            <h3>Security Credentials</h3>
          </div>
          
          <div className="stack" style={{ gap: "2rem" }}>
            <div className="field-item" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1.5rem" }}>
              <label>Multi-Factor Authentication (MFA)</label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className={`status-dot ${user?.mfa_enabled ? "status-online" : "status-offline"}`} />
                  <strong>{user?.mfa_enabled ? "Active (TOTP)" : "Disabled"}</strong>
                </div>
                {user?.mfa_enabled ? (
                  <button className="btn btn-secondary" onClick={handleDisableMfa}>Disable</button>
                ) : (
                  !showMfaSetup && <button className="btn btn-primary" onClick={() => setShowMfaSetup(true)}>Enable MFA</button>
                )}
              </div>
              
              {showMfaSetup && (
                <div style={{ marginTop: "1rem" }}>
                  <MfaSetup onCancel={() => setShowMfaSetup(false)} onComplete={handleMfaComplete} />
                </div>
              )}
            </div>

            <form className="stack" onSubmit={handleChangePassword}>
              <div className="field-item">
                <label>Current Security Key</label>
                <input 
                  className="obs-input" 
                  onChange={(e) => setPasswordFlow({ ...passwordFlow, current: e.target.value })}
                  required 
                  type="password" 
                  value={passwordFlow.current} 
                />
              </div>
              <div className="field-item">
                <label>New Security Key</label>
                <input 
                  className="obs-input" 
                  onChange={(e) => setPasswordFlow({ ...passwordFlow, new: e.target.value })}
                  required 
                  type="password" 
                  value={passwordFlow.new} 
                />
              </div>
              <div className="field-item">
                <label>Confirm New Key</label>
                <input 
                  className="obs-input" 
                  onChange={(e) => setPasswordFlow({ ...passwordFlow, confirm: e.target.value })}
                  required 
                  type="password" 
                  value={passwordFlow.confirm} 
                />
              </div>
              <button className="btn btn-secondary" disabled={updatingPassword} type="submit">
                {updatingPassword ? "Encrypting..." : "Rotate Keys"}
              </button>
            </form>
          </div>
        </section>

        {/* Infrastructure Section */}
        <section className="panel">
          <div className="panel-header">
            <span className="material-symbols-outlined">schema</span>
            <h3>Environment</h3>
          </div>
          <div className="field-grid">
            <div className="field-item">
              <label>Gateway</label>
              <strong>{import.meta.env.VITE_API_URL ?? "http://localhost:8000"}</strong>
            </div>
            <div className="field-item">
              <label>Cluster ID</label>
              <strong>COMPLYT-ALPHA-01</strong>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="panel panel-danger">
          <div className="panel-header">
            <span className="material-symbols-outlined">warning</span>
            <h3>Danger Zone</h3>
          </div>
          <p className="hero-copy" style={{ fontSize: "0.85rem", opacity: 0.8 }}>
            Permanently terminate this identity and wipe all related documents from the secure vault.
          </p>
          <button className="btn btn-danger" disabled={deletingAccount} onClick={handleDeleteAccount}>
            {deletingAccount ? "Terminating..." : "Terminate Account"}
          </button>
        </section>
      </div>
    </AppShell>
  );
}
