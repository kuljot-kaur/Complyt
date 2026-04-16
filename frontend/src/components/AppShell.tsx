import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearAuthToken } from "../lib/auth";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Upload", href: "/upload", icon: "upload_file" },
  { label: "History", href: "/history", icon: "history_edu" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

function isPathActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAuthToken();
    navigate("/login");
  };

  return (
    <div className="obsidian-shell">
      <aside className="side-panel">
        <div className="brand-block">
          <h1>COMPLYT AI</h1>
          <p>Autonomous Compliance</p>
        </div>

        <nav className="side-nav-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              className={`side-link ${isPathActive(location.pathname, item.href) ? "active" : ""}`}
              to={item.href}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="btn btn-primary" onClick={() => navigate("/upload")} type="button">
          New Audit
        </button>

        <div className="side-footer-links">
          <button className="plain-link" type="button">
            <span className="material-symbols-outlined">help</span>
            Support
          </button>
          <button className="plain-link" onClick={handleLogout} type="button">
            <span className="material-symbols-outlined">logout</span>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="top-panel">
          <div className="top-tabs">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={`top-${item.href}`}
                className={`top-tab ${isPathActive(location.pathname, item.href) ? "active" : ""}`}
                to={item.href}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="top-actions">
            <div className="search-box">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="Search records..." type="text" />
            </div>
            <button className="plain-link" onClick={handleLogout} type="button">
              Logout
            </button>
          </div>
        </header>

        <section className="content-canvas">{children}</section>
      </main>
    </div>
  );
}
