"use client";

import { useState, useEffect } from "react";

interface Application {
  id: string;
  schoolName: string;
  deadline: string;
  type: "EA" | "ED" | "RD" | "ED2" | "Rolling";
  status: "Not Started" | "In Progress" | "Submitted";
  notes: string;
}

const STORAGE_KEY = "edutracker_applications";

const SCHOOL_SUGGESTIONS = [
  "Harvard University", "Yale University", "Princeton University",
  "MIT", "Stanford University", "Columbia University",
  "University of Pennsylvania", "Brown University", "Dartmouth College",
  "Cornell University", "Duke University", "Northwestern University",
  "Johns Hopkins University", "Vanderbilt University", "Rice University",
  "Washington University in St. Louis", "Notre Dame", "Georgetown University",
  "Emory University", "Carnegie Mellon University", "UC Berkeley",
  "UCLA", "University of Michigan", "University of Virginia",
  "University of North Carolina", "Boston College", "Tufts University",
  "New York University", "University of Southern California",
  "Boston University", "Northeastern University", "Tulane University",
  "Wake Forest University", "Villanova University", "Fordham University",
];

const TYPE_COLORS: Record<Application["type"], string> = {
  EA: "#3b82f6",
  ED: "#8b5cf6",
  RD: "#6b7280",
  ED2: "#ec4899",
  Rolling: "#f59e0b",
};

const STATUS_COLORS: Record<Application["status"], string> = {
  "Not Started": "#ef4444",
  "In Progress": "#f59e0b",
  "Submitted": "#10b981",
};

function daysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const defaultForm = (): Omit<Application, "id"> => ({
  schoolName: "",
  deadline: "",
  type: "RD",
  status: "Not Started",
  notes: "",
});

export default function Home() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm());
  const [filter, setFilter] = useState<"all" | Application["status"]>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "school" | "status">("deadline");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked) {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: window.location.pathname }),
      });
      setTracked(true);
    }
  }, [tracked]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setApplications(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  }, [applications]);

  const openAdd = () => {
    setEditingId(null);
    setForm(defaultForm());
    setShowModal(true);
  };

  const openEdit = (app: Application) => {
    setEditingId(app.id);
    setForm({ schoolName: app.schoolName, deadline: app.deadline, type: app.type, status: app.status, notes: app.notes });
    setShowModal(true);
    setExpandedId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(defaultForm());
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolName.trim() || !form.deadline) return;
    if (editingId) {
      setApplications(prev => prev.map(a => a.id === editingId ? { ...form, id: editingId } : a));
    } else {
      setApplications(prev => [...prev, { ...form, id: generateId() }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setApplications(prev => prev.filter(a => a.id !== id));
    setDeleteConfirmId(null);
    setExpandedId(null);
  };

  const filteredAndSorted = applications
    .filter(a => filter === "all" || a.status === filter)
    .filter(a => a.schoolName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "deadline") return a.deadline.localeCompare(b.deadline);
      if (sortBy === "school") return a.schoolName.localeCompare(b.schoolName);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const urgentCount = applications.filter(a => {
    const d = daysUntil(a.deadline);
    return d >= 0 && d <= 14 && a.status !== "Submitted";
  }).length;

  const submittedCount = applications.filter(a => a.status === "Submitted").length;

  const suggestions = SCHOOL_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(form.schoolName.toLowerCase()) && form.schoolName.length > 0
  ).slice(0, 6);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        color: "#fff",
        padding: "0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🎓</span>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>Edutracker</h1>
            </div>
            <p style={{ margin: "2px 0 0 38px", fontSize: 13, opacity: 0.8 }}>Never miss a college application deadline</p>
          </div>
          <button onClick={openAdd} style={{
            background: "#fff",
            color: "#2563eb",
            border: "none",
            borderRadius: 10,
            padding: "10px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Application
          </button>
        </div>

        {/* Stats bar */}
        {applications.length > 0 && (
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.1)" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px", display: "flex", gap: 32, flexWrap: "wrap" }}>
              <Stat label="Total" value={applications.length} />
              <Stat label="Submitted" value={submittedCount} color="#86efac" />
              <Stat label="Urgent (≤14d)" value={urgentCount} color={urgentCount > 0 ? "#fca5a5" : "#86efac"} />
              <Stat label="Remaining" value={applications.length - submittedCount} color="#fde68a" />
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {applications.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <>
            {/* Controls */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="🔍  Search schools..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: "1 1 200px",
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1.5px solid #e2e8f0",
                  fontSize: 14,
                  background: "#fff",
                  outline: "none",
                }}
              />
              <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} style={selectStyle}>
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Submitted">Submitted</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={selectStyle}>
                <option value="deadline">Sort: Deadline</option>
                <option value="school">Sort: School</option>
                <option value="status">Sort: Status</option>
              </select>
            </div>

            {filteredAndSorted.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#94a3b8" }}>
                <div style={{ fontSize: 40 }}>🔍</div>
                <p style={{ marginTop: 8 }}>No applications match your filters.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredAndSorted.map(app => {
                  const days = daysUntil(app.deadline);
                  const isExpanded = expandedId === app.id;
                  const isOverdue = days < 0;
                  const isUrgent = days >= 0 && days <= 7;
                  const isSoon = days > 7 && days <= 14;

                  let urgencyBorder = "#e2e8f0";
                  if (app.status !== "Submitted") {
                    if (isOverdue) urgencyBorder = "#ef4444";
                    else if (isUrgent) urgencyBorder = "#f97316";
                    else if (isSoon) urgencyBorder = "#f59e0b";
                  }

                  return (
                    <div key={app.id} style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: `1.5px solid ${urgencyBorder}`,
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      overflow: "hidden",
                      transition: "box-shadow 0.15s",
                    }}>
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}
                      >
                        {/* School + type */}
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{app.schoolName}</span>
                            <span style={{
                              background: TYPE_COLORS[app.type],
                              color: "#fff",
                              borderRadius: 6,
                              padding: "2px 8px",
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: "0.5px",
                            }}>{app.type}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                            Due: {formatDate(app.deadline)}
                          </div>
                        </div>

                        {/* Countdown */}
                        <div style={{ textAlign: "center", minWidth: 80 }}>
                          {app.status === "Submitted" ? (
                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: 14 }}>✓ Submitted</span>
                          ) : isOverdue ? (
                            <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>Overdue</span>
                          ) : (
                            <>
                              <div style={{
                                fontSize: 22,
                                fontWeight: 800,
                                color: isUrgent ? "#f97316" : isSoon ? "#f59e0b" : "#2563eb",
                              }}>{days}</div>
                              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>DAYS LEFT</div>
                            </>
                          )}
                        </div>

                        {/* Status badge */}
                        <div>
                          <span style={{
                            background: STATUS_COLORS[app.status] + "22",
                            color: STATUS_COLORS[app.status],
                            borderRadius: 8,
                            padding: "4px 12px",
                            fontSize: 12,
                            fontWeight: 700,
                            border: `1px solid ${STATUS_COLORS[app.status]}44`,
                          }}>{app.status}</span>
                        </div>

                        <span style={{ color: "#cbd5e1", fontSize: 18, marginLeft: 4 }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #f1f5f9", padding: "14px 20px", background: "#f8fafc" }}>
                          {app.notes && (
                            <div style={{ marginBottom: 12 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Notes</span>
                              <p style={{ margin: "4px 0 0", fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{app.notes}</p>
                            </div>
                          )}
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {/* Quick status change */}
                            <div style={{ flex: 1, minWidth: 180 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>Quick Update Status</span>
                              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                                {(["Not Started", "In Progress", "Submitted"] as Application["status"][]).map(s => (
                                  <button
                                    key={s}
                                    onClick={(e) => { e.stopPropagation(); setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: s } : a)); }}
                                    style={{
                                      padding: "5px 10px",
                                      borderRadius: 6,
                                      border: `1.5px solid ${STATUS_COLORS[s]}`,
                                      background: app.status === s ? STATUS_COLORS[s] : "transparent",
                                      color: app.status === s ? "#fff" : STATUS_COLORS[s],
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >{s}</button>
                                ))}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginLeft: "auto" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(app); }}
                                style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #2563eb", background: "#eff6ff", color: "#2563eb", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                              >✏️ Edit</button>
                              {deleteConfirmId === app.id ? (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }}
                                    style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                  >Confirm Delete</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                    style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                  >Cancel</button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(app.id); }}
                                  style={{ padding: "7px 16px", borderRadius: 8, border: "1.5px solid #fca5a5", background: "#fef2f2", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                                >🗑️ Delete</button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
                {editingId ? "Edit Application" : "Add Application"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* School Name */}
              <div style={{ position: "relative" }}>
                <label style={labelStyle}>School Name *</label>
                <input
                  type="text"
                  value={form.schoolName}
                  onChange={e => { setForm(f => ({ ...f, schoolName: e.target.value })); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="e.g. Harvard University"
                  required
                  style={inputStyle}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, background: "#fff",
                    border: "1.5px solid #e2e8f0", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 10, marginTop: 2, overflow: "hidden",
                  }}>
                    {suggestions.map(s => (
                      <div
                        key={s}
                        onClick={() => { setForm(f => ({ ...f, schoolName: s })); setShowSuggestions(false); }}
                        style={{ padding: "9px 14px", cursor: "pointer", fontSize: 14, color: "#374151" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >{s}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deadline */}
              <div>
                <label style={labelStyle}>Application Deadline *</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div>
                <label style={labelStyle}>Application Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Application["type"] }))} style={inputStyle}>
                  <option value="RD">Regular Decision (RD)</option>
                  <option value="EA">Early Action (EA)</option>
                  <option value="ED">Early Decision (ED)</option>
                  <option value="ED2">Early Decision II (ED2)</option>
                  <option value="Rolling">Rolling Admission</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Application["status"] }))} style={inputStyle}>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Submitted">Submitted</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Essay requirements, portal login info, etc."
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0",
                  background: "#fff", color: "#64748b", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}>Cancel</button>
                <button type="submit" style={{
                  flex: 2, padding: "11px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #1e3a5f, #2563eb)", color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>{editingId ? "Save Changes" : "Add Application"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = "#fff" }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 24px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1e293b" }}>No applications yet</h2>
      <p style={{ color: "#64748b", marginTop: 8, marginBottom: 28, fontSize: 15, maxWidth: 380, margin: "8px auto 28px" }}>
        Start tracking your college applications so you never miss an important deadline.
      </p>
      <button onClick={onAdd} style={{
        background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
        color: "#fff", border: "none", borderRadius: 12,
        padding: "13px 28px", fontWeight: 700, fontSize: 15, cursor: "pointer",
        boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
      }}>
        + Add Your First Application
      </button>

      {/* Demo prompt */}
      <div style={{ marginTop: 48, padding: "20px 24px", background: "#fff", borderRadius: 12, border: "1.5px solid #e2e8f0", maxWidth: 480, margin: "48px auto 0" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", fontWeight: 600 }}>💡 Track key deadlines like:</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10, justifyContent: "center" }}>
          {["Early Action (Nov 1)", "Early Decision (Nov 1)", "Regular Decision (Jan 1)", "Rolling Admissions"].map(t => (
            <span key={t} style={{ background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1.5px solid #e2e8f0",
  fontSize: 14,
  color: "#1e293b",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#374151",
  marginBottom: 6,
};

const selectStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid #e2e8f0",
  fontSize: 13,
  background: "#fff",
  color: "#374151",
  cursor: "pointer",
  outline: "none",
};