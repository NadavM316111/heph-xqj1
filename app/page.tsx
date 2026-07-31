"use client";

import { useEffect, useState, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────
interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: {
    EA?: string;
    ED?: string;
    ED2?: string;
    RD: string;
    FA?: string; // Financial Aid
  };
  acceptanceRate?: string;
}

interface Deadline {
  collegeId: string;
  collegeName: string;
  type: string;
  date: string;
  label: string;
}

interface ReminderSettings {
  email: string;
  phone: string;
  reminders: {
    days30: boolean;
    days14: boolean;
    days7: boolean;
    days1: boolean;
  };
  emailEnabled: boolean;
  smsEnabled: boolean;
}

interface UserState {
  email: string;
  loggedIn: boolean;
  onboarded: boolean;
  selectedCollegeIds: string[];
  reminderSettings: ReminderSettings;
}

// ── Static College Data ────────────────────────────────────────────────────
import { COLLEGES } from "@/lib/colleges";

// ── Helpers ────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
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

function getDeadlineTypeColor(type: string): string {
  switch (type) {
    case "EA": return "#6366f1";
    case "ED": return "#ec4899";
    case "ED2": return "#8b5cf6";
    case "RD": return "#3b82f6";
    case "FA": return "#10b981";
    default: return "#6b7280";
  }
}

function getDeadlineLabel(type: string): string {
  switch (type) {
    case "EA": return "Early Action";
    case "ED": return "Early Decision";
    case "ED2": return "Early Decision II";
    case "RD": return "Regular Decision";
    case "FA": return "Financial Aid";
    default: return type;
  }
}

const DEFAULT_REMINDERS: ReminderSettings = {
  email: "",
  phone: "",
  reminders: { days30: true, days14: true, days7: true, days1: true },
  emailEnabled: true,
  smsEnabled: false,
};

const DEFAULT_USER: UserState = {
  email: "",
  loggedIn: false,
  onboarded: false,
  selectedCollegeIds: [],
  reminderSettings: DEFAULT_REMINDERS,
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser] = useState<UserState>(DEFAULT_USER);
  const [step, setStep] = useState<"auth" | "select" | "reminders" | "dashboard">("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reminders, setReminders] = useState<ReminderSettings>(DEFAULT_REMINDERS);
  const [saveMsg, setSaveMsg] = useState("");
  const [dashFilter, setDashFilter] = useState<string>("all");
  const [now, setNow] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Tick every minute for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("edutracker_user");
      if (saved) {
        const parsed: UserState = JSON.parse(saved);
        setUser(parsed);
        setSelectedIds(parsed.selectedCollegeIds || []);
        setReminders(parsed.reminderSettings || DEFAULT_REMINDERS);
        setStep(parsed.onboarded ? "dashboard" : parsed.loggedIn ? "select" : "auth");
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const saveUser = useCallback((u: UserState) => {
    localStorage.setItem("edutracker_user", JSON.stringify(u));
    setUser(u);
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleAuth(e: React.FormEvent) {
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
      } else {
        const newUser: UserState = {
          ...user,
          email: data.email,
          loggedIn: true,
          reminderSettings: { ...user.reminderSettings, email: data.email },
        };
        saveUser(newUser);
        setReminders((r) => ({ ...r, email: data.email }));
        setStep("select");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  // ── School Selection ──────────────────────────────────────────────────────
  function toggleCollege(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function proceedToReminders() {
    if (selectedIds.length === 0) return;
    setStep("reminders");
  }

  // ── Reminders ─────────────────────────────────────────────────────────────
  function saveReminders() {
    const newUser: UserState = {
      ...user,
      selectedCollegeIds: selectedIds,
      reminderSettings: reminders,
      onboarded: true,
    };
    saveUser(newUser);
    setStep("dashboard");
    setSaveMsg("Settings saved!");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  function getAllDeadlines(): Deadline[] {
    const list: Deadline[] = [];
    const colleges = COLLEGES.filter((c) => user.selectedCollegeIds.includes(c.id));
    for (const college of colleges) {
      const dl = college.deadlines;
      const entries: [string, string | undefined][] = [
        ["EA", dl.EA],
        ["ED", dl.ED],
        ["ED2", dl.ED2],
        ["RD", dl.RD],
        ["FA", dl.FA],
      ];
      for (const [type, date] of entries) {
        if (date) {
          list.push({
            collegeId: college.id,
            collegeName: college.name,
            type,
            date,
            label: getDeadlineLabel(type),
          });
        }
      }
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function logout() {
    localStorage.removeItem("edutracker_user");
    setUser(DEFAULT_USER);
    setSelectedIds([]);
    setReminders(DEFAULT_REMINDERS);
    setStep("auth");
    setAuthEmail("");
    setAuthPassword("");
  }

  function updateSettings() {
    const newUser: UserState = {
      ...user,
      selectedCollegeIds: selectedIds,
      reminderSettings: reminders,
    };
    saveUser(newUser);
    setSaveMsg("Saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  }

  // ── Filtered colleges for selection ───────────────────────────────────────
  const filteredColleges = COLLEGES.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchType;
  });

  // ── Deadline list for dashboard ───────────────────────────────────────────
  const allDeadlines = getAllDeadlines();
  const filteredDeadlines = allDeadlines
    .filter((d) => {
      if (dashFilter !== "all" && d.type !== dashFilter) return false;
      const days = daysUntil(d.date);
      if (activeTab === "upcoming") return days >= 0;
      return days < 0;
    });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        color: "white",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        boxShadow: "0 2px 12px rgba(30,64,175,0.3)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Edutracker</span>
          <span style={{ fontSize: 12, opacity: 0.75, marginLeft: 4, paddingTop: 2 }}>College Deadline Tracker</span>
        </div>
        {user.loggedIn && (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>{user.email}</span>
            {step === "dashboard" && (
              <button
                onClick={() => setStep("select")}
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
              >
                Edit Schools
              </button>
            )}
            <button
              onClick={logout}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 16px" }}>
        {/* ── Auth Step ────────────────────────────────────────────────────── */}
        {step === "auth" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", margin: "0 0 12px" }}>
                Never Miss a Deadline
              </h1>
              <p style={{ fontSize: 18, color: "#64748b", maxWidth: 480, margin: "0 auto" }}>
                Track every college application deadline and get timely reminders so you can focus on writing your essays.
              </p>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
                {["80+ Top Colleges", "EA/ED/RD Deadlines", "SMS & Email Alerts", "Free Forever"].map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 6, color: "#1e40af", fontSize: 14, fontWeight: 600 }}>
                    <span style={{ color: "#22c55e", fontSize: 16 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 20, padding: "40px", width: "100%", maxWidth: 420, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
                {(["signup", "login"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setAuthMode(m); setAuthError(""); }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: 10,
                      border: "none",
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      background: authMode === m ? "#1e40af" : "#f1f5f9",
                      color: authMode === m ? "white" : "#64748b",
                      transition: "all 0.2s",
                    }}
                  >
                    {m === "signup" ? "Create Account" : "Sign In"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@school.edu"
                    required
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #e2e8f0", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                {authError && (
                  <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14 }}>
                    {authError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: authLoading ? "not-allowed" : "pointer",
                    opacity: authLoading ? 0.7 : 1,
                    marginTop: 4,
                  }}
                >
                  {authLoading ? "Loading…" : authMode === "signup" ? "Get Started →" : "Sign In →"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── School Selection Step ─────────────────────────────────────────── */}
        {step === "select" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>1</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Select Your Target Schools</h2>
              </div>
              <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 0 48px" }}>
                Choose the colleges you're applying to. You can add or remove schools at any time.
              </p>
            </div>

            {/* Search & Filter */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍  Search colleges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, minWidth: 200, padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 15, outline: "none" }}
              />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, outline: "none", background: "white", cursor: "pointer" }}
              >
                <option value="all">All Types</option>
                <option value="Private">Private</option>
                <option value="Public">Public</option>
                <option value="Liberal Arts">Liberal Arts</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ color: "#64748b", fontSize: 14 }}>
                {filteredColleges.length} schools shown · <strong style={{ color: "#1e40af" }}>{selectedIds.length} selected</strong>
              </span>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setSelectedIds([])}
                  style={{ fontSize: 13, color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* College Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 32 }}>
              {filteredColleges.map((college) => {
                const selected = selectedIds.includes(college.id);
                return (
                  <div
                    key={college.id}
                    onClick={() => toggleCollege(college.id)}
                    style={{
                      background: selected ? "#eff6ff" : "white",
                      border: `2px solid ${selected ? "#3b82f6" : "#e2e8f0"}`,
                      borderRadius: 14,
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      position: "relative",
                    }}
                  >
                    {selected && (
                      <div style={{
                        position: "absolute", top: 10, right: 10,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "#3b82f6", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>✓</div>
                    )}
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4, paddingRight: 28 }}>{college.name}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10 }}>{college.location}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {Object.entries(college.deadlines).map(([type, date]) =>
                        date ? (
                          <span
                            key={type}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: getDeadlineTypeColor(type) + "18",
                              color: getDeadlineTypeColor(type),
                            }}
                          >
                            {type}: {formatDate(date as string)}
                          </span>
                        ) : null
                      )}
                    </div>
                    {college.acceptanceRate && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                        Acceptance rate: {college.acceptanceRate}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ position: "sticky", bottom: 24, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={proceedToReminders}
                disabled={selectedIds.length === 0}
                style={{
                  background: selectedIds.length > 0 ? "linear-gradient(135deg, #1e40af, #3b82f6)" : "#e2e8f0",
                  color: selectedIds.length > 0 ? "white" : "#94a3b8",
                  border: "none",
                  borderRadius: 14,
                  padding: "16px 40px",
                  fontSize: 17,
                  fontWeight: 700,
                  cursor: selectedIds.length > 0 ? "pointer" : "not-allowed",
                  boxShadow: selectedIds.length > 0 ? "0 4px 20px rgba(30,64,175,0.3)" : "none",
                  transition: "all 0.2s",
                }}
              >
                Continue with {selectedIds.length} school{selectedIds.length !== 1 ? "s" : ""} →
              </button>
            </div>
          </div>
        )}

        {/* ── Reminders Step ───────────────────────────────────────────────── */}
        {step === "reminders" && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e40af", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 }}>2</div>
                <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Set Up Reminders</h2>
              </div>
              <p style={{ color: "#64748b", fontSize: 15, margin: "0 0 0 48px" }}>
                We'll send you reminders before each deadline so you never miss a submission window.
              </p>
            </div>

            <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}>
              {/* Reminder windows */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
                  📅 Remind me before each deadline
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {([
                    { key: "days30", label: "30 days before", icon: "🟢" },
                    { key: "days14", label: "14 days before", icon: "🟡" },
                    { key: "days7", label: "7 days before", icon: "🟠" },
                    { key: "days1", label: "1 day before", icon: "🔴" },
                  ] as const).map(({ key, label, icon }) => (
                    <label
                      key={key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 16px",
                        borderRadius: 12,
                        border: `2px solid ${reminders.reminders[key] ? "#3b82f6" : "#e2e8f0"}`,
                        background: reminders.reminders[key] ? "#eff6ff" : "#f8fafc",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={reminders.reminders[key]}
                        onChange={(e) =>
                          setReminders((r) => ({ ...r, reminders: { ...r.reminders, [key]: e.target.checked } }))
                        }
                        style={{ width: 18, height: 18, accentColor: "#3b82f6", cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{icon} {label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>📧 Email Reminders</h3>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>Enable</span>
                    <input
                      type="checkbox"
                      checked={reminders.emailEnabled}
                      onChange={(e) => setReminders((r) => ({ ...r, emailEnabled: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "#3b82f6", cursor: "pointer" }}
                    />
                  </label>
                </div>
                <input
                  type="email"
                  value={reminders.email}
                  onChange={(e) => setReminders((r) => ({ ...r, email: e.target.value }))}
                  placeholder="your@email.com"
                  disabled={!reminders.emailEnabled}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "2px solid #e2e8f0",
                    fontSize: 15,
                    outline: "none",
                    background: reminders.emailEnabled ? "white" : "#f1f5f9",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* SMS */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>📱 SMS Reminders</h3>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>Enable</span>
                    <input
                      type="checkbox"
                      checked={reminders.smsEnabled}
                      onChange={(e) => setReminders((r) => ({ ...r, smsEnabled: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "#3b82f6", cursor: "pointer" }}
                    />
                  </label>
                </div>
                <input
                  type="tel"
                  value={reminders.phone}
                  onChange={(e) => setReminders((r) => ({ ...r, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  disabled={!reminders.smsEnabled}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "2px solid #e2e8f0",
                    fontSize: 15,
                    outline: "none",
                    background: reminders.smsEnabled ? "white" : "#f1f5f9",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>
                  SMS reminders are saved for future notification delivery.
                </p>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setStep("select")}
                  style={{ flex: 1, padding: "14px", borderRadius: 12, border: "2px solid #e2e8f0", background: "white", fontSize: 15, fontWeight: 600, cursor: "pointer", color: "#64748b" }}
                >
                  ← Back
                </button>
                <button
                  onClick={saveReminders}
                  style={{
                    flex: 2,
                    background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    padding: "14px",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(30,64,175,0.3)",
                  }}
                >
                  Launch My Dashboard 🚀
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Dashboard Step ────────────────────────────────────────────────── */}
        {step === "dashboard" && (
          <div>
            {saveMsg && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px", color: "#166534", marginBottom: 20, fontWeight: 600, fontSize: 14 }}>
                ✓ {saveMsg}
              </div>
            )}

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Schools Tracked", value: user.selectedCollegeIds.length, icon: "🏫", color: "#1e40af" },
                { label: "Total Deadlines", value: allDeadlines.length, icon: "📋", color: "#7c3aed" },
                {
                  label: "Due This Month",
                  value: allDeadlines.filter((d) => { const n = daysUntil(d.date); return n >= 0 && n <= 30; }).length,
                  icon: "⏰", color: "#dc2626"
                },
                {
                  label: "Next Deadline",
                  value: (() => {
                    const next = allDeadlines.find((d) => daysUntil(d.date) >= 0);
                    if (!next) return "None";
                    const days = daysUntil(next.date);
                    return days === 0 ? "Today!" : `${days}d`;
                  })(),
                  icon: "🎯", color: "#059669"
                },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `4px solid ${stat.color}` }}>
                  <div style={{ fontSize: 28 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 8 }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Reminder summary */}
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <span style={{ fontSize: 22 }}>🔔</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#1e40af", fontSize: 15 }}>Reminders Active</div>
                <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 2 }}>
                  {[
                    user.reminderSettings.emailEnabled && user.reminderSettings.email && `Email: ${user.reminderSettings.email}`,
                    user.reminderSettings.smsEnabled && user.reminderSettings.phone && `SMS: ${user.reminderSettings.phone}`,
                  ].filter(Boolean).join(" · ") || "No notification channels configured"}
                  {" · "}
                  {Object.entries(user.reminderSettings.reminders)
                    .filter(([, v]) => v)
                    .map(([k]) => ({ days30: "30d", days14: "14d", days7: "7d", days1: "1d" }[k]))
                    .join(", ")} before each deadline
                </div>
              </div>
              <button
                onClick={() => setStep("reminders")}
                style={{ fontSize: 13, color: "#1e40af", background: "white", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 600 }}
              >
                Edit Settings
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Filter:</span>
              {["all", "EA", "ED", "ED2", "RD", "FA"].map((f) => (
                <button
                  key={f}
                  onClick={() => setDashFilter(f)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    border: `2px solid ${dashFilter === f ? getDeadlineTypeColor(f === "all" ? "RD" : f) : "#e2e8f0"}`,
                    background: dashFilter === f ? (f === "all" ? "#1e40af" : getDeadlineTypeColor(f)) : "white",
                    color: dashFilter === f ? "white" : "#64748b",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {f === "all" ? "All Types" : f}
                  {f !== "all" && (
                    <span style={{ marginLeft: 6, opacity: 0.8, fontWeight: 400 }}>
                      {getDeadlineLabel(f)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content" }}>
              {(["upcoming", "past"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 22px",
                    borderRadius: 9,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    background: activeTab === tab ? "white" : "transparent",
                    color: activeTab === tab ? "#1e293b" : "#64748b",
                    boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {tab === "upcoming" ? "⏳ Upcoming" : "✅ Past"}
                </button>
              ))}
            </div>

            {/* Deadline Cards */}
            {filteredDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{activeTab === "past" ? "✅" : "🎉"}</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: "#64748b" }}>
                  {activeTab === "past" ? "No past deadlines" : "No upcoming deadlines match your filter"}
                </div>
                {user.selectedCollegeIds.length === 0 && (
                  <button
                    onClick={() => setStep("select")}
                    style={{ marginTop: 16, background: "#1e40af", color: "white", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 15, cursor: "pointer", fontWeight: 600 }}
                  >
                    Add Schools
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredDeadlines.map((deadline) => {
                  const days = daysUntil(deadline.date);
                  const isPast = days < 0;
                  return (
                    <div
                      key={`${deadline.collegeId}-${deadline.type}`}
                      style={{
                        background: isPast ? "#f9fafb" : urgencyBg(days),
                        border: `1.5px solid ${isPast ? "#e5e7eb" : urgencyColor(days) + "40"}`,
                        borderRadius: 16,
                        padding: "20px 24px",
                        display: "flex",
                        alignItems: "center",
                        gap: 20,
                        flexWrap: "wrap",
                        opacity: isPast ? 0.7 : 1,
                      }}
                    >
                      {/* Type Badge */}
                      <div
                        style={{
                          background: getDeadlineTypeColor(deadline.type),
                          color: "white",
                          borderRadius: 10,
                          padding: "6px 14px",
                          fontSize: 14,
                          fontWeight: 800,
                          flexShrink: 0,
                          minWidth: 48,
                          textAlign: "center",
                        }}
                      >
                        {deadline.type}
                      </div>

                      {/* School + Label */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{deadline.collegeName}</div>
                        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{deadline.label}</div>
                      </div>

                      {/* Date */}
                      <div style={{ textAlign: "center", minWidth: 110 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>{formatDate(deadline.date)}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>
                          {new Date(deadline.date).toLocaleDateString("en-US", { weekday: "long" })}
                        </div>
                      </div>

                      {/* Countdown */}
                      <div
                        style={{
                          textAlign: "center",
                          minWidth: 100,
                          padding: "8px 16px",
                          borderRadius: 12,
                          background: isPast ? "#e5e7eb" : urgencyColor(days) + "15",
                        }}
                      >
                        {isPast ? (
                          <div style={{ fontSize: 13, color: "#9ca3af", fontWeight: 600 }}>Passed</div>
                        ) : days === 0 ? (
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#dc2626" }}>Today!</div>
                        ) : (
                          <>
                            <div style={{ fontSize: 24, fontWeight: 800, color: urgencyColor(days), lineHeight: 1 }}>{days}</div>
                            <div style={{ fontSize: 12, color: urgencyColor(days), fontWeight: 600 }}>days left</div>
                          </>
                        )}
                      </div>

                      {/* Reminder indicator */}
                      {!isPast && (
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          {([
                            { key: "days30", d: 30, label: "30d" },
                            { key: "days14", d: 14, label: "14d" },
                            { key: "days7", d: 7, label: "7d" },
                            { key: "days1", d: 1, label: "1d" },
                          ] as const).map(({ key, d, label }) => {
                            const active = user.reminderSettings.reminders[key];
                            const triggered = days <= d;
                            return (
                              <div
                                key={key}
                                title={`${label} reminder${active ? " enabled" : " disabled"}${triggered ? " (would fire)" : ""}`}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: active && triggered ? "#fef3c7" : active ? "#f0fdf4" : "#f1f5f9",
                                  border: `1px solid ${active && triggered ? "#fcd34d" : active ? "#bbf7d0" : "#e2e8f0"}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: active && triggered ? "#92400e" : active ? "#166534" : "#9ca3af",
                                }}
                              >
                                {label}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* School list management */}
            {user.selectedCollegeIds.length > 0 && (
              <div style={{ marginTop: 48 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                    My Schools ({user.selectedCollegeIds.length})
                  </h3>
                  <button
                    onClick={() => setStep("select")}
                    style={{ fontSize: 13, color: "#1e40af", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontWeight: 600 }}
                  >
                    + Add / Remove Schools
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {COLLEGES.filter((c) => user.selectedCollegeIds.includes(c.id)).map((college) => (
                    <div
                      key={college.id}
                      style={{
                        background: "white",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: 12,
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{college.name}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{college.location}</div>
                      </div>
                      <button
                        onClick={() => {
                          const newIds = user.selectedCollegeIds.filter((id) => id !== college.id);
                          const newUser = { ...user, selectedCollegeIds: newIds };
                          saveUser(newUser);
                        }}
                        style={{ marginLeft: 4, background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}
                        title="Remove school"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "32px 16px", color: "#94a3b8", fontSize: 13, marginTop: 40, borderTop: "1px solid #e2e8f0" }}>
        <div>🎓 Edutracker · College Application Deadline Tracker</div>
        <div style={{ marginTop: 4 }}>Deadlines are approximate — always verify with official college websites.</div>
      </footer>
    </div>
  );
}