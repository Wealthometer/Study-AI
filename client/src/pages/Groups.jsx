import { useEffect, useState } from "react";
import { Users, Plus, Hash, MessageCircle, Share2, UserPlus } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import api from "../lib/api";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [cForm, setCForm] = useState({ name: "", description: "", subject: "", is_public: false });
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => { load(); }, []);
  async function load() {
    const { data } = await api.get("/groups");
    setGroups(data); setLoading(false);
  }

  async function loadDetails(id) {
    const { data } = await api.get(`/groups/${id}`);
    setDetails(data); setSelected(id);
  }

  async function create() {
    if (!cForm.name) return;
    setSaving(true);
    try {
      const { data } = await api.post("/groups", cForm);
      setToast({ msg: `Group created! Invite code: ${data.inviteCode}`, type: "success" });
      setCreateModal(false); setCForm({ name: "", description: "", subject: "", is_public: false }); await load();
    } catch { setToast({ msg: "Failed to create group", type: "error" }); }
    finally { setSaving(false); }
  }

  async function join() {
    if (!joinCode) return;
    setSaving(true);
    try {
      await api.post("/groups/join", { invite_code: joinCode });
      setToast({ msg: "Joined group!", type: "success" });
      setJoinModal(false); setJoinCode(""); await load();
    } catch (err) { setToast({ msg: err.response?.data?.message || "Invalid code", type: "error" }); }
    finally { setSaving(false); }
  }

  async function post() {
    if (!newPost.trim() || !selected) return;
    setPosting(true);
    try {
      await api.post(`/groups/${selected}/discuss`, { content: newPost });
      setNewPost(""); await loadDetails(selected);
    } catch { setToast({ msg: "Failed to post", type: "error" }); }
    finally { setPosting(false); }
  }

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">Community</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Study <em>Groups</em></h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setJoinModal(true)}><UserPlus size={13} /> Join Group</button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}><Plus size={13} /> Create Group</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "280px 1fr" : "1fr", gap: 20 }}>
        {}
        <div>
          {loading ? [1,2].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 10 }} />) :
           groups.length === 0 ? (
             <EmptyState icon={Users} title="No groups yet" desc="Create a study group or join one with an invite code." action={<button className="btn btn-primary btn-sm" onClick={() => setCreateModal(true)}>Create Group</button>} />
           ) : (
             groups.map(g => (
               <button key={g.id} onClick={() => loadDetails(g.id)} style={{
                 display: "block", width: "100%", textAlign: "left",
                 padding: "16px 18px", borderRadius: 12, marginBottom: 10, cursor: "pointer",
                 background: selected === g.id ? "var(--gold-dim)" : "var(--surface)",
                 border: `1px solid ${selected === g.id ? "rgba(232,200,74,0.25)" : "var(--border)"}`,
                 transition: "all 0.15s"
               }}>
                 <div style={{ fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{g.name}</div>
                 <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{g.description?.slice(0, 60) || g.subject || "Study Group"}</div>
                 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                   <span className="badge badge-gray"><Users size={9} /> {g.member_count}</span>
                   <span className="badge badge-blue">{g.my_role}</span>
                 </div>
               </button>
             ))
           )
          }
        </div>

        {}
        {selected && details && (
          <div>
            {}
            <div className="card" style={{ padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontFamily: "var(--ff-display)", fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{details.group.name}</h2>
                  {details.group.description && <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.6 }}>{details.group.description}</p>}
                </div>
                <div style={{ padding: "6px 12px", background: "var(--surface2)", borderRadius: 8, fontSize: 11, color: "var(--text2)", textAlign: "center" }}>
                  <div style={{ fontWeight: 700, color: "var(--gold)", fontSize: 16 }}>{details.group.invite_code}</div>
                  <div>Invite Code</div>
                </div>
              </div>
              {}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {details.members.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: "var(--surface2)", borderRadius: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg,var(--blue),var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700 }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</span>
                    {m.role !== "member" && <span className="badge badge-gold">{m.role}</span>}
                  </div>
                ))}
              </div>
            </div>

            {}
            <div className="card" style={{ padding: "20px 24px" }}>
              <h3 style={{ fontFamily: "var(--ff-display)", fontSize: 14, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
                <MessageCircle size={14} /> Discussion
              </h3>

              {details.discussions.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text2)", fontSize: 13, padding: "24px 0" }}>No messages yet. Start the conversation!</div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 16 }}>
                  {details.discussions.map(d => (
                    <div key={d.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,var(--gold),#c4900a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#07090f" }}>
                          {d.author_name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{d.author_name}</span>
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{new Date(d.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ padding: "10px 14px", background: "var(--surface2)", borderRadius: "4px 12px 12px 12px", fontSize: 13, lineHeight: 1.6 }}>{d.content}</div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <input className="input" style={{ flex: 1 }} placeholder="Write a message..." value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === "Enter" && post()} />
                <button className="btn btn-primary btn-sm" onClick={post} disabled={posting || !newPost.trim()}>
                  {posting ? <Spinner size={13} color="#07090f" /> : "Send"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {}
      {createModal && (
        <Modal title="Create Study Group" onClose={() => setCreateModal(false)}>
          <div className="field"><label>Group Name *</label><input className="input" placeholder="e.g. MongoDB Study Crew" value={cForm.name} onChange={e => setCForm(p => ({...p, name: e.target.value}))} /></div>
          <div className="field"><label>Description</label><textarea className="input" rows={2} placeholder="What will you study together?" value={cForm.description} onChange={e => setCForm(p => ({...p, description: e.target.value}))} style={{ resize: "vertical" }} /></div>
          <div className="field"><label>Subject Focus</label><input className="input" placeholder="e.g. Organic Chemistry" value={cForm.subject} onChange={e => setCForm(p => ({...p, subject: e.target.value}))} /></div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={create} disabled={saving || !cForm.name}>{saving ? <Spinner size={13} color="#07090f" /> : "Create Group"}</button>
          </div>
        </Modal>
      )}

      {}
      {joinModal && (
        <Modal title="Join a Study Group" onClose={() => setJoinModal(false)}>
          <div className="field"><label>Invite Code</label><input className="input" placeholder="Enter 8-character invite code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8} style={{ letterSpacing: "0.2em", textTransform: "uppercase", fontSize: 16 }} /></div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setJoinModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={join} disabled={saving || !joinCode}>{saving ? <Spinner size={13} color="#07090f" /> : "Join Group"}</button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
      <style>{`@media(max-width:900px){div[style*="280px 1fr"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}




