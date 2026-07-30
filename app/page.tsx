"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College } from "../lib/colleges";

interface User {
  email: string;
}

interface TrackedSchool {
  id: string;
  college_id: string;
  college_name: string;
  deadline_type: string;
  deadline_date: string;
  notes: string;
}

type AuthMode = "login" | "signup";
type AppView = "dashboard" | "search" | "auth";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): { bg: string; text: string; border: string; label: string } {
  if (days < 0) return { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db", label: "Past" };
  if (days <= 14) return { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5", label: "Urgent" };
  if (days <= 30) return { bg: "#fffbeb", text: "#d97706", border: "#fcd34d", label: "Soon" };
  return { bg: "#f0fdf4", text: "#16a34a", border: "#86efac", label: "Plenty of time" };
}

function DeadlineBadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  const { bg, text, border, label } = urgencyColor(days);
  return (
    <span style={{
      background: bg, color: text, border: `1px solid ${border}`,
      borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
    }}>
      {days < 0 ? "Passed" : days === 0 ? "Today!" : `${days}d — ${label}`}
    </span>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>("dashboard");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [trackedSchools, setTrackedSchools] = useState<TrackedSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [addingSchool, setAddingSchool] = useState<string | null>(null);
  const [addDeadlineType, setAddDeadlineType] = useState<Record<string, string>>({});
  const [addNote, setAddNote] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState("");

  const [dashFilter, setDashFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [dashSort, setDashSort] = useState<"date" | "name">("date");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const fetchTrackedSchools = useCallback(async (email: string) => {
    setLoadingSchools(true);
    try {
      const res = await fetch(`/api/schools?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.schools) setTrackedSchools(data.schools);
    } catch { /* ignore */ }
    setLoadingSchools(false);
  }, []);

  useEffect(() => {
    if (user) fetchTrackedSchools(user.email);
  }, [user, fetchTrackedSchools]);

  const handleAuth = async (e: React.FormEvent) => {
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
      if (data.ok) {
        const u = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
        setView("dashboard");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    setTrackedSchools([]);
    localStorage.removeItem("edutracker_user");
    setView("dashboard");
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const lower = q.toLowerCase();
    const results = COLLEGES.filter(c =>
      c.name.toLowerCase().includes(lower) ||
      c.location.toLowerCase().includes(lower) ||
      c.type.toLowerCase().includes(lower)
    ).slice(0, 40);
    setSearchResults(results);
  };

  const handleAddSchool = async (college: College, deadlineType: string) => {
    if (!user) { setView("auth"); setAuthMode("login"); return; }
    const deadline = college.deadlines[deadlineType as keyof typeof college.deadlines];
    if (!deadline) return;
    setAddingSchool(college.id + deadlineType);
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          college_id: college.id,
          college_name: college.name,
          deadline_type: deadlineType,
          deadline_date: deadline,
          notes: addNote[college.id] || "",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccessMsg(`Added ${college.name} (${deadlineType})!`);
        setTimeout(() => setSuccessMsg(""), 3000);
        await fetchTrackedSchools(user.email);
      }
    } catch { /* ignore */ }
    setAddingSchool(null);
  };

  const handleRemoveSchool = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/schools?id=${id}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
      setTrackedSchools(prev => prev.filter(s => s.id !== id));
    } catch { /* ignore */ }
  };

  const isTracked = (collegeId: string, type: string) =>
    trackedSchools.some(s => s.college_id === collegeId && s.deadline_type === type);

  const sortedDashboard = [...trackedSchools]
    .filter(s => {
      const d = daysUntil(s.deadline_date);
      if (dashFilter === "upcoming") return d >= 0;
      if (dashFilter === "past") return d < 0;
      return true;
    })
    .sort((a, b) => {
      if (dashSort === "date") return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      return a.college_name.localeCompare(b.college_name);
    });

  const DEADLINE_TYPES = ["EA", "ED", "ED2", "RD", "Scholarship"];
  const DEADLINE_LABELS: Record<string, string> = {
    EA: "Early Action", ED: "Early Decision", ED2: "Early Decision II",
    RD: "Regular Decision", Scholarship: "Scholarship"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)",
        color: "white", padding: "0 24px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎓</span>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>Edutracker</span>
            <span style={{ fontSize: 13, opacity: 0.7, marginLeft: 4 }}>College Deadline Tracker</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setView("dashboard")} style={{
              background: view === "dashboard" ? "rgba(255,255,255,0.2)" : "transparent",
              color: "white", border: "none", borderRadius: 8, padding: "8px 16px",
              cursor: "pointer", fontWeight: 600, fontSize: 14
            }}>📋 Dashboard</button>
            <button onClick={() => setView("search")} style={{
              background: view === "search" ? "rgba(255,255,255,0.2)" : "transparent",
              color: "white", border: "none", borderRadius: 8, padding: "8px 16px",
              cursor: "pointer", fontWeight: 600, fontSize: 14
            }}>🔍 Find Schools</button>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
                <span style={{ fontSize: 13, opacity: 0.8 }}>👤 {user.email}</span>
                <button onClick={handleLogout} style={{
                  background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13
                }}>Logout</button>
              </div>
            ) : (
              <button onClick={() => { setView("auth"); setAuthMode("login"); }} style={{
                background: "white", color: "#1e3a5f", border: "none", borderRadius: 8,
                padding: "8px 18px", cursor: "pointer", fontWeight: 700, fontSize: 14, marginLeft: 8
              }}>Sign In</button>
            )}
          </nav>
        </div>
      </header>

      {successMsg && (
        <div style={{
          position: "fixed", top: 80, right: 24, background: "#16a34a", color: "white",
          padding: "12px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 200
        }}>✅ {successMsg}</div>
      )}

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* AUTH VIEW */}
        {view === "auth" && (
          <div style={{ maxWidth: 420, margin: "40px auto" }}>
            <div style={{
              background: "white", borderRadius: 16, padding: 40,
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)"
            }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 26, fontWeight: 800, color: "#1e3a5f" }}>
                {authMode === "login" ? "Welcome back" : "Create account"}
              </h2>
              <p style={{ margin: "0 0 28px", color: "#6b7280", fontSize: 15 }}>
                {authMode === "login" ? "Sign in to see your tracked deadlines." : "Start tracking your college deadlines."}
              </p>
              <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Email</label>
                  <input
                    type="email" required value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb",
                      borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box",
                      transition: "border-color 0.2s"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6, color: "#374151", fontSize: 14 }}>Password</label>
                  <input
                    type="password" required value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb",
                      borderRadius: 8, fontSize: 15, outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
                {authError && (
                  <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 14 }}>
                    ⚠️ {authError}
                  </div>
                )}
                <button type="submit" disabled={authLoading} style={{
                  background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)", color: "white",
                  border: "none", borderRadius: 10, padding: "12px", fontSize: 16, fontWeight: 700,
                  cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1
                }}>
                  {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#6b7280" }}>
                {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                  style={{ background: "none", border: "none", color: "#2d6a9f", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                  {authMode === "login" ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800, color: "#1e3a5f" }}>
                My Application Dashboard
              </h1>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 16 }}>
                {user ? `Tracking ${trackedSchools.length} deadline${trackedSchools.length !== 1 ? "s" : ""}` : "Sign in to save your school list across devices."}
              </p>
            </div>

            {!user && (
              <div style={{
                background: "linear-gradient(135deg, #eff6ff, #dbeafe)", border: "1px solid #93c5fd",
                borderRadius: 12, padding: 24, marginBottom: 28, display: "flex",
                alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16
              }}>
                <div>
                  <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#1e40af", fontSize: 16 }}>💡 Save your progress</p>
                  <p style={{ margin: 0, color: "#3b82f6", fontSize: 14 }}>Create a free account to keep your deadlines synced.</p>
                </div>
                <button onClick={() => { setView("auth"); setAuthMode("signup"); }} style={{
                  background: "#1e40af", color: "white", border: "none", borderRadius: 8,
                  padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 15
                }}>Get Started Free</button>
              </div>
            )}

            {/* Urgency Legend */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {[
                { label: "🔴 Urgent (< 14 days)", bg: "#fef2f2", text: "#dc2626", border: "#fca5a5" },
                { label: "🟡 Soon (< 30 days)", bg: "#fffbeb", text: "#d97706", border: "#fcd34d" },
                { label: "🟢 Plenty of time (30+ days)", bg: "#f0fdf4", text: "#16a34a", border: "#86efac" },
              ].map(c => (
                <span key={c.label} style={{
                  background: c.bg, color: c.text, border: `1px solid ${c.border}`,
                  borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600
                }}>{c.label}</span>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 600 }}>Filter:</span>
              {(["upcoming", "past", "all"] as const).map(f => (
                <button key={f} onClick={() => setDashFilter(f)} style={{
                  background: dashFilter === f ? "#1e3a5f" : "white",
                  color: dashFilter === f ? "white" : "#374151",
                  border: "2px solid " + (dashFilter === f ? "#1e3a5f" : "#e5e7eb"),
                  borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontWeight: 600,
                  fontSize: 13, textTransform: "capitalize"
                }}>{f}</button>
              ))}
              <span style={{ color: "#6b7280", fontSize: 14, fontWeight: 600, marginLeft: 8 }}>Sort:</span>
              {(["date", "name"] as const).map(s => (
                <button key={s} onClick={() => setDashSort(s)} style={{
                  background: dashSort === s ? "#1e3a5f" : "white",
                  color: dashSort === s ? "white" : "#374151",
                  border: "2px solid " + (dashSort === s ? "#1e3a5f" : "#e5e7eb"),
                  borderRadius: 8, padding: "6px 16px", cursor: "pointer", fontWeight: 600,
                  fontSize: 13, textTransform: "capitalize"
                }}>{s === "date" ? "📅 Date" : "🔤 Name"}</button>
              ))}
            </div>

            {loadingSchools ? (
              <div style={{ textAlign: "center", padding: 60, color: "#6b7280", fontSize: 18 }}>
                ⏳ Loading your schools...
              </div>
            ) : sortedDashboard.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 40px", background: "white",
                borderRadius: 16, border: "2px dashed #e5e7eb"
              }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
                <h3 style={{ margin: "0 0 8px", color: "#374151", fontSize: 20 }}>No deadlines yet</h3>
                <p style={{ margin: "0 0 24px", color: "#9ca3af", fontSize: 15 }}>
                  {dashFilter !== "all" ? `No ${dashFilter} deadlines. Try changing the filter.` : "Go to 'Find Schools' to add colleges to your tracker."}
                </p>
                <button onClick={() => setView("search")} style={{
                  background: "#1e3a5f", color: "white", border: "none", borderRadius: 10,
                  padding: "12px 28px", cursor: "pointer", fontWeight: 700, fontSize: 15
                }}>🔍 Find Schools</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sortedDashboard.map(school => {
                  const days = daysUntil(school.deadline_date);
                  const { bg, border } = urgencyColor(days);
                  return (
                    <div key={school.id} style={{
                      background: bg, border: `2px solid ${border}`,
                      borderRadius: 14, padding: "18px 24px",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap", gap: 12, transition: "transform 0.1s"
                    }}>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 800, fontSize: 18, color: "#1e3a5f", marginBottom: 4 }}>
                          {school.college_name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{
                            background: "#1e3a5f", color: "white", borderRadius: 6,
                            padding: "2px 10px", fontSize: 12, fontWeight: 700
                          }}>{school.deadline_type}</span>
                          <span style={{ color: "#6b7280", fontSize: 14 }}>
                            📅 {new Date(school.deadline_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                          </span>
                          {school.notes && <span style={{ color: "#9ca3af", fontSize: 13 }}>📝 {school.notes}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <DeadlineBadge dateStr={school.deadline_date} />
                        <button onClick={() => handleRemoveSchool(school.id)} style={{
                          background: "none", border: "1px solid #fca5a5", color: "#ef4444",
                          borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600
                        }}>✕ Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SEARCH VIEW */}
        {view === "search" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 8px", fontSize: 32, fontWeight: 800, color: "#1e3a5f" }}>Find Schools</h1>
              <p style={{ margin: 0, color: "#6b7280", fontSize: 16 }}>Search 200 top US colleges and add their deadlines to your tracker.</p>
            </div>

            <div style={{ position: "relative", marginBottom: 28 }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 20 }}>🔍</span>
              <input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by school name, state, or type (e.g. 'Harvard', 'California', 'Liberal Arts')..."
                style={{
                  width: "100%", padding: "14px 16px 14px 48px", border: "2px solid #e5e7eb",
                  borderRadius: 12, fontSize: 16, outline: "none", boxSizing: "border-box",
                  background: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#9ca3af" }}>✕</button>
              )}
            </div>

            {!searchQuery && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
                <p style={{ fontSize: 16 }}>Start typing to search {COLLEGES.length} colleges</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ margin: "0 0 8px", color: "#6b7280", fontSize: 14 }}>
                  Found {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
                {searchResults.map(college => (
                  <div key={college.id} style={{
                    background: "white", borderRadius: 14, border: "2px solid #e5e7eb",
                    padding: "20px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "#1e3a5f" }}>{college.name}</h3>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ color: "#6b7280", fontSize: 14 }}>📍 {college.location}</span>
                          <span style={{ background: "#eff6ff", color: "#1d4ed8", borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 600 }}>{college.type}</span>
                          {college.ranking && <span style={{ background: "#fef3c7", color: "#92400e", borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 600 }}>#{college.ranking} Ranked</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                      {DEADLINE_TYPES.map(type => {
                        const deadline = college.deadlines[type as keyof typeof college.deadlines];
                        if (!deadline) return null;
                        const tracked = isTracked(college.id, type);
                        const isAdding = addingSchool === college.id + type;
                        const days = daysUntil(deadline);
                        const { bg, text, border } = urgencyColor(days);
                        return (
                          <div key={type} style={{
                            background: tracked ? "#f0fdf4" : bg,
                            border: `2px solid ${tracked ? "#86efac" : border}`,
                            borderRadius: 10, padding: "12px 14px"
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: "#1e3a5f" }}>{DEADLINE_LABELS[type]}</span>
                              {tracked && <span style={{ color: "#16a34a", fontSize: 12, fontWeight: 700 }}>✓ Added</span>}
                            </div>
                            <div style={{ color: "#374151", fontSize: 13, marginBottom: 8 }}>
                              {new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <DeadlineBadge dateStr={deadline} />
                            </div>
                            {!tracked && (
                              <button
                                onClick={() => handleAddSchool(college, type)}
                                disabled={isAdding}
                                style={{
                                  width: "100%", background: isAdding ? "#e5e7eb" : "#1e3a5f",
                                  color: isAdding ? "#6b7280" : "white", border: "none", borderRadius: 7,
                                  padding: "7px 0", cursor: isAdding ? "not-allowed" : "pointer",
                                  fontWeight: 700, fontSize: 13
                                }}
                              >
                                {isAdding ? "Adding..." : "+ Track"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
                <p style={{ fontSize: 16 }}>No colleges found for &quot;{searchQuery}&quot;</p>
                <p style={{ fontSize: 14 }}>Try searching by state or school type</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}