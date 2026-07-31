"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College } from "@/lib/colleges";

type Step = "auth" | "onboarding-schools" | "onboarding-reminders" | "dashboard";
type DeadlineType = "EA" | "ED" | "RD" | "Scholarship";

interface User {
  email: string;
}

interface SelectedDeadline {
  collegeId: string;
  collegeName: string;
  type: DeadlineType;
  date: string;
}

interface ReminderPrefs {
  email: boolean;
  sms: boolean;
  smsNumber: string;
  intervals: number[]; // days before: 30, 14, 7, 1
}

interface AppState {
  user: User | null;
  selectedColleges: string[];
  selectedDeadlines: SelectedDeadline[];
  reminderPrefs: ReminderPrefs;
  step: Step;
}

const DEFAULT_PREFS: ReminderPrefs = {
  email: true,
  sms: false,
  smsNumber: "",
  intervals: [30, 14, 7, 1],
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#94a3b8";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past";
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  return `${days}d`;
}

export default function Home() {
  const [state, setState] = useState<AppState>({
    user: null,
    selectedColleges: [],
    selectedDeadlines: [],
    reminderPrefs: DEFAULT_PREFS,
    step: "auth",
  });

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [schoolSearch, setSchoolSearch] = useState("");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineType | "ALL">("ALL");
  const [onboardingTab, setOnboardingTab] = useState<"search" | "selected">("search");

  const [dashFilter, setDashFilter] = useState<DeadlineType | "ALL">("ALL");
  const [dashSort, setDashSort] = useState<"date" | "name">("date");
  const [showPast, setShowPast] = useState(false);

  const [saveStatus, setSaveStatus] = useState("");
  const [reminderSaved, setReminderSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("edutracker_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<AppState>;
        setState((prev) => ({
          ...prev,
          ...parsed,
          reminderPrefs: { ...DEFAULT_PREFS, ...(parsed.reminderPrefs || {}) },
        }));
      } catch {}
    }
  }, []);

  // Track page
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const persist = useCallback((newState: Partial<AppState>) => {
    setState((prev) => {
      const merged = { ...prev, ...newState };
      localStorage.setItem("edutracker_state", JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Auth
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        const nextStep: Step =
          state.selectedColleges.length > 0 ? "dashboard" : "onboarding-schools";
        persist({ user: { email: data.email }, step: nextStep });
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("edutracker_state");
    setState({
      user: null,
      selectedColleges: [],
      selectedDeadlines: [],
      reminderPrefs: DEFAULT_PREFS,
      step: "auth",
    });
  }

  // School selection
  function toggleCollege(id: string) {
    const college = COLLEGES.find((c) => c.id === id);
    if (!college) return;

    setState((prev) => {
      let newSelected = [...prev.selectedColleges];
      let newDeadlines = [...prev.selectedDeadlines];

      if (newSelected.includes(id)) {
        newSelected = newSelected.filter((s) => s !== id);
        newDeadlines = newDeadlines.filter((d) => d.collegeId !== id);
      } else {
        newSelected.push(id);
        // Auto-add all available deadlines for this college
        const types: DeadlineType[] = ["EA", "ED", "RD", "Scholarship"];
        types.forEach((type) => {
          const dateKey = type.toLowerCase() as "ea" | "ed" | "rd" | "scholarship";
          const date = college[dateKey];
          if (date) {
            newDeadlines.push({
              collegeId: id,
              collegeName: college.name,
              type,
              date,
            });
          }
        });
      }

      const merged = { ...prev, selectedColleges: newSelected, selectedDeadlines: newDeadlines };
      localStorage.setItem("edutracker_state", JSON.stringify(merged));
      return merged;
    });
  }

  function toggleDeadline(collegeId: string, type: DeadlineType, date: string, collegeName: string) {
    setState((prev) => {
      const exists = prev.selectedDeadlines.find(
        (d) => d.collegeId === collegeId && d.type === type
      );
      let newDeadlines: SelectedDeadline[];
      if (exists) {
        newDeadlines = prev.selectedDeadlines.filter(
          (d) => !(d.collegeId === collegeId && d.type === type)
        );
      } else {
        newDeadlines = [...prev.selectedDeadlines, { collegeId, collegeName, type, date }];
      }
      const merged = { ...prev, selectedDeadlines: newDeadlines };
      localStorage.setItem("edutracker_state", JSON.stringify(merged));
      return merged;
    });
  }

  async function saveRemindersToDb() {
    if (!state.user) return;
    setSaveStatus("saving");
    try {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: state.user.email,
          deadlines: state.selectedDeadlines,
          prefs: state.reminderPrefs,
        }),
      });
      setSaveStatus("saved");
      setReminderSaved(true);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("error");
    }
  }

  const filteredColleges = COLLEGES.filter((c) => {
    const matchSearch =
      schoolSearch === "" ||
      c.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
      c.location.toLowerCase().includes(schoolSearch.toLowerCase());
    const matchFilter =
      deadlineFilter === "ALL" ||
      (deadlineFilter === "EA" && c.ea) ||
      (deadlineFilter === "ED" && c.ed) ||
      (deadlineFilter === "RD" && c.rd) ||
      (deadlineFilter === "Scholarship" && c.scholarship);
    return matchSearch && matchFilter;
  });

  const upcomingDeadlines = state.selectedDeadlines
    .filter((d) => (showPast ? true : daysUntil(d.date) >= 0))
    .filter((d) => dashFilter === "ALL" || d.type === dashFilter)
    .sort((a, b) => {
      if (dashSort === "date") return new Date(a.date).getTime() - new Date(b.date).getTime();
      return a.collegeName.localeCompare(b.collegeName);
    });

  const nextDeadline = state.selectedDeadlines
    .filter((d) => daysUntil(d.date) >= 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  // ─── RENDER ───────────────────────────────────────────────────────────────

  if (state.step === "auth") {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.brandName}>Edutracker</h1>
          <p style={styles.brandTagline}>Never miss a college application deadline</p>

          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(authMode === "login" ? styles.tabActive : {}) }}
              onClick={() => setAuthMode("login")}
            >
              Log In
            </button>
            <button
              style={{ ...styles.tab, ...(authMode === "signup" ? styles.tabActive : {}) }}
              onClick={() => setAuthMode("signup")}
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
              placeholder="you@email.com"
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
            {authError && <p style={styles.errorMsg}>{authError}</p>}
            <button type="submit" style={styles.primaryBtn} disabled={authLoading}>
              {authLoading ? "Loading…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>

          <div style={styles.features}>
            <div style={styles.featureItem}>📅 200+ colleges with real deadlines</div>
            <div style={styles.featureItem}>🔔 Automated reminders at 30, 14, 7 & 1 day</div>
            <div style={styles.featureItem}>📊 Personal deadline dashboard</div>
          </div>
        </div>
      </div>
    );
  }

  if (state.step === "onboarding-schools") {
    const selectedCount = state.selectedColleges.length;
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <span style={styles.headerLogo}>🎓 Edutracker</span>
          <div style={styles.stepIndicator}>
            <span style={styles.stepActive}>1. Select Schools</span>
            <span style={styles.stepDivider}>›</span>
            <span style={styles.stepInactive}>2. Set Reminders</span>
            <span style={styles.stepDivider}>›</span>
            <span style={styles.stepInactive}>3. Dashboard</span>
          </div>
          <button style={styles.ghostBtn} onClick={logout}>Logout</button>
        </header>

        <div style={styles.container}>
          <h2 style={styles.pageTitle}>Choose Your Target Schools</h2>
          <p style={styles.pageSubtitle}>
            Select the colleges you&apos;re applying to. We&apos;ll track all their deadlines for you.
          </p>

          <div style={styles.searchRow}>
            <input
              type="text"
              placeholder="Search colleges by name or location…"
              value={schoolSearch}
              onChange={(e) => setSchoolSearch(e.target.value)}
              style={styles.searchInput}
            />
            <div style={styles.filterBtns}>
              {(["ALL", "EA", "ED", "RD", "Scholarship"] as const).map((f) => (
                <button
                  key={f}
                  style={{
                    ...styles.filterBtn,
                    ...(deadlineFilter === f ? styles.filterBtnActive : {}),
                  }}
                  onClick={() => setDeadlineFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.onboardingTabs}>
            <button
              style={{
                ...styles.onboardTab,
                ...(onboardingTab === "search" ? styles.onboardTabActive : {}),
              }}
              onClick={() => setOnboardingTab("search")}
            >
              All Schools ({filteredColleges.length})
            </button>
            <button
              style={{
                ...styles.onboardTab,
                ...(onboardingTab === "selected" ? styles.onboardTabActive : {}),
              }}
              onClick={() => setOnboardingTab("selected")}
            >
              Selected ({selectedCount})
            </button>
          </div>

          <div style={styles.collegeGrid}>
            {(onboardingTab === "search" ? filteredColleges : COLLEGES.filter((c) => state.selectedColleges.includes(c.id))).map(
              (college) => {
                const isSelected = state.selectedColleges.includes(college.id);
                return (
                  <div
                    key={college.id}
                    style={{
                      ...styles.collegeCard,
                      ...(isSelected ? styles.collegeCardSelected : {}),
                    }}
                    onClick={() => toggleCollege(college.id)}
                  >
                    <div style={styles.collegeCardTop}>
                      <div>
                        <div style={styles.collegeName}>{college.name}</div>
                        <div style={styles.collegeLocation}>
                          📍 {college.location} · #{college.rank} Ranked
                        </div>
                      </div>
                      <div style={isSelected ? styles.checkOn : styles.checkOff}>
                        {isSelected ? "✓" : "+"}
                      </div>
                    </div>
                    <div style={styles.deadlinePills}>
                      {college.ea && (
                        <span style={{ ...styles.pill, ...styles.pillEA }}>
                          EA {formatDate(college.ea)}
                        </span>
                      )}
                      {college.ed && (
                        <span style={{ ...styles.pill, ...styles.pillED }}>
                          ED {formatDate(college.ed)}
                        </span>
                      )}
                      {college.rd && (
                        <span style={{ ...styles.pill, ...styles.pillRD }}>
                          RD {formatDate(college.rd)}
                        </span>
                      )}
                      {college.scholarship && (
                        <span style={{ ...styles.pill, ...styles.pillScholarship }}>
                          $ {formatDate(college.scholarship)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div style={styles.stickyFooter}>
            <span style={styles.selectedCount}>
              {selectedCount} school{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              style={{
                ...styles.primaryBtn,
                ...(selectedCount === 0 ? styles.btnDisabled : {}),
              }}
              disabled={selectedCount === 0}
              onClick={() => persist({ step: "onboarding-reminders" })}
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.step === "onboarding-reminders") {
    const prefs = state.reminderPrefs;
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <span style={styles.headerLogo}>🎓 Edutracker</span>
          <div style={styles.stepIndicator}>
            <span style={styles.stepDone}>✓ Schools</span>
            <span style={styles.stepDivider}>›</span>
            <span style={styles.stepActive}>2. Set Reminders</span>
            <span style={styles.stepDivider}>›</span>
            <span style={styles.stepInactive}>3. Dashboard</span>
          </div>
          <button style={styles.ghostBtn} onClick={logout}>Logout</button>
        </header>

        <div style={styles.container}>
          <h2 style={styles.pageTitle}>Set Up Your Reminders</h2>
          <p style={styles.pageSubtitle}>
            We&apos;ll alert you before each deadline so you never miss an application.
          </p>

          <div style={styles.reminderSection}>
            <h3 style={styles.sectionTitle}>📬 Notification Channels</h3>
            <div style={styles.toggleRow}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={prefs.email}
                  onChange={(e) =>
                    persist({ reminderPrefs: { ...prefs, email: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                Email reminders (sent to {state.user?.email})
              </label>
            </div>
            <div style={styles.toggleRow}>
              <label style={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={prefs.sms}
                  onChange={(e) =>
                    persist({ reminderPrefs: { ...prefs, sms: e.target.checked } })
                  }
                  style={styles.checkbox}
                />
                SMS text message reminders
              </label>
            </div>
            {prefs.sms && (
              <input
                type="tel"
                placeholder="(555) 867-5309"
                value={prefs.smsNumber}
                onChange={(e) =>
                  persist({ reminderPrefs: { ...prefs, smsNumber: e.target.value } })
                }
                style={{ ...styles.input, marginTop: 8, maxWidth: 280 }}
              />
            )}
          </div>

          <div style={styles.reminderSection}>
            <h3 style={styles.sectionTitle}>⏰ Reminder Schedule</h3>
            <p style={styles.sectionDesc}>
              Choose when to receive reminders before each deadline:
            </p>
            <div style={styles.intervalGrid}>
              {[30, 14, 7, 1].map((days) => {
                const active = prefs.intervals.includes(days);
                return (
                  <button
                    key={days}
                    style={{
                      ...styles.intervalBtn,
                      ...(active ? styles.intervalBtnActive : {}),
                    }}
                    onClick={() => {
                      const newIntervals = active
                        ? prefs.intervals.filter((i) => i !== days)
                        : [...prefs.intervals, days].sort((a, b) => b - a);
                      persist({ reminderPrefs: { ...prefs, intervals: newIntervals } });
                    }}
                  >
                    <span style={styles.intervalNum}>{days}</span>
                    <span style={styles.intervalUnit}>day{days !== 1 ? "s" : ""} before</span>
                    {active && <span style={styles.intervalCheck}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.reminderSection}>
            <h3 style={styles.sectionTitle}>📋 Your Selected Deadlines</h3>
            <p style={styles.sectionDesc}>
              Fine-tune which specific deadlines to track:
            </p>
            <div style={styles.deadlineList}>
              {state.selectedColleges.map((collegeId) => {
                const college = COLLEGES.find((c) => c.id === collegeId);
                if (!college) return null;
                const types: DeadlineType[] = ["EA", "ED", "RD", "Scholarship"];
                return (
                  <div key={collegeId} style={styles.deadlineCollegeRow}>
                    <div style={styles.deadlineCollegeName}>{college.name}</div>
                    <div style={styles.deadlineTypeRow}>
                      {types.map((type) => {
                        const dateKey = type.toLowerCase() as keyof College;
                        const date = college[dateKey] as string | undefined;
                        if (!date) return null;
                        const tracked = state.selectedDeadlines.find(
                          (d) => d.collegeId === collegeId && d.type === type
                        );
                        return (
                          <button
                            key={type}
                            style={{
                              ...styles.deadlineTypeBtn,
                              ...(tracked ? styles.deadlineTypeBtnActive : {}),
                            }}
                            onClick={() => toggleDeadline(collegeId, type, date, college.name)}
                          >
                            {tracked ? "✓" : ""} {type} {formatDate(date)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={styles.stickyFooter}>
            <button
              style={styles.ghostBtn}
              onClick={() => persist({ step: "onboarding-schools" })}
            >
              ← Back
            </button>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {saveStatus === "saved" && (
                <span style={{ color: "#22c55e", fontSize: 14 }}>✓ Reminders saved!</span>
              )}
              {saveStatus === "error" && (
                <span style={{ color: "#ef4444", fontSize: 14 }}>Save failed. Continuing locally.</span>
              )}
              <button
                style={styles.secondaryBtn}
                onClick={saveRemindersToDb}
                disabled={saveStatus === "saving"}
              >
                {saveStatus === "saving" ? "Saving…" : "💾 Save Reminders"}
              </button>
              <button
                style={styles.primaryBtn}
                onClick={() => persist({ step: "dashboard" })}
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  const totalDeadlines = state.selectedDeadlines.length;
  const upcomingCount = state.selectedDeadlines.filter((d) => daysUntil(d.date) >= 0).length;
  const urgentCount = state.selectedDeadlines.filter(
    (d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 7
  ).length;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.headerLogo}>🎓 Edutracker</span>
        <nav style={styles.nav}>
          <button
            style={styles.navBtn}
            onClick={() => persist({ step: "onboarding-schools" })}
          >
            + Add Schools
          </button>
          <button
            style={styles.navBtn}
            onClick={() => persist({ step: "onboarding-reminders" })}
          >
            ⚙ Reminders
          </button>
        </nav>
        <div style={styles.userChip}>
          <span>👤 {state.user?.email}</span>
          <button style={styles.logoutBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div style={styles.container}>
        <div style={styles.dashboardHero}>
          <div>
            <h2 style={styles.pageTitle}>Your Application Dashboard</h2>
            {nextDeadline && (
              <p style={styles.nextDeadlineHint}>
                🚨 Next up:{" "}
                <strong>{nextDeadline.collegeName}</strong> {nextDeadline.type} in{" "}
                <strong style={{ color: urgencyColor(daysUntil(nextDeadline.date)) }}>
                  {urgencyLabel(daysUntil(nextDeadline.date))}
                </strong>{" "}
                ({formatDate(nextDeadline.date)})
              </p>
            )}
          </div>
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statNum}>{state.selectedColleges.length}</div>
              <div style={styles.statLabel}>Schools</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNum}>{upcomingCount}</div>
              <div style={styles.statLabel}>Upcoming</div>
            </div>
            <div style={{ ...styles.statCard, ...(urgentCount > 0 ? styles.statCardUrgent : {}) }}>
              <div style={styles.statNum}>{urgentCount}</div>
              <div style={styles.statLabel}>Urgent ≤7d</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statNum}>{totalDeadlines}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
          </div>
        </div>

        <div style={styles.dashControls}>
          <div style={styles.filterBtns}>
            {(["ALL", "EA", "ED", "RD", "Scholarship"] as const).map((f) => (
              <button
                key={f}
                style={{
                  ...styles.filterBtn,
                  ...(dashFilter === f ? styles.filterBtnActive : {}),
                }}
                onClick={() => setDashFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={styles.dashControls2}>
            <label style={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => setShowPast(e.target.checked)}
                style={styles.checkbox}
              />
              Show past
            </label>
            <select
              value={dashSort}
              onChange={(e) => setDashSort(e.target.value as "date" | "name")}
              style={styles.select}
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>No deadlines found.</p>
            <button
              style={styles.primaryBtn}
              onClick={() => persist({ step: "onboarding-schools" })}
            >
              Add Schools
            </button>
          </div>
        ) : (
          <div style={styles.timelineContainer}>
            {upcomingDeadlines.map((dl, i) => {
              const days = daysUntil(dl.date);
              const color = urgencyColor(days);
              const isPast = days < 0;
              return (
                <div
                  key={`${dl.collegeId}-${dl.type}`}
                  style={{
                    ...styles.timelineItem,
                    ...(isPast ? styles.timelineItemPast : {}),
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <div style={{ ...styles.timelineDot, background: color }} />
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineTop}>
                      <div>
                        <span style={styles.timelineCollege}>{dl.collegeName}</span>
                        <span
                          style={{
                            ...styles.timelineType,
                            background:
                              dl.type === "EA"
                                ? "#dbeafe"
                                : dl.type === "ED"
                                ? "#fce7f3"
                                : dl.type === "RD"
                                ? "#dcfce7"
                                : "#fef9c3",
                            color:
                              dl.type === "EA"
                                ? "#1d4ed8"
                                : dl.type === "ED"
                                ? "#be185d"
                                : dl.type === "RD"
                                ? "#15803d"
                                : "#a16207",
                          }}
                        >
                          {dl.type}
                        </span>
                      </div>
                      <div style={styles.timelineRight}>
                        <span style={styles.timelineDate}>{formatDate(dl.date)}</span>
                        <span
                          style={{
                            ...styles.countdown,
                            background: color,
                          }}
                        >
                          {urgencyLabel(days)}
                        </span>
                      </div>
                    </div>
                    <div style={styles.reminderBadges}>
                      {state.reminderPrefs.email && (
                        <span style={styles.badge}>📧 Email</span>
                      )}
                      {state.reminderPrefs.sms && (
                        <span style={styles.badge}>📱 SMS</span>
                      )}
                      {state.reminderPrefs.intervals.map((days_) => (
                        <span key={days_} style={styles.badge}>
                          {days_}d
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => toggleDeadline(dl.collegeId, dl.type, dl.date, dl.collegeName)}
                    title="Remove deadline"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!reminderSaved && state.selectedDeadlines.length > 0 && (
          <div style={styles.reminderNudge}>
            <span>💡 Don&apos;t forget to save your reminder preferences!</span>
            <button
              style={styles.primaryBtn}
              onClick={() => persist({ step: "onboarding-reminders" })}
            >
              Set Up Reminders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  authPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  authCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 48px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
    textAlign: "center",
  },
  logo: { fontSize: 52, marginBottom: 8 },
  brandName: { fontSize: 32, fontWeight: 800, color: "#1e3a5f", margin: "0 0 6px" },
  brandTagline: { color: "#64748b", fontSize: 15, margin: "0 0 28px" },
  tabRow: {
    display: "flex",
    background: "#f1f5f9",
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    color: "#64748b",
  },
  tabActive: { background: "#fff", color: "#2563eb", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
  form: { display: "flex", flexDirection: "column", gap: 4, textAlign: "left" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 8, marginBottom: 4 },
  input: {
    padding: "10px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  errorMsg: { color: "#ef4444", fontSize: 13, margin: "4px 0" },
  primaryBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 8,
  },
  secondaryBtn: {
    padding: "12px 24px",
    background: "#f1f5f9",
    color: "#374151",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "8px 16px",
    background: "transparent",
    color: "#64748b",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  },
  btnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  features: {
    marginTop: 28,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    textAlign: "left",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "16px 20px",
  },
  featureItem: { fontSize: 14, color: "#475569" },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 32px",
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
  },
  headerLogo: { fontSize: 20, fontWeight: 800, color: "#1e3a5f" },
  stepIndicator: { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  stepActive: { fontWeight: 700, color: "#2563eb" },
  stepInactive: { color: "#94a3b8" },
  stepDone: { color: "#22c55e", fontWeight: 700 },
  stepDivider: { color: "#cbd5e1" },
  nav: { display: "flex", gap: 8 },
  navBtn: {
    padding: "8px 16px",
    background: "#f1f5f9",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    fontWeight: 600,
    color: "#374151",
  },
  userChip: { display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "#374151" },
  logoutBtn: {
    padding: "6px 12px",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    fontSize: 13,
    cursor: "pointer",
    color: "#64748b",
  },
  container: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px 120px" },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "#1e3a5f", margin: "0 0 8px" },
  pageSubtitle: { color: "#64748b", fontSize: 15, margin: "0 0 24px" },
  searchRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    minWidth: 240,
    padding: "10px 16px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 10,
    fontSize: 15,
    outline: "none",
  },
  filterBtns: { display: "flex", gap: 6, flexWrap: "wrap" },
  filterBtn: {
    padding: "8px 14px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    color: "#64748b",
  },
  filterBtnActive: {
    background: "#2563eb",
    color: "#fff",
    borderColor: "#2563eb",
  },
  onboardingTabs: { display: "flex", gap: 0, marginBottom: 20, borderBottom: "2px solid #e2e8f0" },
  onboardTab: {
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    color: "#64748b",
    borderBottom: "2px solid transparent",
    marginBottom: -2,
  },
  onboardTabActive: { color: "#2563eb", borderBottom: "2px solid #2563eb" },
  collegeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: 16,
    marginBottom: 100,
  },
  collegeCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 20px",
    cursor: "pointer",
    transition: "all 0.2s",
    userSelect: "none",
  },
  collegeCardSelected: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.15)",
  },
  collegeCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  collegeName: { fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 },
  collegeLocation: { fontSize: 12, color: "#64748b" },
  checkOn: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
    fontSize: 14,
  },
  checkOff: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "1.5px dashed #cbd5e1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#94a3b8",
    flexShrink: 0,
    fontSize: 18,
  },
  deadlinePills: { display: "flex", gap: 6, flexWrap: "wrap" },
  pill: { fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 },
  pillEA: { background: "#dbeafe", color: "#1d4ed8" },
  pillED: { background: "#fce7f3", color: "#be185d" },
  pillRD: { background: "#dcfce7", color: "#15803d" },
  pillScholarship: { background: "#fef9c3", color: "#a16207" },
  stickyFooter: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 200,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
  },
  selectedCount: { fontSize: 15, fontWeight: 600, color: "#374151" },
  reminderSection: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 16,
    padding: "24px 28px",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 12px" },
  sectionDesc: { fontSize: 14, color: "#64748b", margin: "0 0 16px" },
  toggleRow: { marginBottom: 10 },
  toggleLabel: { display: "flex", alignItems: "center", gap: 10, fontSize: 15, cursor: "pointer" },
  checkbox: { width: 18, height: 18, cursor: "pointer" },
  intervalGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  intervalBtn: {
    padding: "20px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    background: "#f8fafc",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    position: "relative",
    transition: "all 0.15s",
  },
  intervalBtnActive: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.15)",
  },
  intervalNum: { fontSize: 28, fontWeight: 800, color: "#1e3a5f" },
  intervalUnit: { fontSize: 12, color: "#64748b" },
  intervalCheck: {
    position: "absolute",
    top: 8,
    right: 10,
    color: "#2563eb",
    fontWeight: 700,
    fontSize: 14,
  },
  deadlineList: { display: "flex", flexDirection: "column", gap: 12 },
  deadlineCollegeRow: {
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "12px 16px",
    background: "#f8fafc",
  },
  deadlineCollegeName: { fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 8 },
  deadlineTypeRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  deadlineTypeBtn: {
    padding: "6px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    background: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    color: "#64748b",
  },
  deadlineTypeBtnActive: { background: "#2563eb", color: "#fff", borderColor: "#2563eb" },
  dashboardHero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 20,
    marginBottom: 28,
  },
  nextDeadlineHint: { fontSize: 15, color: "#475569", margin: "6px 0 0" },
  statsRow: { display: "flex", gap: 12 },
  statCard: {
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px 20px",
    textAlign: "center",
    minWidth: 80,
  },
  statCardUrgent: { borderColor: "#ef4444", background: "#fff5f5" },
  statNum: { fontSize: 28, fontWeight: 800, color: "#1e3a5f" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },
  dashControls: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  dashControls2: { display: "flex", gap: 16, alignItems: "center" },
  select: {
    padding: "8px 12px",
    border: "1.5px solid #e2e8f0",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
  },
  timelineContainer: { display: "flex", flexDirection: "column", gap: 10 },
  timelineItem: {
    display: "flex",
    alignItems: "stretch",
    gap: 16,
    background: "#fff",
    border: "1.5px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 20px",
    position: "relative",
    animation: "fadeSlideIn 0.3s ease both",
    transition: "box-shadow 0.2s",
  },
  timelineItemPast: { opacity: 0.5 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: 4,
  },
  timelineContent: { flex: 1 },
  timelineTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  timelineCollege: { fontSize: 16, fontWeight: 700, color: "#1e293b", marginRight: 8 },
  timelineType: {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 6,
    verticalAlign: "middle",
  },
  timelineRight: { display: "flex", alignItems: "center", gap: 10 },
  timelineDate: { fontSize: 14, color: "#64748b", fontWeight: 500 },
  countdown: {
    padding: "4px 12px",
    borderRadius: 20,
    color: "#fff",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  reminderBadges: { display: "flex", gap: 6, flexWrap: "wrap" },
  badge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 20,
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: 600,
    border: "1px solid #e2e8f0",
  },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    fontSize: 20,
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
    alignSelf: "flex-start",
    transition: "color 0.15s",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  emptyIcon: { fontSize: 64 },
  emptyText: { fontSize: 18, color: "#64748b" },
  reminderNudge: {
    marginTop: 32,
    padding: "16px 24px",
    background: "#fffbeb",
    border: "1.5px solid #fde68a",
    borderRadius: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    color: "#92400e",
    flexWrap: "wrap",
    gap: 12,
  },
};