import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import AuthShell from "./AuthShell";
import { Spinner } from "../components/UI";
import { useAuth } from "../hooks/useAuth";

// ── Google SVG icon ───────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const clerkAuth = useClerkAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();

  const [form, setForm]         = useState({ email: "", password: "" });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Show error from OAuth redirect (e.g. ?error=google_failed)
  useEffect(() => {
    const oauthError = searchParams.get("error");
    if (oauthError === "google_failed") {
      setError("Google sign-in failed. Please try again or use email/password.");
    } else if (oauthError === "profile_failed") {
      setError("Could not load your profile after Google sign-in. Please try again.");
    }
  }, [searchParams]);

  // If Clerk already has a session, jump straight to callback to sync app token
  useEffect(() => {
    if (clerkAuth.isSignedIn) {
      navigate("/auth/callback", { replace: true });
    }
  }, [clerkAuth.isSignedIn, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  }

  function handleGoogle() {
    setGLoading(true);
    try {
      loginWithGoogle(); // Navigates away — no need to setGLoading(false) if it succeeds
    } catch (err) {
      // If Clerk says we're already signed in, just continue to the callback
      if (err?.message?.includes("already signed in")) {
        navigate("/auth/callback", { replace: true });
      } else {
        setError(err.message || "Google sign-in not ready. Please try again.");
      }
      setGLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your studies."
      alternateText="New to StudyAI?"
      alternateLink="/register"
      alternateLabel="Create account"
    >
      {/* Error banner */}
      {error && (
        <div style={{
          padding: "11px 14px", background: "var(--red-dim)",
          border: "1px solid rgba(232,74,111,0.25)", borderRadius: 10,
          color: "var(--red)", fontSize: 13, marginBottom: 20, lineHeight: 1.5,
        }}>
          {error}
        </div>
      )}

      {/* ── Google Sign-In button ── */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={gLoading || loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, width: "100%", padding: "12px 20px",
          borderRadius: 10, cursor: gLoading ? "wait" : "pointer",
          background: "var(--surface2)",
          border: "1px solid var(--border2)",
          color: "var(--text)", fontSize: 14, fontWeight: 600,
          fontFamily: "var(--ff-body)",
          transition: "all 0.2s",
          marginBottom: 4,
          opacity: gLoading ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (!gLoading) e.currentTarget.style.borderColor = "#4285F4"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}
      >
        {gLoading
          ? <Spinner size={16} color="var(--text)" />
          : <GoogleIcon />
        }
        {gLoading ? "Redirecting to Google..." : "Continue with Google"}
      </button>

      {/* ── Divider ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        margin: "18px 0", color: "var(--text3)", fontSize: 12,
      }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        OR CONTINUE WITH EMAIL
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {/* ── Email / password form ── */}
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="field">
          <label>Email address</label>
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
            <input className="input" type="email" placeholder="you@university.edu"
              value={form.email} onChange={e => set("email", e.target.value)}
              style={{ paddingLeft: 38 }} autoComplete="email" required />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
            <input className="input" type={showPw ? "text" : "password"} placeholder="••••••••"
              value={form.password} onChange={e => set("password", e.target.value)}
              style={{ paddingLeft: 38, paddingRight: 42 }}
              autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPw(o => !o)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 14, marginTop: 6 }}
          disabled={loading || gLoading}>
          {loading ? <Spinner size={16} color="#07090f" /> : <> Sign in <ArrowRight size={15} /> </>}
        </button>
      </form>
    </AuthShell>
  );
}
