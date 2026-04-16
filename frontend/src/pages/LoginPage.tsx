import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isDemoAllowed, setAuthToken, getAuthToken } from "../lib/auth";
import { login } from "../lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("executive@complyt.ai");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const token = await login({ email, password });
      setAuthToken(token);
      navigate("/dashboard");
    } catch (submitError) {
      const fallback = submitError instanceof Error ? submitError.message : "Unable to establish session.";
      setError(fallback);
    } finally {
      setSubmitting(false);
    }
  };

  const enterDemo = () => {
    setAuthToken("demo-token");
    navigate("/dashboard");
  };

  return (
    <div className="login-screen">
      <div className="login-aura login-aura-top" />
      <div className="login-aura login-aura-bottom" />

      <main className="login-grid">
        <section className="login-brand-panel">
          <p className="eyebrow">Enterprise Grade</p>
          <h1 className="login-brand">COMPLYT AI.</h1>
          <span className="login-divider" />
          <p className="hero-copy">
            Autonomous document compliance operations for high-precision regulatory oversight.
          </p>
          <div className="meta-row">
            <div>
              <label>Status</label>
              <strong>Operational</strong>
            </div>
            <div>
              <label>Security</label>
              <strong>AES-256 Encrypted</strong>
            </div>
          </div>
        </section>

        <section className="login-card">
          <p className="eyebrow">Executive Access</p>
          <h2>Establish Session</h2>
          <p className="hero-copy">Access your secure compliance command center.</p>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">
              Work Email
            </label>
            <input
              autoComplete="email"
              className="obs-input"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />

            <div className="field-label-row">
              <label className="field-label" htmlFor="password">
                Security Key
              </label>
              <button className="plain-link" type="button">
                Forgot password
              </button>
            </div>
            <input
              autoComplete="current-password"
              className="obs-input"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />

            {error ? <p className="error-text">{error}</p> : null}

            <button className="btn btn-primary" disabled={submitting} type="submit">
              {submitting ? "Authenticating..." : "Continue"}
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => window.location.href = "http://localhost:8000/auth/google/login"}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              type="button"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style={{ width: "18px" }} />
              Sign in with Google
            </button>

            {isDemoAllowed() ? (
              <button className="btn btn-secondary" onClick={enterDemo} type="button">
                Enter Demo Mode
              </button>
            ) : null}

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>
              New to Complyt? <Link className="plain-link" to="/register">Create Account</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
