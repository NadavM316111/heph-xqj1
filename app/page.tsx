"use client";

import { useState, useEffect, useCallback } from "react";
import { SCHOOLS, School } from "@/lib/schools";

interface Application {
  id: number;
  user_email: string;
  school_id: string;
  school_name: string;
  deadline_type: string;
  deadline_date: string;
  notes: string;
  status: string;
  created_at: string;
}

interface Alert {
  id: number;
  school_name: string;
  deadline_type: string;
  deadline_date: string;
  daysUntil: number;
  status: string;
}

type Tab = "dashboard" | "schools" | "alerts";
type AuthMode = "login" | "signup";

const STATUS_OPTIONS = ["not_started", "in_progress", "submitted"] as const;
const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
};
const STATUS_COLORS: Record<string, string> = {
  not_started: "#e74c3c",
  in_progress: "#f39c12",
  submitted: "#27ae60",
};

function daysUntilClient(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [schoolSearch, setSchoolSearch] = useState("");
  const [loadingApps, setLoadingApps] = useState(false);

  // Add school modal
  const [addingSchool, setAddingSchool] = useState<School | null>(null);
  const [addDeadlineType, setAddDeadlineType] = useState("regularDecision");
  const [addNotes, setAddNotes] = useState("");
  const [addStatus, setAddStatus] = useState("not_started");
  const [addLoading, setAddLoading] = useState(false);

  // Edit modal
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("not_started");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setEmail(d.email ?? ""))
      .catch(() => {});
  }, []);

  const loadApplications = useCallback(async () => {
    if (!email) return;
    setLoadingApps(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch {
      // ignore
    } finally {
      setLoadingApps(false);
    }
  }, [email]);

  const loadAlerts = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      if (data.alerts) setAlerts(data.alerts);
    } catch {
      // ignore
    }
  }, [email]);

  useEffect(() => {
    if (email) {
      loadApplications();
      loadAlerts();
    } else {
      setApplications([]);
      setAlerts([]);
    }
  }, [email, loadApplications, loadAlerts]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setEmail(data.email);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setEmail("");
    setApplications([]);
    setAlerts([]);
  }

  async function handleAddApplication() {
    if (!addingSchool) return;
    setAddLoading(true);
    const deadlines = addingSchool.deadlines as Record<string, string | undefined>;
    const deadlineDate = deadlines[addDeadlineType];
    if (!deadlineDate) {
      setAddLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: addingSchool.id,
          school_name: addingSchool.name,
          deadline_type: addDeadlineType,
          deadline_date: deadlineDate,
          notes: addNotes,
          status: addStatus,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setAddingSchool(null);
        setAddNotes("");
        setAddStatus("not_started");
        await loadApplications();
        await loadAlerts();
        setTab("dashboard");
      }
    } catch {
      alert("Failed to add application");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleEditSave() {
    if (!editingApp) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingApp.id, notes: editNotes, status: editStatus }),
      });
      const data = await res.json();
      if (data.error) {
        alert(data.error);
      } else {
        setEditingApp(null);
        await loadApplications();
        await loadAlerts();
      }
    } catch {
      alert("Failed to save");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this application?")) return;
    await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
    await loadApplications();
    await loadAlerts();
  }

  const filteredSchools = SCHOOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      s.location.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // Unique schools to avoid duplicates from the static array
  const uniqueSchools = filteredSchools.filter(
    (s, i, arr) => arr.findIndex((x) => x.id === s.id) === i
  );

  const trackedIds = new Set(applications.map((a) => a.school_id));

  // Group applications by school
  const appsBySchool: Record<string, Application[]> = {};
  for (const app of applications) {
    if (!appsBySchool[app.school_id]) appsBySchool[app.school_id] = [];
    appsBySchool[app.school_id].push(app);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4ff", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "#1a56db",
          color: "white",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 64,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker"
            style={{ height: 40, width: "auto" }}
          />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {email ? (
            <>
              <span style={{ fontSize: 14, opacity: 0.85 }}>{email}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <span style={{ fontSize: 14, opacity: 0.75 }}>Sign in to track applications</span>
          )}
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
        {/* Auth panel */}
        {!email && (
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 32,
              maxWidth: 420,
              margin: "0 auto 32px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: 22, color: "#1a56db" }}>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </h2>
            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                style={inputStyle}
              />
              {authError && (
                <p style={{ color: "#e74c3c", margin: 0, fontSize: 14 }}>{authError}</p>
              )}
              <button
                type="submit"
                disabled={authLoading}
                style={{
                  background: "#1a56db",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: authLoading ? "not-allowed" : "pointer",
                  opacity: authLoading ? 0.7 : 1,
                }}
              >
                {authLoading ? "..." : authMode === "login" ? "Sign In" : "Sign Up"}
              </button>
            </form>
            <p style={{ margin: "16px 0 0", fontSize: 14, color: "#666", textAlign: "center" }}>
              {authMode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#1a56db",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  padding: 0,
                }}
              >
                {authMode === "login" ? "Sign Up" : "Sign In"}
              </button>
            </p>

            {/* Browse schools without account */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: "1px solid #eee",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#888" }}>
                Want to browse colleges first?
              </p>
              <button
                onClick={() => setTab("schools")}
                style={{
                  background: "#f0f4ff",
                  border: "1px solid #1a56db",
                  color: "#1a56db",
                  padding: "8px 20px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Browse Colleges
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #dde4f5" }}>
          {(["dashboard", "schools", "alerts"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none",
                border: "none",
                padding: "10px 22px",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? "#1a56db" : "#555",
                borderBottom: tab === t ? "2px solid #1a56db" : "2px solid transparent",
                marginBottom: -2,
                textTransform: "capitalize",
              }}
            >
              {t === "alerts" && alerts.length > 0 ? `Alerts (${alerts.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === "dashboard" && (
          <div>
            {!email ? (
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h2 style={{ color: "#1a56db", marginTop: 0 }}>Track Your College Applications</h2>
                <p style={{ color: "#666", marginBottom: 24 }}>
                  Never miss a deadline. Sign in to start tracking your applications.
                </p>
                <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                  {SCHOOLS.slice(0, 6).map((s, i) => SCHOOLS.findIndex((x) => x.id === s.id) === i && (
                    <div
                      key={s.id}
                      style={{
                        background: "#f8faff",
                        border: "1px solid #dde4f5",
                        borderRadius: 8,
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#333",
                        minWidth: 150,
                      }}
                    >
                      <strong>{s.name}</strong>
                      <br />
                      <span style={{ color: "#666", fontSize: 12 }}>{s.location}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : loadingApps ? (
              <div style={{ textAlign: "center", padding: 40, color: "#888" }}>Loading...</div>
            ) : applications.length === 0 ? (
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#1a56db", marginTop: 0 }}>No applications yet</h3>
                <p style={{ color: "#666" }}>Go to the Schools tab to add colleges you&apos;re applying to.</p>
                <button
                  onClick={() => setTab("schools")}
                  style={primaryBtnStyle}
                >
                  Browse Schools
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2 style={{ margin: 0, color: "#1a2340", fontSize: 20 }}>
                    My Applications ({applications.length})
                  </h2>
                  <button onClick={() => setTab("schools")} style={primaryBtnStyle}>
                    + Add School
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {applications.map((app) => {
                    const days = daysUntilClient(app.deadline_date);
                    const urgentColor =
                      days < 0 ? "#999" : days <= 3 ? "#e74c3c" : days <= 7 ? "#f39c12" : "#1a56db";
                    return (
                      <div
                        key={app.id}
                        style={{
                          background: "white",
                          borderRadius: 10,
                          padding: "16px 20px",
                          boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 12,
                          borderLeft: `4px solid ${STATUS_COLORS[app.status] ?? "#ccc"}`,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2340" }}>
                            {app.school_name}
                          </div>
                          <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                            {app.deadline_type === "earlyDecision"
                              ? "Early Decision"
                              : app.deadline_type === "earlyAction"
                              ? "Early Action"
                              : app.deadline_type === "regularDecision"
                              ? "Regular Decision"
                              : app.deadline_type === "financialAid"
                              ? "Financial Aid"
                              : app.deadline_type}{" "}
                            · {formatDate(app.deadline_date)}
                          </div>
                          {app.notes && (
                            <div style={{ fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" }}>
                              {app.notes}
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: urgentColor,
                              background: `${urgentColor}15`,
                              padding: "4px 10px",
                              borderRadius: 20,
                            }}
                          >
                            {days < 0
                              ? "Past due"
                              : days === 0
                              ? "Due today"
                              : days === 1
                              ? "1 day left"
                              : `${days} days`}
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              background: `${STATUS_COLORS[app.status]}20`,
                              color: STATUS_COLORS[app.status],
                              padding: "3px 8px",
                              borderRadius: 12,
                              fontWeight: 600,
                            }}
                          >
                            {STATUS_LABELS[app.status]}
                          </span>
                          <button
                            onClick={() => {
                              setEditingApp(app);
                              setEditNotes(app.notes);
                              setEditStatus(app.status);
                            }}
                            style={iconBtnStyle}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            style={iconBtnStyle}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Schools Tab */}
        {tab === "schools" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                placeholder="Search colleges by name or location..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                style={{ ...inputStyle, maxWidth: 400, fontSize: 15 }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {uniqueSchools.map((school) => {
                const isTracked = trackedIds.has(school.id);
                const deadlineEntries = Object.entries(school.deadlines).filter(([, v]) => v) as [
                  string,
                  string
                ][];
                return (
                  <div
                    key={school.id}
                    style={{
                      background: "white",
                      borderRadius: 10,
                      padding: 20,
                      boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                      border: isTracked ? "2px solid #1a56db" : "2px solid transparent",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a2340" }}>{school.name}</div>
                        <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                          {school.location} · {school.type === "public" ? "Public" : "Private"}
                        </div>
                      </div>
                      {isTracked && (
                        <span style={{ fontSize: 11, color: "#1a56db", fontWeight: 600, background: "#e8efff", padding: "2px 8px", borderRadius: 10 }}>
                          Tracking
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#555" }}>
                      {deadlineEntries.map(([type, date]) => (
                        <div key={type} style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                          <span style={{ color: "#888" }}>
                            {type === "earlyDecision"
                              ? "Early Decision"
                              : type === "earlyAction"
                              ? "Early Action"
                              : type === "regularDecision"
                              ? "Regular Decision"
                              : type === "financialAid"
                              ? "Financial Aid"
                              : type}
                          </span>
                          <span style={{ fontWeight: 600, color: "#1a2340" }}>{formatDate(date)}</span>
                        </div>
                      ))}
                    </div>
                    {email && (
                      <button
                        onClick={() => {
                          setAddingSchool(school);
                          const firstKey = Object.keys(school.deadlines)[0];
                          setAddDeadlineType(firstKey);
                          setAddNotes("");
                          setAddStatus("not_started");
                        }}
                        style={{
                          ...primaryBtnStyle,
                          marginTop: 8,
                          fontSize: 13,
                          padding: "7px 0",
                          width: "100%",
                          background: isTracked ? "#e8efff" : "#1a56db",
                          color: isTracked ? "#1a56db" : "white",
                        }}
                      >
                        {isTracked ? "Add Another Deadline" : "Track Application"}
                      </button>
                    )}
                    {!email && (
                      <button
                        onClick={() => {
                          setAuthMode("signup");
                          setTab("dashboard");
                        }}
                        style={{ ...primaryBtnStyle, marginTop: 8, fontSize: 13, padding: "7px 0", width: "100%" }}
                      >
                        Sign In to Track
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {tab === "alerts" && (
          <div>
            {!email ? (
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <p style={{ color: "#666" }}>Sign in to see your upcoming deadline alerts.</p>
              </div>
            ) : alerts.length === 0 ? (
              <div
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 40,
                  textAlign: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <h3 style={{ color: "#27ae60", marginTop: 0 }}>🎉 No urgent deadlines!</h3>
                <p style={{ color: "#666" }}>
                  You have no application deadlines in the next 7 days.
                </p>
              </div>
            ) : (
              <div>
                <h2 style={{ margin: "0 0 16px", color: "#1a2340", fontSize: 20 }}>
                  Upcoming Deadlines (Next 7 Days)
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "16px 20px",
                        boxShadow: "0 1px 6px rgba(0,0,0,0.07)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderLeft: `4px solid ${alert.daysUntil <= 2 ? "#e74c3c" : "#f39c12"}`,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2340" }}>
                          {alert.school_name}
                        </div>
                        <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                          {alert.deadline_type === "earlyDecision"
                            ? "Early Decision"
                            : alert.deadline_type === "earlyAction"
                            ? "Early Action"
                            : alert.deadline_type === "regularDecision"
                            ? "Regular Decision"
                            : alert.deadline_type === "financialAid"
                            ? "Financial Aid"
                            : alert.deadline_type}{" "}
                          · Due {formatDate(alert.deadline_date)}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: alert.daysUntil <= 2 ? "#e74c3c" : "#f39c12",
                          background:
                            alert.daysUntil <= 2 ? "#fdecea" : "#fff8e6",
                          padding: "6px 14px",
                          borderRadius: 20,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {alert.daysUntil === 0
                          ? "Due today!"
                          : alert.daysUntil === 1
                          ? "1 day left!"
                          : `${alert.daysUntil} days left`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add School Modal */}
      {addingSchool && (
        <div style={modalOverlayStyle} onClick={() => setAddingSchool(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", color: "#1a2340" }}>
              Track {addingSchool.name}
            </h3>
            <label style={labelStyle}>Deadline Type</label>
            <select
              value={addDeadlineType}
              onChange={(e) => setAddDeadlineType(e.target.value)}
              style={inputStyle}
            >
              {Object.entries(addingSchool.deadlines)
                .filter(([, v]) => v)
                .map(([type]) => (
                  <option key={type} value={type}>
                    {type === "earlyDecision"
                      ? "Early Decision"
                      : type === "earlyAction"
                      ? "Early Action"
                      : type === "regularDecision"
                      ? "Regular Decision"
                      : type === "financialAid"
                      ? "Financial Aid"
                      : type}
                  </option>
                ))}
            </select>
            <label style={labelStyle}>Status</label>
            <select
              value={addStatus}
              onChange={(e) => setAddStatus(e.target.value)}
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
              placeholder="Any notes about this application..."
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={handleAddApplication}
                disabled={addLoading}
                style={{ ...primaryBtnStyle, flex: 1, opacity: addLoading ? 0.7 : 1 }}
              >
                {addLoading ? "Adding..." : "Add Application"}
              </button>
              <button
                onClick={() => setAddingSchool(null)}
                style={{
                  flex: 1,
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingApp && (
        <div style={modalOverlayStyle} onClick={() => setEditingApp(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", color: "#1a2340" }}>
              Edit: {editingApp.school_name}
            </h3>
            <label style={labelStyle}>Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                style={{ ...primaryBtnStyle, flex: 1, opacity: editLoading ? 0.7 : 1 }}
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditingApp(null)}
                style={{
                  flex: 1,
                  background: "#f0f0f0",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#555",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #dde4f5",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  background: "white",
};

const primaryBtnStyle: React.CSSProperties = {
  background: "#1a56db",
  color: "white",
  border: "none",
  padding: "10px 20px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const iconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 16,
  padding: "4px",
  borderRadius: 4,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#444",
  marginBottom: 4,
  marginTop: 12,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 12,
  padding: 28,
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
};