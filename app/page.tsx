"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  application_type: string;
  notes: string;
  reminder_sent: boolean;
}

const LOGO_URL =
  "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

const APPLICATION_TYPES = [
  "Early Decision",
  "Early Decision II",
  "Early Action",
  "Restrictive Early Action",
  "Regular Decision",
  "Rolling Admission",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f59e0b";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 30) return "#fffbeb";
  return "#f0fdf4";
}

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [formSchool, setFormSchool] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("Regular Decision");
  const [formNotes, setFormNotes] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.email || null);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (email) loadDeadlines();
  }, [email]);

  async function loadDeadlines() {
    setDeadlinesLoading(true);
    try {
      const r = await fetch("/api/deadlines");
      const data = await r.json();
      if (data.ok) setDeadlines(data.deadlines || []);
    } catch {
      // ignore
    } finally {
      setDeadlinesLoading(false);
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await r.json();
      if (data.ok) {
        setEmail(data.email);
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setEmail(null);
    setDeadlines([]);
  }

  function openAddForm() {
    setEditingDeadline(null);
    setFormSchool("");
    setFormDate("");
    setFormType("Regular Decision");
    setFormNotes("");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(d: Deadline) {
    setEditingDeadline(d);
    setFormSchool(d.school_name);
    setFormDate(d.deadline_date);
    setFormType(d.application_type);
    setFormNotes(d.notes || "");
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSubmitting(true);
    try {
      const body = {
        school_name: formSchool,
        deadline_date: formDate,
        application_type: formType,
        notes: formNotes,
        ...(editingDeadline ? { id: editingDeadline.id } : {}),
      };
      const r = await fetch("/api/deadlines", {
        method: editingDeadline ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.ok) {
        setShowForm(false);
        await loadDeadlines();
      } else {
        setFormError(data.error || "Failed to save deadline");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const r = await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
      const data = await r.json();
      if (data.ok) {
        setDeadlines((prev) => prev.filter((d) => d.id !== id));
        setDeleteConfirm(null);
      }
    } catch {
      // ignore
    }
  }

  const filteredDeadlines = deadlines.filter((d) => {
    const days = daysUntil(d.deadline_date);
    if (filter === "upcoming") return days >= 0;
    if (filter === "past") return days < 0;
    return true;
  });

  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
  });

  const upcomingCount = deadlines.filter((d) => daysUntil(d.deadline_date) >= 0).length;
  const urgentCount = deadlines.filter((d) => {
    const days = daysUntil(d.deadline_date);
    return days >= 0 && days <= 7;
  }).length;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <img src={LOGO_URL} alt="Edutracker" style={{ height: 60, marginBottom: 16 }} />
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src={LOGO_URL} alt="Edutracker" style={{ height: 64, marginBottom: 12 }} />
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e3a8a", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f0f4ff", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(["login", "signup"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setAuthError(""); }}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  fontWeight: 600, fontSize: 14,
                  background: authMode === mode ? "#1e40af" : "transparent",
                  color: authMode === mode ? "white" : "#6b7280",
                  transition: "all 0.2s",
                }}
              >
                {mode === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                placeholder="you@email.com"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authSubmitting}
              style={{ width: "100%", padding: "12px 0", background: "#1e40af", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: authSubmitting ? "not-allowed" : "pointer", opacity: authSubmitting ? 0.7 : 1 }}
            >
              {authSubmitting ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#9ca3af" }}>
            Track all your college deadlines in one place. Free forever.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", color: "white", padding: "0 20px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={LOGO_URL} alt="Edutracker" style={{ height: 40 }} />
            <span style={{ fontSize: 20, fontWeight: 700 }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, opacity: 0.8 }}>{email}</span>
            <button
              onClick={handleLogout}
              style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total", value: deadlines.length, color: "#1e40af", bg: "white" },
            { label: "Upcoming", value: upcomingCount, color: "#3b82f6", bg: "white" },
            { label: "Due in 7 days", value: urgentCount, color: urgentCount > 0 ? "#ef4444" : "#22c55e", bg: "white" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "20px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {(["upcoming", "all", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: 20, border: "2px solid",
                  borderColor: filter === f ? "#1e40af" : "#d1d5db",
                  background: filter === f ? "#1e40af" : "white",
                  color: filter === f ? "white" : "#6b7280",
                  fontWeight: 600, fontSize: 13, cursor: "pointer",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={openAddForm}
            style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            + Add Deadline
          </button>
        </div>

        {/* Deadlines list */}
        {deadlinesLoading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading your deadlines...</div>
        ) : sortedDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <p style={{ color: "#6b7280", fontSize: 16, fontWeight: 500 }}>
              {filter === "past" ? "No past deadlines." : "No upcoming deadlines. Add one to get started!"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sortedDeadlines.map((d) => {
              const days = daysUntil(d.deadline_date);
              const isDeleting = deleteConfirm === d.id;
              return (
                <div
                  key={d.id}
                  style={{
                    background: "white",
                    borderRadius: 14,
                    padding: "18px 20px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    borderLeft: `4px solid ${urgencyColor(days)}`,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" }}>{d.school_name}</h3>
                      <span style={{ background: "#eff6ff", color: "#1e40af", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
                        {d.application_type}
                      </span>
                    </div>
                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>
                        📅 {new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </span>
                      <span style={{
                        fontSize: 13, fontWeight: 700,
                        color: urgencyColor(days),
                        background: urgencyBg(days),
                        padding: "2px 10px", borderRadius: 12,
                      }}>
                        {days < 0 ? `${Math.abs(days)}d ago` : days === 0 ? "Today!" : `${days}d left`}
                      </span>
                    </div>
                    {d.notes && (
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6b7280" }}>{d.notes}</p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isDeleting ? (
                      <>
                        <button
                          onClick={() => handleDelete(d.id)}
                          style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditForm(d)}
                          style={{ background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(d.id)}
                          style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div style={{ background: "white", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 700, color: "#1e3a8a" }}>
              {editingDeadline ? "Edit Deadline" : "Add Deadline"}
            </h2>
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>School Name *</label>
                <input
                  type="text"
                  value={formSchool}
                  onChange={(e) => setFormSchool(e.target.value)}
                  required
                  placeholder="e.g. Harvard University"
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Application Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box", background: "white" }}
                >
                  {APPLICATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deadline Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                  onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              {formError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 14 }}>
                  {formError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "11px 0", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{ flex: 2, padding: "11px 0", background: "#1e40af", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: formSubmitting ? "not-allowed" : "pointer", opacity: formSubmitting ? 0.7 : 1 }}
                >
                  {formSubmitting ? "Saving..." : editingDeadline ? "Save Changes" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}