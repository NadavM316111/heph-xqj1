"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: number;
  name: string;
  state: string;
}

interface Deadline {
  id: number;
  college_name: string;
  deadline_type: string;
  deadline_date: string;
  notes: string;
}

type View = "auth" | "dashboard" | "add";

const DEADLINE_TYPES = ["EA", "ED", "ED2", "RD", "Rolling"];

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number): { bg: string; text: string; border: string; badge: string } {
  if (days < 0) return { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", badge: "#dc2626" };
  if (days <= 7) return { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5", badge: "#dc2626" };
  if (days <= 30) return { bg: "#fffbeb", text: "#92400e", border: "#fcd34d", badge: "#d97706" };
  return { bg: "#f0fdf4", text: "#14532d", border: "#86efac", badge: "#16a34a" };
}

function getUrgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today!";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export default function Home() {
  const [view, setView] = useState<View>("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  // Add form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [manualCollege, setManualCollege] = useState("");
  const [deadlineType, setDeadlineType] = useState("RD");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const [colleges, setColleges] = useState<College[]>([]);
  const [now, setNow] = useState(new Date());

  // tick every minute to keep countdowns fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // track page
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // check localStorage for session
  useEffect(() => {
    const stored = localStorage.getItem("edutracker_email");
    if (stored) {
      setUserEmail(stored);
      setView("dashboard");
    }
  }, []);

  // load colleges list
  useEffect(() => {
    fetch("/api/colleges")
      .then((r) => r.json())
      .then((data) => setColleges(data.colleges || []))
      .catch(() => {});
  }, []);

  const fetchDeadlines = useCallback(async (email: string) => {
    setLoadingDeadlines(true);
    try {
      const res = await fetch(`/api/deadlines?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.deadlines) {
        const sorted = [...data.deadlines].sort(
          (a: Deadline, b: Deadline) =>
            new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
        );
        setDeadlines(sorted);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDeadlines(false);
    }
  }, []);

  useEffect(() => {
    if (userEmail && view === "dashboard") {
      fetchDeadlines(userEmail);
    }
  }, [userEmail, view, fetchDeadlines]);

  // search colleges
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    setSearchResults(
      colleges.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8)
    );
  }, [searchQuery, colleges]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        localStorage.setItem("edutracker_email", data.email);
        setUserEmail(data.email);
        setView("dashboard");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("edutracker_email");
    setUserEmail(null);
    setEmail("");
    setPassword("");
    setDeadlines([]);
    setView("auth");
  }

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess(false);
    const collegeName = selectedCollege || manualCollege.trim();
    if (!collegeName) {
      setAddError("Please select or enter a college name.");
      return;
    }
    if (!deadlineDate) {
      setAddError("Please select a deadline date.");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          college_name: collegeName,
          deadline_type: deadlineType,
          deadline_date: deadlineDate,
          notes,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAddError(data.error);
      } else {
        setAddSuccess(true);
        setSearchQuery("");
        setSelectedCollege("");
        setManualCollege("");
        setDeadlineType("RD");
        setDeadlineDate("");
        setNotes("");
        setSearchResults([]);
        setTimeout(() => {
          setAddSuccess(false);
          setView("dashboard");
        }, 1200);
      }
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this deadline?")) return;
    try {
      await fetch(`/api/deadlines?id=${id}&email=${encodeURIComponent(userEmail || "")}`, {
        method: "DELETE",
      });
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
  }

  // ── AUTH SCREEN ────────────────────────────────────────────────────────────
  if (view === "auth") {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>Edutracker</span>
          </div>
          <p style={styles.tagline}>Track every college deadline. Miss nothing.</p>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(authMode === "login" ? styles.tabActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Log In
            </button>
            <button
              style={{ ...styles.tab, ...(authMode === "signup" ? styles.tabActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.form}>
            <input
              style={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
              minLength={6}
            />
            {authError && <div style={styles.errorBox}>{authError}</div>}
            <button style={styles.btnPrimary} type="submit" disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── ADD DEADLINE SCREEN ────────────────────────────────────────────────────
  if (view === "add") {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <button style={styles.backBtn} onClick={() => setView("dashboard")}>
              ← Back
            </button>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>🎓</span>
              <span style={styles.logoText}>Edutracker</span>
            </div>
            <span style={styles.userEmail}>{userEmail}</span>
          </div>
        </header>

        <main style={styles.main}>
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>Add a College Deadline</h2>

            <form onSubmit={handleAddDeadline} style={styles.form}>
              <label style={styles.label}>Search Colleges</label>
              <div style={{ position: "relative" }}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="Type a college name…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCollege("");
                  }}
                  autoComplete="off"
                />
                {selectedCollege && (
                  <div style={styles.selectedBadge}>
                    ✓ {selectedCollege}{" "}
                    <button
                      type="button"
                      style={styles.clearBtn}
                      onClick={() => { setSelectedCollege(""); setSearchQuery(""); }}
                    >
                      ×
                    </button>
                  </div>
                )}
                {searchResults.length > 0 && !selectedCollege && (
                  <ul style={styles.dropdown}>
                    {searchResults.map((c) => (
                      <li
                        key={c.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          setSelectedCollege(c.name);
                          setSearchQuery(c.name);
                          setSearchResults([]);
                          setManualCollege("");
                        }}
                      >
                        <strong>{c.name}</strong>
                        <span style={styles.stateTag}>{c.state}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <label style={styles.label}>Or enter manually</label>
              <input
                style={styles.input}
                type="text"
                placeholder="College name (if not in list)"
                value={manualCollege}
                onChange={(e) => {
                  setManualCollege(e.target.value);
                  if (e.target.value) {
                    setSelectedCollege("");
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
              />

              <label style={styles.label}>Application Type</label>
              <div style={styles.typeRow}>
                {DEADLINE_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    style={{
                      ...styles.typeBtn,
                      ...(deadlineType === t ? styles.typeBtnActive : {}),
                    }}
                    onClick={() => setDeadlineType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <label style={styles.label}>Deadline Date</label>
              <input
                style={styles.input}
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                required
              />

              <label style={styles.label}>Notes (optional)</label>
              <textarea
                style={{ ...styles.input, height: "80px", resize: "vertical" }}
                placeholder="Any extra info…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {addError && <div style={styles.errorBox}>{addError}</div>}
              {addSuccess && <div style={styles.successBox}>✓ Deadline added!</div>}

              <button style={styles.btnPrimary} type="submit" disabled={addLoading}>
                {addLoading ? "Saving…" : "Save Deadline"}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const overdue = deadlines.filter((d) => getDaysUntil(d.deadline_date) < 0);
  const upcoming = deadlines.filter((d) => getDaysUntil(d.deadline_date) >= 0);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>Edutracker</span>
          </div>
          <div style={styles.headerRight}>
            <span style={styles.userEmail}>{userEmail}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats bar */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNum}>{deadlines.length}</span>
            <span style={styles.statLabel}>Total Deadlines</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: "#dc2626" }}>
              {deadlines.filter((d) => {
                const days = getDaysUntil(d.deadline_date);
                return days >= 0 && days <= 7;
              }).length}
            </span>
            <span style={styles.statLabel}>Due Soon (&lt;7d)</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNum, color: "#16a34a" }}>
              {upcoming.length}
            </span>
            <span style={styles.statLabel}>Upcoming</span>
          </div>
        </div>

        {/* Add button */}
        <div style={styles.addRow}>
          <h2 style={styles.sectionTitle}>My Deadlines</h2>
          <button
            style={styles.btnAdd}
            onClick={() => setView("add")}
          >
            + Add Deadline
          </button>
        </div>

        {loadingDeadlines && (
          <div style={styles.emptyState}>Loading your deadlines…</div>
        )}

        {!loadingDeadlines && deadlines.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "18px" }}>No deadlines yet</p>
            <p style={{ margin: "8px 0 0", color: "#6b7280" }}>
              Click &ldquo;+ Add Deadline&rdquo; to start tracking your applications.
            </p>
          </div>
        )}

        {/* Overdue section */}
        {overdue.length > 0 && (
          <>
            <div style={styles.sectionHeader}>
              <span style={{ color: "#dc2626" }}>⚠ Overdue ({overdue.length})</span>
            </div>
            <div style={styles.cardList}>
              {overdue.map((d) => (
                <DeadlineCard key={d.id} deadline={d} onDelete={handleDelete} now={now} />
              ))}
            </div>
          </>
        )}

        {/* Upcoming section */}
        {upcoming.length > 0 && (
          <>
            {overdue.length > 0 && (
              <div style={styles.sectionHeader}>Upcoming ({upcoming.length})</div>
            )}
            <div style={styles.cardList}>
              {upcoming.map((d) => (
                <DeadlineCard key={d.id} deadline={d} onDelete={handleDelete} now={now} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DeadlineCard({
  deadline,
  onDelete,
  now,
}: {
  deadline: Deadline;
  onDelete: (id: number) => void;
  now: Date;
}) {
  void now; // used to trigger re-render
  const days = getDaysUntil(deadline.deadline_date);
  const colors = getUrgencyColor(days);
  const label = getUrgencyLabel(days);

  const dateObj = new Date(deadline.deadline_date + "T00:00:00");
  const formatted = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const typeColors: Record<string, string> = {
    EA: "#7c3aed",
    ED: "#1d4ed8",
    ED2: "#0369a1",
    RD: "#0f766e",
    Rolling: "#374151",
  };

  return (
    <div
      style={{
        ...styles.deadlineCard,
        backgroundColor: colors.bg,
        borderColor: colors.border,
      }}
    >
      <div style={styles.cardLeft}>
        <div style={styles.cardTop}>
          <span
            style={{
              ...styles.typePill,
              backgroundColor: typeColors[deadline.deadline_type] || "#374151",
            }}
          >
            {deadline.deadline_type}
          </span>
          <span style={styles.collegeName}>{deadline.college_name}</span>
        </div>
        <div style={{ ...styles.cardDate, color: colors.text }}>
          📅 {formatted}
        </div>
        {deadline.notes && (
          <div style={styles.cardNotes}>{deadline.notes}</div>
        )}
      </div>
      <div style={styles.cardRight}>
        <div
          style={{
            ...styles.countdown,
            backgroundColor: colors.badge,
          }}
        >
          {label}
        </div>
        <button
          style={styles.deleteBtn}
          onClick={() => onDelete(deadline.id)}
          title="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  authCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
  },
  logoIcon: { fontSize: "28px" },
  logoText: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#1e3a5f",
    letterSpacing: "-0.5px",
  },
  tagline: {
    color: "#6b7280",
    fontSize: "14px",
    marginBottom: "28px",
    marginTop: "4px",
  },
  tabRow: {
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  },
  tab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    color: "#6b7280",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    fontSize: "15px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "2px",
  },
  errorBox: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#dc2626",
    fontSize: "14px",
  },
  successBox: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#16a34a",
    fontSize: "14px",
    fontWeight: 600,
  },
  btnPrimary: {
    padding: "13px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginTop: "4px",
  },
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
  },
  header: {
    background: "#1e3a5f",
    padding: "0 20px",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  headerInner: {
    maxWidth: "900px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "60px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  userEmail: {
    color: "#93c5fd",
    fontSize: "13px",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #93c5fd",
    color: "#93c5fd",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#93c5fd",
    fontSize: "14px",
    cursor: "pointer",
    padding: "5px 0",
  },
  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "32px 20px",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  statCard: {
    flex: "1 1 140px",
    background: "#fff",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statNum: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#1e3a5f",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: 500,
  },
  addRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  btnAdd: {
    padding: "10px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#374151",
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  sectionHeader: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "10px",
    marginTop: "20px",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  deadlineCard: {
    background: "#fff",
    border: "1.5px solid #e5e7eb",
    borderRadius: "12px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    gap: "12px",
  },
  cardLeft: {
    flex: 1,
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "6px",
    flexWrap: "wrap",
  },
  typePill: {
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: "20px",
    letterSpacing: "0.04em",
    flexShrink: 0,
  },
  collegeName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardDate: {
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "4px",
  },
  cardNotes: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },
  cardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0,
  },
  countdown: {
    color: "#fff",
    fontSize: "13px",
    fontWeight: 700,
    padding: "5px 12px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: "16px",
    padding: "2px 4px",
    borderRadius: "4px",
  },
  formCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "36px",
    maxWidth: "600px",
    margin: "0 auto",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  formTitle: {
    fontSize: "22px",
    fontWeight: 800,
    color: "#1e3a5f",
    marginBottom: "24px",
    marginTop: 0,
  },
  selectedBadge: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "#1d4ed8",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "6px",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#1d4ed8",
    fontSize: "18px",
    lineHeight: 1,
    padding: 0,
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 50,
    listStyle: "none",
    margin: "4px 0 0",
    padding: "4px 0",
    maxHeight: "280px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    gap: "8px",
  },
  stateTag: {
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: "12px",
    padding: "2px 8px",
    borderRadius: "12px",
    flexShrink: 0,
  },
  typeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  typeBtn: {
    padding: "8px 16px",
    border: "1.5px solid #d1d5db",
    borderRadius: "8px",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  },
  typeBtnActive: {
    background: "#1e3a5f",
    color: "#fff",
    borderColor: "#1e3a5f",
  },
};