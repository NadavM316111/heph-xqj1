"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  school: string;
  deadline: string;
  type: string;
  status: string;
  notes: string;
}

const APP_TYPES = ["Early Decision", "Early Action", "Regular Decision", "Rolling"];
const STATUSES = ["Not Started", "In Progress", "Submitted", "Accepted", "Rejected", "Waitlisted"];

const POPULAR_SCHOOLS = [
  "Harvard University", "Stanford University", "MIT", "Yale University",
  "Princeton University", "Columbia University", "UPenn", "Brown University",
  "Dartmouth College", "Cornell University", "Duke University", "Northwestern University",
  "Johns Hopkins University", "Vanderbilt University", "Rice University",
  "Washington University in St. Louis", "Notre Dame", "Georgetown University",
  "Carnegie Mellon University", "UC Berkeley", "UCLA", "University of Michigan",
  "University of Virginia", "UNC Chapel Hill", "Boston College", "Tufts University",
  "Emory University", "NYU", "USC", "Boston University", "Northeastern University",
  "University of Florida", "Ohio State University", "Penn State", "Purdue University",
  "Georgia Tech", "University of Texas at Austin", "University of Wisconsin",
  "University of Illinois", "University of Washington",
];

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number, status: string): string {
  if (status === "Submitted" || status === "Accepted" || status === "Rejected" || status === "Waitlisted") return "#e0e0e0";
  if (days < 0) return "#ffcdd2";
  if (days <= 7) return "#fff3e0";
  if (days <= 30) return "#fff9c4";
  return "#e8f5e9";
}

function urgencyBadgeColor(days: number, status: string): { bg: string; color: string } {
  if (status === "Submitted" || status === "Accepted" || status === "Rejected" || status === "Waitlisted")
    return { bg: "#bdbdbd", color: "#fff" };
  if (days < 0) return { bg: "#e53935", color: "#fff" };
  if (days <= 7) return { bg: "#f57c00", color: "#fff" };
  if (days <= 30) return { bg: "#f9a825", color: "#fff" };
  return { bg: "#388e3c", color: "#fff" };
}

function statusColor(status: string): string {
  switch (status) {
    case "Submitted": return "#1565c0";
    case "Accepted": return "#2e7d32";
    case "Rejected": return "#c62828";
    case "Waitlisted": return "#6a1b9a";
    case "In Progress": return "#e65100";
    default: return "#555";
  }
}

export default function Home() {
  const [apps, setApps] = useState<Application[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ school: "", deadline: "", type: "Regular Decision", status: "Not Started", notes: "" });
  const [schoolInput, setSchoolInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortKey, setSortKey] = useState<"deadline" | "school" | "status">("deadline");
  const [filterStatus, setFilterStatus] = useState("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "list">("dashboard");

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_apps");
    if (stored) {
      try { setApps(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  function save(updated: Application[]) {
    setApps(updated);
    localStorage.setItem("edutracker_apps", JSON.stringify(updated));
  }

  function openAdd() {
    setEditingId(null);
    setForm({ school: "", deadline: "", type: "Regular Decision", status: "Not Started", notes: "" });
    setSchoolInput("");
    setModalOpen(true);
  }

  function openEdit(app: Application) {
    setEditingId(app.id);
    setForm({ school: app.school, deadline: app.deadline, type: app.type, status: app.status, notes: app.notes });
    setSchoolInput(app.school);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.school.trim() || !form.deadline) return;
    if (editingId) {
      save(apps.map(a => a.id === editingId ? { ...a, ...form } : a));
    } else {
      save([...apps, { id: generateId(), ...form }]);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    save(apps.filter(a => a.id !== id));
    setDeleteConfirmId(null);
  }

  const suggestions = schoolInput.length > 0
    ? POPULAR_SCHOOLS.filter(s => s.toLowerCase().includes(schoolInput.toLowerCase())).slice(0, 6)
    : [];

  const filteredApps = apps
    .filter(a => filterStatus === "All" || a.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === "deadline") return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      if (sortKey === "school") return a.school.localeCompare(b.school);
      if (sortKey === "status") return a.status.localeCompare(b.status);
      return 0;
    });

  const upcoming = apps
    .filter(a => {
      const d = daysUntil(a.deadline);
      return d >= 0 && d <= 30 && a.status !== "Submitted" && a.status !== "Accepted" && a.status !== "Rejected";
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const overdue = apps.filter(a => daysUntil(a.deadline) < 0 && a.status !== "Submitted" && a.status !== "Accepted" && a.status !== "Rejected" && a.status !== "Waitlisted");
  const submitted = apps.filter(a => a.status === "Submitted" || a.status === "Accepted" || a.status === "Rejected" || a.status === "Waitlisted");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#1a237e", color: "#fff", padding: "0 0 0 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "22px 24px 0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Edutracker</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>College Application Deadline Tracker</div>
          </div>
          <button onClick={openAdd} style={{ background: "#fff", color: "#1a237e", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            + Add Application
          </button>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px 0 24px", display: "flex", gap: 0 }}>
          {(["dashboard", "list"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "none", border: "none", color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.6)",
              fontWeight: activeTab === tab ? 700 : 400, fontSize: 14, cursor: "pointer",
              padding: "8px 18px 12px 18px", borderBottom: activeTab === tab ? "3px solid #fff" : "3px solid transparent",
              textTransform: "capitalize"
            }}>
              {tab === "dashboard" ? "Dashboard" : "All Applications"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px" }}>
        {activeTab === "dashboard" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total", value: apps.length, color: "#1a237e" },
                { label: "Submitted", value: submitted.length, color: "#1565c0" },
                { label: "Due Soon (30d)", value: upcoming.length, color: "#e65100" },
                { label: "Overdue", value: overdue.length, color: "#c62828" },
              ].map(stat => (
                <div key={stat.label} style={{ background: "#fff", borderRadius: 10, padding: "18px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", borderTop: `4px solid ${stat.color}` }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Overdue */}
            {overdue.length > 0 && (
              <div style={{ background: "#ffebee", border: "1px solid #ef9a9a", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, color: "#c62828", marginBottom: 10, fontSize: 14 }}>Overdue Deadlines</div>
                {overdue.map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #ffcdd2" }}>
                    <span style={{ fontWeight: 600, color: "#333" }}>{a.school}</span>
                    <span style={{ fontSize: 12, color: "#c62828", fontWeight: 600 }}>{a.deadline} (overdue by {Math.abs(daysUntil(a.deadline))}d)</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming */}
            <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "20px 20px", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 14 }}>Upcoming Deadlines (Next 30 Days)</div>
              {upcoming.length === 0 ? (
                <div style={{ color: "#aaa", fontSize: 14 }}>No deadlines in the next 30 days.</div>
              ) : (
                upcoming.map(a => {
                  const days = daysUntil(a.deadline);
                  const badge = urgencyBadgeColor(days, a.status);
                  return (
                    <div key={a.id} onClick={() => openEdit(a)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: urgencyColor(days, a.status), cursor: "pointer" }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#222", fontSize: 14 }}>{a.school}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{a.type} &mdash; <span style={{ color: statusColor(a.status), fontWeight: 600 }}>{a.status}</span></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 700 }}>
                          {days === 0 ? "Today" : `${days}d`}
                        </span>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{a.deadline}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* All apps preview */}
            {apps.length > 0 && (
              <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "20px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#222", marginBottom: 14 }}>All Applications</div>
                {apps
                  .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                  .map(a => {
                    const days = daysUntil(a.deadline);
                    const badge = urgencyBadgeColor(days, a.status);
                    return (
                      <div key={a.id} onClick={() => openEdit(a)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 6, background: urgencyColor(days, a.status), cursor: "pointer" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#222", fontSize: 14 }}>{a.school}</div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>{a.type} &mdash; <span style={{ color: statusColor(a.status), fontWeight: 600 }}>{a.status}</span></div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 700 }}>
                            {days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d`}
                          </span>
                          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{a.deadline}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {apps.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#aaa" }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No applications yet</div>
                <div style={{ fontSize: 14 }}>Click &quot;Add Application&quot; to start tracking your college deadlines.</div>
              </div>
            )}
          </>
        )}

        {activeTab === "list" && (
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: "20px" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: 12, color: "#777", marginRight: 6 }}>Sort by:</label>
                <select value={sortKey} onChange={e => setSortKey(e.target.value as "deadline" | "school" | "status")} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 13 }}>
                  <option value="deadline">Deadline</option>
                  <option value="school">School</option>
                  <option value="status">Status</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#777", marginRight: 6 }}>Filter:</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ border: "1px solid #ddd", borderRadius: 6, padding: "5px 10px", fontSize: 13 }}>
                  <option value="All">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div style={{ color: "#aaa", fontSize: 14, padding: "30px 0", textAlign: "center" }}>No applications match your filter.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    {["School", "Type", "Deadline", "Days Left", "Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#555", fontWeight: 600, fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map(a => {
                    const days = daysUntil(a.deadline);
                    const badge = urgencyBadgeColor(days, a.status);
                    return (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f0f0f0", background: urgencyColor(days, a.status) }}>
                        <td style={{ padding: "10px 10px", fontWeight: 600, color: "#222" }}>{a.school}</td>
                        <td style={{ padding: "10px 10px", color: "#555" }}>{a.type}</td>
                        <td style={{ padding: "10px 10px", color: "#555" }}>{a.deadline}</td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                            {days < 0 ? "Overdue" : days === 0 ? "Today" : `${days}d`}
                          </span>
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <span style={{ color: statusColor(a.status), fontWeight: 600 }}>{a.status}</span>
                        </td>
                        <td style={{ padding: "10px 10px" }}>
                          <button onClick={() => openEdit(a)} style={{ background: "#e3f2fd", color: "#1565c0", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", marginRight: 6, fontWeight: 600 }}>Edit</button>
                          <button onClick={() => setDeleteConfirmId(a.id)} style={{ background: "#ffebee", color: "#c62828", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "32px 28px", width: "100%", maxWidth: 460, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", position: "relative" }}>
            <div style={{ fontWeight: 800, fontSize: 19, marginBottom: 22, color: "#1a237e" }}>
              {editingId ? "Edit Application" : "Add Application"}
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16, position: "relative" }}>
                <label style={labelStyle}>School Name</label>
                <input
                  value={schoolInput}
                  onChange={e => {
                    setSchoolInput(e.target.value);
                    setForm(f => ({ ...f, school: e.target.value }));
                    setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder="e.g. Harvard University"
                  style={inputStyle}
                  required
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #ddd", borderRadius: 8, zIndex: 200, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
                    {suggestions.map(s => (
                      <div key={s} onMouseDown={() => { setSchoolInput(s); setForm(f => ({ ...f, school: s })); setShowSuggestions(false); }}
                        style={{ padding: "9px 14px", cursor: "pointer", fontSize: 14, borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                      >{s}</div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Deadline</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={inputStyle} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Application Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
                  {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Notes (optional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Essay prompts, interview dates, requirements..." style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                {editingId && (
                  <button type="button" onClick={() => setDeleteConfirmId(editingId)} style={{ background: "#ffebee", color: "#c62828", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Delete</button>
                )}
                <button type="submit" style={{ background: "#1a237e", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {editingId ? "Save Changes" : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirmId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "28px 28px", width: "100%", maxWidth: 360, boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#c62828", marginBottom: 10 }}>Delete Application</div>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 22 }}>Are you sure you want to delete this application? This cannot be undone.</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ background: "#f0f0f0", color: "#333", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { handleDelete(deleteConfirmId); setModalOpen(false); }} style={{ background: "#c62828", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 5,
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #ddd", borderRadius: 8, padding: "9px 12px",
  fontSize: 14, boxSizing: "border-box", fontFamily: "inherit", outline: "none",
};