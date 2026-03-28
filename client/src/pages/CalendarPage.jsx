import { useEffect, useState } from "react";
import { Calendar, Plus, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal, Toast, Spinner, EmptyState } from "../components/UI";
import api from "../lib/api";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const TYPE_COLORS = { study:"var(--blue)", exam:"var(--red)", assignment:"var(--gold)", revision:"var(--purple)", break:"var(--green)" };

export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: "", start_time: "", end_time: "", event_type: "study", subject_id: "", notes: "" });
  const [aiForm, setAiForm] = useState({ start_date: "", end_date: "" });

  useEffect(() => { loadEvents(); api.get("/subjects").then(r => setSubjects(r.data)); }, [current]);

  async function loadEvents() {
    const y = current.getFullYear(), m = current.getMonth();
    const start = new Date(y, m, 1).toISOString();
    const end = new Date(y, m + 1, 0, 23, 59).toISOString();
    try {
      const { data } = await api.get(`/calendar?start=${start}&end=${end}`);
      setEvents(data);
    } finally { setLoading(false); }
  }

  async function save() {
    if (!form.title || !form.start_time) return;
    setSaving(true);
    try {
      await api.post("/calendar", form);
      setToast({ msg: "Event added!", type: "success" });
      setModal(false); setForm({ title: "", start_time: "", end_time: "", event_type: "study", subject_id: "", notes: "" });
      await loadEvents();
    } catch { setToast({ msg: "Failed to save", type: "error" }); }
    finally { setSaving(false); }
  }

  async function generateAI() {
    if (!aiForm.start_date || !aiForm.end_date) return setToast({ msg: "Select date range", type: "error" });
    setGenerating(true);
    try {
      const { data } = await api.post("/ai/calendar/generate", aiForm);
      setToast({ msg: `${data.events?.length} events generated!`, type: "success" });
      setAiModal(false); await loadEvents();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Generation failed", type: "error" });
    } finally { setGenerating(false); }
  }

  const year = current.getFullYear(), month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function getEventsForDay(day) {
    return events.filter(e => {
      const d = new Date(e.start_time);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  const isToday = (day) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">Study Calendar</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Academic <em>Schedule</em></h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setAiModal(true)}><Sparkles size={13} /> AI Generate</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={13} /> Add Event</button>
        </div>
      </div>

      {}
      <div className="card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setCurrent(new Date(year, month - 1))}><ChevronLeft size={18} /></button>
          <div style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 700 }}>{MONTHS[month]} {year}</div>
          <button className="btn btn-ghost btn-icon" onClick={() => setCurrent(new Date(year, month + 1))}><ChevronRight size={18} /></button>
        </div>

        {}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.08em", padding: "6px 0" }}>{d}</div>)}
        </div>

        {}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 72 }} />)}
          {}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const dayEvents = getEventsForDay(day);
            return (
              <div key={day} style={{
                minHeight: 72, padding: "6px 8px", borderRadius: 8,
                background: isToday(day) ? "var(--gold-dim)" : "var(--surface2)",
                border: isToday(day) ? "1px solid rgba(232,200,74,0.3)" : "1px solid transparent",
                transition: "background 0.15s"
              }}>
                <div style={{ fontSize: 12, fontWeight: isToday(day) ? 800 : 500, color: isToday(day) ? "var(--gold)" : "var(--text)", marginBottom: 4 }}>{day}</div>
                {dayEvents.slice(0, 2).map(ev => (
                  <div key={ev.id} style={{
                    fontSize: 9, padding: "2px 5px", borderRadius: 4, marginBottom: 2,
                    background: `${TYPE_COLORS[ev.event_type] || "var(--blue)"}20`,
                    color: TYPE_COLORS[ev.event_type] || "var(--blue)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                  }}>{ev.title}</div>
                ))}
                {dayEvents.length > 2 && <div style={{ fontSize: 9, color: "var(--text3)" }}>+{dayEvents.length - 2} more</div>}
              </div>
            );
          })}
        </div>
      </div>

      {}
      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>This Month's Events</h2>
        {loading ? <div className="skeleton" style={{ height: 60, borderRadius: 10 }} /> :
         events.length === 0 ? <EmptyState icon="📅" title="No events this month" desc="Add study sessions or let AI generate a study schedule for you." /> :
         events.slice(0, 8).map(ev => (
           <div key={ev.id} className="card-sm" style={{ padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
             <div style={{ width: 4, height: 36, borderRadius: 2, background: TYPE_COLORS[ev.event_type] || "var(--blue)", flexShrink: 0 }} />
             <div style={{ flex: 1 }}>
               <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.title}</div>
               <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                 {new Date(ev.start_time).toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })} · {new Date(ev.start_time).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
               </div>
             </div>
             <span className={`badge ${ev.is_ai_generated ? "badge-purple" : "badge-gray"}`}>{ev.is_ai_generated ? "AI" : ev.event_type}</span>
           </div>
         ))
        }
      </div>

      {}
      {modal && (
        <Modal title="Add Calendar Event" onClose={() => setModal(false)}>
          <div className="field"><label>Title *</label><input className="input" placeholder="e.g. Physics Study Session" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>Start Time *</label><input type="datetime-local" className="input" value={form.start_time} onChange={e => setForm(p => ({...p, start_time: e.target.value}))} /></div>
            <div className="field"><label>End Time</label><input type="datetime-local" className="input" value={form.end_time} onChange={e => setForm(p => ({...p, end_time: e.target.value}))} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>Type</label><select className="input select" value={form.event_type} onChange={e => setForm(p => ({...p, event_type: e.target.value}))}>{Object.keys(TYPE_COLORS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select></div>
            <div className="field"><label>Subject</label><select className="input select" value={form.subject_id} onChange={e => setForm(p => ({...p, subject_id: e.target.value}))}><option value="">None</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}</select></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving || !form.title}>{saving ? <Spinner size={13} color="#07090f" /> : "Add Event"}</button>
          </div>
        </Modal>
      )}

      {}
      {aiModal && (
        <Modal title="AI Study Calendar Generator" onClose={() => setAiModal(false)}>
          <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>AI will analyse your pending tasks and create an optimised study schedule for the selected date range.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="field"><label>Start Date *</label><input type="date" className="input" value={aiForm.start_date} onChange={e => setAiForm(p => ({...p, start_date: e.target.value}))} /></div>
            <div className="field"><label>End Date *</label><input type="date" className="input" value={aiForm.end_date} onChange={e => setAiForm(p => ({...p, end_date: e.target.value}))} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setAiModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={generateAI} disabled={generating}>{generating ? <><Spinner size={13} color="#07090f" /> Generating...</> : <><Sparkles size={13} /> Generate Schedule</>}</button>
          </div>
        </Modal>
      )}
      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}

