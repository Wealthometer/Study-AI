import { useEffect, useState } from "react";
import { Brain, TrendingUp, BookOpen, Flame, Target } from "lucide-react";
import { Spinner, SkeletonCard } from "./UI";
import api from "../lib/api";

export default function TopicSuggestions() {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get("/ai/suggest-topics");
        setSuggestions(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch suggestions");
        console.error("Error fetching topic suggestions:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSuggestions();
  }, []);

  if (loading) {
    return (
      <div className="card-sm" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Brain size={18} color="var(--purple)" />
          <div className="skeleton" style={{ height: 18, width: "40%" }} />
        </div>
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error || !suggestions) {
    return (
      <div className="card-sm" style={{ padding: 20, marginBottom: 16, background: "rgba(121, 134, 203, 0.05)", borderLeft: "3px solid var(--purple)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={18} color="var(--purple)" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Performance Analysis</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
              Complete some quizzes to get personalized topic recommendations.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasSuggestions = suggestions.suggestions && suggestions.suggestions.length > 0;

  return (
    <div style={{ marginBottom: 16 }}>
      {hasSuggestions && (
        <div className="card-sm" style={{ padding: 20, marginBottom: 14, background: "linear-gradient(135deg, rgba(121,134,203,0.08) 0%, rgba(155,116,240,0.08) 100%)", borderLeft: "3px solid var(--purple)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Brain size={18} color="var(--purple)" />
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--purple)" }}>
              AI-Powered Topic Recommendations
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
            Based on your quiz performance and mastery scores, here's what you should focus on next.
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 14 }}>
        {suggestions.suggestions?.map((suggestion, idx) => (
          <div key={idx} className="card" style={{ padding: "20px 22px" }}>
            {/* Subject Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid var(--border-light)" }}>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: 16, fontWeight: 700, color: "var(--text)" }}>
                {suggestion.subject || "Study Focus"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--purple)", background: "rgba(155,116,240,0.1)", padding: "4px 8px", borderRadius: 4 }}>
                <Target size={12} /> Priority
              </div>
            </div>

            {/* Weak Areas */}
            {suggestion.weak_areas && suggestion.weak_areas.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--red)", marginBottom: 8, textTransform: "uppercase" }}>
                  <Flame size={13} /> Weak Areas
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  {suggestion.weak_areas.map((area, i) => (
                    <div key={i} style={{ padding: "8px 10px", background: "rgba(232,74,111,0.1)", border: "1px solid rgba(232,74,111,0.2)", borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
                      📉 {area}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Topics */}
            {suggestion.recommended_topics && suggestion.recommended_topics.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 8, textTransform: "uppercase" }}>
                  <BookOpen size={13} /> What to Study
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
                  {suggestion.recommended_topics.map((topic, i) => (
                    <div key={i} style={{ padding: "10px 12px", background: "rgba(232,200,74,0.1)", border: "1px solid rgba(232,200,74,0.3)", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(232,200,74,0.15)")} onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(232,200,74,0.1)")}>
                      ✓ {topic}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Path */}
            {suggestion.learning_path && (
              <div style={{ marginBottom: 14, padding: 12, background: "var(--surface)", borderRadius: 8, borderLeft: "3px solid var(--blue)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Learning Path</div>
                <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
                  {suggestion.learning_path}
                </div>
              </div>
            )}

            {/* Estimated Hours & Resources */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {suggestion.estimated_hours && (
                <div style={{ padding: 10, background: "rgba(74,232,160,0.1)", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4, fontWeight: 600 }}>Estimated Time</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--green)" }}>
                    {suggestion.estimated_hours} <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>hours</span>
                  </div>
                </div>
              )}
              {suggestion.resources && (
                <div style={{ padding: 10, background: "rgba(74,143,232,0.1)", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 4, fontWeight: 600 }}>Resources</div>
                  <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600 }}>
                    {suggestion.resources}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!hasSuggestions && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text2)" }}>
          <Brain size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
          <div style={{ fontSize: 13, fontWeight: 600 }}>No suggestions yet</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            Take quizzes and complete tasks to get AI recommendations based on your performance.
          </div>
        </div>
      )}
    </div>
  );
}
