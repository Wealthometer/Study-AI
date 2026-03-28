import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

export function Toast({ msg, type = "success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  const colors = { success: "var(--green)", error: "var(--red)", info: "var(--blue)" };
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className="toast">
      <Icon size={16} color={colors[type] || colors.info} />
      <span style={{ flex: 1, fontSize: 13 }}>{msg}</span>
      <button className="btn-ghost btn-icon" onClick={onDone}><X size={14} /></button>
    </div>
  );
}

export function Modal({ title, onClose, children, maxWidth = 520 }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const esc = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [onClose]);
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div className="modal-title" style={{ margin: 0 }}>{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ size = 18, color = "var(--gold)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid rgba(255,255,255,0.1)`,
      borderTopColor: color,
      animation: "spin 0.7s linear infinite",
      display: "inline-block", flexShrink: 0
    }} />
  );
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="card-sm" style={{ padding: 18, marginBottom: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 14, width: i === 0 ? "60%" : i === lines - 1 ? "40%" : "85%", marginBottom: i < lines - 1 ? 10 : 0 }} />
      ))}
    </div>
  );
}

export function StatCard({ value, label, icon: Icon, color = "var(--gold)", sub }) {
  return (
    <div className="card-sm" style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)" }}>{label}</span>
        {Icon && <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={color} />
        </div>}
      </div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

export function EmptyState({ icon = "📭", title, desc, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{title}</div>
      <div style={{ maxWidth: 320, margin: "0 auto 16px", lineHeight: 1.7 }}>{desc}</div>
      {action}
    </div>
  );
}

export function Confirm({ title, message, onConfirm, onCancel, danger = false }) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth={420}>
      <p style={{ color: "var(--text2)", lineHeight: 1.7, marginBottom: 24 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className={`btn btn-sm ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm}>Confirm</button>
      </div>
    </Modal>
  );
}

export function ProgressRing({ pct, size = 72, sw = 5, color = "var(--gold)" }) {
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={circ} strokeDashoffset={circ - (pct / 100) * circ}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: size > 80 ? 18 : 13, color }}>
        {pct}%
      </div>
    </div>
  );
}

