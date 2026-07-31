"use client";

import { useEffect, useState } from "react";

const LOGO_URL =
  "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

const POPULAR_SCHOOLS = [
  "Harvard University", "MIT", "Stanford University", "Yale University",
  "Princeton University", "Columbia University", "University of Pennsylvania",
  "Dartmouth College", "Brown University", "Cornell University",
  "Duke University", "Johns Hopkins University", "Northwestern University",
  "Vanderbilt University", "Rice University", "Notre Dame", "Georgetown University",
  "Emory University", "UC Berkeley", "UCLA", "University of Michigan",
  "University of Virginia", "NYU", "Boston University", "Tufts University",
  "Carnegie Mellon University", "University of Southern California",
  "Wake Forest University", "Tulane University", "Northeastern University",
];

type Application = {
  id: number;
  school_name: string;
  deadline: string;
  notes: string;
  status: string;
  created_at: string;
};

type AuthMode = "login" | "signup";

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const [formSchool, setFormSchool] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formStatus, setFormStatus] = useState("not_started");
  const [formError, setFormError] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "submitted">("all");

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) {
          setUserEmail(d.email);
          fetchApplications();
        }
      });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    });
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

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
      if (data.ok && data.email) {
        setUserEmail(data.email);
        fetchApplications();
      } else {
        setAuthError(data.error || "Something went wrong");
      }
    } catch {
      setAuthError("Network error");
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
    setUserEmail("");
    setApplications([]);
  }

  function openAddForm() {
    setEditingApp(null);
    setFormSchool("");
    setFormDeadline("");
    setFormNotes("");
    setFormStatus("not_started");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(app: Application) {
    setEditingApp(app);
    setFormSchool(app.school_name);
    setFormDeadline(app.deadline.split("T")[0]);
    setFormNotes(app.notes);
    setFormStatus(app.status);
    setFormError("");
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formSchool.trim()) { setFormError("School name is required"); return; }
    if (!formDeadline) { setFormError("Deadline is required"); return; }

    try {
      const body = {
        school_name: formSchool.trim(),
        deadline: formDeadline,
        notes: formNotes,
        status: formStatus,
        ...(editingApp ? { id: editingApp.id } : {}),
      };
      const res = await fetch("/api/applications", {
        method: editingApp ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      setShowForm(false);
      fetchApplications();
    } catch {
      setFormError("Network error");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this application?")) return;
    await fetch(`/api/applications?id=${id}`, { method: "DELETE" });
    fetchApplications();
  }

  function handleSchoolInput(val: string) {
    setFormSchool(val);
    if (val.length > 0) {
      const filtered = POPULAR_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6);
      setSchoolSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function daysUntil(deadline: string) {
    const d = new Date(deadline);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function statusLabel(status: string) {
    const map: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      submitted: "Submitted",
      accepted: "Accepted",
      rejected: "Rejected",
      waitlisted: "Waitlisted",
    };
    return map[status] || status;
  }

  function statusColor(status: string) {
    const map: Record<string, string> = {
      not_started: "#94a3b8",
      in_progress: "#f59e0b",
      submitted: "#3b82f6",
      accepted: "#22c55e",
      rejected: "#ef4444",
      waitlisted: "#a855f7",
    };
    return map[status] || "#94a3b8";
  }

  function urgencyColor(days: number) {
    if (days < 0) return "#ef4444";
    if (days <= 7) return "#ef4444";
    if (days <= 30) return "#f59e0b";
    return "#22c55e";
  }

  const filteredApps = applications.filter((app) => {
    if (activeTab === "upcoming") return app.status !== "submitted" && app.status !== "accepted" && app.status !== "rejected";
    if (activeTab === "submitted") return app.status === "submitted" || app.status === "accepted" || app.status === "rejected";
    return true;
  });

  const upcomingCount = applications.filter((a) => {
    const days = daysUntil(a.deadline);
    return days >= 0 && days <= 7 && a.status !== "submitted" && a.status !== "accepted";
  }).length;

  if (!userEmail) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <img src={LOGO_URL} alt="Edutracker Logo" style={styles.authLogo} />
          <h1 style={styles.authTitle}>Edutracker</h1>
          <p style={styles.authSubtitle}>Never miss a college application deadline</p>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tabBtn, ...(authMode === "login" ? styles.tabBtnActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Log In
            </button>
            <button
              style={{ ...styles.tabBtn, ...(authMode === "signup" ? styles.tabBtnActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.authForm}>
            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
              style={styles.input}
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" disabled={authLoading} style={styles.primaryBtn}>
              {authLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <p style={styles.guestNote}>
            Your data is private and secure. Track up to 20 colleges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={LOGO_URL} alt="Edutracker" style={styles.headerLogo} />
          <span style={styles.headerTitle}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          {upcomingCount > 0 && (
            <span style={styles.urgencyBadge}>{upcomingCount} due soon!</span>
          )}
          <span style={styles.userEmail}>{userEmail}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.toolbar}>
          <div style={styles.tabsRow}>
            {(["all", "upcoming", "submitted"] as const).map((tab) => (
              <button
                key={tab}
                style={{ ...styles.filterTab, ...(activeTab === tab ? styles.filterTabActive : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "all" ? "All" : tab === "upcoming" ? "Upcoming" : "Submitted"}
              </button>
            ))}
          </div>
          <button onClick={openAddForm} style={styles.addBtn}>+ Add School</button>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading your applications...</div>
        ) : filteredApps.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎓</p>
            <p style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              {activeTab === "all" ? "No applications yet" : `No ${activeTab} applications`}
            </p>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              {activeTab === "all" ? "Add your first college to get started tracking deadlines." : ""}
            </p>
            {activeTab === "all" && (
              <button onClick={openAddForm} style={styles.primaryBtn}>Add Your First School</button>
            )}
          </div>
        ) : (
          <div style={styles.cardGrid}>
            {filteredApps.map((app) => {
              const days = daysUntil(app.deadline);
              return (
                <div key={app.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.cardSchool}>{app.school_name}</h3>
                    <span
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: statusColor(app.status) + "22",
                        color: statusColor(app.status),
                        borderColor: statusColor(app.status),
                      }}
                    >
                      {statusLabel(app.status)}
                    </span>
                  </div>

                  <div style={styles.cardDeadline}>
                    <span style={styles.deadlineLabel}>Deadline</span>
                    <span style={styles.deadlineDate}>{formatDate(app.deadline)}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <span
                      style={{
                        ...styles.daysBadge,
                        backgroundColor: urgencyColor(days) + "18",
                        color: urgencyColor(days),
                      }}
                    >
                      {days < 0
                        ? `${Math.abs(days)} days overdue`
                        : days === 0
                        ? "Due today!"
                        : `${days} days left`}
                    </span>
                  </div>

                  {app.notes && (
                    <p style={styles.cardNotes}>{app.notes}</p>
                  )}

                  <div style={styles.cardActions}>
                    <button onClick={() => openEditForm(app)} style={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(app.id)} style={styles.deleteBtn}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>
              {editingApp ? "Edit Application" : "Add College"}
            </h2>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ position: "relative" }}>
                <label style={styles.label}>School Name *</label>
                <input
                  type="text"
                  value={formSchool}
                  onChange={(e) => handleSchoolInput(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="e.g. Harvard University"
                  style={styles.input}
                  autoComplete="off"
                />
                {showSuggestions && (
                  <div style={styles.suggestions}>
                    {schoolSuggestions.map((s) => (
                      <div
                        key={s}
                        style={styles.suggestionItem}
                        onMouseDown={() => {
                          setFormSchool(s);
                          setShowSuggestions(false);
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={styles.label}>Application Deadline *</label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={styles.input}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>

              <div>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any notes about this application..."
                  rows={3}
                  style={{ ...styles.input, resize: "vertical" }}
                />
              </div>

              {formError && <p style={styles.errorText}>{formError}</p>}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn}>
                  {editingApp ? "Save Changes" : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authPage: {
    minHeight: "100vh",
    backgroundColor: "#f0f4ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: "1.5rem",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 8px 40px rgba(37,99,235,0.12)",
    textAlign: "center",
  },
  authLogo: {
    width: "80px",
    height: "80px",
    objectFit: "contain",
    marginBottom: "0.5rem",
  },
  authTitle: {
    fontSize: "1.8rem",
    fontWeight: 800,
    color: "#1e3a8a",
    margin: "0 0 0.25rem",
  },
  authSubtitle: {
    color: "#64748b",
    fontSize: "0.95rem",
    marginBottom: "1.5rem",
  },
  tabRow: {
    display: "flex",
    backgroundColor: "#f1f5f9",
    borderRadius: "0.75rem",
    padding: "4px",
    marginBottom: "1.5rem",
  },
  tabBtn: {
    flex: 1,
    padding: "0.6rem",
    border: "none",
    borderRadius: "0.5rem",
    background: "transparent",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 500,
    color: "#64748b",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    backgroundColor: "#ffffff",
    color: "#1e3a8a",
    fontWeight: 700,
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    textAlign: "left",
  },
  guestNote: {
    marginTop: "1.25rem",
    fontSize: "0.8rem",
    color: "#94a3b8",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "0.75rem",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    backgroundColor: "#f8fafc",
    color: "#1e293b",
    fontFamily: "inherit",
  },
  primaryBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.8rem 1.5rem",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "0.875rem",
    margin: 0,
  },
  page: {
    minHeight: "100vh",
    backgroundColor: "#f0f4ff",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    padding: "0 1.5rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 12px rgba(30,58,138,0.3)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  headerLogo: {
    width: "36px",
    height: "36px",
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    letterSpacing: "-0.01em",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  urgencyBadge: {
    backgroundColor: "#ef4444",
    color: "#fff",
    borderRadius: "2rem",
    padding: "0.2rem 0.75rem",
    fontSize: "0.8rem",
    fontWeight: 700,
    animation: "pulse 2s infinite",
  },
  userEmail: {
    fontSize: "0.85rem",
    color: "#bfdbfe",
    display: "none" as "none",
  },
  logoutBtn: {
    backgroundColor: "transparent",
    border: "1.5px solid #bfdbfe",
    color: "#bfdbfe",
    borderRadius: "0.5rem",
    padding: "0.35rem 0.9rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.25rem",
    flexWrap: "wrap" as "wrap",
    gap: "0.75rem",
  },
  tabsRow: {
    display: "flex",
    gap: "0.5rem",
  },
  filterTab: {
    padding: "0.5rem 1rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "2rem",
    backgroundColor: "#ffffff",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#64748b",
  },
  filterTabActive: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
    fontWeight: 700,
  },
  addBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "0.75rem",
    padding: "0.65rem 1.25rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap" as "nowrap",
  },
  emptyState: {
    textAlign: "center" as "center",
    padding: "4rem 2rem",
    color: "#64748b",
    backgroundColor: "#ffffff",
    borderRadius: "1.25rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "1rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "1.25rem",
    padding: "1.25rem",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
    display: "flex",
    flexDirection: "column" as "column",
    gap: "0.5rem",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  cardSchool: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: "0.2rem 0.6rem",
    borderRadius: "2rem",
    border: "1px solid",
    whiteSpace: "nowrap" as "nowrap",
  },
  cardDeadline: {
    display: "flex",
    flexDirection: "column" as "column",
    gap: "2px",
  },
  deadlineLabel: {
    fontSize: "0.72rem",
    color: "#94a3b8",
    textTransform: "uppercase" as "uppercase",
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  deadlineDate: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  daysBadge: {
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "0.25rem 0.75rem",
    borderRadius: "2rem",
  },
  cardNotes: {
    fontSize: "0.85rem",
    color: "#64748b",
    margin: 0,
    lineHeight: 1.4,
    borderTop: "1px solid #f1f5f9",
    paddingTop: "0.5rem",
  },
  cardActions: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.25rem",
  },
  editBtn: {
    flex: 1,
    padding: "0.5rem",
    border: "1.5px solid #2563eb",
    borderRadius: "0.5rem",
    backgroundColor: "transparent",
    color: "#2563eb",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  deleteBtn: {
    flex: 1,
    padding: "0.5rem",
    border: "1.5px solid #ef4444",
    borderRadius: "0.5rem",
    backgroundColor: "transparent",
    color: "#ef4444",
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed" as "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: "1.25rem",
    padding: "2rem",
    width: "100%",
    maxWidth: "480px",
    maxHeight: "90vh",
    overflowY: "auto" as "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#1e3a8a",
    marginBottom: "1.5rem",
    marginTop: 0,
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#475569",
    marginBottom: "0.4rem",
  },
  cancelBtn: {
    padding: "0.8rem 1.5rem",
    border: "1.5px solid #e2e8f0",
    borderRadius: "0.75rem",
    backgroundColor: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  suggestions: {
    position: "absolute" as "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: "0.75rem",
    zIndex: 100,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  suggestionItem: {
    padding: "0.65rem 1rem",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#1e293b",
    borderBottom: "1px solid #f1f5f9",
  },
};