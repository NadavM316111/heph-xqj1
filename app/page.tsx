"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  deadline_type: string;
  notes: string;
  reminder_sent: boolean;
}

const DEADLINE_TYPES = [
  "Early Decision",
  "Early Action",
  "Regular Decision",
  "Rolling Admission",
  "Scholarship",
  "Financial Aid (FAFSA)",
  "Financial Aid (CSS Profile)",
  "Other",
];

const POPULAR_SCHOOLS = [
  "Harvard University",
  "Stanford University",
  "MIT",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Dartmouth College",
  "Brown University",
  "Cornell University",
  "Vanderbilt University",
  "Rice University",
  "Notre Dame",
  "Georgetown University",
  "Emory University",
  "Carnegie Mellon University",
  "University of Southern California",
  "UCLA",
  "UC Berkeley",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina",
  "Georgia Tech",
  "NYU",
  "Boston University",
  "Tufts University",
  "Wake Forest University",
  "Tulane University",
  "Lehigh University",
  "University of Rochester",
  "Case Western Reserve",
  "Northeastern University",
  "American University",
  "Fordham University",
  "University of Miami",
  "Santa Clara University",
  "University of San Diego",
];

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [deadlinesLoading, setDeadlinesLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formSchool, setFormSchool] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState(DEADLINE_TYPES[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "school">("date");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    });
    checkAuth();
  }, []);

  async function checkAuth() {
    const res = await fetch("/api/auth");
    const data = await res.json();
    if (data.email) {
      setEmail(data.email);
      loadDeadlines();
    }
    setLoading(false);
  }

  async function loadDeadlines() {
    setDeadlinesLoading(true);
    const res = await fetch("/api/deadlines");
    if (res.ok) {
      const data = await res.json();
      setDeadlines(data.deadlines || []);
    }
    setDeadlinesLoading(false);
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
    if (data.ok) {
      setEmail(data.email);
      loadDeadlines();
    } else {
      setAuthError(data.error || "Something went wrong");
    }
    setAuthLoading(false);
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

  function handleSchoolInput(val: string) {
    setFormSchool(val);
    if (val.length > 0) {
      const matches = POPULAR_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6);
      setSchoolSuggestions(matches);
    } else {
      setSchoolSuggestions([]);
    }
  }

  function startEdit(d: Deadline) {
    setEditingId(d.id);
    setFormSchool(d.school_name);
    setFormDate(d.deadline_date);
    setFormType(d.deadline_type);
    setFormNotes(d.notes);
    setFormError("");
    setShowForm(true);
    setSchoolSuggestions([]);
  }

  function resetForm() {
    setEditingId(null);
    setFormSchool("");
    setFormDate("");
    setFormType(DEADLINE_TYPES[0]);
    setFormNotes("");
    setFormError("");
    setShowForm(false);
    setSchoolSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formSchool.trim() || !formDate || !formType) {
      setFormError("School name, date, and type are required.");
      return;
    }
    setFormLoading(true);
    const method = editingId ? "PATCH" : "POST";
    const body: Record<string, unknown> = {
      school_name: formSchool.trim(),
      deadline_date: formDate,
      deadline_type: formType,
      notes: formNotes,
    };
    if (editingId) body.id = editingId;

    const res = await fetch("/api/deadlines", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      resetForm();
      loadDeadlines();
    } else {
      setFormError(data.error || "Failed to save deadline.");
    }
    setFormLoading(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    loadDeadlines();
  }

  function getDaysUntil(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function getUrgencyColor(days: number) {
    if (days < 0) return "#9ca3af";
    if (days <= 7) return "#ef4444";
    if (days <= 30) return "#f59e0b";
    return "#10b981";
  }

  function getUrgencyLabel(days: number) {
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return "Today!";
    if (days === 1) return "Tomorrow!";
    return `${days} days`;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const filteredDeadlines = deadlines
    .filter((d) => {
      if (filter === "all") return true;
      if (filter === "upcoming") return getDaysUntil(d.deadline_date) >= 0;
      if (filter === "past") return getDaysUntil(d.deadline_date) < 0;
      return d.deadline_type === filter;
    })
    .sort((a, b) => {
      if (sortBy === "date") return a.deadline_date.localeCompare(b.deadline_date);
      return a.school_name.localeCompare(b.school_name);
    });

  const upcomingCount = deadlines.filter((d) => getDaysUntil(d.deadline_date) >= 0).length;
  const urgentCount = deadlines.filter((d) => {
    const days = getDaysUntil(d.deadline_date);
    return days >= 0 && days <= 7;
  }).length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 80, marginBottom: 16 }} />
          <div style={{ color: "#1e40af", fontSize: 18 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 70, marginBottom: 12 }} />
            <h1 style={{ color: "#1e40af", fontSize: 28, fontWeight: 800, margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", fontSize: 15, marginTop: 6, margin: "6px 0 0" }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", marginBottom: 28, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
            {(["signup", "login"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setAuthError(""); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                  background: authMode === mode ? "white" : "transparent",
                  color: authMode === mode ? "#1e40af" : "#6b7280",
                  fontWeight: authMode === mode ? 700 : 500,
                  fontSize: 15,
                  boxShadow: authMode === mode ? "0 1px 4px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {mode === "signup" ? "Sign Up" : "Log In"}
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
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
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
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%", padding: "14px", background: authLoading ? "#93c5fd" : "#1e40af",
                color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                cursor: authLoading ? "not-allowed" : "pointer", transition: "background 0.2s",
              }}
            >
              {authLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
            {authMode === "signup" ? "Already have an account? " : "New here? "}
            <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }} style={{ background: "none", border: "none", color: "#1e40af", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
              {authMode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(30,64,175,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span style={{ color: "white", fontWeight: 800, fontSize: 20 }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{email}</span>
          <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: deadlines.length, color: "#1e40af" },
            { label: "Upcoming", value: upcomingCount, color: "#3b82f6" },
            { label: "Due Soon", value: urgentCount, color: urgentCount > 0 ? "#ef4444" : "#10b981" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "white", borderRadius: 14, padding: "16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Urgent Alerts */}
        {deadlines.filter(d => { const days = getDaysUntil(d.deadline_date); return days >= 0 && days <= 7; }).map(d => {
          const days = getDaysUntil(d.deadline_date);
          return (
            <div key={d.id} style={{ background: days === 0 ? "#fef2f2" : "#fffbeb", border: `2px solid ${days === 0 ? "#fca5a5" : "#fcd34d"}`, borderRadius: 12, padding: "12px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>{days === 0 ? "🚨" : "⚠️"}</span>
              <div style={{ flex: 1 }}>
                <strong style={{ color: "#1f2937" }}>{d.school_name}</strong>
                <span style={{ color: "#6b7280", fontSize: 14 }}> — {d.deadline_type}</span>
              </div>
              <div style={{ fontWeight: 700, color: days === 0 ? "#ef4444" : "#d97706", fontSize: 14 }}>
                {getUrgencyLabel(days)}
              </div>
            </div>
          );
        })}

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "white", outline: "none", cursor: "pointer" }}
            >
              <option value="all">All Deadlines</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="past">Past Deadlines</option>
              {DEADLINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "school")}
              style={{ padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "white", outline: "none", cursor: "pointer" }}
            >
              <option value="date">Sort by Date</option>
              <option value="school">Sort by School</option>
            </select>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            + Add Deadline
          </button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", border: "2px solid #bfdbfe" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1e40af", fontSize: 18, fontWeight: 700 }}>
              {editingId ? "Edit Deadline" : "Add New Deadline"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div style={{ position: "relative" }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>School Name *</label>
                  <input
                    type="text"
                    value={formSchool}
                    onChange={(e) => handleSchoolInput(e.target.value)}
                    placeholder="e.g. Harvard University"
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                    onBlur={(e) => { e.target.style.borderColor = "#e5e7eb"; setTimeout(() => setSchoolSuggestions([]), 200); }}
                  />
                  {schoolSuggestions.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "2px solid #bfdbfe", borderRadius: 8, zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }}>
                      {schoolSuggestions.map((s) => (
                        <div
                          key={s}
                          onMouseDown={() => { setFormSchool(s); setSchoolSuggestions([]); }}
                          style={{ padding: "10px 12px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f3f4f6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deadline Date *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deadline Type *</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", background: "white" }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                >
                  {DEADLINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any extra details..."
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", border: "2px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                  onFocus={(e) => e.target.style.borderColor = "#3b82f6"}
                  onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                />
              </div>
              {formError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
                  {formError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{ flex: 1, padding: "12px", background: formLoading ? "#93c5fd" : "#1e40af", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: formLoading ? "not-allowed" : "pointer" }}
                >
                  {formLoading ? "Saving..." : editingId ? "Save Changes" : "Add Deadline"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ padding: "12px 20px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Deadlines List */}
        {deadlinesLoading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading deadlines...</div>
        ) : filteredDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h3 style={{ color: "#1e40af", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
              {deadlines.length === 0 ? "No deadlines yet!" : "No matching deadlines"}
            </h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
              {deadlines.length === 0 ? "Add your first college application deadline to get started." : "Try changing your filter."}
            </p>
            {deadlines.length === 0 && (
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{ background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                + Add First Deadline
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredDeadlines.map((d) => {
              const days = getDaysUntil(d.deadline_date);
              const urgencyColor = getUrgencyColor(days);
              const isPast = days < 0;
              return (
                <div key={d.id} style={{ background: "white", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 16, opacity: isPast ? 0.7 : 1, borderLeft: `4px solid ${urgencyColor}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>{d.school_name}</span>
                      <span style={{ background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>{d.deadline_type}</span>
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>
                      📅 {formatDate(d.deadline_date)}
                      {d.notes && <span style={{ marginLeft: 10 }}>· {d.notes}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 80 }}>
                    <div style={{ fontWeight: 700, color: urgencyColor, fontSize: 15 }}>{getUrgencyLabel(days)}</div>
                    {isPast && <div style={{ fontSize: 11, color: "#9ca3af" }}>Past</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => startEdit(d)}
                      style={{ background: "#eff6ff", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#1d4ed8" }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    {deleteConfirm === d.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleDelete(d.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12, color: "#dc2626", fontWeight: 700 }}>Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 12 }}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(d.id)}
                        style={{ background: "#fef2f2", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#dc2626" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}