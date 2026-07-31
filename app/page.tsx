"use client";

import { useEffect, useState, useCallback } from "react";

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  application_type: string;
  notes: string;
  reminder_sent: boolean;
}

interface User {
  email: string;
}

type ModalMode = "add" | "edit" | null;

const APPLICATION_TYPES = [
  "Early Decision (ED)",
  "Early Decision II (ED II)",
  "Early Action (EA)",
  "Restrictive Early Action (REA)",
  "Regular Decision (RD)",
  "Rolling Admission",
  "Priority Deadline",
];

const POPULAR_SCHOOLS = [
  "Harvard University",
  "Stanford University",
  "MIT",
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
  "NYU",
  "Boston University",
  "Tufts University",
  "Northeastern University",
  "University of Southern California",
  "Wake Forest University",
  "Tulane University",
  "Case Western Reserve University",
  "University of Rochester",
  "Rensselaer Polytechnic Institute",
  "Boston College",
  "College of William & Mary",
  "University of Wisconsin-Madison",
  "Penn State University",
  "Ohio State University",
  "University of Florida",
  "University of Georgia",
  "University of Texas at Austin",
  "Texas A&M University",
  "Purdue University",
  "University of Illinois Urbana-Champaign",
  "University of Washington",
  "University of Maryland",
  "Michigan State University",
  "Indiana University",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 14) return "#fff7ed";
  if (days <= 30) return "#fefce8";
  return "#f0fdf4";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [form, setForm] = useState({
    school_name: "",
    deadline_date: "",
    application_type: "Regular Decision (RD)",
    notes: "",
  });
  const [schoolInput, setSchoolInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "school">("date");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchDeadlines = useCallback(async () => {
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
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.email) setUser({ email: data.email });
      } catch {}
      setLoading(false);
      fetchDeadlines();
    })();
  }, [fetchDeadlines]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authForm.email, password: authForm.password }),
      });
      const data = await res.json();
      if (data.ok) {
        setUser({ email: data.email });
        setShowAuth(false);
        setAuthForm({ email: "", password: "" });
        fetchDeadlines();
        setSuccessMsg(authMode === "signup" ? "Account created! Welcome to Edutracker." : "Welcome back!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setAuthError(data.error || "Something went wrong");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setUser(null);
    setDeadlines([]);
    fetchDeadlines();
  };

  const openAdd = () => {
    setForm({ school_name: "", deadline_date: "", application_type: "Regular Decision (RD)", notes: "" });
    setSchoolInput("");
    setEditingDeadline(null);
    setModalMode("add");
  };

  const openEdit = (d: Deadline) => {
    setForm({ school_name: d.school_name, deadline_date: d.deadline_date, application_type: d.application_type, notes: d.notes || "" });
    setSchoolInput(d.school_name);
    setEditingDeadline(d);
    setModalMode("edit");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.school_name.trim() || !form.deadline_date) return;
    setSaving(true);
    try {
      const method = modalMode === "edit" && editingDeadline ? "PUT" : "POST";
      const body = modalMode === "edit" && editingDeadline
        ? { ...form, id: editingDeadline.id }
        : form;
      const res = await fetch("/api/deadlines", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchDeadlines();
        setModalMode(null);
        setSuccessMsg(modalMode === "edit" ? "Deadline updated!" : "Deadline added!");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch("/api/deadlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchDeadlines();
        setDeleteConfirm(null);
        setSuccessMsg("Deadline removed.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch {}
  };

  const filteredDeadlines = deadlines
    .filter(d => filterType === "all" || d.application_type === filterType)
    .sort((a, b) => {
      if (sortBy === "date") return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      return a.school_name.localeCompare(b.school_name);
    });

  const upcoming7 = deadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 7; });
  const upcoming30 = deadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 30; });
  const past = deadlines.filter(d => daysUntil(d.deadline_date) < 0);

  const filteredSuggestions = POPULAR_SCHOOLS.filter(s =>
    s.toLowerCase().includes(schoolInput.toLowerCase()) && schoolInput.length > 0
  ).slice(0, 6);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f0f4ff" }}>
        <div style={{ textAlign: "center" }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 64, marginBottom: 16 }} />
          <p style={{ color: "#1e40af", fontSize: 16 }}>Loading your deadlines...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#1e40af", color: "white", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 40, filter: "brightness(0) invert(1)" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 20, lineHeight: 1 }}>Edutracker</div>
            <div style={{ fontSize: 11, opacity: 0.8, lineHeight: 1.2 }}>College Application Deadlines</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, opacity: 0.9 }}>{user.email}</span>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ background: "white", border: "none", color: "#1e40af", padding: "8px 18px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
              Sign In / Sign Up
            </button>
          )}
        </div>
      </header>

      {/* Success toast */}
      {successMsg && (
        <div style={{ position: "fixed", top: 80, right: 24, background: "#16a34a", color: "white", padding: "12px 20px", borderRadius: 8, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontWeight: 500 }}>
          ✓ {successMsg}
        </div>
      )}

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats bar */}
        {deadlines.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
            <StatCard label="Total Deadlines" value={deadlines.length} color="#1e40af" />
            <StatCard label="Due in 7 Days" value={upcoming7.length} color="#ef4444" />
            <StatCard label="Due in 30 Days" value={upcoming30.length} color="#f97316" />
            <StatCard label="Completed" value={past.length} color="#9ca3af" />
          </div>
        )}

        {/* Alert for urgent deadlines */}
        {upcoming7.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <div>
              <div style={{ fontWeight: 600, color: "#dc2626", fontSize: 15 }}>
                {upcoming7.length} deadline{upcoming7.length !== 1 ? "s" : ""} due within 7 days!
              </div>
              <div style={{ color: "#7f1d1d", fontSize: 13 }}>
                {upcoming7.map(d => d.school_name).join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #dbeafe", borderRadius: 6, fontSize: 13, background: "white", color: "#1e3a8a" }}
            >
              <option value="all">All Types</option>
              {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "date" | "school")}
              style={{ padding: "8px 12px", border: "1px solid #dbeafe", borderRadius: 6, fontSize: 13, background: "white", color: "#1e3a8a" }}
            >
              <option value="date">Sort by Date</option>
              <option value="school">Sort by School</option>
            </select>
          </div>
          <button
            onClick={openAdd}
            style={{ background: "#1e40af", color: "white", border: "none", padding: "10px 22px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}
          >
            + Add Deadline
          </button>
        </div>

        {/* Deadline List */}
        {filteredDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
            <h2 style={{ color: "#1e40af", marginBottom: 8 }}>No deadlines yet</h2>
            <p style={{ color: "#6b7280", marginBottom: 24, maxWidth: 340, margin: "0 auto 24px" }}>
              Add your college application deadlines to stay on top of your applications. We'll remind you 7 days before each one!
            </p>
            <button
              onClick={openAdd}
              style={{ background: "#1e40af", color: "white", border: "none", padding: "12px 28px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 16 }}
            >
              + Add Your First Deadline
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredDeadlines.map(d => {
              const days = daysUntil(d.deadline_date);
              const color = urgencyColor(days);
              const bg = urgencyBg(days);
              return (
                <div
                  key={d.id}
                  style={{ background: "white", borderRadius: 12, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 16, borderLeft: `4px solid ${color}` }}
                >
                  <div style={{ flexShrink: 0, textAlign: "center", background: bg, borderRadius: 10, padding: "10px 14px", minWidth: 70 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
                      {days < 0 ? "✓" : days === 0 ? "TODAY" : days}
                    </div>
                    {days >= 0 && days !== 0 && <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>DAYS LEFT</div>}
                    {days < 0 && <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginTop: 2 }}>PAST</div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 17, color: "#1e3a8a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {d.school_name}
                    </div>
                    <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 500, marginTop: 2 }}>{d.application_type}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{formatDate(d.deadline_date)}</div>
                    {d.notes && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4, fontStyle: "italic" }}>{d.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => openEdit(d)}
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                    >
                      Edit
                    </button>
                    {deleteConfirm === d.id ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleDelete(d.id)} style={{ background: "#ef4444", border: "none", color: "white", padding: "7px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 10px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancel</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(d.id)}
                        style={{ background: "#fff5f5", border: "1px solid #fca5a5", color: "#dc2626", padding: "7px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500 }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder info */}
        {deadlines.length > 0 && (
          <div style={{ marginTop: 24, background: "#eff6ff", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #bfdbfe" }}>
            <span style={{ fontSize: 20 }}>📧</span>
            <div style={{ fontSize: 13, color: "#1e40af" }}>
              <strong>Email reminders are active.</strong> You'll receive a reminder 7 days before each deadline.
              {!user && <span style={{ color: "#2563eb" }}> <button onClick={() => setShowAuth(true)} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", textDecoration: "underline", fontSize: 13, padding: 0 }}>Sign in</button> to save your deadlines across devices.</span>}
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModalMode(null); }}
        >
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h2 style={{ margin: "0 0 20px", color: "#1e3a8a", fontSize: 20 }}>
              {modalMode === "edit" ? "Edit Deadline" : "Add College Deadline"}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 16, position: "relative" }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>School Name *</label>
                <input
                  type="text"
                  value={schoolInput}
                  onChange={e => {
                    setSchoolInput(e.target.value);
                    setForm(f => ({ ...f, school_name: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="e.g. Harvard University"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #d1d5db", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, marginTop: 2 }}>
                    {filteredSuggestions.map(s => (
                      <div
                        key={s}
                        onMouseDown={() => {
                          setSchoolInput(s);
                          setForm(f => ({ ...f, school_name: s }));
                          setShowSuggestions(false);
                        }}
                        style={{ padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#1e3a8a" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "white")}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Deadline Date *</label>
                <input
                  type="date"
                  value={form.deadline_date}
                  onChange={e => setForm(f => ({ ...f, deadline_date: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Application Type *</label>
                <select
                  value={form.application_type}
                  onChange={e => setForm(f => ({ ...f, application_type: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box", background: "white" }}
                >
                  {APPLICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="e.g. Need to submit SAT scores, 3 recommendation letters..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  style={{ padding: "10px 20px", border: "1px solid #d1d5db", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 14, color: "#374151" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "10px 24px", border: "none", borderRadius: 8, background: "#1e40af", color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAuth(false); }}
        >
          <div style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 48, marginBottom: 12 }} />
              <h2 style={{ margin: 0, color: "#1e3a8a", fontSize: 22 }}>
                {authMode === "signup" ? "Create Account" : "Welcome Back"}
              </h2>
              <p style={{ color: "#6b7280", fontSize: 14, margin: "6px 0 0" }}>
                {authMode === "signup" ? "Save your deadlines across all your devices" : "Sign in to access your deadlines"}
              </p>
            </div>

            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 4, marginBottom: 20 }}>
              {(["signup", "login"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, background: authMode === mode ? "white" : "transparent", color: authMode === mode ? "#1e40af" : "#6b7280", boxShadow: authMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
                >
                  {mode === "signup" ? "Sign Up" : "Log In"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 15, boxSizing: "border-box" }}
                />
              </div>
              {authError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#dc2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{ width: "100%", padding: "12px", border: "none", borderRadius: 8, background: "#1e40af", color: "white", cursor: "pointer", fontSize: 16, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? "Please wait..." : authMode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "white", borderRadius: 10, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{label}</div>
    </div>
  );
}