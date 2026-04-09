import { useEffect, useState } from "react";
import { BookOpen, Calendar, Clock, Zap, Download, Share2, ArrowRight } from "lucide-react";
import { Modal, Spinner, EmptyState } from "./UI";
import api from "../lib/api";

export default function StudyPlanGenerator({ materialId, subjectId, onClose }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState({
    duration_days: 7,
    intensity: "balanced"
  });

  const formatDate = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
  };

  async function generatePlan() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/ai/study-plan/generate", {
        subject_id: subjectId,
        material_id: materialId,
        duration_days: parseInt(config.duration_days),
        intensity: config.intensity
      });
      setPlan(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  const downloadPlan = () => {
    if (!plan) return;
    const json = JSON.stringify(plan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-plan-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  if (plan) {
    return (
      <Modal title="Study Plan" onClose={onClose}>
        <div style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{plan.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>{plan.overview}</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ padding: 10, background: "var(--surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Total Duration</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>
                  {plan.total_hours} hours
                </div>
              </div>
              <div style={{ padding: 10, background: "var(--surface)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Progression</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{plan.difficulty_progression}</div>
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              Daily Schedule
            </h4>
            {plan.daily_schedule?.map((day, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 12, background: "var(--surface)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Day {day.day}: {day.topic}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text2)" }}>
                    <Clock size={14} /> {day.duration_minutes} min
                  </div>
                </div>

                {day.topics?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Topics:</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {day.topics.map((t, idx) => (
                        <span key={idx} className="badge badge-blue" style={{ fontSize: 10 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {day.tasks?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Tasks:</div>
                    <ul style={{ fontSize: 12, color: "var(--text)", marginLeft: 16, lineHeight: 1.6 }}>
                      {day.tasks.map((t, idx) => (
                        <li key={idx}>✓ {t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-light)" }}>
                  <span style={{ background: day.difficulty_level === "easy" ? "var(--green)" : day.difficulty_level === "hard" ? "var(--red)" : "var(--gold)", padding: "2px 6px", borderRadius: 3, color: "white", fontWeight: 600 }}>
                    {day.difficulty_level?.toUpperCase()}
                  </span>
                  <span style={{ color: "var(--text2)" }}>Focus: {day.quiz_focus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <button className="btn btn-secondary btn-sm" onClick={downloadPlan}>
            <Download size={14} /> Download
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Generate Study Plan" onClose={onClose}>
      {error && (
        <div style={{ padding: 12, background: "rgba(232,74,111,0.1)", border: "1px solid var(--red)", borderRadius: 8, marginBottom: 14, color: "var(--red)", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text2)" }}>
          Duration (Days)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {[3, 5, 7, 14].map(days => (
            <button
              key={days}
              onClick={() => setConfig(c => ({ ...c, duration_days: days }))}
              style={{
                padding: "10px 8px",
                border: config.duration_days === days ? "2px solid var(--gold)" : "1px solid var(--border-light)",
                background: config.duration_days === days ? "rgba(232,200,74,0.1)" : "transparent",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                transition: "all 0.2s"
              }}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--text2)" }}>
          Intensity Level
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {["light", "balanced", "intense"].map(level => (
            <button
              key={level}
              onClick={() => setConfig(c => ({ ...c, intensity: level }))}
              style={{
                padding: "10px 8px",
                border: config.intensity === level ? "2px solid var(--blue)" : "1px solid var(--border-light)",
                background: config.intensity === level ? "rgba(74,143,232,0.1)" : "transparent",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 13,
                textTransform: "capitalize",
                transition: "all 0.2s"
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 18, padding: 12, background: "var(--surface)", borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Plan Preview</div>
        <div>
          • {config.duration_days} days of study
        </div>
        <div>
          • {config.intensity === "light" ? "1-2 hours/day" : config.intensity === "intense" ? "3-4 hours/day" : "2-3 hours/day"}
        </div>
        <div>
          • {config.intensity === "light" ? "Foundational topics" : config.intensity === "intense" ? "Advanced topics" : "Progressive difficulty"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={generatePlan}
          disabled={loading}
        >
          {loading ? <Spinner size={14} /> : <Zap size={14} />}
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>
    </Modal>
  );
}
