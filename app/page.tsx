"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College, Deadline } from "@/lib/colleges";

type Screen = "auth" | "onboarding" | "dashboard";

interface DeadlineRow {
  college: College;
  deadline: Deadline;
  daysLeft: number;
  completed: boolean;
}

interface DeadlineStatus {
  college_id: string;
  deadline_type: string;
  deadline_date: string;
  completed: boolean;
}

function getDaysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number, completed: boolean): string {
  if (completed) return "#4caf50";
  if (days < 0) return "#9e9e9e";
  if (days < 7) return "#f44336";
  if (days < 30) return "#ff9800";
  return "#4caf50";
}

function urgencyBg(days: number, completed: boolean): string {
  if (completed) return "#e8f5e9";
  if (days < 0) return "#f5f5f5";
  if (days < 7) return "#ffebee";
  if (days < 30) return "#fff3e0";
  return "#e8f5e9";
}

function urgencyLabel(days: number, completed: boolean): string {
  if (completed) return "Done";
  if (days < 0) return "Passed";
  if (days === 0) return "TODAY!";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${days} days`;
  return `${days} days`;
}

function deadlineTypeColor(type: string): string {
  switch (type) {
    case "ED": return "#7b1fa2";
    case "ED2": return "#ad1457";
    case "EA": return "#1565c0";
    case "RD": return "#2e7d32";
    case "Scholarship": return "#e65100";
    default: return "#555";
  }
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Onboarding
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Dashboard
  const [deadlineRows, setDeadlineRows] = useState<DeadlineRow[]>([]);
  const [statuses, setStatuses] = useState<Map<string, boolean>>(new Map());
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [now, setNow] = useState(new Date());
  const [editingSchools, setEditingSchools] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Tick every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Analytics
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Load saved session
  useEffect(() => {
    const saved = localStorage.getItem("edutracker_email");
    if (saved) {
      setUserEmail(saved);
      loadUserData(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusKey = (collegeId: string, type: string, date: string) =>
    `${collegeId}__${type}__${date}`;

  const loadUserData = useCallback(async (em: string) => {
    setDashboardLoading(true);
    try {
      const [schoolsRes, statusesRes] = await Promise.all([
        fetch(`/api/schools?email=${encodeURIComponent(em)}`),
        fetch(`/api/deadline-status?email=${encodeURIComponent(em)}`),
      ]);
      const schoolsData = await schoolsRes.json();
      const statusesData = await statusesRes.json();

      const collegeIds: string[] = schoolsData.colleges ?? [];
      const statusList: DeadlineStatus[] = statusesData.statuses ?? [];

      const statusMap = new Map<string, boolean>();
      for (const s of statusList) {
        statusMap.set(statusKey(s.college_id, s.deadline_type, s.deadline_date), s.completed);
      }
      setStatuses(statusMap);

      if (collegeIds.length === 0) {
        setScreen("onboarding");
        setDashboardLoading(false);
        return;
      }

      setSelectedIds(new Set(collegeIds));
      buildDashboard(collegeIds, statusMap);
      setScreen("dashboard");
    } catch {
      setScreen("onboarding");
    }
    setDashboardLoading(false);
  }, []);

  const buildDashboard = (collegeIds: string[], statusMap: Map<string, boolean>) => {
    const rows: DeadlineRow[] = [];
    for (const id of collegeIds) {
      const college = COLLEGES.find((c) => c.id === id);
      if (!college) continue;
      for (const dl of college.deadlines) {
        const days = getDaysLeft(dl.date);
        const completed = statusMap.get(statusKey(id, dl.type, dl.date)) ?? false;
        rows.push({ college, deadline: dl, daysLeft: days, completed });
      }
    }
    rows.sort((a, b) => {
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      return a.daysLeft - b.daysLeft;
    });
    setDeadlineRows(rows);
  };

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
      if (data.ok) {
        setUserEmail(data.email);
        localStorage.setItem("edutracker_email", data.email);
        await loadUserData(data.email);
      } else {
        setAuthError(data.error ?? "Something went wrong");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("edutracker_email");
    setUserEmail(null);
    setSelectedIds(new Set());
    setDeadlineRows([]);
    setStatuses(new Map());
    setScreen("auth");
    setEmail("");
    setPassword("");
  };

  const toggleSchool = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOnboardingSave = async () => {
    if (!userEmail || selectedIds.size === 0) return;
    setOnboardingLoading(true);
    try {
      await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, collegeIds: Array.from(selectedIds) }),
      });
      buildDashboard(Array.from(selectedIds), statuses);
      setScreen("dashboard");
    } catch {
      alert("Failed to save schools. Please try again.");
    }
    setOnboardingLoading(false);
    setEditingSchools(false);
  };

  const handleToggleComplete = async (row: DeadlineRow) => {
    if (!userEmail) return;
    const key = statusKey(row.college.id, row.deadline.type, row.deadline.date);
    const newVal = !row.completed;
    const newStatuses = new Map(statuses);
    newStatuses.set(key, newVal);
    setStatuses(newStatuses);

    // Optimistically update rows
    buildDashboard(Array.from(selectedIds), newStatuses);

    try {
      await fetch("/api/deadline-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          collegeId: row.college.id,
          deadlineType: row.deadline.type,
          deadlineDate: row.deadline.date,
          completed: newVal,
        }),
      });
    } catch {
      // Revert on failure
      newStatuses.set(key, !newVal);
      setStatuses(new Map(newStatuses));
      buildDashboard(Array.from(selectedIds), newStatuses);
    }
  };

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRows = deadlineRows.filter((row) => {
    if (filterType !== "All" && row.deadline.type !== filterType) return false;
    if (filterStatus === "Pending" && row.completed) return false;
    if (filterStatus === "Completed" && !row.completed) return false;
    if (filterStatus === "Upcoming" && (row.daysLeft < 0 || row.completed)) return false;
    if (filterStatus === "Passed" && row.daysLeft >= 0) return false;
    return true;
  });

  const pendingCount = deadlineRows.filter((r) => !r.completed && r.daysLeft >= 0).length;
  const urgentCount = deadlineRows.filter((r) => !r.completed && r.daysLeft >= 0 && r.daysLeft < 7).length;
  const completedCount = deadlineRows.filter((r) => r.completed).length;

  // Countdown for a specific date
  const getCountdown = (dateStr: string) => {
    const deadline = new Date(dateStr + "T23:59:59");
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  // ─── AUTH SCREEN ───────────────────────────────────────────────────
  if (screen === "auth") {
    return (
      <div style={styles.page}>
        <div style={styles.authCard}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <h1 style={styles.logoText}>EduTracker</h1>
          </div>
          <p style={styles.tagline}>Never miss a college application deadline</p>

          <div style={styles.authTabs}>
            <button
              style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Sign In
            </button>
            <button
              style={{ ...styles.authTab, ...(authMode === "signup" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@email.com"
              required
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
              minLength={6}
            />
            {authError && <div style={styles.errorBox}>{authError}</div>}
            <button type="submit" style={styles.btnPrimary} disabled={authLoading}>
              {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={styles.demoNote}>
            <strong>Demo:</strong> use any email + a 6+ character password
          </div>
        </div>
      </div>
    );
  }

  // ─── ONBOARDING SCREEN ────────────────────────────────────────────
  if (screen === "onboarding" || editingSchools) {
    return (
      <div style={styles.page}>
        <div style={styles.onboardingCard}>
          <div style={styles.onboardingHeader}>
            <div style={styles.logo}>
              <span style={styles.logoIcon}>🎓</span>
              <span style={styles.logoText}>EduTracker</span>
            </div>
            {editingSchools && (
              <button style={styles.btnOutline} onClick={() => { setEditingSchools(false); setScreen("dashboard"); }}>
                ← Back
              </button>
            )}
          </div>

          <h2 style={styles.onboardingTitle}>
            {editingSchools ? "Edit Your Schools" : "Select Your Target Schools"}
          </h2>
          <p style={styles.onboardingSubtitle}>
            Choose the colleges you're applying to. We'll track all their deadlines for you.
          </p>

          <div style={styles.searchRow}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search colleges..."
              style={styles.searchInput}
            />
            <span style={styles.selectedCount}>{selectedIds.size} selected</span>
          </div>

          <div style={styles.collegeGrid}>
            {filteredColleges.map((college) => {
              const selected = selectedIds.has(college.id);
              return (
                <div
                  key={college.id}
                  style={{
                    ...styles.collegeCard,
                    ...(selected ? styles.collegeCardSelected : {}),
                  }}
                  onClick={() => toggleSchool(college.id)}
                >
                  <div style={styles.collegeCardCheck}>
                    {selected ? "✓" : ""}
                  </div>
                  <div style={styles.collegeName}>{college.name}</div>
                  <div style={styles.collegeLocation}>📍 {college.location}</div>
                  <div style={styles.collegeDeadlines}>
                    {college.deadlines.map((d) => (
                      <span
                        key={d.type + d.date}
                        style={{ ...styles.deadlineBadge, backgroundColor: deadlineTypeColor(d.type) }}
                      >
                        {d.type}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.onboardingFooter}>
            <button
              style={{
                ...styles.btnPrimary,
                opacity: selectedIds.size === 0 || onboardingLoading ? 0.6 : 1,
              }}
              disabled={selectedIds.size === 0 || onboardingLoading}
              onClick={handleOnboardingSave}
            >
              {onboardingLoading
                ? "Saving..."
                : `Track ${selectedIds.size} School${selectedIds.size !== 1 ? "s" : ""} →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────
  return (
    <div style={styles.dashPage}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.logoIcon}>🎓</span>
          <span style={styles.dashLogoText}>EduTracker</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{userEmail}</span>
          <button style={styles.btnOutline} onClick={() => { setEditingSchools(true); setScreen("onboarding"); }}>
            Edit Schools
          </button>
          <button style={styles.btnLogout} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={styles.dashMain}>
        {dashboardLoading ? (
          <div style={styles.loadingBox}>Loading your deadlines...</div>
        ) : (
          <>
            {/* Stats */}
            <div style={styles.statsRow}>
              <div style={{ ...styles.statCard, borderLeftColor: "#f44336" }}>
                <div style={styles.statNumber}>{urgentCount}</div>
                <div style={styles.statLabel}>Urgent (&lt;7 days)</div>
              </div>
              <div style={{ ...styles.statCard, borderLeftColor: "#ff9800" }}>
                <div style={styles.statNumber}>{pendingCount}</div>
                <div style={styles.statLabel}>Pending Deadlines</div>
              </div>
              <div style={{ ...styles.statCard, borderLeftColor: "#4caf50" }}>
                <div style={styles.statNumber}>{completedCount}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
              <div style={{ ...styles.statCard, borderLeftColor: "#1565c0" }}>
                <div style={styles.statNumber}>{selectedIds.size}</div>
                <div style={styles.statLabel}>Schools Tracked</div>
              </div>
            </div>

            {/* Filters */}
            <div style={styles.filtersRow}>
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Type:</span>
                {["All", "ED", "ED2", "EA", "RD", "Scholarship"].map((t) => (
                  <button
                    key={t}
                    style={{
                      ...styles.filterBtn,
                      ...(filterType === t ? styles.filterBtnActive : {}),
                    }}
                    onClick={() => setFilterType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div style={styles.filterGroup}>
                <span style={styles.filterLabel}>Status:</span>
                {["All", "Upcoming", "Pending", "Completed", "Passed"].map((s) => (
                  <button
                    key={s}
                    style={{
                      ...styles.filterBtn,
                      ...(filterStatus === s ? styles.filterBtnActive : {}),
                    }}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline list */}
            {filteredRows.length === 0 ? (
              <div style={styles.emptyBox}>
                No deadlines match your filters.
              </div>
            ) : (
              <div style={styles.deadlineList}>
                {filteredRows.map((row, idx) => {
                  const color = urgencyColor(row.daysLeft, row.completed);
                  const bg = urgencyBg(row.daysLeft, row.completed);
                  const countdown = getCountdown(row.deadline.date);
                  const isPassed = row.daysLeft < 0 && !row.completed;

                  return (
                    <div
                      key={`${row.college.id}-${row.deadline.type}-${row.deadline.date}-${idx}`}
                      style={{
                        ...styles.deadlineCard,
                        backgroundColor: bg,
                        borderLeftColor: color,
                        opacity: isPassed ? 0.65 : 1,
                      }}
                    >
                      <div style={styles.deadlineCardLeft}>
                        <div style={styles.deadlineCardTop}>
                          <span
                            style={{
                              ...styles.typeBadge,
                              backgroundColor: deadlineTypeColor(row.deadline.type),
                            }}
                          >
                            {row.deadline.type}
                          </span>
                          <span style={styles.schoolName}>{row.college.name}</span>
                          <span style={styles.schoolLocation}>— {row.college.location}</span>
                        </div>
                        <div style={styles.deadlineLabel}>{row.deadline.label}</div>
                        <div style={styles.deadlineDate}>
                          📅 {new Date(row.deadline.date + "T00:00:00").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <div style={styles.deadlineCardRight}>
                        <div style={{ ...styles.countdownBadge, backgroundColor: color }}>
                          {row.completed ? (
                            <span>✓ Done</span>
                          ) : isPassed ? (
                            <span>Passed</span>
                          ) : (
                            <>
                              <div style={styles.countdownNum}>{urgencyLabel(row.daysLeft, row.completed)}</div>
                              {countdown && (
                                <div style={styles.countdownSub}>{countdown}</div>
                              )}
                            </>
                          )}
                        </div>
                        <button
                          style={{
                            ...styles.completeBtn,
                            backgroundColor: row.completed ? "#e0e0e0" : "#fff",
                            color: row.completed ? "#555" : "#1565c0",
                            borderColor: row.completed ? "#bbb" : "#1565c0",
                          }}
                          onClick={() => handleToggleComplete(row)}
                        >
                          {row.completed ? "↩ Undo" : "✓ Mark Done"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a237e 0%, #283593 40%, #3949ab 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  authCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  logoIcon: {
    fontSize: "32px",
  },
  logoText: {
    fontSize: "26px",
    fontWeight: 700,
    color: "#1a237e",
    margin: 0,
  },
  tagline: {
    color: "#555",
    fontSize: "14px",
    marginBottom: "28px",
    marginTop: "4px",
  },
  authTabs: {
    display: "flex",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #e0e0e0",
    marginBottom: "24px",
  },
  authTab: {
    flex: 1,
    padding: "10px",
    border: "none",
    background: "#f5f5f5",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    color: "#555",
    transition: "all 0.2s",
  },
  authTabActive: {
    background: "#1a237e",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#333",
    marginBottom: "-6px",
  },
  input: {
    padding: "11px 14px",
    borderRadius: "8px",
    border: "1.5px solid #e0e0e0",
    fontSize: "15px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  errorBox: {
    background: "#ffebee",
    color: "#c62828",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    border: "1px solid #ef9a9a",
  },
  btnPrimary: {
    padding: "13px",
    background: "linear-gradient(135deg, #1a237e, #3949ab)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "4px",
    transition: "opacity 0.2s",
  },
  btnOutline: {
    padding: "8px 16px",
    background: "transparent",
    color: "#1a237e",
    border: "1.5px solid #1a237e",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  btnLogout: {
    padding: "8px 16px",
    background: "transparent",
    color: "#c62828",
    border: "1.5px solid #c62828",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },
  demoNote: {
    marginTop: "20px",
    fontSize: "12px",
    color: "#888",
    textAlign: "center",
    background: "#f9f9f9",
    padding: "10px",
    borderRadius: "8px",
  },
  // Onboarding
  onboardingCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "32px",
    width: "100%",
    maxWidth: "960px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
  },
  onboardingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  onboardingTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#1a237e",
    margin: "0 0 6px",
  },
  onboardingSubtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "20px",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "16px",
  },
  searchInput: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1.5px solid #e0e0e0",
    fontSize: "15px",
    outline: "none",
  },
  selectedCount: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#1a237e",
    whiteSpace: "nowrap",
  },
  collegeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "12px",
    overflowY: "auto",
    flex: 1,
    paddingBottom: "8px",
  },
  collegeCard: {
    border: "2px solid #e0e0e0",
    borderRadius: "10px",
    padding: "14px",
    cursor: "pointer",
    transition: "all 0.15s",
    background: "#fafafa",
    position: "relative",
    userSelect: "none",
  },
  collegeCardSelected: {
    border: "2px solid #1a237e",
    background: "#e8eaf6",
  },
  collegeCardCheck: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#1a237e",
    color: "#fff",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  collegeName: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#1a237e",
    marginBottom: "4px",
    paddingRight: "24px",
    lineHeight: 1.3,
  },
  collegeLocation: {
    fontSize: "11px",
    color: "#888",
    marginBottom: "8px",
  },
  collegeDeadlines: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  deadlineBadge: {
    fontSize: "10px",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: 600,
  },
  onboardingFooter: {
    paddingTop: "20px",
    borderTop: "1px solid #eee",
    display: "flex",
    justifyContent: "center",
  },
  // Dashboard
  dashPage: {
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "linear-gradient(135deg, #1a237e, #3949ab)",
    color: "#fff",
    padding: "14px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    flexWrap: "wrap",
    gap: "12px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dashLogoText: {
    fontSize: "20px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  userEmail: {
    fontSize: "13px",
    opacity: 0.85,
  },
  dashMain: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "28px 20px",
  },
  loadingBox: {
    textAlign: "center",
    padding: "60px",
    color: "#888",
    fontSize: "16px",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px 24px",
    borderLeft: "4px solid #ccc",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  },
  statNumber: {
    fontSize: "36px",
    fontWeight: 700,
    color: "#222",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "13px",
    color: "#666",
    marginTop: "4px",
  },
  filtersRow: {
    background: "#fff",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#555",
  },
  filterBtn: {
    padding: "5px 12px",
    borderRadius: "20px",
    border: "1.5px solid #ddd",
    background: "#f5f5f5",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    color: "#555",
    transition: "all 0.15s",
  },
  filterBtnActive: {
    background: "#1a237e",
    color: "#fff",
    borderColor: "#1a237e",
  },
  deadlineList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  deadlineCard: {
    borderRadius: "12px",
    borderLeft: "5px solid #ccc",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    gap: "16px",
    flexWrap: "wrap",
    transition: "opacity 0.2s",
  },
  deadlineCardLeft: {
    flex: 1,
    minWidth: "200px",
  },
  deadlineCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "6px",
  },
  typeBadge: {
    fontSize: "11px",
    color: "#fff",
    padding: "3px 8px",
    borderRadius: "5px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  schoolName: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1a237e",
  },
  schoolLocation: {
    fontSize: "12px",
    color: "#888",
  },
  deadlineLabel: {
    fontSize: "13px",
    color: "#555",
    marginBottom: "4px",
  },
  deadlineDate: {
    fontSize: "13px",
    color: "#444",
    fontWeight: 500,
  },
  deadlineCardRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    minWidth: "110px",
  },
  countdownBadge: {
    borderRadius: "10px",
    padding: "8px 14px",
    color: "#fff",
    textAlign: "center",
    minWidth: "90px",
  },
  countdownNum: {
    fontSize: "18px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  countdownSub: {
    fontSize: "11px",
    opacity: 0.85,
    marginTop: "2px",
  },
  completeBtn: {
    padding: "7px 14px",
    borderRadius: "8px",
    border: "1.5px solid",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  emptyBox: {
    textAlign: "center",
    padding: "60px",
    color: "#aaa",
    fontSize: "16px",
    background: "#fff",
    borderRadius: "12px",
  },
};