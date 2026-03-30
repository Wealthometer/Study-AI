import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CheckSquare, Zap, Brain, ArrowRight, TrendingUp, Calendar, Users, Sparkles, Clock, Target, Hand, AlertTriangle, Sprout, Flame, CheckCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { StatCard, SkeletonCard, EmptyState } from "../components/UI";
import api from "../lib/api";

const SUBJECT_COLORS = ["var(--gold)", "var(--blue)", "var(--green)", "var(--purple)", "var(--red)", "#ff9f40", "#4adce8"];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [progress, setProgress] = useState(null);
  const [recs, setRecs] = useState(null);
  const [difficulty, setDifficulty] = useState(null);
  const [prioritized, setPrioritized] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tRes, sRes, pRes] = await Promise.all([
          api.get("/tasks"),
          api.get("/subjects"),
          api.get("/ai/progress").catch(() => ({ data: null })),
        ]);
        setTasks(tRes.data);
        setSubjects(sRes.data);
        setProgress(pRes.data);
      } finally { setLoading(false); }

      try {
        const [recData, diffData, prioData] = await Promise.allSettled([
          api.get("/ai/recommendations"),
          api.get("/ai/difficulty"),
          api.get("/ai/prioritize"),
        ]);
        if (recData.status === "fulfilled") setRecs(recData.value.data);
        if (diffData.status === "fulfilled") setDifficulty(diffData.value.data);
        if (prioData.status === "fulfilled") setPrioritized(prioData.value.data?.tasks?.slice(0,5) || []);
      } catch {}
    }
    load();
  }, []);

  const pending = tasks.filter(t => t.status !== "completed");
  const completed = tasks.filter(t => t.status === "completed");
  const overdue = pending.filter(t => t.deadline && new Date(t.deadline) < new Date());
  const urgent = pending.filter(t => {
    if (!t.deadline) return false;
    const days = Math.ceil((new Date(t.deadline) - new Date()) / 86400000);
    return days <= 3 && days >= 0;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0];

  return (
    <div className="aFadeUp">
      {}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "var(--text2)", fontSize: 13, marginBottom: 4 }}>{greeting} <Hand size={14} /></p> 
            <h1 style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px" }}>
              {firstName}, <em style={{ fontFamily: "var(--ff-serif)", fontStyle: "italic", color: "var(--gold)" }}>let's study.</em>
            </h1>
            {user?.university && <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>{user.university} · {user.year_of_study}</p>}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate("/materials")}>
              <BookOpen size={13} /> Upload Material
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate("/tasks")}>
              <CheckSquare size={13} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {}
      {overdue.length > 0 && (
        <div style={{ padding: "12px 18px", background: "var(--red-dim)", border: "1px solid rgba(232,74,111,0.2)", borderRadius: 12, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <span style={{ color: "var(--red)", fontWeight: 600, fontSize: 13 }}>⚠️ {overdue.length} overdue task{overdue.length > 1 ? "s" : ""} </span>
            <span style={{ color: "var(--text2)", fontSize: 13 }}>� get back on track!</span>
          </div>
          <button className="btn btn-sm" style={{ background: "var(--red)", color: "#fff" }} onClick={() => navigate("/tasks")}>
            View Tasks <ArrowRight size={12} />
          </button>
        </div>
      )}
  
      {}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {loading ? Array(4).fill(0).map((_,i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />) : <>
          <StatCard value={subjects.length} label="Subjects" icon={BookOpen} color="var(--blue)" sub="Active courses" />
          <StatCard value={pending.length} label="Pending Tasks" icon={CheckSquare} color="var(--gold)" sub={urgent.length > 0 ? `${urgent.length} due soon` : "On track"} />
          <StatCard value={completed.length} label="Completed" icon={TrendingUp} color="var(--green)" sub="Tasks done" />
          <StatCard value={`${Math.round(completed.length / Math.max(tasks.length, 1) * 100)}%`} label="Completion Rate" icon={TrendingUp} color="var(--purple)" sub="Overall progress" />
        </>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: 22, alignItems: "start" }}>
        <div>
          {}
          <div className="card" style={{ padding: "22px 24px", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 700 }}>Subject Overview</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/subjects")}>Manage <ArrowRight size={12} /></button>
            </div>
            {loading ? <SkeletonCard lines={3} /> :
             subjects.length === 0 ? (
               <EmptyState icon={BookOpen} title="No subjects yet" desc="Add your university courses to get started." action={<button className="btn btn-primary btn-sm" onClick={() => navigate("/subjects")}>Add Subject</button>} />
             ) : (
               subjects.map((s, i) => {
                 const c = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                 const taskCount = s.task_count || 0;
                 const mastery = s.mastery_score || 0;
                 return (
                   <div key={s.id} style={{ marginBottom: 16 }}>
                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                       <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                         <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color || c }} />
                         <span style={{ fontSize: 13, fontWeight: 600 }}>{s.subject_name}</span>
                       </div>
                       <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                         <span style={{ fontSize: 11, color: "var(--text2)" }}>{taskCount} tasks</span>
                         <span style={{ fontSize: 12, fontWeight: 700, color: s.color || c }}>{mastery}%</span>
                       </div>
                     </div>
                     <div className="progress-bar">
                       <div className="progress-fill" style={{ width: `${mastery}%`, background: s.color || c }} />
                     </div>
                   </div>
                 );
               })
             )
            }
          </div>

          {}
          <div className="card" style={{ padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 700 }}>AI Priority Tasks</h2>
                {prioritized.length > 0 && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>Ordered by deadline, difficulty & performance</div>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate("/tasks")}>All <ArrowRight size={12} /></button>
            </div>
            {loading ? <SkeletonCard lines={2} /> :
             pending.length === 0 ? <EmptyState icon={CheckCircle} title="All caught up!" desc="No pending tasks. Add new ones to keep track." /> :
             (prioritized.length > 0 ? prioritized : pending.slice(0, 5)).map(t => {
               const days = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : (t.days_left ?? null);
               const isOverdue = days !== null && days < 0;
               const isUrgent = days !== null && days <= 2 && days >= 0;
               const priority = t.priority_score || 0;
               const barColor = priority >= 80 ? "var(--red)" : priority >= 60 ? "var(--gold)" : "var(--blue)";
               return (
                 <div key={t.id} className="card-sm" style={{ padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => navigate("/tasks")}>
                   <div style={{ width: 4, height: 40, borderRadius: 2, background: barColor, flexShrink: 0 }} />
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                     <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                       <span style={{ fontSize: 11, color: "var(--text2)" }}>{t.subject_name || "General"}</span>
                       {priority > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: barColor, letterSpacing: "0.05em" }}>P{Math.round(priority)}</span>}
                     </div>
                   </div>
                   {days !== null && (
                     <span className={`badge ${isOverdue ? "badge-red" : isUrgent ? "badge-gold" : "badge-gray"}`}>
                       {isOverdue ? "OVERDUE" : days === 0 ? "TODAY" : `${days}d`}
                     </span>
                   )}
                 </div>
               );
             })
            }
          </div>
        </div>

        {}
        <div>
          {}
          <div className="card" style={{ padding: "22px 24px", marginBottom: 18, background: "linear-gradient(135deg, var(--surface) 0%, rgba(155,116,240,0.05) 100%)", border: "1px solid rgba(155,116,240,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple)", animation: "pulse 2s ease infinite" }} />
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 700 }}>Spark.E Insights</span>
            </div>
            {!recs ? (
              <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7 }}>
                <div className="skeleton" style={{ height: 13, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 13, width: "80%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 13, width: "60%" }} />
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7, marginBottom: 14 }}>{recs.motivational_message}</p>
                {recs.recommendations?.slice(0, 3).map((r, i) => (
                  <div key={i} style={{ padding: "10px 14px", background: "rgba(155,116,240,0.08)", border: "1px solid rgba(155,116,240,0.12)", borderRadius: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)", marginBottom: 3 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>{r.description}</div>
                  </div>
                ))}
              </>
            )}
          </div>

          {}
          {difficulty && (() => {
            const cfg = { beginner: { color: "var(--blue)", icon: Sprout, label: "Beginner" }, intermediate: { color: "var(--gold)", icon: Zap, label: "Intermediate" }, advanced: { color: "var(--green)", icon: Flame, label: "Advanced" } }[difficulty.level] || { color: "var(--blue)", icon: Sprout, label: "Beginner" };
            return (
              <div className="card" style={{ padding: "18px 20px", marginBottom: 14, borderLeft: `3px solid ${cfg.color}`, cursor: "pointer" }} onClick={() => navigate("/timetable")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22, display: "inline-flex", alignItems: "center", justifyContent: "center", color: cfg.color }}><cfg.icon size={20} /></span>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 2 }}>Your Level</div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 24, fontWeight: 800, color: cfg.color }}>{difficulty.scores?.composite || 0}</div>
                    <div style={{ fontSize: 10, color: "var(--text2)" }}>composite score</div>
                  </div>
                </div>
                {difficulty.next_level_at && (
                  <div style={{ marginTop: 10 }}>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${Math.min(100, ((difficulty.scores?.composite || 0) / difficulty.next_level_at) * 100)}%`, background: cfg.color }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>{difficulty.next_level_at - (difficulty.scores?.composite || 0)} pts to next level</div>
                  </div>
                )}
              </div>
            );
          })()}

          {}
          <div className="card" style={{ padding: "22px 24px" }}>
            <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { icon: Clock, label: "AI Timetable", sub: "Smart daily schedule", to: "/timetable", color: "var(--gold)" },
                { icon: Zap, label: "Generate Flashcards", sub: "From your materials", to: "/flashcards", color: "var(--blue)" },
                { icon: Brain, label: "Start a Quiz", sub: "Test your knowledge", to: "/quiz", color: "var(--purple)" },
                { icon: Sparkles, label: "Ask Spark.E", sub: "AI tutor help", to: "/tutor", color: "var(--green)" },
                { icon: Calendar, label: "View Calendar", sub: "Study schedule", to: "/calendar", color: "var(--red)" },
                { icon: Users, label: "Study Groups", sub: "Collaborate", to: "/groups", color: "#ff9f40" },
              ].map(({ icon: Icon, label, sub, to, color }) => (
                <button key={to} className="card-sm" style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = ""}
                  onClick={() => navigate(to)}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--text2)" }}>{sub}</div>
                  </div>
                  <ArrowRight size={13} style={{ marginLeft: "auto", color: "var(--text3)" }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width:900px){
        div[style*="grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr)"]{ grid-template-columns: 1fr !important; }
      }`}</style>
    </div>
  );
}




