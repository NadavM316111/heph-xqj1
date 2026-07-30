"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College } from "@/lib/colleges";

type ReminderInterval = 30 | 14 | 7 | 1;
type DeadlineType = "ED1" | "ED2" | "EA" | "RD";

interface SelectedSchool {
  collegeId: string;
  deadlineTypes: DeadlineType[];
}

interface UserPrefs {
  email: string;
  phone: string;
  reminders: ReminderInterval[];
  schools: SelectedSchool[];
}

interface FlatDeadline {
  collegeId: string;
  collegeName: string;
  type: DeadlineType;
  date: string;
  daysUntil: number;
}

type Step = "auth" | "schools" | "reminders" | "dashboard";

const REMINDER_OPTIONS: { value: ReminderInterval; label: string }[] = [
  { value: 30, label: "30 days before" },
  { value: 14, label: "14 days before" },
  { value: 7, label: "7 days before" },
  { value: 1, label: "1 day before" },
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 14) return "#fff7ed";
  if (days <= 30) return "#fefce8";
  return "#f0fdf4";
}

export default function Home() {
  const [step, setStep] = useState<Step>("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<SelectedSchool[]>([]);
  const [filterState, setFilterState] = useState("All");
  const [filterType, setFilterType] = useState<"All" | "Public" | "Private">("All");

  const [reminders, setReminders] = useState<ReminderInterval[]>([30, 14, 7, 1]);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderPhone, setReminderPhone] = useState("");

  const [deadlines, setDeadlines] = useState<FlatDeadline[]>([]);
  const [filterDeadlineType, setFilterDeadlineType] = useState<"All" | DeadlineType>("All");
  const [filterUrgency, setFilterUrgency] = useState<"All" | "urgent" | "soon" | "upcoming">("All");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("edutracker_prefs");
    if (saved) {
      try {
        const prefs: UserPrefs = JSON.parse(saved);
        setUserEmail(prefs.email || "");
        setReminderEmail(prefs.email || "");
        setReminderPhone(prefs.phone || "");
        setReminders(prefs.reminders || [30, 14, 7, 1]);
        setSelectedSchools(prefs.schools || []);
        setStep("dashboard");
      } catch {}
    }
  }, []);

  const buildDeadlines = useCallback((schools: SelectedSchool[]): FlatDeadline[] => {
    const result: FlatDeadline[] = [];
    for (const sel of schools) {
      const college = COLLEGES.find((c) => c.id === sel.collegeId);
      if (!college) continue;
      for (const dt of sel.deadlineTypes) {
        const dateStr = college.deadlines[dt];
        if (!dateStr) continue;
        result.push({
          collegeId: college.id,
          collegeName: college.name,
          type: dt,
          date: dateStr,
          daysUntil: daysUntil(dateStr),
        });
      }
    }
    result.sort((a, b) => a.daysUntil - b.daysUntil);
    return result;
  }, []);

  useEffect(() => {
    if (step === "dashboard") {
      setDeadlines(buildDeadlines(selectedSchools));
    }
  }, [step, selectedSchools, buildDeadlines]);

  async function handleAuth() {
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
        setUserEmail(data.email);
        setReminderEmail(data.email);
        const saved = localStorage.getItem("edutracker_prefs");
        if (saved) {
          try {
            const prefs: UserPrefs = JSON.parse(saved);
            if (prefs.email === data.email) {
              setSelectedSchools(prefs.schools || []);
              setReminders(prefs.reminders || [30, 14, 7, 1]);
              setReminderPhone(prefs.phone || "");
              setStep("dashboard");
              return;
            }
          } catch {}
        }
        setStep("schools");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function toggleSchool(college: College, dt: DeadlineType) {
    setSelectedSchools((prev) => {
      const existing = prev.find((s) => s.collegeId === college.id);
      if (existing) {
        if (existing.deadlineTypes.includes(dt)) {
          const newTypes = existing.deadlineTypes.filter((t) => t !== dt);
          if (newTypes.length === 0) return prev.filter((s) => s.collegeId !== college.id);
          return prev.map((s) => s.collegeId === college.id ? { ...s, deadlineTypes: newTypes } : s);
        } else {
          return prev.map((s) => s.collegeId === college.id ? { ...s, deadlineTypes: [...s.deadlineTypes, dt] } : s);
        }
      } else {
        return [...prev, { collegeId: college.id, deadlineTypes: [dt] }];
      }
    });
  }

  function isSelected(collegeId: string, dt: DeadlineType): boolean {
    const s = selectedSchools.find((x) => x.collegeId === collegeId);
    return !!s && s.deadlineTypes.includes(dt);
  }

  function toggleReminder(val: ReminderInterval) {
    setReminders((prev) =>
      prev.includes(val) ? prev.filter((r) => r !== val) : [...prev, val]
    );
  }

  async function saveAndFinish() {
    setSaveStatus("Saving...");
    const prefs: UserPrefs = {
      email: reminderEmail,
      phone: reminderPhone,
      reminders,
      schools: selectedSchools,
    };
    localStorage.setItem("edutracker_prefs", JSON.stringify(prefs));

    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
    } catch {}

    setSaveStatus("Saved!");
    setTimeout(() => setSaveStatus(""), 2000);
    setStep("dashboard");
  }

  const allStates = ["All", ...Array.from(new Set(COLLEGES.map((c) => c.state))).sort()];

  const filteredColleges = COLLEGES.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q);
    const matchState = filterState === "All" || c.state === filterState;
    const matchType = filterType === "All" || c.type === filterType;
    return matchSearch && matchState && matchType;
  });

  const filteredDeadlines = deadlines.filter((d) => {
    const matchType = filterDeadlineType === "All" || d.type === filterDeadlineType;
    const matchUrgency =
      filterUrgency === "All" ||
      (filterUrgency === "urgent" && d.daysUntil >= 0 && d.daysUntil <= 7) ||
      (filterUrgency === "soon" && d.daysUntil > 7 && d.daysUntil <= 30) ||
      (filterUrgency === "upcoming" && d.daysUntil > 30);
    return matchType && matchUrgency;
  });

  // AUTH STEP
  if (step === "auth") {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.appTitle}>EduTracker</h1>
          <p style={styles.appSubtitle}>Never miss a college application deadline</p>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(authMode === "signup" ? styles.tabActive : {}) }}
              onClick={() => setAuthMode("signup")}
            >
              Sign Up
            </button>
            <button
              style={{ ...styles.tab, ...(authMode === "login" ? styles.tabActive : {}) }}
              onClick={() => setAuthMode("login")}
            >
              Log In
            </button>
          </div>

          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />

          {authError && <p style={styles.errorMsg}>{authError}</p>}

          <button style={styles.primaryBtn} onClick={handleAuth} disabled={authLoading}>
            {authLoading ? "..." : authMode === "signup" ? "Create Account" : "Log In"}
          </button>
        </div>
      </div>
    );
  }

  // SCHOOL SELECTION STEP
  if (step === "schools") {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.onboardingHeader}>
          <div style={styles.stepIndicator}>
            <span style={styles.stepDot}>1</span>
            <span style={styles.stepLine} />
            <span style={styles.stepDotInactive}>2</span>
          </div>
          <h2 style={styles.stepTitle}>Select Your Target Schools</h2>
          <p style={styles.stepSubtitle}>
            Choose each school and click the deadline types you&apos;re applying to.
            {selectedSchools.length > 0 && (
              <strong> {selectedSchools.reduce((a, s) => a + s.deadlineTypes.length, 0)} deadlines selected</strong>
            )}
          </p>
        </div>

        <div style={styles.filterBar}>
          <input
            style={{ ...styles.input, ...styles.searchInput }}
            placeholder="Search colleges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select style={styles.select} value={filterState} onChange={(e) => setFilterState(e.target.value)}>
            {allStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={styles.select} value={filterType} onChange={(e) => setFilterType(e.target.value as "All" | "Public" | "Private")}>
            <option value="All">All Types</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
        </div>

        <div style={styles.collegeGrid}>
          {filteredColleges.map((college) => {
            const hasAny = selectedSchools.some((s) => s.collegeId === college.id);
            return (
              <div key={college.id} style={{ ...styles.collegeCard, ...(hasAny ? styles.collegeCardSelected : {}) }}>
                <div style={styles.collegeCardHeader}>
                  <div>
                    <p style={styles.collegeName}>{college.name}</p>
                    <p style={styles.collegeMeta}>{college.state} · {college.type} · #{college.ranking}</p>
                  </div>
                  <span style={styles.acceptRate}>{college.acceptanceRate}%</span>
                </div>
                <div style={styles.deadlineRow}>
                  {(["ED1", "ED2", "EA", "RD"] as DeadlineType[]).map((dt) => {
                    const date = college.deadlines[dt];
                    if (!date) return null;
                    const selected = isSelected(college.id, dt);
                    return (
                      <button
                        key={dt}
                        style={{ ...styles.deadlineChip, ...(selected ? styles.deadlineChipSelected : {}) }}
                        onClick={() => toggleSchool(college, dt)}
                        title={formatDate(date)}
                      >
                        <span>{dt}</span>
                        <span style={styles.chipDate}>{formatDate(date)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.stickyBottom}>
          <p style={styles.selectionCount}>
            {selectedSchools.length} schools · {selectedSchools.reduce((a, s) => a + s.deadlineTypes.length, 0)} deadlines
          </p>
          <button
            style={{ ...styles.primaryBtn, ...styles.btnInline }}
            onClick={() => setStep("reminders")}
            disabled={selectedSchools.length === 0}
          >
            Next: Set Up Reminders →
          </button>
        </div>
      </div>
    );
  }

  // REMINDERS STEP
  if (step === "reminders") {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.onboardingHeader}>
          <div style={styles.stepIndicator}>
            <span style={styles.stepDotDone}>✓</span>
            <span style={styles.stepLine} />
            <span style={styles.stepDot}>2</span>
          </div>
          <h2 style={styles.stepTitle}>Set Up Reminders</h2>
          <p style={styles.stepSubtitle}>We&apos;ll remind you before each deadline.</p>
        </div>

        <div style={styles.reminderCard}>
          <h3 style={styles.sectionLabel}>📧 Email Reminders</h3>
          <input
            style={styles.input}
            type="email"
            placeholder="Your email address"
            value={reminderEmail}
            onChange={(e) => setReminderEmail(e.target.value)}
          />

          <h3 style={{ ...styles.sectionLabel, marginTop: 24 }}>⏰ Reminder Schedule</h3>
          <p style={styles.hintText}>Select when to receive reminders before each deadline:</p>
          <div style={styles.reminderOptions}>
            {REMINDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                style={{ ...styles.reminderChip, ...(reminders.includes(opt.value) ? styles.reminderChipSelected : {}) }}
                onClick={() => toggleReminder(opt.value)}
              >
                {reminders.includes(opt.value) ? "✓ " : ""}{opt.label}
              </button>
            ))}
          </div>

          <div style={styles.smsSection}>
            <h3 style={styles.sectionLabel}>📱 SMS Reminders <span style={styles.optionalTag}>(Optional)</span></h3>
            <p style={styles.hintText}>Enter your phone number for SMS reminders.</p>
            <input
              style={styles.input}
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={reminderPhone}
              onChange={(e) => setReminderPhone(e.target.value)}
            />
            <p style={styles.smsNote}>
              ℹ️ SMS delivery requires Twilio credentials configured on the server. Email reminders always work.
            </p>
          </div>
        </div>

        <div style={styles.btnRow}>
          <button style={styles.secondaryBtn} onClick={() => setStep("schools")}>← Back</button>
          <button style={styles.primaryBtn} onClick={saveAndFinish}>
            {saveStatus || "Save & View Dashboard →"}
          </button>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={styles.pageContainer}>
      <div style={styles.dashHeader}>
        <div>
          <h1 style={styles.dashTitle}>🎓 EduTracker</h1>
          {userEmail && <p style={styles.dashUser}>{userEmail}</p>}
        </div>
        <div style={styles.dashActions}>
          <button style={styles.secondaryBtn} onClick={() => setStep("schools")}>
            ✏️ Edit Schools
          </button>
          <button style={styles.secondaryBtn} onClick={() => setStep("reminders")}>
            🔔 Reminders
          </button>
          <button
            style={styles.ghostBtn}
            onClick={() => {
              localStorage.removeItem("edutracker_prefs");
              setSelectedSchools([]);
              setUserEmail("");
              setEmail("");
              setPassword("");
              setStep("auth");
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{selectedSchools.length}</p>
          <p style={styles.statLabel}>Schools</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statNum}>{deadlines.length}</p>
          <p style={styles.statLabel}>Deadlines</p>
        </div>
        <div style={styles.statCard}>
          <p style={{ ...styles.statNum, color: "#ef4444" }}>
            {deadlines.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 7).length}
          </p>
          <p style={styles.statLabel}>Due This Week</p>
        </div>
        <div style={styles.statCard}>
          <p style={{ ...styles.statNum, color: "#f97316" }}>
            {deadlines.filter((d) => d.daysUntil > 7 && d.daysUntil <= 30).length}
          </p>
          <p style={styles.statLabel}>Due This Month</p>
        </div>
      </div>

      {/* Reminder info banner */}
      {reminders.length > 0 && reminderEmail && (
        <div style={styles.reminderBanner}>
          🔔 Email reminders set for <strong>{reminders.sort((a, b) => b - a).join(", ")} days before</strong> each deadline → <strong>{reminderEmail}</strong>
          {reminderPhone && <> · SMS → <strong>{reminderPhone}</strong></>}
        </div>
      )}

      {/* Filters */}
      <div style={styles.filterBar}>
        <select
          style={styles.select}
          value={filterDeadlineType}
          onChange={(e) => setFilterDeadlineType(e.target.value as "All" | DeadlineType)}
        >
          <option value="All">All Types</option>
          <option value="ED1">ED1</option>
          <option value="ED2">ED2</option>
          <option value="EA">EA</option>
          <option value="RD">Regular Decision</option>
        </select>
        <select
          style={styles.select}
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value as "All" | "urgent" | "soon" | "upcoming")}
        >
          <option value="All">All Urgencies</option>
          <option value="urgent">🔴 Urgent (≤7 days)</option>
          <option value="soon">🟡 Soon (8–30 days)</option>
          <option value="upcoming">🟢 Upcoming (30+ days)</option>
        </select>
      </div>

      {filteredDeadlines.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyIcon}>📅</p>
          <p style={styles.emptyTitle}>
            {selectedSchools.length === 0
              ? "No schools selected yet"
              : "No deadlines match your filters"}
          </p>
          {selectedSchools.length === 0 && (
            <button style={styles.primaryBtn} onClick={() => setStep("schools")}>
              Add Schools
            </button>
          )}
        </div>
      ) : (
        <div style={styles.deadlineList}>
          {filteredDeadlines.map((d, i) => {
            const isPast = d.daysUntil < 0;
            return (
              <div
                key={`${d.collegeId}-${d.type}-${i}`}
                style={{
                  ...styles.deadlineItem,
                  backgroundColor: urgencyBg(d.daysUntil),
                  opacity: isPast ? 0.6 : 1,
                }}
              >
                <div style={styles.deadlineLeft}>
                  <div
                    style={{
                      ...styles.deadlineTypeBadge,
                      backgroundColor: urgencyColor(d.daysUntil),
                    }}
                  >
                    {d.type}
                  </div>
                  <div>
                    <p style={styles.deadlineCollegeName}>{d.collegeName}</p>
                    <p style={styles.deadlineDate}>{formatDate(d.date)}</p>
                  </div>
                </div>
                <div style={styles.deadlineRight}>
                  {isPast ? (
                    <span style={styles.pastBadge}>Past</span>
                  ) : d.daysUntil === 0 ? (
                    <span style={{ ...styles.urgencyBadge, backgroundColor: "#ef4444" }}>Today!</span>
                  ) : (
                    <span
                      style={{
                        ...styles.urgencyBadge,
                        backgroundColor: urgencyColor(d.daysUntil),
                      }}
                    >
                      {d.daysUntil}d
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
    padding: "20px",
  },
  authCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  logo: { fontSize: 48 },
  appTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: "#1e3a5f" },
  appSubtitle: { margin: "0 0 8px", color: "#6b7280", fontSize: 14, textAlign: "center" },
  tabRow: { display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb", width: "100%" },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "#f9fafb",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    color: "#6b7280",
  },
  tabActive: { background: "#1e3a5f", color: "#fff" },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  searchInput: { flex: 1, minWidth: 200 },
  errorMsg: { color: "#ef4444", fontSize: 13, margin: "4px 0", textAlign: "center" },
  primaryBtn: {
    background: "#1e3a5f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  },
  btnInline: { width: "auto" },
  secondaryBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostBtn: {
    background: "transparent",
    color: "#6b7280",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 13,
    cursor: "pointer",
  },
  pageContainer: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "24px 16px 80px",
    fontFamily: "system-ui, sans-serif",
  },
  onboardingHeader: { textAlign: "center", marginBottom: 32 },
  stepIndicator: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 },
  stepDot: {
    width: 32, height: 32, borderRadius: "50%", background: "#1e3a5f",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14,
  },
  stepDotDone: {
    width: 32, height: 32, borderRadius: "50%", background: "#22c55e",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14,
  },
  stepDotInactive: {
    width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb",
    color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: 14,
  },
  stepLine: { width: 40, height: 2, background: "#e5e7eb" },
  stepTitle: { fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: "0 0 8px" },
  stepSubtitle: { fontSize: 15, color: "#6b7280", margin: 0 },
  filterBar: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  select: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  collegeGrid: { display: "flex", flexDirection: "column", gap: 10 },
  collegeCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "14px 16px",
    transition: "border-color 0.2s",
  },
  collegeCardSelected: { borderColor: "#1e3a5f", boxShadow: "0 0 0 2px rgba(30,58,95,0.12)" },
  collegeCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  collegeName: { margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" },
  collegeMeta: { margin: "2px 0 0", fontSize: 12, color: "#9ca3af" },
  acceptRate: {
    fontSize: 12, fontWeight: 700, color: "#6b7280",
    background: "#f3f4f6", borderRadius: 6, padding: "4px 8px",
  },
  deadlineRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  deadlineChip: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "6px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
    background: "#f9fafb", cursor: "pointer", fontSize: 12, fontWeight: 700,
    color: "#374151", gap: 2, transition: "all 0.15s",
  },
  deadlineChipSelected: { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" },
  chipDate: { fontSize: 10, fontWeight: 400, opacity: 0.8 },
  stickyBottom: {
    position: "fixed", bottom: 0, left: 0, right: 0,
    background: "#fff", borderTop: "1px solid #e5e7eb",
    padding: "14px 24px", display: "flex", justifyContent: "space-between",
    alignItems: "center", zIndex: 100,
  },
  selectionCount: { fontSize: 14, color: "#374151", fontWeight: 600, margin: 0 },
  reminderCard: {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16,
    padding: "28px 24px", maxWidth: 540, margin: "0 auto 24px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  sectionLabel: { fontSize: 16, fontWeight: 700, color: "#1e3a5f", margin: "0 0 4px" },
  hintText: { fontSize: 13, color: "#6b7280", margin: "0 0 8px" },
  reminderOptions: { display: "flex", gap: 10, flexWrap: "wrap" },
  reminderChip: {
    padding: "10px 16px", borderRadius: 8, border: "1px solid #d1d5db",
    background: "#f9fafb", cursor: "pointer", fontSize: 14, fontWeight: 600,
    color: "#374151", transition: "all 0.15s",
  },
  reminderChipSelected: { background: "#1e3a5f", color: "#fff", borderColor: "#1e3a5f" },
  smsSection: { marginTop: 8, padding: "16px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" },
  optionalTag: { fontSize: 12, color: "#9ca3af", fontWeight: 400 },
  smsNote: { fontSize: 12, color: "#9ca3af", margin: "8px 0 0", lineHeight: 1.5 },
  btnRow: { display: "flex", gap: 12, justifyContent: "center", maxWidth: 540, margin: "0 auto" },
  dashHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24, flexWrap: "wrap", gap: 12,
  },
  dashTitle: { margin: 0, fontSize: 26, fontWeight: 800, color: "#1e3a5f" },
  dashUser: { margin: "4px 0 0", fontSize: 13, color: "#9ca3af" },
  dashActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  statsRow: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: 100, background: "#fff", border: "1px solid #e5e7eb",
    borderRadius: 12, padding: "16px", textAlign: "center",
  },
  statNum: { margin: 0, fontSize: 28, fontWeight: 800, color: "#1e3a5f" },
  statLabel: { margin: "4px 0 0", fontSize: 12, color: "#6b7280", fontWeight: 500 },
  reminderBanner: {
    background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10,
    padding: "12px 16px", fontSize: 13, color: "#1e40af", marginBottom: 20, lineHeight: 1.6,
  },
  deadlineList: { display: "flex", flexDirection: "column", gap: 8 },
  deadlineItem: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(0,0,0,0.06)",
    transition: "opacity 0.2s",
  },
  deadlineLeft: { display: "flex", alignItems: "center", gap: 14 },
  deadlineTypeBadge: {
    color: "#fff", fontWeight: 800, fontSize: 12,
    padding: "6px 10px", borderRadius: 8, minWidth: 44, textAlign: "center",
  },
  deadlineCollegeName: { margin: 0, fontWeight: 700, fontSize: 15, color: "#111827" },
  deadlineDate: { margin: "2px 0 0", fontSize: 12, color: "#6b7280" },
  deadlineRight: { display: "flex", alignItems: "center" },
  urgencyBadge: {
    color: "#fff", fontWeight: 800, fontSize: 13,
    padding: "6px 12px", borderRadius: 20,
  },
  pastBadge: {
    color: "#9ca3af", fontWeight: 600, fontSize: 12,
    padding: "6px 12px", borderRadius: 20,
    background: "#f3f4f6", border: "1px solid #e5e7eb",
  },
  emptyState: {
    textAlign: "center", padding: "60px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
  },
  emptyIcon: { fontSize: 48, margin: 0 },
  emptyTitle: { fontSize: 18, color: "#6b7280", margin: 0, fontWeight: 600 },
};