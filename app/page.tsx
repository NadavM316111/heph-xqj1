"use client";

import { useState, useEffect, useCallback } from "react";

interface School {
  id: string;
  name: string;
  location: string;
  state: string;
  type: "public" | "private";
  earlyActionDeadline?: string;
  earlyDecisionDeadline?: string;
  regularDecisionDeadline?: string;
  website: string;
  acceptanceRate?: number;
}

interface Application {
  id: string;
  schoolId: string;
  schoolName: string;
  schoolLocation: string;
  deadlineType: "EA" | "ED" | "RD";
  deadlineDate: string; // YYYY-MM-DD
  status: "planning" | "in-progress" | "submitted" | "accepted" | "rejected" | "waitlisted";
  notes: string;
  reminderSent?: boolean;
}

const STATUS_COLORS: Record<Application["status"], string> = {
  planning: "#94a3b8",
  "in-progress": "#3b82f6",
  submitted: "#8b5cf6",
  accepted: "#22c55e",
  rejected: "#ef4444",
  waitlisted: "#f59e0b",
};

const STATUS_LABELS: Record<Application["status"], string> = {
  planning: "Planning",
  "in-progress": "In Progress",
  submitted: "Submitted",
  accepted: "Accepted",
  rejected: "Rejected",
  waitlisted: "Waitlisted",
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + "T00:00:00");
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#6b7280";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f59e0b";
  return "#22c55e";
}

export default function Home() {
  const [view, setView] = useState<"dashboard" | "add" | "detail">("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [deadlineType, setDeadlineType] = useState<"EA" | "ED" | "RD">("RD");
  const [customDate, setCustomDate] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "name">("deadline");
  const [searchOpen, setSearchOpen] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [email, setEmail] = useState("");
  const [authView, setAuthView] = useState<"none" | "login" | "signup">("none");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [saving, setSaving] = useState(false);

  // Track page view
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Check auth on load
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) setEmail(d.email);
      })
      .catch(() => {});
  }, []);

  // Load applications from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("edutracker_apps");
      if (saved) setApplications(JSON.parse(saved));
    } catch {}
  }, []);

  // Save applications to localStorage
  const saveApplications = useCallback((apps: Application[]) => {
    setApplications(apps);
    try {
      localStorage.setItem("edutracker_apps", JSON.stringify(apps));
    } catch {}
  }, []);

  // Load all schools on mount
  useEffect(() => {
    setLoadingSchools(true);
    fetch("/api/schools")
      .then((r) => r.json())
      .then((d) => {
        if (d.schools) setSchools(d.schools);
      })
      .finally(() => setLoadingSchools(false));
  }, []);

  // Search schools
  useEffect(() => {
    if (!schoolSearch.trim()) {
      setFilteredSchools(schools.slice(0, 20));
      return;
    }
    const q = schoolSearch.toLowerCase();
    setFilteredSchools(
      schools
        .filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.location.toLowerCase().includes(q) ||
            s.state.toLowerCase().includes(q)
        )
        .slice(0, 30)
    );
  }, [schoolSearch, schools]);

  function getDeadlineDate(school: School, type: "EA" | "ED" | "RD"): string {
    const year = new Date().getFullYear();
    const fallYear = new Date().getMonth() >= 6 ? year : year - 1;
    const appYear = fallYear + 1;

    let mmdd: string | undefined;
    if (type === "EA") mmdd = school.earlyActionDeadline;
    else if (type === "ED") mmdd = school.earlyDecisionDeadline;
    else mmdd = school.regularDecisionDeadline;

    if (!mmdd) return "";
    const [mm, dd] = mmdd.split("-");
    // If month is Jan-Mar, it's in the spring of the application year
    const yr = parseInt(mm) <= 3 ? appYear : fallYear;
    return `${yr}-${mm}-${dd}`;
  }

  function handleSelectSchool(school: School) {
    setSelectedSchool(school);
    setSearchOpen(false);
    setSchoolSearch("");

    // Auto-set deadline type and date
    const hasEA = !!school.earlyActionDeadline;
    const hasED = !!school.earlyDecisionDeadline;
    const hasRD = !!school.regularDecisionDeadline;

    const type = hasRD ? "RD" : hasEA ? "EA" : hasED ? "ED" : "RD";
    setDeadlineType(type as "EA" | "ED" | "RD");
    setCustomDate(getDeadlineDate(school, type as "EA" | "ED" | "RD"));
  }

  function handleDeadlineTypeChange(type: "EA" | "ED" | "RD") {
    setDeadlineType(type);
    if (selectedSchool) {
      setCustomDate(getDeadlineDate(selectedSchool, type));
    }
  }

  function handleAddApplication() {
    if (!selectedSchool || !customDate) return;
    setSaving(true);
    const app: Application = {
      id: Date.now().toString(),
      schoolId: selectedSchool.id,
      schoolName: selectedSchool.name,
      schoolLocation: selectedSchool.location,
      deadlineType,
      deadlineDate: customDate,
      status: "planning",
      notes,
    };
    saveApplications([...applications, app]);
    setSaving(false);
    setView("dashboard");
    setSelectedSchool(null);
    setSchoolSearch("");
    setNotes("");
    setDeadlineType("RD");
    setCustomDate("");
  }

  function handleUpdateStatus(id: string, status: Application["status"]) {
    saveApplications(
      applications.map((a) => (a.id === id ? { ...a, status } : a))
    );
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, status } : prev));
    }
  }

  function handleUpdateNotes(id: string, notes: string) {
    saveApplications(
      applications.map((a) => (a.id === id ? { ...a, notes } : a))
    );
    if (selectedApp?.id === id) {
      setSelectedApp((prev) => (prev ? { ...prev, notes } : prev));
    }
  }

  function handleDelete(id: string) {
    saveApplications(applications.filter((a) => a.id !== id));
    setView("dashboard");
    setSelectedApp(null);
  }

  async function handleAuth(mode: "login" | "signup") {
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, email: authEmail, password: authPassword }),
    });
    const d = await res.json();
    if (d.error) {
      setAuthError(d.error);
    } else if (d.email) {
      setEmail(d.email);
      setAuthView("none");
      setAuthEmail("");
      setAuthPassword("");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setEmail("");
  }

  const sorted = [...applications]
    .filter((a) => statusFilter === "all" || a.status === statusFilter)
    .sort((a, b) => {
      if (sortBy === "deadline") {
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
      }
      return a.schoolName.localeCompare(b.schoolName);
    });

  const upcoming = applications
    .filter((a) => {
      const d = daysUntil(a.deadlineDate);
      return d >= 0 && d <= 7 && a.status !== "submitted" && a.status !== "accepted";
    })
    .sort((a, b) => daysUntil(a.deadlineDate) - daysUntil(b.deadlineDate));

  // ===================== RENDER =====================

  return (
    <div style={{ minHeight: "100vh", background: "#f0f6ff", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "#1a56db",
        color: "#fff",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        boxShadow: "0 2px 12px rgba(26,86,219,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker Logo"
            style={{ height: 40, width: "auto", objectFit: "contain" }}
          />
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.3px" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {email ? (
            <>
              <span style={{ fontSize: 13, opacity: 0.85 }}>{email}</span>
              <button onClick={handleLogout} style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthView("login")} style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                cursor: "pointer",
              }}>Sign In</button>
              <button onClick={() => setAuthView("signup")} style={{
                background: "#fff",
                border: "none",
                color: "#1a56db",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}>Sign Up</button>
            </>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      {authView !== "none" && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32, width: 360,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, color: "#1e293b" }}>
              {authView === "login" ? "Sign In" : "Create Account"}
            </h2>
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={{ ...inputStyle, marginTop: 10 }}
              onKeyDown={(e) => e.key === "Enter" && handleAuth(authView as "login" | "signup")}
            />
            {authError && <p style={{ color: "#ef4444", fontSize: 13, margin: "8px 0 0" }}>{authError}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => handleAuth(authView as "login" | "signup")}
                style={{ ...btnPrimaryStyle, flex: 1 }}
              >
                {authView === "login" ? "Sign In" : "Sign Up"}
              </button>
              <button
                onClick={() => { setAuthView("none"); setAuthError(""); }}
                style={{ ...btnSecondaryStyle, flex: 1 }}
              >
                Cancel
              </button>
            </div>
            <p style={{ fontSize: 13, color: "#64748b", marginTop: 14, textAlign: "center" }}>
              {authView === "login" ? (
                <>No account? <span style={{ color: "#1a56db", cursor: "pointer" }} onClick={() => setAuthView("signup")}>Sign up</span></>
              ) : (
                <>Have an account? <span style={{ color: "#1a56db", cursor: "pointer" }} onClick={() => setAuthView("login")}>Sign in</span></>
              )}
            </p>
          </div>
        </div>
      )}

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 20px" }}>

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <>
            {/* Urgent Alerts */}
            {upcoming.length > 0 && (
              <div style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 20,
              }}>
                <div style={{ fontWeight: 600, color: "#c2410c", marginBottom: 8, fontSize: 14 }}>
                  ⚠️ Deadlines in the next 7 days
                </div>
                {upcoming.map((a) => (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 0", borderTop: "1px solid #fed7aa",
                  }}>
                    <span style={{ fontSize: 14, color: "#1e293b" }}>{a.schoolName}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
                      {daysUntil(a.deadlineDate) === 0 ? "TODAY" : `${daysUntil(a.deadlineDate)}d left`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
              {(["planning", "in-progress", "submitted", "accepted"] as const).map((s) => (
                <div key={s} style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "16px",
                  textAlign: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  border: statusFilter === s ? `2px solid ${STATUS_COLORS[s]}` : "2px solid transparent",
                }}
                  onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
                >
                  <div style={{ fontSize: 26, fontWeight: 700, color: STATUS_COLORS[s] }}>
                    {applications.filter((a) => a.status === s).length}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{STATUS_LABELS[s]}</div>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ ...selectStyle }}
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "deadline" | "name")}
                  style={{ ...selectStyle }}
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="name">Sort by Name</option>
                </select>
              </div>
              <button onClick={() => setView("add")} style={btnPrimaryStyle}>
                + Add College
              </button>
            </div>

            {/* Applications List */}
            {sorted.length === 0 ? (
              <div style={{
                background: "#fff",
                borderRadius: 16,
                padding: "60px 24px",
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <h2 style={{ color: "#1e293b", margin: "0 0 8px" }}>No applications yet</h2>
                <p style={{ color: "#64748b", margin: "0 0 20px" }}>
                  Start tracking your college applications and never miss a deadline.
                </p>
                <button onClick={() => setView("add")} style={btnPrimaryStyle}>
                  Add Your First College
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sorted.map((app) => {
                  const days = daysUntil(app.deadlineDate);
                  return (
                    <div
                      key={app.id}
                      onClick={() => { setSelectedApp(app); setView("detail"); }}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #e2e8f0",
                        transition: "box-shadow 0.15s",
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 15, marginBottom: 2 }}>
                          {app.schoolName}
                        </div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          {app.schoolLocation} &middot; {app.deadlineType === "EA" ? "Early Action" : app.deadlineType === "ED" ? "Early Decision" : "Regular Decision"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, color: "#64748b" }}>{formatDate(app.deadlineDate)}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: days < 0 ? "#6b7280" : urgencyColor(days), marginTop: 2 }}>
                          {days < 0 ? "Past deadline" : days === 0 ? "Today!" : `${days} days`}
                        </div>
                      </div>
                      <div style={{
                        background: STATUS_COLORS[app.status] + "22",
                        color: STATUS_COLORS[app.status],
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {STATUS_LABELS[app.status]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ADD VIEW */}
        {view === "add" && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <button onClick={() => { setView("dashboard"); setSelectedSchool(null); setSchoolSearch(""); }} style={backBtnStyle}>
              ← Back
            </button>
            <h1 style={{ color: "#1e293b", margin: "16px 0 24px", fontSize: 22 }}>Add a College</h1>

            <div style={cardStyle}>
              {/* School Search */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>College / University</label>
                {selectedSchool ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#eff6ff",
                    borderRadius: 10,
                    border: "1px solid #bfdbfe",
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{selectedSchool.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{selectedSchool.location}</div>
                    </div>
                    <button
                      onClick={() => { setSelectedSchool(null); setCustomDate(""); }}
                      style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18 }}
                    >×</button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Search 150+ colleges..."
                      value={schoolSearch}
                      onChange={(e) => { setSchoolSearch(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      style={inputStyle}
                      autoComplete="off"
                    />
                    {searchOpen && (
                      <div style={{
                        position: "absolute", top: "100%", left: 0, right: 0,
                        background: "#fff", borderRadius: "0 0 10px 10px",
                        border: "1px solid #e2e8f0", borderTop: "none",
                        maxHeight: 280, overflowY: "auto",
                        zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                      }}>
                        {loadingSchools ? (
                          <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
                        ) : filteredSchools.length === 0 ? (
                          <div style={{ padding: 16, textAlign: "center", color: "#94a3b8" }}>No schools found</div>
                        ) : (
                          filteredSchools.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSchool(s)}
                              style={{
                                padding: "10px 16px",
                                cursor: "pointer",
                                borderBottom: "1px solid #f1f5f9",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f6ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
                            >
                              <div style={{ fontWeight: 500, color: "#1e293b", fontSize: 14 }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                                {s.location} &middot; {s.type === "public" ? "Public" : "Private"}
                                {s.acceptanceRate !== undefined ? ` · ${s.acceptanceRate}% acceptance` : ""}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deadline Type */}
              {selectedSchool && (
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Application Round</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(["EA", "ED", "RD"] as const).map((type) => {
                      const available = type === "EA"
                        ? !!selectedSchool.earlyActionDeadline
                        : type === "ED"
                          ? !!selectedSchool.earlyDecisionDeadline
                          : !!selectedSchool.regularDecisionDeadline;
                      const labels = { EA: "Early Action", ED: "Early Decision", RD: "Regular Decision" };
                      return (
                        <button
                          key={type}
                          onClick={() => available && handleDeadlineTypeChange(type)}
                          style={{
                            flex: 1,
                            padding: "10px 6px",
                            borderRadius: 8,
                            border: deadlineType === type ? "2px solid #1a56db" : "2px solid #e2e8f0",
                            background: deadlineType === type ? "#eff6ff" : "#fff",
                            color: !available ? "#cbd5e1" : deadlineType === type ? "#1a56db" : "#475569",
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: available ? "pointer" : "not-allowed",
                          }}
                        >
                          {type}<br />
                          <span style={{ fontWeight: 400, fontSize: 11 }}>{labels[type]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Deadline Date</label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this application..."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={handleAddApplication}
                disabled={!selectedSchool || !customDate || saving}
                style={{
                  ...btnPrimaryStyle,
                  width: "100%",
                  opacity: !selectedSchool || !customDate ? 0.5 : 1,
                }}
              >
                {saving ? "Adding..." : "Add to My List"}
              </button>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedApp && (
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <button onClick={() => { setView("dashboard"); setSelectedApp(null); }} style={backBtnStyle}>
              ← Back
            </button>
            <div style={{ ...cardStyle, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <h1 style={{ margin: "0 0 4px", fontSize: 20, color: "#1e293b" }}>{selectedApp.schoolName}</h1>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>{selectedApp.schoolLocation}</div>
                </div>
                <button onClick={() => handleDelete(selectedApp.id)} style={{
                  background: "none", border: "none", color: "#ef4444",
                  cursor: "pointer", fontSize: 13, fontWeight: 500,
                }}>
                  Delete
                </button>
              </div>

              {/* Deadline Info */}
              <div style={{
                background: "#f8fafc",
                borderRadius: 10,
                padding: "14px 16px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                    {selectedApp.deadlineType === "EA" ? "Early Action" : selectedApp.deadlineType === "ED" ? "Early Decision" : "Regular Decision"}
                  </div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{formatDate(selectedApp.deadlineDate)}</div>
                </div>
                <div style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: urgencyColor(daysUntil(selectedApp.deadlineDate)),
                }}>
                  {daysUntil(selectedApp.deadlineDate) < 0
                    ? "Past"
                    : daysUntil(selectedApp.deadlineDate) === 0
                      ? "Today!"
                      : `${daysUntil(selectedApp.deadlineDate)} days`}
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Status</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => handleUpdateStatus(selectedApp.id, val as Application["status"])}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 20,
                        border: selectedApp.status === val
                          ? `2px solid ${STATUS_COLORS[val as Application["status"]]}`
                          : "2px solid #e2e8f0",
                        background: selectedApp.status === val
                          ? STATUS_COLORS[val as Application["status"]] + "22"
                          : "#fff",
                        color: selectedApp.status === val
                          ? STATUS_COLORS[val as Application["status"]]
                          : "#64748b",
                        fontSize: 13,
                        fontWeight: selectedApp.status === val ? 600 : 400,
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={selectedApp.notes}
                  onChange={(e) => handleUpdateNotes(selectedApp.id, e.target.value)}
                  placeholder="Add notes about essays, requirements, interviews..."
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Shared styles
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 14,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const btnPrimaryStyle: React.CSSProperties = {
  background: "#1a56db",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const btnSecondaryStyle: React.CSSProperties = {
  background: "#f1f5f9",
  color: "#475569",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
};

const backBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#1a56db",
  fontSize: 14,
  cursor: "pointer",
  padding: 0,
  fontWeight: 500,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 8,
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #e2e8f0",
  fontSize: 13,
  color: "#1e293b",
  background: "#fff",
  cursor: "pointer",
};