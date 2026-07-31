"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: number;
  name: string;
  location: string;
  added_at: string;
}

interface Deadline {
  id: number;
  college_id: number;
  college_name: string;
  college_location: string;
  deadline_type: "Early Decision" | "Early Action" | "Regular Decision" | "Early Decision II";
  deadline_date: string;
  notes: string;
  days_remaining: number;
}

type View = "dashboard" | "add-college" | "add-deadline" | "auth";
type AuthMode = "login" | "signup";

const DEADLINE_TYPES = ["Early Decision", "Early Decision II", "Early Action", "Regular Decision"] as const;

function getDaysRemaining(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number): { bg: string; border: string; badge: string; text: string; label: string } {
  if (days < 0) return { bg: "#f8f8f8", border: "#d1d5db", badge: "#6b7280", text: "#6b7280", label: "Passed" };
  if (days <= 7) return { bg: "#fff5f5", border: "#fc8181", badge: "#e53e3e", text: "#c53030", label: "Critical" };
  if (days <= 30) return { bg: "#fffbeb", border: "#f6ad55", badge: "#dd6b20", text: "#c05621", label: "Soon" };
  return { bg: "#f0fff4", border: "#68d391", badge: "#38a169", text: "#276749", label: "On Track" };
}

function getTypeColor(type: string): string {
  switch (type) {
    case "Early Decision": return "#7c3aed";
    case "Early Decision II": return "#9333ea";
    case "Early Action": return "#2563eb";
    case "Regular Decision": return "#0891b2";
    default: return "#6b7280";
  }
}

export default function Home() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>("auth");
  const [colleges, setColleges] = useState<College[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Add College
  const [collegeSearch, setCollegeSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ name: string; location: string }[]>([]);
  const [manualCollegeName, setManualCollegeName] = useState("");
  const [manualCollegeLocation, setManualCollegeLocation] = useState("");
  const [addingCollege, setAddingCollege] = useState(false);

  // Add Deadline
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [deadlineType, setDeadlineType] = useState<string>(DEADLINE_TYPES[0]);
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineNotes, setDeadlineNotes] = useState("");
  const [addingDeadline, setAddingDeadline] = useState(false);

  // Filter/Sort
  const [filterType, setFilterType] = useState("All");
  const [showPast, setShowPast] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Check session on load
  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        setView("dashboard");
      } catch {}
    }
  }, []);

  const fetchColleges = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/colleges?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.colleges) setColleges(data.colleges);
    } catch {}
  }, [user]);

  const fetchDeadlines = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/deadlines?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.deadlines) setDeadlines(data.deadlines);
    } catch {}
  }, [user]);

  useEffect(() => {
    if (user && view === "dashboard") {
      setLoading(true);
      Promise.all([fetchColleges(), fetchDeadlines()]).finally(() => setLoading(false));
    }
    if (user && view === "add-deadline") {
      fetchColleges();
    }
  }, [user, view, fetchColleges, fetchDeadlines]);

  // College search
  useEffect(() => {
    if (collegeSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const q = collegeSearch.toLowerCase();
    import("../lib/colleges").then((mod) => {
      const results = mod.COLLEGES.filter(
        (c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)
      ).slice(0, 8);
      setSearchResults(results);
    });
  }, [collegeSearch]);

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
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("edutracker_user");
    setView("auth");
    setColleges([]);
    setDeadlines([]);
  };

  const addCollegeFromSearch = async (college: { name: string; location: string }) => {
    if (!user) return;
    setAddingCollege(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: college.name, location: college.location }),
      });
      const data = await res.json();
      if (data.college) {
        showToast(`${college.name} added!`);
        setCollegeSearch("");
        setSearchResults([]);
        fetchColleges();
      } else {
        showToast(data.error || "Failed to add college", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setAddingCollege(false);
    }
  };

  const addManualCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !manualCollegeName.trim()) return;
    setAddingCollege(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, name: manualCollegeName.trim(), location: manualCollegeLocation.trim() }),
      });
      const data = await res.json();
      if (data.college) {
        showToast(`${manualCollegeName} added!`);
        setManualCollegeName("");
        setManualCollegeLocation("");
        fetchColleges();
      } else {
        showToast(data.error || "Failed to add college", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setAddingCollege(false);
    }
  };

  const addDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCollegeId || !deadlineDate) return;
    setAddingDeadline(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          college_id: parseInt(selectedCollegeId),
          deadline_type: deadlineType,
          deadline_date: deadlineDate,
          notes: deadlineNotes,
        }),
      });
      const data = await res.json();
      if (data.deadline) {
        showToast("Deadline added!");
        setSelectedCollegeId("");
        setDeadlineDate("");
        setDeadlineNotes("");
        setDeadlineType(DEADLINE_TYPES[0]);
        setView("dashboard");
      } else {
        showToast(data.error || "Failed to add deadline", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setAddingDeadline(false);
    }
  };

  const deleteDeadline = async (id: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/deadlines?id=${id}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setDeadlines((prev) => prev.filter((d) => d.id !== id));
        showToast("Deadline removed");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const deleteCollege = async (id: number, name: string) => {
    if (!user) return;
    if (!confirm(`Remove ${name} and all its deadlines?`)) return;
    try {
      const res = await fetch(`/api/colleges?id=${id}&email=${encodeURIComponent(user.email)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`${name} removed`);
        fetchColleges();
        fetchDeadlines();
      } else {
        showToast("Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const filteredDeadlines = deadlines
    .filter((d) => {
      const days = getDaysRemaining(d.deadline_date);
      if (!showPast && days < 0) return false;
      if (filterType !== "All" && d.deadline_type !== filterType) return false;
      return true;
    })
    .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  const stats = {
    total: deadlines.filter((d) => getDaysRemaining(d.deadline_date) >= 0).length,
    critical: deadlines.filter((d) => { const days = getDaysRemaining(d.deadline_date); return days >= 0 && days <= 7; }).length,
    soon: deadlines.filter((d) => { const days = getDaysRemaining(d.deadline_date); return days > 7 && days <= 30; }).length,
  };

  // ===== AUTH VIEW =====
  if (view === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", borderRadius: "20px", padding: "48px 40px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎓</div>
            <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1a202c", margin: "0 0 8px 0" }}>Edutracker</h1>
            <p style={{ color: "#718096", margin: 0, fontSize: "15px" }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f7fafc", borderRadius: "12px", padding: "4px", marginBottom: "28px" }}>
            {(["login", "signup"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setAuthMode(m); setAuthError(""); }}
                style={{
                  flex: 1, padding: "10px", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s",
                  background: authMode === m ? "white" : "transparent",
                  color: authMode === m ? "#667eea" : "#718096",
                  boxShadow: authMode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>Email</label>
              <input
                type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@school.edu"
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>Password</label>
              <input
                type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#667eea"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>
            {authError && (
              <div style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", color: "#c53030", fontSize: "14px" }}>
                {authError}
              </div>
            )}
            <button
              type="submit" disabled={authLoading}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: authLoading ? "not-allowed" : "pointer", opacity: authLoading ? 0.7 : 1, transition: "opacity 0.2s" }}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== MAIN APP =====
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.type === "success" ? "#276749" : "#c53030",
          color: "white", padding: "12px 20px", borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: "14px", fontWeight: "600",
          animation: "slideIn 0.3s ease",
        }}>
          {toast.type === "success" ? "✓ " : "✗ "}{toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🎓</span>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#1a202c" }}>Edutracker</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={() => setView("dashboard")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: view === "dashboard" ? "#ede9fe" : "transparent", color: view === "dashboard" ? "#7c3aed" : "#718096" }}>
              Dashboard
            </button>
            <button onClick={() => setView("add-college")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: view === "add-college" ? "#ede9fe" : "transparent", color: view === "add-college" ? "#7c3aed" : "#718096" }}>
              + College
            </button>
            <button onClick={() => setView("add-deadline")} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", background: view === "add-deadline" ? "#ede9fe" : "transparent", color: view === "add-deadline" ? "#7c3aed" : "#718096" }}>
              + Deadline
            </button>
            <div style={{ width: "1px", height: "24px", background: "#e2e8f0", margin: "0 4px" }} />
            <div style={{ fontSize: "13px", color: "#718096", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
            <button onClick={handleLogout} style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "13px", fontWeight: "600", background: "white", color: "#718096" }}>
              Logout
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a202c", margin: "0 0 6px 0" }}>Your Application Dashboard</h2>
              <p style={{ color: "#718096", margin: 0 }}>Track all your college application deadlines in one place</p>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
              {[
                { label: "Colleges Added", value: colleges.length, icon: "🏫", color: "#7c3aed", bg: "#ede9fe" },
                { label: "Upcoming", value: stats.total, icon: "📅", color: "#2563eb", bg: "#dbeafe" },
                { label: "Critical (≤7d)", value: stats.critical, icon: "🔴", color: "#dc2626", bg: "#fee2e2" },
                { label: "Soon (≤30d)", value: stats.soon, icon: "🟡", color: "#d97706", bg: "#fef3c7" },
              ].map((s) => (
                <div key={s.label} style={{ background: "white", borderRadius: "14px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${s.bg}` }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                  <div style={{ fontSize: "28px", fontWeight: "800", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "13px", color: "#718096", fontWeight: "600" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#4a5568" }}>Filter:</span>
              {["All", ...DEADLINE_TYPES].map((t) => (
                <button key={t} onClick={() => setFilterType(t)} style={{
                  padding: "6px 14px", borderRadius: "20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", transition: "all 0.2s",
                  background: filterType === t ? "#7c3aed" : "#e2e8f0",
                  color: filterType === t ? "white" : "#4a5568",
                }}>
                  {t}
                </button>
              ))}
              <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#4a5568", fontWeight: "600", cursor: "pointer" }}>
                <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} style={{ width: "16px", height: "16px" }} />
                Show past
              </label>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "60px", color: "#718096" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
                Loading your deadlines...
              </div>
            ) : filteredDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>📋</div>
                <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#4a5568", margin: "0 0 8px 0" }}>No deadlines yet</h3>
                <p style={{ color: "#718096", margin: "0 0 20px 0" }}>Add colleges and set their application deadlines to get started</p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button onClick={() => setView("add-college")} style={{ padding: "10px 20px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                    Add a College
                  </button>
                  {colleges.length > 0 && (
                    <button onClick={() => setView("add-deadline")} style={{ padding: "10px 20px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>
                      Add a Deadline
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredDeadlines.map((d) => {
                  const days = getDaysRemaining(d.deadline_date);
                  const urgency = getUrgencyColor(days);
                  const typeColor = getTypeColor(d.deadline_type);
                  return (
                    <div key={d.id} style={{
                      background: urgency.bg, border: `2px solid ${urgency.border}`, borderRadius: "14px",
                      padding: "20px 24px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap",
                      transition: "transform 0.15s", cursor: "default",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(4px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
                    >
                      {/* Days badge */}
                      <div style={{ minWidth: "80px", textAlign: "center" }}>
                        <div style={{ fontSize: "28px", fontWeight: "900", color: urgency.text, lineHeight: 1 }}>
                          {days < 0 ? "—" : days}
                        </div>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: urgency.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {days < 0 ? "passed" : days === 1 ? "day left" : "days left"}
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ width: "2px", height: "48px", background: urgency.border, flexShrink: 0 }} />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontSize: "17px", fontWeight: "800", color: "#1a202c" }}>{d.college_name}</span>
                          <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px", background: typeColor, color: "white" }}>
                            {d.deadline_type}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: "700", padding: "2px 10px", borderRadius: "20px", background: urgency.badge, color: "white" }}>
                            {urgency.label}
                          </span>
                        </div>
                        {d.college_location && (
                          <div style={{ fontSize: "13px", color: "#718096", marginBottom: d.notes ? "4px" : "0" }}>📍 {d.college_location}</div>
                        )}
                        {d.notes && <div style={{ fontSize: "13px", color: "#4a5568", fontStyle: "italic" }}>"{d.notes}"</div>}
                      </div>

                      {/* Date */}
                      <div style={{ textAlign: "right", minWidth: "110px" }}>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#2d3748" }}>
                          {new Date(d.deadline_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <button
                          onClick={() => deleteDeadline(d.id)}
                          style={{ marginTop: "8px", padding: "4px 10px", fontSize: "12px", background: "transparent", border: `1px solid ${urgency.border}`, borderRadius: "6px", cursor: "pointer", color: urgency.text, fontWeight: "600" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Colleges Section */}
            {colleges.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1a202c", margin: "0 0 16px 0" }}>Your Colleges ({colleges.length})</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "12px" }}>
                  {colleges.map((c) => (
                    <div key={c.id} style={{ background: "white", borderRadius: "12px", padding: "16px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a202c", marginBottom: "4px" }}>{c.name}</div>
                        {c.location && <div style={{ fontSize: "12px", color: "#718096" }}>{c.location}</div>}
                      </div>
                      <button onClick={() => deleteCollege(c.id, c.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e0", fontSize: "18px", lineHeight: 1, padding: "0 0 0 8px" }} title="Remove">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD COLLEGE */}
        {view === "add-college" && (
          <div style={{ maxWidth: "640px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a202c", margin: "0 0 6px 0" }}>Add a College</h2>
            <p style={{ color: "#718096", margin: "0 0 32px 0" }}>Search from our list or add any college manually</p>

            {/* Search */}
            <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0", marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a202c", margin: "0 0 16px 0" }}>🔍 Search Colleges</h3>
              <div style={{ position: "relative" }}>
                <input
                  type="text" value={collegeSearch} onChange={(e) => setCollegeSearch(e.target.value)}
                  placeholder="Search by name or location..."
                  style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
              {searchResults.length > 0 && (
                <div style={{ marginTop: "8px", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                  {searchResults.map((r, i) => (
                    <button
                      key={i} onClick={() => addCollegeFromSearch(r)} disabled={addingCollege}
                      style={{
                        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 16px", border: "none", background: "white", cursor: "pointer", textAlign: "left",
                        borderBottom: i < searchResults.length - 1 ? "1px solid #f7fafc" : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f8fc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#1a202c" }}>{r.name}</div>
                        <div style={{ fontSize: "12px", color: "#718096" }}>{r.location}</div>
                      </div>
                      <span style={{ fontSize: "20px", color: "#7c3aed" }}>+</span>
                    </button>
                  ))}
                </div>
              )}
              {collegeSearch.length >= 2 && searchResults.length === 0 && (
                <p style={{ fontSize: "13px", color: "#718096", marginTop: "8px" }}>No matches — try the manual form below.</p>
              )}
            </div>

            {/* Manual */}
            <div style={{ background: "white", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1a202c", margin: "0 0 16px 0" }}>✏️ Add Manually</h3>
              <form onSubmit={addManualCollege}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>College Name *</label>
                  <input
                    required value={manualCollegeName} onChange={(e) => setManualCollegeName(e.target.value)}
                    placeholder="e.g. MIT"
                    style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>Location (optional)</label>
                  <input
                    value={manualCollegeLocation} onChange={(e) => setManualCollegeLocation(e.target.value)}
                    placeholder="e.g. Cambridge, MA"
                    style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                    onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
                <button
                  type="submit" disabled={addingCollege}
                  style={{ padding: "12px 28px", background: "#7c3aed", color: "white", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "15px", cursor: addingCollege ? "not-allowed" : "pointer", opacity: addingCollege ? 0.7 : 1 }}
                >
                  {addingCollege ? "Adding..." : "Add College"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ADD DEADLINE */}
        {view === "add-deadline" && (
          <div style={{ maxWidth: "560px" }}>
            <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1a202c", margin: "0 0 6px 0" }}>Add a Deadline</h2>
            <p style={{ color: "#718096", margin: "0 0 32px 0" }}>Set an application deadline for one of your colleges</p>

            {colleges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", background: "white", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🏫</div>
                <h3 style={{ margin: "0 0 8px 0", color: "#4a5568" }}>No colleges yet</h3>
                <p style={{ color: "#718096", margin: "0 0 20px 0" }}>Add some colleges before setting deadlines</p>
                <button onClick={() => setView("add-college")} style={{ padding: "10px 24px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                  Add a College
                </button>
              </div>
            ) : (
              <div style={{ background: "white", borderRadius: "16px", padding: "32px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <form onSubmit={addDeadline}>
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>College *</label>
                    <select
                      required value={selectedCollegeId} onChange={(e) => setSelectedCollegeId(e.target.value)}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "white" }}
                      onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    >
                      <option value="">Select a college...</option>
                      {colleges.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}{c.location ? ` — ${c.location}` : ""}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "10px" }}>Application Type *</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {DEADLINE_TYPES.map((t) => (
                        <button
                          key={t} type="button" onClick={() => setDeadlineType(t)}
                          style={{
                            padding: "12px", border: `2px solid ${deadlineType === t ? getTypeColor(t) : "#e2e8f0"}`,
                            borderRadius: "10px", cursor: "pointer", fontWeight: "700", fontSize: "13px", transition: "all 0.2s",
                            background: deadlineType === t ? getTypeColor(t) : "white",
                            color: deadlineType === t ? "white" : "#4a5568",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>Deadline Date *</label>
                    <input
                      type="date" required value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                      onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>

                  <div style={{ marginBottom: "28px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#4a5568", marginBottom: "6px" }}>Notes (optional)</label>
                    <textarea
                      value={deadlineNotes} onChange={(e) => setDeadlineNotes(e.target.value)}
                      placeholder="e.g. Need rec letters by Nov 1, portal login info..."
                      rows={3}
                      style={{ width: "100%", padding: "12px 14px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
                      onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                      onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "12px" }}>
                    <button
                      type="submit" disabled={addingDeadline}
                      style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg, #667eea 0%, #7c3aed 100%)", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: addingDeadline ? "not-allowed" : "pointer", opacity: addingDeadline ? 0.7 : 1 }}
                    >
                      {addingDeadline ? "Saving..." : "Save Deadline"}
                    </button>
                    <button
                      type="button" onClick={() => setView("dashboard")}
                      style={{ padding: "14px 20px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer", color: "#4a5568" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}