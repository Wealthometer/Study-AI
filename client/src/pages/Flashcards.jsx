import { useEffect, useState } from "react";
import { Zap, RefreshCw, ChevronLeft, ChevronRight, Check, X, Sparkles, Archive, Trash2 } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import StudySuggestion from "../components/StudySuggestion";
import api from "../lib/api";

export default function Flashcards() {
  const [flashcards, setFlashcards] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genModal, setGenModal] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [toast, setToast] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ material_id: "", subject_id: "", count: 10, topic: "" });
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [fRes, mRes, sRes] = await Promise.all([api.get("/ai/flashcards"), api.get("/materials"), api.get("/subjects")]);
      setFlashcards(fRes.data); setMaterials(mRes.data.filter(m => m.status === "ready")); setSubjects(sRes.data);
    } finally { setLoading(false); }
  }

  async function generate() {
    if (!genForm.material_id) return setToast({ msg: "Select a material first", type: "error" });
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/flashcards/generate", genForm);
      setToast({ msg: `${data.flashcards.length} flashcards generated!`, type: "success" });
      setGenModal(false); await load();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Generation failed", type: "error" });
    } finally { setGenerating(false); }
  }

  async function review(id, correct) {
    try { await api.post(`/ai/flashcards/${id}/review`, { correct }); }
    catch {}
    if (studyIndex < filtered.length - 1) { setStudyIndex(i => i + 1); setFlipped(false); }
    else { setStudyMode(false); setStudyIndex(0); setFlipped(false); setToast({ msg: "Study session complete!", type: "success" }); }
  }

  async function updateFlashcardStatus(id, status) {
    try {
      await api.put(`/ai/flashcards/${id}`, { status });
      await load();
      setToast({ msg: status === "archived" ? "Flashcard archived" : "Flashcard restored", type: "success" });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Unable to update flashcard.", type: "error" });
    }
  }

  async function deleteFlashcard(id) {
    if (!confirm("Remove this flashcard?")) return;
    try {
      await api.delete(`/ai/flashcards/${id}`);
      await load();
      setToast({ msg: "Flashcard deleted", type: "success" });
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Unable to delete flashcard.", type: "error" });
    }
  }

  const filtered = flashcards.filter(f => (statusFilter === "all" || f.status === statusFilter) && (filter === "all" || f.difficulty === filter));
  const activeCards = flashcards.filter(f => f.status !== "archived" && (filter === "all" || f.difficulty === filter));
  const current = filtered[studyIndex];

  if (studyMode && current) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }} className="aFadeUp">
        <div style={{ width: "100%", maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStudyMode(false); setStudyIndex(0); setFlipped(false); }}><X size={14} /> Exit</button>
            <span style={{ fontSize: 13, color: "var(--text2)" }}>{studyIndex + 1} / {filtered.length}</span>
          </div>

          {}
          <div className="progress-bar" style={{ marginBottom: 28, height: 6 }}>
            <div className="progress-fill" style={{ width: `${(studyIndex / filtered.length) * 100}%`, background: "var(--gold)" }} />
          </div>

          {}
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              background: flipped ? "linear-gradient(135deg, var(--surface) 0%, rgba(74,143,232,0.08) 100%)" : "linear-gradient(135deg, var(--surface) 0%, rgba(232,200,74,0.08) 100%)",
              border: `1px solid ${flipped ? "rgba(74,143,232,0.2)" : "rgba(232,200,74,0.2)"}`,
              borderRadius: 20, padding: "48px 40px", textAlign: "center",
              cursor: "pointer", minHeight: 240, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 12,
              transition: "all 0.3s ease", userSelect: "none"
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", color: flipped ? "var(--blue)" : "var(--gold)", marginBottom: 8 }}>
              {flipped ? "ANSWER" : "QUESTION"}
            </div>
            <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 700, lineHeight: 1.5 }}>
              {flipped ? current.answer : current.question}
            </div>
            {current.topic && !flipped && <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 8 }}>Topic: {current.topic}</div>}
            {!flipped && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 16 }}>Tap to reveal answer</div>}
          </div>

          {flipped && (
            <div style={{ display: "flex", gap: 14, marginTop: 20, justifyContent: "center" }} className="aFadeUp">
              <button className="btn btn-danger" style={{ flex: 1, maxWidth: 200, justifyContent: "center", padding: 13 }} onClick={() => review(current.id, false)}>
                <X size={16} /> Got it wrong
              </button>
              <button className="btn btn-primary" style={{ flex: 1, maxWidth: 200, justifyContent: "center", padding: 13 }} onClick={() => review(current.id, true)}>
                <Check size={16} /> Got it right
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">AI Flashcards</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Flashcard <em>Deck</em></h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(statusFilter !== "archived" && activeCards.length > 0) && <button className="btn btn-secondary btn-sm" onClick={() => { setStudyMode(true); setStudyIndex(0); setFlipped(false); }}><RefreshCw size={13} /> Study Now ({activeCards.length})</button>}
          <button className="btn btn-primary btn-sm" onClick={() => setGenModal(true)}><Sparkles size={13} /> Generate</button>
        </div>
      </div>

      {}
      <div className="tabs" style={{ marginBottom: 14, gap: 6 }}>
        {[["all", "All"], ["active", "Active"], ["archived", "Archived"]].map(([value, label]) => (
          <button key={value} className={`chip ${statusFilter === value ? "active" : ""}`} onClick={() => { setStatusFilter(value); setStudyMode(false); setStudyIndex(0); }}>
            {label} {value === "all" ? `(${flashcards.length})` : `(${flashcards.filter(c => c.status === value).length})`}
          </button>
        ))}
      </div>
      <div className="tabs" style={{ marginBottom: 20, gap: 6 }}>
        {["all","easy","medium","hard"].map(f => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === "all" ? `(${flashcards.length})` : `(${flashcards.filter(c => c.difficulty === f).length})`}
          </button>
        ))}
      </div>

      {/* Study Suggestion */}
      {!loading && flashcards.length > 0 && <StudySuggestion />}

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Zap} title="No flashcards yet" desc="Upload a study material and generate AI flashcards in seconds." action={<button className="btn btn-primary btn-sm" onClick={() => setGenModal(true)}>Generate Flashcards</button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
          {filtered.map((card, i) => {
            const archived = card.status === "archived";
            return (
              <div key={card.id} className="card" style={{ padding: "18px 20px", animationDelay: `${i * 0.04}s`, opacity: archived ? 0.64 : 1, border: archived ? "1px dashed var(--border)" : undefined }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span className={`badge ${card.difficulty === "hard" ? "badge-red" : card.difficulty === "medium" ? "badge-gold" : "badge-green"}`}>{card.difficulty?.toUpperCase()}</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{card.subject_name || card.topic}</span>
                    {archived && <span className="badge badge-gray">Archived</span>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {archived ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => updateFlashcardStatus(card.id, "active")}>
                        <RefreshCw size={14} /> Restore
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => updateFlashcardStatus(card.id, "archived")}>
                        <Archive size={14} /> Archive
                      </button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteFlashcard(card.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 12, color: "var(--text)" }}>{card.question}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", borderTop: "1px solid var(--border)", paddingTop: 10, lineHeight: 1.6 }}>{card.answer}</div>
                {card.times_reviewed > 0 && (
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8 }}>
                    Reviewed {card.times_reviewed}x · {Math.round((card.correct_count / card.times_reviewed) * 100)}% accuracy
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {}
      {genModal && (
        <Modal title="Generate AI Flashcards" onClose={() => setGenModal(false)}>
          <div className="field">
            <label>Study Material *</label>
            <select className="input select" value={genForm.material_id} onChange={e => setGenForm(p => ({...p, material_id: e.target.value}))} required>
              <option value="">Select material</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field">
              <label>Subject</label>
              <select className="input select" value={genForm.subject_id} onChange={e => setGenForm(p => ({...p, subject_id: e.target.value}))}>
                <option value="">Optional</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Number of Cards</label>
              <select className="input select" value={genForm.count} onChange={e => setGenForm(p => ({...p, count: +e.target.value}))}>
                {[5,10,15,20,30].map(n => <option key={n} value={n}>{n} cards</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Focus Topic (optional)</label>
            <input className="input" placeholder="e.g. Photosynthesis, Newton's Laws..." value={genForm.topic} onChange={e => setGenForm(p => ({...p, topic: e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setGenModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={generate} disabled={generating || !genForm.material_id}>
              {generating ? <><Spinner size={13} color="#07090f" /> Generating...</> : <><Sparkles size={13} /> Generate</>}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}





