"use client";

import { useState, useEffect } from "react";

const LOGO_URL =
  "https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png";

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
  "Johns Hopkins University",
  "Northwestern University",
  "Georgetown University",
  "University of Michigan",
  "UC Berkeley",
  "UCLA",
  "University of Virginia",
  "Carnegie Mellon University",
  "Vanderbilt University",
  "Emory University",
  "NYU",
  "Boston College",
  "Tufts University",
  "Wake Forest University",
  "Rice University",
  "University of Notre Dame",
  "Washington University in St. Louis",
  "University of Chicago",
  "Amherst College",
  "Williams College",
  "Swarthmore College",
  "Wellesley College",
  "Bowdoin College",
  "Middlebury College",
  "Hamilton College",
  "Colby College",
  "Colgate University",
  "Lehigh University",
  "Northeastern University",
];

const APPLICATION_TYPES = [
  "Early Decision (ED)",
  "Early Decision II (ED II)",
  "Early Action (EA)",
  "Restrictive Early Action (REA)",
  "Regular Decision (RD)",
  "Rolling Admission",
];

interface Deadline {
  id: number;
  school_name: string;
  deadline_date: string;
  application_type: string;
  notes: string;
  created_at: string;
}

type AuthMode = "login" | "signup";

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formSchool, setFormSchool] = useState("");
  const [formSchoolCustom, setFormSchoolCustom] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "all">("upcoming");

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
      .then((data) => {
        setEmail(data.email || "");
        setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (email) fetchDeadlines();
    else setDeadlines([]);
  }, [email]);

  async function fetchDeadlines() {
    setLoadingDeadlines(true);
    try {
      const r = await fetch("/api/deadlines");
      if (r.ok) {
        const data = await r.json();
        setDeadlines(data.deadlines || []);
      }
    } catch {}
    setLoadingDeadlines(false);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await r.json();
      if (data.ok) {
        setEmail(data.email);
        setAuthEmail("");
        setAuthPassword("");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
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

  function handleSchoolInput(val: string) {
    setFormSchool(val);
    if (val.length > 1) {
      const suggestions = POPULAR_SCHOOLS.filter((s) =>
        s.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 6);
      setSchoolSuggestions(suggestions);
    } else {
      setSchoolSuggestions([]);
    }
  }

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const schoolName = formSchool === "__custom__" ? formSchoolCustom : formSchool;
    if (!schoolName.trim()) {
      setFormError("Please enter a school name.");
      return;
    }
    if (!formDate) {
      setFormError("Please select a deadline date.");
      return;
    }
    if (!formType) {
      setFormError("Please select an application type.");
      return;
    }
    setFormLoading(true);
    try {
      const r = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: schoolName.trim(),
          deadline_date: formDate,
          application_type: formType,
          notes: formNotes,
        }),
      });
      const data = await r.json();
      if (data.ok) {
        setDeadlines((prev) =>
          [...prev, data.deadline].sort(
            (a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
          )
        );
        setShowForm(false);
        setFormSchool("");
        setFormSchoolCustom("");
        setFormDate("");
        setFormType("");
        setFormNotes("");
      } else {
        setFormError(data.error || "Failed to add deadline.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setFormLoading(false);
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
    try {
      await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
    } catch {}
    setDeleteId(null);
  }

  function daysUntil(dateStr: string) {
    const deadline = new Date(dateStr + "T23:59:59");
    const now = new Date();
    const diff = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function urgencyColor(days: number) {
    if (days < 0) return "#9ca3af";
    if (days <= 7) return "#ef4444";
    if (days <= 30) return "#f59e0b";
    return "#10b981";
  }

  function urgencyLabel(days: number) {
    if (days < 0) return "Passed";
    if (days === 0) return "Due Today!";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  }

  const now = new Date();
  const upcomingDeadlines = deadlines.filter((d) => new Date(d.deadline_date + "T23:59:59") >= now);
  const displayedDeadlines = activeTab === "upcoming" ? upcomingDeadlines : deadlines;

  // ---- AUTH SCREEN ----
  if (checkingSession) {
    return (
      <div style={styles.loadingScreen}>
        <img src={LOGO_URL} alt="Edutracker" style={styles.loadingLogo} />
        <p style={{ color: "#3b82f6", marginTop: 16 }}>Loading…</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <img src={LOGO_URL} alt="Edutracker" style={styles.authLogo} />
          <h1 style={styles.authTitle}>Edutracker</h1>
          <p style={styles.authSubtitle}>Never miss a college application deadline.</p>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tabBtn, ...(authMode === "login" ? styles.tabBtnActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Sign In
            </button>
            <button
              style={{ ...styles.tabBtn, ...(authMode === "signup" ? styles.tabBtnActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              required
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            />
            {authError && <p style={styles.errorMsg}>{authError}</p>}
            <button type="submit" style={styles.primaryBtn} disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- MAIN APP ----
  return (
    <div style={styles.appShell}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img src={LOGO_URL} alt="Edutracker" style={styles.headerLogo} />
          <span style={styles.headerTitle}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerEmail}>{email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats bar */}
        <div style={styles.statsBar}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{deadlines.length}</span>
            <span style={styles.statLabel}>Total Schools</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{upcomingDeadlines.length}</span>
            <span style={styles.statLabel}>Upcoming</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>
              {deadlines.filter((d) => daysUntil(d.deadline_date) <= 7 && daysUntil(d.deadline_date) >= 0).length}
            </span>
            <span style={styles.statLabel}>Due This Week</span>
          </div>
        </div>

        {/* Add button + tabs */}
        <div style={styles.actionRow}>
          <div style={styles.miniTabs}>
            <button
              style={{ ...styles.miniTab, ...(activeTab === "upcoming" ? styles.miniTabActive : {}) }}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming
            </button>
            <button
              style={{ ...styles.miniTab, ...(activeTab === "all" ? styles.miniTabActive : {}) }}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
          </div>
          <button style={styles.addBtn} onClick={() => setShowForm(true)}>
            + Add Deadline
          </button>
        </div>

        {/* Add Deadline Modal */}
        {showForm && (
          <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>Add College Deadline</h2>
              <form onSubmit={handleAddDeadline}>
                <label style={styles.label}>School Name</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={formSchool === "__custom__" ? formSchoolCustom : formSchool}
                    onChange={(e) => {
                      handleSchoolInput(e.target.value);
                    }}
                    style={styles.input}
                    placeholder="Search or type school name…"
                    autoComplete="off"
                  />
                  {schoolSuggestions.length > 0 && (
                    <ul style={styles.suggestions}>
                      {schoolSuggestions.map((s) => (
                        <li
                          key={s}
                          style={styles.suggestionItem}
                          onClick={() => {
                            setFormSchool(s);
                            setSchoolSuggestions([]);
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <label style={styles.label}>Deadline Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  style={styles.input}
                  min={new Date().toISOString().split("T")[0]}
                />

                <label style={styles.label}>Application Type</label>
                <select
                  required
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select type…</option>
                  {APPLICATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  style={{ ...styles.input, height: 72, resize: "vertical" }}
                  placeholder="e.g., need recommendation letters"
                />

                {formError && <p style={styles.errorMsg}>{formError}</p>}

                <div style={styles.modalButtons}>
                  <button
                    type="button"
                    style={styles.cancelBtn}
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.primaryBtn} disabled={formLoading}>
                    {formLoading ? "Saving…" : "Add Deadline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deadline list */}
        {loadingDeadlines ? (
          <div style={styles.emptyState}>
            <p style={{ color: "#6b7280" }}>Loading your deadlines…</p>
          </div>
        ) : displayedDeadlines.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <p style={{ color: "#374151", fontWeight: 600, fontSize: 18 }}>No deadlines yet</p>
            <p style={{ color: "#6b7280", marginTop: 4 }}>
              {activeTab === "upcoming"
                ? "Add your first college application deadline to get started."
                : "You haven't added any deadlines yet."}
            </p>
            <button style={{ ...styles.primaryBtn, marginTop: 20 }} onClick={() => setShowForm(true)}>
              + Add Your First Deadline
            </button>
          </div>
        ) : (
          <div style={styles.deadlineList}>
            {displayedDeadlines.map((d) => {
              const days = daysUntil(d.deadline_date);
              const color = urgencyColor(days);
              const label = urgencyLabel(days);
              return (
                <div key={d.id} style={styles.deadlineCard}>
                  <div style={{ ...styles.urgencyBar, background: color }} />
                  <div style={styles.cardBody}>
                    <div style={styles.cardTop}>
                      <div>
                        <h3 style={styles.schoolName}>{d.school_name}</h3>
                        <span style={styles.appType}>{d.application_type}</span>
                      </div>
                      <div style={styles.cardRight}>
                        <span style={{ ...styles.urgencyBadge, background: color }}>
                          {label}
                        </span>
                        <button
                          style={styles.deleteBtn}
                          onClick={() => handleDelete(d.id)}
                          disabled={deleteId === d.id}
                          title="Remove deadline"
                        >
                          {deleteId === d.id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                    <div style={styles.dateRow}>
                      <span style={styles.dateIcon}>📅</span>
                      <span style={styles.dateText}>{formatDate(d.deadline_date)}</span>
                    </div>
                    {d.notes && (
                      <p style={styles.notesText}>{d.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f6ff",
  },
  loadingLogo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  authPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #e0f2fe 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  authCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 20px 60px rgba(59,130,246,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  authLogo: {
    width: 72,
    height: 72,
    objectFit: "contain",
    marginBottom: 8,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e40af",
    margin: "0 0 4px",
  },
  authSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
  },
  tabRow: {
    display: "flex",
    width: "100%",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #dbeafe",
  },
  tabBtn: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "#f9fafb",
    color: "#6b7280",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "#3b82f6",
    color: "#fff",
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 14,
    color: "#111827",
    background: "#f9fafb",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  errorMsg: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 8,
  },
  primaryBtn: {
    marginTop: 20,
    padding: "12px 0",
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  // App shell
  appShell: {
    minHeight: "100vh",
    background: "#f0f6ff",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #dbeafe",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(59,130,246,0.08)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 36,
    height: 36,
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e40af",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerEmail: {
    fontSize: 12,
    color: "#6b7280",
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "transparent",
    border: "1.5px solid #dbeafe",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: 600,
  },
  main: {
    flex: 1,
    maxWidth: 720,
    width: "100%",
    margin: "0 auto",
    padding: "24px 16px 60px",
    boxSizing: "border-box",
  },
  statsBar: {
    display: "flex",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    background: "#fff",
    borderRadius: 12,
    padding: "16px 12px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(59,130,246,0.07)",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e40af",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    textAlign: "center",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  miniTabs: {
    display: "flex",
    gap: 0,
    background: "#e0eafb",
    borderRadius: 8,
    padding: 3,
  },
  miniTab: {
    padding: "6px 16px",
    border: "none",
    background: "transparent",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#6b7280",
    cursor: "pointer",
  },
  miniTabActive: {
    background: "#fff",
    color: "#1e40af",
    boxShadow: "0 1px 4px rgba(59,130,246,0.15)",
  },
  addBtn: {
    background: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  },
  deadlineList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  deadlineCard: {
    background: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    display: "flex",
    boxShadow: "0 2px 10px rgba(59,130,246,0.08)",
  },
  urgencyBar: {
    width: 5,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    padding: "14px 16px",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  appType: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    display: "block",
  },
  urgencyBadge: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 20,
    padding: "3px 10px",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#d1d5db",
    cursor: "pointer",
    fontSize: 14,
    padding: 2,
    lineHeight: 1,
  },
  dateRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  dateIcon: {
    fontSize: 14,
  },
  dateText: {
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
  },
  notesText: {
    marginTop: 6,
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },
  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 20,
    padding: "28px 24px",
    width: "100%",
    maxWidth: 460,
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e40af",
    margin: "0 0 4px",
  },
  modalButtons: {
    display: "flex",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    padding: "12px 0",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 10,
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  suggestions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1.5px solid #dbeafe",
    borderRadius: 8,
    listStyle: "none",
    margin: 0,
    padding: 0,
    zIndex: 300,
    boxShadow: "0 8px 24px rgba(59,130,246,0.15)",
  },
  suggestionItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: 14,
    color: "#111827",
    borderBottom: "1px solid #f3f4f6",
    transition: "background 0.15s",
  },
};