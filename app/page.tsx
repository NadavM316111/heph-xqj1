"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES } from "../lib/colleges";

interface User {
  email: string;
}

interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  ea?: string;
  ed?: string;
  ed2?: string;
  rd: string;
  scholarship?: string;
  website: string;
}

interface Deadline {
  collegeId: string;
  collegeName: string;
  type: string;
  date: string;
  daysRemaining: number;
}

type Tab = "dashboard" | "schools" | "reminders";

function getDaysRemaining(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DeadlineBadge({ days }: { days: number }) {
  let bg = "#22c55e";
  let text = "white";
  if (days < 0) { bg = "#6b7280"; }
  else if (days <= 7) { bg = "#ef4444"; }
  else if (days <= 14) { bg = "#f97316"; }
  else if (days <= 30) { bg = "#eab308"; text = "#1f2937"; }

  return (
    <span style={{
      background: bg, color: text, borderRadius: 12, padding: "2px 10px",
      fontSize: 12, fontWeight: 700, whiteSpace: "nowrap"
    }}>
      {days < 0 ? "Passed" : days === 0 ? "TODAY" : `${days}d left`}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "EA": "#6366f1", "ED": "#7c3aed", "ED2": "#a21caf",
    "RD": "#0ea5e9", "Scholarship": "#f59e0b"
  };
  return (
    <span style={{
      background: colors[type] || "#6b7280", color: "white",
      borderRadius: 8, padding: "1px 8px", fontSize: 11, fontWeight: 700
    }}>
      {type}
    </span>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [savedSchools, setSavedSchools] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState("");

  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderStatus, setReminderStatus] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [existingReminders, setExistingReminders] = useState<Array<{ college_id: string; deadline_type: string; days_before: number }>>([]);

  const [deadlineFilter, setDeadlineFilter] = useState("upcoming");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    const storedSchools = localStorage.getItem("edutracker_schools");
    if (storedSchools) {
      try {
        const parsed = JSON.parse(storedSchools);
        setSelectedSchools(parsed);
        setSavedSchools(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const loadReminders = useCallback(async (userEmail: string) => {
    try {
      const res = await fetch(`/api/reminders?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setExistingReminders(data.reminders || []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (user) {
      setReminderEmail(user.email);
      loadReminders(user.email);
    }
  }, [user, loadReminders]);

  const handleAuth = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password })
      });
      const data = await res.json();
      if (data.ok) {
        const u = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
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
    localStorage.removeItem("edutracker_user");
  };

  const toggleSchool = (id: string) => {
    setSelectedSchools(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      if (prev.length >= 20) return prev;
      return [...prev, id];
    });
  };

  const saveSchools = () => {
    localStorage.setItem("edutracker_schools", JSON.stringify(selectedSchools));
    setSavedSchools([...selectedSchools]);
    setSaveStatus("Saved!");
    setTimeout(() => setSaveStatus(""), 2000);
  };

  const getDeadlines = (): Deadline[] => {
    const deadlines: Deadline[] = [];
    savedSchools.forEach(id => {
      const college = COLLEGES.find(c => c.id === id);
      if (!college) return;
      const add = (type: string, date: string | undefined) => {
        if (!date) return;
        deadlines.push({
          collegeId: id,
          collegeName: college.name,
          type,
          date,
          daysRemaining: getDaysRemaining(date)
        });
      };
      add("EA", college.ea);
      add("ED", college.ed);
      add("ED2", college.ed2);
      add("RD", college.rd);
      add("Scholarship", college.scholarship);
    });
    deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return deadlines;
  };

  const scheduleReminders = async () => {
    if (!reminderEmail) return;
    setReminderLoading(true);
    setReminderStatus("");
    try {
      const deadlines: Array<{ collegeId: string; collegeName: string; type: string; date: string }> = [];
      savedSchools.forEach(id => {
        const college = COLLEGES.find(c => c.id === id);
        if (!college) return;
        const add = (type: string, date: string | undefined) => {
          if (date && getDaysRemaining(date) > 0) {
            deadlines.push({ collegeId: id, collegeName: college.name, type, date });
          }
        };
        add("EA", college.ea);
        add("ED", college.ed);
        add("ED2", college.ed2);
        add("RD", college.rd);
        add("Scholarship", college.scholarship);
      });

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reminderEmail, deadlines })
      });
      const data = await res.json();
      if (data.ok) {
        setReminderStatus(`✅ ${data.count} reminders scheduled at 30, 14, and 7 days before each deadline.`);
        loadReminders(reminderEmail);
      } else {
        setReminderStatus("❌ " + (data.error || "Failed to schedule reminders"));
      }
    } catch {
      setReminderStatus("❌ Network error");
    }
    setReminderLoading(false);
  };

  const filteredColleges = COLLEGES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    if (filterType === "All") return matchSearch;
    if (filterType === "EA") return matchSearch && !!c.ea;
    if (filterType === "ED") return matchSearch && !!c.ed;
    if (filterType === "Public") return matchSearch && c.type === "Public";
    if (filterType === "Private") return matchSearch && c.type === "Private";
    return matchSearch;
  });

  const allDeadlines = getDeadlines();
  const visibleDeadlines = deadlineFilter === "upcoming"
    ? allDeadlines.filter(d => d.daysRemaining >= 0)
    : allDeadlines;

  const nextDeadline = allDeadlines.find(d => d.daysRemaining >= 0);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ background: "white", borderRadius: 20, padding: 40, width: "100%", maxWidth: 420, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#1e1b4b" }}>Edutracker</h1>
            <p style={{ margin: "8px 0 0", color: "#6b7280", fontSize: 14 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setAuthMode(m)} style={{
                flex: 1, padding: "8px 0", border: "none", borderRadius: 8, cursor: "pointer",
                fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                background: authMode === m ? "white" : "transparent",
                color: authMode === m ? "#6366f1" : "#6b7280",
                boxShadow: authMode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
              }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                onKeyDown={e => e.key === "Enter" && handleAuth()}
              />
            </div>
            {authError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13 }}>{authError}</div>}
            <button onClick={handleAuth} disabled={authLoading}
              style={{ padding: "12px", background: authLoading ? "#a5b4fc" : "#6366f1", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: authLoading ? "not-allowed" : "pointer" }}>
              {authLoading ? "Loading..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "#9ca3af" }}>
            Track deadlines for 200 top US colleges
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎓</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>Edutracker</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>College Deadline Tracker</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, opacity: 0.9 }}>👤 {user.email}</span>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "white", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 0 }}>
          {([
            { id: "dashboard", label: "📊 Dashboard", count: visibleDeadlines.length },
            { id: "schools", label: "🏫 Schools", count: selectedSchools.length },
            { id: "reminders", label: "🔔 Reminders", count: existingReminders.length }
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "16px 20px", border: "none", background: "transparent", cursor: "pointer",
              fontWeight: tab === t.id ? 700 : 500, color: tab === t.id ? "#6366f1" : "#6b7280",
              borderBottom: tab === t.id ? "3px solid #6366f1" : "3px solid transparent",
              fontSize: 14, display: "flex", alignItems: "center", gap: 6
            }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ background: tab === t.id ? "#6366f1" : "#e5e7eb", color: tab === t.id ? "white" : "#6b7280", borderRadius: 10, padding: "1px 7px", fontSize: 11 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px" }}>

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #6366f1" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#6366f1" }}>{savedSchools.length}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Schools Selected</div>
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #f97316" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#f97316" }}>{allDeadlines.filter(d => d.daysRemaining >= 0 && d.daysRemaining <= 30).length}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Due in 30 Days</div>
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #ef4444" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#ef4444" }}>{allDeadlines.filter(d => d.daysRemaining >= 0 && d.daysRemaining <= 7).length}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Due in 7 Days</div>
              </div>
              <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", borderLeft: "4px solid #22c55e" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#22c55e" }}>{nextDeadline ? nextDeadline.daysRemaining : "—"}</div>
                <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>Days to Next Deadline</div>
              </div>
            </div>

            {savedSchools.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: 48, textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
                <h2 style={{ margin: "0 0 8px", color: "#1e1b4b" }}>No schools selected yet</h2>
                <p style={{ color: "#6b7280", margin: "0 0 20px" }}>Head to the Schools tab to add up to 20 target colleges</p>
                <button onClick={() => setTab("schools")} style={{ background: "#6366f1", color: "white", border: "none", padding: "12px 24px", borderRadius: 10, cursor: "pointer", fontWeight: 600 }}>
                  Browse Schools →
                </button>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#1e1b4b" }}>Upcoming Deadlines</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["upcoming", "all"].map(f => (
                      <button key={f} onClick={() => setDeadlineFilter(f)} style={{
                        padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                        background: deadlineFilter === f ? "#6366f1" : "#f3f4f6",
                        color: deadlineFilter === f ? "white" : "#6b7280"
                      }}>
                        {f === "upcoming" ? "Upcoming" : "All"}
                      </button>
                    ))}
                  </div>
                </div>
                {visibleDeadlines.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div>No upcoming deadlines found</div>
                  </div>
                ) : (
                  <div>
                    {visibleDeadlines.map((d, i) => (
                      <div key={`${d.collegeId}-${d.type}`} style={{
                        padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: i < visibleDeadlines.length - 1 ? "1px solid #f3f4f6" : "none",
                        background: d.daysRemaining >= 0 && d.daysRemaining <= 7 ? "#fff7f7" : "white",
                        flexWrap: "wrap", gap: 8
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {d.collegeName}
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{formatDate(d.date)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <TypeBadge type={d.type} />
                          <DeadlineBadge days={d.daysRemaining} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* SCHOOLS TAB */}
        {tab === "schools" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Search Schools</h2>
                <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 13 }}>Select up to 20 target colleges ({selectedSchools.length}/20 selected)</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {selectedSchools.length !== savedSchools.length && (
                  <button onClick={saveSchools} style={{ background: "#6366f1", color: "white", border: "none", padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
                    Save Changes {saveStatus && `— ${saveStatus}`}
                  </button>
                )}
                {saveStatus && <span style={{ color: "#22c55e", alignSelf: "center", fontWeight: 600 }}>{saveStatus}</span>}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search by name or location..."
                style={{ flex: 1, minWidth: 240, padding: "10px 16px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }}
              />
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                style={{ padding: "10px 16px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "white", cursor: "pointer" }}>
                <option value="All">All Types</option>
                <option value="EA">Has EA</option>
                <option value="ED">Has ED</option>
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {filteredColleges.map(college => {
                const selected = selectedSchools.includes(college.id);
                const canAdd = selectedSchools.length < 20;
                return (
                  <div key={college.id} onClick={() => { if (selected || canAdd) toggleSchool(college.id); }}
                    style={{
                      background: selected ? "#f0f0ff" : "white",
                      border: selected ? "2px solid #6366f1" : "2px solid #e5e7eb",
                      borderRadius: 12, padding: 16, cursor: (selected || canAdd) ? "pointer" : "not-allowed",
                      transition: "all 0.15s", opacity: !selected && !canAdd ? 0.5 : 1,
                      boxShadow: selected ? "0 2px 8px rgba(99,102,241,0.15)" : "0 1px 2px rgba(0,0,0,0.05)"
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, marginRight: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", lineHeight: 1.3 }}>{college.name}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{college.location} · {college.type}</div>
                      </div>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", border: selected ? "none" : "2px solid #d1d5db",
                        background: selected ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        {selected && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                      {college.ea && <span style={{ background: "#eef2ff", color: "#6366f1", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>EA {college.ea}</span>}
                      {college.ed && <span style={{ background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>ED {college.ed}</span>}
                      {college.ed2 && <span style={{ background: "#fdf4ff", color: "#a21caf", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>ED2 {college.ed2}</span>}
                      <span style={{ background: "#eff6ff", color: "#0ea5e9", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>RD {college.rd}</span>
                      {college.scholarship && <span style={{ background: "#fffbeb", color: "#d97706", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>💰 {college.scholarship}</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredColleges.length === 0 && (
              <div style={{ textAlign: "center", padding: 48, color: "#6b7280" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div>No colleges found for "{search}"</div>
              </div>
            )}

            {selectedSchools.some(id => !savedSchools.includes(id)) || savedSchools.some(id => !selectedSchools.includes(id)) ? (
              <div style={{ position: "fixed", bottom: 24, right: 24, background: "#6366f1", color: "white", borderRadius: 12, padding: "14px 20px", boxShadow: "0 8px 24px rgba(99,102,241,0.4)", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedSchools.length} schools selected</span>
                <button onClick={saveSchools} style={{ background: "white", color: "#6366f1", border: "none", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  Save
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* REMINDERS TAB */}
        {tab === "reminders" && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#1e1b4b" }}>Email Reminders</h2>
            <p style={{ margin: "0 0 24px", color: "#6b7280", fontSize: 14 }}>
              Schedule automated reminders at 30, 14, and 7 days before each deadline for your selected schools.
            </p>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>Schedule Reminders</h3>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <input
                  type="email" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)}
                  placeholder="Email address"
                  style={{ flex: 1, minWidth: 220, padding: "10px 16px", border: "2px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }}
                />
                <button onClick={scheduleReminders} disabled={reminderLoading || savedSchools.length === 0}
                  style={{
                    padding: "10px 20px", background: (reminderLoading || savedSchools.length === 0) ? "#a5b4fc" : "#6366f1",
                    color: "white", border: "none", borderRadius: 10, cursor: (reminderLoading || savedSchools.length === 0) ? "not-allowed" : "pointer",
                    fontWeight: 600, fontSize: 14, whiteSpace: "nowrap"
                  }}>
                  {reminderLoading ? "Scheduling..." : "📬 Schedule All Reminders"}
                </button>
              </div>
              {savedSchools.length === 0 && (
                <p style={{ margin: "10px 0 0", color: "#f97316", fontSize: 13 }}>⚠️ Save at least one school first</p>
              )}
              {reminderStatus && (
                <div style={{ marginTop: 14, padding: "12px 16px", background: reminderStatus.startsWith("✅") ? "#f0fdf4" : "#fef2f2", borderRadius: 10, fontSize: 14, color: reminderStatus.startsWith("✅") ? "#166534" : "#dc2626" }}>
                  {reminderStatus}
                </div>
              )}
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>How Reminders Work</h3>
              <p style={{ margin: "0 0 16px", color: "#6b7280", fontSize: 13 }}>Reminders are scheduled in the database and sent before each upcoming deadline:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { days: 30, color: "#eab308", label: "30 days before", desc: "Early heads-up to start your application" },
                  { days: 14, color: "#f97316", label: "14 days before", desc: "Time to finalize essays and materials" },
                  { days: 7, color: "#ef4444", label: "7 days before", desc: "Final week reminder — submit soon!" },
                ].map(r => (
                  <div key={r.days} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#f8fafc", borderRadius: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: r.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                      {r.days}d
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{r.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {existingReminders.length > 0 && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>
                  Scheduled Reminders ({existingReminders.length})
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                  {existingReminders.map((r, i) => {
                    const college = COLLEGES.find(c => c.id === r.college_id);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{college?.name || r.college_id}</span>
                          <span style={{ margin: "0 6px", color: "#d1d5db" }}>·</span>
                          <TypeBadge type={r.deadline_type} />
                        </div>
                        <span style={{ fontSize: 12, color: "#6b7280", background: "#e5e7eb", padding: "2px 8px", borderRadius: 6 }}>
                          {r.days_before}d before
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}