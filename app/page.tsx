"use client";

import { useEffect, useState, useCallback } from "react";

interface Application {
  id: number;
  school_name: string;
  deadline: string;
  app_type: string;
  notes: string;
  status: string;
  reminder_sent: boolean;
}

interface User {
  email: string;
}

const LOGO_URL =
  "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

const APP_TYPES = ["Early Decision", "Early Action", "Regular Decision", "Rolling"];
const STATUSES = ["Not Started", "In Progress", "Submitted", "Accepted", "Rejected", "Waitlisted"];

const POPULAR_SCHOOLS = [
  "Harvard University", "MIT", "Stanford University", "Yale University",
  "Princeton University", "Columbia University", "University of Pennsylvania",
  "Duke University", "Northwestern University", "Johns Hopkins University",
  "Dartmouth College", "Brown University", "Cornell University",
  "Rice University", "Vanderbilt University", "Notre Dame",
  "Georgetown University", "UCLA", "UC Berkeley", "University of Michigan",
  "NYU", "Boston University", "Emory University", "Tufts University",
  "Carnegie Mellon University", "University of Virginia", "UNC Chapel Hill",
  "Wake Forest University", "Tulane University", "Lehigh University",
  "Northeastern University", "University of Southern California",
  "University of Florida", "University of Texas at Austin",
  "Penn State University", "University of Wisconsin-Madison",
  "Ohio State University", "Purdue University", "Georgia Tech",
  "University of Illinois Urbana-Champaign",
];

function daysUntil(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(deadline + "T00:00:00");
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#aaa";
  if (days <= 7) return "#e53e3e";
  if (days <= 30) return "#dd6b20";
  return "#2b6cb0";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    deadline: "",
    app_type: "Regular Decision",
    notes: "",
    status: "Not Started",
  });
  const [schoolSearch, setSchoolSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"deadline" | "school">("deadline");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const fetchUser = useCallback(async () => {
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
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    setAppsLoading(true);
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.applications) {
        setApplications(data.applications);
      }
    } catch {
      //
    } finally {
      setAppsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchApplications();
  }, [user, fetchApplications]);

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
      } else if (data.email) {
        setUser({ email: data.email });
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch {
      setAuthError("Network error. Please try again.");
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
    setUser(null);
    setApplications([]);
  }

  function openAddForm() {
    setEditingApp(null);
    setFormData({ school_name: "", deadline: "", app_type: "Regular Decision", notes: "", status: "Not Started" });
    setSchoolSearch("");
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(app: Application) {
    setEditingApp(app);
    setFormData({
      school_name: app.school_name,
      deadline: app.deadline,
      app_type: app.app_type,
      notes: app.notes,
      status: app.status,
    });
    setSchoolSearch(app.school_name);
    setFormError("");
    setShowForm(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formData.school_name.trim()) { setFormError("School name is required."); return; }
    if (!formData.deadline) { setFormError("Deadline is required."); return; }
    setFormLoading(true);
    try {
      const url = editingApp ? `/api/applications/${editingApp.id}` : "/api/applications";
      const method = editingApp ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      setShowForm(false);
      fetchApplications();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/applications/${id}`, { method: "DELETE" });
      setDeleteId(null);
      fetchApplications();
    } catch {
      //
    }
  }

  const suggestions = schoolSearch.length > 0
    ? POPULAR_SCHOOLS.filter(s => s.toLowerCase().includes(schoolSearch.toLowerCase())).slice(0, 6)
    : [];

  const filtered = applications
    .filter(a => filterStatus === "All" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "deadline") return a.deadline.localeCompare(b.deadline);
      return a.school_name.localeCompare(b.school_name);
    });

  const upcoming = applications.filter(a => {
    const d = daysUntil(a.deadline);
    return d >= 0 && d <= 7;
  });

  if (checkingAuth) {
    return (
      <div style={styles.loadingContainer}>
        <img src={LOGO_URL} alt="Edutracker" style={styles.logoLarge} />
        <p style={{ color: "#2b6cb0", marginTop: 16 }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <img src={LOGO_URL} alt="Edutracker" style={styles.logoAuth} />
          <h1 style={styles.authTitle}>Edutracker</h1>
          <p style={styles.authSubtitle}>Never miss a college application deadline.</p>
          <div style={styles.authTabs}>
            <button
              style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >Sign In</button>
            <button
              style={{ ...styles.authTab, ...(authMode === "signup" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >Sign Up</button>
          </div>
          <form onSubmit={handleAuth} style={styles.authForm}>
            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              required
              style={styles.input}
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" disabled={authLoading} style={styles.btnPrimary}>
              {authLoading ? "..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerLogo}>
            <img src={LOGO_URL} alt="Edutracker" style={styles.logoSmall} />
            <span style={styles.headerTitle}>Edutracker</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.headerEmail}>{user.email}</span>
            <button onClick={handleLogout} style={styles.btnLogout}>Sign Out</button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Urgent banner */}
        {upcoming.length > 0 && (
          <div style={styles.urgentBanner}>
            <span style={styles.urgentIcon}>⚠️</span>
            <span>
              <strong>{upcoming.length} deadline{upcoming.length > 1 ? "s" : ""}</strong> within the next 7 days:{" "}
              {upcoming.map(a => `${a.school_name} (${daysUntil(a.deadline) === 0 ? "today!" : `${daysUntil(a.deadline)}d`})`).join(", ")}
            </span>
          </div>
        )}

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.controlsLeft}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={styles.select}
            >
              <option value="All">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as "deadline" | "school")}
              style={styles.select}
            >
              <option value="deadline">Sort by Deadline</option>
              <option value="school">Sort by School</option>
            </select>
          </div>
          <button onClick={openAddForm} style={styles.btnPrimary}>+ Add Application</button>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          {[
            { label: "Total", value: applications.length },
            { label: "In Progress", value: applications.filter(a => a.status === "In Progress").length },
            { label: "Submitted", value: applications.filter(a => a.status === "Submitted").length },
            { label: "Accepted", value: applications.filter(a => a.status === "Accepted").length },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Applications list */}
        {appsLoading ? (
          <div style={styles.emptyState}>Loading your applications...</div>
        ) : filtered.length === 0 ? (
          <div style={styles.emptyState}>
            {applications.length === 0
              ? "No applications yet. Add your first one!"
              : "No applications match this filter."}
          </div>
        ) : (
          <div style={styles.appGrid}>
            {filtered.map(app => {
              const days = daysUntil(app.deadline);
              const color = urgencyColor(days);
              return (
                <div key={app.id} style={styles.appCard}>
                  <div style={styles.appCardHeader}>
                    <div>
                      <div style={styles.schoolName}>{app.school_name}</div>
                      <div style={styles.appType}>{app.app_type}</div>
                    </div>
                    <div style={{ ...styles.daysChip, background: color }}>
                      {days < 0 ? "Past" : days === 0 ? "Today!" : `${days}d`}
                    </div>
                  </div>
                  <div style={styles.deadlineRow}>
                    <span style={styles.deadlineLabel}>Deadline:</span>
                    <span style={{ color }}>{formatDate(app.deadline)}</span>
                  </div>
                  <div style={styles.statusRow}>
                    <span style={{ ...styles.statusBadge, background: statusColor(app.status) }}>
                      {app.status}
                    </span>
                  </div>
                  {app.notes && <p style={styles.notes}>{app.notes}</p>}
                  <div style={styles.cardActions}>
                    <button onClick={() => openEditForm(app)} style={styles.btnEdit}>Edit</button>
                    <button onClick={() => setDeleteId(app.id)} style={styles.btnDelete}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editingApp ? "Edit Application" : "Add Application"}</h2>
            <form onSubmit={handleFormSubmit}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>School Name *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={e => {
                      setSchoolSearch(e.target.value);
                      setFormData(f => ({ ...f, school_name: e.target.value }));
                      setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="e.g. Harvard University"
                    style={styles.input}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={styles.suggestions}>
                      {suggestions.map(s => (
                        <div
                          key={s}
                          style={styles.suggestion}
                          onMouseDown={() => {
                            setSchoolSearch(s);
                            setFormData(f => ({ ...f, school_name: s }));
                            setShowSuggestions(false);
                          }}
                        >{s}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Deadline *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData(f => ({ ...f, deadline: e.target.value }))}
                  style={styles.input}
                />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Application Type</label>
                <select
                  value={formData.app_type}
                  onChange={e => setFormData(f => ({ ...f, app_type: e.target.value }))}
                  style={styles.input}
                >
                  {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  style={styles.input}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Essays, requirements, contacts..."
                  style={{ ...styles.input, height: 80, resize: "vertical" }}
                />
              </div>
              {formError && <p style={styles.errorText}>{formError}</p>}
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" disabled={formLoading} style={styles.btnPrimary}>
                  {formLoading ? "Saving..." : editingApp ? "Save Changes" : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <div style={styles.overlay} onClick={() => setDeleteId(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Delete Application?</h2>
            <p style={{ color: "#4a5568", marginBottom: 24 }}>This cannot be undone.</p>
            <div style={styles.modalActions}>
              <button onClick={() => setDeleteId(null)} style={styles.btnCancel}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ ...styles.btnPrimary, background: "#e53e3e" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    "Not Started": "#718096",
    "In Progress": "#2b6cb0",
    "Submitted": "#2f855a",
    "Accepted": "#276749",
    "Rejected": "#c53030",
    "Waitlisted": "#975a16",
  };
  return map[status] || "#718096";
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#ebf8ff" },
  logoLarge: { width: 100, height: 100, objectFit: "contain" },
  logoAuth: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 },
  logoSmall: { width: 36, height: 36, objectFit: "contain" },
  authPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)", padding: 16 },
  authCard: { background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(43,108,176,0.15)", padding: 40, width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center" },
  authTitle: { color: "#1a365d", fontSize: 28, fontWeight: 800, margin: "0 0 4px" },
  authSubtitle: { color: "#4a5568", fontSize: 15, marginBottom: 24, textAlign: "center" },
  authTabs: { display: "flex", gap: 0, marginBottom: 24, borderRadius: 8, overflow: "hidden", border: "1.5px solid #bee3f8", width: "100%" },
  authTab: { flex: 1, padding: "10px 0", background: "#fff", border: "none", cursor: "pointer", fontSize: 15, color: "#2b6cb0", fontWeight: 600 },
  authTabActive: { background: "#2b6cb0", color: "#fff" },
  authForm: { width: "100%", display: "flex", flexDirection: "column", gap: 12 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #bee3f8", fontSize: 15, color: "#1a365d", outline: "none", background: "#f7fafc", boxSizing: "border-box" },
  errorText: { color: "#e53e3e", fontSize: 13, margin: "0" },
  btnPrimary: { background: "#2b6cb0", color: "#fff", border: "none", borderRadius: 8, padding: "11px 22px", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%" },
  btnLogout: { background: "transparent", border: "1.5px solid #bee3f8", borderRadius: 8, padding: "6px 16px", fontSize: 14, color: "#2b6cb0", cursor: "pointer", fontWeight: 600 },
  btnEdit: { background: "#ebf8ff", color: "#2b6cb0", border: "1.5px solid #bee3f8", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnDelete: { background: "#fff5f5", color: "#e53e3e", border: "1.5px solid #fed7d7", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnCancel: { background: "#f7fafc", color: "#4a5568", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 20px", fontSize: 15, cursor: "pointer", fontWeight: 600 },
  page: { minHeight: "100vh", background: "#f0f7ff" },
  header: { background: "#1a365d", color: "#fff", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" },
  headerInner: { maxWidth: 900, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 },
  headerLogo: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: 0.5 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  headerEmail: { color: "#bee3f8", fontSize: 13 },
  main: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  urgentBanner: { background: "#fff5f5", border: "1.5px solid #fc8181", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10, color: "#c53030", fontSize: 14 },
  urgentIcon: { fontSize: 20 },
  controls: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 12, flexWrap: "wrap" },
  controlsLeft: { display: "flex", gap: 10, flexWrap: "wrap" },
  select: { padding: "8px 12px", borderRadius: 8, border: "1.5px solid #bee3f8", fontSize: 14, color: "#1a365d", background: "#fff", cursor: "pointer" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: "16px 12px", textAlign: "center", boxShadow: "0 2px 8px rgba(43,108,176,0.07)", border: "1.5px solid #ebf8ff" },
  statValue: { fontSize: 28, fontWeight: 800, color: "#2b6cb0" },
  statLabel: { fontSize: 12, color: "#718096", fontWeight: 600, marginTop: 2 },
  appGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 },
  appCard: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(43,108,176,0.08)", border: "1.5px solid #ebf8ff", display: "flex", flexDirection: "column", gap: 8 },
  appCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  schoolName: { fontSize: 17, fontWeight: 700, color: "#1a365d" },
  appType: { fontSize: 12, color: "#718096", marginTop: 2 },
  daysChip: { color: "#fff", borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" },
  deadlineRow: { fontSize: 14, color: "#4a5568", display: "flex", gap: 6 },
  deadlineLabel: { color: "#718096" },
  statusRow: { display: "flex" },
  statusBadge: { color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700 },
  notes: { fontSize: 13, color: "#718096", margin: 0, borderTop: "1px solid #ebf8ff", paddingTop: 8 },
  cardActions: { display: "flex", gap: 8, marginTop: 4 },
  emptyState: { textAlign: "center", color: "#718096", padding: "48px 0", fontSize: 16 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#1a365d", marginBottom: 20 },
  modalActions: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 },
  fieldGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#4a5568", marginBottom: 6 },
  suggestions: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #bee3f8", borderRadius: 8, zIndex: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", maxHeight: 220, overflowY: "auto" },
  suggestion: { padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#1a365d" },
};