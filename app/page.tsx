"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: number;
  college_name: string;
  deadline: string;
  app_type: string;
  notes: string;
}

interface User {
  email: string;
}

type AuthMode = "login" | "signup";
type View = "auth" | "dashboard" | "add";

const COLLEGES = [
  "Harvard University", "Yale University", "Princeton University", "Columbia University",
  "University of Pennsylvania", "Brown University", "Dartmouth College", "Cornell University",
  "MIT", "Stanford University", "Duke University", "Northwestern University",
  "Johns Hopkins University", "Vanderbilt University", "Rice University", "Notre Dame",
  "Washington University in St. Louis", "Emory University", "Georgetown University",
  "Carnegie Mellon University", "UC Berkeley", "UCLA", "University of Michigan",
  "University of Virginia", "UNC Chapel Hill", "Wake Forest University",
  "Tufts University", "Boston College", "Northeastern University", "Boston University",
  "NYU", "Fordham University", "George Washington University", "American University",
  "University of Maryland", "Penn State University", "Ohio State University",
  "University of Wisconsin-Madison", "University of Illinois Urbana-Champaign",
  "University of Minnesota", "Indiana University", "Purdue University",
  "Michigan State University", "University of Iowa", "University of Nebraska",
  "University of Colorado Boulder", "University of Denver", "Colorado State University",
  "University of Arizona", "Arizona State University", "University of Utah",
  "University of Washington", "University of Oregon", "Oregon State University",
  "University of California San Diego", "UC Santa Barbara", "UC Davis", "UC Irvine",
  "UC Santa Cruz", "Cal Poly San Luis Obispo", "San Diego State University",
  "University of Southern California", "Pepperdine University", "Loyola Marymount",
  "Santa Clara University", "University of San Francisco", "Chapman University",
  "University of Miami", "University of Florida", "Florida State University",
  "University of South Florida", "Florida International University", "Rollins College",
  "Tulane University", "Louisiana State University", "University of Georgia",
  "Georgia Tech", "Georgia State University", "Emory University",
  "Clemson University", "University of South Carolina", "College of Charleston",
  "University of Tennessee", "Vanderbilt University", "Belmont University",
  "University of Alabama", "Auburn University", "Samford University",
  "University of Mississippi", "Mississippi State University",
  "University of Kentucky", "University of Louisville", "Bellarmine University",
  "University of Texas Austin", "Texas A&M University", "SMU", "TCU",
  "Baylor University", "University of Houston", "Trinity University",
  "University of Oklahoma", "Oklahoma State University",
  "University of Kansas", "Kansas State University",
  "University of Missouri", "Saint Louis University", "Washington University",
  "University of Arkansas", "Hendrix College",
  "Brigham Young University", "University of Nevada Las Vegas",
  "Gonzaga University", "Seattle University", "University of Montana",
  "Colby College", "Bowdoin College", "Bates College", "Middlebury College",
  "Williams College", "Amherst College", "Wellesley College", "Smith College",
  "Mount Holyoke College", "Vassar College", "Barnard College", "Bryn Mawr College",
  "Haverford College", "Swarthmore College", "Oberlin College",
  "Macalester College", "Carleton College", "Grinnell College",
  "Hamilton College", "Colgate University", "Holy Cross", "Fairfield University",
  "Providence College", "Bryant University", "Bentley University",
  "Babson College", "Quinnipiac University", "Sacred Heart University",
  "Villanova University", "Lehigh University", "Lafayette College", "Bucknell University",
  "Dickinson College", "Gettysburg College", "Muhlenberg College",
  "University of Rochester", "RPI", "Syracuse University", "Skidmore College",
  "Union College", "Clarkson University", "St. Lawrence University",
  "Case Western Reserve University", "Denison University", "Kenyon College",
  "Ohio Wesleyan University", "College of Wooster"
];

const APP_TYPES = ["Regular Decision", "Early Decision", "Early Action", "Rolling", "Other"];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): { bg: string; text: string; label: string; dot: string } {
  if (days < 0) return { bg: "#1a1a2e", text: "#666", label: "Past", dot: "#444" };
  if (days <= 14) return { bg: "#2d1b1b", text: "#ff6b6b", label: "Urgent", dot: "#ff4444" };
  if (days <= 30) return { bg: "#2d2510", text: "#ffd93d", label: "Soon", dot: "#ffb800" };
  return { bg: "#1b2d1b", text: "#6bcb77", label: "On Track", dot: "#44cc55" };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [view, setView] = useState<View>("auth");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [user, setUser] = useState<User | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Add form state
  const [collegeName, setCollegeName] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [appType, setAppType] = useState("Regular Decision");
  const [notes, setNotes] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"deadline" | "name">("deadline");

  const filteredColleges = COLLEGES.filter(c =>
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  ).slice(0, 8);

  const fetchColleges = useCallback(async () => {
    try {
      const res = await fetch("/api/colleges");
      if (res.ok) {
        const data = await res.json();
        setColleges(data.colleges || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});
  }, []);

  useEffect(() => {
    // Check session
    fetch("/api/me").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          setView("dashboard");
          fetchColleges();
        }
      }
    }).catch(() => {});
  }, [fetchColleges]);

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
        setUser({ email: data.email });
        setView("dashboard");
        fetchColleges();
      } else {
        setAuthError(data.error || "Something went wrong");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAddCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddSuccess(false);
    if (!collegeName.trim()) { setAddError("Please enter a college name."); return; }
    if (!deadline) { setAddError("Please select a deadline date."); return; }
    setAddLoading(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ college_name: collegeName.trim(), deadline, app_type: appType, notes }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAddSuccess(true);
        setCollegeName("");
        setCollegeSearch("");
        setDeadline("");
        setNotes("");
        setAppType("Regular Decision");
        fetchColleges();
        setTimeout(() => { setView("dashboard"); setAddSuccess(false); }, 1200);
      } else {
        setAddError(data.error || "Failed to add college.");
      }
    } catch {
      setAddError("Network error.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await fetch(`/api/colleges?id=${id}`, { method: "DELETE" });
      setColleges(prev => prev.filter(c => c.id !== id));
    } catch {
      // ignore
    } finally {
      setDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    setColleges([]);
    setView("auth");
    setAuthEmail("");
    setAuthPassword("");
  };

  const sorted = [...colleges].sort((a, b) => {
    if (sortBy === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    return a.college_name.localeCompare(b.college_name);
  });

  // ── STYLES ──────────────────────────────────────────────────────────────────
  const baseStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)",
    color: "#e0e0e0",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    padding: 0,
    margin: 0,
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "32px",
    backdropFilter: "blur(10px)",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10,
    color: "#e0e0e0",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%",
    padding: "13px",
    background: "linear-gradient(135deg, #6c63ff, #4a90e2)",
    border: "none",
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.5,
    transition: "opacity 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#a0a0c0",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  };

  // ── AUTH VIEW ────────────────────────────────────────────────────────────────
  if (view === "auth") {
    return (
      <div style={baseStyle}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{ ...cardStyle, width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: "linear-gradient(135deg, #6c63ff, #4a90e2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Edutracker
              </h1>
              <p style={{ margin: "8px 0 0", color: "#888", fontSize: 14 }}>Never miss a college application deadline</p>
            </div>

            <div style={{ display: "flex", marginBottom: 24, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
              {(["login", "signup"] as AuthMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => { setAuthMode(mode); setAuthError(""); }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    transition: "all 0.2s",
                    background: authMode === mode ? "linear-gradient(135deg, #6c63ff, #4a90e2)" : "transparent",
                    color: authMode === mode ? "#fff" : "#888",
                  }}
                >
                  {mode === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="you@example.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  required
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                />
              </div>
              {authError && (
                <div style={{ padding: "10px 14px", background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8, color: "#ff8080", fontSize: 14 }}>
                  {authError}
                </div>
              )}
              <button style={{ ...btnPrimary, opacity: authLoading ? 0.6 : 1 }} type="submit" disabled={authLoading}>
                {authLoading ? "Please wait…" : authMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── ADD COLLEGE VIEW ─────────────────────────────────────────────────────────
  if (view === "add") {
    return (
      <div style={baseStyle}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
            <button
              onClick={() => setView("dashboard")}
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#aaa", padding: "8px 14px", cursor: "pointer", fontSize: 14 }}
            >
              ← Back
            </button>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Add College Deadline</h2>
          </div>

          <div style={cardStyle}>
            {addSuccess && (
              <div style={{ padding: "12px 16px", background: "rgba(68,204,85,0.15)", border: "1px solid rgba(68,204,85,0.3)", borderRadius: 8, color: "#6bcb77", fontSize: 15, marginBottom: 20, textAlign: "center", fontWeight: 600 }}>
                ✓ Added successfully! Redirecting…
              </div>
            )}
            <form onSubmit={handleAddCollege} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>College Name *</label>
                <input
                  style={inputStyle}
                  type="text"
                  placeholder="Search or type college name…"
                  value={collegeSearch || collegeName}
                  onChange={e => {
                    const v = e.target.value;
                    setCollegeSearch(v);
                    setCollegeName(v);
                    setShowDropdown(v.length > 0);
                  }}
                  onFocus={() => { if ((collegeSearch || collegeName).length > 0) setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  autoComplete="off"
                />
                {showDropdown && filteredColleges.length > 0 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#1e1e35",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    marginTop: 4,
                    zIndex: 100,
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  }}>
                    {filteredColleges.map(c => (
                      <div
                        key={c}
                        onMouseDown={() => {
                          setCollegeName(c);
                          setCollegeSearch(c);
                          setShowDropdown(false);
                        }}
                        style={{
                          padding: "12px 16px",
                          cursor: "pointer",
                          fontSize: 14,
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(108,99,255,0.2)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        {c}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Application Type</label>
                <select
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                  value={appType}
                  onChange={e => setAppType(e.target.value)}
                >
                  {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Deadline Date *</label>
                <input
                  style={inputStyle}
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  style={{ ...inputStyle, height: 80, resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Any notes about this application…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {addError && (
                <div style={{ padding: "10px 14px", background: "rgba(255,80,80,0.15)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: 8, color: "#ff8080", fontSize: 14 }}>
                  {addError}
                </div>
              )}

              <button style={{ ...btnPrimary, opacity: addLoading ? 0.6 : 1 }} type="submit" disabled={addLoading}>
                {addLoading ? "Saving…" : "Add to Dashboard"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── DASHBOARD VIEW ────────────────────────────────────────────────────────────
  const urgent = sorted.filter(c => { const d = daysUntil(c.deadline); return d >= 0 && d <= 14; });
  const upcoming = sorted.filter(c => { const d = daysUntil(c.deadline); return d > 14 && d <= 30; });

  return (
    <div style={baseStyle}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #6c63ff, #4a90e2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              🎓 Edutracker
            </h1>
            <p style={{ margin: "4px 0 0", color: "#666", fontSize: 13 }}>{user?.email}</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setView("add")}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(135deg, #6c63ff, #4a90e2)",
                border: "none",
                borderRadius: 10,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add College
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 16px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10,
                color: "#999",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats row */}
        {colleges.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total", value: colleges.length, color: "#6c63ff" },
              { label: "Urgent (≤14d)", value: urgent.length, color: "#ff4444" },
              { label: "Upcoming (≤30d)", value: upcoming.length, color: "#ffb800" },
            ].map(stat => (
              <div key={stat.label} style={{ ...cardStyle, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sort bar */}
        {colleges.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#666" }}>Sort:</span>
            {(["deadline", "name"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 13,
                  cursor: "pointer",
                  background: sortBy === s ? "rgba(108,99,255,0.25)" : "transparent",
                  color: sortBy === s ? "#a09bff" : "#777",
                  fontWeight: sortBy === s ? 700 : 400,
                }}
              >
                {s === "deadline" ? "Deadline" : "Name"}
              </button>
            ))}
          </div>
        )}

        {/* College list */}
        {sorted.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: "60px 32px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700, color: "#ccc" }}>No colleges yet</h3>
            <p style={{ margin: "0 0 24px", color: "#666", fontSize: 15 }}>Start adding schools you're applying to and track their deadlines.</p>
            <button
              onClick={() => setView("add")}
              style={{ ...btnPrimary, width: "auto", padding: "12px 32px" }}
            >
              Add Your First College
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map(college => {
              const days = daysUntil(college.deadline);
              const urg = urgencyColor(days);
              return (
                <div
                  key={college.id}
                  style={{
                    background: urg.bg,
                    border: `1px solid ${urg.dot}33`,
                    borderRadius: 14,
                    padding: "18px 22px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "translateX(3px)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "translateX(0)")}
                >
                  {/* Urgency dot */}
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: urg.dot,
                    boxShadow: `0 0 8px ${urg.dot}88`,
                    flexShrink: 0,
                  }} />

                  {/* College info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#e8e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {college.college_name}
                    </div>
                    <div style={{ fontSize: 13, color: "#777", marginTop: 3, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>📅 {formatDate(college.deadline)}</span>
                      <span style={{ color: "#666" }}>• {college.app_type}</span>
                      {college.notes && <span style={{ color: "#555", fontStyle: "italic" }}>• {college.notes}</span>}
                    </div>
                  </div>

                  {/* Days remaining */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: urg.text, lineHeight: 1 }}>
                      {days < 0 ? "Past" : days === 0 ? "Today!" : `${days}d`}
                    </div>
                    <div style={{ fontSize: 11, color: urg.text, opacity: 0.75, marginTop: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      {days < 0 ? "deadline" : days === 0 ? "due today" : "remaining"}
                    </div>
                    <div style={{
                      marginTop: 5,
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 20,
                      background: `${urg.dot}22`,
                      border: `1px solid ${urg.dot}55`,
                      fontSize: 11,
                      color: urg.dot,
                      fontWeight: 700,
                    }}>
                      {urg.label}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(college.id)}
                    disabled={deleteId === college.id}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(255,80,80,0.2)",
                      borderRadius: 8,
                      color: "#ff6b6b",
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 16,
                      opacity: deleteId === college.id ? 0.4 : 1,
                      flexShrink: 0,
                    }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {colleges.length > 0 && (
          <div style={{ marginTop: 24, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { color: "#44cc55", label: "On Track (>30 days)" },
              { color: "#ffb800", label: "Soon (15–30 days)" },
              { color: "#ff4444", label: "Urgent (≤14 days)" },
            ].map(item => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                <span style={{ fontSize: 12, color: "#666" }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}