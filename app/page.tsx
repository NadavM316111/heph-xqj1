"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_type: string;
  deadline_date: string;
  notes: string;
}

const DEADLINE_TYPES = [
  "Early Decision",
  "Early Action",
  "Regular Decision",
  "Rolling Admission",
  "Financial Aid",
  "Scholarship",
  "Other",
];

const POPULAR_SCHOOLS = [
  "Harvard University",
  "MIT",
  "Stanford University",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Brown University",
  "Dartmouth College",
  "Cornell University",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Vanderbilt University",
  "Rice University",
  "Notre Dame",
  "Georgetown University",
  "Emory University",
  "Carnegie Mellon University",
  "UC Berkeley",
  "UCLA",
  "University of Michigan",
  "UNC Chapel Hill",
  "University of Virginia",
  "Boston College",
  "Tufts University",
  "Northeastern University",
  "NYU",
  "University of Southern California",
  "Tulane University",
];

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formSchool, setFormSchool] = useState("");
  const [formType, setFormType] = useState(DEADLINE_TYPES[0]);
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [schoolFilter, setSchoolFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "school">("date");

  const [view, setView] = useState<"list" | "calendar">("list");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email || "");
        setCheckingAuth(false);
      });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    });
  }, []);

  useEffect(() => {
    if (email) {
      loadDeadlines();
    }
  }, [email]);

  async function loadDeadlines() {
    setLoadingDeadlines(true);
    const r = await fetch("/api/deadlines");
    const d = await r.json();
    if (d.ok) {
      setDeadlines(d.deadlines);
    }
    setLoadingDeadlines(false);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const d = await r.json();
    if (d.ok) {
      setEmail(d.email);
      setAuthEmail("");
      setAuthPassword("");
    } else {
      setAuthError(d.error || "Something went wrong");
    }
    setAuthLoading(false);
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setEmail("");
    setDeadlines([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const body = {
      id: editingId,
      school_name: formSchool,
      deadline_type: formType,
      deadline_date: formDate,
      notes: formNotes,
    };

    let r;
    if (editingId !== null) {
      r = await fetch("/api/deadlines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      r = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const d = await r.json();
    if (d.ok) {
      await loadDeadlines();
      resetForm();
    } else {
      setFormError(d.error || "Failed to save");
    }
    setFormLoading(false);
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setFormSchool("");
    setFormType(DEADLINE_TYPES[0]);
    setFormDate("");
    setFormNotes("");
    setFormError("");
  }

  function startEdit(d: Deadline) {
    setEditingId(d.id);
    setFormSchool(d.school_name);
    setFormType(d.deadline_type);
    setFormDate(d.deadline_date);
    setFormNotes(d.notes);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this deadline?")) return;
    await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
    await loadDeadlines();
  }

  function getDaysUntil(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + "T00:00:00");
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function urgencyColor(days: number) {
    if (days < 0) return "#9ca3af";
    if (days <= 7) return "#ef4444";
    if (days <= 30) return "#f97316";
    return "#22c55e";
  }

  function urgencyLabel(days: number) {
    if (days < 0) return "Past due";
    if (days === 0) return "Due today!";
    if (days === 1) return "Due tomorrow!";
    return `${days} days left`;
  }

  const filtered = deadlines
    .filter((d) =>
      schoolFilter ? d.school_name.toLowerCase().includes(schoolFilter.toLowerCase()) : true
    )
    .sort((a, b) => {
      if (sortBy === "date") return a.deadline_date.localeCompare(b.deadline_date);
      return a.school_name.localeCompare(b.school_name);
    });

  const upcoming = deadlines.filter((d) => {
    const days = getDaysUntil(d.deadline_date);
    return days >= 0 && days <= 7;
  });

  if (checkingAuth) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f6ff" }}>
        <div style={{ color: "#1e40af", fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f6ff", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1e40af", color: "white", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker logo"
            style={{ height: 40, width: "auto" }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Edutracker</span>
        </div>
        {email && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 14, opacity: 0.85 }}>{email}</span>
            <button
              onClick={handleLogout}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 14 }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
        {!email ? (
          /* Auth form */
          <div style={{ maxWidth: 420, margin: "40px auto" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <img
                src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
                alt="Edutracker"
                style={{ height: 72, marginBottom: 12 }}
              />
              <h1 style={{ color: "#1e40af", fontSize: 28, fontWeight: 800, margin: 0 }}>Edutracker</h1>
              <p style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
                Never miss a college application deadline
              </p>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(30,64,175,0.1)" }}>
              <div style={{ display: "flex", marginBottom: 24, borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                <button
                  onClick={() => setAuthMode("login")}
                  style={{ flex: 1, padding: "10px 0", background: authMode === "login" ? "#1e40af" : "white", color: authMode === "login" ? "white" : "#64748b", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15 }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthMode("signup")}
                  style={{ flex: 1, padding: "10px 0", background: authMode === "signup" ? "#1e40af" : "white", color: authMode === "signup" ? "white" : "#64748b", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 15 }}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box", outline: "none" }}
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
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box", outline: "none" }}
                  />
                </div>
                {authError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 12px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                    {authError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  style={{ width: "100%", background: "#1e40af", color: "white", border: "none", padding: "12px 0", borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1 }}
                >
                  {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main app */
          <>
            {/* Urgent banner */}
            {upcoming.length > 0 && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>🚨</span>
                <div>
                  <strong style={{ color: "#dc2626" }}>
                    {upcoming.length} deadline{upcoming.length > 1 ? "s" : ""} in the next 7 days!
                  </strong>
                  <div style={{ color: "#b91c1c", fontSize: 13, marginTop: 2 }}>
                    {upcoming.map((d) => `${d.school_name} (${d.deadline_type})`).join(" • ")}
                  </div>
                </div>
              </div>
            )}

            {/* Add / Edit form */}
            {showForm && (
              <div style={{ background: "white", borderRadius: 16, padding: 28, marginBottom: 28, boxShadow: "0 4px 24px rgba(30,64,175,0.1)", border: "1px solid #bfdbfe" }}>
                <h2 style={{ margin: "0 0 20px", color: "#1e40af", fontSize: 18, fontWeight: 700 }}>
                  {editingId !== null ? "Edit Deadline" : "Add Application Deadline"}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>School Name *</label>
                      <input
                        list="schools-list"
                        value={formSchool}
                        onChange={(e) => setFormSchool(e.target.value)}
                        required
                        placeholder="e.g. Harvard University"
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                      />
                      <datalist id="schools-list">
                        {POPULAR_SCHOOLS.map((s) => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deadline Type *</label>
                      <select
                        value={formType}
                        onChange={(e) => setFormType(e.target.value)}
                        required
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", background: "white" }}
                      >
                        {DEADLINE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Due Date *</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        required
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes</label>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Optional notes..."
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                  {formError && (
                    <div style={{ color: "#dc2626", fontSize: 14, marginBottom: 12 }}>{formError}</div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="submit"
                      disabled={formLoading}
                      style={{ background: "#1e40af", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 15 }}
                    >
                      {formLoading ? "Saving..." : editingId !== null ? "Update" : "Add Deadline"}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      style={{ background: "#f1f5f9", color: "#374151", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 15 }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {!showForm && (
                <button
                  onClick={() => { resetForm(); setShowForm(true); }}
                  style={{ background: "#1e40af", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
                >
                  + Add Deadline
                </button>
              )}
              <input
                type="text"
                placeholder="Filter by school..."
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                style={{ padding: "9px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "white", flex: 1, minWidth: 160 }}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "school")}
                style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "white" }}
              >
                <option value="date">Sort by Date</option>
                <option value="school">Sort by School</option>
              </select>
              <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #d1d5db" }}>
                <button
                  onClick={() => setView("list")}
                  style={{ padding: "9px 14px", background: view === "list" ? "#1e40af" : "white", color: view === "list" ? "white" : "#374151", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                >
                  List
                </button>
                <button
                  onClick={() => setView("calendar")}
                  style={{ padding: "9px 14px", background: view === "calendar" ? "#1e40af" : "white", color: view === "calendar" ? "white" : "#374151", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}
                >
                  Calendar
                </button>
              </div>
            </div>

            {/* Content */}
            {loadingDeadlines ? (
              <div style={{ textAlign: "center", padding: 48, color: "#64748b" }}>Loading deadlines...</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 64, color: "#94a3b8" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>No deadlines yet</div>
                <div style={{ fontSize: 14, marginTop: 8 }}>Add your first college application deadline above</div>
              </div>
            ) : view === "list" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map((d) => {
                  const days = getDaysUntil(d.deadline_date);
                  const color = urgencyColor(days);
                  return (
                    <div
                      key={d.id}
                      style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${color}`, display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{d.school_name}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                          {d.deadline_type} &bull; {new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        {d.notes && <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>{d.notes}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color, fontWeight: 700, fontSize: 14 }}>{urgencyLabel(days)}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => startEdit(d)}
                            style={{ background: "#f1f5f9", border: "none", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 600 }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            style={{ background: "#fef2f2", border: "none", padding: "5px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, color: "#dc2626", fontWeight: 600 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Calendar view - group by month */
              <CalendarView deadlines={filtered} onEdit={startEdit} onDelete={handleDelete} getDaysUntil={getDaysUntil} urgencyColor={urgencyColor} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function CalendarView({ deadlines, onEdit, onDelete, getDaysUntil, urgencyColor }: {
  deadlines: Deadline[];
  onEdit: (d: Deadline) => void;
  onDelete: (id: number) => void;
  getDaysUntil: (s: string) => number;
  urgencyColor: (n: number) => string;
}) {
  const grouped: Record<string, Deadline[]> = {};
  for (const d of deadlines) {
    const key = d.deadline_date.slice(0, 7);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }
  const months = Object.keys(grouped).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {months.map((m) => {
        const [y, mo] = m.split("-");
        const label = new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
        return (
          <div key={m}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e40af", marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid #bfdbfe" }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {grouped[m].sort((a, b) => a.deadline_date.localeCompare(b.deadline_date)).map((d) => {
                const days = getDaysUntil(d.deadline_date);
                const color = urgencyColor(days);
                const day = new Date(d.deadline_date + "T00:00:00").getDate();
                return (
                  <div key={d.id} style={{ display: "flex", gap: 14, alignItems: "center", background: "white", borderRadius: 10, padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: color, color: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>{day}</div>
                      <div style={{ fontSize: 10, opacity: 0.9 }}>{new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{d.school_name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{d.deadline_type}</div>
                      {d.notes && <div style={{ fontSize: 12, color: "#94a3b8" }}>{d.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => onEdit(d)} style={{ background: "#f1f5f9", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#374151" }}>Edit</button>
                      <button onClick={() => onDelete(d.id)} style={{ background: "#fef2f2", border: "none", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#dc2626" }}>Del</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}