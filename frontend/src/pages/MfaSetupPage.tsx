import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MfaSetup from "../components/Settings/MfaSetup";
import { setAuthToken } from "../lib/auth";

export default function MfaSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract state from login redirect or URL params (for OAuth redirects)
  const searchParams = new URLSearchParams(location.search);
  const mfaToken = location.state?.mfaToken || searchParams.get("mfa_token");
  const email = location.state?.email || searchParams.get("email");

  useEffect(() => {
    if (!mfaToken) {
      navigate("/login", { replace: true });
    }
  }, [mfaToken, navigate]);

  const handleComplete = (authResponse?: any) => {
    if (authResponse?.access_token) {
      setAuthToken(authResponse.access_token);
      navigate("/dashboard", { replace: true });
    } else {
      // Fallback if the component didn't return the token (though it should now)
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="login-screen">
      <div className="login-aura login-aura-top" style={{ opacity: 0.4 }} />
      <div className="login-aura login-aura-bottom" style={{ opacity: 0.4 }} />

      <main className="login-grid" style={{ gridTemplateColumns: "1fr", placeItems: "center" }}>
        <section className="login-card" style={{ maxWidth: "550px", width: "100%", padding: "3.5rem", backdropFilter: "blur(20px)" }}>
          <p className="eyebrow" style={{ textAlign: "center", color: "var(--brand-primary)", fontWeight: "600" }}>Security Enforcement</p>
          <h1 style={{ textAlign: "center", marginBottom: "1rem", fontSize: "2rem", textTransform: "uppercase", letterSpacing: "2px" }}>
            Mandatory <br/>MFA Setup
          </h1>
          <span className="login-divider" style={{ margin: "1.5rem auto" }} />
          <p className="hero-copy" style={{ textAlign: "center", marginBottom: "2.5rem", fontSize: "1rem" }}>
            To protect your sensitive compliance data, Complyt AI requires Multi-Factor Authentication for all accounts. 
          </p>

          <MfaSetup 
            standaloneToken={mfaToken} 
            onComplete={handleComplete} 
            onCancel={() => navigate("/login")} 
          />
        </section>
      </main>
    </div>
  );
}
