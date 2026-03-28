import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import Sidebar from "./components/Sidebar";
import { Spinner } from "./components/UI";
import Login         from "./pages/Login";
import Register      from "./pages/Register";
import GoogleCallback from "./pages/GoogleCallback";
import Dashboard     from "./pages/Dashboard";
import Subjects      from "./pages/Subjects";
import Tasks         from "./pages/Tasks";
import Materials     from "./pages/Materials";
import Flashcards    from "./pages/Flashcards";
import Quiz          from "./pages/Quiz";
import Tutor         from "./pages/Tutor";
import Timetable     from "./pages/Timetable";
import Analytics     from "./pages/Analytics";
import CalendarPage  from "./pages/CalendarPage";
import Groups        from "./pages/Groups";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
        <Spinner size={24} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ display: "none" }} className="desktop-sidebar">
        <Sidebar />
      </div>
      <style>{`
        @media (min-width: 900px) {
          .desktop-sidebar { display: block !important; }
          .mobile-toggle   { display: none  !important; }
        }
      `}</style>

      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 400 }} />
          <Sidebar mobile onClose={() => setMobileOpen(false)} />
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="mobile-toggle" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          background: "var(--bg2)", position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ fontFamily: "var(--ff-display)", fontWeight: 800, fontSize: 18 }}>StudyAI</div>
          <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        {/* OAuth callback — must be accessible without auth */}
        <Route path="/auth/callback"   element={<GoogleCallback />} />

        {/* Protected app */}
        <Route path="/*" element={
          <Protected>
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/subjects"  element={<Subjects />} />
                <Route path="/tasks"     element={<Tasks />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/quiz"      element={<Quiz />} />
                <Route path="/tutor"     element={<Tutor />} />
                <Route path="/timetable" element={<Timetable />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar"  element={<CalendarPage />} />
                <Route path="/groups"    element={<Groups />} />
                <Route path="/"          element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppLayout>
          </Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}
