import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, BookOpen } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import api from "../lib/api";

const PALETTE = ["#e8c84a","#4a8fe8","#4ae8a0","#9b74f0","#e84a6f","#ff9f40","#4adce8","#e8784a"];

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject_name: "", priority_level: "medium", color: "#e8c84a" });

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await api.get("/subjects");
    setSubjects(data); setLoading(false);
  }

  async function save() {
    if (!form.subject_name) return;
    setSaving(true);
    try {
      if (editing) await api.put(`/subjects/${editing.id}`, form);
      else await api.post("/subjects", form);
      setToast({ msg: editing ? "Subject updated!" : "Subject added!", type: "success" });
      closeModal(); await load();
    } catch { setToast({ msg: "Failed", type: "error" }); }
    finally { setSaving(false); }
  }

  async function del(id) {
    if (!confirm("Delete subject and all associated data?")) return;
    await api.delete(`/subjects/${id}`); await load();
  }

  function openEdit(s) {
    setEditing(s); setForm({ subject_name: s.subject_name, priority_level: s.priority_level, color: s.color || "#e8c84a" }); setModal(true);
  }

  function closeModal() {
    setModal(false); setEditing(null); setForm({ subject_name: "", priority_level: "medium", color: "#e8c84a" });
  }

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">Course Management</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Your <em>Subjects</em></h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={13} /> Add Subject</button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
        </div>
      ) : subjects.length === 0 ? (
        <EmptyState icon="📚" title="No subjects added" desc="Add your university courses to organise tasks, materials and track progress per subject." action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>Add First Subject</button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {subjects.map(s => (
            <div key={s.id} className="card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color || "#e8c84a"}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <BookOpen size={18} color={s.color || "#e8c84a"} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{s.subject_name}</div>
                    <span className={`badge ${s.priority_level === "high" ? "badge-red" : s.priority_level === "medium" ? "badge-gold" : "badge-green"}`}>{s.priority_level}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-ghost btn-icon" onClick={() => openEdit(s)}><Edit2 size={12} /></button>
                  <button className="btn btn-ghost btn-icon" onClick={() => del(s.id)}><Trash2 size={12} color="var(--red)" /></button>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: "var(--text2)" }}>Mastery</span>
                  <span style={{ fontWeight: 700, color: s.color || "var(--gold)" }}>{s.mastery_score || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${s.mastery_score || 0}%`, background: s.color || "var(--gold)" }} />
                </div>
              </div>
              {s.task_count > 0 && <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)" }}>{s.task_count} task{s.task_count > 1 ? "s" : ""} linked</div>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editing ? "Edit Subject" : "Add Subject"} onClose={closeModal}>
          <div className="field"><label>Subject Name *</label><input className="input" placeholder="e.g. Organic Chemistry, Linear Algebra" value={form.subject_name} onChange={e => setForm(p => ({...p, subject_name: e.target.value}))} /></div>
          <div className="field"><label>Priority Level</label><select className="input select" value={form.priority_level} onChange={e => setForm(p => ({...p, priority_level: e.target.value}))}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div className="field">
            <label>Colour</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => setForm(p => ({...p, color: c}))} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: form.color === c ? "2px solid white" : "2px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.subject_name}>{saving ? <Spinner size={13} color="#07090f" /> : editing ? "Update" : "Add Subject"}</button>
          </div>
        </Modal>
      )}
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
