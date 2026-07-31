"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TOP_COLLEGES } from "@/lib/colleges";

/* ─── Types ─────────────────────────────────────────────────── */
interface Deadline {
  id: string;
  college_id: string;
  college_name: string;
  deadline_type: string;
  deadline_date: string; // YYYY-MM-DD
  notes: string;
}

interface User {
  email: string;
}

type View = "auth" | "dashboard" | "add";
type UrgencyLevel = "red" | "yellow" | "green" | "past";

/* ─── Helpers ───────────────────────────────────────────────── */
function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

function urgency(days: number): UrgencyLevel {
  if (days < 0) return "past";
  if (days < 7) return "red";
  if (days < 30) return "yellow";
  return "green";
}

function urgencyColor(level: UrgencyLevel) {
  switch (level) {
    case "red":    return { fg: "var(--red)",    bg: "var(--red-bg)" };
    case "yellow": return { fg: "var(--yellow)", bg: "var(--yellow-bg)" };
    case "green":  return { fg: "var(--green)",  bg: "var(--green-bg)" };
    case "past":   return { fg: "var(--text-muted)", bg: "rgba(139,143,168,0.08)" };
  }
}

function badgeClass(type: string) {
  const map: Record<string, string> = {
    EA: "badge-ea", REA: "badge-ea",
    ED: "badge-ed", ED1: "badge-ed1", ED2: "badge-ed2",
    RD: "badge-rd", Rolling: "badge-rolling",
  };
  return "badge " + (map[type] ?? "badge-rd");
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function localKey(email: string) { return `edutracker_deadlines_${email}`; }

function loadLocal(email: string): Deadline[] {
  try {
    const raw = localStorage.getItem(localKey(email));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocal(email: string, dl: Deadline[]) {
  localStorage.setItem(localKey(email), JSON.stringify(dl));
}

/* ─── Countdown hook ────────────────────────────────────────── */
function useCountdown(dateStr: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calc = () => {
      const target = new Date(dateStr + "T23:59:59");
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Past due"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [dateStr]);

  return timeLeft;
}

/* ─── Sub-components ────────────────────────────────────────── */
function CountdownBadge({ dateStr, urgencyLevel }: { dateStr: string; urgencyLevel: UrgencyLevel }) {
  const time = useCountdown(dateStr);
  const { fg } = urgencyColor(urgencyLevel);
  return (
    <span style={{ fontSize: 12, color: fg, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
      {time}
    </span>
  );
}

function DeadlineCard({
  dl,
  onDelete,
}: {
  dl: Deadline;
  onDelete: (id: string) => void;
}) {
  const days = daysUntil(dl.deadline_date);
  const level = urgency(days);
  const { fg, bg } = urgencyColor(level);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className="fade-in"
      style={{
        background: "var(--surface)",
        border: `1.5px solid ${fg}44`,
        borderRadius: "var(--radius)",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        position: "relative",
        transition: "box-shadow 0.2s",
      }}
    >
      {/* Urgency strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3,
        borderRadius: "var(--radius) var(--radius) 0 0",
        background: level === "past" ? "var(--border)" : fg,
        opacity: level === "past" ? 0.3 : 1,
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginTop: 4 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {dl.college_name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span className={badgeClass(dl.deadline_type)}>{dl.deadline_type}</span>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{formatDate(dl.deadline_date)}</span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              display: "inline-block",
              background: bg,
              color: fg,
              borderRadius: "var(--radius-sm)",
              padding: "4px 10px",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {level === "past" ? "Past" : days === 0 ? "TODAY" : `${days}d`}
          </div>
          <div style={{ marginTop: 4 }}>
            <CountdownBadge dateStr={dl.deadline_date} urgencyLevel={level} />
          </div>
        </div>
      </div>

      {dl.notes && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          {dl.notes}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {confirming ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onDelete(dl.id)}
              style={{
                background: "var(--red)", color: "#fff",
                borderRadius: "var(--radius-sm)", padding: "4px 12px", fontSize: 13, fontWeight: 700,
              }}
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                background: "var(--surface2)", color: "var(--text-muted)",
                borderRadius: "var(--radius-sm)", padding: "4px 12px", fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            style={{ color: "var(--text-muted)", fontSize: 13 }}
          >
            ✕ Remove
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Auth Panel ────────────────────────────────────────────── */
function AuthPanel({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !password) { setError("Enter email and password."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        onAuth({ email: data.email });
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 24,
    }}>
      <div style={{
        background: "var(--surface)", border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)", padding: 40, width: "100%", maxWidth: 420,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--accent2)" }}>Edutracker</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>
            Never miss a college deadline again
          </div>
        </div>

        {/* Tab */}
        <div style={{
          display: "flex", background: "var(--surface2)",
          borderRadius: "var(--radius-sm)", padding: 4, marginBottom: 24,
        }}>
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: "var(--radius-sm)",
                fontWeight: 600, fontSize: 14,
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "#fff" : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              {m === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {error && (
            <div style={{
              background: "var(--red-bg)", color: "var(--red)",
              borderRadius: "var(--radius-sm)", padding: "10px 14px", fontSize: 14,
            }}>
              {error}
            </div>
          )}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: loading ? "var(--border)" : "var(--accent)",
              color: "#fff", borderRadius: "var(--radius-sm)", padding: "12px 0",
              fontWeight: 700, fontSize: 15, transition: "background 0.2s",
            }}
          >
            {loading ? "Loading…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Deadline Panel ────────────────────────────────────── */
function AddDeadlinePanel({
  onAdd,
  onCancel,
}: {
  onAdd: (d: Omit<Deadline, "id">) => void;
  onCancel: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<{ id: string; name: string } | null>(null);
  const [manualName, setManualName] = useState("");
  const [deadlineType, setDeadlineType] = useState("RD");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const deadlineTypes = ["EA", "REA", "ED", "ED1", "ED2", "RD", "Rolling", "Other"];

  const filtered = searchQuery.length >= 1
    ? TOP_COLLEGES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : [];

  const selectCollege = (c: typeof TOP_COLLEGES[0]) => {
    setSelectedCollege({ id: c.id, name: c.name });
    setSearchQuery(c.name);
    setShowDropdown(false);
    // Pre-fill deadline type and date from commonDeadlines
    if (c.commonDeadlines.length > 0) {
      const cd = c.commonDeadlines[0];
      setDeadlineType(cd.type);
      const year = new Date().getFullYear();
      const [mm, dd] = cd.defaultDate.split("-");
      // Guess year: if month-day is already past, use next year
      const candidate = new Date(`${year}-${mm}-${dd}T00:00:00`);
      const useYear = candidate < new Date() ? year + 1 : year;
      setDeadlineDate(`${useYear}-${mm}-${dd}`);
    }
  };

  const presetDates = selectedCollege
    ? TOP_COLLEGES.find((c) => c.id === selectedCollege.id)?.commonDeadlines ?? []
    : [];

  const applyPreset = (preset: { type: string; defaultDate: string }) => {
    setDeadlineType(preset.type);
    const year = new Date().getFullYear();
    const [mm, dd] = preset.defaultDate.split("-");
    const candidate = new Date(`${year}-${mm}-${dd}T00:00:00`);
    const useYear = candidate < new Date() ? year + 1 : year;
    setDeadlineDate(`${useYear}-${mm}-${dd}`);
  };

  const handleAdd = () => {
    const name = isManual ? manualName.trim() : selectedCollege?.name ?? "";
    if (!name) { alert("Please enter a college name."); return; }
    if (!deadlineDate) { alert("Please select a deadline date."); return; }
    onAdd({
      college_id: isManual ? "" : (selectedCollege?.id ?? ""),
      college_name: name,
      deadline_type: deadlineType,
      deadline_date: deadlineDate,
      notes: notes.trim(),
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 24,
    }}>
      <div className="fade-in" style={{
        background: "var(--surface)", border: "1.5px solid var(--border)",
        borderRadius: "var(--radius)", padding: 32, width: "100%", maxWidth: 520,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: 20 }}>Add Deadline</h2>
          <button onClick={onCancel} style={{ color: "var(--text-muted)", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setIsManual(false)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 13,
              background: !isManual ? "var(--accent)" : "var(--surface2)",
              color: !isManual ? "#fff" : "var(--text-muted)",
            }}
          >
            🔍 Search Colleges
          </button>
          <button
            onClick={() => setIsManual(true)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 13,
              background: isManual ? "var(--accent)" : "var(--surface2)",
              color: isManual ? "#fff" : "var(--text-muted)",
            }}
          >
            ✏️ Enter Manually
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* College input */}
          {isManual ? (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                College Name
              </label>
              <input
                placeholder="e.g. University of Example"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
              />
            </div>
          ) : (
            <div ref={searchRef} style={{ position: "relative" }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
                Search College
              </label>
              <input
                placeholder="Type to search 200+ colleges…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCollege(null);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filtered.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "var(--surface2)", border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-sm)", zIndex: 200, marginTop: 4,
                  maxHeight: 260, overflowY: "auto",
                }}>
                  {filtered.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => selectCollege(c)}
                      style={{
                        padding: "10px 14px", cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{c.location}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preset deadline buttons */}
          {!isManual && presetDates.length > 0 && (
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-muted)" }}>
                Common Deadlines (click to auto-fill)
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {presetDates.map((pd, i) => (
                  <button
                    key={i}
                    onClick={() => applyPreset(pd)}
                    style={{
                      background: "var(--surface2)", border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-sm)", padding: "6px 12px",
                      fontSize: 13, fontWeight: 600, color: "var(--accent2)",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    {pd.type} · {pd.defaultDate}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Deadline type */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
              Deadline Type
            </label>
            <select value={deadlineType} onChange={(e) => setDeadlineType(e.target.value)}>
              {deadlineTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
              Deadline Date
            </label>
            <input
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--text-muted)" }}>
              Notes (optional)
            </label>
            <textarea
              placeholder="e.g. need SAT scores, essay prompt 2…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: "11px 0", borderRadius: "var(--radius-sm)",
                background: "var(--surface2)", color: "var(--text-muted)", fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                flex: 2, padding: "11px 0", borderRadius: "var(--radius-sm)",
                background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 15,
              }}
            >
              Add Deadline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────── */
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("auth");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [sortBy, setSortBy] = useState<"date" | "urgency" | "school">("date");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Track page
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Check localStorage for persisted session
  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try {
        const u = JSON.parse(saved) as User;
        setUser(u);
        setView("dashboard");
      } catch {}
    }
  }, []);

  // Load deadlines when user changes
  const loadDeadlines = useCallback(async (email: string) => {
    setLoading(true);
    // Start from localStorage
    const local = loadLocal(email);
    setDeadlines(local);
    // Sync from DB
    try {
      const res = await fetch(`/api/deadlines?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.deadlines && data.deadlines.length > 0) {
        const dbDeadlines: Deadline[] = data.deadlines.map((r: {
          id: number | string;
          college_id: string;
          college_name: string;
          deadline_type: string;
          deadline_date: string;
          notes: string;
        }) => ({
          id: String(r.id),
          college_id: r.college_id,
          college_name: r.college_name,
          deadline_type: r.deadline_type,
          deadline_date: r.deadline_date,
          notes: r.notes,
        }));
        setDeadlines(dbDeadlines);
        saveLocal(email, dbDeadlines);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadDeadlines(user.email);
  }, [user, loadDeadlines]);

  const handleAuth = (u: User) => {
    setUser(u);
    localStorage.setItem("edutracker_user", JSON.stringify(u));
    setView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setDeadlines([]);
    setView("auth");
    localStorage.removeItem("edutracker_user");
  };

  const handleAddDeadline = async (d: Omit<Deadline, "id">) => {
    if (!user) return;
    const tempId = `local_${Date.now()}`;
    const newDl: Deadline = { ...d, id: tempId };
    const updated = [...deadlines, newDl].sort((a, b) => a.deadline_date.localeCompare(b.deadline_date));
    setDeadlines(updated);
    saveLocal(user.email, updated);
    setShowAdd(false);

    // Persist to DB
    setSyncing(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, ...d }),
      });
      const data = await res.json();
      if (data.deadline) {
        const withRealId = updated.map((dl) =>
          dl.id === tempId ? { ...dl, id: String(data.deadline.id) } : dl
        );
        setDeadlines(withRealId);
        saveLocal(user.email, withRealId);
      }
    } catch {}
    setSyncing(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const updated = deadlines.filter((d) => d.id !== id);
    setDeadlines(updated);
    saveLocal(user.email, updated);

    if (!id.startsWith("local_")) {
      try {
        await fetch(`/api/deadlines?id=${id}&email=${encodeURIComponent(user.email)}`, {
          method: "DELETE",
        });
      } catch {}
    }
  };

  // Filter & sort
  const visibleDeadlines = deadlines
    .filter((d) => {
      const days = daysUntil(d.deadline_date);
      if (filter === "upcoming" && days < 0) return false;
      if (filter === "past" && days >= 0) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return d.college_name.toLowerCase().includes(q) || d.deadline_type.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") return a.deadline_date.localeCompare(b.deadline_date);
      if (sortBy === "urgency") return daysUntil(a.deadline_date) - daysUntil(b.deadline_date);
      return a.college_name.localeCompare(b.college_name);
    });

  const stats = {
    total: deadlines.filter((d) => daysUntil(d.deadline_date) >= 0).length,
    critical: deadlines.filter((d) => { const days = daysUntil(d.deadline_date); return days >= 0 && days < 7; }).length,
    soon: deadlines.filter((d) => { const days = daysUntil(d.deadline_date); return days >= 7 && days < 30; }).length,
    safe: deadlines.filter((d) => daysUntil(d.deadline_date) >= 30).length,
  };

  if (view === "auth") {
    return <AuthPanel onAuth={handleAuth} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        background: "var(--surface)", borderBottom: "1.5px solid var(--border)",
        padding: "0 24px", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", display: "flex",
          alignItems: "center", justifyContent: "space-between", height: 60,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🎓</span>
            <span style={{ fontWeight: 800, fontSize: 18, color: "var(--accent2)" }}>Edutracker</span>
            {syncing && <span style={{ fontSize: 11, color: "var(--text-muted)" }} className="pulsing">syncing…</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{user?.email}</span>
            <button
              onClick={handleLogout}
              style={{
                color: "var(--text-muted)", fontSize: 13, borderRadius: "var(--radius-sm)",
                padding: "5px 12px", border: "1px solid var(--border)",
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12, marginBottom: 28,
        }}>
          {[
            { label: "Upcoming", value: stats.total, color: "var(--text)" },
            { label: "Critical (<7d)", value: stats.critical, color: "var(--red)" },
            { label: "Soon (<30d)", value: stats.soon, color: "var(--yellow)" },
            { label: "On Track", value: stats.safe, color: "var(--green)" },
          ].map((s) => (
            <div key={s.label} style={{
              background: "var(--surface)", border: "1.5px solid var(--border)",
              borderRadius: "var(--radius)", padding: "16px 20px",
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20,
          alignItems: "center",
        }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <input
              placeholder="Search deadlines…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{
            display: "flex", background: "var(--surface2)",
            borderRadius: "var(--radius-sm)", padding: 3, gap: 3,
          }}>
            {(["upcoming", "all", "past"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "6px 14px", borderRadius: "var(--radius-sm)", fontSize: 13, fontWeight: 600,
                  background: filter === f ? "var(--accent)" : "transparent",
                  color: filter === f ? "#fff" : "var(--text-muted)",
                }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{ width: "auto", padding: "8px 12px" }}
          >
            <option value="date">Sort: Date</option>
            <option value="urgency">Sort: Urgency</option>
            <option value="school">Sort: School</option>
          </select>

          {/* Add button */}
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: "var(--accent)", color: "#fff",
              borderRadius: "var(--radius-sm)", padding: "9px 20px",
              fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
            }}
          >
            + Add Deadline
          </button>
        </div>

        {/* Deadline grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
            Loading deadlines…
          </div>
        ) : visibleDeadlines.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "80px 24px",
            background: "var(--surface)", border: "1.5px solid var(--border)",
            borderRadius: "var(--radius)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              {filter === "past" ? "No past deadlines" : "No deadlines yet"}
            </div>
            <div style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
              {filter === "past"
                ? "Deadlines you've passed will appear here."
                : "Add your first college deadline to get started!"}
            </div>
            {filter !== "past" && (
              <button
                onClick={() => setShowAdd(true)}
                style={{
                  background: "var(--accent)", color: "#fff",
                  borderRadius: "var(--radius-sm)", padding: "12px 28px",
                  fontWeight: 700, fontSize: 15,
                }}
              >
                + Add Your First Deadline
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleDeadlines.map((dl) => (
              <DeadlineCard key={dl.id} dl={dl} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Add panel modal */}
      {showAdd && (
        <AddDeadlinePanel
          onAdd={handleAddDeadline}
          onCancel={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}