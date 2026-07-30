"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College, DeadlineType } from "@/lib/colleges";

interface User {
  email: string;
}

interface DeadlineItem {
  college: College;
  type: DeadlineType;
  label: string;
  date: string;
  daysRemaining: number;
}

type Step = "loading" | "auth" | "onboarding" | "dashboard";

function getDaysRemaining(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f97316";
  if (days <= 60) return "#eab308";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 30) return "#fff7ed";
  if (days <= 60) return "#fefce8";
  return "#f0fdf4";
}

function urgencyBadge(days: number): string {
  if (days < 0) return "Passed";
  if (days === 0) return "TODAY";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d left`;
  if (days <= 30) return `${days}d left`;
  if (days <= 60) return `${days}d left`;
  return `${days}d left`;
}

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  ea: "Early Action",
  ed: "Early Decision",
  ed2: "Early Decision II",
  rd: "Regular Decision",
  scholarship: "Scholarship",
};

export default function Home() {
  const [step, setStep] = useState<Step>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("All");

  const [activeFilter, setActiveFilter] = useState<"all" | DeadlineType>("all");
  const [showPassed, setShowPassed] = useState(false);
  const [dashSearch, setDashSearch] = useState("");

  // Track page view
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        setUser(u);
        const savedIds = localStorage.getItem(`edutracker_schools_${u.email}`);
        if (savedIds) {
          const ids = JSON.parse(savedIds) as string[];
          if (ids.length > 0) {
            setSelectedIds(new Set(ids));
            setStep("dashboard");
            return;
          }
        }
        setStep("onboarding");
      } catch {
        setStep("auth");
      }
    } else {
      setStep("auth");
    }
  }, []);

  const saveSchools = useCallback((u: User, ids: Set<string>) => {
    localStorage.setItem(`edutracker_schools_${u.email}`, JSON.stringify(Array.from(ids)));
  }, []);

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
        const u: User = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
        const savedIds = localStorage.getItem(`edutracker_schools_${u.email}`);
        if (savedIds) {
          const ids = JSON.parse(savedIds) as string[];
          if (ids.length > 0) {
            setSelectedIds(new Set(ids));
            setStep("dashboard");
            return;
          }
        }
        setStep("onboarding");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("edutracker_user");
    setUser(null);
    setSelectedIds(new Set());
    setEmail("");
    setPassword("");
    setStep("auth");
  }

  function toggleSchool(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleOnboardingDone() {
    if (!user) return;
    saveSchools(user, selectedIds);
    setStep("dashboard");
  }

  function handleSaveSchools() {
    if (!user) return;
    saveSchools(user, selectedIds);
  }

  // Compute deadlines
  function computeDeadlines(): DeadlineItem[] {
    const items: DeadlineItem[] = [];
    for (const college of COLLEGES) {
      if (!selectedIds.has(college.id)) continue;
      const types: DeadlineType[] = ["ea", "ed", "ed2", "rd", "scholarship"];
      for (const t of types) {
        const date = college.deadlines[t];
        if (!date) continue;
        items.push({
          college,
          type: t,
          label: DEADLINE_LABELS[t],
          date,
          daysRemaining: getDaysRemaining(date),
        });
      }
    }
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return items;
  }

  const allDeadlines = computeDeadlines();

  const regions = ["All", ...Array.from(new Set(COLLEGES.map((c) => c.region))).sort()];

  const filteredColleges = COLLEGES.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchRegion = filterRegion === "All" || c.region === filterRegion;
    return matchSearch && matchRegion;
  });

  const filteredDeadlines = allDeadlines.filter((d) => {
    if (!showPassed && d.daysRemaining < 0) return false;
    if (activeFilter !== "all" && d.type !== activeFilter) return false;
    if (
      dashSearch &&
      !d.college.name.toLowerCase().includes(dashSearch.toLowerCase())
    )
      return false;
    return true;
  });

  const nextDeadline = allDeadlines.find((d) => d.daysRemaining >= 0);
  const selectedColleges = COLLEGES.filter((c) => selectedIds.has(c.id));

  // ── LOADING ──────────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div style={styles.centered}>
        <div style={styles.spinner} />
        <p style={{ color: "#6b7280", marginTop: 16 }}>Loading Edutracker…</p>
      </div>
    );
  }

  // ── AUTH ─────────────────────────────────────────────────────────────────
  if (step === "auth") {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🎓</span>
            <h1 style={styles.logoText}>Edutracker</h1>
            <p style={styles.logoSub}>Never miss a college deadline</p>
          </div>
          <div style={styles.tabRow}>
            <button
              style={authMode === "login" ? styles.tabActive : styles.tabInactive}
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
            >
              Log In
            </button>
            <button
              style={authMode === "signup" ? styles.tabActive : styles.tabInactive}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            />
            {authError && <p style={styles.errorText}>{authError}</p>}
            <button type="submit" style={styles.primaryBtn} disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
          <p style={styles.authSwitch}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              style={styles.linkBtn}
              onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
            >
              {authMode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── ONBOARDING ───────────────────────────────────────────────────────────
  if (step === "onboarding") {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.headerTitle}>Edutracker</span>
            <span style={{ flex: 1 }} />
            <span style={styles.userBadge}>{user?.email}</span>
            <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <div style={styles.onboardingBody}>
          <div style={styles.onboardingHeader}>
            <h2 style={styles.onboardingTitle}>Select Your Target Schools</h2>
            <p style={styles.onboardingDesc}>
              Pick the colleges you&apos;re applying to. We&apos;ll track their deadlines for you.
            </p>
            <div style={styles.selectedCount}>
              {selectedIds.size} school{selectedIds.size !== 1 ? "s" : ""} selected
            </div>
          </div>

          <div style={styles.filterRow}>
            <input
              type="text"
              placeholder="Search schools or locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              style={styles.select}
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div style={styles.collegeGrid}>
            {filteredColleges.map((college) => {
              const selected = selectedIds.has(college.id);
              return (
                <button
                  key={college.id}
                  onClick={() => toggleSchool(college.id)}
                  style={{
                    ...styles.collegeCard,
                    borderColor: selected ? "#4f46e5" : "#e5e7eb",
                    background: selected ? "#eef2ff" : "#fff",
                  }}
                >
                  <div style={styles.collegeCardTop}>
                    <span style={styles.collegeName}>{college.name}</span>
                    {selected && <span style={styles.checkMark}>✓</span>}
                  </div>
                  <span style={styles.collegeLocation}>{college.location} · {college.region}</span>
                  <div style={styles.deadlinePills}>
                    {college.deadlines.ea && <span style={{ ...styles.pill, background: "#dbeafe", color: "#1d4ed8" }}>EA</span>}
                    {college.deadlines.ed && <span style={{ ...styles.pill, background: "#ede9fe", color: "#6d28d9" }}>ED</span>}
                    {college.deadlines.ed2 && <span style={{ ...styles.pill, background: "#fce7f3", color: "#9d174d" }}>ED2</span>}
                    {college.deadlines.rd && <span style={{ ...styles.pill, background: "#dcfce7", color: "#15803d" }}>RD</span>}
                    {college.deadlines.scholarship && <span style={{ ...styles.pill, background: "#fef9c3", color: "#854d0e" }}>$</span>}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={styles.onboardingFooter}>
            <button
              style={{
                ...styles.primaryBtn,
                opacity: selectedIds.size === 0 ? 0.5 : 1,
                cursor: selectedIds.size === 0 ? "not-allowed" : "pointer",
                maxWidth: 320,
                margin: "0 auto",
              }}
              disabled={selectedIds.size === 0}
              onClick={handleOnboardingDone}
            >
              View My Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logoIcon}>🎓</span>
          <span style={styles.headerTitle}>Edutracker</span>
          <span style={{ flex: 1 }} />
          <span style={styles.userBadge}>{user?.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <div style={styles.dashBody}>
        {/* Summary cards */}
        <div style={styles.summaryRow}>
          <div style={styles.summaryCard}>
            <span style={styles.summaryNum}>{selectedIds.size}</span>
            <span style={styles.summaryLabel}>Schools Tracked</span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryNum}>{allDeadlines.filter((d) => d.daysRemaining >= 0).length}</span>
            <span style={styles.summaryLabel}>Upcoming Deadlines</span>
          </div>
          <div style={{ ...styles.summaryCard, borderColor: nextDeadline ? urgencyColor(nextDeadline.daysRemaining) : "#e5e7eb" }}>
            <span style={{ ...styles.summaryNum, color: nextDeadline ? urgencyColor(nextDeadline.daysRemaining) : "#6b7280" }}>
              {nextDeadline ? `${nextDeadline.daysRemaining}d` : "—"}
            </span>
            <span style={styles.summaryLabel}>
              {nextDeadline ? `Until ${nextDeadline.college.name.split(" ").slice(0, 2).join(" ")} ${nextDeadline.label}` : "No upcoming deadlines"}
            </span>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryNum}>{allDeadlines.filter((d) => d.daysRemaining < 0).length}</span>
            <span style={styles.summaryLabel}>Passed</span>
          </div>
        </div>

        <div style={styles.dashMain}>
          {/* Left: deadline list */}
          <div style={styles.deadlinePanel}>
            <div style={styles.deadlinePanelHeader}>
              <h2 style={styles.panelTitle}>Deadlines</h2>
              <input
                type="text"
                placeholder="Filter schools…"
                value={dashSearch}
                onChange={(e) => setDashSearch(e.target.value)}
                style={{ ...styles.searchInput, maxWidth: 200, fontSize: 13 }}
              />
            </div>

            <div style={styles.filterChips}>
              {(["all", "ea", "ed", "ed2", "rd", "scholarship"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  style={{
                    ...styles.chip,
                    background: activeFilter === f ? "#4f46e5" : "#f3f4f6",
                    color: activeFilter === f ? "#fff" : "#374151",
                  }}
                >
                  {f === "all" ? "All" : DEADLINE_LABELS[f]}
                </button>
              ))}
              <button
                onClick={() => setShowPassed(!showPassed)}
                style={{
                  ...styles.chip,
                  background: showPassed ? "#6b7280" : "#f3f4f6",
                  color: showPassed ? "#fff" : "#374151",
                  marginLeft: "auto",
                }}
              >
                {showPassed ? "Hide Passed" : "Show Passed"}
              </button>
            </div>

            <div style={styles.deadlineList}>
              {filteredDeadlines.length === 0 && (
                <div style={styles.emptyState}>
                  <span style={{ fontSize: 40 }}>📭</span>
                  <p>No deadlines match your filters.</p>
                </div>
              )}
              {filteredDeadlines.map((d, i) => (
                <div
                  key={`${d.college.id}-${d.type}`}
                  style={{
                    ...styles.deadlineItem,
                    background: urgencyBg(d.daysRemaining),
                    borderLeftColor: urgencyColor(d.daysRemaining),
                    opacity: d.daysRemaining < 0 ? 0.65 : 1,
                  }}
                >
                  <div style={styles.deadlineLeft}>
                    <span style={styles.deadlineRank}>#{i + 1}</span>
                    <div>
                      <div style={styles.deadlineCollegeName}>{d.college.name}</div>
                      <div style={styles.deadlineTypeName}>{d.label}</div>
                      <div style={styles.deadlineDateStr}>{formatDate(d.date)}</div>
                    </div>
                  </div>
                  <div style={styles.deadlineRight}>
                    <span
                      style={{
                        ...styles.urgencyBadge,
                        background: urgencyColor(d.daysRemaining),
                      }}
                    >
                      {urgencyBadge(d.daysRemaining)}
                    </span>
                    <span style={styles.deadlineLocation}>{d.college.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: school manager */}
          <div style={styles.schoolPanel}>
            <div style={styles.deadlinePanelHeader}>
              <h2 style={styles.panelTitle}>My Schools</h2>
              <button
                style={{ ...styles.chip, background: "#4f46e5", color: "#fff", fontSize: 12 }}
                onClick={() => setStep("onboarding")}
              >
                + Edit Schools
              </button>
            </div>
            <div style={styles.schoolList}>
              {selectedColleges.length === 0 && (
                <div style={styles.emptyState}>
                  <span style={{ fontSize: 40 }}>🏫</span>
                  <p>No schools selected.</p>
                </div>
              )}
              {selectedColleges.map((c) => {
                const upcoming = allDeadlines.filter(
                  (d) => d.college.id === c.id && d.daysRemaining >= 0
                );
                const next = upcoming[0];
                return (
                  <div key={c.id} style={styles.schoolItem}>
                    <div style={styles.schoolItemTop}>
                      <span style={styles.schoolItemName}>{c.name}</span>
                      <button
                        style={styles.removeBtn}
                        onClick={() => {
                          setSelectedIds((prev) => {
                            const next2 = new Set(prev);
                            next2.delete(c.id);
                            if (user) saveSchools(user, next2);
                            return next2;
                          });
                        }}
                        title="Remove school"
                      >
                        ×
                      </button>
                    </div>
                    <span style={styles.schoolItemLoc}>{c.location}</span>
                    {next && (
                      <span
                        style={{
                          ...styles.schoolNextDeadline,
                          color: urgencyColor(next.daysRemaining),
                        }}
                      >
                        Next: {next.label} — {urgencyBadge(next.daysRemaining)}
                      </span>
                    )}
                    <div style={styles.deadlinePills}>
                      {c.deadlines.ea && <span style={{ ...styles.pill, background: "#dbeafe", color: "#1d4ed8" }}>EA</span>}
                      {c.deadlines.ed && <span style={{ ...styles.pill, background: "#ede9fe", color: "#6d28d9" }}>ED</span>}
                      {c.deadlines.ed2 && <span style={{ ...styles.pill, background: "#fce7f3", color: "#9d174d" }}>ED2</span>}
                      {c.deadlines.rd && <span style={{ ...styles.pill, background: "#dcfce7", color: "#15803d" }}>RD</span>}
                      {c.deadlines.scholarship && <span style={{ ...styles.pill, background: "#fef9c3", color: "#854d0e" }}>$</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {user && selectedIds.size > 0 && (
              <button style={{ ...styles.primaryBtn, marginTop: 12, fontSize: 13 }} onClick={handleSaveSchools}>
                💾 Save School List
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif" },
  centered: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
  spinner: { width: 40, height: 40, border: "4px solid #e5e7eb", borderTopColor: "#4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite" },

  // Auth
  authPage: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16, fontFamily: "system-ui, sans-serif" },
  authCard: { background: "#fff", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  logoArea: { textAlign: "center", marginBottom: 28 },
  logoIcon: { fontSize: 48 },
  logoText: { margin: "8px 0 4px", fontSize: 28, fontWeight: 800, color: "#1e1b4b" },
  logoSub: { margin: 0, color: "#6b7280", fontSize: 14 },
  tabRow: { display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", marginBottom: 24 },
  tabActive: { flex: 1, padding: "10px 0", border: "none", background: "#4f46e5", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  tabInactive: { flex: 1, padding: "10px 0", border: "none", background: "#fff", color: "#6b7280", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontWeight: 600, fontSize: 13, color: "#374151" },
  input: { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", transition: "border-color 0.2s" },
  primaryBtn: { padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer", width: "100%", marginTop: 8, transition: "opacity 0.2s" },
  errorText: { color: "#ef4444", fontSize: 13, margin: "4px 0" },
  authSwitch: { textAlign: "center", marginTop: 16, fontSize: 13, color: "#6b7280" },
  linkBtn: { background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13 },

  // Header
  header: { background: "#fff", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 100 },
  headerInner: { maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", gap: 12 },
  headerTitle: { fontWeight: 800, fontSize: 20, color: "#1e1b4b" },
  userBadge: { fontSize: 13, color: "#6b7280", background: "#f3f4f6", padding: "4px 12px", borderRadius: 20 },
  logoutBtn: { background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontSize: 13 },

  // Onboarding
  onboardingBody: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px" },
  onboardingHeader: { textAlign: "center", marginBottom: 28 },
  onboardingTitle: { fontSize: 28, fontWeight: 800, color: "#1e1b4b", margin: "0 0 8px" },
  onboardingDesc: { color: "#6b7280", fontSize: 15, margin: "0 0 12px" },
  selectedCount: { display: "inline-block", background: "#eef2ff", color: "#4f46e5", padding: "4px 16px", borderRadius: 20, fontWeight: 700, fontSize: 14 },
  filterRow: { display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" },
  select: { padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff", cursor: "pointer" },
  collegeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 },
  collegeCard: { border: "2px solid #e5e7eb", borderRadius: 10, padding: 14, cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 6, background: "#fff" },
  collegeCardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between" },
  collegeName: { fontWeight: 700, fontSize: 14, color: "#1f2937", lineHeight: 1.3 },
  checkMark: { color: "#4f46e5", fontWeight: 900, fontSize: 16, flexShrink: 0 },
  collegeLocation: { fontSize: 12, color: "#9ca3af" },
  deadlinePills: { display: "flex", gap: 4, flexWrap: "wrap" },
  pill: { padding: "2px 7px", borderRadius: 12, fontSize: 11, fontWeight: 700 },
  onboardingFooter: { marginTop: 32, display: "flex", justifyContent: "center" },

  // Dashboard
  dashBody: { maxWidth: 1280, margin: "0 auto", padding: "24px 24px" },
  summaryRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 },
  summaryCard: { background: "#fff", border: "2px solid #e5e7eb", borderRadius: 12, padding: "20px 24px", textAlign: "center" },
  summaryNum: { display: "block", fontSize: 36, fontWeight: 900, color: "#1e1b4b" },
  summaryLabel: { display: "block", fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 },
  dashMain: { display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" },
  deadlinePanel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" },
  deadlinePanelHeader: { padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  panelTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1b4b", flex: 1 },
  filterChips: { display: "flex", gap: 8, padding: "12px 20px", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", alignItems: "center" },
  chip: { padding: "5px 12px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" },
  deadlineList: { maxHeight: "70vh", overflowY: "auto" },
  deadlineItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderLeft: "4px solid transparent", borderBottom: "1px solid #f3f4f6", transition: "background 0.2s" },
  deadlineLeft: { display: "flex", alignItems: "center", gap: 12 },
  deadlineRank: { fontSize: 11, color: "#9ca3af", fontWeight: 700, width: 24, textAlign: "right", flexShrink: 0 },
  deadlineCollegeName: { fontWeight: 700, fontSize: 15, color: "#1f2937" },
  deadlineTypeName: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  deadlineDateStr: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  deadlineRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 },
  urgencyBadge: { padding: "4px 10px", borderRadius: 20, color: "#fff", fontSize: 12, fontWeight: 800 },
  deadlineLocation: { fontSize: 11, color: "#9ca3af" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", color: "#9ca3af", gap: 8 },

  // School panel
  schoolPanel: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", padding: "0 0 16px" },
  schoolList: { maxHeight: "60vh", overflowY: "auto", padding: "0 16px" },
  schoolItem: { padding: "14px 0", borderBottom: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: 4 },
  schoolItemTop: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  schoolItemName: { fontWeight: 700, fontSize: 14, color: "#1f2937" },
  schoolItemLoc: { fontSize: 12, color: "#9ca3af" },
  schoolNextDeadline: { fontSize: 12, fontWeight: 700 },
  removeBtn: { background: "none", border: "1px solid #e5e7eb", color: "#9ca3af", width: 24, height: 24, borderRadius: 4, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0, lineHeight: 1 },
};