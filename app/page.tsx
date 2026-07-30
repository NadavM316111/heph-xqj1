"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: Deadline[];
}

interface Deadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  label: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}

interface UserDeadline {
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineLabel: string;
  date: string;
  notes?: string;
  daysUntil: number;
  alertPrefs: AlertPrefs;
}

interface AlertPrefs {
  email30: boolean;
  email7: boolean;
  email1: boolean;
  sms30: boolean;
  sms7: boolean;
  sms1: boolean;
}

const defaultAlertPrefs: AlertPrefs = {
  email30: true,
  email7: true,
  email1: true,
  sms30: false,
  sms7: false,
  sms1: false,
};

import { COLLEGES } from "@/lib/colleges";

type View = "auth" | "onboarding" | "dashboard" | "alerts" | "profile";

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
  if (days <= 1) return "#ef4444";
  if (days <= 7) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 1) return "#fef2f2";
  if (days <= 7) return "#fff7ed";
  if (days <= 30) return "#fefce8";
  return "#f0fdf4";
}

function deadlineTypeBadgeColor(type: string): { bg: string; text: string } {
  switch (type) {
    case "EA": return { bg: "#dbeafe", text: "#1d4ed8" };
    case "ED": return { bg: "#ede9fe", text: "#7c3aed" };
    case "ED2": return { bg: "#f3e8ff", text: "#9333ea" };
    case "RD": return { bg: "#dcfce7", text: "#15803d" };
    case "Scholarship": return { bg: "#fef9c3", text: "#a16207" };
    default: return { bg: "#f3f4f6", text: "#374151" };
  }
}

export default function App() {
  const [view, setView] = useState<View>("auth");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [alertPrefsMap, setAlertPrefsMap] = useState<Record<string, AlertPrefs>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [dashboardFilter, setDashboardFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUserEmail(parsed.email);
      const colleges = localStorage.getItem("edutracker_colleges");
      if (colleges) {
        setSelectedColleges(JSON.parse(colleges));
        setView("dashboard");
      } else {
        setView("onboarding");
      }
    }
    const prefs = localStorage.getItem("edutracker_alert_prefs");
    if (prefs) setAlertPrefsMap(JSON.parse(prefs));
    const ph = localStorage.getItem("edutracker_phone");
    if (ph) setPhone(ph);
  }, []);

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
        const colleges = localStorage.getItem("edutracker_colleges");
        if (colleges && JSON.parse(colleges).length > 0) {
          setSelectedColleges(JSON.parse(colleges));
          setView("dashboard");
        } else {
          setView("onboarding");
        }
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
    localStorage.removeItem("edutracker_colleges");
    localStorage.removeItem("edutracker_alert_prefs");
    localStorage.removeItem("edutracker_phone");
    setUserEmail(null);
    setSelectedColleges([]);
    setAlertPrefsMap({});
    setEmail("");
    setPassword("");
    setView("auth");
  };

  const toggleCollege = (id: string) => {
    setSelectedColleges((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const saveSelections = () => {
    localStorage.setItem("edutracker_colleges", JSON.stringify(selectedColleges));
    if (phone) localStorage.setItem("edutracker_phone", phone);
    const initialPrefs: Record<string, AlertPrefs> = {};
    selectedColleges.forEach((id) => {
      if (!alertPrefsMap[id]) initialPrefs[id] = { ...defaultAlertPrefs };
    });
    const merged = { ...alertPrefsMap, ...initialPrefs };
    setAlertPrefsMap(merged);
    localStorage.setItem("edutracker_alert_prefs", JSON.stringify(merged));
    setView("dashboard");
  };

  const updateAlertPref = (collegeId: string, key: keyof AlertPrefs, value: boolean) => {
    const updated = {
      ...alertPrefsMap,
      [collegeId]: {
        ...(alertPrefsMap[collegeId] || defaultAlertPrefs),
        [key]: value,
      },
    };
    setAlertPrefsMap(updated);
    localStorage.setItem("edutracker_alert_prefs", JSON.stringify(updated));
  };

  const getUserDeadlines = useCallback((): UserDeadline[] => {
    const result: UserDeadline[] = [];
    selectedColleges.forEach((id) => {
      const college = COLLEGES.find((c) => c.id === id);
      if (!college) return;
      college.deadlines.forEach((dl) => {
        result.push({
          collegeId: id,
          collegeName: college.name,
          deadlineType: dl.type,
          deadlineLabel: dl.label,
          date: dl.date,
          notes: dl.notes,
          daysUntil: daysUntil(dl.date),
          alertPrefs: alertPrefsMap[id] || defaultAlertPrefs,
        });
      });
    });
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return result;
  }, [selectedColleges, alertPrefsMap]);

  const filteredColleges = COLLEGES.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
    const matchType = filterType === "All" || c.type === filterType;
    return matchSearch && matchType;
  });

  const allDeadlines = getUserDeadlines();
  const upcomingDeadlines = allDeadlines.filter((d) => d.daysUntil >= 0);
  const pastDeadlines = allDeadlines.filter((d) => d.daysUntil < 0).reverse();

  const displayDeadlines =
    activeTab === "upcoming"
      ? upcomingDeadlines.filter((d) => dashboardFilter === "All" || d.deadlineType === dashboardFilter)
      : pastDeadlines.filter((d) => dashboardFilter === "All" || d.deadlineType === dashboardFilter);

  const nextDeadline = upcomingDeadlines[0];

  if (view === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "48px 40px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎓</div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 6px 0" }}>Edutracker</h1>
            <p style={{ color: "#6b7280", margin: 0, fontSize: "15px" }}>Never miss a college deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setAuthMode(m); setAuthError(""); }}
                style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s", background: authMode === m ? "white" : "transparent", color: authMode === m ? "#1e3a5f" : "#6b7280", boxShadow: authMode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "6px" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
              />
            </div>
          </div>

          {authError && (
            <div style={{ marginTop: "16px", padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#dc2626", fontSize: "14px" }}>
              ⚠️ {authError}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={authLoading || !email || !password}
            style={{ marginTop: "24px", width: "100%", padding: "14px", background: authLoading || !email || !password ? "#93c5fd" : "linear-gradient(135deg, #1e3a5f, #2563eb)", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: authLoading || !email || !password ? "not-allowed" : "pointer", transition: "all 0.2s" }}
          >
            {authLoading ? "Please wait..." : authMode === "login" ? "Log In →" : "Create Account →"}
          </button>

          <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "13px", marginTop: "20px", marginBottom: 0 }}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600", fontSize: "13px", padding: 0 }}>
              {authMode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (view === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", padding: "20px 24px", color: "white" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🎓</span>
              <span style={{ fontSize: "20px", fontWeight: "800" }}>Edutracker</span>
            </div>
            <span style={{ fontSize: "14px", opacity: 0.8 }}>Signed in as {userEmail}</span>
          </div>
        </div>

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
          {onboardingStep === 0 && (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 8px 0" }}>Choose Your Target Schools</h2>
                <p style={{ color: "#6b7280", margin: "0 0 24px 0", fontSize: "16px" }}>Select the colleges you're applying to. We'll track all their deadlines for you.</p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <input
                      type="text"
                      placeholder="🔍 Search colleges..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", background: "white", cursor: "pointer" }}
                  >
                    {["All", "Ivy League", "Public", "Liberal Arts", "Tech", "Private"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedColleges.length > 0 && (
                <div style={{ marginBottom: "20px", padding: "14px 18px", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: "#1d4ed8", fontWeight: "600" }}>✓ {selectedColleges.length} school{selectedColleges.length !== 1 ? "s" : ""} selected</span>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    style={{ padding: "8px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                  >
                    Continue →
                  </button>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
                {filteredColleges.map((college) => {
                  const selected = selectedColleges.includes(college.id);
                  return (
                    <div
                      key={college.id}
                      onClick={() => toggleCollege(college.id)}
                      style={{ background: "white", border: `2px solid ${selected ? "#2563eb" : "#e5e7eb"}`, borderRadius: "14px", padding: "18px", cursor: "pointer", transition: "all 0.2s", boxShadow: selected ? "0 4px 20px rgba(37,99,235,0.15)" : "0 2px 8px rgba(0,0,0,0.05)", transform: selected ? "translateY(-2px)" : "none" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "700", fontSize: "15px", color: "#1e3a5f", marginBottom: "2px" }}>{college.name}</div>
                          <div style={{ fontSize: "13px", color: "#6b7280" }}>{college.location}</div>
                        </div>
                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: selected ? "#2563eb" : "#f3f4f6", border: `2px solid ${selected ? "#2563eb" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "8px" }}>
                          {selected && <span style={{ color: "white", fontSize: "12px", fontWeight: "700" }}>✓</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ padding: "3px 8px", background: "#f3f4f6", borderRadius: "6px", fontSize: "11px", color: "#6b7280", fontWeight: "600" }}>{college.type}</span>
                        {college.deadlines.map((dl) => {
                          const badge = deadlineTypeBadgeColor(dl.type);
                          return (
                            <span key={dl.type + dl.date} style={{ padding: "3px 8px", background: badge.bg, color: badge.text, borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>{dl.type}</span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedColleges.length > 0 && (
                <div style={{ marginTop: "24px", textAlign: "center" }}>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    style={{ padding: "14px 40px", background: "linear-gradient(135deg, #1e3a5f, #2563eb)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Next: Set Up Alerts ({selectedColleges.length} schools) →
                  </button>
                </div>
              )}
            </>
          )}

          {onboardingStep === 1 && (
            <>
              <div style={{ marginBottom: "32px" }}>
                <button onClick={() => setOnboardingStep(0)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "14px", marginBottom: "12px", padding: 0 }}>← Back</button>
                <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 8px 0" }}>Configure Your Alerts</h2>
                <p style={{ color: "#6b7280", margin: 0, fontSize: "16px" }}>We'll remind you 30 days, 7 days, and 1 day before each deadline.</p>
              </div>

              <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "2px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <h3 style={{ margin: "0 0 16px 0", color: "#1e3a5f", fontWeight: "700" }}>📱 SMS Alerts (Optional)</h3>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 12px 0" }}>Add your phone number to receive text reminders. Note: SMS sending requires additional setup.</p>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ background: "white", borderRadius: "16px", padding: "24px", marginBottom: "24px", border: "2px solid #e5e7eb" }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#1e3a5f", fontWeight: "700" }}>🔔 Default Alert Settings</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                  {[
                    { key: "email30" as keyof AlertPrefs, label: "📧 Email — 30 days before" },
                    { key: "sms30" as keyof AlertPrefs, label: "💬 SMS — 30 days before" },
                    { key: "email7" as keyof AlertPrefs, label: "📧 Email — 7 days before" },
                    { key: "sms7" as keyof AlertPrefs, label: "💬 SMS — 7 days before" },
                    { key: "email1" as keyof AlertPrefs, label: "📧 Email — 1 day before" },
                    { key: "sms1" as keyof AlertPrefs, label: "💬 SMS — 1 day before" },
                  ].map(({ key, label }) => {
                    const globalPref = alertPrefsMap["__global__"] || defaultAlertPrefs;
                    return (
                      <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                        <div
                          onClick={() => {
                            const current = globalPref[key];
                            const updated = { ...alertPrefsMap, "__global__": { ...globalPref, [key]: !current } };
                            setAlertPrefsMap(updated);
                          }}
                          style={{ width: "20px", height: "20px", borderRadius: "5px", border: `2px solid ${globalPref[key] ? "#2563eb" : "#d1d5db"}`, background: globalPref[key] ? "#2563eb" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
                        >
                          {globalPref[key] && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                        </div>
                        <span style={{ fontSize: "14px", color: "#374151" }}>{label}</span>
                      </label>
                    );
                  })}
                </div>
                <p style={{ margin: "16px 0 0 0", color: "#9ca3af", fontSize: "13px" }}>These apply to all your schools. You can customize per-school from the dashboard.</p>
              </div>

              <div style={{ background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: "14px", padding: "20px", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#1d4ed8", fontWeight: "700" }}>📋 Your Selected Schools ({selectedColleges.length})</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedColleges.map((id) => {
                    const c = COLLEGES.find((x) => x.id === id);
                    return c ? (
                      <span key={id} style={{ padding: "6px 12px", background: "white", border: "1px solid #bfdbfe", borderRadius: "20px", fontSize: "13px", fontWeight: "600", color: "#1d4ed8" }}>
                        {c.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={saveSelections}
                  style={{ padding: "14px 48px", background: "linear-gradient(135deg, #1e3a5f, #2563eb)", color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}
                >
                  🚀 Go to My Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (view === "dashboard" || view === "alerts" || view === "profile") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", padding: "0", color: "white" }}>
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🎓</span>
              <span style={{ fontSize: "20px", fontWeight: "800" }}>Edutracker</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", opacity: 0.8, marginRight: "8px" }}>{userEmail}</span>
              {nextDeadline && (
                <div style={{ padding: "6px 14px", background: "rgba(255,255,255,0.15)", borderRadius: "20px", fontSize: "13px", fontWeight: "600" }}>
                  Next: {nextDeadline.collegeName} in {nextDeadline.daysUntil}d
                </div>
              )}
              <button
                onClick={handleLogout}
                style={{ padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
              >
                Log Out
              </button>
            </div>
          </div>

          {/* Nav */}
          <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "flex", gap: "4px" }}>
            {(["dashboard", "alerts", "profile"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ padding: "12px 20px", background: view === v ? "rgba(255,255,255,0.2)" : "transparent", color: "white", border: "none", borderBottom: view === v ? "3px solid white" : "3px solid transparent", cursor: "pointer", fontSize: "14px", fontWeight: view === v ? "700" : "500", transition: "all 0.2s", textTransform: "capitalize" }}
              >
                {v === "dashboard" ? "📅 Dashboard" : v === "alerts" ? "🔔 Alerts" : "👤 Profile"}
              </button>
            ))}
            <button
              onClick={() => { setOnboardingStep(0); setView("onboarding"); }}
              style={{ padding: "12px 20px", background: "transparent", color: "rgba(255,255,255,0.7)", border: "none", borderBottom: "3px solid transparent", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
            >
              + Add Schools
            </button>
          </div>
        </div>

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
          {/* DASHBOARD VIEW */}
          {view === "dashboard" && (
            <>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                {[
                  { label: "Schools Tracked", value: selectedColleges.length, icon: "🏫", color: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
                  { label: "Upcoming Deadlines", value: upcomingDeadlines.length, icon: "📅", color: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
                  { label: "Due in 30 Days", value: upcomingDeadlines.filter((d) => d.daysUntil <= 30).length, icon: "⚡", color: "#fefce8", border: "#fde68a", text: "#a16207" },
                  { label: "Due This Week", value: upcomingDeadlines.filter((d) => d.daysUntil <= 7).length, icon: "🚨", color: "#fef2f2", border: "#fecaca", text: "#dc2626" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: stat.color, border: `2px solid ${stat.border}`, borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
                    <span style={{ fontSize: "28px" }}>{stat.icon}</span>
                    <div>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: stat.text }}>{stat.value}</div>
                      <div style={{ fontSize: "12px", color: stat.text, opacity: 0.8, fontWeight: "600" }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", background: "white", border: "2px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                  {(["upcoming", "past"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ padding: "10px 20px", background: activeTab === tab ? "#1e3a5f" : "transparent", color: activeTab === tab ? "white" : "#6b7280", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s" }}
                    >
                      {tab === "upcoming" ? "Upcoming" : "Past"}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["All", "EA", "ED", "ED2", "RD", "Scholarship"].map((type) => {
                    const badge = type !== "All" ? deadlineTypeBadgeColor(type) : { bg: "#f3f4f6", text: "#374151" };
                    return (
                      <button
                        key={type}
                        onClick={() => setDashboardFilter(type)}
                        style={{ padding: "8px 16px", background: dashboardFilter === type ? badge.text : badge.bg, color: dashboardFilter === type ? "white" : badge.text, border: `2px solid ${badge.text}20`, borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", transition: "all 0.2s" }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Deadline List */}
              {displayDeadlines.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: "16px", border: "2px dashed #e5e7eb" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
                  <h3 style={{ color: "#1e3a5f", margin: "0 0 8px 0" }}>{activeTab === "upcoming" ? "No upcoming deadlines!" : "No past deadlines."}</h3>
                  <p style={{ color: "#6b7280", margin: "0 0 20px 0" }}>{activeTab === "upcoming" ? "Add more schools to track their deadlines." : "Your upcoming deadlines will appear here after they pass."}</p>
                  {activeTab === "upcoming" && (
                    <button onClick={() => { setOnboardingStep(0); setView("onboarding"); }} style={{ padding: "12px 28px", background: "#2563eb", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}>+ Add Schools</button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {displayDeadlines.map((dl, idx) => {
                    const badge = deadlineTypeBadgeColor(dl.deadlineType);
                    const days = dl.daysUntil;
                    const urgBg = urgencyBg(days);
                    const urgColor = urgencyColor(days);
                    return (
                      <div
                        key={`${dl.collegeId}-${dl.deadlineType}-${dl.date}-${idx}`}
                        style={{ background: "white", borderRadius: "14px", padding: "20px 24px", border: `2px solid ${days <= 7 && days >= 0 ? urgColor + "40" : "#e5e7eb"}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", gap: "16px", transition: "all 0.2s" }}
                      >
                        <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: urgBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `2px solid ${urgColor}30` }}>
                          <span style={{ fontSize: "18px", fontWeight: "800", color: urgColor, lineHeight: 1 }}>{days < 0 ? "✓" : days === 0 ? "!" : days}</span>
                          {days >= 0 && <span style={{ fontSize: "9px", color: urgColor, fontWeight: "700", lineHeight: 1 }}>{days === 0 ? "TODAY" : days === 1 ? "DAY" : "DAYS"}</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e3a5f" }}>{dl.collegeName}</span>
                            <span style={{ padding: "2px 8px", background: badge.bg, color: badge.text, borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}>{dl.deadlineType}</span>
                            {days <= 1 && days >= 0 && <span style={{ padding: "2px 8px", background: "#fef2f2", color: "#ef4444", borderRadius: "6px", fontSize: "11px", fontWeight: "700" }}>🚨 URGENT</span>}
                          </div>
                          <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "2px" }}>{dl.deadlineLabel}</div>
                          {dl.notes && <div style={{ fontSize: "12px", color: "#9ca3af" }}>ℹ️ {dl.notes}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: "700", color: "#1e3a5f", fontSize: "15px" }}>{formatDate(dl.date)}</div>
                          <div style={{ fontSize: "12px", color: days < 0 ? "#9ca3af" : urgColor, fontWeight: "600", marginTop: "2px" }}>
                            {days < 0 ? "Passed" : days === 0 ? "Due today!" : days === 1 ? "Due tomorrow!" : `${days} days left`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ALERTS VIEW */}
          {view === "alerts" && (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 8px 0" }}>🔔 Alert Preferences</h2>
                <p style={{ color: "#6b7280", margin: 0 }}>Customize when you want to be notified for each school. Alerts go out at 30, 7, and 1 day before each deadline.</p>
              </div>

              <div style={{ background: "#fffbeb", border: "2px solid #fde68a", borderRadius: "14px", padding: "18px 20px", marginBottom: "24px" }}>
                <h4 style={{ margin: "0 0 6px 0", color: "#92400e", fontWeight: "700" }}>📧 Email Alerts</h4>
                <p style={{ margin: 0, color: "#78350f", fontSize: "14px" }}>Email reminders will be sent to <strong>{userEmail}</strong>. Phone: {phone || "Not set — add in Profile"}</p>
              </div>

              {selectedColleges.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", background: "white", borderRadius: "16px", border: "2px dashed #e5e7eb" }}>
                  <p style={{ color: "#6b7280" }}>No schools selected. <button onClick={() => { setOnboardingStep(0); setView("onboarding"); }} style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontWeight: "600" }}>Add schools →</button></p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {selectedColleges.map((id) => {
                    const college = COLLEGES.find((c) => c.id === id);
                    if (!college) return null;
                    const prefs = alertPrefsMap[id] || defaultAlertPrefs;
                    return (
                      <div key={id} style={{ background: "white", borderRadius: "14px", padding: "22px 24px", border: "2px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px", flexWrap: "wrap", gap: "8px" }}>
                          <div>
                            <h3 style={{ margin: "0 0 4px 0", color: "#1e3a5f", fontWeight: "700", fontSize: "17px" }}>{college.name}</h3>
                            <div style={{ fontSize: "13px", color: "#6b7280" }}>{college.location} · {college.type}</div>
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {college.deadlines.map((dl) => {
                              const badge = deadlineTypeBadgeColor(dl.type);
                              const days = daysUntil(dl.date);
                              return (
                                <span key={dl.type + dl.date} style={{ padding: "4px 10px", background: badge.bg, color: badge.text, borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                                  {dl.type}: {formatDate(dl.date)} {days >= 0 ? `(${days}d)` : "(past)"}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                          {[
                            { key: "email30" as keyof AlertPrefs, label: "📧 Email", sub: "30 days" },
                            { key: "email7" as keyof AlertPrefs, label: "📧 Email", sub: "7 days" },
                            { key: "email1" as keyof AlertPrefs, label: "📧 Email", sub: "1 day" },
                            { key: "sms30" as keyof AlertPrefs, label: "💬 SMS", sub: "30 days" },
                            { key: "sms7" as keyof AlertPrefs, label: "💬 SMS", sub: "7 days" },
                            { key: "sms1" as keyof AlertPrefs, label: "💬 SMS", sub: "1 day" },
                          ].map(({ key, label, sub }) => (
                            <label
                              key={key}
                              onClick={() => updateAlertPref(id, key, !prefs[key])}
                              style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", padding: "10px 12px", background: prefs[key] ? "#eff6ff" : "#f9fafb", borderRadius: "10px", border: `2px solid ${prefs[key] ? "#bfdbfe" : "#e5e7eb"}`, transition: "all 0.2s" }}
                            >
                              <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${prefs[key] ? "#2563eb" : "#d1d5db"}`, background: prefs[key] ? "#2563eb" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {prefs[key] && <span style={{ color: "white", fontSize: "10px" }}>✓</span>}
                              </div>
                              <div>
                                <div style={{ fontSize: "12px", fontWeight: "600", color: prefs[key] ? "#1d4ed8" : "#374151" }}>{label}</div>
                                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{sub} before</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* PROFILE VIEW */}
          {view === "profile" && (
            <>
              <div style={{ marginBottom: "32px" }}>
                <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e3a5f", margin: "0 0 8px 0" }}>👤 Your Profile</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "2px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#1e3a5f", fontWeight: "700" }}>Account Info</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>Email Address</label>
                      <div style={{ padding: "12px 14px", background: "#f8fafc", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", color: "#374151" }}>{userEmail}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", display: "block", marginBottom: "6px" }}>Phone Number (for SMS)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                      />
                      <button
                        onClick={() => { localStorage.setItem("edutracker_phone", phone); alert("Phone number saved!"); }}
                        style={{ marginTop: "10px", padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                      >
                        Save Phone Number
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "2px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#1e3a5f", fontWeight: "700" }}>My Schools ({selectedColleges.length})</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto" }}>
                    {selectedColleges.map((id) => {
                      const c = COLLEGES.find((x) => x.id === id);
                      return c ? (
                        <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                          <div>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e3a5f" }}>{c.name}</div>
                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>{c.location}</div>
                          </div>
                          <button
                            onClick={() => {
                              const updated = selectedColleges.filter((x) => x !== id);
                              setSelectedColleges(updated);
                              localStorage.setItem("edutracker_colleges", JSON.stringify(updated));
                            }}
                            style={{ padding: "4px 10px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null;
                    })}
                    {selectedColleges.length === 0 && <p style={{ color: "#9ca3af", fontSize: "14px" }}>No schools added yet.</p>}
                  </div>
                  <button
                    onClick={() => { setOnboardingStep(0); setView("onboarding"); }}
                    style={{ marginTop: "16px", padding: "10px 20px", background: "#eff6ff", color: "#2563eb", border: "2px solid #bfdbfe", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                  >
                    + Add More Schools
                  </button>
                </div>

                <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "2px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <h3 style={{ margin: "0 0 20px 0", color: "#1e3a5f", fontWeight: "700" }}>Alert Summary</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { label: "Due today", value: upcomingDeadlines.filter((d) => d.daysUntil === 0).length, color: "#ef4444" },
                      { label: "Due tomorrow", value: upcomingDeadlines.filter((d) => d.daysUntil === 1).length, color: "#f97316" },
                      { label: "Due in 7 days", value: upcomingDeadlines.filter((d) => d.daysUntil > 1 && d.daysUntil <= 7).length, color: "#f97316" },
                      { label: "Due in 30 days", value: upcomingDeadlines.filter((d) => d.daysUntil > 7 && d.daysUntil <= 30).length, color: "#eab308" },
                      { label: "Due after 30 days", value: upcomingDeadlines.filter((d) => d.daysUntil > 30).length, color: "#22c55e" },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px" }}>
                        <span style={{ fontSize: "14px", color: "#374151" }}>{item.label}</span>
                        <span style={{ fontWeight: "700", color: item.color, fontSize: "18px" }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ marginTop: "20px", width: "100%", padding: "12px", background: "#fef2f2", color: "#dc2626", border: "2px solid #fecaca", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}