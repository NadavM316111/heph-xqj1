"use client";

import { useState, useEffect } from "react";

interface College {
  id: number;
  name: string;
  deadline: string;
  app_type: string;
  status: string;
  notes: string;
  created_at: string;
}

const COLLEGE_LIST = [
  "Harvard University", "Yale University", "Princeton University",
  "Columbia University", "University of Pennsylvania", "Brown University",
  "Dartmouth College", "Cornell University", "MIT", "Stanford University",
  "Duke University", "Johns Hopkins University", "Northwestern University",
  "Vanderbilt University", "Rice University", "Washington University in St. Louis",
  "Notre Dame", "Georgetown University", "Emory University", "Tufts University",
  "Carnegie Mellon University", "University of Michigan", "University of Virginia",
  "UNC Chapel Hill", "UC Berkeley", "UCLA", "UC San Diego", "UC Davis",
  "UC Santa Barbara", "University of Florida", "University of Texas at Austin",
  "Georgia Tech", "Ohio State University", "Penn State University",
  "Purdue University", "University of Illinois Urbana-Champaign",
  "University of Wisconsin-Madison", "University of Washington",
  "Boston University", "Northeastern University", "NYU",
  "Fordham University", "Boston College", "Villanova University",
  "Wake Forest University", "Tulane University", "University of Miami",
  "Syracuse University", "American University", "George Washington University",
  "Other"
];

const APP_TYPES = ["Regular Decision", "Early Decision", "Early Action", "Rolling Admission", "Early Decision II"];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "all">("upcoming");

  const [newName, setNewName] = useState("");
  const [newCustomName, setNewCustomName] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newAppType, setNewAppType] = useState("Regular Decision");
  const [newNotes, setNewNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editDeadline, setEditDeadline] = useState("");
  const [editAppType, setEditAppType] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      setEmail(d.email || "");
      setLoading(false);
      if (d.email) fetchColleges();
      else setLoading(false);
    });
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
  }, []);

  async function fetchColleges() {
    setLoading(true);
    const r = await fetch("/api/colleges");
    const d = await r.json();
    setColleges(d.colleges || []);
    setLoading(false);
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
    setAuthLoading(false);
    if (d.error) { setAuthError(d.error); return; }
    setEmail(d.email);
    fetchColleges();
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setEmail("");
    setColleges([]);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    const name = newName === "Other" ? newCustomName : newName;
    if (!name || !newDeadline) { setAddError("Please fill in all required fields."); setAddLoading(false); return; }
    const r = await fetch("/api/colleges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, deadline: newDeadline, app_type: newAppType, notes: newNotes }),
    });
    const d = await r.json();
    setAddLoading(false);
    if (d.error) { setAddError(d.error); return; }
    setShowAdd(false);
    setNewName(""); setNewCustomName(""); setNewDeadline(""); setNewAppType("Regular Decision"); setNewNotes("");
    fetchColleges();
  }

  async function handleMarkComplete(id: number, current: string) {
    const newStatus = current === "complete" ? "pending" : "complete";
    await fetch("/api/colleges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    fetchColleges();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this college application?")) return;
    await fetch("/api/colleges", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchColleges();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    setEditLoading(true);
    await fetch("/api/colleges", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, deadline: editDeadline, app_type: editAppType, notes: editNotes }),
    });
    setEditLoading(false);
    setEditId(null);
    fetchColleges();
  }

  const upcoming = colleges.filter(c => c.status !== "complete" && daysUntil(c.deadline) >= 0).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const overdue = colleges.filter(c => c.status !== "complete" && daysUntil(c.deadline) < 0).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  const completed = colleges.filter(c => c.status === "complete");

  function getUrgencyColor(days: number, status: string): string {
    if (status === "complete") return "#22c55e";
    if (days < 0) return "#ef4444";
    if (days <= 7) return "#f97316";
    if (days <= 30) return "#eab308";
    return "#3b82f6";
  }

  function getUrgencyLabel(days: number, status: string): string {
    if (status === "complete") return "Submitted";
    if (days < 0) return `${Math.abs(days)}d overdue`;
    if (days === 0) return "Due today!";
    if (days === 1) return "Due tomorrow!";
    return `${days} days left`;
  }

  if (!email) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: "70px", objectFit: "contain", marginBottom: "12px" }} />
            <h1 style={{ fontSize: "26px", fontWeight: "800", color: "#1e3a8a", margin: "0 0 6px 0" }}>Edutracker</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", marginBottom: "28px", background: "#f1f5f9", borderRadius: "12px", padding: "4px" }}>
            {(["login", "signup"] as const).map(mode => (
              <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(""); }} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", fontWeight: "600", fontSize: "14px", cursor: "pointer", background: authMode === mode ? "white" : "transparent", color: authMode === mode ? "#1e3a8a" : "#64748b", boxShadow: authMode === mode ? "0 2px 8px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                {mode === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Email</label>
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={e => (e.target.style.borderColor = "#3b82f6")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Password</label>
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={e => (e.target.style.borderColor = "#3b82f6")} onBlur={e => (e.target.style.borderColor = "#e2e8f0")} />
            </div>
            {authError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", border: "1px solid #fecaca" }}>{authError}</div>}
            <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1 }}>
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabColleges = activeTab === "upcoming" ? [...overdue, ...upcoming] : activeTab === "completed" ? completed : colleges.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)", color: "white", padding: "0 20px", boxShadow: "0 4px 20px rgba(30,58,138,0.4)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: "38px", objectFit: "contain" }} />
            <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-0.5px" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", opacity: 0.8, display: "none" }} className="email-label">{email}</span>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "7px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>Sign Out</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Total Schools", value: colleges.length, color: "#1d4ed8", bg: "#eff6ff" },
            { label: "Upcoming", value: upcoming.length + overdue.length, color: overdue.length > 0 ? "#dc2626" : "#d97706", bg: overdue.length > 0 ? "#fef2f2" : "#fffbeb" },
            { label: "Submitted", value: completed.length, color: "#16a34a", bg: "#f0fdf4" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: "14px", padding: "16px", textAlign: "center", border: `2px solid ${s.color}20` }}>
              <div style={{ fontSize: "28px", fontWeight: "800", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Overdue Alert */}
        {overdue.length > 0 && (
          <div style={{ background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: "700", color: "#dc2626", fontSize: "14px" }}>Overdue Applications</div>
              <div style={{ color: "#7f1d1d", fontSize: "13px" }}>{overdue.length} deadline{overdue.length > 1 ? "s have" : " has"} passed — mark as submitted or update the deadline.</div>
            </div>
          </div>
        )}

        {/* 7-day warning */}
        {upcoming.filter(c => daysUntil(c.deadline) <= 7).length > 0 && (
          <div style={{ background: "#fff7ed", border: "2px solid #fdba74", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🔔</span>
            <div>
              <div style={{ fontWeight: "700", color: "#c2410c", fontSize: "14px" }}>Due This Week</div>
              <div style={{ color: "#7c2d12", fontSize: "13px" }}>{upcoming.filter(c => daysUntil(c.deadline) <= 7).map(c => c.name).join(", ")} — due within 7 days!</div>
            </div>
          </div>
        )}

        {/* Add Button */}
        <button onClick={() => setShowAdd(true)} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", borderRadius: "14px", fontSize: "16px", fontWeight: "700", cursor: "pointer", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0 4px 15px rgba(59,130,246,0.4)" }}>
          <span style={{ fontSize: "20px" }}>+</span> Add College Application
        </button>

        {/* Add Modal */}
        {showAdd && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e3a8a" }}>Add College</h2>
                <button onClick={() => { setShowAdd(false); setAddError(""); }} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#64748b" }}>✕</button>
              </div>
              <form onSubmit={handleAdd}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>College Name *</label>
                  <select value={newName} onChange={e => setNewName(e.target.value)} required style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "white" }}>
                    <option value="">Select a college...</option>
                    {COLLEGE_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {newName === "Other" && (
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>College Name *</label>
                    <input value={newCustomName} onChange={e => setNewCustomName(e.target.value)} required placeholder="Enter college name" style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Application Deadline *</label>
                  <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} required style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Application Type</label>
                  <select value={newAppType} onChange={e => setNewAppType(e.target.value)} style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "white" }}>
                    {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Notes (optional)</label>
                  <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Essay topics, requirements, scholarships..." rows={3} style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                </div>
                {addError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", marginBottom: "16px", border: "1px solid #fecaca" }}>{addError}</div>}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => { setShowAdd(false); setAddError(""); }} style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={addLoading} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: addLoading ? "not-allowed" : "pointer", opacity: addLoading ? 0.7 : 1 }}>
                    {addLoading ? "Adding..." : "Add College"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editId !== null && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: "#1e3a8a" }}>Edit Application</h2>
                <button onClick={() => setEditId(null)} style={{ background: "#f1f5f9", border: "none", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", fontSize: "16px", color: "#64748b" }}>✕</button>
              </div>
              <form onSubmit={handleEdit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Deadline</label>
                  <input type="date" value={editDeadline} onChange={e => setEditDeadline(e.target.value)} required style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Application Type</label>
                  <select value={editAppType} onChange={e => setEditAppType(e.target.value)} style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "white" }}>
                    {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Notes</label>
                  <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "11px 13px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="button" onClick={() => setEditId(null)} style={{ flex: 1, padding: "13px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" disabled={editLoading} style={{ flex: 2, padding: "13px", background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: editLoading ? "not-allowed" : "pointer", opacity: editLoading ? 0.7 : 1 }}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", background: "white", padding: "6px", borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          {([["upcoming", "📅 Upcoming"], ["completed", "✅ Submitted"], ["all", "📋 All"]] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px 8px", borderRadius: "10px", border: "none", fontWeight: "600", fontSize: "13px", cursor: "pointer", background: activeTab === tab ? "linear-gradient(135deg, #1e3a8a, #3b82f6)" : "transparent", color: activeTab === tab ? "white" : "#64748b", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* College Cards */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>⏳</div>
            Loading your applications...
          </div>
        ) : tabColleges.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎓</div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e3a8a", marginBottom: "8px" }}>
              {activeTab === "completed" ? "No submitted applications yet" : "No applications added yet"}
            </div>
            <div style={{ color: "#94a3b8", fontSize: "14px" }}>
              {activeTab === "upcoming" ? "Add your first college application above!" : ""}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activeTab === "upcoming" && overdue.length > 0 && (
              <div style={{ fontSize: "12px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 0" }}>⚠️ Overdue</div>
            )}
            {tabColleges.map((college, idx) => {
              const days = daysUntil(college.deadline);
              const urgencyColor = getUrgencyColor(days, college.status);
              const urgencyLabel = getUrgencyLabel(days, college.status);
              const isOverdueSection = activeTab === "upcoming" && idx === overdue.length && overdue.length > 0;

              return (
                <div key={college.id}>
                  {isOverdueSection && (
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "#d97706", textTransform: "uppercase", letterSpacing: "1px", padding: "8px 0 4px" }}>📅 Upcoming</div>
                  )}
                  {editId === college.id ? null : (
                    <div style={{ background: "white", borderRadius: "16px", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `5px solid ${urgencyColor}`, display: "flex", gap: "14px", alignItems: "flex-start" }}>
                      <button onClick={() => handleMarkComplete(college.id, college.status)} style={{ width: "26px", height: "26px", borderRadius: "50%", border: `3px solid ${urgencyColor}`, background: college.status === "complete" ? urgencyColor : "transparent", cursor: "pointer", flexShrink: 0, marginTop: "2px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: "700", transition: "all 0.2s" }}>
                        {college.status === "complete" ? "✓" : ""}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
                          <div style={{ fontWeight: "700", fontSize: "16px", color: college.status === "complete" ? "#94a3b8" : "#1e293b", textDecoration: college.status === "complete" ? "line-through" : "none" }}>{college.name}</div>
                          <div style={{ background: urgencyColor + "20", color: urgencyColor, padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" }}>{urgencyLabel}</div>
                        </div>
                        <div style={{ display: "flex", gap: "12px", marginTop: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", color: "#64748b" }}>📅 {formatDate(college.deadline)}</span>
                          <span style={{ fontSize: "13px", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>{college.app_type}</span>
                        </div>
                        {college.notes && (
                          <div style={{ marginTop: "8px", fontSize: "13px", color: "#64748b", background: "#f8fafc", borderRadius: "8px", padding: "8px 10px" }}>{college.notes}</div>
                        )}
                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                          <button onClick={() => { setEditId(college.id); setEditDeadline(college.deadline); setEditAppType(college.app_type); setEditNotes(college.notes || ""); }} style={{ background: "#eff6ff", color: "#1d4ed8", border: "none", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Edit</button>
                          <button onClick={() => handleDelete(college.id)} style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "32px", color: "#94a3b8", fontSize: "12px" }}>
          Signed in as {email} • Edutracker 2024
        </div>
      </div>
    </div>
  );
}