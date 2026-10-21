import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

/* ── Brand Logo SVG ─────────────────────────────────────────── */
const UWLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#6366f1"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
      <linearGradient id="logo-grad2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#06b6d4"/>
        <stop offset="100%" stopColor="#6366f1"/>
      </linearGradient>
    </defs>
    {/* Outer hex shape */}
    <path d="M16 2L28 9V23L16 30L4 23V9L16 2Z" fill="url(#logo-grad)" opacity="0.9"/>
    {/* Inner accent */}
    <path d="M16 7L23 11V19L16 23L9 19V11L16 7Z" fill="rgba(255,255,255,0.08)"/>
    {/* UW letterform */}
    <path d="M11 12V18.5C11 19.88 12.12 21 13.5 21C14.88 21 16 19.88 16 18.5V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 12V18.5C16 19.88 17.12 21 18.5 21C19.88 21 21 19.88 21 18.5V12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M11 12H21" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round"/>
    {/* Top accent dot */}
    <circle cx="16" cy="10" r="1.5" fill="url(#logo-grad2)"/>
  </svg>
);

export default function Navbar() {
  const auth = useContext(AuthContext);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await auth?.logout();
  };

  const initials = auth?.user?.name
    ? auth.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <nav
      className="h-[56px] shrink-0 flex items-center justify-between px-5"
      style={{
        background: "rgba(17,17,19,0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Left — Brand */}
      <div className="flex items-center gap-5">
        <Link to="/dashboard" className="flex items-center gap-2.5 group" style={{ textDecoration: "none" }}>
          <div style={{ transition: "transform 220ms cubic-bezier(0.34,1.56,0.64,1)" }}
            className="group-hover:scale-110">
            <UWLogo />
          </div>
          <div className="flex flex-col leading-none">
            <span style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#fafafa",
              letterSpacing: "-0.02em",
              fontFamily: "'Inter', sans-serif",
            }}>
              Unified Workspace
            </span>
            <span style={{ fontSize: "10px", color: "#52525b", letterSpacing: "0.08em", fontWeight: 500, textTransform: "uppercase" }}>
              Enterprise Platform
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-0.5 ml-3">
          {[{ to: "/dashboard", label: "Dashboard" }].map(({ to, label }) => (
            <Link key={to} to={to} style={{ textDecoration: "none", fontSize: "13px", fontWeight: 500, color: "#a1a1aa", borderRadius: "8px", padding: "6px 12px", transition: "all 150ms", display: "inline-block" }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                (e.target as HTMLElement).style.color = "#fafafa";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.color = "#a1a1aa";
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right — User */}
      <div className="flex items-center gap-3">
        {/* User chip */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl" style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          }}>
            {initials}
          </div>
          <span className="hidden sm:block" style={{ fontSize: "13px", fontWeight: 500, color: "#d4d4d8" }}>
            {auth?.user?.name || "User"}
          </span>
        </div>

        <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.08)" }} />

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "#71717a",
            fontFamily: "'Inter', sans-serif",
            padding: "6px 10px",
            borderRadius: "8px",
            transition: "all 150ms",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.color = "#f87171";
            el.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.color = "#71717a";
            el.style.background = "transparent";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  );
}
