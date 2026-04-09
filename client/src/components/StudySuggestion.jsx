import { useEffect, useState } from "react";
import { Sparkles, Clock, AlertCircle, CheckCircle, BookOpen, Zap } from "lucide-react";
import { Spinner, SkeletonCard } from "./UI";
import api from "../lib/api";

export default function StudySuggestion({ onSubjectSelect }) {
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("primary");

  useEffect(() => {
    async function fetchSuggestion() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/ai/study-suggestion");
        setSuggestion(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch study suggestions");
        console.error("Error fetching study suggestion:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestion();
  }, []);

  if (loading) {
    return (
      <div className="card-sm" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Sparkles size={18} color="var(--gold)" />
          <div className="skeleton" style={{ height: 18, width: "40%" }} />
        </div>
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (error || !suggestion) {
    return (
      <div className="card-sm" style={{ padding: 20, marginBottom: 16, background: "rgba(59, 130, 246, 0.05)", borderLeft: "3px solid var(--blue)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={18} color="var(--blue)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Ready to study?</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>Create subjects and tasks to get personalized study suggestions.</div>
          </div>
        </div>
      </div>
    );
  }

  const primary = suggestion.primary_suggestion;
  const subject = suggestion.subject_analysis;
  const alternatives = suggestion.alternatives || [];

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Primary Suggestion Card */}
      <div
        className="card-sm"
        style={{
          padding: 20,
          marginBottom: 12,
          background: `linear-gradient(135deg, ${subject.color}12 0%, ${subject.color}06 100%)`,
          borderLeft: `3px solid ${subject.color}`
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${subject.color}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Sparkles size={16} color={subject.color} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: subject.color }}>
                Focus on: {primary.subject_name || subject.subject_name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                {primary.why || subject.urgency_reasons?.[0] || "Top priority"}
              </div>
            </div>
          </div>
          {subject.urgency_score >= 50 && (
            <div style={{ background: "var(--red)", color: "white", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              🔥 Urgent
            </div>
          )}
        </div>

        {/* Main Action Card */}
        <div
          style={{
            background: "var(--surface)",
            padding: 14,
            borderRadius: 10,
            marginBottom: 12,
            border: "1px solid var(--border-light)"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <CheckCircle size={16} color={primary.difficulty_level === "easy" ? "var(--green)" : primary.difficulty_level === "hard" ? "var(--red)" : "var(--gold)"} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
                {primary.what_to_do || "Review your materials"}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text2)" }}>
              <Clock size={14} color="var(--gold)" />
              <span>{primary.estimated_time || "30 minutes"}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>
              Difficulty: <span style={{ fontWeight: 600, color: primary.difficulty_level === "easy" ? "var(--green)" : primary.difficulty_level === "hard" ? "var(--red)" : "var(--gold)" }}>
                {primary.difficulty_level || "Medium"}
              </span>
            </div>
          </div>
        </div>

        {/* Motivation */}
        {primary.motivation && (
          <div style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic", padding: "10px 0", borderTop: "1px solid var(--border-light)", paddingTop: 10 }}>
            💡 {primary.motivation}
          </div>
        )}

        {/* Next Step */}
        {primary.next_after_this && (
          <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--surface)", borderRadius: 6, fontSize: 12, color: "var(--text2)" }}>
            <span style={{ fontWeight: 600 }}>Next:</span> {primary.next_after_this}
          </div>
        )}
      </div>

      {/* Subject Details */}
      {subject && (
        <div className="card-sm" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--text2)", textTransform: "uppercase" }}>
            Subject Details
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {/* Mastery Score */}
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Mastery</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ flex: 1, height: 6, background: "var(--border-light)", borderRadius: 3, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      background: subject.mastery_score < 40 ? "var(--red)" : subject.mastery_score < 70 ? "var(--gold)" : "var(--green)",
                      width: `${Math.min(subject.mastery_score, 100)}%`,
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, minWidth: 35 }}>{Math.round(subject.mastery_score)}%</span>
              </div>
            </div>

            {/* Pending Tasks */}
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Pending Tasks</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>{subject.pending_tasks}</div>
            </div>

            {/* Available Materials */}
            <div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Materials</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{subject.available_materials}</div>
            </div>

            {/* Flashcards */}
            {subject.flashcard_stats && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>Flashcards</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {subject.flashcard_stats.active_cards || 0}
                </div>
              </div>
            )}
          </div>

          {/* Urgency Reasons */}
          {subject.urgency_reasons && subject.urgency_reasons.length > 0 && (
            <div style={{ padding: 10, background: "var(--surface)", borderRadius: 6, borderLeft: `2px solid ${subject.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: "var(--text2)" }}>Why this subject?</div>
              {subject.urgency_reasons.map((reason, i) => (
                <div key={i} style={{ fontSize: 11, color: "var(--text2)", marginBottom: i < subject.urgency_reasons.length - 1 ? 4 : 0 }}>
                  • {reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alternative Suggestions */}
      {alternatives.length > 0 && (
        <div className="card-sm" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10, color: "var(--text2)", textTransform: "uppercase" }}>
            Also Focus On
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  background: `${alt.color}08`,
                  border: `1px solid ${alt.color}20`,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = `${alt.color}15`)}
                onMouseLeave={(e) => (e.currentTarget.style.background = `${alt.color}08`)}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12, color: alt.color }}>
                      {alt.subject_name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                      {alt.pending_tasks} task{alt.pending_tasks !== 1 ? "s" : ""} • Mastery {Math.round(alt.mastery_score)}%
                    </div>
                  </div>
                  <Zap size={14} color={alt.urgency_score >= 30 ? "var(--red)" : "var(--gold)"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
