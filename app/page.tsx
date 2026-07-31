"use client";

import { useState, useEffect, useCallback } from "react";

const COLLEGES = [
  { name: "Harvard University", location: "Cambridge, MA", type: "Ivy League" },
  { name: "Yale University", location: "New Haven, CT", type: "Ivy League" },
  { name: "Princeton University", location: "Princeton, NJ", type: "Ivy League" },
  { name: "Columbia University", location: "New York, NY", type: "Ivy League" },
  { name: "University of Pennsylvania", location: "Philadelphia, PA", type: "Ivy League" },
  { name: "Brown University", location: "Providence, RI", type: "Ivy League" },
  { name: "Dartmouth College", location: "Hanover, NH", type: "Ivy League" },
  { name: "Cornell University", location: "Ithaca, NY", type: "Ivy League" },
  { name: "MIT", location: "Cambridge, MA", type: "Research University" },
  { name: "Stanford University", location: "Stanford, CA", type: "Research University" },
  { name: "Duke University", location: "Durham, NC", type: "Research University" },
  { name: "Northwestern University", location: "Evanston, IL", type: "Research University" },
  { name: "Johns Hopkins University", location: "Baltimore, MD", type: "Research University" },
  { name: "Vanderbilt University", location: "Nashville, TN", type: "Research University" },
  { name: "Rice University", location: "Houston, TX", type: "Research University" },
  { name: "University of Notre Dame", location: "Notre Dame, IN", type: "Private University" },
  { name: "Emory University", location: "Atlanta, GA", type: "Research University" },
  { name: "Georgetown University", location: "Washington, DC", type: "Private University" },
  { name: "Carnegie Mellon University", location: "Pittsburgh, PA", type: "Research University" },
  { name: "University of Southern California", location: "Los Angeles, CA", type: "Research University" },
  { name: "Tufts University", location: "Medford, MA", type: "Private University" },
  { name: "Wake Forest University", location: "Winston-Salem, NC", type: "Private University" },
  { name: "New York University", location: "New York, NY", type: "Private University" },
  { name: "Boston College", location: "Chestnut Hill, MA", type: "Private University" },
  { name: "Boston University", location: "Boston, MA", type: "Private University" },
  { name: "University of Rochester", location: "Rochester, NY", type: "Research University" },
  { name: "Case Western Reserve University", location: "Cleveland, OH", type: "Research University" },
  { name: "Tulane University", location: "New Orleans, LA", type: "Private University" },
  { name: "Brandeis University", location: "Waltham, MA", type: "Research University" },
  { name: "Lehigh University", location: "Bethlehem, PA", type: "Research University" },
  { name: "University of California, Berkeley", location: "Berkeley, CA", type: "Public University" },
  { name: "University of California, Los Angeles", location: "Los Angeles, CA", type: "Public University" },
  { name: "University of Michigan", location: "Ann Arbor, MI", type: "Public University" },
  { name: "University of Virginia", location: "Charlottesville, VA", type: "Public University" },
  { name: "University of North Carolina at Chapel Hill", location: "Chapel Hill, NC", type: "Public University" },
  { name: "Georgia Institute of Technology", location: "Atlanta, GA", type: "Public University" },
  { name: "University of Florida", location: "Gainesville, FL", type: "Public University" },
  { name: "University of Texas at Austin", location: "Austin, TX", type: "Public University" },
  { name: "Ohio State University", location: "Columbus, OH", type: "Public University" },
  { name: "Penn State University", location: "University Park, PA", type: "Public University" },
  { name: "Purdue University", location: "West Lafayette, IN", type: "Public University" },
  { name: "University of Wisconsin-Madison", location: "Madison, WI", type: "Public University" },
  { name: "University of Illinois Urbana-Champaign", location: "Champaign, IL", type: "Public University" },
  { name: "University of Washington", location: "Seattle, WA", type: "Public University" },
  { name: "University of Maryland", location: "College Park, MD", type: "Public University" },
  { name: "Rutgers University", location: "New Brunswick, NJ", type: "Public University" },
  { name: "Indiana University", location: "Bloomington, IN", type: "Public University" },
  { name: "University of Georgia", location: "Athens, GA", type: "Public University" },
  { name: "University of Arizona", location: "Tucson, AZ", type: "Public University" },
  { name: "Arizona State University", location: "Tempe, AZ", type: "Public University" },
];

const APP_TYPES = ["Early Decision", "Early Decision II", "Early Action", "Restrictive Early Action", "Regular Decision", "Rolling Admission"];

interface Deadline {
  id: number;
  college_name: string;
  app_type: string;
  deadline_date: string;
  notes: string;
  status: string;
  reminder_sent: boolean;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
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
  const [splash, setSplash] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"deadlines" | "add" | "detail">("deadlines");
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeInput, setCollegeInput] = useState("");
  const [appType, setAppType] = useState(APP_TYPES[4]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("not_started");
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      setUserEmail(d.email || null);
    });
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    }
  }, []);

  const fetchDeadlines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/deadlines");
      const data = await res.json();
      setDeadlines(data.deadlines || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userEmail) fetchDeadlines();
  }, [userEmail, fetchDeadlines]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (data.ok) {
      setUserEmail(data.email);
      fetchDeadlines();
    } else {
      setAuthError(data.error || "Something went wrong");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setUserEmail(null);
    setDeadlines([]);
    setView("deadlines");
  }

  async function handleSave() {
    if (!collegeInput.trim() || !deadlineDate) return;
    setSaving(true);
    try {
      if (editMode && selectedDeadline) {
        await fetch(`/api/deadlines/${selectedDeadline.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ college_name: collegeInput, app_type: appType, deadline_date: deadlineDate, notes, status }),
        });
      } else {
        await fetch("/api/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ college_name: collegeInput, app_type: appType, deadline_date: deadlineDate, notes, status }),
        });
      }
      await fetchDeadlines();
      resetForm();
      setView("deadlines");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this deadline?")) return;
    await fetch(`/api/deadlines/${id}`, { method: "DELETE" });
    await fetchDeadlines();
    setView("deadlines");
    setSelectedDeadline(null);
  }

  async function handleStatusUpdate(id: number, newStatus: string) {
    await fetch(`/api/deadlines/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchDeadlines();
    if (selectedDeadline?.id === id) {
      setSelectedDeadline(prev => prev ? { ...prev, status: newStatus } : prev);
    }
  }

  function resetForm() {
    setCollegeInput("");
    setCollegeSearch("");
    setAppType(APP_TYPES[4]);
    setDeadlineDate("");
    setNotes("");
    setStatus("not_started");
    setEditMode(false);
  }

  function openAdd() {
    resetForm();
    setView("add");
  }

  function openEdit(d: Deadline) {
    setCollegeInput(d.college_name);
    setCollegeSearch(d.college_name);
    setAppType(d.app_type);
    setDeadlineDate(d.deadline_date);
    setNotes(d.notes || "");
    setStatus(d.status);
    setEditMode(true);
    setSelectedDeadline(d);
    setView("add");
  }

  const filteredSuggestions = COLLEGES.filter(c =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) && collegeSearch.length > 1
  ).slice(0, 8);

  const sortedDeadlines = [...deadlines]
    .filter(d => filterStatus === "all" || d.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "date") return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      if (sortBy === "name") return a.college_name.localeCompare(b.college_name);
      return 0;
    });

  const upcomingCount = deadlines.filter(d => {
    const days = daysUntil(d.deadline_date);
    return days >= 0 && days <= 30;
  }).length;

  const urgentCount = deadlines.filter(d => {
    const days = daysUntil(d.deadline_date);
    return days >= 0 && days <= 7;
  }).length;

  const statusLabel: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    submitted: "Submitted",
    deferred: "Deferred",
    accepted: "Accepted",
    rejected: "Rejected",
    waitlisted: "Waitlisted",
  };

  const statusColor: Record<string, string> = {
    not_started: "#6b7280",
    in_progress: "#3b82f6",
    submitted: "#8b5cf6",
    deferred: "#f59e0b",
    accepted: "#22c55e",
    rejected: "#ef4444",
    waitlisted: "#f97316",
  };

  // SPLASH
  if (splash) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ animation: "fadeInUp 0.8s ease forwards", textAlign: "center" }}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker Logo"
            style={{ width: 110, height: 110, objectFit: "contain", marginBottom: 20, filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.25))" }}
          />
          <h1 style={{
            fontSize: 42, fontWeight: 800, color: "#ffffff",
            letterSpacing: "-1px", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            Edutracker
          </h1>
          <p style={{ color: "#bfdbfe", fontSize: 16, marginTop: 10, fontWeight: 400 }}>
            Never miss a college deadline
          </p>
        </div>
        <div style={{
          position: "absolute", bottom: 60, display: "flex", gap: 8, animation: "fadeIn 1.5s ease forwards"
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
              animation: `pulse 1.2s ease ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // AUTH
  if (!userEmail) {
    return (
      <div style={{
        minHeight: "100vh", background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 20,
      }}>
        <div style={{
          background: "#fff", borderRadius: 24, padding: "40px 36px",
          width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <img
              src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
              alt="Edutracker"
              style={{ width: 70, height: 70, objectFit: "contain", marginBottom: 12 }}
            />
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e3a8a", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>Track your college application deadlines</p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setAuthMode(m); setAuthError(""); }}
                style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                  background: authMode === m ? "#2563eb" : "transparent",
                  color: authMode === m ? "#fff" : "#6b7280",
                }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input
                type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com" required
                style={{
                  width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb",
                  borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input
                type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••" required
                style={{
                  width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb",
                  borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "#2563eb"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>
            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 16, color: "#dc2626", fontSize: 13 }}>
                {authError}
              </div>
            )}
            <button type="submit" disabled={authLoading}
              style={{
                width: "100%", padding: "13px 0", background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
                cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1,
              }}>
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
        padding: "0 20px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 16px rgba(30,58,138,0.3)",
      }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
              alt="Edutracker"
              style={{ width: 36, height: 36, objectFit: "contain" }}
            />
            <span style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>Edutracker</span>
          </div>
          <button onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: "pointer",
            }}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 100px" }}>

        {/* ADD / EDIT FORM */}
        {view === "add" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => { setView("deadlines"); resetForm(); }}
                style={{ background: "#e0e7ff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#2563eb", fontWeight: 600, fontSize: 14 }}>
                ← Back
              </button>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e3a8a" }}>
                {editMode ? "Edit Deadline" : "Add Deadline"}
              </h2>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(30,58,138,0.08)" }}>
              <div style={{ marginBottom: 20, position: "relative" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>College / University *</label>
                <input
                  value={collegeInput}
                  onChange={e => {
                    setCollegeInput(e.target.value);
                    setCollegeSearch(e.target.value);
                    setShowCollegeSuggestions(true);
                  }}
                  onFocus={() => setShowCollegeSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCollegeSuggestions(false), 200)}
                  placeholder="Search or type college name..."
                  style={{
                    width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb",
                    borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box",
                  }}
                />
                {showCollegeSuggestions && filteredSuggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, background: "#fff",
                    border: "1.5px solid #e5e7eb", borderRadius: 12, zIndex: 50, marginTop: 4,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
                  }}>
                    {filteredSuggestions.map(c => (
                      <div key={c.name}
                        onMouseDown={() => { setCollegeInput(c.name); setCollegeSearch(c.name); setShowCollegeSuggestions(false); }}
                        style={{ padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid #f3f4f6" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                      >
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>{c.location} · {c.type}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Application Type</label>
                <select value={appType} onChange={e => setAppType(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", background: "#fff" }}>
                  {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Deadline Date *</label>
                <input type="date" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", background: "#fff" }}>
                  {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Essay prompts, requirements, portal login info..."
                  rows={3}
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", resize: "vertical" }}
                />
              </div>

              <button onClick={handleSave} disabled={saving || !collegeInput.trim() || !deadlineDate}
                style={{
                  width: "100%", padding: "14px 0", background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
                  color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
                  cursor: saving || !collegeInput.trim() || !deadlineDate ? "not-allowed" : "pointer",
                  opacity: saving || !collegeInput.trim() || !deadlineDate ? 0.6 : 1,
                }}>
                {saving ? "Saving..." : editMode ? "Update Deadline" : "Add Deadline"}
              </button>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedDeadline && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => { setView("deadlines"); setSelectedDeadline(null); }}
                style={{ background: "#e0e7ff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#2563eb", fontWeight: 600, fontSize: 14 }}>
                ← Back
              </button>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1e3a8a", flex: 1 }}>Deadline Details</h2>
              <button onClick={() => openEdit(selectedDeadline)}
                style={{ background: "#e0e7ff", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", color: "#2563eb", fontWeight: 600, fontSize: 14 }}>
                Edit
              </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(30,58,138,0.08)", marginBottom: 16 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 800, color: "#111827" }}>{selectedDeadline.college_name}</h3>
              <div style={{ display: "inline-block", background: "#eff6ff", color: "#2563eb", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
                {selectedDeadline.app_type}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "#f8faff", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Deadline</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{formatDate(selectedDeadline.deadline_date)}</div>
                </div>
                <div style={{ background: urgencyBg(daysUntil(selectedDeadline.deadline_date)), borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Days Left</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: urgencyColor(daysUntil(selectedDeadline.deadline_date)) }}>
                    {daysUntil(selectedDeadline.deadline_date) < 0 ? "Past due" : `${daysUntil(selectedDeadline.deadline_date)} days`}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>Update Status</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(statusLabel).map(([k, v]) => (
                    <button key={k} onClick={() => handleStatusUpdate(selectedDeadline.id, k)}
                      style={{
                        padding: "7px 14px", border: "2px solid", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: selectedDeadline.status === k ? statusColor[k] : "#e5e7eb",
                        background: selectedDeadline.status === k ? statusColor[k] : "#fff",
                        color: selectedDeadline.status === k ? "#fff" : "#6b7280",
                        transition: "all 0.15s",
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDeadline.notes && (
                <div style={{ background: "#f8faff", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Notes</div>
                  <p style={{ margin: 0, color: "#4b5563", fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selectedDeadline.notes}</p>
                </div>
              )}
            </div>

            <button onClick={() => handleDelete(selectedDeadline.id)}
              style={{
                width: "100%", padding: "13px 0", background: "#fef2f2", border: "1.5px solid #fecaca",
                color: "#dc2626", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
              }}>
              Delete Deadline
            </button>
          </div>
        )}

        {/* DEADLINES LIST */}
        {view === "deadlines" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 12px rgba(30,58,138,0.07)" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#2563eb" }}>{deadlines.length}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 2 }}>Total</div>
              </div>
              <div style={{ background: urgentCount > 0 ? "#fef2f2" : "#fff", borderRadius: 16, padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 12px rgba(30,58,138,0.07)" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: urgentCount > 0 ? "#ef4444" : "#6b7280" }}>{urgentCount}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 2 }}>Urgent</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 16, padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 12px rgba(30,58,138,0.07)" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e" }}>
                  {deadlines.filter(d => d.status === "submitted" || d.status === "accepted").length}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginTop: 2 }}>Done</div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, boxShadow: "0 2px 12px rgba(30,58,138,0.07)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                {["all", "not_started", "in_progress", "submitted", "accepted"].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    style={{
                      padding: "6px 14px", border: "none", borderRadius: 20, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                      background: filterStatus === s ? "#2563eb" : "#f1f5f9",
                      color: filterStatus === s ? "#fff" : "#6b7280",
                    }}>
                    {s === "all" ? "All" : statusLabel[s]}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 600 }}>Sort:</span>
                <button onClick={() => setSortBy("date")}
                  style={{ padding: "5px 12px", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: sortBy === "date" ? "#e0e7ff" : "#f1f5f9", color: sortBy === "date" ? "#2563eb" : "#6b7280" }}>
                  By Date
                </button>
                <button onClick={() => setSortBy("name")}
                  style={{ padding: "5px 12px", border: "none", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", background: sortBy === "name" ? "#e0e7ff" : "#f1f5f9", color: sortBy === "name" ? "#2563eb" : "#6b7280" }}>
                  By Name
                </button>
              </div>
            </div>

            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e3a8a" }}>Deadlines</h2>
              {upcomingCount > 0 && (
                <div style={{ background: "#fef3c7", color: "#92400e", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 700 }}>
                  ⚡ {upcomingCount} due soon
                </div>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 16 }}>Loading your deadlines...</div>
            ) : sortedDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 20, boxShadow: "0 2px 12px rgba(30,58,138,0.07)" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e3a8a", margin: "0 0 8px" }}>
                  {filterStatus === "all" ? "No deadlines yet" : `No ${statusLabel[filterStatus]} deadlines`}
                </h3>
                <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: 15 }}>
                  {filterStatus === "all" ? "Start tracking your college applications!" : "Try a different filter."}
                </p>
                {filterStatus === "all" && (
                  <button onClick={openAdd}
                    style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                    Add Your First Deadline
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedDeadlines.map(d => {
                  const days = daysUntil(d.deadline_date);
                  return (
                    <div key={d.id}
                      onClick={() => { setSelectedDeadline(d); setView("detail"); }}
                      style={{
                        background: "#fff", borderRadius: 16, padding: 20,
                        boxShadow: "0 2px 12px rgba(30,58,138,0.07)",
                        cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                        borderLeft: `4px solid ${urgencyColor(days)}`,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(30,58,138,0.12)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(30,58,138,0.07)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.college_name}
                          </h3>
                          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>{d.app_type}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{
                              background: statusColor[d.status] + "20",
                              color: statusColor[d.status],
                              borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700,
                            }}>
                              {statusLabel[d.status]}
                            </span>
                            <span style={{ fontSize: 13, color: "#6b7280", alignSelf: "center" }}>
                              📅 {formatDate(d.deadline_date)}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{
                            fontSize: 22, fontWeight: 800,
                            color: urgencyColor(days),
                          }}>
                            {days < 0 ? "—" : days === 0 ? "TODAY" : `${days}d`}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>
                            {days < 0 ? "past" : days === 0 ? "due" : "left"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB */}
      {view === "deadlines" && (
        <button onClick={openAdd}
          style={{
            position: "fixed", bottom: 30, right: 24, width: 60, height: 60,
            background: "linear-gradient(135deg, #1e3a8a, #2563eb)",
            border: "none", borderRadius: "50%", fontSize: 30, color: "#fff",
            cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "")}
        >
          +
        </button>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}