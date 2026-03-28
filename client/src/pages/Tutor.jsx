import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Sparkles, FileText, Trash2, Copy, RotateCcw,
  BookOpen, ChevronDown, Mic, Paperclip, Info,
  CheckCheck, Clock, Hash, Star, Zap, Brain
} from "lucide-react";
import { Spinner, Toast } from "../components/UI";
import api from "../lib/api";

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre style="background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 16px;margin:10px 0;overflow-x:auto;font-size:12px;line-height:1.6"><code style="color:#c8f468;font-family:monospace">${code.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 7px;border-radius:5px;font-size:12px;font-family:monospace;color:#e8c84a">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e8ecf4;font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<div style="font-family:var(--ff-display);font-size:14px;font-weight:700;margin:14px 0 6px;color:#e8c84a">$1</div>')
    .replace(/^## (.+)$/gm, '<div style="font-family:var(--ff-display);font-size:15px;font-weight:800;margin:16px 0 8px;color:#e8ecf4">$1</div>')
    .replace(/^# (.+)$/gm, '<div style="font-family:var(--ff-display);font-size:18px;font-weight:800;margin:18px 0 10px;color:#e8c84a">$1</div>')
    .replace(/^\s*[-*] (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="color:#e8c84a;margin-top:2px;flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/^\s*(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0;padding-left:4px"><span style="color:#4a8fe8;font-weight:700;flex-shrink:0">$1.</span><span>$2</span></div>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ─── Suggested prompts by category ───────────────────────────────────────────
const SUGGESTION_GROUPS = [
  {
    label: "Understand",
    icon: BookOpen,
    color: "var(--blue)",
    prompts: [
      "Explain this topic in simple terms",
      "Give me a real-world example of this",
      "What are the most important concepts here?",
    ],
  },
  {
    label: "Exam Prep",
    icon: Star,
    color: "var(--gold)",
    prompts: [
      "What exam questions might come from this?",
      "Summarise the key points I need to remember",
      "Create a quick revision checklist",
    ],
  },
  {
    label: "Deep Dive",
    icon: Brain,
    color: "var(--purple)",
    prompts: [
      "What are common misconceptions about this?",
      "Compare and contrast the main theories",
      "Walk me through this step by step",
    ],
  },
  {
    label: "Quick Help",
    icon: Zap,
    color: "var(--green)",
    prompts: [
      "I'm stuck — can you re-explain differently?",
      "What should I study first?",
      "Make this into a story I can remember",
    ],
  },
];

// ─── Single message bubble ────────────────────────────────────────────────────
function MessageBubble({ msg, onCopy, isLatest }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopy?.();
  }

  return (
    <div
      className="aFadeUp"
      style={{
        display: "flex",
        gap: 12,
        marginBottom: 20,
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isUser
            ? "linear-gradient(135deg,var(--blue),var(--purple))"
            : "linear-gradient(135deg,var(--gold),#b8960a)",
          fontSize: 13,
          fontWeight: 800,
          fontFamily: "var(--ff-display)",
          boxShadow: isUser
            ? "0 4px 12px rgba(74,143,232,0.3)"
            : "0 4px 12px rgba(232,200,74,0.3)",
        }}
      >
        {isUser ? "U" : <Sparkles size={15} color="#07090f" />}
      </div>

      {/* Content */}
      <div style={{ maxWidth: "76%", minWidth: 0 }}>
        {/* Sender label */}
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isUser ? "var(--blue)" : "var(--gold)",
            marginBottom: 5,
            textAlign: isUser ? "right" : "left",
          }}
        >
          {isUser ? "You" : "Spark.E"}
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: isUser ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
            background: isUser
              ? "linear-gradient(135deg,var(--blue-dim),rgba(74,143,232,0.08))"
              : "var(--surface2)",
            border: `1px solid ${isUser ? "rgba(74,143,232,0.2)" : "var(--border)"}`,
            fontSize: 13,
            lineHeight: 1.8,
            color: "var(--text)",
            position: "relative",
          }}
        >
          {msg.loading ? (
            <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "2px 0" }}>
              {[0, 0.2, 0.4].map((d, i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--gold)",
                    animation: `pulse 1.2s ${d}s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
            />
          )}
        </div>

        {/* Actions */}
        {!msg.loading && !isUser && (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 6,
              opacity: 0.6,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
          >
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 10,
                color: "var(--text2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "3px 8px",
                borderRadius: 6,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--surface2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "none")
              }
            >
              {copied ? (
                <CheckCheck size={11} color="var(--green)" />
              ) : (
                <Copy size={11} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* Timestamp */}
        {msg.time && (
          <div
            style={{
              fontSize: 10,
              color: "var(--text3)",
              marginTop: 3,
              textAlign: isUser ? "right" : "left",
            }}
          >
            {msg.time}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Tutor component ─────────────────────────────────────────────────────
export default function Tutor() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi! I'm **Spark.E** ⚡ — your personal AI study tutor.\n\nI can help you:\n- **Understand** complex concepts from your materials\n- **Prepare** for exams with targeted questions\n- **Summarise** lectures and notes instantly\n- **Explain** topics in plain language\n\nSelect a study material below for context-aware answers, or just ask me anything!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [materials, setMaterials] = useState([]);
  const [selectedMat, setSelectedMat] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [activeSuggGroup, setActiveSuggGroup] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [matDropdown, setMatDropdown] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const MAX_CHARS = 1000;

  useEffect(() => {
    api
      .get("/materials")
      .then((r) => setMaterials(r.data.filter((m) => m.status === "ready")));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectedMatObj = materials.find((m) => m.id == selectedMat);

  async function send(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setCharCount(0);
    setShowSuggestions(false);

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((p) => [...p, { role: "user", content: msg, time }]);

    // Add loading bubble
    setMessages((p) => [
      ...p,
      { role: "assistant", content: "", loading: true },
    ]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/tutor/chat", {
        message: msg,
        material_id: selectedMat || undefined,
        session_id: sessionId,
      });

      setMessages((p) => {
        const copy = [...p];
        copy[copy.length - 1] = {
          role: "assistant",
          content: data.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        return copy;
      });
    } catch (err) {
      setMessages((p) => {
        const copy = [...p];
        copy[copy.length - 1] = {
          role: "assistant",
          content:
            "⚠️ Something went wrong. Please check that your `OPENROUTER_API_KEY` is set in `.env` and try again.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        return copy;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! What would you like to study? 📚",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setShowSuggestions(true);
  }

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 56px)",
        maxHeight: "90vh",
        position: "relative",
      }}
      className="aFadeUp"
    >
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexShrink: 0,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Spark.E logo */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: "linear-gradient(135deg,var(--gold),#b8960a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(232,200,74,0.3)",
            }}
          >
            <Sparkles size={20} color="#07090f" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.3px",
              }}
            >
              Spark.E{" "}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--gold-dim)",
                  color: "var(--gold)",
                  padding: "2px 7px",
                  borderRadius: 100,
                  border: "1px solid rgba(232,200,74,0.2)",
                  letterSpacing: "0.08em",
                  fontFamily: "var(--ff-body)",
                }}
              >
                AI TUTOR
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--green)",
                  display: "inline-block",
                  marginRight: 5,
                  animation: "pulse 2s ease infinite",
                }}
              />
              Online · {userMsgCount} messages this session
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Material selector */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMatDropdown((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 14px",
                borderRadius: 10,
                background: selectedMat
                  ? "var(--blue-dim)"
                  : "var(--surface2)",
                border: `1px solid ${selectedMat ? "rgba(74,143,232,0.25)" : "var(--border)"}`,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                color: selectedMat ? "var(--blue)" : "var(--text2)",
                transition: "all 0.15s",
                maxWidth: 220,
              }}
            >
              <FileText size={13} />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedMatObj
                  ? selectedMatObj.title.slice(0, 28)
                  : "Select material"}
              </span>
              <ChevronDown
                size={12}
                style={{
                  transition: "transform 0.2s",
                  transform: matDropdown ? "rotate(180deg)" : "",
                  flexShrink: 0,
                }}
              />
            </button>

            {matDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  right: 0,
                  background: "var(--surface)",
                  border: "1px solid var(--border2)",
                  borderRadius: 12,
                  minWidth: 260,
                  zIndex: 200,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  overflow: "hidden",
                  animation: "scalePop 0.15s ease",
                }}
              >
                <button
                  onClick={() => {
                    setSelectedMat("");
                    setMatDropdown(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "11px 14px",
                    background:
                      !selectedMat ? "var(--gold-dim)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    color: !selectedMat ? "var(--gold)" : "var(--text2)",
                    textAlign: "left",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    !selectedMat ||
                    (e.currentTarget.style.background = "var(--surface2)")
                  }
                  onMouseLeave={(e) =>
                    !selectedMat ||
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <Sparkles size={12} /> No context (general tutor)
                </button>
                {materials.length === 0 ? (
                  <div
                    style={{
                      padding: "12px 14px",
                      fontSize: 12,
                      color: "var(--text3)",
                    }}
                  >
                    No materials uploaded yet
                  </div>
                ) : (
                  materials.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        setSelectedMat(m.id);
                        setMatDropdown(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "11px 14px",
                        background:
                          selectedMat == m.id
                            ? "var(--blue-dim)"
                            : "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        color:
                          selectedMat == m.id
                            ? "var(--blue)"
                            : "var(--text)",
                        textAlign: "left",
                        transition: "background 0.15s",
                        borderTop: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) =>
                        selectedMat != m.id &&
                        (e.currentTarget.style.background = "var(--surface2)")
                      }
                      onMouseLeave={(e) =>
                        selectedMat != m.id &&
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <FileText
                        size={11}
                        color={
                          selectedMat == m.id ? "var(--blue)" : "var(--text3)"
                        }
                      />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.title}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            className="btn btn-ghost btn-icon"
            onClick={clearChat}
            title="Clear chat"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Context pill */}
      {selectedMatObj && (
        <div
          className="aFadeUp"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "var(--blue-dim)",
            border: "1px solid rgba(74,143,232,0.2)",
            borderRadius: 10,
            marginBottom: 12,
            fontSize: 12,
            color: "var(--blue)",
            flexShrink: 0,
          }}
        >
          <Info size={12} />
          <span>
            Context:{" "}
            <strong style={{ color: "var(--text)" }}>
              {selectedMatObj.title}
            </strong>
          </span>
          <span style={{ marginLeft: "auto", color: "var(--text3)" }}>
            Answers will be based on this material
          </span>
        </div>
      )}

      {/* ── Messages area ───────────────────────────────────────────── */}
      <div
        onClick={() => setMatDropdown(false)}
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "var(--bg2)",
          padding: "20px 20px 8px",
          marginBottom: 12,
          scrollBehavior: "smooth",
        }}
      >
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            msg={msg}
            isLatest={i === messages.length - 1}
            onCopy={() =>
              setToast({ msg: "Copied to clipboard", type: "success" })
            }
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggested prompts ──────────────────────────────────────── */}
      {showSuggestions && !loading && (
        <div
          style={{ marginBottom: 10, flexShrink: 0 }}
          className="aFadeUp"
        >
          {/* Group tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              overflowX: "auto",
            }}
          >
            {SUGGESTION_GROUPS.map((g, i) => {
              const Icon = g.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActiveSuggGroup(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "5px 12px",
                    borderRadius: 100,
                    border: `1px solid ${activeSuggGroup === i ? g.color + "50" : "var(--border)"}`,
                    background:
                      activeSuggGroup === i
                        ? `${g.color}18`
                        : "var(--surface2)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    color:
                      activeSuggGroup === i ? g.color : "var(--text2)",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <Icon size={11} /> {g.label}
                </button>
              );
            })}
          </div>

          {/* Prompt chips */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {SUGGESTION_GROUPS[activeSuggGroup].prompts.map((p, i) => (
              <button
                key={i}
                onClick={() => send(p)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 100,
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--text2)",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    SUGGESTION_GROUPS[activeSuggGroup].color;
                  e.currentTarget.style.color =
                    SUGGESTION_GROUPS[activeSuggGroup].color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--text2)";
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input area ───────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          background: "var(--surface)",
          border: "1px solid var(--border2)",
          borderRadius: 16,
          padding: "10px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "rgba(232,200,74,0.3)")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor = "var(--border2)")
        }
      >
        <textarea
          ref={inputRef}
          rows={2}
          placeholder="Ask Spark.E anything… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => {
            const val = e.target.value.slice(0, MAX_CHARS);
            setInput(val);
            setCharCount(val.length);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          style={{
            background: "none",
            border: "none",
            outline: "none",
            resize: "none",
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: "var(--ff-body)",
            width: "100%",
          }}
        />

        {/* Input toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Suggestion toggle */}
            <button
              onClick={() => setShowSuggestions((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 8,
                background: showSuggestions
                  ? "var(--gold-dim)"
                  : "var(--surface2)",
                border: `1px solid ${showSuggestions ? "rgba(232,200,74,0.2)" : "var(--border)"}`,
                cursor: "pointer",
                fontSize: 11,
                color: showSuggestions ? "var(--gold)" : "var(--text2)",
                fontWeight: 500,
                transition: "all 0.15s",
              }}
              title="Toggle suggestions"
            >
              <Hash size={11} /> Prompts
            </button>

            {charCount > 0 && (
              <span
                style={{
                  fontSize: 10,
                  color: charCount > MAX_CHARS * 0.8 ? "var(--gold)" : "var(--text3)",
                }}
              >
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            {loading && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Spinner size={11} /> Spark.E is thinking...
              </div>
            )}
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 10,
                background: input.trim()
                  ? "var(--gold)"
                  : "var(--surface2)",
                border: "none",
                cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                fontSize: 13,
                fontWeight: 700,
                color: input.trim() ? "#07090f" : "var(--text3)",
                transition: "all 0.2s",
                opacity: loading ? 0.6 : 1,
                fontFamily: "var(--ff-display)",
              }}
              onMouseEnter={(e) =>
                input.trim() &&
                !loading &&
                (e.currentTarget.style.transform = "scale(1.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {loading ? (
                <Spinner size={14} color="var(--text3)" />
              ) : (
                <>
                  <Send size={13} /> Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Close dropdown on outside click */}
      {matDropdown && (
        <div
          onClick={() => setMatDropdown(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
        />
      )}

      {toast && <Toast {...toast} onDone={() => setToast(null)} />}
    </div>
  );
}
