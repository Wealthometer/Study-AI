import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart2, Target, Sparkles, TrendingUp } from "lucide-react";
import { ProgressRing, Spinner, Toast } from "../components/UI";
import api from "../lib/api";

const COLORS = ["var(--gold)","var(--blue)","var(--green)","var(--purple)","var(--red)","#ff9f40","#4adce8"];

export default function Analytics() {
  const [progress, setProgress] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, sRes] = await Promise.all([api.get("/ai/progress"), api.get("/subjects")]);
        setProgress(pRes.data); setSubjects(sRes.data);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  async function predictExam() {
    setPredicting(true);
    try {
      const { data } = await api.post("/ai/predict-exam", { subject_id: selectedSubject || undefined });
      setPrediction(data);
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Prediction failed — add materials first", type: "error" });
    } finally { setPredicting(false); }
  }

  const weeklyData = progress?.weekly?.map(w => ({
    date: new Date(w.date).toLocaleDateString("en", { weekday: "short" }),
    hours: parseFloat(w.hours) || 0,
    score: parseFloat(w.score) || 0
  })) || [];

  const subjectData = progress?.by_subject?.map((s, i) => ({
    name: s.subject_name?.slice(0, 10),
    mastery: parseFloat(s.mastery_score) || 0,
    quizAvg: Math.round(parseFloat(s.avg_quiz_score) || 0),
    color: COLORS[i % COLORS.length]
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: "var(--text2)", marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  ) : null;

  return (
    <div className="aFadeUp">
      <div style={{ marginBottom: 28 }}>
        <div className="section-eyebrow">Progress Analytics</div>
        <h1 className="section-title" style={{ fontSize: 26 }}>Academic <em>Insights</em></h1>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : (
        <>
          {/* Subject mastery rings */}
          {subjectData.length > 0 && (
            <div className="card" style={{ padding: "24px 28px", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 22 }}>Subject Mastery</h2>
              <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "center" }}>
                {subjectData.map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <ProgressRing pct={s.mastery} size={80} color={s.color} />
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 8, maxWidth: 80, margin: "8px auto 0" }}>{s.name}</div>
                    {s.quizAvg > 0 && <div style={{ fontSize: 10, color: "var(--text2)" }}>Quiz avg: {s.quizAvg}%</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 22 }}>
            {/* Weekly Study Hours */}
            <div className="card" style={{ padding: "24px 28px" }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={15} color="var(--gold)" /> Weekly Study Hours
              </h2>
              {weeklyData.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "24px 0" }}>No study sessions logged yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="hours" name="Hours" fill="var(--gold)" radius={[4, 4, 0, 0]} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quiz Score Trend */}
            <div className="card" style={{ padding: "24px 28px" }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <Target size={15} color="var(--blue)" /> Quiz Score Trend
              </h2>
              {weeklyData.filter(d => d.score > 0).length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "24px 0" }}>Take some quizzes to see trends</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" name="Score %" stroke="var(--blue)" strokeWidth={2} dot={{ fill: "var(--blue)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Subject mastery bar chart */}
          {subjectData.length > 0 && (
            <div className="card" style={{ padding: "24px 28px", marginBottom: 22 }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={15} color="var(--purple)" /> Subject Progress Comparison
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjectData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="mastery" name="Mastery %" radius={[4, 4, 0, 0]} fill="var(--purple)" opacity={0.85} />
                  <Bar dataKey="quizAvg" name="Quiz Avg %" radius={[4, 4, 0, 0]} fill="var(--green)" opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Flashcard stats */}
          {progress?.flashcard_stats && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 22 }}>
              {[
                { label: "Flashcards Created", value: progress.flashcard_stats.total || 0, color: "var(--gold)" },
                { label: "Total Reviews", value: progress.flashcard_stats.reviews || 0, color: "var(--blue)" },
                { label: "Avg Accuracy", value: `${Math.round(progress.flashcard_stats.accuracy || 0)}%`, color: "var(--green)" },
              ].map((s, i) => (
                <div key={i} className="card-sm" style={{ padding: "18px 20px" }}>
                  <div style={{ fontSize: 26, fontFamily: "var(--ff-display)", fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* AI Exam Prediction */}
          <div className="card" style={{ padding: "24px 28px", background: "linear-gradient(135deg, var(--surface) 0%, rgba(155,116,240,0.06) 100%)", border: "1px solid rgba(155,116,240,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={15} color="var(--purple)" /> AI Exam Predictions
              </h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {subjects.length > 0 && (
                  <select className="input select" style={{ fontSize: 12, padding: "8px 12px", width: 180 }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                    <option value="">All subjects</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                )}
                <button className="btn btn-secondary btn-sm" onClick={predictExam} disabled={predicting}>
                  {predicting ? <><Spinner size={13} /> Analysing...</> : <><Sparkles size={13} /> Predict</>}
                </button>
              </div>
            </div>

            {!prediction ? (
              <div style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.8 }}>
                Click <strong style={{ color: "var(--purple)" }}>Predict</strong> to analyse your uploaded materials and predict likely exam topics. Make sure you have processed materials uploaded first.
              </div>
            ) : (
              <>
                {prediction.study_advice && (
                  <div style={{ padding: "12px 16px", background: "rgba(155,116,240,0.1)", border: "1px solid rgba(155,116,240,0.15)", borderRadius: 10, marginBottom: 18, fontSize: 13, lineHeight: 1.7, color: "var(--text)" }}>
                    💡 {prediction.study_advice}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                  {prediction.predictions?.map((p, i) => (
                    <div key={i} className="card-sm" style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{p.topic}</div>
                        <span className={`badge ${p.likelihood === "high" ? "badge-red" : p.likelihood === "medium" ? "badge-gold" : "badge-green"}`}>
                          {p.likelihood?.toUpperCase()} {p.confidence}%
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, marginBottom: 10 }}>{p.reasoning}</div>
                      {p.suggested_questions?.slice(0, 2).map((q, qi) => (
                        <div key={qi} style={{ fontSize: 11, color: "var(--text3)", paddingLeft: 10, borderLeft: "2px solid var(--border)", marginBottom: 4, lineHeight: 1.6 }}>
                          {q}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
