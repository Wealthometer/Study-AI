import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

export default function AuthShell({ title, subtitle, alternateText, alternateLink, alternateLabel, children }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      padding: "40px 20px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "14%", left: "9%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(232,200,74,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "8%", right: "8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,143,232,0.07) 0%, transparent 70%)" }} />
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.03 }}>
          <defs>
            <pattern id="auth-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>
      </div>

      <div style={{ width: "100%", maxWidth: 520, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="aFadeIn">
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--gold), #c4900a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <GraduationCap size={24} color="#07090f" />
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.4px" }}>StudyFetch</div>
          <div style={{ color: "var(--text2)", fontSize: 12, marginTop: 6, letterSpacing: "0.1em" }}>AI-POWERED STUDY PLATFORM</div>
        </div>

        <div className="card aFadeUp" style={{ padding: "34px 28px" }}>
          <div style={{ marginBottom: 22, textAlign: "center" }}>
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{title}</h1>
            <p style={{ color: "var(--text2)", fontSize: 13 }}>{subtitle}</p>
          </div>

          {children}

          <div className="divider" />
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
            {alternateText}{" "}
            <Link to={alternateLink} style={{ color: "var(--gold)", fontWeight: 600 }}>{alternateLabel}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
