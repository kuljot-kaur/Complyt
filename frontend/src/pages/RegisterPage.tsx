import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register, login } from "../lib/api";
import { setAuthToken } from "../lib/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setSubmitting(true);
    setError("");

    try {
      await register({ email, full_name: fullName, password });
      // Automatically log in after registration
      const token = await login({ email, password });
      setAuthToken(token);
      navigate("/dashboard");
    } catch (submitError) {
      const fallback = submitError instanceof Error ? submitError.message : "Unable to create account.";
      setError(fallback);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aura login-aura-top" />
      <div className="login-aura login-aura-bottom" />

      <main className="login-grid">
        <section className="login-brand-panel">
          <p className="eyebrow">Onboarding</p>
          <h1 className="login-brand">JOIN <br/>COMPLYT.</h1>
          <span className="login-divider" />
          <p className="hero-copy">
            Establish your organizational identity within our secure compliance ecosystem.
          </p>
          <div className="meta-row">
            <div>
              <label>Service</label>
              <strong>Public Cloud</strong>
            </div>
            <div>
              <label>Encryption</label>
              <strong>End-to-End</strong>
            </div>
          </div>
        </section>

        <section className="login-card">
          <p className="eyebrow">Registration</p>
          <h2>Identity Setup</h2>
          <p className="hero-copy">Create your operator profile for secure access.</p>

          <form className="stack" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="fullName">
              Full Name
            </label>
            <input
              autoComplete="name"
              className="obs-input"
              id="fullName"
              onChange={(event) => setFullName(event.target.value)}
              required
              type="text"
              value={fullName}
            />

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

            <label className="field-label" htmlFor="password">
              Set Security Key
            </label>
            <input
              autoComplete="new-password"
              className="obs-input"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />

            <label className="field-label" htmlFor="confirmPassword">
              Confirm Security Key
            </label>
            <input
              autoComplete="new-password"
              className="obs-input"
              id="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />

            {error ? <p className="error-text">{error}</p> : null}

            <button className="btn btn-primary" disabled={submitting} type="submit">
              {submitting ? "Deploying..." : "Create Account"}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>
              Already have an account? <Link className="plain-link" to="/login">Sign In</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
