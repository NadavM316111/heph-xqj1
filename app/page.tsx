"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES } from "../lib/colleges";

type AuthMode = "login" | "signup";
type DeadlineType = "Early Decision" | "Early Action" | "Regular Decision";

interface Deadline {
  id: number;
  college_name: string;
  deadline_type: DeadlineType;
  deadline_date: string;
  notes: string;
}

interface User {
  email: string;
}

const DEADLINE_TYPES: DeadlineType[] = [
  "Early Decision",
  "Early Action",
  "Regular Decision",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days < 7) return "#ef4444";
  if (days < 30) return "#f59e0b";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past";
  if (days < 7) return "Urgent";
  if (days < 30) return "Soon";
  return "On track";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days < 7) return "#fef2f2";
  if (days < 30) return "#fffbeb";
  return "#f0fdf4";
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [view, setView] = useState<"dashboard" | "add">("dashboard");

  // Add form
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [manualCollege, setManualCollege] = useState("");
  const [deadlineType, setDeadlineType] = useState<DeadlineType>(
    "Regular Decision"
  );
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [useManual, setUseManual] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const fetchDeadlines = useCallback(async (userEmail: string) => {
    setLoadingDeadlines(true);
    try {
      const res = await fetch(
        `/api/deadlines?email=${encodeURIComponent(userEmail)}`
      );
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data.deadlines || []);
      }
    } catch {}
    setLoadingDeadlines(false);
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeadlines(user.email);
    }
  }, [user, fetchDeadlines]);

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
      if (data.ok) {
        const u = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  function handleLogout() {
    setUser(null);
    setDeadlines([]);
    localStorage.removeItem("edutracker_user");
    setView("dashboard");
  }

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess(false);
    const collegeName = useManual ? manualCollege.trim() : selectedCollege;
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
          email: user!.email,
          college_name: collegeName,
          deadline_type: deadlineType,
          deadline_date: deadlineDate,
          notes,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddSuccess(true);
        setSelectedCollege("");
        setManualCollege("");
        setDeadlineType("Regular Decision");
        setDeadlineDate("");
        setNotes("");
        setSearchQuery("");
        fetchDeadlines(user!.email);
        setTimeout(() => {
          setView("dashboard");
          setAddSuccess(false);
        }, 1200);
      } else {
        setAddError(data.error || "Failed to add deadline.");
      }
    } catch {
      setAddError("Network error. Please try again.");
    }
    setAddLoading(false);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch("/api/deadlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: user!.email }),
      });
      if (res.ok) {
        setDeadlines((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {}
    setDeletingId(null);
  }

  const filteredColleges = COLLEGES.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const sortedDeadlines = [...deadlines].sort(
    (a, b) =>
      new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()
  );

  const typeShort: Record<DeadlineType, string> = {
    "Early Decision": "ED",
    "Early Action": "EA",
    "Regular Decision": "RD",
  };

  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.authTitle}>Edutracker</h1>
          <p style={styles.authSubtitle}>
            Never miss a college application deadline
          </p>

          <div style={styles.tabRow}>
            <button
              style={{
                ...styles.tabBtn,
                ...(authMode === "login" ? styles.tabBtnActive : {}),
              }}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Log In
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(authMode === "signup" ? styles.tabBtnActive : {}),
              }}
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.authForm}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={styles.input}
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              minLength={6}
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button
              type="submit"
              style={styles.primaryBtn}
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Log In"
                : "Create Account"}
            </button>
          </form>

          <p style={styles.switchText}>
            {authMode === "login"
              ? "New here? "
              : "Already have an account? "}
            <button
              style={styles.linkBtn}
              onClick={() => {
                setAuthMode(authMode === "login" ? "signup" : "login");
                setAuthError("");
              }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appPage}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerLogo}>🎓</span>
          <span style={styles.headerTitle}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerEmail}>{user.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav style={styles.nav}>
        <button
          style={{
            ...styles.navBtn,
            ...(view === "dashboard" ? styles.navBtnActive : {}),
          }}
          onClick={() => setView("dashboard")}
        >
          📋 My Deadlines
        </button>
        <button
          style={{
            ...styles.navBtn,
            ...(view === "add" ? styles.navBtnActive : {}),
          }}
          onClick={() => {
            setView("add");
            setAddError("");
            setAddSuccess(false);
          }}
        >
          ➕ Add Deadline
        </button>
      </nav>

      <main style={styles.main}>
        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Application Deadlines</h2>
              <span style={styles.sectionCount}>
                {deadlines.length} deadline{deadlines.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Legend */}
            <div style={styles.legend}>
              <span style={{ ...styles.legendItem, color: "#ef4444" }}>
                🔴 &lt;7 days
              </span>
              <span style={{ ...styles.legendItem, color: "#f59e0b" }}>
                🟡 &lt;30 days
              </span>
              <span style={{ ...styles.legendItem, color: "#22c55e" }}>
                🟢 On track
              </span>
              <span style={{ ...styles.legendItem, color: "#9ca3af" }}>
                ⚫ Past
              </span>
            </div>

            {loadingDeadlines && (
              <p style={styles.emptyText}>Loading deadlines…</p>
            )}

            {!loadingDeadlines && deadlines.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📅</div>
                <p style={styles.emptyTitle}>No deadlines yet</p>
                <p style={styles.emptyDesc}>
                  Add your first college deadline to get started.
                </p>
                <button
                  style={styles.primaryBtn}
                  onClick={() => setView("add")}
                >
                  Add a Deadline
                </button>
              </div>
            )}

            <div style={styles.deadlineList}>
              {sortedDeadlines.map((d) => {
                const days = daysUntil(d.deadline_date);
                const color = urgencyColor(days);
                const bg = urgencyBg(days);
                const label = urgencyLabel(days);
                const dateObj = new Date(d.deadline_date + "T00:00:00");
                const formatted = dateObj.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <div key={d.id} style={{ ...styles.deadlineCard, background: bg }}>
                    <div style={styles.deadlineLeft}>
                      <div style={{ ...styles.urgencyBar, background: color }} />
                      <div style={styles.deadlineInfo}>
                        <div style={styles.deadlineCollege}>
                          {d.college_name}
                        </div>
                        <div style={styles.deadlineMeta}>
                          <span
                            style={{
                              ...styles.typeTag,
                              background: color + "22",
                              color: color,
                              border: `1px solid ${color}44`,
                            }}
                          >
                            {typeShort[d.deadline_type as DeadlineType] ??
                              d.deadline_type}
                          </span>
                          <span style={styles.deadlineDate}>{formatted}</span>
                          {d.notes && (
                            <span style={styles.deadlineNotes}>
                              📝 {d.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div style={styles.deadlineRight}>
                      <div style={{ ...styles.daysChip, color, borderColor: color + "66" }}>
                        {days < 0
                          ? "Passed"
                          : days === 0
                          ? "Today!"
                          : `${days}d`}
                      </div>
                      <div style={{ ...styles.urgencyLabel, color }}>
                        {label}
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        title="Remove deadline"
                      >
                        {deletingId === d.id ? "…" : "✕"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ADD DEADLINE */}
        {view === "add" && (
          <div style={styles.addContainer}>
            <h2 style={styles.sectionTitle}>Add a Deadline</h2>

            {addSuccess && (
              <div style={styles.successBanner}>
                ✅ Deadline added! Redirecting to dashboard…
              </div>
            )}

            <form onSubmit={handleAddDeadline} style={styles.addForm}>
              {/* College selection */}
              <div style={styles.formGroup}>
                <label style={styles.label}>College</label>
                <div style={styles.toggleRow}>
                  <button
                    type="button"
                    style={{
                      ...styles.toggleBtn,
                      ...(useManual ? {} : styles.toggleBtnActive),
                    }}
                    onClick={() => {
                      setUseManual(false);
                      setManualCollege("");
                    }}
                  >
                    Search list
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.toggleBtn,
                      ...(useManual ? styles.toggleBtnActive : {}),
                    }}
                    onClick={() => {
                      setUseManual(true);
                      setSelectedCollege("");
                      setSearchQuery("");
                    }}
                  >
                    Enter manually
                  </button>
                </div>

                {!useManual && (
                  <div style={styles.searchContainer}>
                    <input
                      type="text"
                      placeholder="Search colleges…"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedCollege("");
                      }}
                      style={styles.input}
                    />
                    {searchQuery && !selectedCollege && (
                      <div style={styles.dropdown}>
                        {filteredColleges.length === 0 && (
                          <div style={styles.dropdownItem}>
                            No results. Try entering manually.
                          </div>
                        )}
                        {filteredColleges.map((c) => (
                          <div
                            key={c}
                            style={styles.dropdownItem}
                            onClick={() => {
                              setSelectedCollege(c);
                              setSearchQuery(c);
                            }}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedCollege && (
                      <div style={styles.selectedTag}>
                        ✓ {selectedCollege}
                        <button
                          type="button"
                          style={styles.clearBtn}
                          onClick={() => {
                            setSelectedCollege("");
                            setSearchQuery("");
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {useManual && (
                  <input
                    type="text"
                    placeholder="e.g. Stanford University"
                    value={manualCollege}
                    onChange={(e) => setManualCollege(e.target.value)}
                    style={styles.input}
                  />
                )}
              </div>

              {/* Deadline type */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline Type</label>
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
                      <span style={styles.typeBtnShort}>
                        {typeShort[t]}
                      </span>
                      <span style={styles.typeBtnFull}>{t}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Deadline Date</label>
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>

              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need SAT scores by this date"
                  style={styles.input}
                  maxLength={200}
                />
              </div>

              {addError && <p style={styles.errorText}>{addError}</p>}

              <div style={styles.formActions}>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => setView("dashboard")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.primaryBtn}
                  disabled={addLoading}
                >
                  {addLoading ? "Adding…" : "Add Deadline"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // AUTH
  authPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    padding: "16px",
  },
  authCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  logo: {
    fontSize: "48px",
    textAlign: "center",
    marginBottom: "8px",
  },
  authTitle: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "0 0 4px",
  },
  authSubtitle: {
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 28px",
  },
  tabRow: {
    display: "flex",
    gap: "0",
    marginBottom: "24px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
  },
  tabBtn: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#f9fafb",
    color: "#6b7280",
    fontWeight: 500,
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "#2563eb",
    color: "#fff",
  },
  authForm: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
    marginTop: "8px",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    color: "#111827",
    background: "#fff",
  },
  primaryBtn: {
    marginTop: "16px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
    width: "100%",
  },
  secondaryBtn: {
    padding: "12px 20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "15px",
    cursor: "pointer",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "13px",
    marginTop: "8px",
  },
  switchText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "13px",
    color: "#6b7280",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
    padding: 0,
  },

  // APP
  appPage: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    background: "#1e3a5f",
    color: "#fff",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerLogo: {
    fontSize: "24px",
  },
  headerTitle: {
    fontSize: "20px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  headerEmail: {
    fontSize: "13px",
    opacity: 0.8,
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "6px",
    padding: "5px 12px",
    fontSize: "13px",
    cursor: "pointer",
  },
  nav: {
    display: "flex",
    gap: "4px",
    padding: "12px 24px",
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
  },
  navBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: "none",
    fontSize: "14px",
    fontWeight: 500,
    color: "#6b7280",
    cursor: "pointer",
  },
  navBtnActive: {
    background: "#eff6ff",
    color: "#2563eb",
    fontWeight: 600,
  },
  main: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "28px 20px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  sectionTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1e3a5f",
    margin: 0,
  },
  sectionCount: {
    fontSize: "13px",
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: "99px",
  },
  legend: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  legendItem: {
    fontSize: "13px",
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#1e3a5f",
    margin: "0 0 8px",
  },
  emptyDesc: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 20px",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    padding: "40px",
  },
  deadlineList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  deadlineCard: {
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  deadlineLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: 0,
  },
  urgencyBar: {
    width: "4px",
    height: "48px",
    borderRadius: "4px",
    flexShrink: 0,
  },
  deadlineInfo: {
    flex: 1,
    minWidth: 0,
  },
  deadlineCollege: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "4px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deadlineMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  typeTag: {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: "4px",
    letterSpacing: "0.4px",
  },
  deadlineDate: {
    fontSize: "13px",
    color: "#374151",
  },
  deadlineNotes: {
    fontSize: "12px",
    color: "#6b7280",
    fontStyle: "italic",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  deadlineRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
    flexShrink: 0,
  },
  daysChip: {
    fontSize: "18px",
    fontWeight: 700,
    border: "1.5px solid",
    borderRadius: "8px",
    padding: "2px 10px",
    background: "#fff",
  },
  urgencyLabel: {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.3px",
  },
  deleteBtn: {
    marginTop: "4px",
    background: "none",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    color: "#9ca3af",
    fontSize: "12px",
    padding: "2px 7px",
    cursor: "pointer",
  },

  // ADD FORM
  addContainer: {
    maxWidth: "560px",
  },
  addForm: {
    marginTop: "20px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  formGroup: {
    marginBottom: "12px",
  },
  toggleRow: {
    display: "flex",
    gap: "0",
    marginBottom: "10px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    width: "fit-content",
  },
  toggleBtn: {
    padding: "7px 16px",
    border: "none",
    background: "#f9fafb",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  },
  toggleBtnActive: {
    background: "#2563eb",
    color: "#fff",
  },
  searchContainer: {
    position: "relative",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    zIndex: 10,
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    maxHeight: "240px",
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "10px 14px",
    fontSize: "14px",
    cursor: "pointer",
    color: "#111827",
    borderBottom: "1px solid #f3f4f6",
  },
  selectedTag: {
    marginTop: "8px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#eff6ff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "13px",
    fontWeight: 500,
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "12px",
    padding: "0 2px",
  },
  typeRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "6px",
  },
  typeBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#f9fafb",
    color: "#374151",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
  },
  typeBtnActive: {
    background: "#eff6ff",
    color: "#2563eb",
    borderColor: "#2563eb",
  },
  typeBtnShort: {
    fontWeight: 700,
    fontSize: "15px",
  },
  typeBtnFull: {
    fontSize: "10px",
    fontWeight: 400,
    opacity: 0.7,
  },
  formActions: {
    display: "flex",
    gap: "12px",
    marginTop: "8px",
  },
  successBanner: {
    background: "#f0fdf4",
    color: "#16a34a",
    border: "1px solid #bbf7d0",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: 500,
    marginTop: "12px",
  },
};