"use client";

import { useState, useEffect, useCallback } from "react";

type DeadlineType = "Early Action" | "Early Decision" | "Regular Decision" | "Financial Aid";

interface Deadline {
  id: number;
  college_name: string;
  deadline_type: DeadlineType;
  deadline_date: string;
  notes: string;
  created_at: string;
}

interface AuthState {
  email: string | null;
  loading: boolean;
  error: string | null;
}

const DEADLINE_TYPES: DeadlineType[] = [
  "Early Action",
  "Early Decision",
  "Regular Decision",
  "Financial Aid",
];

const TYPE_COLORS: Record<DeadlineType, string> = {
  "Early Action": "#7c3aed",
  "Early Decision": "#db2777",
  "Regular Decision": "#2563eb",
  "Financial Aid": "#0891b2",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): { bg: string; text: string; label: string } {
  if (days < 0) return { bg: "#f3f4f6", text: "#6b7280", label: "Past" };
  if (days < 7) return { bg: "#fef2f2", text: "#dc2626", label: "Urgent" };
  if (days < 30) return { bg: "#fffbeb", text: "#d97706", label: "Soon" };
  return { bg: "#f0fdf4", text: "#16a34a", label: "On Track" };
}

export default function Home() {
  const [auth, setAuth] = useState<AuthState>({ email: null, loading: true, error: null });
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeInput, setCollegeInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [deadlineType, setDeadlineType] = useState<DeadlineType>("Regular Decision");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [colleges, setColleges] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>("All");
  const [sortPast, setSortPast] = useState(false);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    import("../lib/colleges").then((m) => setColleges(m.COLLEGES));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_email");
    if (stored) {
      setAuth({ email: stored, loading: false, error: null });
    } else {
      setAuth({ email: null, loading: false, error: null });
    }
  }, []);

  const fetchDeadlines = useCallback(async (email: string) => {
    setDeadlinesLoading(true);
    try {
      const res = await fetch(`/api/deadlines?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.deadlines) setDeadlines(data.deadlines);
    } catch {
      // ignore
    } finally {
      setDeadlinesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.email) fetchDeadlines(auth.email);
  }, [auth.email, fetchDeadlines]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthSubmitting(true);
    setAuth((a) => ({ ...a, error: null }));
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("edutracker_email", data.email);
        setAuth({ email: data.email, loading: false, error: null });
      } else {
        setAuth((a) => ({ ...a, error: data.error || "Authentication failed" }));
      }
    } catch {
      setAuth((a) => ({ ...a, error: "Network error. Please try again." }));
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("edutracker_email");
    setAuth({ email: null, loading: false, error: null });
    setDeadlines([]);
  }

  function openAddForm() {
    setEditingId(null);
    setCollegeInput("");
    setCollegeSearch("");
    setDeadlineType("Regular Decision");
    setDeadlineDate("");
    setNotes("");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(d: Deadline) {
    setEditingId(d.id);
    setCollegeInput(d.college_name);
    setCollegeSearch(d.college_name);
    setDeadlineType(d.deadline_type);
    setDeadlineDate(d.deadline_date);
    setNotes(d.notes || "");
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!collegeInput.trim()) { setFormError("Please enter a college name."); return; }
    if (!deadlineDate) { setFormError("Please select a deadline date."); return; }
    setFormError("");
    setFormSubmitting(true);
    try {
      const body = {
        email: auth.email,
        college_name: collegeInput.trim(),
        deadline_type: deadlineType,
        deadline_date: deadlineDate,
        notes,
        id: editingId,
      };
      const res = await fetch("/api/deadlines", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setShowForm(false);
        if (auth.email) fetchDeadlines(auth.email);
      } else {
        setFormError(data.error || "Failed to save deadline.");
      }
    } catch {
      setFormError("Network error.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this deadline?")) return;
    try {
      await fetch("/api/deadlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: auth.email }),
      });
      if (auth.email) fetchDeadlines(auth.email);
    } catch {
      // ignore
    }
  }

  const filteredColleges = colleges.filter((c) =>
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  ).slice(0, 10);

  const displayDeadlines = deadlines
    .filter((d) => filterType === "All" || d.deadline_type === filterType)
    .filter((d) => sortPast || daysUntil(d.deadline_date) >= 0)
    .sort((a, b) => a.deadline_date.localeCompare(b.deadline_date));

  if (auth.loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ fontSize: 18, color: "#64748b" }}>Loading…</div>
      </div>
    );
  }

  if (!auth.email) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40 }}>🎓</div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: "8px 0 4px" }}>Edutracker</h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 4, marginBottom: 24 }}>
            {(["login", "signup"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setAuth((a) => ({ ...a, error: null })); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 6, border: "none", cursor: "pointer",
                  background: authMode === mode ? "white" : "transparent",
                  color: authMode === mode ? "#1e293b" : "#64748b",
                  fontWeight: authMode === mode ? 600 : 400,
                  fontSize: 14,
                  boxShadow: authMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {mode === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <label style={labelStyle}>Email</label>
            <input
              type="email" required value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              placeholder="you@email.com"
              style={inputStyle}
            />
            <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
            <input
              type="password" required value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
            {auth.error && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
                {auth.error}
              </div>
            )}
            <button
              type="submit" disabled={authSubmitting}
              style={{ ...btnPrimary, width: "100%", marginTop: 20, opacity: authSubmitting ? 0.7 : 1 }}
            >
              {authSubmitting ? "Please wait…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>{auth.email}</span>
          <button onClick={handleLogout} style={btnSecondary}>Log Out</button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Deadlines", value: deadlines.length, icon: "📋" },
            { label: "Urgent (<7 days)", value: deadlines.filter(d => { const x = daysUntil(d.deadline_date); return x >= 0 && x < 7; }).length, icon: "🔴" },
            { label: "Coming Up (<30d)", value: deadlines.filter(d => { const x = daysUntil(d.deadline_date); return x >= 7 && x < 30; }).length, icon: "🟡" },
            { label: "Colleges Tracked", value: new Set(deadlines.map(d => d.college_name)).size, icon: "🏫" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: "4px 0 2px" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <button onClick={openAddForm} style={btnPrimary}>
            + Add Deadline
          </button>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["All", ...DEADLINE_TYPES].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "6px 14px", borderRadius: 20, border: "1px solid #e2e8f0", fontSize: 13,
                  background: filterType === t ? "#1e293b" : "white",
                  color: filterType === t ? "white" : "#475569",
                  cursor: "pointer", fontWeight: filterType === t ? 600 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", cursor: "pointer", marginLeft: "auto" }}>
            <input type="checkbox" checked={sortPast} onChange={e => setSortPast(e.target.checked)} />
            Show past deadlines
          </label>
        </div>

        {/* Deadline list */}
        {deadlinesLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Loading deadlines…</div>
        ) : displayDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: 80, background: "white", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
            <p style={{ color: "#64748b", fontSize: 16, margin: 0 }}>No deadlines yet. Click <strong>"+ Add Deadline"</strong> to get started.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayDeadlines.map((d) => {
              const days = daysUntil(d.deadline_date);
              const urg = urgencyColor(days);
              const typeColor = TYPE_COLORS[d.deadline_type];
              return (
                <div key={d.id} style={{
                  background: "white", borderRadius: 12, padding: "18px 20px",
                  border: `1px solid #e2e8f0`, borderLeft: `4px solid ${typeColor}`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{d.college_name}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 10px", borderRadius: 20,
                        background: typeColor + "18", color: typeColor, fontSize: 12, fontWeight: 600,
                      }}>{d.deadline_type}</span>
                      {d.notes && <span style={{ fontSize: 12, color: "#94a3b8" }}>📝 {d.notes}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                      {new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <div style={{
                      display: "inline-block", marginTop: 4, padding: "3px 10px", borderRadius: 20,
                      background: urg.bg, color: urg.text, fontSize: 12, fontWeight: 600,
                    }}>
                      {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today!" : `${days}d left — ${urg.label}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEditForm(d)} style={btnSecondary}>Edit</button>
                    <button onClick={() => handleDelete(d.id)} style={{ ...btnSecondary, color: "#dc2626", borderColor: "#fca5a5" }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }} onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "white", borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
              {editingId ? "Edit Deadline" : "Add Deadline"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <label style={labelStyle}>College Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={collegeInput}
                  onChange={(e) => {
                    setCollegeInput(e.target.value);
                    setCollegeSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  placeholder="Search or type a college name…"
                  style={inputStyle}
                  autoComplete="off"
                />
                {showDropdown && collegeSearch.length > 0 && filteredColleges.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, background: "white",
                    border: "1px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    zIndex: 100, maxHeight: 220, overflowY: "auto",
                  }}>
                    {filteredColleges.map((c) => (
                      <div
                        key={c}
                        onMouseDown={() => { setCollegeInput(c); setCollegeSearch(c); setShowDropdown(false); }}
                        style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#1e293b", borderBottom: "1px solid #f1f5f9" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ ...labelStyle, marginTop: 16 }}>Deadline Type</label>
              <select value={deadlineType} onChange={e => setDeadlineType(e.target.value as DeadlineType)} style={inputStyle}>
                {DEADLINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <label style={{ ...labelStyle, marginTop: 16 }}>Deadline Date</label>
              <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} style={inputStyle} required />

              <label style={{ ...labelStyle, marginTop: 16 }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any notes about this deadline…"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" as const }}
              />

              {formError && (
                <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 12 }}>
                  {formError}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ ...btnSecondary, flex: 1 }}>Cancel</button>
                <button type="submit" disabled={formSubmitting} style={{ ...btnPrimary, flex: 2, opacity: formSubmitting ? 0.7 : 1 }}>
                  {formSubmitting ? "Saving…" : editingId ? "Save Changes" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
  fontSize: 14, color: "#1e293b", outline: "none", boxSizing: "border-box",
  background: "white",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg, #667eea, #764ba2)", color: "white",
  fontWeight: 600, fontSize: 14, cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 8, border: "1px solid #e2e8f0",
  background: "white", color: "#475569", fontWeight: 500, fontSize: 13, cursor: "pointer",
};