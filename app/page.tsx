"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES } from "../lib/colleges";

type AppType = "Early Decision" | "Early Action" | "Regular Decision";
type AuthMode = "login" | "signup";

interface College {
  name: string;
  deadlines: Record<AppType, string>;
  location: string;
  type: string;
}

interface TrackedCollege {
  id: number;
  college_name: string;
  app_type: AppType;
  deadline: string;
  notes: string;
  created_at: string;
}

const APP_TYPES: AppType[] = ["Early Decision", "Early Action", "Regular Decision"];

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(dateStr: string): { bg: string; text: string; border: string; label: string } {
  const days = getDaysUntil(dateStr);
  if (days < 0) return { bg: "#f3f4f6", text: "#6b7280", border: "#d1d5db", label: "Past" };
  if (days < 7) return { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5", label: `${days}d left` };
  if (days < 30) return { bg: "#fefce8", text: "#d97706", border: "#fcd34d", label: `${days}d left` };
  return { bg: "#f0fdf4", text: "#16a34a", border: "#86efac", label: `${days}d left` };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [user, setUser] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<"dashboard" | "add">("dashboard");
  const [trackedColleges, setTrackedColleges] = useState<TrackedCollege[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Add college form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [selectedAppType, setSelectedAppType] = useState<AppType>("Regular Decision");
  const [customDeadline, setCustomDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [manualName, setManualName] = useState("");
  const [addMode, setAddMode] = useState<"search" | "manual">("search");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) setUser(saved);
  }, []);

  const fetchColleges = useCallback(async (email: string) => {
    setLoadingColleges(true);
    try {
      const res = await fetch(`/api/colleges?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.colleges) {
        const sorted = [...data.colleges].sort(
          (a: TrackedCollege, b: TrackedCollege) =>
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
        setTrackedColleges(sorted);
      }
    } catch {
      // ignore
    } finally {
      setLoadingColleges(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchColleges(user);
  }, [user, fetchColleges]);

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
      if (data.ok) {
        setUser(data.email);
        localStorage.setItem("edutracker_user", data.email);
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("edutracker_user");
    setTrackedColleges([]);
    setView("dashboard");
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    setSelectedCollege(null);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const results = COLLEGES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.location.toLowerCase().includes(lower)
    ).slice(0, 8);
    setSearchResults(results);
  }

  function selectCollege(college: College) {
    setSelectedCollege(college);
    setSearchQuery(college.name);
    setSearchResults([]);
    const deadline = college.deadlines[selectedAppType];
    setCustomDeadline(deadline || "");
  }

  function handleAppTypeChange(type: AppType) {
    setSelectedAppType(type);
    if (selectedCollege) {
      const deadline = selectedCollege.deadlines[type];
      setCustomDeadline(deadline || "");
    }
  }

  async function handleAddCollege(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSuccess("");

    const name = addMode === "search" ? (selectedCollege?.name || "") : manualName.trim();
    if (!name) {
      setAddError("Please select or enter a college name.");
      return;
    }
    if (!customDeadline) {
      setAddError("Please enter a deadline date.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user,
          college_name: name,
          app_type: selectedAppType,
          deadline: customDeadline,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAddSuccess(`${name} added successfully!`);
        setSelectedCollege(null);
        setSearchQuery("");
        setManualName("");
        setNotes("");
        setCustomDeadline("");
        setSelectedAppType("Regular Decision");
        if (user) fetchColleges(user);
        setTimeout(() => {
          setView("dashboard");
          setAddSuccess("");
        }, 1200);
      } else {
        setAddError(data.error || "Failed to add college.");
      }
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: number) {
    setDeleteLoading(id);
    try {
      const res = await fetch("/api/colleges", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: user }),
      });
      const data = await res.json();
      if (data.ok) {
        setTrackedColleges((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    } finally {
      setDeleteLoading(null);
    }
  }

  // Auth screen
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "2.5rem", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#1e3a5f", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.95rem" }}>Track your college application deadlines</p>
          </div>

          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "1.5rem" }}>
            {(["login", "signup"] as AuthMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setAuthError(""); }}
                style={{
                  flex: 1, padding: "0.6rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s",
                  background: authMode === mode ? "#fff" : "transparent",
                  color: authMode === mode ? "#1e3a5f" : "#6b7280",
                  boxShadow: authMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                }}
              >
                {mode === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>Email</label>
              <input
                type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>Password</label>
              <input
                type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
                onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
            {authError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.75rem", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
                {authError}
              </div>
            )}
            <button
              type="submit" disabled={authLoading}
              style={{ width: "100%", padding: "0.85rem", background: authLoading ? "#93c5fd" : "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "700", cursor: authLoading ? "not-allowed" : "pointer", transition: "background 0.2s" }}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }}>🎓</span>
          <div>
            <h1 style={{ color: "#fff", margin: 0, fontSize: "1.35rem", fontWeight: "800", lineHeight: 1 }}>Edutracker</h1>
            <p style={{ color: "#93c5fd", margin: 0, fontSize: "0.75rem" }}>College Application Tracker</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#bfdbfe", fontSize: "0.85rem", display: "none" }} className="user-email">{user}</span>
          <span style={{ color: "#bfdbfe", fontSize: "0.85rem" }}>{user}</span>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "0.4rem 0.9rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", gap: "0", maxWidth: "900px", margin: "0 auto" }}>
          {[{ key: "dashboard", label: "📋 My Dashboard" }, { key: "add", label: "➕ Add College" }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as "dashboard" | "add")}
              style={{
                padding: "1rem 1.5rem", border: "none", borderBottom: view === tab.key ? "3px solid #1e3a5f" : "3px solid transparent",
                background: "transparent", cursor: "pointer", fontSize: "0.9rem", fontWeight: "600",
                color: view === tab.key ? "#1e3a5f" : "#6b7280", transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem" }}>

        {/* DASHBOARD VIEW */}
        {view === "dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "#1e3a5f" }}>My Applications</h2>
                <p style={{ margin: "0.25rem 0 0", color: "#6b7280", fontSize: "0.9rem" }}>
                  {trackedColleges.length} {trackedColleges.length === 1 ? "school" : "schools"} tracked
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626", display: "inline-block" }}></span> &lt;7 days
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#d97706", display: "inline-block" }}></span> &lt;30 days
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#6b7280" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }}></span> 30+ days
                </span>
              </div>
            </div>

            {loadingColleges ? (
              <div style={{ textAlign: "center", padding: "4rem", color: "#6b7280" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                <p>Loading your colleges...</p>
              </div>
            ) : trackedColleges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 2rem", background: "#fff", borderRadius: "16px", border: "2px dashed #d1d5db" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏫</div>
                <h3 style={{ color: "#374151", fontWeight: "700", marginBottom: "0.5rem" }}>No colleges tracked yet</h3>
                <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Start adding colleges to track your application deadlines</p>
                <button
                  onClick={() => setView("add")}
                  style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: "700", fontSize: "0.95rem" }}
                >
                  Add Your First College
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {trackedColleges.map((college) => {
                  const urgency = getUrgencyColor(college.deadline);
                  const days = getDaysUntil(college.deadline);
                  return (
                    <div
                      key={college.id}
                      style={{
                        background: "#fff", borderRadius: "12px", border: `1.5px solid ${urgency.border}`,
                        padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between",
                        gap: "1rem", flexWrap: "wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "box-shadow 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: urgency.text, flexShrink: 0 }}></div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: "700", fontSize: "1.05rem", color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {college.college_name}
                          </div>
                          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                            <span style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600" }}>
                              {college.app_type}
                            </span>
                            {college.notes && (
                              <span style={{ color: "#9ca3af", fontSize: "0.8rem", fontStyle: "italic" }}>
                                {college.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: "700", fontSize: "0.95rem", color: "#111827" }}>{formatDate(college.deadline)}</div>
                          <div style={{
                            background: urgency.bg, color: urgency.text, border: `1px solid ${urgency.border}`,
                            borderRadius: "20px", padding: "0.2rem 0.65rem", fontSize: "0.78rem", fontWeight: "700", marginTop: "0.25rem",
                          }}>
                            {days < 0 ? "Past deadline" : urgency.label}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(college.id)}
                          disabled={deleteLoading === college.id}
                          title="Remove"
                          style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.5rem 0.75rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: "700", opacity: deleteLoading === college.id ? 0.5 : 1 }}
                        >
                          {deleteLoading === college.id ? "..." : "✕"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ADD COLLEGE VIEW */}
        {view === "add" && (
          <div style={{ maxWidth: "600px" }}>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: "800", color: "#1e3a5f" }}>Add a College</h2>
            <p style={{ margin: "0 0 1.5rem", color: "#6b7280" }}>Search our database or manually enter a college</p>

            {/* Mode toggle */}
            <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "1.5rem", width: "fit-content" }}>
              {(["search", "manual"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setAddMode(mode); setAddError(""); setSelectedCollege(null); setSearchQuery(""); setManualName(""); setCustomDeadline(""); }}
                  style={{
                    padding: "0.6rem 1.25rem", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600",
                    background: addMode === mode ? "#fff" : "transparent",
                    color: addMode === mode ? "#1e3a5f" : "#6b7280",
                    boxShadow: addMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {mode === "search" ? "🔍 Search Database" : "✏️ Enter Manually"}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddCollege} style={{ background: "#fff", borderRadius: "16px", padding: "1.75rem", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" }}>

              {addMode === "search" ? (
                <div style={{ marginBottom: "1.25rem", position: "relative" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>Search Colleges</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="e.g. Harvard, MIT, Stanford..."
                    style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                    onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                  />
                  {searchResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #d1d5db", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, marginTop: "4px", overflow: "hidden" }}>
                      {searchResults.map((college) => (
                        <button
                          key={college.name}
                          type="button"
                          onClick={() => selectCollege(college)}
                          style={{ width: "100%", padding: "0.75rem 1rem", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "0.15rem", borderBottom: "1px solid #f3f4f6" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f7ff")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <span style={{ fontWeight: "600", color: "#111827", fontSize: "0.9rem" }}>{college.name}</span>
                          <span style={{ color: "#6b7280", fontSize: "0.78rem" }}>{college.location} · {college.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedCollege && (
                    <div style={{ marginTop: "0.5rem", background: "#f0f7ff", borderRadius: "8px", padding: "0.6rem 0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "#2d6a9f", fontSize: "1rem" }}>✓</span>
                      <span style={{ fontWeight: "600", color: "#1e3a5f", fontSize: "0.875rem" }}>{selectedCollege.name}</span>
                      <span style={{ color: "#6b7280", fontSize: "0.8rem" }}>— {selectedCollege.location}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>College Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="e.g. University of Michigan"
                    style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                    onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                    onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                  />
                </div>
              )}

              {/* Application Type */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.6rem" }}>Application Type</label>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {APP_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleAppTypeChange(type)}
                      style={{
                        padding: "0.55rem 1rem", border: selectedAppType === type ? "2px solid #1e3a5f" : "2px solid #d1d5db",
                        borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600",
                        background: selectedAppType === type ? "#1e3a5f" : "#fff",
                        color: selectedAppType === type ? "#fff" : "#374151",
                        transition: "all 0.15s",
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>
                  Deadline Date
                  {addMode === "search" && selectedCollege && customDeadline && (
                    <span style={{ fontWeight: "400", color: "#16a34a", marginLeft: "0.5rem", fontSize: "0.8rem" }}>✓ Auto-filled</span>
                  )}
                </label>
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
                {addMode === "search" && selectedCollege && !selectedCollege.deadlines[selectedAppType] && (
                  <p style={{ margin: "0.4rem 0 0", color: "#d97706", fontSize: "0.8rem" }}>
                    ⚠ No preset deadline for this application type — please enter manually.
                  </p>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "#374151", marginBottom: "0.4rem" }}>Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Safety school, Need to write supplement..."
                  style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "8px", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => e.target.style.borderColor = "#2d6a9f"}
                  onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
                />
              </div>

              {addError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "0.75rem", color: "#dc2626", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {addError}
                </div>
              )}
              {addSuccess && (
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "0.75rem", color: "#16a34a", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: "600" }}>
                  ✓ {addSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={addLoading}
                style={{ width: "100%", padding: "0.9rem", background: addLoading ? "#93c5fd" : "#1e3a5f", color: "#fff", border: "none", borderRadius: "8px", fontSize: "1rem", fontWeight: "700", cursor: addLoading ? "not-allowed" : "pointer", transition: "background 0.2s" }}
              >
                {addLoading ? "Adding..." : "Add to My Dashboard"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}