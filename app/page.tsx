"use client";

import { useState, useEffect, useCallback } from "react";

interface Deadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  date: string;
  label?: string;
}

interface College {
  id: string;
  name: string;
  location: string;
  deadlines: Deadline[];
  tags: string[];
}

interface User {
  email: string;
}

type View = "dashboard" | "calendar" | "admin" | "auth";

const STORAGE_KEY = "edutracker_selected_schools";
const ADMIN_KEY = "edutracker_admin_colleges";
const SESSION_KEY = "edutracker_session";

import { DEFAULT_COLLEGES } from "../lib/colleges";

function getColleges(): College[] {
  if (typeof window === "undefined") return DEFAULT_COLLEGES;
  try {
    const stored = localStorage.getItem(ADMIN_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return DEFAULT_COLLEGES;
}

function saveColleges(colleges: College[]) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(colleges));
}

function getSelectedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveSelectedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

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

function deadlineColor(type: Deadline["type"]): string {
  switch (type) {
    case "EA": return "#3b82f6";
    case "ED": return "#8b5cf6";
    case "ED2": return "#a855f7";
    case "RD": return "#10b981";
    case "Scholarship": return "#f59e0b";
    default: return "#6b7280";
  }
}

function urgencyStyle(days: number): React.CSSProperties {
  if (days < 0) return { background: "#f3f4f6", color: "#9ca3af", textDecoration: "line-through" };
  if (days <= 7) return { background: "#fee2e2", color: "#dc2626", fontWeight: 700 };
  if (days <= 30) return { background: "#fef3c7", color: "#d97706", fontWeight: 600 };
  return { background: "#ecfdf5", color: "#065f46" };
}

export default function Home() {
  const [view, setView] = useState<View>("auth");
  const [user, setUser] = useState<User | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("All");
  const [listView, setListView] = useState<"list" | "calendar">("list");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [adminView, setAdminView] = useState<"list" | "edit">("list");
  const [toast, setToast] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const u = JSON.parse(session);
        setUser(u);
        setView("dashboard");
      } catch {}
    }
    setColleges(getColleges());
    setSelectedIds(getSelectedIds());
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  const handleAuth = async () => {
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
        localStorage.setItem(SESSION_KEY, JSON.stringify(u));
        setView("dashboard");
        showToast(`Welcome, ${data.email}!`);
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
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setView("auth");
  };

  const toggleSchool = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    saveSelectedIds(next);
    showToast(selectedIds.includes(id) ? "School removed" : "School added to your list!");
  };

  const selectedColleges = colleges.filter((c) => selectedIds.includes(c.id));

  const allDeadlines = selectedColleges
    .flatMap((c) =>
      c.deadlines.map((d) => ({
        ...d,
        collegeName: c.name,
        collegeId: c.id,
        days: daysUntil(d.date),
      }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcomingDeadlines = allDeadlines.filter((d) => d.days >= 0).slice(0, 5);

  const allTags = ["All", ...Array.from(new Set(colleges.flatMap((c) => c.tags)))];

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === "All" || c.tags.includes(filterTag);
    return matchesSearch && matchesTag;
  });

  const saveAdminCollege = (updated: College) => {
    const next = colleges.map((c) => (c.id === updated.id ? updated : c));
    setColleges(next);
    saveColleges(next);
    setEditingCollege(null);
    setAdminView("list");
    showToast("College updated!");
  };

  const addAdminCollege = () => {
    const newCollege: College = {
      id: `college_${Date.now()}`,
      name: "New College",
      location: "City, State",
      deadlines: [{ type: "RD", date: "2025-01-01" }],
      tags: ["Other"],
    };
    const next = [...colleges, newCollege];
    setColleges(next);
    saveColleges(next);
    setEditingCollege(newCollege);
    setAdminView("edit");
  };

  const deleteAdminCollege = (id: string) => {
    const next = colleges.filter((c) => c.id !== id);
    setColleges(next);
    saveColleges(next);
    showToast("College deleted");
  };

  // Calendar helpers
  const calYear = calendarMonth.getFullYear();
  const calMonth = calendarMonth.getMonth();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const deadlinesInMonth = allDeadlines.filter((d) => {
    const dd = new Date(d.date + "T00:00:00");
    return dd.getFullYear() === calYear && dd.getMonth() === calMonth;
  });

  const deadlinesByDay: Record<number, typeof allDeadlines> = {};
  deadlinesInMonth.forEach((d) => {
    const day = new Date(d.date + "T00:00:00").getDate();
    if (!deadlinesByDay[day]) deadlinesByDay[day] = [];
    deadlinesByDay[day].push(d);
  });

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  if (view === "auth") {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🎓 Edutracker</div>
          <p style={styles.tagline}>Never miss a college application deadline</p>
          <div style={styles.authTabs}>
            <button
              style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }}
              onClick={() => setAuthMode("login")}
            >Log In</button>
            <button
              style={{ ...styles.authTab, ...(authMode === "signup" ? styles.authTabActive : {}) }}
              onClick={() => setAuthMode("signup")}
            >Sign Up</button>
          </div>
          <input
            style={styles.input}
            type="email"
            placeholder="Email address"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAuth()}
          />
          {authError && <p style={styles.authError}>{authError}</p>}
          <button style={styles.btnPrimary} onClick={handleAuth} disabled={authLoading}>
            {authLoading ? "Loading..." : authMode === "login" ? "Log In" : "Create Account"}
          </button>
          <button style={styles.btnGhost} onClick={() => { setView("dashboard"); }}>
            Browse as guest
          </button>
        </div>
      </div>
    );
  }

  if (view === "admin") {
    return (
      <div style={styles.page}>
        {toast && <div style={styles.toast}>{toast}</div>}
        <nav style={styles.nav}>
          <div style={styles.navLogo}>🎓 Edutracker <span style={styles.adminBadge}>Admin</span></div>
          <div style={styles.navLinks}>
            <button style={styles.navBtn} onClick={() => setView("dashboard")}>← Dashboard</button>
            {user && <button style={styles.navBtnDanger} onClick={handleLogout}>Logout</button>}
          </div>
        </nav>
        <div style={styles.container}>
          <div style={styles.pageHeader}>
            <h1 style={styles.h1}>Admin: Manage Colleges</h1>
            <button style={styles.btnPrimary} onClick={addAdminCollege}>+ Add College</button>
          </div>

          {adminView === "edit" && editingCollege ? (
            <AdminEditForm
              college={editingCollege}
              onSave={saveAdminCollege}
              onCancel={() => { setAdminView("list"); setEditingCollege(null); }}
            />
          ) : (
            <div style={styles.adminList}>
              {colleges.map((c) => (
                <div key={c.id} style={styles.adminRow}>
                  <div>
                    <strong>{c.name}</strong>
                    <span style={styles.adminLocation}> · {c.location}</span>
                    <div style={{ marginTop: 4 }}>
                      {c.deadlines.map((d, i) => (
                        <span key={i} style={{ ...styles.badge, background: deadlineColor(d.type) }}>
                          {d.type}: {d.date}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={styles.adminActions}>
                    <button style={styles.btnEdit} onClick={() => { setEditingCollege(c); setAdminView("edit"); }}>Edit</button>
                    <button style={styles.btnDanger} onClick={() => deleteAdminCollege(c.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "calendar") {
    return (
      <div style={styles.page}>
        {toast && <div style={styles.toast}>{toast}</div>}
        <nav style={styles.nav}>
          <div style={styles.navLogo}>🎓 Edutracker</div>
          <div style={styles.navLinks}>
            <button style={styles.navBtn} onClick={() => setView("dashboard")}>← Dashboard</button>
            {user ? (
              <span style={styles.navUser}>{user.email} <button style={styles.navBtnDanger} onClick={handleLogout}>Logout</button></span>
            ) : (
              <button style={styles.navBtn} onClick={() => setView("auth")}>Log In</button>
            )}
          </div>
        </nav>
        <div style={styles.container}>
          <div style={styles.pageHeader}>
            <h1 style={styles.h1}>Deadline Calendar</h1>
            <div style={styles.viewToggle}>
              <button style={listView === "list" ? styles.toggleActive : styles.toggleInactive} onClick={() => setListView("list")}>List</button>
              <button style={listView === "calendar" ? styles.toggleActive : styles.toggleInactive} onClick={() => setListView("calendar")}>Calendar</button>
            </div>
          </div>

          {selectedIds.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <p>You haven&apos;t selected any schools yet.</p>
              <button style={styles.btnPrimary} onClick={() => setView("dashboard")}>Browse Schools</button>
            </div>
          ) : listView === "list" ? (
            <div>
              <div style={styles.legendRow}>
                {(["EA","ED","ED2","RD","Scholarship"] as Deadline["type"][]).map((t) => (
                  <span key={t} style={{ ...styles.badge, background: deadlineColor(t) }}>{t}</span>
                ))}
              </div>
              {allDeadlines.map((d, i) => (
                <div key={i} style={{ ...styles.deadlineRow, ...urgencyStyle(d.days) }}>
                  <span style={{ ...styles.deadlineBadge, background: deadlineColor(d.type) }}>{d.type}</span>
                  <div style={styles.deadlineInfo}>
                    <strong>{d.collegeName}</strong>
                    {d.label && <span style={styles.deadlineLabel}> — {d.label}</span>}
                  </div>
                  <div style={styles.deadlineMeta}>
                    <span>{formatDate(d.date)}</span>
                    <span style={styles.countdown}>
                      {d.days < 0 ? "Passed" : d.days === 0 ? "Today!" : `${d.days}d left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={styles.calNav}>
                <button style={styles.calNavBtn} onClick={() => setCalendarMonth(new Date(calYear, calMonth - 1, 1))}>‹</button>
                <span style={styles.calMonthLabel}>{monthNames[calMonth]} {calYear}</span>
                <button style={styles.calNavBtn} onClick={() => setCalendarMonth(new Date(calYear, calMonth + 1, 1))}>›</button>
              </div>
              <div style={styles.calGrid}>
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                  <div key={d} style={styles.calDayHeader}>{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} style={styles.calCell} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const events = deadlinesByDay[day] || [];
                  const isToday = new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
                  return (
                    <div key={day} style={{ ...styles.calCell, ...(isToday ? styles.calToday : {}) }}>
                      <div style={styles.calDayNum}>{day}</div>
                      {events.map((e, j) => (
                        <div key={j} style={{ ...styles.calEvent, background: deadlineColor(e.type) }}>
                          {e.type} · {e.collegeName.split(" ")[0]}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.page}>
      {toast && <div style={styles.toast}>{toast}</div>}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>🎓 Edutracker</div>
        <div style={styles.navLinks}>
          {selectedIds.length > 0 && (
            <button style={styles.navBtn} onClick={() => setView("calendar")}>My Deadlines ({allDeadlines.length})</button>
          )}
          <button style={styles.navBtn} onClick={() => setView("admin")}>Admin</button>
          {user ? (
            <span style={styles.navUser}>{user.email} <button style={styles.navBtnDanger} onClick={handleLogout}>Logout</button></span>
          ) : (
            <button style={styles.navBtn} onClick={() => setView("auth")}>Log In</button>
          )}
        </div>
      </nav>

      <div style={styles.container}>
        {upcomingDeadlines.length > 0 && (
          <div style={styles.upcomingBanner}>
            <strong>⚡ Upcoming Deadlines</strong>
            <div style={styles.upcomingRow}>
              {upcomingDeadlines.map((d, i) => (
                <div key={i} style={{ ...styles.upcomingChip, background: deadlineColor(d.type) }}>
                  <span>{d.collegeName.split(" ")[0]}</span>
                  <span style={styles.upcomingType}>{d.type}</span>
                  <span style={styles.upcomingDays}>{d.days === 0 ? "Today!" : `${d.days}d`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={styles.pageHeader}>
          <h1 style={styles.h1}>Find Your Schools</h1>
          <div style={styles.headerRight}>
            <span style={styles.selectedCount}>{selectedIds.length} selected</span>
            {selectedIds.length > 0 && (
              <button style={styles.btnPrimary} onClick={() => setView("calendar")}>View My Deadlines →</button>
            )}
          </div>
        </div>

        <div style={styles.searchRow}>
          <input
            style={styles.searchInput}
            placeholder="Search schools by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select style={styles.select} value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={styles.collegeGrid}>
          {filteredColleges.map((college) => {
            const isSelected = selectedIds.includes(college.id);
            const nearestUpcoming = college.deadlines
              .map((d) => ({ ...d, days: daysUntil(d.date) }))
              .filter((d) => d.days >= 0)
              .sort((a, b) => a.days - b.days)[0];

            return (
              <div key={college.id} style={{ ...styles.collegeCard, ...(isSelected ? styles.collegeCardSelected : {}) }}>
                <div style={styles.collegeCardHeader}>
                  <div>
                    <div style={styles.collegeName}>{college.name}</div>
                    <div style={styles.collegeLocation}>📍 {college.location}</div>
                  </div>
                  <button
                    style={{ ...styles.selectBtn, ...(isSelected ? styles.selectBtnActive : {}) }}
                    onClick={() => toggleSchool(college.id)}
                  >
                    {isSelected ? "✓ Added" : "+ Add"}
                  </button>
                </div>
                <div style={styles.tagRow}>
                  {college.tags.map((t) => (
                    <span key={t} style={styles.tag}>{t}</span>
                  ))}
                </div>
                <div style={styles.deadlineList}>
                  {college.deadlines.map((d, i) => {
                    const days = daysUntil(d.date);
                    return (
                      <div key={i} style={styles.deadlineItem}>
                        <span style={{ ...styles.badge, background: deadlineColor(d.type) }}>{d.type}</span>
                        <span style={styles.deadlineDate}>{formatDate(d.date)}</span>
                        {days >= 0 ? (
                          <span style={{ ...styles.daysChip, ...(days <= 30 ? styles.daysChipUrgent : {}) }}>
                            {days === 0 ? "Today!" : `${days}d`}
                          </span>
                        ) : (
                          <span style={styles.daysChipPast}>Passed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {nearestUpcoming && (
                  <div style={styles.nextDeadline}>
                    Next: <strong>{nearestUpcoming.type}</strong> in <strong style={{ color: nearestUpcoming.days <= 30 ? "#dc2626" : "#065f46" }}>{nearestUpcoming.days} days</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredColleges.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🔍</div>
            <p>No schools match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminEditForm({
  college,
  onSave,
  onCancel,
}: {
  college: College;
  onSave: (c: College) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<College>(JSON.parse(JSON.stringify(college)));

  const updateDeadline = (i: number, field: keyof Deadline, value: string) => {
    const next = [...form.deadlines];
    (next[i] as Record<string, string>)[field] = value;
    setForm({ ...form, deadlines: next });
  };

  const addDeadline = () => {
    setForm({ ...form, deadlines: [...form.deadlines, { type: "RD", date: "2025-01-01" }] });
  };

  const removeDeadline = (i: number) => {
    setForm({ ...form, deadlines: form.deadlines.filter((_, j) => j !== i) });
  };

  return (
    <div style={styles.editForm}>
      <h2 style={styles.h2}>Edit: {college.name}</h2>
      <label style={styles.label}>College Name</label>
      <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <label style={styles.label}>Location</label>
      <input style={styles.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <label style={styles.label}>Tags (comma separated)</label>
      <input
        style={styles.input}
        value={form.tags.join(", ")}
        onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()) })}
      />
      <label style={styles.label}>Deadlines</label>
      {form.deadlines.map((d, i) => (
        <div key={i} style={styles.deadlineEditRow}>
          <select
            style={styles.selectSmall}
            value={d.type}
            onChange={(e) => updateDeadline(i, "type", e.target.value)}
          >
            {["EA","ED","ED2","RD","Scholarship"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            style={styles.inputDate}
            type="date"
            value={d.date}
            onChange={(e) => updateDeadline(i, "date", e.target.value)}
          />
          <input
            style={styles.inputLabel}
            placeholder="Label (optional)"
            value={d.label || ""}
            onChange={(e) => updateDeadline(i, "label", e.target.value)}
          />
          <button style={styles.btnDanger} onClick={() => removeDeadline(i)}>✕</button>
        </div>
      ))}
      <button style={styles.btnSecondary} onClick={addDeadline}>+ Add Deadline</button>
      <div style={styles.formActions}>
        <button style={styles.btnPrimary} onClick={() => onSave(form)}>Save</button>
        <button style={styles.btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" },
  authPage: { minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  authCard: { background: "#fff", borderRadius: 20, padding: "48px 40px", width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  logo: { fontSize: 28, fontWeight: 800, textAlign: "center", color: "#1e3a5f", marginBottom: 8 },
  tagline: { textAlign: "center", color: "#64748b", marginBottom: 28, fontSize: 15 },
  authTabs: { display: "flex", gap: 0, marginBottom: 20, borderRadius: 10, overflow: "hidden", border: "1px solid #e2e8f0" },
  authTab: { flex: 1, padding: "10px 0", border: "none", cursor: "pointer", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: 14 },
  authTabActive: { background: "#1e3a5f", color: "#fff" },
  input: { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: "border-box", outline: "none" },
  authError: { color: "#dc2626", fontSize: 13, marginBottom: 8 },
  btnPrimary: { width: "100%", padding: "13px 0", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer", marginBottom: 8 },
  btnGhost: { width: "100%", padding: "11px 0", background: "transparent", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  btnSecondary: { padding: "9px 18px", background: "#e2e8f0", color: "#1e3a5f", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 12 },
  btnEdit: { padding: "6px 14px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  btnDanger: { padding: "6px 12px", background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  nav: { background: "#1e3a5f", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  navLogo: { color: "#fff", fontWeight: 800, fontSize: 20 },
  navLinks: { display: "flex", gap: 12, alignItems: "center" },
  navBtn: { padding: "8px 16px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  navBtnDanger: { padding: "6px 12px", background: "transparent", color: "#fca5a5", border: "1px solid #fca5a5", borderRadius: 7, fontWeight: 600, fontSize: 12, cursor: "pointer", marginLeft: 8 },
  navUser: { color: "#cbd5e1", fontSize: 13, display: "flex", alignItems: "center" },
  adminBadge: { fontSize: 11, background: "#f59e0b", color: "#fff", borderRadius: 5, padding: "2px 7px", marginLeft: 8, fontWeight: 700 },
  container: { maxWidth: 1200, margin: "0 auto", padding: "28px 24px" },
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  h1: { fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: 0 },
  h2: { fontSize: 20, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  selectedCount: { fontSize: 13, color: "#64748b", fontWeight: 600 },
  searchRow: { display: "flex", gap: 12, marginBottom: 24 },
  searchInput: { flex: 1, padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" },
  select: { padding: "11px 14px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" },
  collegeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 18 },
  collegeCard: { background: "#fff", borderRadius: 14, padding: 20, border: "2px solid #e2e8f0", transition: "all 0.2s" },
  collegeCardSelected: { border: "2px solid #1e3a5f", boxShadow: "0 4px 20px rgba(30,58,95,0.12)" },
  collegeCardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  collegeName: { fontSize: 15, fontWeight: 700, color: "#1e3a5f", marginBottom: 3 },
  collegeLocation: { fontSize: 12, color: "#64748b" },
  selectBtn: { padding: "7px 14px", border: "2px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
  selectBtnActive: { background: "#1e3a5f", color: "#fff", border: "2px solid #1e3a5f" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 },
  tag: { fontSize: 11, background: "#f1f5f9", color: "#64748b", borderRadius: 5, padding: "2px 8px", fontWeight: 600 },
  deadlineList: { display: "flex", flexDirection: "column", gap: 6 },
  deadlineItem: { display: "flex", alignItems: "center", gap: 8 },
  deadlineDate: { fontSize: 13, color: "#475569", flex: 1 },
  badge: { fontSize: 11, color: "#fff", borderRadius: 5, padding: "2px 7px", fontWeight: 700, whiteSpace: "nowrap" },
  daysChip: { fontSize: 11, background: "#ecfdf5", color: "#065f46", borderRadius: 5, padding: "2px 7px", fontWeight: 700 },
  daysChipUrgent: { background: "#fee2e2", color: "#dc2626" },
  daysChipPast: { fontSize: 11, background: "#f3f4f6", color: "#9ca3af", borderRadius: 5, padding: "2px 7px", fontWeight: 600 },
  nextDeadline: { marginTop: 10, fontSize: 12, color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: 8 },
  upcomingBanner: { background: "#1e3a5f", borderRadius: 14, padding: "16px 20px", marginBottom: 24 },
  upcomingRow: { display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" },
  upcomingChip: { borderRadius: 9, padding: "8px 14px", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 },
  upcomingType: { fontSize: 11, opacity: 0.85 },
  upcomingDays: { fontSize: 16, fontWeight: 800 },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#64748b" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  viewToggle: { display: "flex", borderRadius: 9, overflow: "hidden", border: "1px solid #e2e8f0" },
  toggleActive: { padding: "8px 18px", background: "#1e3a5f", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  toggleInactive: { padding: "8px 18px", background: "#f8fafc", color: "#64748b", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  deadlineRow: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 10, marginBottom: 8 },
  deadlineBadge: { fontSize: 11, color: "#fff", borderRadius: 5, padding: "3px 8px", fontWeight: 700 },
  deadlineInfo: { flex: 1, fontSize: 14 },
  deadlineLabel: { color: "#64748b", fontSize: 13 },
  deadlineMeta: { display: "flex", flexDirection: "column", alignItems: "flex-end", fontSize: 13 },
  countdown: { fontSize: 12, fontWeight: 700 },
  legendRow: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  calNav: { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  calNavBtn: { padding: "6px 16px", background: "#e2e8f0", border: "none", borderRadius: 7, fontSize: 18, cursor: "pointer" },
  calMonthLabel: { fontSize: 18, fontWeight: 700, color: "#1e3a5f" },
  calGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 },
  calDayHeader: { textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", padding: "6px 0" },
  calCell: { minHeight: 90, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 6, verticalAlign: "top" },
  calToday: { background: "#eff6ff", border: "2px solid #3b82f6" },
  calDayNum: { fontSize: 13, fontWeight: 600, color: "#1e3a5f", marginBottom: 4 },
  calEvent: { fontSize: 10, color: "#fff", borderRadius: 4, padding: "2px 5px", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  adminList: { display: "flex", flexDirection: "column", gap: 10 },
  adminRow: { background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" },
  adminLocation: { color: "#64748b", fontSize: 13 },
  adminActions: { display: "flex", gap: 8 },
  editForm: { background: "#fff", borderRadius: 14, padding: 28, border: "1px solid #e2e8f0", maxWidth: 700 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 5 },
  deadlineEditRow: { display: "flex", gap: 8, marginBottom: 8, alignItems: "center" },
  selectSmall: { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 },
  inputDate: { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 },
  inputLabel: { flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 },
  formActions: { display: "flex", gap: 10, marginTop: 20 },
  toast: { position: "fixed", bottom: 28, right: 28, background: "#1e3a5f", color: "#fff", padding: "12px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 6px 24px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s" },
};