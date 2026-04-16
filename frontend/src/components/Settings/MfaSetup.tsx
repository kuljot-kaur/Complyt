import React, { useState } from "react";
import { setupMfa, enableMfa } from "../../lib/api";
import { TokenResponse } from "../../types";

interface MfaSetupProps {
  onComplete: (response?: TokenResponse) => void;
  onCancel: () => void;
  standaloneToken?: string; // Optional token if we're in the login/setup phase
}

export default function MfaSetup({ onComplete, onCancel, standaloneToken }: MfaSetupProps) {
  const [step, setStep] = useState<"initial" | "qr" | "verify">("initial");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await setupMfa(standaloneToken);
      setQrCodeUrl(data.qr_code_url);
      setSecret(data.secret);
      setStep("qr");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await enableMfa(otp, standaloneToken);
      onComplete(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mfa-setup-modal" style={{ padding: "1rem", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
      {step === "initial" && (
        <div className="stack" style={{ textAlign: "center", animation: "fadeIn 0.5s ease-out" }}>
          <div style={{ backgroundColor: "rgba(255,255,255,0.03)", width: "80px", height: "80px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "3rem", color: "var(--brand-primary)" }}>qr_code_2</span>
          </div>
          <h3 style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Modern MFA Enrollment</h3>
          <p className="hero-copy" style={{ fontSize: "0.95rem", marginBottom: "2rem" }}>
            Secure your operator profile using industry-standard Time-based OTP (Google Authenticator, Microsoft Authenticator, Duo).
          </p>
          <button className="btn btn-primary" onClick={startSetup} disabled={loading} style={{ height: "50px" }}>
            {loading ? "Initializing Secure Link..." : "Begin Configuration"}
          </button>
          <button className="plain-link" onClick={onCancel} style={{ marginTop: "1rem", opacity: 0.6 }}>CANCEL</button>
        </div>
      )}

      {step === "qr" && (
        <div className="stack" style={{ textAlign: "center", animation: "slideUp 0.4s ease-out" }}>
          <h3 style={{ textTransform: "uppercase", letterSpacing: "1px" }}>Universal Pairing</h3>
          <p className="hero-copy" style={{ fontSize: "0.9rem", marginBottom: "1.5rem" }}>
            Open your authenticator app and scan the encrypted identity token below:
          </p>
          
          <div style={{ backgroundColor: "white", padding: "1.5rem", display: "inline-block", margin: "0 auto 1.5rem", borderRadius: "12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <img src={qrCodeUrl} alt="MFA QR Code" style={{ display: "block", maxWidth: "220px", width: "100%" }} />
          </div>
          
          <div className="field-item" style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <label style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.5, marginBottom: "0.5rem", display: "block" }}>Manual Security Secret</label>
            <code style={{ fontSize: "1.3rem", color: "var(--brand-primary)", letterSpacing: "3px", fontWeight: "700" }}>{secret}</code>
          </div>

          <button className="btn btn-primary" onClick={() => setStep("verify")} style={{ height: "50px", marginTop: "1rem" }}>Next: Verify Code</button>
        </div>
      )}

      {step === "verify" && (
        <div className="stack" style={{ textAlign: "center", animation: "slideUp 0.4s ease-out" }}>
          <h3 style={{ textTransform: "uppercase", letterSpacing: "1px", fontSize: "1.1rem" }}>Verify Setup</h3>
          <p className="hero-copy" style={{ fontSize: "0.9rem", opacity: 0.8 }}>
            Enter the 6-digit code currently displayed in your app to confirm successful pairing.
          </p>
          
          <form className="stack" onSubmit={handleVerify} style={{ marginTop: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <input 
                className="obs-input" 
                type="text" 
                placeholder="000000" 
                maxLength={6} 
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                style={{ 
                  fontSize: "2.5rem", 
                  textAlign: "center", 
                  letterSpacing: "0.8rem", 
                  fontWeight: "700",
                  padding: "1rem",
                  border: "2px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(0,0,0,0.2)",
                  color: "var(--brand-primary)",
                  fontFamily: "monospace",
                  width: "100%"
                }}
                autoFocus
                required 
              />
              <div style={{ 
                height: "2px", 
                backgroundColor: "var(--brand-primary)", 
                width: otp.length > 0 ? `${(otp.length / 6) * 100}%` : "0%",
                transition: "width 0.3s ease",
                marginTop: "4px"
              }} />
            </div>
            
            {error && (
              <p className="error-text" style={{ padding: "0.75rem", backgroundColor: "rgba(220, 53, 69, 0.1)", borderRadius: "4px", marginTop: "1rem" }}>
                {error}
              </p>
            )}
            
            <button className="btn btn-primary" type="submit" disabled={loading || otp.length < 6} style={{ height: "50px", marginTop: "1rem" }}>
              {loading ? "Verifying Identity..." : "Finalize Activation"}
            </button>
            <button className="plain-link" onClick={() => setStep("qr")} style={{ marginTop: "1rem", opacity: 0.6, fontSize: "0.8rem" }}>
              BACK TO QR CODE
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
