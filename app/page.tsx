"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College, DeadlineType } from "../lib/colleges";

interface User {
  email: string;
}

interface SavedDeadline {
  collegeId: string;
  type: DeadlineType;
}

interface DashboardItem {
  college: College;
  type: DeadlineType;
  date: string;
  daysRemaining: number;
}

type AppStep = "auth" | "onboarding" | "dashboard";

function getDaysRemaining(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getDeadlineDate(college: College, type: DeadlineType): string | null {
  switch (type) {
    case "EA": return college.ea || null;
    case "ED": return college.ed || null;
    case "ED2": return college.ed2 || null;
    case "RD": return college.rd || null;
    case "Scholarship": return college.scholarship || null;
    default: return null;
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getUrgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f97316";
  if (days <= 60) return "#eab308";
  return "#22c55e";
}

function getUrgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 7) return "#fef2f2";
  if (days <= 30) return "#fff7ed";
  if (days <= 60) return "#fefce8";
  return "#f0fdf4";
}

const DEADLINE_TYPES: DeadlineType[] = ["EA", "ED", "ED2", "RD", "Scholarship"];

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  EA: "Early Action",
  ED: "Early Decision",
  ED2: "Early Decision II",
  RD: "Regular Decision",
  Scholarship: "Scholarship",
};

const DEADLINE_COLORS: Record<DeadlineType, string> = {
  EA: "#6366f1",
  ED: "#ec4899",
  ED2: "#8b5cf6",
  RD: "#3b82f6",
  Scholarship: "#f59e0b",
};

export default function Home() {
  const [step, setStep] = useState<AppStep>("auth");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<Map<string, Set<DeadlineType>>>(new Map());
  const [onboardingStep, setOnboardingStep] = useState<"search" | "confirm">("search");

  const [dashboardSearch, setDashboardSearch] = useState("");
  const [filterType, setFilterType] = useState<DeadlineType | "All">("All");
  const [showPast, setShowPast] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "manage">("dashboard");

  const [addSchoolSearch, setAddSchoolSearch] = useState("");
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        setUser(u);
        loadUserData(u.email);
        setStep("dashboard");
      } catch {
        // ignore
      }
    }
  }, []);

  const loadUserData = useCallback((email: string) => {
    const key = `edutracker_schools_${email}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const data = JSON.parse(saved) as SavedDeadline[];
        const map = new Map<string, Set<DeadlineType>>();
        data.forEach(({ collegeId, type }) => {
          if (!map.has(collegeId)) map.set(collegeId, new Set());
          map.get(collegeId)!.add(type);
        });
        setSelectedSchools(map);
      } catch {
        // ignore
      }
    }
  }, []);

  const saveUserData = useCallback((email: string, schools: Map<string, Set<DeadlineType>>) => {
    const key = `edutracker_schools_${email}`;
    const data: SavedDeadline[] = [];
    schools.forEach((types, collegeId) => {
      types.forEach((type) => data.push({ collegeId, type }));
    });
    localStorage.setItem(key, JSON.stringify(data));
  }, []);

  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError("Please enter email and password.");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail.trim(), password: authPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        const u: User = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
        loadUserData(data.email);
        const savedKey = `edutracker_schools_${data.email}`;
        const hasSaved = localStorage.getItem(savedKey);
        if (hasSaved) {
          setStep("dashboard");
        } else {
          setStep("onboarding");
        }
      } else {
        setAuthError(data.error || "Authentication failed.");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("edutracker_user");
    setSelectedSchools(new Map());
    setStep("auth");
    setAuthEmail("");
    setAuthPassword("");
    setAuthError("");
  };

  const toggleDeadlineType = (collegeId: string, type: DeadlineType, college: College) => {
    const date = getDeadlineDate(college, type);
    if (!date) return;
    setSelectedSchools((prev) => {
      const next = new Map(prev);
      if (!next.has(collegeId)) next.set(collegeId, new Set());
      const types = new Set(next.get(collegeId)!);
      if (types.has(type)) {
        types.delete(type);
        if (types.size === 0) next.delete(collegeId);
        else next.set(collegeId, types);
      } else {
        types.add(type);
        next.set(collegeId, types);
      }
      return next;
    });
  };

  const removeSchool = (collegeId: string) => {
    setSelectedSchools((prev) => {
      const next = new Map(prev);
      next.delete(collegeId);
      return next;
    });
  };

  const finishOnboarding = () => {
    if (user) saveUserData(user.email, selectedSchools);
    setStep("dashboard");
    setActiveTab("dashboard");
  };

  const handleSaveFromDashboard = () => {
    if (user) saveUserData(user.email, selectedSchools);
  };

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 30);

  const addSchoolFiltered = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(addSchoolSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(addSchoolSearch.toLowerCase())
  ).slice(0, 20);

  const getDashboardItems = (): DashboardItem[] => {
    const items: DashboardItem[] = [];
    selectedSchools.forEach((types, collegeId) => {
      const college = COLLEGES.find((c) => c.id === collegeId);
      if (!college) return;
      types.forEach((type) => {
        const date = getDeadlineDate(college, type);
        if (!date) return;
        const daysRemaining = getDaysRemaining(date);
        items.push({ college, type, date, daysRemaining });
      });
    });
    items.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return items;
  };

  const dashboardItems = getDashboardItems();
  const filteredDashboard = dashboardItems.filter((item) => {
    if (!showPast && item.daysRemaining < 0) return false;
    if (filterType !== "All" && item.type !== filterType) return false;
    if (dashboardSearch && !item.college.name.toLowerCase().includes(dashboardSearch.toLowerCase())) return false;
    return true;
  });

  const upcomingCount = dashboardItems.filter((i) => i.daysRemaining >= 0).length;
  const urgentCount = dashboardItems.filter((i) => i.daysRemaining >= 0 && i.daysRemaining <= 14).length;
  const nextDeadline = dashboardItems.find((i) => i.daysRemaining >= 0);

  // Auth Screen
  if (step === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
            <h1 style={{ color: "white", fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Edutracker</h1>
            <p style={{ color: "#a5b4fc", fontSize: 16, marginTop: 8 }}>Never miss a college application deadline</p>
          </div>
          <div style={{ background: "white", borderRadius: 20, padding: 36, boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", marginBottom: 28, background: "#f3f4f6", borderRadius: 10, padding: 4 }}>
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setAuthMode(m); setAuthError(""); }}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                    background: authMode === m ? "white" : "transparent",
                    color: authMode === m ? "#312e81" : "#6b7280",
                    boxShadow: authMode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="you@email.com"
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border 0.2s" }}
                onFocus={(e) => (e.target.style.border = "2px solid #6366f1")}
                onBlur={(e) => (e.target.style.border = "2px solid #e5e7eb")}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => (e.target.style.border = "2px solid #6366f1")}
                onBlur={(e) => (e.target.style.border = "2px solid #e5e7eb")}
              />
            </div>
            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 14, marginBottom: 16 }}>
                {authError}
              </div>
            )}
            <button
              onClick={handleAuth}
              disabled={authLoading}
              style={{ width: "100%", padding: "14px", background: authLoading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer", transition: "all 0.2s", letterSpacing: "0.3px" }}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In →" : "Create Account →"}
            </button>
            <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
              {authMode === "login" ? "New here? " : "Already have an account? "}
              <span
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}
              >
                {authMode === "login" ? "Sign up free" : "Sign in"}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding
  if (step === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9ff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4f46e5)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎓</span>
            <span style={{ color: "white", fontWeight: 800, fontSize: 20 }}>Edutracker</span>
          </div>
          <span style={{ color: "#a5b4fc", fontSize: 14 }}>Signed in as {user?.email}</span>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
          {onboardingStep === "search" ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Find Your Target Schools</h2>
                <p style={{ color: "#6b7280", marginTop: 10, fontSize: 16 }}>Search and select schools, then choose which deadlines to track</p>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                  {DEADLINE_TYPES.map((t) => (
                    <span key={t} style={{ background: DEADLINE_COLORS[t] + "20", color: DEADLINE_COLORS[t], padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {DEADLINE_LABELS[t]}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ position: "relative", marginBottom: 24 }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 18 }}>🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search colleges by name or location..."
                  style={{ width: "100%", padding: "16px 16px 16px 48px", border: "2px solid #e5e7eb", borderRadius: 14, fontSize: 16, outline: "none", boxSizing: "border-box", background: "white", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                  onFocus={(e) => (e.target.style.border = "2px solid #6366f1")}
                  onBlur={(e) => (e.target.style.border = "2px solid #e5e7eb")}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredColleges.map((college) => {
                  const selected = selectedSchools.get(college.id);
                  const isSelected = selected && selected.size > 0;
                  return (
                    <div
                      key={college.id}
                      style={{
                        background: "white", borderRadius: 14, padding: "18px 20px", border: isSelected ? "2px solid #6366f1" : "2px solid #e5e7eb",
                        boxShadow: isSelected ? "0 4px 20px rgba(99,102,241,0.15)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937" }}>{college.name}</div>
                          <div style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }}>{college.location} · {college.type}</div>
                          {college.acceptanceRate && (
                            <div style={{ color: "#9ca3af", fontSize: 12, marginTop: 2 }}>Acceptance: {college.acceptanceRate}</div>
                          )}
                        </div>
                        {isSelected && (
                          <span style={{ background: "#ede9fe", color: "#6366f1", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
                            {selected!.size} deadline{selected!.size > 1 ? "s" : ""} selected
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {DEADLINE_TYPES.map((type) => {
                          const date = getDeadlineDate(college, type);
                          if (!date) return null;
                          const isChecked = selected?.has(type) || false;
                          return (
                            <button
                              key={type}
                              onClick={() => toggleDeadlineType(college.id, type, college)}
                              style={{
                                padding: "6px 14px", borderRadius: 20, border: `2px solid ${isChecked ? DEADLINE_COLORS[type] : "#e5e7eb"}`,
                                background: isChecked ? DEADLINE_COLORS[type] : "white", color: isChecked ? "white" : "#6b7280",
                                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                              }}
                            >
                              {type} · {formatDate(date)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {searchQuery && filteredColleges.length === 0 && (
                  <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>No colleges found. Try a different search.</div>
                )}
                {!searchQuery && (
                  <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, padding: "8px 0" }}>Showing top colleges · Search to find more</div>
                )}
              </div>

              {selectedSchools.size > 0 && (
                <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.1)" }}>
                  <span style={{ color: "#6b7280", fontSize: 15 }}>
                    <strong style={{ color: "#1f2937" }}>{selectedSchools.size}</strong> school{selectedSchools.size > 1 ? "s" : ""} · <strong style={{ color: "#1f2937" }}>{Array.from(selectedSchools.values()).reduce((a, s) => a + s.size, 0)}</strong> deadlines
                  </span>
                  <button
                    onClick={finishOnboarding}
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", padding: "12px 28px", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                  >
                    View My Dashboard →
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9ff", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #4f46e5)", padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎓</span>
            <span style={{ color: "white", fontWeight: 800, fontSize: 20, letterSpacing: "-0.3px" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[{ id: "dashboard", label: "📋 Deadlines" }, { id: "manage", label: "⚙️ Manage" }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "dashboard" | "manage")}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.2s",
                  background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "transparent",
                  color: activeTab === tab.id ? "white" : "rgba(255,255,255,0.65)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 80px" }}>
        {activeTab === "dashboard" ? (
          <>
            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Schools Tracked", value: selectedSchools.size, icon: "🏫", color: "#6366f1" },
                { label: "Total Deadlines", value: upcomingCount, icon: "📅", color: "#3b82f6" },
                { label: "Due in 14 Days", value: urgentCount, icon: "🔥", color: urgentCount > 0 ? "#ef4444" : "#22c55e" },
                { label: "Next Deadline", value: nextDeadline ? `${nextDeadline.daysRemaining}d` : "—", icon: "⏰", color: "#f59e0b" },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "white", borderRadius: 14, padding: "20px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {nextDeadline && nextDeadline.daysRemaining >= 0 && nextDeadline.daysRemaining <= 30 && (
              <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff7ed)", border: "2px solid #fed7aa", borderRadius: 14, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 32 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#92400e" }}>
                    Upcoming: {nextDeadline.college.name} — {DEADLINE_LABELS[nextDeadline.type]}
                  </div>
                  <div style={{ color: "#b45309", fontSize: 14, marginTop: 2 }}>
                    Due {formatDate(nextDeadline.date)} · {nextDeadline.daysRemaining === 0 ? "TODAY!" : `${nextDeadline.daysRemaining} day${nextDeadline.daysRemaining > 1 ? "s" : ""} away`}
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
                <input
                  type="text"
                  value={dashboardSearch}
                  onChange={(e) => setDashboardSearch(e.target.value)}
                  placeholder="Search schools..."
                  style={{ width: "100%", padding: "10px 10px 10px 36px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["All", ...DEADLINE_TYPES] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t as DeadlineType | "All")}
                    style={{
                      padding: "8px 14px", borderRadius: 20, border: `2px solid ${filterType === t ? (t === "All" ? "#6366f1" : DEADLINE_COLORS[t as DeadlineType]) : "#e5e7eb"}`,
                      background: filterType === t ? (t === "All" ? "#6366f1" : DEADLINE_COLORS[t as DeadlineType]) : "white",
                      color: filterType === t ? "white" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {t === "All" ? "All Types" : t}
                  </button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", cursor: "pointer", whiteSpace: "nowrap" }}>
                <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                Show past
              </label>
            </div>

            {/* Deadline Cards */}
            {selectedSchools.size === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📚</div>
                <h3 style={{ color: "#1f2937", fontWeight: 700, fontSize: 22 }}>No Schools Added Yet</h3>
                <p style={{ color: "#9ca3af", fontSize: 15, marginBottom: 24 }}>Add schools to start tracking your deadlines</p>
                <button onClick={() => setActiveTab("manage")} style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", padding: "14px 28px", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                  Add Schools →
                </button>
              </div>
            ) : filteredDashboard.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ fontSize: 16 }}>No deadlines match your filters.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredDashboard.map((item, idx) => {
                  const urgencyColor = getUrgencyColor(item.daysRemaining);
                  const urgencyBg = getUrgencyBg(item.daysRemaining);
                  return (
                    <div
                      key={`${item.college.id}-${item.type}-${idx}`}
                      style={{
                        background: "white", borderRadius: 14, padding: "18px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                        border: `1px solid ${item.daysRemaining >= 0 && item.daysRemaining <= 7 ? "#fecaca" : "#f0f0f0"}`,
                        display: "flex", alignItems: "center", gap: 16, transition: "box-shadow 0.2s",
                      }}
                    >
                      {/* Countdown circle */}
                      <div style={{
                        width: 72, height: 72, borderRadius: "50%", background: urgencyBg, border: `3px solid ${urgencyColor}`,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <span style={{ fontSize: item.daysRemaining < 0 ? 11 : 18, fontWeight: 800, color: urgencyColor, lineHeight: 1 }}>
                          {item.daysRemaining < 0 ? "PAST" : item.daysRemaining === 0 ? "TODAY" : item.daysRemaining}
                        </span>
                        {item.daysRemaining > 0 && <span style={{ fontSize: 10, color: urgencyColor, fontWeight: 600 }}>days</span>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1f2937", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.college.name}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{
                            background: DEADLINE_COLORS[item.type] + "18", color: DEADLINE_COLORS[item.type],
                            padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          }}>
                            {DEADLINE_LABELS[item.type]}
                          </span>
                          <span style={{ color: "#9ca3af", fontSize: 13 }}>{item.college.location}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#374151" }}>{formatDate(item.date)}</div>
                        <div style={{ fontSize: 12, color: item.daysRemaining < 0 ? "#9ca3af" : urgencyColor, fontWeight: 600, marginTop: 2 }}>
                          {item.daysRemaining < 0
                            ? `${Math.abs(item.daysRemaining)}d ago`
                            : item.daysRemaining === 0
                            ? "Due today!"
                            : item.daysRemaining <= 7
                            ? "⚠️ Almost due!"
                            : item.daysRemaining <= 30
                            ? "Coming up"
                            : "Plenty of time"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Manage Tab */
          <>
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: "0 0 8px" }}>Manage Schools</h2>
              <p style={{ color: "#6b7280", margin: 0 }}>Add or remove schools and deadlines from your tracker</p>
            </div>

            {/* Add School */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
              <h3 style={{ fontWeight: 700, fontSize: 17, color: "#1f2937", margin: "0 0 16px" }}>➕ Add Schools</h3>
              <div style={{ position: "relative", marginBottom: 16 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
                <input
                  type="text"
                  value={addSchoolSearch}
                  onChange={(e) => setAddSchoolSearch(e.target.value)}
                  placeholder="Search all 200 colleges..."
                  style={{ width: "100%", padding: "12px 12px 12px 38px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => (e.target.style.border = "2px solid #6366f1")}
                  onBlur={(e) => (e.target.style.border = "2px solid #e5e7eb")}
                />
              </div>
              {addSchoolSearch && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
                  {addSchoolFiltered.map((college) => {
                    const selected = selectedSchools.get(college.id);
                    const isExpanded = expandedCollege === college.id;
                    return (
                      <div key={college.id} style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                        <div
                          style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: isExpanded ? "#f8f9ff" : "white" }}
                          onClick={() => setExpandedCollege(isExpanded ? null : college.id)}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: "#1f2937" }}>{college.name}</div>
                            <div style={{ color: "#9ca3af", fontSize: 12 }}>{college.location}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {selected && selected.size > 0 && (
                              <span style={{ background: "#ede9fe", color: "#6366f1", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                                {selected.size} added
                              </span>
                            )}
                            <span style={{ color: "#9ca3af" }}>{isExpanded ? "▲" : "▼"}</span>
                          </div>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "12px 16px", background: "#f8f9ff", borderTop: "1px solid #e5e7eb" }}>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {DEADLINE_TYPES.map((type) => {
                                const date = getDeadlineDate(college, type);
                                if (!date) return null;
                                const isChecked = selected?.has(type) || false;
                                return (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      toggleDeadlineType(college.id, type, college);
                                      setTimeout(() => {
                                        if (user) {
                                          setSelectedSchools((current) => {
                                            saveUserData(user.email, current);
                                            return current;
                                          });
                                        }
                                      }, 50);
                                    }}
                                    style={{
                                      padding: "6px 14px", borderRadius: 20, border: `2px solid ${isChecked ? DEADLINE_COLORS[type] : "#e5e7eb"}`,
                                      background: isChecked ? DEADLINE_COLORS[type] : "white", color: isChecked ? "white" : "#6b7280",
                                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    }}
                                  >
                                    {type} · {formatDate(date)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {addSchoolFiltered.length === 0 && (
                    <div style={{ textAlign: "center", color: "#9ca3af", padding: 20 }}>No results</div>
                  )}
                </div>
              )}
            </div>

            {/* Current Schools */}
            <div style={{ background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: "#1f2937", margin: 0 }}>
                  🏫 Your Schools ({selectedSchools.size})
                </h3>
                {selectedSchools.size > 0 && (
                  <button
                    onClick={handleSaveFromDashboard}
                    style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "white", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
                  >
                    💾 Save Changes
                  </button>
                )}
              </div>
              {selectedSchools.size === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 0", color: "#9ca3af" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📚</div>
                  <p>No schools added yet. Search above to add schools.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Array.from(selectedSchools.entries()).map(([collegeId, types]) => {
                    const college = COLLEGES.find((c) => c.id === collegeId);
                    if (!college) return null;
                    return (
                      <div key={collegeId} style={{ padding: "14px 16px", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#1f2937" }}>{college.name}</div>
                          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 8 }}>{college.location}</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {Array.from(types).map((type) => {
                              const date = getDeadlineDate(college, type);
                              return (
                                <span
                                  key={type}
                                  style={{
                                    background: DEADLINE_COLORS[type] + "18", color: DEADLINE_COLORS[type],
                                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  }}
                                >
                                  {type}{date ? ` · ${formatDate(date)}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            removeSchool(collegeId);
                            if (user) {
                              const next = new Map(selectedSchools);
                              next.delete(collegeId);
                              saveUserData(user.email, next);
                            }
                          }}
                          style={{ background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, flexShrink: 0 }}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}