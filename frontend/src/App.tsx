import { Navigate, Route, Routes, useSearchParams, useNavigate } from "react-router-dom";
import { getAuthToken, setAuthToken } from "./lib/auth";
import { useEffect } from "react";
import DashboardPage from "./pages/DashboardPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import ProcessingPage from "./pages/ProcessingPage";
import ResultsPage from "./pages/ResultsPage";
import SettingsPage from "./pages/SettingsPage";
import UploadPage from "./pages/UploadPage";
import RegisterPage from "./pages/RegisterPage";
import MfaChallengePage from "./pages/MfaChallengePage";
import MfaSetupPage from "./pages/MfaSetupPage";

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = getAuthToken();
  if (!token) {
    return <Navigate replace to="/login" />;
  }
  return children;
}

function LandingRedirect() {
  return <Navigate replace to={getAuthToken() ? "/dashboard" : "/login"} />;
}

export default function App() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const mfaToken = searchParams.get("mfa_token");
    const email = searchParams.get("email");

    if (token) {
      setAuthToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams, navigate]);

  return (
    <Routes>
      <Route element={<LandingRedirect />} path="/" />
      <Route element={<LoginPage />} path="/login" />
      <Route element={<RegisterPage />} path="/register" />
      <Route element={<MfaChallengePage />} path="/mfa-challenge" />
      <Route element={<MfaSetupPage />} path="/mfa-setup" />
      <Route
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
        path="/dashboard"
      />
      <Route
        element={
          <RequireAuth>
            <UploadPage />
          </RequireAuth>
        }
        path="/upload"
      />
      <Route
        element={
          <RequireAuth>
            <ProcessingPage />
          </RequireAuth>
        }
        path="/processing/:taskId"
      />
      <Route
        element={
          <RequireAuth>
            <ResultsPage />
          </RequireAuth>
        }
        path="/results/:taskId"
      />
      <Route
        element={
          <RequireAuth>
            <HistoryPage />
          </RequireAuth>
        }
        path="/history"
      />
      <Route
        element={
          <RequireAuth>
            <DocumentDetailPage />
          </RequireAuth>
        }
        path="/document/:documentId"
      />
      <Route
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
        path="/settings"
      />
      <Route element={<LandingRedirect />} path="*" />
    </Routes>
  );
}
