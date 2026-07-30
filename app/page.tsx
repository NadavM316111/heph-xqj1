"use client";

import { useEffect, useState, useMemo } from "react";
import { COLLEGES, College, DeadlineType } from "@/lib/colleges";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ReminderSettings {
  email: boolean;
  sms: boolean;
  intervals: number[]; // days before deadline
}

interface TrackedDeadline {
  collegeId: string;
  type: DeadlineType;
  reminders: ReminderSettings;
}

interface UserData {
  email: string;
  phone: string;
  trackedDeadlines: TrackedDeadline[];
}

interface AuthState {
  loggedIn: boolean;
  email: string;
}

const DEFAULT_REMINDERS: ReminderSettings = {
  email: true,
  sms: false,
  intervals: [30, 7, 1],
};

const AVAILABLE_INTERVALS = [60, 30, 14, 7, 3, 1];

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  ed: "Early Decision",
  ea: "Early Action",
  rd: "Regular Decision",
  scholarship: "Scholarship",
};

const DEADLINE_COLORS: Record<DeadlineType, string> = {
  ed: "#7c3aed",
  ea: "#0891b2",
  rd: "#059669",
  scholarship: "#d97706",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = parseDate(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countdownLabel(days: number): { text: string; urgent: boolean } {
  if (days < 0) return { text: `${Math.abs(days)}d ago`, urgent: false };
  if (days === 0) return { text: "Today!", urgent: true };
  if (days === 1) return { text: "Tomorrow!", urgent: true };
  if (days <= 7) return { text: `${days} days`, urgent: true };
  return { text: `${days} days`, urgent: false };
}

function loadUserData(): UserData {
  try {
    const raw = localStorage.getItem("edutracker_user");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { email: "", phone: "", trackedDeadlines: [] };
}

function saveUserData(data: UserData) {
  localStorage.setItem("edutracker_user", JSON.stringify(data));
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CountdownBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  const { text, urgent } = countdownLabel(days);
  const past = days < 0;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: past ? "#e5e7eb" : urgent ? "#fef2f2" : "#f0fdf4",
        color: past ? "#9ca3af" : urgent ? "#dc2626" : "#15803d",
        border: `1px solid ${past ? "#d1d5db" : urgent ? "#fca5a5" : "#86efac"}`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function ReminderEditor({
  settings,
  onChange,
}: {
  settings: ReminderSettings;
  onChange: (s: ReminderSettings) => void;
}) {
  function toggleInterval(n: number) {
    const has = settings.intervals.includes(n);
    const next = has
      ? settings.intervals.filter((i) => i !== n)
      : [...settings.intervals, n].sort((a, b) => b - a);
    onChange({ ...settings, intervals: next });
  }

  return (
    <div style={{ fontSize: 13 }}>
      <div style={{ marginBottom: 8, fontWeight: 600, color: "#374151" }}>
        Remind me via:
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={settings.email}
            onChange={(e) => onChange({ ...settings, email: e.target.checked })}
          />
          <span>Email</span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={settings.sms}
            onChange={(e) => onChange({ ...settings, sms: e.target.checked })}
          />
          <span>SMS</span>
        </label>
      </div>
      <div style={{ marginBottom: 6, fontWeight: 600, color: "#374151" }}>
        Days before deadline:
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {AVAILABLE_INTERVALS.map((n) => (
          <button
            key={n}
            onClick={() => toggleInterval(n)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              border: settings.intervals.includes(n)
                ? "2px solid #6366f1"
                : "2px solid #d1d5db",
              background: settings.intervals.includes(n) ? "#eef2ff" : "#fff",
              color: settings.intervals.includes(n) ? "#4338ca" : "#6b7280",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {n}d
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [tab, setTab] = useState<"dashboard" | "search" | "account">("dashboard");
  const [userData, setUserData] = useState<UserData>({
    email: "",
    phone: "",
    trackedDeadlines: [],
  });
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, email: "" });
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<DeadlineType | "all">("all");

  // Modal state
  const [modalCollege, setModalCollege] = useState<College | null>(null);
  const [editingDeadline, setEditingDeadline] = useState<DeadlineType | null>(null);
  const [editReminders, setEditReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);

  // Toast
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const data = loadUserData();
    setUserData(data);
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
    // Try to restore auth
    const storedAuth = localStorage.getItem("edutracker_auth");
    if (storedAuth) {
      try {
        setAuth(JSON.parse(storedAuth));
      } catch {}
    }
  }, []);

  function persistUserData(data: UserData) {
    setUserData(data);
    saveUserData(data);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Auth
  async function handleAuth() {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPass }),
      });
      const json = await res.json();
      if (json.ok) {
        const a = { loggedIn: true, email: json.email };
        setAuth(a);
        localStorage.setItem("edutracker_auth", JSON.stringify(a));
        persistUserData({ ...userData, email: json.email });
        showToast(`Welcome${authMode === "signup" ? ", new user" : " back"}!`);
      } else {
        setAuthError(json.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  function handleLogout() {
    setAuth({ loggedIn: false, email: "" });
    localStorage.removeItem("edutracker_auth");
    showToast("Logged out.");
  }

  // Tracked deadlines helpers
  function isTracked(collegeId: string, type: DeadlineType) {
    return userData.trackedDeadlines.some(
      (d) => d.collegeId === collegeId && d.type === type
    );
  }

  function getTracked(collegeId: string, type: DeadlineType): TrackedDeadline | undefined {
    return userData.trackedDeadlines.find(
      (d) => d.collegeId === collegeId && d.type === type
    );
  }

  function addOrUpdateTracked(collegeId: string, type: DeadlineType, reminders: ReminderSettings) {
    const filtered = userData.trackedDeadlines.filter(
      (d) => !(d.collegeId === collegeId && d.type === type)
    );
    persistUserData({
      ...userData,
      trackedDeadlines: [...filtered, { collegeId, type, reminders }],
    });
  }

  function removeTracked(collegeId: string, type: DeadlineType) {
    persistUserData({
      ...userData,
      trackedDeadlines: userData.trackedDeadlines.filter(
        (d) => !(d.collegeId === collegeId && d.type === type)
      ),
    });
  }

  function openModal(college: College, type: DeadlineType) {
    setModalCollege(college);
    setEditingDeadline(type);
    const existing = getTracked(college.id, type);
    setEditReminders(existing ? { ...existing.reminders } : { ...DEFAULT_REMINDERS });
  }

  function saveModal() {
    if (!modalCollege || !editingDeadline) return;
    addOrUpdateTracked(modalCollege.id, editingDeadline, editReminders);
    showToast(`Tracking ${modalCollege.name} ${DEADLINE_LABELS[editingDeadline]} deadline!`);
    setModalCollege(null);
    setEditingDeadline(null);
  }

  // Dashboard data
  const dashboardItems = useMemo(() => {
    const items: Array<{
      college: College;
      type: DeadlineType;
      dateStr: string;
      reminders: ReminderSettings;
      days: number;
    }> = [];

    for (const td of userData.trackedDeadlines) {
      const college = COLLEGES.find((c) => c.id === td.collegeId);
      if (!college) continue;
      const dateStr = college.deadlines[td.type];
      if (!dateStr) continue;
      items.push({
        college,
        type: td.type,
        dateStr,
        reminders: td.reminders,
        days: daysUntil(dateStr),
      });
    }
    return items.sort((a, b) => a.days - b.days);
  }, [userData.trackedDeadlines]);

  // Search results
  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    return COLLEGES.filter((c) => {
      const matchName = c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
      const hasType = filterType === "all" || !!c.deadlines[filterType];
      return matchName && hasType;
    });
  }, [query, filterType]);

  const upcomingCount = dashboardItems.filter((d) => d.days >= 0 && d.days <= 30).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "#fff",
          padding: "0 24px",
          boxShadow: "0 2px 12px rgba(79,70,229,0.3)",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎓</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.5 }}>Edutracker</div>
              <div style={{ fontSize: 11, opacity: 0.8, marginTop: -2 }}>College Application Deadlines</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {(["dashboard", "search", "account"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: tab === t ? "rgba(255,255,255,0.25)" : "transparent",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                  textTransform: "capitalize",
                }}
              >
                {t === "dashboard" ? "📊 Dashboard" : t === "search" ? "🔍 Schools" : "👤 Account"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        {/* ── DASHBOARD TAB ── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                Your Deadline Dashboard
              </h1>
              <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
                Track your college application deadlines in one place.
              </p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Schools Tracked", value: new Set(userData.trackedDeadlines.map((d) => d.collegeId)).size, icon: "🏫", color: "#4f46e5" },
                { label: "Total Deadlines", value: userData.trackedDeadlines.length, icon: "📅", color: "#0891b2" },
                { label: "Due in 30 Days", value: upcomingCount, icon: "⚡", color: "#dc2626" },
                { label: "Past Deadlines", value: dashboardItems.filter((d) => d.days < 0).length, icon: "✅", color: "#059669" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: "20px 24px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {dashboardItems.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: "60px 40px",
                  textAlign: "center",
                  border: "2px dashed #e5e7eb",
                }}
              >
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎓</div>
                <h2 style={{ color: "#374151", fontWeight: 700, margin: 0 }}>No deadlines tracked yet</h2>
                <p style={{ color: "#9ca3af", marginTop: 8, fontSize: 14 }}>
                  Search for schools and add deadlines to track them here.
                </p>
                <button
                  onClick={() => setTab("search")}
                  style={{
                    marginTop: 20,
                    padding: "12px 28px",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 15,
                  }}
                >
                  Find Schools →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dashboardItems.map((item) => {
                  const past = item.days < 0;
                  const urgent = item.days >= 0 && item.days <= 7;
                  return (
                    <div
                      key={`${item.college.id}-${item.type}`}
                      style={{
                        background: "#fff",
                        borderRadius: 16,
                        padding: "20px 24px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                        border: `1px solid ${urgent ? "#fca5a5" : "#e5e7eb"}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        opacity: past ? 0.6 : 1,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Color indicator */}
                      <div
                        style={{
                          width: 6,
                          height: 56,
                          borderRadius: 4,
                          background: DEADLINE_COLORS[item.type],
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>
                          {item.college.name}
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                          {item.college.location} · {item.college.type}
                        </div>
                      </div>
                      <div style={{ minWidth: 140 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background: DEADLINE_COLORS[item.type] + "22",
                            color: DEADLINE_COLORS[item.type],
                            marginBottom: 4,
                          }}
                        >
                          {DEADLINE_LABELS[item.type]}
                        </span>
                        <div style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>
                          {formatDate(item.dateStr)}
                        </div>
                      </div>
                      <div style={{ minWidth: 100, textAlign: "center" }}>
                        <CountdownBadge dateStr={item.dateStr} />
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                          {item.reminders.email && "📧"} {item.reminders.sms && "📱"}
                          {item.reminders.intervals.join(", ")}d notice
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openModal(item.college, item.type)}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 8,
                            border: "1px solid #d1d5db",
                            background: "#fff",
                            color: "#374151",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            removeTracked(item.college.id, item.type);
                            showToast("Deadline removed.");
                          }}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 8,
                            border: "1px solid #fca5a5",
                            background: "#fff",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SEARCH TAB ── */}
        {tab === "search" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
                Find Your Schools
              </h1>
              <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
                Search from {COLLEGES.length} popular colleges and add deadlines to track.
              </p>
            </div>

            {/* Search bar */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search by school name or location…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  fontSize: 15,
                  outline: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as DeadlineType | "all")}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  background: "#fff",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="all">All deadline types</option>
                <option value="ed">Early Decision</option>
                <option value="ea">Early Action</option>
                <option value="rd">Regular Decision</option>
                <option value="scholarship">Scholarship</option>
              </select>
            </div>

            <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
              Showing {searchResults.length} school{searchResults.length !== 1 ? "s" : ""}
            </div>

            {/* Results grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {searchResults.map((college) => {
                const trackedTypes = (["ed", "ea", "rd", "scholarship"] as DeadlineType[]).filter(
                  (t) => isTracked(college.id, t)
                );
                return (
                  <div
                    key={college.id}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      padding: "20px 24px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      border: trackedTypes.length > 0 ? "1px solid #a5b4fc" : "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1f2937" }}>
                          {college.name}
                        </h3>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                          {college.location} · {college.type}
                          {college.acceptanceRate && (
                            <span> · {college.acceptanceRate}% acceptance</span>
                          )}
                        </div>
                        {trackedTypes.length > 0 && (
                          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {trackedTypes.map((t) => (
                              <span
                                key={t}
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 10,
                                  background: DEADLINE_COLORS[t] + "20",
                                  color: DEADLINE_COLORS[t],
                                }}
                              >
                                ✓ {DEADLINE_LABELS[t]}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deadline buttons */}
                    <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
                      {(["ed", "ea", "rd", "scholarship"] as DeadlineType[]).map((type) => {
                        const dateStr = college.deadlines[type];
                        if (!dateStr) return null;
                        const tracked = isTracked(college.id, type);
                        const days = daysUntil(dateStr);
                        const past = days < 0;
                        return (
                          <button
                            key={type}
                            onClick={() => openModal(college, type)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                              padding: "10px 14px",
                              borderRadius: 12,
                              border: tracked
                                ? `2px solid ${DEADLINE_COLORS[type]}`
                                : "1px solid #e5e7eb",
                              background: tracked ? DEADLINE_COLORS[type] + "12" : "#f9fafb",
                              cursor: "pointer",
                              minWidth: 140,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: DEADLINE_COLORS[type],
                                textTransform: "uppercase",
                                letterSpacing: 0.5,
                              }}
                            >
                              {tracked ? "✓ " : "+ "}{DEADLINE_LABELS[type]}
                            </span>
                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 600, marginTop: 2 }}>
                              {formatDate(dateStr)}
                            </span>
                            <span style={{ fontSize: 11, color: past ? "#9ca3af" : days <= 30 ? "#dc2626" : "#6b7280", marginTop: 1 }}>
                              {past ? "Passed" : `${days} days away`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === "account" && (
          <div style={{ maxWidth: 480 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e1b4b", margin: 0, marginBottom: 24 }}>
              Account
            </h1>

            {auth.loggedIn ? (
              <div>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid #e5e7eb",
                    marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Logged in as</div>
                  <div style={{ fontWeight: 700, color: "#1f2937", fontSize: 16 }}>{auth.email}</div>
                  <button
                    onClick={handleLogout}
                    style={{
                      marginTop: 16,
                      padding: "10px 20px",
                      borderRadius: 10,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      color: "#374151",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    Log Out
                  </button>
                </div>

                {/* Notification settings */}
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    padding: 24,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
                    Notification Settings
                  </h2>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Email address
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => persistUserData({ ...userData, email: e.target.value })}
                      placeholder="your@email.com"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Phone number (for SMS)
                    </label>
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => persistUserData({ ...userData, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      padding: "12px 16px",
                      background: "#fef9c3",
                      borderRadius: 10,
                      fontSize: 13,
                      color: "#854d0e",
                      border: "1px solid #fef08a",
                    }}
                  >
                    📬 Reminder emails and SMS will be sent based on your per-deadline settings. Configure them when adding a deadline.
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 32,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                }}
              >
                <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                  {(["login", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAuthMode(m)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 10,
                        border: "none",
                        background: authMode === m ? "#4f46e5" : "#f3f4f6",
                        color: authMode === m ? "#fff" : "#6b7280",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontSize: 14,
                        textTransform: "capitalize",
                      }}
                    >
                      {m === "login" ? "Log In" : "Sign Up"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={authPass}
                      onChange={(e) => setAuthPass(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #d1d5db",
                        fontSize: 14,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  {authError && (
                    <div style={{ color: "#dc2626", fontSize: 13, fontWeight: 500 }}>{authError}</div>
                  )}
                  <button
                    onClick={handleAuth}
                    disabled={authLoading}
                    style={{
                      padding: "12px",
                      borderRadius: 10,
                      border: "none",
                      background: authLoading ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: authLoading ? "default" : "pointer",
                    }}
                  >
                    {authLoading ? "…" : authMode === "login" ? "Log In" : "Create Account"}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 16, marginBottom: 0 }}>
                  Your deadline data is saved locally. Sign in to sync across devices.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── MODAL ── */}
      {modalCollege && editingDeadline && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 24,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setModalCollege(null);
              setEditingDeadline(null);
            }
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 32,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "3px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  background: DEADLINE_COLORS[editingDeadline] + "20",
                  color: DEADLINE_COLORS[editingDeadline],
                  marginBottom: 8,
                }}
              >
                {DEADLINE_LABELS[editingDeadline]}
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#1f2937" }}>
                {modalCollege.name}
              </h2>
              <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 14 }}>
                📅 Deadline: {formatDate(modalCollege.deadlines[editingDeadline]!)} —{" "}
                <strong style={{ color: "#374151" }}>
                  {daysUntil(modalCollege.deadlines[editingDeadline]!)} days away
                </strong>
              </p>
            </div>

            <ReminderEditor settings={editReminders} onChange={setEditReminders} />

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {isTracked(modalCollege.id, editingDeadline) && (
                <button
                  onClick={() => {
                    removeTracked(modalCollege.id, editingDeadline);
                    showToast("Deadline removed.");
                    setModalCollege(null);
                    setEditingDeadline(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: 10,
                    border: "1px solid #fca5a5",
                    background: "#fff",
                    color: "#dc2626",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => {
                  setModalCollege(null);
                  setEditingDeadline(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#374151",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveModal}
                style={{
                  flex: 2,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {isTracked(modalCollege.id, editingDeadline) ? "Update Reminders" : "Track Deadline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1f2937",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 2000,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}