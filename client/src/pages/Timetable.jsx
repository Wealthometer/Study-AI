import { useState, useEffect } from "react";
import {
  Clock, Sparkles, ChevronLeft, ChevronRight, RefreshCw,
  CheckCircle, BookOpen, Brain, Zap, Coffee, Star,
  TrendingUp, AlertTriangle, ThumbsUp, ThumbsDown, Target
} from "lucide-react";
import { Toast, Spinner, EmptyState } from "../components/UI";
import api from "../lib/api";

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const ACTIVITY_ICONS = {
  Study: BookOpen, Revision: RefreshCw, Practice: Brain,
  Break: Coffee, Exam: Star
};

const ACTIVITY_COLORS = {
  Study: "var(--blue)",
  Revision: "var(--purple)",
  Practice: "var(--gold)",
  Break: "var(--green)",
  Exam: "var(--red)"
};

const DIFF_COLORS = {
  easy: "var(--green)", medium: "var(--gold)", hard: "var(--red)"
};

const LEVEL_CONFIG = {
  beginner:     { label: "Beginner",     color: "var(--blue)",   emoji: "🌱", desc: "Building foundations" },
  intermediate: { label: "Intermediate", color: "var(--gold)",   emoji: "⚡", desc: "Growing stronger" },
  advanced:     { label: "Advanced",     color: "var(--green)",  emoji: "🔥", desc: "Performing at peak" },
};

export default function Timetable() {
  const [timetable, setTimetable]     = useState(null);
  const [difficulty, setDifficulty]   = useState(null);
  const [workload, setWorkload]        = useState(null);
  const [loading, setLoading]          = useState(true);
  const [generating, setGenerating]    = useState(false);
  const [toast, setToast]              = useState(null);
  const [selectedDay, setSelectedDay]  = useState(0);
  const [completedSessions, setCompleted] = useState({});
  const [feedback, setFeedback]        = useState(null);
  const [genForm, setGenForm]          = useState({ days: 7, date: new Date().toISOString().split("T")[0] });

  useEffect(() => { initialLoad(); }, []);

  async function initialLoad() {
    setLoading(true);
    try {
      const [diffRes, wlRes] = await Promise.allSettled([
        api.get("/ai/difficulty"),
        api.get("/ai/workload"),
      ]);
      if (diffRes.status === "fulfilled") setDifficulty(diffRes.value.data);
      if (wlRes.status === "fulfilled")  setWorkload(wlRes.value.data);
    } finally { setLoading(false); }
  }

  async function generate() {
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/timetable/generate", genForm);
      setTimetable(data);
      setSelectedDay(0);
      setCompleted({});
      const d = await api.get("/ai/difficulty");
      setDifficulty(d.data);
      setToast({ msg: `${genForm.days}-day timetable generated at ${data.difficulty_level} level! 🎯`, type: "success" });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Generation failed. Add some tasks first!", type: "error" });
    } finally { setGenerating(false); }
  }

  async function sendFeedback(rating) {
    setFeedback(rating);
    try {
      await api.post("/ai/feedback", { rating, plan_type: "timetable" });
      setToast({ msg: rating === "helpful" ? "Thanks! Glad it helped 🙌" : "Noted! We'll improve it 📝", type: "success" });
    } catch {}
  }

  function toggleSession(dayIdx, sessIdx) {
    const key = `${dayIdx}-${sessIdx}`;
    setCompleted(p => ({ ...p, [key]: !p[key] }));
  }

  const days = timetable?.timetable || [];
  const currentDay = days[selectedDay];
  const completedCount = Object.values(completedSessions).filter(Boolean).length;
  const totalSessions = days.reduce((acc, d) => acc + (d.sessions?.filter(s => s.activity !== "Break").length || 0), 0);

  const wlColors = { balanced: "var(--green)", warning: "var(--gold)", overloaded: "var(--red)" };

  return (
    <div className="aFadeUp">
      {}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">AI Planner</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Daily <em>Timetable</em></h1>
          <p style={{ color: "var(--text2)", fontSize: 13, marginTop: 4 }}>
            AI-generated schedule that adapts to your level and workload
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select className="input select" style={{ width: 120, fontSize: 12, padding: "8px 12px" }}
            value={genForm.days} onChange={e => setGenForm(p => ({ ...p, days: +e.target.value }))}>
            {[3,5,7,10,14].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
          <input type="date" className="input" style={{ width: 150, fontSize: 12, padding: "8px 12px" }}
            value={genForm.date} onChange={e => setGenForm(p => ({ ...p, date: e.target.value }))} />
          <button className="btn btn-primary" onClick={generate} disabled={generating} style={{ whiteSpace: "nowrap" }}>
            {generating ? <><Spinner size={14} color="#07090f" /> Generating...</> : <><Sparkles size={14} /> Generate</>}
          </button>
        </div>
      </div>

      {}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>

        {}
        {loading ? <div className="skeleton" style={{ height: 90, borderRadius: 14 }} /> : difficulty ? (() => {
          const cfg = LEVEL_CONFIG[difficulty.level] || LEVEL_CONFIG.beginner;
          return (
            <div className="card-sm" style={{ padding: "18px 20px", borderLeft: `3px solid ${cfg.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Your Level</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                    <div>
                      <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text2)" }}>{cfg.desc}</div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 26, fontWeight: 800, color: cfg.color }}>{difficulty.scores?.composite || 0}</div>
                  <div style={{ fontSize: 10, color: "var(--text2)" }}>score</div>
                </div>
              </div>
              {difficulty.next_level_at && (
                <div style={{ marginTop: 10 }}>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(100, ((difficulty.scores?.composite || 0) / difficulty.next_level_at) * 100)}%`, background: cfg.color }} />
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginTop: 4 }}>
                    {difficulty.next_level_at - (difficulty.scores?.composite || 0)} pts to next level
                  </div>
                </div>
              )}
            </div>
          );
        })() : null}

        {}
        {difficulty && (
          <div className="card-sm" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Performance Breakdown</div>
            {[
              { label: "Quiz Average", val: difficulty.scores?.quiz_average, color: "var(--blue)" },
              { label: "Flashcard Accuracy", val: difficulty.scores?.flashcard_accuracy, color: "var(--purple)" },
              { label: "Task Completion", val: difficulty.scores?.task_completion, color: "var(--green)" },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                  <span style={{ color: "var(--text2)" }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.val || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.val || 0}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {}
        {workload && (
          <div className="card-sm" style={{ padding: "18px 20px", borderLeft: `3px solid ${wlColors[workload.status] || "var(--blue)"}` }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Workload</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {workload.status === "overloaded"
                ? <AlertTriangle size={18} color="var(--red)" />
                : workload.status === "warning"
                  ? <AlertTriangle size={18} color="var(--gold)" />
                  : <CheckCircle size={18} color="var(--green)" />}
              <span style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, color: wlColors[workload.status] }}>
                {workload.status === "balanced" ? "Balanced" : workload.status === "warning" ? "Heavy Load" : "Overloaded"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", lineHeight: 1.6 }}>{workload.recommendation?.slice(0, 100)}…</div>
            {workload.total_estimated_hours > 0 && (
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)" }}>
                <Clock size={10} style={{ marginRight: 4 }} />{workload.total_estimated_hours}h total remaining
              </div>
            )}
          </div>
        )}

        {}
        {timetable && (
          <div className="card-sm" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's Progress</div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 800, color: "var(--gold)" }}>
              {completedCount}<span style={{ fontSize: 14, color: "var(--text2)", fontWeight: 400 }}>/{totalSessions}</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 8 }}>sessions completed</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0}%`, background: "var(--gold)" }} />
            </div>
          </div>
        )}
      </div>

      {}
      {!timetable && !generating && (
        <div className="card" style={{ padding: "48px 32px" }}>
          <EmptyState
            icon="📅"
            title="No timetable generated yet"
            desc="Click Generate to create your personalised AI study timetable. Make sure you have tasks added first!"
            action={
              <button className="btn btn-primary" onClick={generate} disabled={generating}>
                <Sparkles size={14} /> Generate My Timetable
              </button>
            }
          />
        </div>
      )}

      {}
      {timetable && (
        <>
          {}
          {timetable.ai_tips?.length > 0 && (
            <div className="card" style={{ padding: "16px 20px", marginBottom: 18, background: "linear-gradient(135deg, var(--surface) 0%, rgba(155,116,240,0.06) 100%)", border: "1px solid rgba(155,116,240,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--purple)", animation: "pulse 2s ease infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--purple)" }}>Spark.E Tips</span>
                <span className="badge" style={{ background: "var(--purple-dim)", color: "var(--purple)", fontSize: 9 }}>{timetable.difficulty_level}</span>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {timetable.ai_tips.map((tip, i) => (
                  <div key={i} style={{ padding: "8px 14px", background: "rgba(155,116,240,0.08)", border: "1px solid rgba(155,116,240,0.12)", borderRadius: 10, fontSize: 12, color: "var(--text)", lineHeight: 1.6, flex: "1 1 200px" }}>
                    💡 {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
            {days.map((day, i) => {
              const dayStudyMins = day.sessions?.filter(s => s.activity !== "Break").reduce((a, s) => a + (s.duration_minutes || 0), 0) || 0;
              const isToday = day.date === new Date().toISOString().split("T")[0];
              return (
                <button key={i} onClick={() => setSelectedDay(i)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "10px 16px", borderRadius: 12, cursor: "pointer",
                  background: selectedDay === i ? "var(--gold-dim)" : "var(--surface2)",
                  border: `1px solid ${selectedDay === i ? "rgba(232,200,74,0.3)" : isToday ? "rgba(74,143,232,0.3)" : "var(--border)"}`,
                  transition: "all 0.15s", minWidth: 68, flexShrink: 0
                }}>
                  <div style={{ fontSize: 10, color: selectedDay === i ? "var(--gold)" : isToday ? "var(--blue)" : "var(--text2)", fontWeight: 600, marginBottom: 3 }}>
                    {day.day_name?.slice(0, 3).toUpperCase() || SHORT_DAYS[i]}
                  </div>
                  <div style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 800, color: selectedDay === i ? "var(--gold)" : "var(--text)" }}>
                    {day.date?.slice(8)}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 3 }}>{Math.round(dayStudyMins / 60)}h study</div>
                  {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--blue)", marginTop: 3 }} />}
                </button>
              );
            })}
          </div>

          {}
          {currentDay && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18, alignItems: "start" }}>

              {}
              <div className="card" style={{ padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 17, fontWeight: 800 }}>{currentDay.day_name}</h2>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{currentDay.date} · {Math.round((currentDay.total_study_minutes || 0) / 60 * 10) / 10}h study time</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDay(i => Math.max(0, i - 1))} disabled={selectedDay === 0}><ChevronLeft size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => setSelectedDay(i => Math.min(days.length - 1, i + 1))} disabled={selectedDay === days.length - 1}><ChevronRight size={16} /></button>
                  </div>
                </div>

                {(!currentDay.sessions || currentDay.sessions.length === 0) ? (
                  <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "32px 0" }}>🎉 No sessions — this is your rest day!</div>
                ) : (
                  <div style={{ position: "relative" }}>
                    {}
                    <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />

                    {currentDay.sessions.map((session, si) => {
                      const Icon = ACTIVITY_ICONS[session.activity] || BookOpen;
                      const color = session.color || ACTIVITY_COLORS[session.activity] || "var(--blue)";
                      const isBreak = session.activity === "Break";
                      const key = `${selectedDay}-${si}`;
                      const done = completedSessions[key];

                      return (
                        <div key={si} style={{ display: "flex", gap: 14, marginBottom: 12, position: "relative" }}>
                          {}
                          <div style={{ width: 40, textAlign: "right", flexShrink: 0, paddingTop: 14 }}>
                            <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.4 }}>
                              {session.start_time}<br />{session.end_time}
                            </div>
                          </div>

                          {}
                          <div style={{ position: "relative", zIndex: 1, flexShrink: 0, paddingTop: 12 }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: "50%",
                              background: done ? "var(--green)" : color,
                              border: `2px solid ${done ? "var(--green)" : color}`,
                              boxShadow: `0 0 0 3px ${color}20`,
                              transition: "all 0.2s"
                            }} />
                          </div>

                          {}
                          <div onClick={() => !isBreak && toggleSession(selectedDay, si)} style={{
                            flex: 1, padding: "12px 16px", borderRadius: 12,
                            background: done ? "rgba(74,232,160,0.06)" : isBreak ? "rgba(255,255,255,0.02)" : `${color}0d`,
                            border: `1px solid ${done ? "rgba(74,232,160,0.2)" : isBreak ? "var(--border)" : `${color}25`}`,
                            cursor: isBreak ? "default" : "pointer",
                            opacity: isBreak ? 0.7 : 1,
                            transition: "all 0.2s"
                          }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <Icon size={14} color={color} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 13, color: done ? "var(--text2)" : "var(--text)", textDecoration: done ? "line-through" : "none" }}>
                                    {session.task_title || session.activity}
                                  </div>
                                  {session.subject && <div style={{ fontSize: 11, color: color, marginTop: 2 }}>{session.subject}</div>}
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                                <span className={`badge ${done ? "badge-green" : ""}`} style={!done ? { background: `${color}18`, color } : {}}>
                                  {session.duration_minutes}min
                                </span>
                                {!isBreak && <span className={`badge`} style={{ background: `${DIFF_COLORS[session.difficulty]}15`, color: DIFF_COLORS[session.difficulty], fontSize: 9 }}>
                                  {session.difficulty}
                                </span>}
                              </div>
                            </div>
                            {session.notes && !isBreak && (
                              <div style={{ marginTop: 8, fontSize: 11, color: "var(--text2)", borderTop: "1px solid var(--border)", paddingTop: 7, lineHeight: 1.6 }}>
                                💡 {session.notes}
                              </div>
                            )}
                            {done && (
                              <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--green)" }}>
                                <CheckCircle size={11} /> Completed
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {}
                {timetable.weekly_summary && (
                  <div className="card" style={{ padding: "18px 20px", background: "linear-gradient(135deg, var(--surface) 0%, rgba(74,143,232,0.05) 100%)", border: "1px solid rgba(74,143,232,0.15)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--blue)", marginBottom: 8 }}>Weekly Plan</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{timetable.weekly_summary}</div>
                  </div>
                )}

                {}
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 14 }}>This Week's Subjects</div>
                  {(() => {
                    const subjectMap = {};
                    for (const day of days) {
                      for (const s of (day.sessions || [])) {
                        if (s.activity === "Break" || !s.subject) continue;
                        if (!subjectMap[s.subject]) subjectMap[s.subject] = { mins: 0, color: s.color || "var(--blue)" };
                        subjectMap[s.subject].mins += s.duration_minutes || 0;
                      }
                    }
                    const totalMins = Object.values(subjectMap).reduce((a, b) => a + b.mins, 0);
                    return Object.entries(subjectMap).map(([sub, data]) => (
                      <div key={sub} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: data.color, fontWeight: 600 }}>{sub}</span>
                          <span style={{ color: "var(--text2)" }}>{Math.round(data.mins / 60 * 10) / 10}h</span>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${totalMins > 0 ? (data.mins / totalMins) * 100 : 0}%`, background: data.color }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {}
                <div className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)", marginBottom: 12 }}>Was this plan helpful?</div>
                  {feedback ? (
                    <div style={{ textAlign: "center", fontSize: 13, color: "var(--text2)" }}>
                      {feedback === "helpful" ? "🙌 Thanks for the feedback!" : "📝 We'll improve it!"}
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 10 }}>
                      <button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(74,232,160,0.2)", gap: 6 }} onClick={() => sendFeedback("helpful")}>
                        <ThumbsUp size={14} /> Helpful
                      </button>
                      <button className="btn" style={{ flex: 1, justifyContent: "center", background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(232,74,111,0.2)", gap: 6 }} onClick={() => sendFeedback("not_helpful")}>
                        <ThumbsDown size={14} /> Improve
                      </button>
                    </div>
                  )}
                </div>

                {}
                {difficulty?.suggestion && (
                  <div className="card" style={{ padding: "18px 20px", background: "var(--gold-dim)", border: "1px solid rgba(232,200,74,0.2)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <Target size={14} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.7 }}>{difficulty.suggestion}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <style>{`@media(max-width:900px){
            div[style*="1fr 300px"]{grid-template-columns:1fr!important;}
          }`}</style>
        </>
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}

