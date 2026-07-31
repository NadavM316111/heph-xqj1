"use client";

import { useState, useEffect } from "react";

const LOGO_URL =
  "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

const APP_TYPES = ["Early Decision", "Early Action", "Regular Decision", "Rolling"];
const APP_TYPE_SHORT: Record<string, string> = {
  "Early Decision": "ED",
  "Early Action": "EA",
  "Regular Decision": "RD",
  "Rolling": "RO",
};

const SCHOOLS = [
  "Harvard University", "Yale University", "Princeton University", "MIT",
  "Stanford University", "Columbia University", "University of Pennsylvania",
  "Brown University", "Dartmouth College", "Cornell University",
  "Duke University", "Northwestern University", "Johns Hopkins University",
  "Vanderbilt University", "Rice University", "Washington University in St. Louis",
  "Notre Dame", "Georgetown University", "Emory University", "Carnegie Mellon University",
  "UC Berkeley", "UCLA", "University of Michigan", "University of Virginia",
  "UNC Chapel Hill", "Boston College", "Tufts University", "NYU",
  "Boston University", "Northeastern University", "Tulane University",
  "University of Southern California", "Wake Forest University",
  "Case Western Reserve University", "University of Rochester",
  "Rensselaer Polytechnic Institute", "Purdue University",
  "University of Wisconsin-Madison", "University of Illinois Urbana-Champaign",
  "Penn State University", "Ohio State University", "University of Florida",
  "University of Texas at Austin", "Georgia Tech", "University of Georgia",
  "Arizona State University", "University of Arizona",
  "University of Colorado Boulder", "University of Washington",
  "University of Minnesota", "Indiana University", "Michigan State University",
];

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  application_type: string;
  notes: string;
  created_at: string;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + (dateStr.length === 7 ? "-01" : ""));
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f97316";
  if (days <= 60) return "#eab308";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Passed";
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  return `${days} days`;
}

export default function Home() {
  const [email, setEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [editDeadline, setEditDeadline] = useState<Deadline | null>(null);

  const [formSchool, setFormSchool] = useState("");
  const [formSchoolSearch, setFormSchoolSearch] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState(APP_TYPES[0]);
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [tab, setTab] = useState<"upcoming" | "all">("upcoming");

  useEffect(() => {
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      setEmail(d.email || null);
    });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    });
  }, []);

  useEffect(() => {
    if (email) loadDeadlines();
  }, [email]);

  async function loadDeadlines() {
    setLoadingDeadlines(true);
    const r = await fetch("/api/deadlines");
    if (r.ok) {
      const d = await r.json();
      setDeadlines(d.deadlines || []);
    }
    setLoadingDeadlines(false);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const d = await r.json();
    if (d.ok) {
      setEmail(d.email);
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
    setEmail(null);
    setDeadlines([]);
  }

  function openAdd() {
    setEditDeadline(null);
    setFormSchool("");
    setFormSchoolSearch("");
    setFormDate("");
    setFormType(APP_TYPES[0]);
    setFormNotes("");
    setFormError("");
    setShowAdd(true);
  }

  function openEdit(d: Deadline) {
    setEditDeadline(d);
    setFormSchool(d.school_name);
    setFormSchoolSearch(d.school_name);
    setFormDate(d.deadline_date);
    setFormType(d.application_type);
    setFormNotes(d.notes);
    setFormError("");
    setShowAdd(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formSchool) { setFormError("Please select or enter a school name."); return; }
    if (!formDate) { setFormError("Please enter a deadline date."); return; }
    setFormLoading(true);
    setFormError("");

    if (editDeadline) {
      const r = await fetch("/api/deadlines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editDeadline.id,
          school_name: formSchool,
          deadline_date: formDate,
          application_type: formType,
          notes: formNotes,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setShowAdd(false);
        loadDeadlines();
      } else {
        setFormError(d.error || "Error saving");
      }
    } else {
      const r = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: formSchool,
          deadline_date: formDate,
          application_type: formType,
          notes: formNotes,
        }),
      });
      const d = await r.json();
      if (d.ok) {
        setShowAdd(false);
        loadDeadlines();
      } else {
        setFormError(d.error || "Error saving");
      }
    }
    setFormLoading(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this deadline?")) return;
    await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
    loadDeadlines();
  }

  const filteredSchools = formSchoolSearch.length > 0
    ? SCHOOLS.filter((s) => s.toLowerCase().includes(formSchoolSearch.toLowerCase())).slice(0, 8)
    : [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingDeadlines = deadlines.filter((d) => {
    const days = getDaysUntil(d.deadline_date);
    return days >= 0;
  });

  const displayDeadlines = tab === "upcoming" ? upcomingDeadlines : deadlines;

  if (!email) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <img src={LOGO_URL} alt="Edutracker Logo" style={{ width: 120, marginBottom: 16 }} />
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 4, textAlign: "center" }}>
          Edutracker
        </h1>
        <p style={{ color: "#93c5fd", fontSize: 15, marginBottom: 32, textAlign: "center" }}>
          Never miss a college application deadline
        </p>

        <div style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}>
          <div style={{ display: "flex", marginBottom: 24, borderRadius: 10, overflow: "hidden", border: "1px solid #e5e7eb" }}>
            <button
              onClick={() => setAuthMode("signup")}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                background: authMode === "signup" ? "#1d4ed8" : "#f9fafb",
                color: authMode === "signup" ? "#fff" : "#6b7280",
                fontWeight: 600, fontSize: 14, transition: "all 0.2s",
              }}
            >Sign Up</button>
            <button
              onClick={() => setAuthMode("login")}
              style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                background: authMode === "login" ? "#1d4ed8" : "#f9fafb",
                color: authMode === "login" ? "#fff" : "#6b7280",
                fontWeight: 600, fontSize: 14, transition: "all 0.2s",
              }}
            >Log In</button>
          </div>

          <form onSubmit={handleAuth}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>Email</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              placeholder="you@email.com"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                fontSize: 15, marginBottom: 14, boxSizing: "border-box", outline: "none",
              }}
            />
            <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                fontSize: 15, marginBottom: 18, boxSizing: "border-box", outline: "none",
              }}
            />
            {authError && (
              <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13 }}>
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%", padding: "12px 0", background: "#1d4ed8", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700,
                cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading ? "..." : authMode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f4ff",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_URL} alt="Edutracker" style={{ width: 36, height: 36, objectFit: "contain" }} />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 20 }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#93c5fd", fontSize: 12, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600,
            }}
          >Logout</button>
        </div>
      </div>

      {/* Summary Banner */}
      <div style={{
        background: "linear-gradient(90deg, #1d4ed8, #3b82f6)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ color: "#bfdbfe", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>UPCOMING DEADLINES</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{upcomingDeadlines.length}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#bfdbfe", fontSize: 12, fontWeight: 600, marginBottom: 2 }}>TOTAL SCHOOLS</div>
          <div style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>{deadlines.length}</div>
        </div>
        <button
          onClick={openAdd}
          style={{
            background: "#fff", color: "#1d4ed8", border: "none",
            borderRadius: 12, padding: "10px 18px", fontSize: 14, fontWeight: 700,
            cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >+ Add</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #e5e7eb" }}>
        {(["upcoming", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "14px 0", border: "none", cursor: "pointer",
              background: "none", fontSize: 14, fontWeight: 600,
              color: tab === t ? "#1d4ed8" : "#6b7280",
              borderBottom: tab === t ? "2px solid #1d4ed8" : "2px solid transparent",
              marginBottom: -2,
            }}
          >
            {t === "upcoming" ? "Upcoming" : "All Deadlines"}
          </button>
        ))}
      </div>

      {/* Deadlines List */}
      <div style={{ padding: "16px 16px 100px" }}>
        {loadingDeadlines ? (
          <div style={{ textAlign: "center", color: "#6b7280", padding: 40 }}>Loading...</div>
        ) : displayDeadlines.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            background: "#fff", borderRadius: 16, margin: "16px 0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <div style={{ color: "#374151", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {tab === "upcoming" ? "No upcoming deadlines" : "No deadlines yet"}
            </div>
            <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 20 }}>
              {tab === "upcoming"
                ? "All caught up! Add a school to start tracking."
                : "Start tracking your college application deadlines."}
            </div>
            <button
              onClick={openAdd}
              style={{
                background: "#1d4ed8", color: "#fff", border: "none",
                borderRadius: 10, padding: "12px 24px", fontSize: 15, fontWeight: 700,
                cursor: "pointer",
              }}
            >Add Your First School</button>
          </div>
        ) : (
          displayDeadlines.map((d) => {
            const days = getDaysUntil(d.deadline_date);
            const color = urgencyColor(days);
            const label = urgencyLabel(days);
            return (
              <div
                key={d.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px",
                  marginBottom: 12,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <div style={{
                  background: color + "22",
                  borderRadius: 10,
                  padding: "8px 10px",
                  textAlign: "center",
                  minWidth: 52,
                }}>
                  <div style={{ color, fontWeight: 800, fontSize: 13 }}>{label}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.school_name}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{
                      background: "#eff6ff", color: "#1d4ed8",
                      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                    }}>
                      {APP_TYPE_SHORT[d.application_type] || d.application_type}
                    </span>
                    <span style={{ color: "#6b7280", fontSize: 12 }}>{d.deadline_date}</span>
                  </div>
                  {d.notes && (
                    <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openEdit(d)}
                    style={{
                      background: "#f3f4f6", border: "none", borderRadius: 8,
                      padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#374151",
                    }}
                  >✏️</button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    style={{
                      background: "#fef2f2", border: "none", borderRadius: 8,
                      padding: "6px 10px", cursor: "pointer", fontSize: 13, color: "#dc2626",
                    }}
                  >🗑️</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAdd && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 1000,
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdd(false); }}
        >
          <div style={{
            background: "#fff", borderRadius: "20px 20px 0 0",
            padding: "24px 20px 40px",
            width: "100%", maxWidth: 500,
            boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
            maxHeight: "90vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#111827" }}>
                {editDeadline ? "Edit Deadline" : "Add School"}
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#6b7280" }}
              >✕</button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>School Name</label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <input
                  type="text"
                  value={formSchoolSearch}
                  onChange={(e) => {
                    setFormSchoolSearch(e.target.value);
                    setFormSchool(e.target.value);
                  }}
                  placeholder="Search or type school name..."
                  style={{
                    width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                    fontSize: 15, boxSizing: "border-box", outline: "none",
                  }}
                />
                {filteredSchools.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0,
                    background: "#fff", border: "1px solid #d1d5db", borderRadius: "0 0 8px 8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 10, maxHeight: 200, overflowY: "auto",
                  }}>
                    {filteredSchools.map((s) => (
                      <div
                        key={s}
                        onClick={() => { setFormSchool(s); setFormSchoolSearch(s); }}
                        style={{
                          padding: "10px 12px", cursor: "pointer", fontSize: 14,
                          borderBottom: "1px solid #f3f4f6",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#eff6ff")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>Deadline Date</label>
              <input
                type="month"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                  fontSize: 15, marginBottom: 14, boxSizing: "border-box", outline: "none",
                }}
              />

              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>Application Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                  fontSize: 15, marginBottom: 14, boxSizing: "border-box", outline: "none", background: "#fff",
                }}
              >
                {APP_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 600 }}>Notes (optional)</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any notes about this application..."
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db",
                  fontSize: 14, marginBottom: 18, boxSizing: "border-box", outline: "none", resize: "vertical",
                }}
              />

              {formError && (
                <div style={{ background: "#fef2f2", color: "#dc2626", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                style={{
                  width: "100%", padding: "14px 0", background: "#1d4ed8", color: "#fff",
                  border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
                  cursor: formLoading ? "not-allowed" : "pointer", opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading ? "Saving..." : editDeadline ? "Save Changes" : "Add Deadline"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}