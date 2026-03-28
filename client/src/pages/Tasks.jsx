import { useEffect, useState } from "react";
import { Plus, Trash2, CheckCircle, Clock, Circle, Calendar, Filter } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import api from "../lib/api";

export function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", subject_id: "", description: "", deadline: "", difficulty: "medium", estimated_hours: 2 });

  useEffect(() => { load(); }, []);
  async function load() {
    const [tRes, sRes] = await Promise.all([api.get("/tasks"), api.get("/subjects")]);
    setTasks(tRes.data); setSubjects(sRes.data); setLoading(false);
  }

  async function save() {
    if (!form.title) return;
    setSaving(true);
    try {
      await api.post("/tasks", form);
      setToast({ msg: "Task added!", type: "success" });
      setModal(false); setForm({ title: "", subject_id: "", description: "", deadline: "", difficulty: "medium", estimated_hours: 2 });
      await load();
    } catch { setToast({ msg: "Failed to save", type: "error" }); }
    finally { setSaving(false); }
  }

  async function complete(id) {
    await api.put(`/tasks/${id}`, { status: "completed" }); await load();
  }

  async function del(id) {
    if (!confirm("Delete task?")) return;
    await api.delete(`/tasks/${id}`); await load();
  }

  const DIFF_COLORS = { easy: "var(--green)", medium: "var(--gold)", hard: "var(--red)" };
  const filtered = tasks.filter(t => filter === "all" ? true : filter === "completed" ? t.status === "completed" : t.status !== "completed");

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">Task Manager</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Your <em>Tasks</em></h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={13} /> New Task</button>
      </div>

      <div className="tabs" style={{ marginBottom: 18, gap: 6 }}>
        {[["all", "All"], ["pending", "Pending"], ["completed", "Completed"]].map(([v, l]) => (
          <button key={v} className={`chip ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>
            {l} ({v === "all" ? tasks.length : v === "completed" ? tasks.filter(t => t.status === "completed").length : tasks.filter(t => t.status !== "completed").length})
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton" style={{ height: 80, borderRadius: 12 }} /> :
       filtered.length === 0 ? <EmptyState icon={CheckCircle} title="No tasks here" desc="Add academic tasks to track your workload." action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>Add Task</button>} /> :
       filtered.map(t => {
         const days = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null;
         const overdue = days !== null && days < 0 && t.status !== "completed";
         return (
           <div key={t.id} className="card-sm" style={{ padding: "16px 18px", marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start", opacity: t.status === "completed" ? 0.65 : 1 }}>
             <button onClick={() => t.status !== "completed" && complete(t.id)} style={{ flexShrink: 0, marginTop: 2 }}>
               {t.status === "completed" ? <CheckCircle size={18} color="var(--green)" /> : <Circle size={18} color="var(--text3)" />}
             </button>
             <div style={{ flex: 1, minWidth: 0 }}>
               <div style={{ fontWeight: 600, fontSize: 13, textDecoration: t.status === "completed" ? "line-through" : "none", marginBottom: 5 }}>{t.title}</div>
               <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                 {t.subject_name && <span className="badge badge-blue">{t.subject_name}</span>}
                 <span className="badge" style={{ background: `${DIFF_COLORS[t.difficulty]}18`, color: DIFF_COLORS[t.difficulty] }}>{t.difficulty}</span>
                 {t.estimated_hours && <span style={{ fontSize: 11, color: "var(--text2)" }}><Clock size={10} style={{ marginRight: 3 }} />{t.estimated_hours}h</span>}
                 {days !== null && <span className={`badge ${overdue ? "badge-red" : days <= 2 ? "badge-gold" : "badge-gray"}`}>{overdue ? "OVERDUE" : days === 0 ? "TODAY" : `${days}d`}</span>}
               </div>
             </div>
             <button className="btn btn-ghost btn-icon" onClick={() => del(t.id)}><Trash2 size={13} color="var(--red)" /></button>
           </div>
         );
       })}

      {modal && (
        <Modal title="Add Task" onClose={() => setModal(false)}>
          <div className="field"><label>Title *</label><input className="input" placeholder="e.g. Write thermodynamics lab report" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>Subject</label><select className="input select" value={form.subject_id} onChange={e => setForm(p => ({...p, subject_id: e.target.value}))}><option value="">None</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}</select></div>
            <div className="field"><label>Difficulty</label><select className="input select" value={form.difficulty} onChange={e => setForm(p => ({...p, difficulty: e.target.value}))}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            <div className="field"><label>Deadline</label><input type="date" className="input" value={form.deadline} onChange={e => setForm(p => ({...p, deadline: e.target.value}))} /></div>
            <div className="field"><label>Est. Hours</label><input type="number" className="input" min={0.5} max={50} step={0.5} value={form.estimated_hours} onChange={e => setForm(p => ({...p, estimated_hours: +e.target.value}))} /></div>
          </div>
          <div className="field"><label>Description</label><textarea className="input" rows={2} placeholder="Optional notes..." value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} style={{ resize: "vertical" }} /></div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.title}>{saving ? <Spinner size={13} color="#07090f" /> : "Add Task"}</button>
          </div>
        </Modal>
      )}
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
export default Tasks;



