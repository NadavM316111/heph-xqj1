"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface User {
  email: string;
}

interface Application {
  id: number;
  school_name: string;
  deadline: string;
  notes: string;
  owner_email: string;
  created_at: string;
}

interface Alert {
  id: number;
  note: string;
  created_at: string;
  owner_email: string;
}

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
  "Vanderbilt University",
  "Rice University",
  "University of Notre Dame",
  "Georgetown University",
  "Emory University",
  "University of Michigan",
  "University of California, Berkeley",
  "UCLA",
  "University of Virginia",
  "University of North Carolina",
  "New York University",
  "Boston University",
  "Tufts University",
  "Wake Forest University",
  "University of Florida",
  "University of Texas at Austin",
  "Georgia Tech",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#94a3b8";
  if (days <= 7) return "#dc2626";
  if (days <= 30) return "#d97706";
  return "#16a34a";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past due";
  if (days === 0) return "Due today!";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

interface FooterProps {
  year: number;
}

function Footer({ year }: FooterProps) {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner}>
        <img src={LOGO_URL} alt="EduTracker" style={styles.footerLogo} />
        <div style={styles.footerText}>
          <span style={styles.footerBrand}>EduTracker</span>
          <span style={styles.footerYear}>&copy; {year}</span>
        </div>
        <p style={styles.footerTagline}>Never miss a college application deadline.</p>
      </div>
    </footer>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchool, setNewSchool] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState<"applications" | "alerts">("applications");

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [deleteAlertId, setDeleteAlertId] = useState<number | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch {
      // ignore
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch {
      // ignore
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { email?: string }) => {
        if (data.email) setUser({ email: data.email });
      })
      .catch(() => {})
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchAlerts();
    }
  }, [user, fetchApplications, fetchAlerts]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Something went wrong");
      } else {
        setUser({ email: data.email });
        setEmail("");
        setPassword("");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) {
      setNoteError("Please write a note before saving.");
      return;
    }
    setNoteLoading(true);
    setNoteError("");
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        await fetchAlerts();
        if (noteRef.current) noteRef.current.focus();
      } else {
        const d = await res.json();
        setNoteError(d.error || "Failed to save note.");
      }
    } catch {
      setNoteError("Network error.");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    setDeleteAlertId(id);
    try {
      await fetch("/api/alerts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchAlerts();
    } catch {
      // ignore
    } finally {
      setDeleteAlertId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setUser(null);
    setApplications([]);
  };

  const handleSchoolInput = (val: string) => {
    setNewSchool(val);
    if (val.length < 2) {
      setSchoolSuggestions([]);
      return;
    }
    const filtered = POPULAR_SCHOOLS.filter((s) =>
      s.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 6);
    setSchoolSuggestions(filtered);
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.trim() || !newDeadline) {
      setAddError("School name and deadline are required.");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: newSchool.trim(),
          deadline: newDeadline,
          notes: newNotes.trim(),
        }),
      });
      if (res.ok) {
        setNewSchool("");
        setNewDeadline("");
        setNewNotes("");
        setShowAddForm(false);
        setSchoolSuggestions([]);
        await fetchApplications();
      } else {
        const d = await res.json();
        setAddError(d.error || "Failed to add application.");
      }
    } catch {
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchApplications();
    } catch {
      // ignore
    } finally {
      setDeleteId(null);
    }
  };

  const sorted = [...applications].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  const currentYear = new Date().getFullYear();

  if (checkingSession) {
    return (
      <div style={styles.loadingScreen}>
        <img src={LOGO_URL} alt="EduTracker" style={styles.loadingLogo} />
        <p style={{ color: "#1d4ed8", marginTop: 16 }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <img src={LOGO_URL} alt="EduTracker" style={styles.authLogo} />
          <h1 style={styles.authTitle}>EduTracker</h1>
          <p style={styles.authSubtitle}>Never miss a college application deadline</p>
          <div style={styles.authToggleRow}>
            <button
              style={authMode === "login" ? styles.toggleActive : styles.toggleInactive}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Log In
            </button>
            <button
              style={authMode === "signup" ? styles.toggleActive : styles.toggleInactive}
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
            >
              Sign Up
            </button>
          </div>
          <form onSubmit={handleAuth} style={styles.authForm}>
            <div>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={styles.input}
              />
            </div>
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" disabled={authLoading} style={styles.primaryBtn}>
              {authLoading
                ? "Please wait…"
                : authMode === "login"
                ? "Log In"
                : "Create Account"}
            </button>
          </form>
          <p style={styles.authSwitch}>
            {authMode === "login" ? "New here? " : "Already have an account? "}
            <span
              style={styles.linkText}
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthError("");
              }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </span>
          </p>
        </div>
        <Footer year={currentYear} />
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.headerBrand}>
            <img src={LOGO_URL} alt="EduTracker" style={styles.headerLogo} />
            <span style={styles.headerTitle}>EduTracker</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.headerEmail}>{user.email}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.container}>
          <div style={styles.tabRow}>
            <button
              style={activeTab === "applications" ? styles.tabActive : styles.tabInactive}
              onClick={() => setActiveTab("applications")}
            >
              🎓 Applications
            </button>
            <button
              style={activeTab === "alerts" ? styles.tabActive : styles.tabInactive}
              onClick={() => setActiveTab("alerts")}
            >
              🔔 Reminder Notes
            </button>
          </div>

          {activeTab === "applications" && (
          <div style={styles.hero}>
            <h2 style={styles.heroTitle}>Your College Applications</h2>
            <p style={styles.heroSubtitle}>
              Track deadlines and get email reminders 7 days before each one.
            </p>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setAddError("");
              }}
              style={styles.primaryBtn}
            >
              {showAddForm ? "Cancel" : "+ Add Application"}
            </button>
          </div>
          )}

          {activeTab === "applications" && showAddForm && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Add a New Application</h3>
              <form onSubmit={handleAddApplication} style={styles.addForm}>
                <div style={{ position: "relative" }}>
                  <label style={styles.label}>School Name *</label>
                  <input
                    type="text"
                    value={newSchool}
                    onChange={(e) => handleSchoolInput(e.target.value)}
                    placeholder="e.g. Harvard University"
                    required
                    style={styles.input}
                    autoComplete="off"
                  />
                  {schoolSuggestions.length > 0 && (
                    <ul style={styles.suggestions}>
                      {schoolSuggestions.map((s) => (
                        <li
                          key={s}
                          style={styles.suggestionItem}
                          onMouseDown={() => {
                            setNewSchool(s);
                            setSchoolSuggestions([]);
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <label style={styles.label}>Application Deadline *</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    required
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="EA, ED, RD, scholarship info…"
                    rows={3}
                    style={{ ...styles.input, resize: "vertical" }}
                  />
                </div>
                {addError && <p style={styles.errorText}>{addError}</p>}
                <button type="submit" disabled={addLoading} style={styles.primaryBtn}>
                  {addLoading ? "Saving…" : "Save Application"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "alerts" && (
            <div style={styles.alertsSection}>
              <div style={styles.alertsHero}>
                <h2 style={styles.heroTitle}>Reminder Notes</h2>
                <p style={styles.heroSubtitle}>
                  Jot down anything you want to remember — interview tips, essay ideas, contacts, or personal deadlines.
                </p>
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Add a Reminder Note</h3>
                <form onSubmit={handleSaveNote} style={styles.addForm}>
                  <div>
                    <label style={styles.label}>Your note</label>
                    <textarea
                      ref={noteRef}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="e.g. Ask Ms. Johnson for a recommendation by Oct 1st…"
                      rows={4}
                      style={{ ...styles.input, resize: "vertical" }}
                    />
                  </div>
                  {noteError && <p style={styles.errorText}>{noteError}</p>}
                  <button type="submit" disabled={noteLoading} style={styles.primaryBtn}>
                    {noteLoading ? "Saving…" : "Save Note"}
                  </button>
                </form>
              </div>

              {alertsLoading ? (
                <p style={styles.emptyText}>Loading notes…</p>
              ) : alerts.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={styles.emptyIcon}>📝</p>
                  <p style={styles.emptyTitle}>No notes yet</p>
                  <p style={styles.emptyText}>Save your first reminder note above.</p>
                </div>
              ) : (
                <div style={styles.appsList}>
                  {alerts.map((alert) => (
                    <div key={alert.id} style={styles.alertCard}>
                      <div style={styles.alertCardInner}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={styles.alertNote}>{alert.note}</p>
                          <p style={styles.alertDate}>
                            Saved{" "}
                            {new Date(alert.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          disabled={deleteAlertId === alert.id}
                          style={styles.deleteBtn}
                          title="Delete note"
                        >
                          {deleteAlertId === alert.id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "applications" && appsLoading ? (
            <p style={styles.emptyText}>Loading your applications…</p>
          ) : activeTab === "applications" && sorted.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyIcon}>🎓</p>
              <p style={styles.emptyTitle}>No applications yet</p>
              <p style={styles.emptyText}>
                Add your first college application to start tracking deadlines.
              </p>
            </div>
          ) : activeTab === "applications" ? (
            <div style={styles.appsList}>
              {sorted.map((app) => {
                const days = daysUntil(app.deadline);
                const color = urgencyColor(days);
                const label = urgencyLabel(days);
                const isPast = days < 0;
                return (
                  <div
                    key={app.id}
                    style={{
                      ...styles.appCard,
                      opacity: isPast ? 0.65 : 1,
                      borderLeft: `4px solid ${color}`,
                    }}
                  >
                    <div style={styles.appCardTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={styles.schoolName}>{app.school_name}</h3>
                        <p style={styles.deadlineText}>
                          Deadline:{" "}
                          <strong>
                            {new Date(app.deadline + "T00:00:00").toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </strong>
                        </p>
                        {app.notes && <p style={styles.notesText}>{app.notes}</p>}
                      </div>
                      <div style={styles.appCardRight}>
                        <span style={{ ...styles.urgencyBadge, background: color }}>
                          {label}
                        </span>
                        <button
                          onClick={() => handleDelete(app.id)}
                          disabled={deleteId === app.id}
                          style={styles.deleteBtn}
                          title="Remove"
                        >
                          {deleteId === app.id ? "…" : "✕"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          ) : null}

          {activeTab === "applications" && applications.length > 0 && (
            <div style={styles.reminderNote}>
              <span style={styles.reminderIcon}>📧</span>
              <span>
                You&apos;ll receive an email reminder 7 days before each deadline at{" "}
                <strong>{user.email}</strong>.
              </span>
            </div>
          )}
        </div>
      </main>

      <Footer year={currentYear} />
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
    background: "#f0f4ff",
  },
  loadingLogo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  authPage: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    padding: "24px 16px",
  },
  authCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "40px 32px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  authLogo: {
    width: 72,
    height: 72,
    objectFit: "contain",
    marginBottom: 12,
  },
  authTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1d4ed8",
    marginBottom: 4,
  },
  authSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    textAlign: "center",
  },
  authToggleRow: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    background: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
    width: "100%",
  },
  toggleActive: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
  },
  toggleInactive: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
  },
  authSwitch: {
    marginTop: 20,
    fontSize: 14,
    color: "#64748b",
  },
  linkText: {
    color: "#1d4ed8",
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "underline",
  },
  appWrapper: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f0f4ff",
  },
  header: {
    background: "#1d4ed8",
    boxShadow: "0 2px 12px rgba(29,78,216,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "0 20px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 38,
    height: 38,
    objectFit: "contain",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.5px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  headerEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    maxWidth: 200,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "32px 16px 48px",
  },
  container: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  hero: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    borderRadius: 20,
    padding: "36px 32px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 1.5,
  },
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "28px 24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 20,
  },
  addForm: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 15,
    color: "#1e293b",
    background: "#f8fafc",
    outline: "none",
    fontFamily: "inherit",
  },
  suggestions: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#ffffff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    zIndex: 50,
    listStyle: "none",
    padding: "6px 0",
    marginTop: 4,
    maxHeight: 220,
    overflowY: "auto",
  },
  suggestionItem: {
    padding: "10px 16px",
    fontSize: 14,
    color: "#1e293b",
    cursor: "pointer",
  },
  primaryBtn: {
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    alignSelf: "flex-start",
    boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
    fontFamily: "inherit",
  },
  deleteBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    borderRadius: 8,
    width: 32,
    height: 32,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  appsList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  appCard: {
    background: "#ffffff",
    borderRadius: 14,
    padding: "20px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  appCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  appCardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 10,
    flexShrink: 0,
  },
  schoolName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  urgencyBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  emptyState: {
    background: "#ffffff",
    borderRadius: 16,
    padding: "52px 24px",
    textAlign: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e293b",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
  },
  tabRow: {
    display: "flex",
    gap: 8,
    background: "#ffffff",
    borderRadius: 14,
    padding: 6,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  tabActive: {
    flex: 1,
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  tabInactive: {
    flex: 1,
    padding: "11px 0",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  alertsSection: {
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  alertsHero: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)",
    borderRadius: 20,
    padding: "36px 32px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  alertCard: {
    background: "#ffffff",
    borderRadius: 14,
    padding: "18px 20px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    borderLeft: "4px solid #1d4ed8",
  },
  alertCardInner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  alertNote: {
    fontSize: 15,
    color: "#1e293b",
    lineHeight: 1.6,
    marginBottom: 6,
    whiteSpace: "pre-wrap",
  },
  alertDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  reminderNote: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 14,
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  reminderIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: 500,
  },
  footer: {
    background: "#1e3a8a",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    padding: "28px 16px",
    marginTop: "auto",
  },
  footerInner: {
    maxWidth: 760,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  footerLogo: {
    width: 36,
    height: 36,
    objectFit: "contain",
    marginBottom: 2,
  },
  footerText: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  footerBrand: {
    fontSize: 16,
    fontWeight: 800,
    color: "#ffffff",
    letterSpacing: "-0.3px",
  },
  footerYear: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 500,
  },
  footerTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
};