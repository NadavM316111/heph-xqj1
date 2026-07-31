"use client";

import { useEffect, useState, useCallback } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  app_type: string;
  notes: string;
  reminder_sent: boolean;
  created_at: string;
}

interface User {
  email: string;
}

const POPULAR_SCHOOLS = [
  "Harvard University",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Brown University",
  "Dartmouth College",
  "Cornell University",
  "MIT",
  "Stanford University",
  "Duke University",
  "Northwestern University",
  "Johns Hopkins University",
  "Vanderbilt University",
  "Rice University",
  "Washington University in St. Louis",
  "Notre Dame",
  "Georgetown University",
  "Emory University",
  "Carnegie Mellon University",
  "UC Berkeley",
  "UCLA",
  "University of Michigan",
  "University of Virginia",
  "University of North Carolina",
  "Georgia Tech",
  "University of Florida",
  "Ohio State University",
  "Penn State University",
  "Purdue University",
  "University of Wisconsin",
  "University of Texas at Austin",
  "Boston University",
  "Tufts University",
  "Northeastern University",
  "NYU",
  "Fordham University",
  "Case Western Reserve University",
  "Tulane University",
  "University of Rochester",
  "Lehigh University",
  "Villanova University",
  "Wake Forest University",
  "University of Miami",
  "Syracuse University",
  "George Washington University",
  "American University",
  "Boston College",
  "Holy Cross",
  "Colgate University",
  "Hamilton College",
  "Colby College",
  "Bowdoin College",
  "Middlebury College",
  "Williams College",
  "Amherst College",
  "Swarthmore College",
  "Haverford College",
  "Bryn Mawr College",
  "Vassar College",
  "Wesleyan University",
  "Trinity College",
  "Connecticut College",
  "Oberlin College",
  "Carleton College",
  "Macalester College",
  "Grinnell College",
  "Davidson College",
  "Furman University",
  "University of Richmond",
  "William & Mary",
  "James Madison University",
  "University of Delaware",
  "Rutgers University",
  "University of Maryland",
  "University of Connecticut",
  "University of Massachusetts Amherst",
  "University of Pittsburgh",
  "University of Illinois Urbana-Champaign",
  "University of Minnesota",
  "Indiana University",
  "University of Iowa",
  "University of Colorado Boulder",
  "University of Arizona",
  "Arizona State University",
  "University of Washington",
  "University of Oregon",
  "Oregon State University",
  "UC San Diego",
  "UC Santa Barbara",
  "UC Irvine",
  "UC Davis",
  "UC Santa Cruz",
  "Cal Poly San Luis Obispo",
  "University of Southern California",
  "Pepperdine University",
  "Loyola Marymount University",
  "Santa Clara University",
  "University of San Diego",
  "Chapman University",
  "Other",
];

const APP_TYPES = [
  "Early Decision (ED)",
  "Early Decision II (ED II)",
  "Early Action (EA)",
  "Restrictive Early Action (REA)",
  "Regular Decision (RD)",
  "Rolling Admission",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f97316";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 30) return "#fff7ed";
  return "#f0fdf4";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formSchool, setFormSchool] = useState("");
  const [formCustomSchool, setFormCustomSchool] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState(APP_TYPES[4]);
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [sortBy, setSortBy] = useState<"date" | "school">("date");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
  }, []);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.email) {
        setUser({ email: data.email });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const loadDeadlines = useCallback(async () => {
    try {
      const res = await fetch("/api/deadlines");
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data.deadlines || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadUser();
      setLoading(false);
    })();
  }, [loadUser]);

  useEffect(() => {
    if (user) loadDeadlines();
  }, [user, loadDeadlines]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser({ email: data.email });
        setEmail("");
        setPassword("");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setUser(null);
    setDeadlines([]);
  }

  function openAddForm() {
    setEditingId(null);
    setFormSchool(POPULAR_SCHOOLS[0]);
    setFormCustomSchool("");
    setFormDate("");
    setFormType(APP_TYPES[4]);
    setFormNotes("");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(d: Deadline) {
    setEditingId(d.id);
    const isCustom = !POPULAR_SCHOOLS.includes(d.school_name) || d.school_name === "Other";
    setFormSchool(isCustom ? "Other" : d.school_name);
    setFormCustomSchool(isCustom ? d.school_name : "");
    setFormDate(d.deadline_date);
    setFormType(d.app_type);
    setFormNotes(d.notes || "");
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const school = formSchool === "Other" ? formCustomSchool.trim() : formSchool;
    if (!school) { setFormError("Please enter a school name."); return; }
    if (!formDate) { setFormError("Please select a deadline date."); return; }
    setFormLoading(true);
    try {
      const body = { school_name: school, deadline_date: formDate, app_type: formType, notes: formNotes };
      const res = editingId
        ? await fetch(`/api/deadlines/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/deadlines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        setShowForm(false);
        await loadDeadlines();
      } else {
        const d = await res.json();
        setFormError(d.error || "Failed to save deadline.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
      setDeleteId(null);
      await loadDeadlines();
    } catch {
      // ignore
    }
  }

  const filtered = deadlines.filter(d => {
    const days = daysUntil(d.deadline_date);
    if (filter === "upcoming") return days >= 0;
    if (filter === "past") return days < 0;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "date") return a.deadline_date.localeCompare(b.deadline_date);
    return a.school_name.localeCompare(b.school_name);
  });

  const upcomingCount = deadlines.filter(d => daysUntil(d.deadline_date) >= 0).length;
  const urgentCount = deadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 7; }).length;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0f4ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 80, marginBottom: 16 }} />
          <div style={{ color: "#1e40af", fontSize: 16 }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #f0f9ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: 20, padding: "40px 36px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(30,64,175,0.12)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 72, marginBottom: 12 }} />
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e3a8a", margin: "0 0 6px" }}>Edutracker</h1>
            <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>Never miss a college application deadline.</p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24, gap: 4 }}>
            {(["login", "signup"] as const).map(mode => (
              <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(""); }}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: authMode === mode ? "#1e40af" : "transparent", color: authMode === mode ? "#fff" : "#64748b", transition: "all 0.2s" }}>
                {mode === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1e293b" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", color: "#1e293b" }} />
            </div>
            {authError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{authError}</div>}
            <button type="submit" disabled={authLoading}
              style={{ width: "100%", padding: "12px 0", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? "Please wait…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 20, marginBottom: 0 }}>
            🔔 We&apos;ll email you 7 days before each deadline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff" }}>
      {/* Header */}
      <header style={{ background: "#1e40af", padding: "0 20px", boxShadow: "0 2px 12px rgba(30,64,175,0.3)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 20, letterSpacing: "-0.3px" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#93c5fd", fontSize: 13, display: "none" }} className="desktop-email">{user.email}</span>
            <button onClick={handleLogout}
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total", value: deadlines.length, color: "#1e40af", bg: "#eff6ff" },
            { label: "Upcoming", value: upcomingCount, color: "#0369a1", bg: "#e0f2fe" },
            { label: "This week", value: urgentCount, color: urgentCount > 0 ? "#dc2626" : "#16a34a", bg: urgentCount > 0 ? "#fef2f2" : "#f0fdf4" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden", flex: 1, minWidth: 220 }}>
            {(["upcoming", "all", "past"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ flex: 1, padding: "8px 4px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: filter === f ? "#1e40af" : "transparent", color: filter === f ? "#fff" : "#64748b", textTransform: "capitalize" }}>
                {f}
              </button>
            ))}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "school")}
            style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, color: "#374151", cursor: "pointer" }}>
            <option value="date">Sort: Date</option>
            <option value="school">Sort: School</option>
          </select>
          <button onClick={openAddForm}
            style={{ padding: "8px 18px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Add Deadline
          </button>
        </div>

        {/* Deadline cards */}
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "2px dashed #bfdbfe" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h3 style={{ color: "#1e3a8a", fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>No deadlines yet</h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px" }}>Add your first college application deadline to get started.</p>
            <button onClick={openAddForm}
              style={{ padding: "10px 24px", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Add Your First Deadline
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sorted.map(d => {
              const days = daysUntil(d.deadline_date);
              const color = urgencyColor(days);
              const bg = urgencyBg(days);
              const dateFormatted = new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
              return (
                <div key={d.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${days < 0 ? "#e5e7eb" : days <= 7 ? "#fecaca" : days <= 30 ? "#fed7aa" : "#bbf7d0"}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "stretch" }}>
                    <div style={{ width: 6, background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, padding: "16px 16px 16px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1e3a8a" }}>{d.school_name}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, background: "#eff6ff", color: "#1e40af", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{d.app_type}</span>
                            <span style={{ fontSize: 12, color: "#6b7280" }}>📅 {dateFormatted}</span>
                          </div>
                          {d.notes && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.4 }}>{d.notes}</p>}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                          <div style={{ background: bg, color: color, borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 64 }}>
                            <div style={{ fontSize: 18, fontWeight: 800 }}>{days < 0 ? "Done" : days === 0 ? "Today!" : days}</div>
                            {days >= 0 && days > 0 && <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8 }}>days left</div>}
                          </div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => openEditForm(d)}
                              style={{ padding: "5px 10px", background: "#eff6ff", color: "#1e40af", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                            <button onClick={() => setDeleteId(d.id)}
                              style={{ padding: "5px 10px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: "28px 24px", width: "100%", maxWidth: 460, boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e3a8a" }}>{editingId ? "Edit Deadline" : "Add Deadline"}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>School</label>
                <select value={formSchool} onChange={e => setFormSchool(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", boxSizing: "border-box" }}>
                  {POPULAR_SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {formSchool === "Other" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>School Name</label>
                  <input type="text" value={formCustomSchool} onChange={e => setFormCustomSchool(e.target.value)} placeholder="Enter school name"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Application Type</label>
                <select value={formType} onChange={e => setFormType(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", boxSizing: "border-box" }}>
                  {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Deadline Date</label>
                <input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", boxSizing: "border-box" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={3} placeholder="e.g. Need 2 recommendation letters, essay prompt B..."
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", boxSizing: "border-box", resize: "vertical" }} />
              </div>
              {formError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 12px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{formError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: "11px 0", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={formLoading}
                  style={{ flex: 2, padding: "11px 0", background: "#1e40af", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1 }}>
                  {formLoading ? "Saving…" : editingId ? "Save Changes" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 360, textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", color: "#1e3a8a", fontWeight: 800 }}>Delete Deadline?</h3>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteId(null)}
                style={{ flex: 1, padding: "11px 0", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                style={{ flex: 1, padding: "11px 0", background: "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}