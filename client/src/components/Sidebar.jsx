import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, BookOpen, CheckSquare, FileText,
  Zap, Brain, BarChart2, Calendar, Users, LogOut,
  GraduationCap, Sparkles, Clock
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/subjects",    icon: BookOpen,        label: "Subjects" },
  { to: "/tasks",       icon: CheckSquare,     label: "Tasks" },
  { to: "/materials",   icon: FileText,        label: "Materials" },
  { label: "AI TOOLS", divider: true },
  { to: "/timetable",   icon: Clock,           label: "AI Timetable", badge: "NEW" },
  { to: "/flashcards",  icon: Zap,             label: "Flashcards" },
  { to: "/quiz",        icon: Brain,           label: "Quiz Mode" },
  { to: "/tutor",       icon: Sparkles,        label: "Spark.E Tutor" },
  { to: "/analytics",   icon: BarChart2,       label: "Analytics" },
  { to: "/calendar",    icon: Calendar,        label: "Study Calendar" },
  { label: "COMMUNITY", divider: true },
  { to: "/groups",      icon: Users,           label: "Study Groups" },
];

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() { logout(); navigate("/login"); }
  const initials = user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "SF";

  return (
    <aside style={{
      width: "var(--sidebar-w)", height: "100vh",
      background: "var(--bg2)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      position: mobile ? "fixed" : "sticky",
      top: 0, left: 0, zIndex: mobile ? 500 : 10, overflowY: "auto",
    }}>
      <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, var(--gold), #c4900a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <GraduationCap size={18} color="#07090f" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: 16, letterSpacing: "-0.3px" }}>StudyAI</div>
            <div style={{ fontSize: 10, color: "var(--text2)", letterSpacing: "0.08em" }}>SMART STUDY PLANNER</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {NAV.map((item, i) => {
          if (item.divider) return (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text3)", padding: "14px 10px 6px", textTransform: "uppercase" }}>{item.label}</div>
          );
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 9, marginBottom: 2,
                fontSize: 13, fontWeight: 500,
                color: isActive ? "var(--gold)" : "var(--text2)",
                background: isActive ? "var(--gold-dim)" : "transparent",
                transition: "all 0.15s ease", textDecoration: "none",
              })}>
              <Icon size={15} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 100, background: "var(--green-dim)", color: "var(--green)" }}>{item.badge}</span>}
            </NavLink>
          );
        })}
      </nav>
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--surface)" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, var(--purple), var(--blue))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: "var(--text2)" }}>{user?.university || "University Student"}</div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout"><LogOut size={14} /></button>
        </div>
      </div>
    </aside>
  );
}
