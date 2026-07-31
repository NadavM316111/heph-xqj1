"use client";

import { useEffect, useState, useCallback } from "react";

interface DeadlineEntry {
  id: number;
  school_name: string;
  application_type: string;
  deadline_date: string;
  notes: string;
  email_reminder_sent: boolean;
  days_until: number;
}

interface User {
  email: string;
}

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
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Brown University",
  "Dartmouth College",
  "Cornell University",
  "Duke University",
  "Stanford University",
  "MIT",
  "Caltech",
  "Northwestern University",
  "Johns Hopkins University",
  "Vanderbilt University",
  "Rice University",
  "Notre Dame",
  "Georgetown University",
  "Emory University",
  "Carnegie Mellon University",
  "UC Berkeley",
  "UCLA",
  "University of Michigan",
  "University of Virginia",
  "UNC Chapel Hill",
  "Georgia Tech",
  "University of Florida",
  "University of Texas at Austin",
  "Penn State",
  "Ohio State University",
  "Purdue University",
  "University of Wisconsin-Madison",
  "University of Illinois Urbana-Champaign",
  "University of Washington",
  "Boston University",
  "Northeastern University",
  "Tufts University",
  "Wake Forest University",
  "Tulane University",
  "University of Southern California",
  "New York University",
  "Fordham University",
  "Boston College",
  "College of William & Mary",
  "University of Rochester",
  "Case Western Reserve University",
  "Lehigh University",
  "Rensselaer Polytechnic Institute",
  "Worcester Polytechnic Institute",
  "Stevens Institute of Technology",
];

function daysUntilLabel(days: number): { text: string; color: string } {
  if (days < 0) return { text: "Past due", color: "#dc2626" };
  if (days === 0) return { text: "Due today!", color: "#dc2626" };
  if (days <= 7) return { text: `${days}d left`, color: "#ea580c" };
  if (days <= 30) return { text: `${days}d left`, color: "#d97706" };
  return { text: `${days}d left`, color: "#16a34a" };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<DeadlineEntry[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formSchool, setFormSchool] = useState("");
  const [formType, setFormType] = useState(APPLICATION_TYPES[0]);
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [schoolSuggestions, setSchoolSuggestions] = useState<string[]>([]);

  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderEmailValue, setReminderEmailValue] = useState("");

  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">("upcoming");
  const [initialized, setInitialized] = useState(false);

  // Track page visit
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Check session on load
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.email) {
          setUser({ email: d.email });
        }
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  const fetchDeadlines = useCallback(async () => {
    setLoadingDeadlines(true);
    try {
      const res = await fetch("/api/deadlines");
      const data = await res.json();
      if (data.deadlines) setDeadlines(data.deadlines);
    } catch {
      // ignore
    } finally {
      setLoadingDeadlines(false);
    }
  }, []);

  const fetchReminderEmail = useCallback(async () => {
    try {
      const res = await fetch("/api/reminder-email");
      const data = await res.json();
      if (data.email) {
        setReminderEmailValue(data.email);
        setReminderEmail(data.email);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeadlines();
      fetchReminderEmail();
    }
  }, [user, fetchDeadlines, fetchReminderEmail]);

  const handleAuth = async (e: React.FormEvent) => {
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
      } else if (data.ok) {
        setUser({ email: data.email });
      }
    } catch {
      setAuthError("Something went wrong. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "logout" }),
    });
    setUser(null);
    setDeadlines([]);
    setReminderEmailValue("");
    setReminderEmail("");
  };

  const handleSchoolInput = (val: string) => {
    setFormSchool(val);
    if (val.length < 2) {
      setSchoolSuggestions([]);
      return;
    }
    const lower = val.toLowerCase();
    const matches = POPULAR_SCHOOLS.filter((s) => s.toLowerCase().includes(lower)).slice(0, 6);
    setSchoolSuggestions(matches);
  };

  const openAddForm = () => {
    setEditId(null);
    setFormSchool("");
    setFormType(APPLICATION_TYPES[0]);
    setFormDate("");
    setFormNotes("");
    setFormError("");
    setSchoolSuggestions([]);
    setShowForm(true);
  };

  const openEditForm = (d: DeadlineEntry) => {
    setEditId(d.id);
    setFormSchool(d.school_name);
    setFormType(d.application_type);
    setFormDate(d.deadline_date.slice(0, 10));
    setFormNotes(d.notes || "");
    setFormError("");
    setSchoolSuggestions([]);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSchool.trim()) { setFormError("School name is required."); return; }
    if (!formDate) { setFormError("Deadline date is required."); return; }
    setFormError("");
    setFormLoading(true);
    try {
      const body = {
        id: editId,
        school_name: formSchool.trim(),
        application_type: formType,
        deadline_date: formDate,
        notes: formNotes.trim(),
      };
      const res = await fetch("/api/deadlines", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) { setFormError(data.error); return; }
      setShowForm(false);
      fetchDeadlines();
    } catch {
      setFormError("Failed to save. Try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch("/api/deadlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setDeleteId(null);
      fetchDeadlines();
    } catch {
      // ignore
    }
  };

  const handleSaveReminderEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setReminderSaving(true);
    setReminderSaved(false);
    try {
      const res = await fetch("/api/reminder-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reminderEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        setReminderEmailValue(reminderEmail);
        setReminderSaved(true);
        setTimeout(() => setReminderSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setReminderSaving(false);
    }
  };

  const filteredDeadlines = deadlines.filter((d) => {
    if (filterStatus === "upcoming") return d.days_until >= 0;
    if (filterStatus === "past") return d.days_until < 0;
    return true;
  });

  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
  });

  const upcomingCount = deadlines.filter((d) => d.days_until >= 0 && d.days_until <= 7).length;

  if (!initialized) {
    return (
      <div style={styles.loadingScreen}>
        <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 80, height: 80, objectFit: "contain" }} />
        <p style={{ color: "#1e40af", marginTop: 16, fontWeight: 600 }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logoArea}>
            <img
              src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
              alt="Edutracker logo"
              style={{ width: 70, height: 70, objectFit: "contain" }}
            />
            <h1 style={styles.brandTitle}>Edutracker</h1>
            <p style={styles.brandSub}>Never miss a college application deadline.</p>
          </div>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(authMode === "signup" ? styles.tabActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
            <button
              style={{ ...styles.tab, ...(authMode === "login" ? styles.tabActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Log In
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
            {authError && <p style={styles.errorMsg}>{authError}</p>}
            <button style={styles.primaryBtn} type="submit" disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "signup" ? "Create Account" : "Log In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker"
            style={{ width: 38, height: 38, objectFit: "contain" }}
          />
          <span style={styles.headerBrand}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          {upcomingCount > 0 && (
            <span style={styles.urgentBadge}>🔔 {upcomingCount} due soon</span>
          )}
          <span style={styles.userEmail}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main style={styles.main}>
        {/* Reminder email section */}
        <section style={styles.reminderSection}>
          <h2 style={styles.sectionTitle}>📧 7-Day Email Reminders</h2>
          <p style={styles.sectionDesc}>
            We&apos;ll email you 7 days before each deadline. Make sure your reminder email is set:
          </p>
          <form onSubmit={handleSaveReminderEmail} style={styles.reminderForm}>
            <input
              style={{ ...styles.input, flex: 1, marginBottom: 0 }}
              type="email"
              placeholder="reminder@youremail.com"
              value={reminderEmail}
              onChange={(e) => setReminderEmail(e.target.value)}
              required
            />
            <button style={styles.primaryBtn} type="submit" disabled={reminderSaving}>
              {reminderSaving ? "Saving…" : reminderEmailValue ? "Update" : "Save"}
            </button>
          </form>
          {reminderSaved && <p style={styles.successMsg}>✅ Reminder email saved!</p>}
          {reminderEmailValue && !reminderSaved && (
            <p style={styles.currentReminder}>Current: <strong>{reminderEmailValue}</strong></p>
          )}
        </section>

        {/* Deadlines section */}
        <section style={styles.deadlineSection}>
          <div style={styles.deadlineHeader}>
            <h2 style={styles.sectionTitle}>📅 My Application Deadlines</h2>
            <button style={styles.addBtn} onClick={openAddForm}>+ Add School</button>
          </div>

          {/* Filter tabs */}
          <div style={styles.filterRow}>
            {(["upcoming", "all", "past"] as const).map((f) => (
              <button
                key={f}
                style={{ ...styles.filterBtn, ...(filterStatus === f ? styles.filterBtnActive : {}) }}
                onClick={() => setFilterStatus(f)}
              >
                {f === "upcoming" ? "Upcoming" : f === "all" ? "All" : "Past"}
              </button>
            ))}
          </div>

          {loadingDeadlines ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Loading deadlines…</p>
          ) : sortedDeadlines.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
              <p style={{ color: "#475569", fontWeight: 600, fontSize: 18 }}>No deadlines yet</p>
              <p style={{ color: "#94a3b8", marginTop: 6 }}>
                {filterStatus === "past"
                  ? "No past deadlines found."
                  : "Add your first school to get started!"}
              </p>
              {filterStatus !== "past" && (
                <button style={{ ...styles.primaryBtn, marginTop: 20 }} onClick={openAddForm}>
                  + Add Your First School
                </button>
              )}
            </div>
          ) : (
            <div style={styles.cardGrid}>
              {sortedDeadlines.map((d) => {
                const { text, color } = daysUntilLabel(d.days_until);
                const isPast = d.days_until < 0;
                return (
                  <div key={d.id} style={{ ...styles.deadlineCard, opacity: isPast ? 0.7 : 1 }}>
                    <div style={styles.cardTop}>
                      <div>
                        <div style={styles.schoolName}>{d.school_name}</div>
                        <div style={styles.appType}>{d.application_type}</div>
                      </div>
                      <div style={{ ...styles.daysChip, color, borderColor: color }}>
                        {text}
                      </div>
                    </div>
                    <div style={styles.deadlineDateRow}>
                      <span style={styles.deadlineDateLabel}>Deadline:</span>
                      <span style={styles.deadlineDateVal}>
                        {new Date(d.deadline_date + "T12:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {d.notes && <div style={styles.notes}>{d.notes}</div>}
                    {d.email_reminder_sent && (
                      <div style={styles.reminderSentTag}>✅ Reminder sent</div>
                    )}
                    <div style={styles.cardActions}>
                      <button style={styles.editBtn} onClick={() => openEditForm(d)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => setDeleteId(d.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={styles.modalOverlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editId ? "Edit Deadline" : "Add School Deadline"}</h2>
            <form onSubmit={handleFormSubmit} style={styles.form}>
              <label style={styles.label}>School Name</label>
              <div style={{ position: "relative" }}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Harvard University"
                  value={formSchool}
                  onChange={(e) => handleSchoolInput(e.target.value)}
                  autoComplete="off"
                />
                {schoolSuggestions.length > 0 && (
                  <div style={styles.suggestions}>
                    {schoolSuggestions.map((s) => (
                      <div
                        key={s}
                        style={styles.suggestion}
                        onMouseDown={() => { setFormSchool(s); setSchoolSuggestions([]); }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label style={styles.label}>Application Type</label>
              <select
                style={styles.input}
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
              >
                {APPLICATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <label style={styles.label}>Deadline Date</label>
              <input
                style={styles.input}
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />

              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, height: 80, resize: "vertical" }}
                placeholder="Any extra info…"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />

              {formError && <p style={styles.errorMsg}>{formError}</p>}

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={formLoading}>
                  {formLoading ? "Saving…" : editId ? "Save Changes" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div style={styles.modalOverlay} onClick={() => setDeleteId(null)}>
          <div style={{ ...styles.modal, maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Delete Deadline?</h2>
            <p style={{ color: "#475569", marginBottom: 24 }}>
              This will permanently remove this deadline. Are you sure?
            </p>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button style={{ ...styles.primaryBtn, background: "#dc2626" }} onClick={() => handleDelete(deleteId!)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
    background: "#f0f7ff",
  },
  authPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #93c5fd 100%)",
    padding: "20px",
  },
  authCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(30,64,175,0.25)",
  },
  logoArea: {
    textAlign: "center",
    marginBottom: 28,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e40af",
    margin: "10px 0 4px",
  },
  brandSub: {
    fontSize: 15,
    color: "#64748b",
    margin: 0,
  },
  tabRow: {
    display: "flex",
    borderRadius: 10,
    overflow: "hidden",
    border: "1.5px solid #dbeafe",
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "11px 0",
    border: "none",
    background: "#f8fafc",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
  },
  tabActive: {
    background: "#1e40af",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 2,
    marginTop: 8,
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 8,
    border: "1.5px solid #dbeafe",
    fontSize: 15,
    color: "#1e293b",
    background: "#f8faff",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 4,
  },
  primaryBtn: {
    marginTop: 8,
    padding: "13px 0",
    background: "#1e40af",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  },
  errorMsg: {
    color: "#dc2626",
    fontSize: 13,
    margin: "4px 0 0",
  },
  successMsg: {
    color: "#16a34a",
    fontSize: 13,
    marginTop: 8,
  },
  appShell: {
    minHeight: "100vh",
    background: "#f0f7ff",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "#1e40af",
    padding: "0 24px",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 12px rgba(30,64,175,0.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  headerBrand: {
    color: "#fff",
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: "-0.3px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  urgentBadge: {
    background: "#fbbf24",
    color: "#78350f",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  userEmail: {
    color: "#bfdbfe",
    fontSize: 13,
    maxWidth: 180,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    borderRadius: 6,
    padding: "5px 12px",
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  main: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "28px 16px 60px",
  },
  reminderSection: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px",
    marginBottom: 24,
    boxShadow: "0 2px 12px rgba(30,64,175,0.08)",
    border: "1.5px solid #dbeafe",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1e40af",
    margin: "0 0 6px",
  },
  sectionDesc: {
    color: "#64748b",
    fontSize: 14,
    margin: "0 0 14px",
  },
  reminderForm: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
  },
  currentReminder: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 8,
  },
  deadlineSection: {
    background: "#fff",
    borderRadius: 16,
    padding: "24px",
    boxShadow: "0 2px 12px rgba(30,64,175,0.08)",
    border: "1.5px solid #dbeafe",
  },
  deadlineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addBtn: {
    background: "#1e40af",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  filterBtn: {
    padding: "6px 16px",
    borderRadius: 20,
    border: "1.5px solid #dbeafe",
    background: "#f8faff",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  filterBtnActive: {
    background: "#1e40af",
    color: "#fff",
    borderColor: "#1e40af",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 16,
  },
  deadlineCard: {
    border: "1.5px solid #dbeafe",
    borderRadius: 14,
    padding: "18px",
    background: "#f8faff",
    transition: "box-shadow 0.15s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e293b",
    lineHeight: 1.3,
  },
  appType: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: 600,
    marginTop: 3,
  },
  daysChip: {
    fontSize: 13,
    fontWeight: 700,
    border: "1.5px solid",
    borderRadius: 20,
    padding: "3px 10px",
    whiteSpace: "nowrap",
    marginLeft: 8,
  },
  deadlineDateRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
    marginBottom: 8,
  },
  deadlineDateLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: 600,
  },
  deadlineDateVal: {
    fontSize: 13,
    color: "#334155",
    fontWeight: 600,
  },
  notes: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 8,
    fontStyle: "italic",
  },
  reminderSentTag: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: 600,
    marginBottom: 6,
  },
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 12,
  },
  editBtn: {
    flex: 1,
    padding: "7px 0",
    background: "#eff6ff",
    color: "#1e40af",
    border: "1.5px solid #bfdbfe",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteBtn: {
    flex: 1,
    padding: "7px 0",
    background: "#fff5f5",
    color: "#dc2626",
    border: "1.5px solid #fecaca",
    borderRadius: 7,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 18,
    padding: "32px 28px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: "#1e40af",
    margin: "0 0 20px",
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    padding: "13px 0",
    background: "#f1f5f9",
    color: "#475569",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 700,
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
    zIndex: 300,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    maxHeight: 220,
    overflowY: "auto",
  },
  suggestion: {
    padding: "10px 14px",
    fontSize: 14,
    color: "#1e293b",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  },
};