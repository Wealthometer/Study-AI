import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Building2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import AuthShell from "./AuthShell";
import { Spinner } from "../components/UI";
import { useAuth } from "../hooks/useAuth";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const clerkAuth = useClerkAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", university: "",
    year_of_study: "", daily_study_hours: 4, study_preference: "morning",
  });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setError(""); setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  }

  function handleGoogle() {
    setGLoading(true);
    try {
      loginWithGoogle();
    } catch (err) {
      if (err?.message?.includes("already signed in")) {
        navigate("/auth/callback", { replace: true });
      } else {
        setError(err.message || "Google sign-up not ready. Please try again.");
      }
      setGLoading(false);
    }
  }

  const iconStyle = { position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start studying smarter with AI — free forever."
      alternateText="Already have an account?"
      alternateLink="/login"
      alternateLabel="Sign in"
    >
      {error && (
        <div style={{ padding: "11px 14px", background: "var(--red-dim)", border: "1px solid rgba(232,74,111,0.25)", borderRadius: 10, color: "var(--red)", fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
          {error}
        </div>
      )}

      {}
      <button type="button" onClick={handleGoogle} disabled={gLoading || loading}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, width: "100%", padding: "12px 20px", borderRadius: 10,
          cursor: gLoading ? "wait" : "pointer", background: "var(--surface2)",
          border: "1px solid var(--border2)", color: "var(--text)",
          fontSize: 14, fontWeight: 600, fontFamily: "var(--ff-body)",
          transition: "all 0.2s", marginBottom: 4, opacity: gLoading ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (!gLoading) e.currentTarget.style.borderColor = "#4285F4"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}>
        {gLoading ? <Spinner size={16} color="var(--text)" /> : <GoogleIcon />}
        {gLoading ? "Redirecting to Google..." : "Sign up with Google"}
      </button>

      {}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0", color: "var(--text3)", fontSize: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        OR REGISTER WITH EMAIL
        <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      </div>

      {}
      <form onSubmit={handleSubmit} autoComplete="on">
        <div className="field">
          <label>Full name</label>
          <div style={{ position: "relative" }}>
            <User size={14} style={iconStyle} />
            <input className="input" placeholder="Your full name" value={form.name}
              onChange={e => set("name", e.target.value)} style={{ paddingLeft: 38 }} required autoComplete="name" />
          </div>
        </div>

        <div className="field">
          <label>University email</label>
          <div style={{ position: "relative" }}>
            <Mail size={14} style={iconStyle} />
            <input className="input" type="email" placeholder="you@university.edu" value={form.email}
              onChange={e => set("email", e.target.value)} style={{ paddingLeft: 38 }} required autoComplete="email" />
          </div>
        </div>

        <div className="field">
          <label>Password</label>
          <div style={{ position: "relative" }}>
            <Lock size={14} style={iconStyle} />
            <input className="input" type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
              value={form.password} onChange={e => set("password", e.target.value)}
              style={{ paddingLeft: 38, paddingRight: 42 }} required autoComplete="new-password" />
            <button type="button" onClick={() => setShowPw(o => !o)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2 }}>
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>University</label>
            <div style={{ position: "relative" }}>
              <Building2 size={13} style={iconStyle} />
              <input className="input" placeholder="e.g. MIT" value={form.university}
                onChange={e => set("university", e.target.value)} style={{ paddingLeft: 36 }} />
            </div>
          </div>
          <div className="field">
            <label>Year of study</label>
            <select className="input select" value={form.year_of_study} onChange={e => set("year_of_study", e.target.value)}>
              <option value="">Select year</option>
              {["1st Year","2nd Year","3rd Year","4th Year","Masters","PhD"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="field">
            <label>Daily study hours</label>
            <select className="input select" value={form.daily_study_hours} onChange={e => set("daily_study_hours", +e.target.value)}>
              {[2,3,4,5,6,8,10].map(h => <option key={h} value={h}>{h} hours</option>)}
            </select>
          </div>
          <div className="field">
            <label>Study preference</label>
            <select className="input select" value={form.study_preference} onChange={e => set("study_preference", e.target.value)}>
              {["morning","afternoon","evening","night"].map(p =>
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "13px 20px", fontSize: 14, marginTop: 4 }}
          disabled={loading || gLoading}>
          {loading ? <Spinner size={16} color="#07090f" /> : <> Create Account <ArrowRight size={15} /> </>}
        </button>
      </form>
    </AuthShell>
  );
}

