"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College, Deadline } from "@/lib/colleges";

type View = "splash" | "auth" | "onboarding" | "dashboard" | "reminders" | "settings";

interface UserDeadline {
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineDate: string;
  label: string;
}

interface ReminderSettings {
  email: string;
  phone: string;
  smsEnabled: boolean;
  intervals: number[];
}

interface CountdownInfo {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function getCountdown(dateStr: string): CountdownInfo {
  const target = new Date(dateStr + "T23:59:59");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, isPast: false };
}

function urgencyColor(days: number, isPast: boolean): string {
  if (isPast) return "#9ca3af";
  if (days <= 1) return "#ef4444";
  if (days <= 7) return "#f97316";
  if (days <= 14) return "#eab308";
  if (days <= 30) return "#3b82f6";
  return "#22c55e";
}

function deadlineTypeColor(type: string): string {
  switch (type) {
    case "EA": return "#6366f1";
    case "ED": return "#ec4899";
    case "ED2": return "#db2777";
    case "RD": return "#0ea5e9";
    case "Scholarship": return "#f59e0b";
    default: return "#6b7280";
  }
}

export default function Home() {
  const [view, setView] = useState<View>("splash");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Onboarding
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<Set<string>>(new Set());
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Dashboard
  const [userDeadlines, setUserDeadlines] = useState<UserDeadline[]>([]);
  const [tick, setTick] = useState(0);
  const [filterType, setFilterType] = useState<string>("All");
  const [sortPast, setSortPast] = useState(false);

  // Reminders
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    email: "",
    phone: "",
    smsEnabled: false,
    intervals: [30, 14, 7, 1],
  });
  const [reminderSaved, setReminderSaved] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);

  // Settings
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(new Set());

  // Splash → check session
  useEffect(() => {
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserEmail(parsed.email);
      loadUserData(parsed.email);
    } else {
      setView("auth");
    }
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Countdown ticker
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUserData = useCallback(async (email: string) => {
    try {
      const res = await fetch(`/api/user-data?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.selectedColleges && data.selectedColleges.length > 0) {
          const ids = new Set<string>(data.selectedColleges as string[]);
          setSelectedCollegeIds(ids);
          buildDeadlines(ids);
          if (data.reminders) {
            setReminderSettings(data.reminders);
          }
          setView("dashboard");
        } else {
          setView("onboarding");
        }
      } else {
        setView("onboarding");
      }
    } catch {
      setView("onboarding");
    }
  }, []);

  const buildDeadlines = (ids: Set<string>) => {
    const deadlines: UserDeadline[] = [];
    ids.forEach((id) => {
      const college = COLLEGES.find((c) => c.id === id);
      if (college) {
        college.deadlines.forEach((d) => {
          deadlines.push({
            collegeId: id,
            collegeName: college.name,
            deadlineType: d.type,
            deadlineDate: d.date,
            label: d.label || d.type,
          });
        });
      }
    });
    deadlines.sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime());
    setUserDeadlines(deadlines);
  };

  const handleAuth = async () => {
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
        localStorage.setItem("edutracker_user", JSON.stringify({ email: data.email }));
        await loadUserData(data.email);
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("edutracker_user");
    setUserEmail(null);
    setSelectedCollegeIds(new Set());
    setUserDeadlines([]);
    setEmail("");
    setPassword("");
    setView("auth");
  };

  const handleFinishOnboarding = async () => {
    buildDeadlines(selectedCollegeIds);
    await saveUserData();
    setView("dashboard");
  };

  const saveUserData = async () => {
    if (!userEmail) return;
    await fetch("/api/user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        selectedColleges: Array.from(selectedCollegeIds),
        reminders: reminderSettings,
      }),
    }).catch(() => {});
  };

  const handleSaveReminders = async () => {
    setReminderLoading(true);
    await saveUserData();
    // Trigger reminder scheduling
    await fetch("/api/schedule-reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        reminderSettings,
        deadlines: userDeadlines,
      }),
    }).catch(() => {});
    setReminderLoading(false);
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 3000);
  };

  const toggleInterval = (interval: number) => {
    setReminderSettings((prev) => ({
      ...prev,
      intervals: prev.intervals.includes(interval)
        ? prev.intervals.filter((i) => i !== interval)
        : [...prev.intervals, interval].sort((a, b) => b - a),
    }));
  };

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deadlineTypes = ["All", "EA", "ED", "ED2", "RD", "Scholarship"];
  const filteredDeadlines = userDeadlines.filter((d) => {
    if (filterType !== "All" && d.deadlineType !== filterType) return false;
    if (!sortPast) {
      const cd = getCountdown(d.deadlineDate);
      if (cd.isPast) return false;
    }
    return true;
  });

  const upcomingCount = userDeadlines.filter((d) => !getCountdown(d.deadlineDate).isPast).length;
  const urgentCount = userDeadlines.filter((d) => {
    const cd = getCountdown(d.deadlineDate);
    return !cd.isPast && cd.days <= 7;
  }).length;

  // ── SPLASH ──────────────────────────────────────────────────────────────────
  if (view === "splash") {
    return (
      <div style={styles.splashContainer}>
        <div style={styles.splashLogo}>🎓</div>
        <div style={styles.splashTitle}>Edutracker</div>
        <div style={styles.splashSub}>Loading your application timeline...</div>
        <div style={styles.spinner} />
      </div>
    );
  }

  // ── AUTH ─────────────────────────────────────────────────────────────────────
  if (view === "auth") {
    return (
      <div style={styles.authBg}>
        <div style={styles.authCard}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48 }}>🎓</div>
            <h1 style={styles.authTitle}>Edutracker</h1>
            <p style={styles.authSub}>Never miss a college application deadline</p>
          </div>
          <div style={styles.authTabs}>
            <button
              style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Log In
            </button>
            <button
              style={{ ...styles.authTab, ...(authMode === "signup" ? styles.authTabActive : {}) }}
              onClick={() => { setAuthMode("signup"); setAuthError(""); }}
            >
              Sign Up
            </button>
          </div>
          <div style={styles.authForm}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAuth()}
            />
            {authError && <div style={styles.errorMsg}>{authError}</div>}
            <button
              style={{ ...styles.primaryBtn, opacity: authLoading ? 0.7 : 1 }}
              onClick={handleAuth}
              disabled={authLoading}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </div>
          <p style={styles.authFooter}>
            Track deadlines for 80+ colleges · Free · No spam
          </p>
        </div>
      </div>
    );
  }

  // ── ONBOARDING ───────────────────────────────────────────────────────────────
  if (view === "onboarding") {
    return (
      <div style={styles.onboardingBg}>
        <div style={styles.onboardingCard}>
          {onboardingStep === 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎯</div>
              <h2 style={styles.h2}>Welcome to Edutracker</h2>
              <p style={styles.para}>
                We'll help you track application deadlines for all your target schools —
                and remind you before they sneak up on you.
              </p>
              <div style={styles.featureList}>
                {[
                  ["📅", "EA, ED, RD & Scholarship deadlines"],
                  ["⏰", "Reminders at 30, 14, 7 & 1 day"],
                  ["📧", "Email & SMS notifications"],
                  ["📊", "Live countdown dashboard"],
                ].map(([icon, text]) => (
                  <div key={text} style={styles.featureItem}>
                    <span style={{ fontSize: 24 }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
              <button style={styles.primaryBtn} onClick={() => setOnboardingStep(1)}>
                Get Started →
              </button>
            </div>
          )}

          {onboardingStep === 1 && (
            <div>
              <div style={styles.onboardingHeader}>
                <h2 style={styles.h2}>Select Your Target Schools</h2>
                <p style={styles.para}>Choose all the colleges you're applying to</p>
              </div>
              <input
                style={styles.searchInput}
                placeholder="🔍  Search colleges by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div style={styles.selectedBadge}>
                {selectedCollegeIds.size} school{selectedCollegeIds.size !== 1 ? "s" : ""} selected
              </div>
              <div style={styles.collegeGrid}>
                {filteredColleges.map((college) => {
                  const selected = selectedCollegeIds.has(college.id);
                  return (
                    <div
                      key={college.id}
                      style={{
                        ...styles.collegeCard,
                        ...(selected ? styles.collegeCardSelected : {}),
                      }}
                      onClick={() => {
                        const next = new Set(selectedCollegeIds);
                        if (selected) next.delete(college.id);
                        else next.add(college.id);
                        setSelectedCollegeIds(next);
                      }}
                    >
                      <div style={styles.collegeName}>{college.name}</div>
                      <div style={styles.collegeLocation}>{college.location}</div>
                      <div style={styles.deadlinePills}>
                        {college.deadlines.map((d) => (
                          <span
                            key={d.type + d.date}
                            style={{
                              ...styles.pill,
                              background: deadlineTypeColor(d.type),
                            }}
                          >
                            {d.type}
                          </span>
                        ))}
                      </div>
                      {selected && <div style={styles.checkmark}>✓</div>}
                    </div>
                  );
                })}
              </div>
              <div style={styles.onboardingFooter}>
                <button
                  style={styles.secondaryBtn}
                  onClick={() => setOnboardingStep(0)}
                >
                  ← Back
                </button>
                <button
                  style={{
                    ...styles.primaryBtn,
                    opacity: selectedCollegeIds.size === 0 ? 0.5 : 1,
                    marginLeft: 12,
                  }}
                  disabled={selectedCollegeIds.size === 0}
                  onClick={() => setOnboardingStep(2)}
                >
                  Next → ({selectedCollegeIds.size} selected)
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div>
              <h2 style={styles.h2}>Set Up Reminders</h2>
              <p style={styles.para}>
                We'll notify you before each deadline at these intervals:
              </p>
              <div style={styles.intervalRow}>
                {[30, 14, 7, 1].map((n) => (
                  <button
                    key={n}
                    style={{
                      ...styles.intervalBtn,
                      ...(reminderSettings.intervals.includes(n)
                        ? styles.intervalBtnActive
                        : {}),
                    }}
                    onClick={() => toggleInterval(n)}
                  >
                    {n} day{n !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email for reminders</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder={userEmail || "your@email.com"}
                  value={reminderSettings.email}
                  onChange={(e) =>
                    setReminderSettings((p) => ({ ...p, email: e.target.value }))
                  }
                />
                <p style={styles.hint}>Leave blank to use your account email</p>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.smsEnabled}
                    onChange={(e) =>
                      setReminderSettings((p) => ({
                        ...p,
                        smsEnabled: e.target.checked,
                      }))
                    }
                    style={{ marginRight: 8 }}
                  />
                  Enable SMS reminders
                </label>
                {reminderSettings.smsEnabled && (
                  <input
                    style={{ ...styles.input, marginTop: 10 }}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={reminderSettings.phone}
                    onChange={(e) =>
                      setReminderSettings((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                )}
              </div>
              <div style={styles.onboardingFooter}>
                <button style={styles.secondaryBtn} onClick={() => setOnboardingStep(1)}>
                  ← Back
                </button>
                <button
                  style={{ ...styles.primaryBtn, marginLeft: 12 }}
                  onClick={handleFinishOnboarding}
                >
                  Go to Dashboard 🚀
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DASHBOARD / REMINDERS / SETTINGS ────────────────────────────────────────
  return (
    <div style={styles.appContainer}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <span style={styles.sidebarTitle}>Edutracker</span>
        </div>
        <nav style={styles.nav}>
          {(
            [
              { key: "dashboard", icon: "📊", label: "Dashboard" },
              { key: "reminders", icon: "🔔", label: "Reminders" },
              { key: "settings", icon: "⚙️", label: "My Schools" },
            ] as { key: View; icon: string; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              style={{
                ...styles.navItem,
                ...(view === item.key ? styles.navItemActive : {}),
              }}
              onClick={() => setView(item.key)}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <div style={styles.userEmail} title={userEmail || ""}>
            {userEmail}
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        {/* ── DASHBOARD VIEW ── */}
        {view === "dashboard" && (
          <div>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Your Application Timeline</h1>
                <p style={styles.pageSub}>
                  Tracking {selectedCollegeIds.size} schools · {upcomingCount} upcoming deadlines
                  {urgentCount > 0 && (
                    <span style={styles.urgentBadge}>
                      ⚠️ {urgentCount} urgent
                    </span>
                  )}
                </p>
              </div>
              <button
                style={styles.addSchoolBtn}
                onClick={() => { setSearchQuery(""); setOnboardingStep(1); setView("onboarding"); }}
              >
                + Add Schools
              </button>
            </div>

            {/* Stats row */}
            <div style={styles.statsRow}>
              {[
                { label: "Schools", value: selectedCollegeIds.size, color: "#6366f1" },
                { label: "Total Deadlines", value: userDeadlines.length, color: "#0ea5e9" },
                { label: "Upcoming", value: upcomingCount, color: "#22c55e" },
                { label: "Urgent (≤7 days)", value: urgentCount, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                  <div style={styles.statLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={styles.filterRow}>
              {deadlineTypes.map((t) => (
                <button
                  key={t}
                  style={{
                    ...styles.filterBtn,
                    ...(filterType === t ? {
                      background: deadlineTypeColor(t === "All" ? "RD" : t),
                      color: "#fff",
                      borderColor: "transparent",
                    } : {}),
                  }}
                  onClick={() => setFilterType(t)}
                >
                  {t}
                </button>
              ))}
              <label style={{ ...styles.filterBtn, cursor: "pointer", marginLeft: "auto" }}>
                <input
                  type="checkbox"
                  checked={sortPast}
                  onChange={(e) => setSortPast(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Show past
              </label>
            </div>

            {/* Deadline cards */}
            {filteredDeadlines.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48 }}>🎉</div>
                <p>
                  {userDeadlines.length === 0
                    ? "No schools selected yet. Add schools to see deadlines."
                    : "No upcoming deadlines matching your filter."}
                </p>
                {userDeadlines.length === 0 && (
                  <button
                    style={styles.primaryBtn}
                    onClick={() => { setSearchQuery(""); setOnboardingStep(1); setView("onboarding"); }}
                  >
                    Add Schools
                  </button>
                )}
              </div>
            ) : (
              <div style={styles.deadlineList}>
                {filteredDeadlines.map((d, i) => {
                  const cd = getCountdown(d.deadlineDate);
                  const color = urgencyColor(cd.days, cd.isPast);
                  const dateObj = new Date(d.deadlineDate);
                  const formatted = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <div key={i} style={{ ...styles.deadlineCard, borderLeft: `4px solid ${color}` }}>
                      <div style={styles.dcLeft}>
                        <div style={styles.dcCollege}>{d.collegeName}</div>
                        <div style={styles.dcMeta}>
                          <span
                            style={{
                              ...styles.pill,
                              background: deadlineTypeColor(d.deadlineType),
                              fontSize: 12,
                            }}
                          >
                            {d.label}
                          </span>
                          <span style={styles.dcDate}>{formatted}</span>
                        </div>
                      </div>
                      <div style={styles.dcRight}>
                        {cd.isPast ? (
                          <div style={{ color: "#9ca3af", fontWeight: 600 }}>Passed</div>
                        ) : (
                          <div style={styles.countdown}>
                            {cd.days > 0 && (
                              <div style={styles.cdUnit}>
                                <span style={{ ...styles.cdNum, color }}>{cd.days}</span>
                                <span style={styles.cdLabel}>d</span>
                              </div>
                            )}
                            <div style={styles.cdUnit}>
                              <span style={{ ...styles.cdNum, color }}>{String(cd.hours).padStart(2, "0")}</span>
                              <span style={styles.cdLabel}>h</span>
                            </div>
                            <div style={styles.cdUnit}>
                              <span style={{ ...styles.cdNum, color }}>{String(cd.minutes).padStart(2, "0")}</span>
                              <span style={styles.cdLabel}>m</span>
                            </div>
                            <div style={styles.cdUnit}>
                              <span style={{ ...styles.cdNum, color }}>{String(cd.seconds).padStart(2, "0")}</span>
                              <span style={styles.cdLabel}>s</span>
                            </div>
                          </div>
                        )}
                        {!cd.isPast && cd.days <= 30 && (
                          <div style={{ ...styles.urgencyLabel, color }}>
                            {cd.days === 0 ? "TODAY!" : cd.days === 1 ? "TOMORROW!" : `${cd.days} days left`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── REMINDERS VIEW ── */}
        {view === "reminders" && (
          <div>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>Reminder Settings</h1>
                <p style={styles.pageSub}>Configure when and how you get notified</p>
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>📅 Reminder Intervals</h3>
              <p style={styles.para}>Get notified this many days before each deadline:</p>
              <div style={styles.intervalRow}>
                {[30, 14, 7, 1].map((n) => (
                  <button
                    key={n}
                    style={{
                      ...styles.intervalBtn,
                      ...(reminderSettings.intervals.includes(n) ? styles.intervalBtnActive : {}),
                    }}
                    onClick={() => toggleInterval(n)}
                  >
                    {n} day{n !== 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>📧 Email Notifications</h3>
              <div style={styles.formGroup}>
                <label style={styles.label}>Reminder email address</label>
                <input
                  style={styles.input}
                  type="email"
                  placeholder={userEmail || "your@email.com"}
                  value={reminderSettings.email}
                  onChange={(e) =>
                    setReminderSettings((p) => ({ ...p, email: e.target.value }))
                  }
                />
                <p style={styles.hint}>
                  Leave blank to use {userEmail} (your account email)
                </p>
              </div>
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>📱 SMS Notifications</h3>
              <label style={{ ...styles.label, display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    ...styles.toggle,
                    background: reminderSettings.smsEnabled ? "#6366f1" : "#d1d5db",
                  }}
                  onClick={() =>
                    setReminderSettings((p) => ({ ...p, smsEnabled: !p.smsEnabled }))
                  }
                >
                  <div
                    style={{
                      ...styles.toggleThumb,
                      transform: reminderSettings.smsEnabled ? "translateX(22px)" : "translateX(2px)",
                    }}
                  />
                </div>
                Enable SMS reminders
              </label>
              {reminderSettings.smsEnabled && (
                <div style={{ marginTop: 16 }}>
                  <label style={styles.label}>Phone number</label>
                  <input
                    style={styles.input}
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={reminderSettings.phone}
                    onChange={(e) =>
                      setReminderSettings((p) => ({ ...p, phone: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>📋 Upcoming Reminder Preview</h3>
              <p style={styles.para}>
                Based on your settings, here's when you'll receive reminders:
              </p>
              <div style={styles.reminderPreviewList}>
                {userDeadlines
                  .filter((d) => !getCountdown(d.deadlineDate).isPast)
                  .slice(0, 5)
                  .flatMap((d) =>
                    reminderSettings.intervals.map((interval) => {
                      const deadlineDate = new Date(d.deadlineDate);
                      const reminderDate = new Date(deadlineDate);
                      reminderDate.setDate(reminderDate.getDate() - interval);
                      return {
                        ...d,
                        interval,
                        reminderDate,
                        reminderDateStr: reminderDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        }),
                      };
                    })
                  )
                  .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
                  .slice(0, 10)
                  .map((item, i) => (
                    <div key={i} style={styles.reminderPreviewItem}>
                      <span style={styles.reminderPreviewDate}>{item.reminderDateStr}</span>
                      <span>
                        {item.collegeName} — {item.label}
                      </span>
                      <span style={{ ...styles.pill, background: "#6366f1", marginLeft: "auto" }}>
                        {item.interval}d warning
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                style={{ ...styles.primaryBtn, opacity: reminderLoading ? 0.7 : 1 }}
                onClick={handleSaveReminders}
                disabled={reminderLoading}
              >
                {reminderLoading ? "Saving..." : "Save Reminder Settings"}
              </button>
              {reminderSaved && (
                <span style={styles.savedMsg}>✓ Settings saved!</span>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS / MY SCHOOLS VIEW ── */}
        {view === "settings" && (
          <div>
            <div style={styles.pageHeader}>
              <div>
                <h1 style={styles.pageTitle}>My Schools</h1>
                <p style={styles.pageSub}>
                  Manage your {selectedCollegeIds.size} selected schools
                </p>
              </div>
              <button
                style={styles.addSchoolBtn}
                onClick={() => { setSearchQuery(""); setOnboardingStep(1); setView("onboarding"); }}
              >
                + Add Schools
              </button>
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>Selected Schools</h3>
              {selectedCollegeIds.size === 0 ? (
                <div style={styles.emptyState}>
                  <p>No schools selected yet.</p>
                  <button
                    style={styles.primaryBtn}
                    onClick={() => { setSearchQuery(""); setOnboardingStep(1); setView("onboarding"); }}
                  >
                    Add Schools
                  </button>
                </div>
              ) : (
                <div>
                  {Array.from(selectedCollegeIds).map((id) => {
                    const college = COLLEGES.find((c) => c.id === id);
                    if (!college) return null;
                    const removing = selectedForRemoval.has(id);
                    return (
                      <div key={id} style={styles.schoolRow}>
                        <div style={styles.schoolRowLeft}>
                          <div style={styles.collegeName}>{college.name}</div>
                          <div style={styles.collegeLocation}>{college.location}</div>
                          <div style={styles.deadlinePills}>
                            {college.deadlines.map((d) => (
                              <span
                                key={d.type + d.date}
                                style={{
                                  ...styles.pill,
                                  background: deadlineTypeColor(d.type),
                                  fontSize: 11,
                                }}
                              >
                                {d.type}: {d.date}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          style={{
                            ...styles.removeBtn,
                            ...(removing ? styles.removeBtnConfirm : {}),
                          }}
                          onClick={() => {
                            if (removing) {
                              const next = new Set(selectedCollegeIds);
                              next.delete(id);
                              setSelectedCollegeIds(next);
                              buildDeadlines(next);
                              saveUserData();
                              const nextRemoving = new Set(selectedForRemoval);
                              nextRemoving.delete(id);
                              setSelectedForRemoval(nextRemoving);
                            } else {
                              const next = new Set(selectedForRemoval);
                              next.add(id);
                              setSelectedForRemoval(next);
                              setTimeout(() => {
                                setSelectedForRemoval((prev) => {
                                  const n = new Set(prev);
                                  n.delete(id);
                                  return n;
                                });
                              }, 3000);
                            }
                          }}
                        >
                          {removing ? "Confirm Remove" : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={styles.settingsCard}>
              <h3 style={styles.sectionTitle}>Deadline Summary</h3>
              <div style={styles.summaryGrid}>
                {["EA", "ED", "ED2", "RD", "Scholarship"].map((type) => {
                  const count = userDeadlines.filter((d) => d.deadlineType === type).length;
                  return (
                    <div key={type} style={styles.summaryItem}>
                      <div
                        style={{
                          ...styles.summaryDot,
                          background: deadlineTypeColor(type),
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{type}</span>
                      <span style={styles.summaryCount}>{count} deadline{count !== 1 ? "s" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  splashContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    color: "#fff",
    gap: 16,
  },
  splashLogo: { fontSize: 72 },
  splashTitle: { fontSize: 36, fontWeight: 800, letterSpacing: -1 },
  splashSub: { fontSize: 16, opacity: 0.7 },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginTop: 16,
  },
  authBg: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    padding: 20,
  },
  authCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 48px",
    width: "100%",
    maxWidth: 440,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: "#1e1b4b",
    margin: "8px 0 4px",
  },
  authSub: { color: "#6b7280", fontSize: 15 },
  authTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 24,
    background: "#f3f4f6",
    padding: 4,
    borderRadius: 10,
  },
  authTab: {
    flex: 1,
    padding: "10px 0",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: "transparent",
    fontWeight: 600,
    fontSize: 15,
    color: "#6b7280",
    transition: "all 0.2s",
  },
  authTabActive: {
    background: "#fff",
    color: "#1e1b4b",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  authForm: { display: "flex", flexDirection: "column", gap: 8 },
  authFooter: { textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 20 },
  onboardingBg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 20px",
  },
  onboardingCard: {
    background: "#fff",
    borderRadius: 20,
    padding: 40,
    width: "100%",
    maxWidth: 860,
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  onboardingHeader: { marginBottom: 24 },
  onboardingFooter: { display: "flex", justifyContent: "flex-end", marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" },
  featureList: { display: "flex", flexDirection: "column", gap: 12, margin: "24px 0", textAlign: "left" },
  featureItem: { display: "flex", alignItems: "center", gap: 16, fontSize: 16, color: "#374151", padding: "8px 16px", background: "#f9fafb", borderRadius: 10 },
  searchInput: {
    width: "100%",
    padding: "12px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  },
  selectedBadge: {
    display: "inline-block",
    background: "#eef2ff",
    color: "#6366f1",
    fontWeight: 700,
    padding: "4px 14px",
    borderRadius: 20,
    fontSize: 14,
    marginBottom: 16,
  },
  collegeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 12,
    maxHeight: 480,
    overflowY: "auto",
    padding: 4,
  },
  collegeCard: {
    position: "relative",
    padding: 16,
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    cursor: "pointer",
    transition: "all 0.15s",
    background: "#fff",
  },
  collegeCardSelected: {
    borderColor: "#6366f1",
    background: "#eef2ff",
  },
  collegeName: { fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 },
  collegeLocation: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  deadlinePills: { display: "flex", flexWrap: "wrap", gap: 4 },
  pill: {
    display: "inline-block",
    color: "#fff",
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "#6366f1",
    color: "#fff",
    width: 22,
    height: 22,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
  },
  formGroup: { marginBottom: 20 },
  label: { display: "block", fontWeight: 600, color: "#374151", fontSize: 14, marginBottom: 6 },
  input: {
    width: "100%",
    padding: "12px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  hint: { color: "#9ca3af", fontSize: 12, marginTop: 4 },
  intervalRow: { display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" },
  intervalBtn: {
    padding: "10px 20px",
    border: "2px solid #e5e7eb",
    borderRadius: 10,
    cursor: "pointer",
    background: "#fff",
    fontWeight: 600,
    fontSize: 15,
    color: "#374151",
    transition: "all 0.15s",
  },
  intervalBtnActive: {
    background: "#6366f1",
    color: "#fff",
    borderColor: "#6366f1",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #6366f1, #4338ca)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "13px 28px",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  secondaryBtn: {
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 10,
    padding: "13px 28px",
    fontWeight: 700,
    fontSize: 16,
    cursor: "pointer",
  },
  errorMsg: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  // App layout
  appContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8fafc",
  },
  sidebar: {
    width: 240,
    background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 24px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  sidebarTitle: { fontSize: 20, fontWeight: 800, letterSpacing: -0.5 },
  nav: { flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    textAlign: "left",
    transition: "all 0.15s",
    width: "100%",
  },
  navItemActive: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
  },
  sidebarFooter: {
    padding: "16px 24px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  main: {
    marginLeft: 240,
    flex: 1,
    padding: "40px 48px",
    maxWidth: "calc(100vw - 240px)",
    overflowX: "hidden",
  },
  pageHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  pageTitle: { fontSize: 28, fontWeight: 800, color: "#111827", margin: 0 },
  pageSub: { color: "#6b7280", marginTop: 4, fontSize: 15 },
  urgentBadge: {
    display: "inline-block",
    background: "#fef2f2",
    color: "#ef4444",
    fontWeight: 700,
    padding: "2px 10px",
    borderRadius: 20,
    fontSize: 13,
    marginLeft: 10,
  },
  addSchoolBtn: {
    background: "#fff",
    color: "#6366f1",
    border: "2px solid #6366f1",
    borderRadius: 10,
    padding: "10px 20px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    textAlign: "center",
  },
  statValue: { fontSize: 36, fontWeight: 800 },
  statLabel: { color: "#6b7280", fontSize: 13, fontWeight: 600, marginTop: 4 },
  filterRow: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterBtn: {
    padding: "7px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 8,
    cursor: "pointer",
    background: "#fff",
    fontWeight: 600,
    fontSize: 13,
    color: "#374151",
    transition: "all 0.15s",
  },
  deadlineList: { display: "flex", flexDirection: "column", gap: 12 },
  deadlineCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "20px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    gap: 16,
  },
  dcLeft: { flex: 1 },
  dcCollege: { fontWeight: 700, fontSize: 17, color: "#111827", marginBottom: 6 },
  dcMeta: { display: "flex", alignItems: "center", gap: 10 },
  dcDate: { color: "#6b7280", fontSize: 14 },
  dcRight: { textAlign: "right", minWidth: 160 },
  countdown: { display: "flex", gap: 8, justifyContent: "flex-end" },
  cdUnit: { display: "flex", flexDirection: "column", alignItems: "center" },
  cdNum: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
  cdLabel: { fontSize: 10, color: "#9ca3af", fontWeight: 600, marginTop: 2 },
  urgencyLabel: { fontSize: 12, fontWeight: 700, marginTop: 6, letterSpacing: 0.5 },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
    fontSize: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  settingsCard: {
    background: "#fff",
    borderRadius: 14,
    padding: "28px 32px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#111827", marginBottom: 16, marginTop: 0 },
  para: { color: "#6b7280", fontSize: 15, lineHeight: 1.6 },
  h2: { fontSize: 26, fontWeight: 800, color: "#111827", marginBottom: 8, marginTop: 0 },
  toggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    cursor: "pointer",
    transition: "background 0.2s",
    position: "relative",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: 2,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
  },
  reminderPreviewList: { display: "flex", flexDirection: "column", gap: 10, marginTop: 16 },
  reminderPreviewItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: "#f9fafb",
    borderRadius: 10,
    fontSize: 14,
  },
  reminderPreviewDate: {
    fontWeight: 700,
    color: "#6366f1",
    minWidth: 70,
    fontSize: 13,
  },
  savedMsg: { color: "#22c55e", fontWeight: 700, fontSize: 16 },
  schoolRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid #f3f4f6",
    gap: 16,
  },
  schoolRowLeft: { flex: 1 },
  removeBtn: {
    background: "#fef2f2",
    color: "#ef4444",
    border: "2px solid #fecaca",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.2s",
    flexShrink: 0,
  },
  removeBtnConfirm: {
    background: "#ef4444",
    color: "#fff",
    borderColor: "#ef4444",
  },
  summaryGrid: { display: "flex", flexDirection: "column", gap: 10 },
  summaryItem: { display: "flex", alignItems: "center", gap: 12, fontSize: 15 },
  summaryDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0 },
  summaryCount: { color: "#6b7280", marginLeft: "auto" },
};