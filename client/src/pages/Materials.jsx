import { useEffect, useState, useRef } from "react";
import { Upload, FileText, Image, Mic, Video, Youtube, Trash2, CheckCircle, Clock, AlertCircle, Plus } from "lucide-react";
import { Modal, Toast, EmptyState, Spinner } from "../components/UI";
import api from "../lib/api";

const FILE_ICONS = { pdf: FileText, image: Image, audio: Mic, video: Video, youtube: Youtube, text: FileText };
const FILE_COLORS = { pdf: "var(--red)", image: "var(--blue)", audio: "var(--purple)", video: "var(--gold)", youtube: "var(--red)", text: "var(--green)" };

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [ytModal, setYtModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [ytForm, setYtForm] = useState({ title: "", youtube_url: "", subject_id: "" });
  const fileRef = useRef();
  const [uploadForm, setUploadForm] = useState({ title: "", subject_id: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [mRes, sRes] = await Promise.all([api.get("/materials"), api.get("/subjects")]);
      setMaterials(mRes.data); setSubjects(sRes.data);
    } finally { setLoading(false); }
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", uploadForm.title || file.name);
    if (uploadForm.subject_id) fd.append("subject_id", uploadForm.subject_id);
    try {
      await api.post("/materials/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setToast({ msg: "Material uploaded! Processing in background.", type: "success" });
      setModal(false); await load();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Upload failed", type: "error" });
    } finally { setUploading(false); }
  }

  async function handleYoutube() {
    if (!ytForm.youtube_url) return;
    setUploading(true);
    try {
      await api.post("/materials/youtube", ytForm);
      setToast({ msg: "YouTube link added!", type: "success" });
      setYtModal(false); setYtForm({ title: "", youtube_url: "", subject_id: "" });
      await load();
    } catch (err) {
      setToast({ msg: err.response?.data?.message || "Failed", type: "error" });
    } finally { setUploading(false); }
  }

  async function deleteMaterial(id) {
    if (!confirm("Delete this material?")) return;
    try { await api.delete(`/materials/${id}`); await load(); setToast({ msg: "Deleted", type: "success" }); }
    catch (err) { setToast({ msg: "Delete failed", type: "error" }); }
  }

  return (
    <div className="aFadeUp">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="section-eyebrow">Study Materials</div>
          <h1 className="section-title" style={{ fontSize: 26 }}>Your <em>Library</em></h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setYtModal(true)}><Youtube size={13} /> YouTube</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Upload size={13} /> Upload</button>
        </div>
      </div>

      {}
      <div
        className="card" style={{ padding: "28px", marginBottom: 24, border: dragOver ? "2px dashed var(--gold)" : "2px dashed var(--border)", cursor: "pointer", textAlign: "center", transition: "all 0.2s", background: dragOver ? "var(--gold-dim)" : "" }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.mp3,.mp4,.wav,.txt,.ppt,.pptx" onChange={e => handleUpload(e.target.files[0])} />
        <Upload size={28} color="var(--text3)" style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Drop files here or click to browse</div>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>Supports PDF, Images, Audio, Video, PowerPoint, Text · Max 50MB</div>
      </div>

      {}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      ) : materials.length === 0 ? (
        <EmptyState icon="📄" title="No materials yet" desc="Upload your PDFs, lecture notes, and study materials to generate flashcards and quizzes with AI." action={<button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>Upload First Material</button>} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {materials.map(m => {
            const Icon = FILE_ICONS[m.file_type] || FileText;
            const color = FILE_COLORS[m.file_type] || "var(--text2)";
            return (
              <div key={m.id} className="card" style={{ padding: "18px 20px", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = ""}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span className="badge badge-gray">{m.file_type.toUpperCase()}</span>
                      {m.subject_name && <span className="badge" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>{m.subject_name}</span>}
                      <span className={`badge ${m.status === "ready" ? "badge-green" : m.status === "failed" ? "badge-red" : "badge-gold"}`}>
                        {m.status === "ready" ? <><CheckCircle size={9} /> READY</> : m.status === "failed" ? <><AlertCircle size={9} /> FAILED</> : <><Clock size={9} /> PROCESSING</>}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon" onClick={() => deleteMaterial(m.id)} style={{ flexShrink: 0 }}><Trash2 size={13} color="var(--red)" /></button>
                </div>
                {m.extracted_text && (
                  <div style={{ marginTop: 10, fontSize: 11, color: "var(--text2)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {m.extracted_text.slice(0, 150)}...
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {}
      {modal && (
        <Modal title="Upload Material" onClose={() => setModal(false)}>
          <div className="field"><label>Title (optional)</label><input className="input" placeholder="e.g. Lecture 5 - Thermodynamics" value={uploadForm.title} onChange={e => setUploadForm(p => ({...p, title: e.target.value}))} /></div>
          <div className="field">
            <label>Subject (optional)</label>
            <select className="input select" value={uploadForm.subject_id} onChange={e => setUploadForm(p => ({...p, subject_id: e.target.value}))}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Spinner size={16} color="#07090f" /> : <><Upload size={14} /> Choose File</>}
          </button>
        </Modal>
      )}

      {}
      {ytModal && (
        <Modal title="Add YouTube Video" onClose={() => setYtModal(false)}>
          <div className="field"><label>Title</label><input className="input" placeholder="e.g. MIT OCW - Quantum Mechanics" value={ytForm.title} onChange={e => setYtForm(p => ({...p, title: e.target.value}))} /></div>
          <div className="field"><label>YouTube URL</label><input className="input" placeholder="https://youtube.com/watch?v=..." value={ytForm.youtube_url} onChange={e => setYtForm(p => ({...p, youtube_url: e.target.value}))} /></div>
          <div className="field">
            <label>Subject</label>
            <select className="input select" value={ytForm.subject_id} onChange={e => setYtForm(p => ({...p, subject_id: e.target.value}))}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary btn-sm" onClick={() => setYtModal(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleYoutube} disabled={uploading || !ytForm.youtube_url}>
              {uploading ? <Spinner size={14} color="#07090f" /> : "Add Video"}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}

