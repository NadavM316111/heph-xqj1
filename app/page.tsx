"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES } from "@/lib/colleges";
import type { College } from "@/lib/colleges";

type DeadlineType = "EA" | "ED" | "RD" | "Scholarship" | "ED2" | "Other";

interface Deadline {
  id: number;
  college_id: string;
  college_name: string;
  deadline_type: DeadlineType;
  deadline_date: string;
  notes: string;
  reminder_30: boolean;
  reminder_14: boolean;
  reminder_7: boolean;
  reminder_1: boolean;
  created_at: string;
}

interface User {
  email: string;
}

const DEADLINE_COLORS: Record<DeadlineType, string> = {
  EA: "#4f86c6",
  ED: "#e05c5c",
  ED2: "#c45ec4",
  RD: "#5cb85c",
  Scholarship: "#f0ad4e",
  Other: "#9e9e9e",
};

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  EA: "Early Action",
  ED: "Early Decision",
  ED2: "Early Decision II",
  RD: "Regular Decision",
  Scholarship: "Scholarship",
  Other: "Other",
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CountdownBadge({ days }: { days: number }) {
  let bg = "#4f86c6";
  let text = `${days}d left`;
  if (days < 0) { bg = "#9e9e9e"; text = "Past"; }
  else if (days === 0) { bg = "#e05c5c"; text = "Today!"; }
  else if (days <= 7) { bg = "#e05c5c"; }
  else if (days <= 14) { bg = "#f0ad4e"; }
  else if (days <= 30) { bg = "#5cb85c"; }

  return (
    <span style={{
      background: bg, color: "#fff", borderRadius: 20,
      padding: "3px 10px", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>{text}</span>
  );
}

// ─── AUTH PANEL ────────────────────────────────────────────────────────────────
function AuthPanel({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const data = await res.json();
      if (data.ok) { onAuth({ email: data.email }); }
      else { setError(data.error || "Something went wrong"); }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 40, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40 }}>🎓</div>
          <h1 style={{ margin: "8px 0 4px", fontSize: 26, fontWeight: 800, color: "#1a237e" }}>EduTracker</h1>
          <p style={{ color: "#666", fontSize: 14, margin: 0 }}>Never miss a college deadline again</p>
        </div>
        <div style={{ display: "flex", background: "#f0f2f5", borderRadius: 8, marginBottom: 24, padding: 4 }}>
          {(["login", "signup"] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer",
              background: mode === m ? "#fff" : "transparent",
              fontWeight: mode === m ? 700 : 400, color: mode === m ? "#1a237e" : "#666",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.15)" : "none", fontSize: 14, transition: "all .2s"
            }}>{m === "login" ? "Log In" : "Sign Up"}</button>
          ))}
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@school.edu"
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required placeholder="••••••••"
              style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          {error && <div style={{ background: "#fdecea", color: "#c62828", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "12px 0", background: "linear-gradient(135deg, #1a237e, #1565c0)",
            color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: loading ? .7 : 1
          }}>{loading ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── ADD COLLEGE MODAL ────────────────────────────────────────────────────────
function AddCollegeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (d: Omit<Deadline, "id" | "created_at">) => Promise<void> }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<College | null>(null);
  const [manualName, setManualName] = useState("");
  const [deadlineType, setDeadlineType] = useState<DeadlineType>("RD");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [rem30, setRem30] = useState(true);
  const [rem14, setRem14] = useState(true);
  const [rem7, setRem7] = useState(true);
  const [rem1, setRem1] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filtered = search.length > 1
    ? COLLEGES.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  function selectCollege(c: College) {
    setSelected(c);
    setSearch(c.name);
    setManualName("");
    // Auto-fill date if known
    const dates: Partial<Record<DeadlineType, string>> = {
      EA: c.ea_deadline, ED: c.ed_deadline, RD: c.rd_deadline
    };
    if (dates[deadlineType]) setDeadlineDate(dates[deadlineType]!);
  }

  function handleTypeChange(t: DeadlineType) {
    setDeadlineType(t);
    if (selected) {
      const dates: Partial<Record<DeadlineType, string>> = {
        EA: selected.ea_deadline, ED: selected.ed_deadline, RD: selected.rd_deadline
      };
      if (dates[t]) setDeadlineDate(dates[t]!);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const collegeName = selected?.name || manualName.trim();
    if (!collegeName) { setError("Please select or enter a college name."); return; }
    if (!deadlineDate) { setError("Please enter a deadline date."); return; }
    setLoading(true); setError("");
    try {
      await onAdd({
        college_id: selected?.id || `manual_${Date.now()}`,
        college_name: collegeName,
        deadline_type: deadlineType,
        deadline_date: deadlineDate,
        notes,
        reminder_30: rem30,
        reminder_14: rem14,
        reminder_7: rem7,
        reminder_1: rem1,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add deadline");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1a237e" }}>Add College Deadline</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#666", lineHeight: 1 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {/* College Search */}
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={labelStyle}>Search College</label>
            <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Type college name…" style={inputStyle} />
            {filtered.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #ddd", borderRadius: 8, zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 240, overflowY: "auto" }}>
                {filtered.map(c => (
                  <div key={c.id} onClick={() => selectCollege(c)} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid #f0f0f0", transition: "background .15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1a237e" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#888" }}>{c.location} {c.type && `· ${c.type}`}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Name */}
          {!selected && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Or enter college name manually</label>
              <input value={manualName} onChange={e => setManualName(e.target.value)}
                placeholder="College name…" style={inputStyle} />
            </div>
          )}

          {selected && (
            <div style={{ background: "#f0f4ff", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1a237e", fontWeight: 600 }}>
              ✓ {selected.name} · {selected.location}
              {selected.ranking && <span style={{ fontWeight: 400, color: "#555" }}> · Rank #{selected.ranking}</span>}
            </div>
          )}

          {/* Deadline Type */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Deadline Type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(Object.keys(DEADLINE_LABELS) as DeadlineType[]).map(t => (
                <button key={t} type="button" onClick={() => handleTypeChange(t)} style={{
                  padding: "6px 14px", borderRadius: 20, border: "2px solid",
                  borderColor: deadlineType === t ? DEADLINE_COLORS[t] : "#ddd",
                  background: deadlineType === t ? DEADLINE_COLORS[t] : "#fff",
                  color: deadlineType === t ? "#fff" : "#555", fontWeight: 600, fontSize: 13, cursor: "pointer"
                }}>{t}</button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Deadline Date</label>
            <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} required style={inputStyle} />
            {selected && deadlineType === "RD" && selected.rd_deadline && (
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Suggested RD: {formatDate(selected.rd_deadline)}</div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Notes (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. need 2 rec letters" style={inputStyle} />
          </div>

          {/* Reminders */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Email Reminders</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "30 days", val: rem30, set: setRem30 },
                { label: "14 days", val: rem14, set: setRem14 },
                { label: "7 days", val: rem7, set: setRem7 },
                { label: "1 day", val: rem1, set: setRem1 },
              ].map(r => (
                <label key={r.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={r.val} onChange={e => r.set(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }} />
                  {r.label}
                </label>
              ))}
            </div>
          </div>

          {error && <div style={{ background: "#fdecea", color: "#c62828", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "#f0f2f5", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#555" }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: "11px 0", background: "linear-gradient(135deg, #1a237e, #1565c0)", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", opacity: loading ? .7 : 1 }}>
              {loading ? "Adding…" : "Add Deadline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DEADLINE CARD ────────────────────────────────────────────────────────────
function DeadlineCard({ deadline, onDelete }: { deadline: Deadline; onDelete: (id: number) => void }) {
  const days = getDaysUntil(deadline.deadline_date);
  const color = DEADLINE_COLORS[deadline.deadline_type];
  const past = days < 0;

  return (
    <div style={{
      background: past ? "#fafafa" : "#fff", borderRadius: 12,
      border: `1.5px solid ${past ? "#e0e0e0" : color + "44"}`,
      padding: "16px 18px", display: "flex", alignItems: "center", gap: 14,
      opacity: past ? 0.7 : 1, boxShadow: past ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
      transition: "transform .15s", cursor: "default"
    }}
      onMouseEnter={e => { if (!past) (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ width: 4, alignSelf: "stretch", background: color, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#1a237e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deadline.college_name}</span>
          <span style={{ background: color + "22", color: color, border: `1px solid ${color}44`, borderRadius: 12, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>{deadline.deadline_type}</span>
        </div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 3 }}>
          {DEADLINE_LABELS[deadline.deadline_type]} · {formatDate(deadline.deadline_date)}
        </div>
        {deadline.notes && <div style={{ fontSize: 12, color: "#888", marginTop: 2, fontStyle: "italic" }}>📝 {deadline.notes}</div>}
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {deadline.reminder_30 && <span style={reminderChip}>30d</span>}
          {deadline.reminder_14 && <span style={reminderChip}>14d</span>}
          {deadline.reminder_7 && <span style={reminderChip}>7d</span>}
          {deadline.reminder_1 && <span style={reminderChip}>1d</span>}
          {(deadline.reminder_30 || deadline.reminder_14 || deadline.reminder_7 || deadline.reminder_1) &&
            <span style={{ fontSize: 11, color: "#aaa" }}>reminders</span>}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
        <CountdownBadge days={days} />
        <button onClick={() => onDelete(deadline.id)} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 18, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}
          title="Remove" onMouseEnter={e => (e.currentTarget.style.color = "#e05c5c")} onMouseLeave={e => (e.currentTarget.style.color = "#ccc")}>🗑</button>
      </div>
    </div>
  );
}

const reminderChip: React.CSSProperties = {
  background: "#e8f5e9", color: "#2e7d32", border: "1px solid #a5d6a7",
  borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 600
};

const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#333", display: "block", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1.5px solid #ddd", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" };

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [typeFilter, setTypeFilter] = useState<DeadlineType | "all">("all");
  const [error, setError] = useState("");

  const fetchDeadlines = useCallback(async () => {
    try {
      const res = await fetch("/api/deadlines");
      if (res.ok) { const data = await res.json(); setDeadlines(data.deadlines || []); }
    } catch { setError("Failed to load deadlines"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  // Countdown refresh every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  async function addDeadline(d: Omit<Deadline, "id" | "created_at">) {
    const res = await fetch("/api/deadlines", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to add");
    await fetchDeadlines();
  }

  async function deleteDeadline(id: number) {
    if (!confirm("Remove this deadline?")) return;
    await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
    setDeadlines(prev => prev.filter(d => d.id !== id));
  }

  const filtered = deadlines
    .filter(d => {
      const days = getDaysUntil(d.deadline_date);
      if (filter === "upcoming" && days < 0) return false;
      if (filter === "past" && days >= 0) return false;
      if (typeFilter !== "all" && d.deadline_type !== typeFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  const upcomingCount = deadlines.filter(d => getDaysUntil(d.deadline_date) >= 0).length;
  const urgent = deadlines.filter(d => { const days = getDaysUntil(d.deadline_date); return days >= 0 && days <= 7; }).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6fb" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a237e 0%, #1565c0 100%)", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎓</span>
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>EduTracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#90caf9", fontSize: 13, display: "none" }} className="hide-mobile">{user.email}</span>
            <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Log Out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Deadlines", value: deadlines.length, icon: "📋", color: "#1a237e" },
            { label: "Upcoming", value: upcomingCount, icon: "📅", color: "#1565c0" },
            { label: "Urgent (≤7 days)", value: urgent, icon: "🚨", color: urgent > 0 ? "#e05c5c" : "#5cb85c" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#888", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {/* Status filter */}
            {(["upcoming", "all", "past"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "7px 16px", borderRadius: 20, border: "1.5px solid",
                borderColor: filter === f ? "#1a237e" : "#ddd",
                background: filter === f ? "#1a237e" : "#fff",
                color: filter === f ? "#fff" : "#555", fontSize: 13, fontWeight: 600, cursor: "pointer"
              }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
            {/* Type filter */}
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as DeadlineType | "all")}
              style={{ padding: "7px 12px", borderRadius: 20, border: "1.5px solid #ddd", fontSize: 13, color: "#555", background: "#fff", cursor: "pointer", outline: "none" }}>
              <option value="all">All Types</option>
              {(Object.keys(DEADLINE_LABELS) as DeadlineType[]).map(t => (
                <option key={t} value={t}>{DEADLINE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            background: "linear-gradient(135deg, #1a237e, #1565c0)", color: "#fff", border: "none",
            borderRadius: 24, padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(26,35,126,0.35)", display: "flex", alignItems: "center", gap: 8
          }}>+ Add Deadline</button>
        </div>

        {error && <div style={{ background: "#fdecea", color: "#c62828", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

        {/* Timeline */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888", fontSize: 16 }}>Loading your deadlines…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #ddd" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#333", marginBottom: 8 }}>
              {deadlines.length === 0 ? "No deadlines yet" : "No deadlines match this filter"}
            </div>
            <div style={{ fontSize: 14, color: "#888", marginBottom: 20 }}>
              {deadlines.length === 0 ? "Start by adding your colleges and application deadlines." : "Try changing your filters."}
            </div>
            {deadlines.length === 0 && (
              <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg, #1a237e, #1565c0)", color: "#fff", border: "none", borderRadius: 24, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>+ Add First Deadline</button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(d => (
              <DeadlineCard key={d.id} deadline={d} onDelete={deleteDeadline} />
            ))}
          </div>
        )}

        {/* Quick reference legend */}
        <div style={{ marginTop: 28, background: "#fff", borderRadius: 12, padding: "14px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Deadline Types</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {(Object.entries(DEADLINE_LABELS) as [DeadlineType, string][]).map(([t, l]) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: DEADLINE_COLORS[t], display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#555" }}><strong>{t}</strong> – {l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAdd && <AddCollegeModal onClose={() => setShowAdd(false)} onAdd={addDeadline} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch { } }
    setHydrated(true);
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => { });
  }, []);

  function handleAuth(u: User) {
    setUser(u);
    localStorage.setItem("edutracker_user", JSON.stringify(u));
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("edutracker_user");
  }

  if (!hydrated) return null;
  if (!user) return <AuthPanel onAuth={handleAuth} />;
  return <Dashboard user={user} onLogout={handleLogout} />;
}