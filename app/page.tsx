"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  app_type: string;
  status: string;
  notes: string;
  created_at: string;
}

const APP_TYPES = ["Early Decision", "Early Action", "Regular Decision", "Rolling Admission", "Other"];
const STATUSES = ["Not Started", "In Progress", "Submitted", "Accepted", "Rejected", "Waitlisted"];

const LOGO_URL = "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f97316";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past";
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  return `${days} days`;
}

export default function Home() {
  const [splash, setSplash] = useState(true);
  const [email, setEmail] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    school_name: "",
    deadline_date: "",
    app_type: "Regular Decision",
    status: "Not Started",
    notes: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"date" | "school">("date");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"deadlines" | "reminders">("deadlines");

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      if (d.email) setEmail(d.email);
    });
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
  }, []);

  useEffect(() => {
    if (email) {
      loadDeadlines();
      loadReminder();
    }
  }, [email]);

  async function loadDeadlines() {
    setLoading(true);
    const res = await fetch("/api/deadlines");
    const data = await res.json();
    setDeadlines(data.deadlines || []);
    setLoading(false);
  }

  async function loadReminder() {
    const res = await fetch("/api/reminders");
    const data = await res.json();
    if (data.reminder_email) setReminderEmail(data.reminder_email);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (data.ok) {
      setEmail(data.email);
    } else {
      setAuthError(data.error || "Something went wrong");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setEmail("");
    setDeadlines([]);
  }

  function openAdd() {
    setEditId(null);
    setForm({ school_name: "", deadline_date: "", app_type: "Regular Decision", status: "Not Started", notes: "" });
    setFormError("");
    setShowForm(true);
  }

  function openEdit(d: Deadline) {
    setEditId(d.id);
    setForm({ school_name: d.school_name, deadline_date: d.deadline_date.slice(0, 10), app_type: d.app_type, status: d.status, notes: d.notes });
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.school_name.trim()) { setFormError("School name is required."); return; }
    if (!form.deadline_date) { setFormError("Deadline date is required."); return; }
    setSaving(true);
    const body = editId ? { ...form, id: editId } : form;
    const res = await fetch("/api/deadlines", {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setFormError(data.error); return; }
    setShowForm(false);
    loadDeadlines();
  }

  async function handleDelete(id: number) {
    await fetch("/api/deadlines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleteConfirm(null);
    loadDeadlines();
  }

  async function handleSaveReminder(e: React.FormEvent) {
    e.preventDefault();
    setReminderSaving(true);
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminder_email: reminderEmail }),
    });
    setReminderSaving(false);
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 3000);
  }

  const filtered = deadlines
    .filter(d => filterStatus === "All" || d.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "date") return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      return a.school_name.localeCompare(b.school_name);
    });

  const upcoming7 = deadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 7; });

  if (splash) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
      }}>
        <img src={LOGO_URL} alt="Edutracker Logo" style={{ width: 110, height: 110, objectFit: "contain", marginBottom: 18, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.25))" }} />
        <h1 style={{ color: "#fff", fontSize: 38, fontWeight: 800, letterSpacing: 1, margin: 0, fontFamily: "system-ui,sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
          Edutracker
        </h1>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: 15, marginTop: 10, fontFamily: "system-ui,sans-serif" }}>
          Never miss a college deadline
        </p>
        <div style={{ marginTop: 40, display: "flex", gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: "50%", background: "#fff",
              opacity: 0.4 + i * 0.3,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <img src={LOGO_URL} alt="Edutracker" style={{ width: 72, height: 72, objectFit: "contain", marginBottom: 10 }} />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e40af", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>Track your college application deadlines</p>
          </div>
          <div style={{ display: "flex", borderRadius: 10, overflow: "hidden", marginBottom: 24, border: "1px solid #e5e7eb" }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }}
                style={{ flex: 1, padding: "10px 0", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: authMode === m ? "#1e40af" : "#fff", color: authMode === m ? "#fff" : "#6b7280", transition: "all 0.2s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth}>
            <input type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, marginBottom: 12, boxSizing: "border-box", outline: "none" }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, marginBottom: 16, boxSizing: "border-box", outline: "none" }} />
            {authError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{authError}</p>}
            <button type="submit" disabled={authLoading}
              style={{ width: "100%", padding: "13px 0", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", padding: "0 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_URL} alt="Edutracker" style={{ width: 38, height: 38, objectFit: "contain" }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 22, letterSpacing: 0.5 }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: window?.innerWidth > 480 ? "inline" : "none" }}>{email}</span>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        {/* Urgent banner */}
        {upcoming7.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🔔</span>
            <div>
              <strong style={{ color: "#dc2626", fontSize: 14 }}>Upcoming this week:</strong>
              <span style={{ color: "#7f1d1d", fontSize: 13, marginLeft: 6 }}>
                {upcoming7.map(d => `${d.school_name} (${urgencyLabel(daysUntil(d.deadline_date))})`).join(", ")}
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 24, background: "#e2e8f0", borderRadius: 12, padding: 4 }}>
          {(["deadlines", "reminders"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 14, background: activeTab === tab ? "#1e40af" : "transparent", color: activeTab === tab ? "#fff" : "#64748b", transition: "all 0.2s" }}>
              {tab === "deadlines" ? "📅 Deadlines" : "📬 Reminders"}
            </button>
          ))}
        </div>

        {activeTab === "deadlines" && (
          <>
            {/* Controls */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={openAdd}
                style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                ＋ Add Deadline
              </button>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", color: "#374151", cursor: "pointer" }}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "school")}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, background: "#fff", color: "#374151", cursor: "pointer" }}>
                <option value="date">Sort: Date</option>
                <option value="school">Sort: School</option>
              </select>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total", value: deadlines.length, color: "#1e40af" },
                { label: "Submitted", value: deadlines.filter(d => d.status === "Submitted" || d.status === "Accepted").length, color: "#059669" },
                { label: "Upcoming", value: deadlines.filter(d => daysUntil(d.deadline_date) >= 0).length, color: "#d97706" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "#fff", borderRadius: 12, padding: "16px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#9ca3af", background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#374151" }}>No deadlines yet</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Add your first college application deadline!</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map(d => {
                  const days = daysUntil(d.deadline_date);
                  const color = urgencyColor(days);
                  return (
                    <div key={d.id} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderLeft: `4px solid ${color}`, display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{d.school_name}</span>
                          <span style={{ background: "#eff6ff", color: "#1e40af", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{d.app_type}</span>
                          <span style={{ background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{d.status}</span>
                        </div>
                        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ color: "#475569", fontSize: 13 }}>📅 {new Date(d.deadline_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                          <span style={{ background: color + "20", color, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 6 }}>{urgencyLabel(days)}</span>
                        </div>
                        {d.notes && <div style={{ marginTop: 6, fontSize: 13, color: "#64748b", fontStyle: "italic" }}>{d.notes}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => openEdit(d)}
                          style={{ background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: 8, padding: "7px 13px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                          Edit
                        </button>
                        {deleteConfirm === d.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => handleDelete(d.id)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ background: "#e5e7eb", color: "#374151", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(d.id)}
                            style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 8, padding: "7px 10px", fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "reminders" && (
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>📬 Email Reminders</h2>
              <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
                We'll email you 7 days before each deadline so you never miss an application.
              </p>
            </div>
            <form onSubmit={handleSaveReminder}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
                Reminder Email Address
              </label>
              <input type="email" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)} placeholder="your@email.com" required
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 15, marginBottom: 14, boxSizing: "border-box", outline: "none" }} />
              <button type="submit" disabled={reminderSaving}
                style={{ background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: reminderSaving ? "not-allowed" : "pointer", opacity: reminderSaving ? 0.7 : 1 }}>
                {reminderSaving ? "Saving..." : "Save Reminder Email"}
              </button>
              {reminderSaved && <span style={{ marginLeft: 14, color: "#059669", fontWeight: 600, fontSize: 14 }}>✓ Saved!</span>}
            </form>
            <div style={{ marginTop: 24, background: "#f8fafc", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, color: "#374151", fontSize: 14, marginBottom: 8 }}>How reminders work:</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 14, lineHeight: 1.8 }}>
                <li>You'll get an email <strong>7 days before</strong> each deadline</li>
                <li>Each reminder includes the school name and days remaining</li>
                <li>Works for all deadlines you've added</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.22)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e293b" }}>{editId ? "Edit Deadline" : "Add Deadline"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 18, cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <label style={labelStyle}>School Name *</label>
              <input type="text" value={form.school_name} onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))} placeholder="e.g. Harvard University" style={inputStyle} />

              <label style={labelStyle}>Deadline Date *</label>
              <input type="date" value={form.deadline_date} onChange={e => setForm(f => ({ ...f, deadline_date: e.target.value }))} style={inputStyle} />

              <label style={labelStyle}>Application Type</label>
              <select value={form.app_type} onChange={e => setForm(f => ({ ...f, app_type: e.target.value }))} style={inputStyle}>
                {APP_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>

              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>

              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes..." rows={3}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "system-ui,sans-serif" }} />

              {formError && <p style={{ color: "#ef4444", fontSize: 13, marginBottom: 12 }}>{formError}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editId ? "Save Changes" : "Add Deadline"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 10, padding: "13px 18px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, marginTop: 14,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid #e5e7eb",
  fontSize: 14, boxSizing: "border-box", outline: "none", background: "#fff", color: "#1e293b",
};