import { useState, useEffect } from "react";
import { Brain, Sparkles, CheckCircle, XCircle, Clock, Trophy } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import api from "../lib/api";

export default function Quiz() {
  const [phase, setPhase] = useState("home"); // home | quiz | results
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessionId, setSessionId] = useState("");
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [current, setCurrent] = useState(0);
  const [genForm, setGenForm] = useState({ material_id: "", subject_id: "", count: 10, difficulty: "medium", topic: "" });
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    async function load() {
      const [mRes, sRes] = await Promise.all([api.get("/materials"), api.get("/subjects")]);
      setMaterials(mRes.data.filter(m => m.status === "ready"));
      setSubjects(sRes.data);
    }
    load();
  }, []);

  async function generateQuiz() {
    if (!genForm.material_id) return setToast({ msg: "Select a material first", type: "error" });
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/quiz/generate", genForm);
      setQuestions(data.questions);
      setSessionId(data.session_id);
      setAnswers({});
      setCurrent(0);
      setStartTime(Date.now());
      setPhase("quiz");
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed to generate quiz", type: "error" });
    } finally { setGenerating(false); }
  }

  async function submitQuiz() {
    const answerList = questions.map(q => ({
      question_id: q.id,
      selected_answer: answers[q.id] || null,
      time_taken_seconds: Math.round((Date.now() - startTime) / 1000 / questions.length)
    }));
    setSubmitting(true);
    try {
      const { data } = await api.post("/ai/quiz/submit", { session_id: sessionId, answers: answerList });
      setResults(data);
      setPhase("results");
    } catch (err) {
      setToast({ msg: "Failed to submit quiz", type: "error" });
    } finally { setSubmitting(false); }
  }

  const q = questions[current];
  const OPTS = ["A", "B", "C", "D"];
  const optKeys = { A: "option_a", B: "option_b", C: "option_c", D: "option_d" };

  if (phase === "results" && results) {
    const pct = results.score;
    const grade = pct >= 90 ? { label: "Excellent!", color: "var(--green)" } :
      pct >= 75 ? { label: "Good Job!", color: "var(--blue)" } :
      pct >= 60 ? { label: "Keep Going", color: "var(--gold)" } :
      { label: "Needs Work", color: "var(--red)" };

    return (
      <div className="aFadeUp" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card" style={{ padding: "40px 36px", textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {pct >= 90 ? "🏆" : pct >= 75 ? "🎯" : pct >= 60 ? "📚" : "💪"}
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 28, fontWeight: 800, color: grade.color, marginBottom: 4 }}>{grade.label}</div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 52, fontWeight: 800, marginBottom: 4 }}>{pct}%</div>
          <div style={{ color: "var(--text2)", fontSize: 14 }}>{results.correct} correct out of {results.total} questions</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPhase("home")}>New Quiz</button>
            <button className="btn btn-primary btn-sm" onClick={() => setPhase("review")}>Review Answers</button>
          </div>
        </div>

        {}
        <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Answer Review</h2>
        {results.results.map((r, i) => {
          const origQ = questions.find(q => q.id === r.question_id);
          return (
            <div key={i} className="card-sm" style={{ padding: "16px 18px", marginBottom: 10, borderLeft: `3px solid ${r.is_correct ? "var(--green)" : "var(--red)"}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
                {r.is_correct ? <CheckCircle size={15} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />}
                <div style={{ fontSize: 13, fontWeight: 600 }}>{origQ?.question}</div>
              </div>
              {!r.is_correct && (
                <div style={{ fontSize: 12, color: "var(--text2)", paddingLeft: 23 }}>
                  <span style={{ color: "var(--red)" }}>Your answer: {r.selected || "None"}</span>
                  <span style={{ color: "var(--green)", marginLeft: 12 }}>Correct: {r.correct}</span>
                </div>
              )}
              {r.explanation && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 8, paddingLeft: 23, lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 8 }}>{r.explanation}</div>}
            </div>
          );
        })}
      </div>
    );
  }

  if (phase === "quiz" && q) {
    const answered = Object.keys(answers).length;
    return (
      <div className="aFadeUp" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm("Exit quiz? Progress will be lost.")) setPhase("home"); }}>Exit</button>
          <div style={{ fontSize: 13, color: "var(--text2)" }}>
            <Clock size={13} style={{ marginRight: 4 }} />{answered}/{questions.length} answered
          </div>
        </div>

        {}
        <div className="progress-bar" style={{ height: 6, marginBottom: 28 }}>
          <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%`, background: "var(--gold)" }} />
        </div>

        {}
        <div style={{ display: "flex", gap: 5, marginBottom: 24, flexWrap: "wrap" }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
              background: i === current ? "var(--gold)" : answers[questions[i].id] ? "var(--blue-dim)" : "var(--surface2)",
              color: i === current ? "#07090f" : answers[questions[i].id] ? "var(--blue)" : "var(--text2)",
            }}>{i + 1}</button>
          ))}
        </div>

        <div className="card" style={{ padding: "28px 32px", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <span className="badge badge-gray">Q{current + 1}</span>
            {q.topic && <span className="badge badge-blue">{q.topic}</span>}
            <span className={`badge ${q.difficulty === "hard" ? "badge-red" : q.difficulty === "medium" ? "badge-gold" : "badge-green"}`}>{q.difficulty}</span>
          </div>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 17, fontWeight: 700, lineHeight: 1.5, marginBottom: 24 }}>{q.question}</div>

          {OPTS.map(opt => {
            const text = q[optKeys[opt]];
            const isSelected = answers[q.id] === opt;
            return (
              <button key={opt} onClick={() => setAnswers(p => ({ ...p, [q.id]: opt }))} style={{
                display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left",
                padding: "14px 18px", borderRadius: 12, marginBottom: 10, cursor: "pointer",
                background: isSelected ? "var(--gold-dim)" : "var(--surface2)",
                border: `1px solid ${isSelected ? "rgba(232,200,74,0.3)" : "var(--border)"}`,
                transition: "all 0.15s ease"
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: isSelected ? "var(--gold)" : "var(--surface)",
                  border: `1px solid ${isSelected ? "var(--gold)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: isSelected ? "#07090f" : "var(--text2)"
                }}>{opt}</div>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text)", paddingTop: 2 }}>{text}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}>← Previous</button>
          {current < questions.length - 1 ? (
            <button className="btn btn-primary btn-sm" onClick={() => setCurrent(c => c + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={submitQuiz} disabled={submitting}>
              {submitting ? <Spinner size={13} color="#07090f" /> : <><Trophy size={13} /> Submit Quiz</>}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aFadeUp">
      <div style={{ marginBottom: 32 }}>
        <div className="section-eyebrow">AI Quiz Mode</div>
        <h1 className="section-title" style={{ fontSize: 26 }}>Test Your <em>Knowledge</em></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,340px)", gap: 24, alignItems: "start" }}>
        <div className="card" style={{ padding: "28px 32px" }}>
          <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 700, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={16} color="var(--purple)" /> Configure Quiz
          </h2>

          <div className="field">
            <label>Study Material *</label>
            <select className="input select" value={genForm.material_id} onChange={e => setGenForm(p => ({ ...p, material_id: e.target.value }))}>
              <option value="">Select material to quiz from</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Number of Questions</label>
              <select className="input select" value={genForm.count} onChange={e => setGenForm(p => ({ ...p, count: +e.target.value }))}>
                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
            <div className="field">
              <label>Difficulty</label>
              <select className="input select" value={genForm.difficulty} onChange={e => setGenForm(p => ({ ...p, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Focus Topic (optional)</label>
            <input className="input" placeholder="e.g. Electrochemistry, Organic reactions..." value={genForm.topic} onChange={e => setGenForm(p => ({ ...p, topic: e.target.value }))} />
          </div>
          <div className="field">
            <label>Subject (optional)</label>
            <select className="input select" value={genForm.subject_id} onChange={e => setGenForm(p => ({ ...p, subject_id: e.target.value }))}>
              <option value="">Link to subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 13, marginTop: 8 }} onClick={generateQuiz} disabled={generating || !genForm.material_id}>
            {generating ? <><Spinner size={15} color="#07090f" /> Generating quiz...</> : <><Sparkles size={15} /> Generate & Start Quiz</>}
          </button>
        </div>

        {}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { icon: "🧠", title: "AI-Generated Questions", desc: "Questions are tailored to your uploaded material using GPT-4o Mini." },
            { icon: "📊", title: "Instant Scoring", desc: "Get your score immediately with detailed explanations for each answer." },
            { icon: "🎯", title: "Track Progress", desc: "Quiz scores are tracked and feed into your subject mastery analytics." },
            { icon: "🔁", title: "Spaced Repetition", desc: "Retake quizzes on weak areas to reinforce long-term retention." },
          ].map((tip, i) => (
            <div key={i} className="card-sm" style={{ padding: "16px 18px" }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{tip.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      <style>{`@media(max-width:900px){div[style*="minmax(0, 340px)"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}

