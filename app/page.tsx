"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College } from "../lib/colleges";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStep = "auth" | "onboarding-schools" | "onboarding-reminders" | "dashboard";

interface UserPrefs {
  email: string;
  selectedSchools: string[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  phone: string;
  reminder30: boolean;
  reminder7: boolean;
  reminder1: boolean;
}

interface DeadlineEntry {
  college: College;
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  dateStr: string; // MM/DD
  date: Date;
  daysLeft: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDeadlineDate(mmdd: string): Date {
  const [month, day] = mmdd.split("/").map(Number);
  const now = new Date();
  const year = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() > day)
    ? now.getFullYear() + 1
    : now.getFullYear();
  return new Date(year, month - 1, day, 23, 59, 59);
}

function getDaysLeft(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number): string {
  if (days <= 7) return "var(--red)";
  if (days <= 30) return "var(--yellow)";
  return "var(--green)";
}

function formatCountdown(days: number): string {
  if (days < 0) return "Passed";
  if (days === 0) return "Today!";
  if (days === 1) return "1 day";
  return `${days} days`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function buildDeadlines(colleges: College[]): DeadlineEntry[] {
  const entries: DeadlineEntry[] = [];
  for (const college of colleges) {
    const types = ["EA", "ED", "ED2", "RD", "Scholarship"] as const;
    for (const type of types) {
      const val = college.deadlines[type];
      if (val) {
        const date = getDeadlineDate(val);
        const daysLeft = getDaysLeft(date);
        if (daysLeft >= -7) {
          entries.push({ college, type, dateStr: val, date, daysLeft });
        }
      }
    }
  }
  return entries.sort((a, b) => a.daysLeft - b.daysLeft);
}

const STORAGE_KEY = "edutracker_prefs";

function loadPrefs(): Partial<UserPrefs> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function savePrefs(prefs: Partial<UserPrefs>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: "linear-gradient(135deg, var(--accent), var(--accent3))",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 900, color: "#fff"
      }}>E</div>
      <span style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}>Edutracker</span>
    </div>
  );
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (email: string) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        onAuth(data.email);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "20px"
    }}>
      <div style={{ marginBottom: 32 }}><Logo /></div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
          Never miss a deadline
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.05rem" }}>
          Track all your college application deadlines in one place
        </p>
      </div>

      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", marginBottom: 24, background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: 4 }}>
          {(["signup", "login"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "8px 0", borderRadius: 6, fontWeight: 700,
              fontSize: "0.9rem", transition: "all 0.2s",
              background: mode === m ? "var(--accent)" : "transparent",
              color: mode === m ? "#fff" : "var(--muted)",
              border: "none"
            }}>
              {m === "signup" ? "Sign Up" : "Log In"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "var(--muted)" }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com" required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: 6, color: "var(--muted)" }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required minLength={6}
            />
          </div>
          {error && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid var(--red)", borderRadius: 8, padding: "10px 14px", color: "var(--red)", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4, justifyContent: "center" }}>
            {loading ? "Loading…" : mode === "signup" ? "Create Account" : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── School Selection ─────────────────────────────────────────────────────────

function SchoolSelector({
  selected, onComplete
}: {
  selected: string[];
  onComplete: (schools: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set(selected));
  const [filter, setFilter] = useState<"All" | "Public" | "Private">("All");

  const filtered = COLLEGES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchType = filter === "All" || c.type === filter;
    return matchSearch && matchType;
  });

  function toggle(id: string) {
    setPicked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const deadlineTypes = (c: College) =>
    (["EA", "ED", "ED2", "RD", "Scholarship"] as const).filter(t => c.deadlines[t]);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <Logo />
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>1</div>
            <div style={{ width: 60, height: 2, background: "var(--border)" }} />
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)" }}>2</div>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>Select Your Target Schools</h2>
          <p style={{ color: "var(--muted)" }}>Choose the colleges you&apos;re applying to</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Search schools or locations…"
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["All", "Public", "Private"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn" style={{
              background: filter === f ? "var(--accent)" : "var(--surface2)",
              color: filter === f ? "#fff" : "var(--muted)",
              border: "1.5px solid " + (filter === f ? "var(--accent)" : "var(--border)"),
              padding: "8px 16px", fontSize: "0.85rem"
            }}>{f}</button>
          ))}
        </div>
      </div>

      {picked.size > 0 && (
        <div style={{ marginBottom: 16, padding: "10px 16px", background: "rgba(108,99,255,0.1)", border: "1px solid var(--accent)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.9rem" }}><strong style={{ color: "var(--accent2)" }}>{picked.size}</strong> school{picked.size !== 1 ? "s" : ""} selected</span>
          <button onClick={() => setPicked(new Set())} style={{ background: "none", color: "var(--muted)", fontSize: "0.8rem" }}>Clear all</button>
        </div>
      )}

      <div style={{ height: "50vh", overflowY: "auto", border: "1.5px solid var(--border)", borderRadius: "var(--radius)", marginBottom: 24 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>No schools found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {filtered.map((c, i) => {
              const isSelected = picked.has(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  style={{
                    padding: "14px 16px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border)",
                    borderRight: i % 2 === 0 ? "1px solid var(--border)" : "none",
                    background: isSelected ? "rgba(108,99,255,0.12)" : "transparent",
                    transition: "background 0.15s",
                    display: "flex", flexDirection: "column", gap: 6,
                    userSelect: "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: isSelected ? "var(--accent2)" : "var(--text)" }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 2 }}>{c.location}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 2,
                      background: isSelected ? "var(--accent)" : "transparent",
                      border: "2px solid " + (isSelected ? "var(--accent)" : "var(--border)"),
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s"
                    }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: "0.7rem" }}>✓</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    <span className="tag">{c.type}</span>
                    {deadlineTypes(c).map(t => (
                      <span key={t} className={`badge badge-${t.toLowerCase().replace(" ", "-")}`}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          className="btn btn-primary"
          disabled={picked.size === 0}
          onClick={() => onComplete(Array.from(picked))}
          style={{ opacity: picked.size === 0 ? 0.5 : 1, fontSize: "1rem", padding: "12px 32px" }}
        >
          Continue with {picked.size} school{picked.size !== 1 ? "s" : ""} →
        </button>
      </div>
    </div>
  );
}

// ─── Reminder Setup ───────────────────────────────────────────────────────────

function ReminderSetup({
  prefs, onComplete, onBack
}: {
  prefs: UserPrefs;
  onComplete: (updates: Partial<UserPrefs>) => void;
  onBack: () => void;
}) {
  const [emailEnabled, setEmailEnabled] = useState(prefs.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(prefs.smsEnabled);
  const [phone, setPhone] = useState(prefs.phone);
  const [reminder30, setReminder30] = useState(prefs.reminder30);
  const [reminder7, setReminder7] = useState(prefs.reminder7);
  const [reminder1, setReminder1] = useState(prefs.reminder1);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const updates = { emailEnabled, smsEnabled, phone, reminder30, reminder7, reminder1 };
    await new Promise(r => setTimeout(r, 400));
    setSaving(false);
    onComplete(updates);
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px" }}>
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <Logo />
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--surface2)", border: "1.5px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "var(--accent2)" }}>✓</div>
            <div style={{ width: 60, height: 2, background: "var(--accent)" }} />
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>2</div>
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 6 }}>Set Up Reminders</h2>
          <p style={{ color: "var(--muted)" }}>We&apos;ll notify you before each deadline</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Channels */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>Notification Channels</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={emailEnabled} onChange={e => setEmailEnabled(e.target.checked)} style={{ width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 600 }}>📧 Email Reminders</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Sent to {prefs.email}</div>
              </div>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} style={{ width: 18, height: 18 }} />
              <div>
                <div style={{ fontWeight: 600 }}>📱 SMS Reminders</div>
                <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Text messages to your phone</div>
              </div>
            </label>
            {smsEnabled && (
              <div style={{ marginLeft: 30 }}>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}
          </div>
        </div>

        {/* Intervals */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: "1rem" }}>Reminder Intervals</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: 14 }}>
            Choose when to get notified before each deadline:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { key: "reminder30", val: reminder30, set: setReminder30, label: "30 days before", desc: "Plenty of time to start" },
              { key: "reminder7", val: reminder7, set: setReminder7, label: "7 days before", desc: "Final push reminder" },
              { key: "reminder1", val: reminder1, set: setReminder1, label: "1 day before", desc: "Last chance alert" },
            ].map(item => (
              <label key={item.key} style={{
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                background: item.val ? "rgba(108,99,255,0.1)" : "var(--surface2)",
                border: "1.5px solid " + (item.val ? "var(--accent)" : "var(--border)"),
                transition: "all 0.15s"
              }}>
                <input type="checkbox" checked={item.val} onChange={e => item.set(e.target.checked)} style={{ width: 18, height: 18 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.label}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="card" style={{ background: "rgba(108,99,255,0.07)", border: "1.5px solid rgba(108,99,255,0.3)" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 10, fontSize: "0.9rem", color: "var(--accent2)" }}>📋 Reminder Preview</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
            You&apos;ll receive reminders via{" "}
            <strong>{[emailEnabled && "email", smsEnabled && "SMS"].filter(Boolean).join(" & ") || "no channels selected"}</strong>{" "}
            {[reminder30 && "30 days", reminder7 && "7 days", reminder1 && "1 day"].filter(Boolean).join(", ")}{" "}
            before each deadline across <strong>{prefs.selectedSchools.length}</strong> school{prefs.selectedSchools.length !== 1 ? "s" : ""}.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || (!emailEnabled && !smsEnabled)}
            style={{ flex: 1, justifyContent: "center", opacity: (!emailEnabled && !smsEnabled) ? 0.5 : 1 }}
          >
            {saving ? "Saving…" : "Go to Dashboard →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ prefs, onSignOut, onUpdateSchools }: {
  prefs: UserPrefs;
  onSignOut: () => void;
  onUpdateSchools: () => void;
}) {
  const [tick, setTick] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"All" | "EA" | "ED" | "ED2" | "RD" | "Scholarship">("All");
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const selectedColleges = COLLEGES.filter(c => prefs.selectedSchools.includes(c.id));
  const allDeadlines = buildDeadlines(selectedColleges);
  const filtered = activeFilter === "All" ? allDeadlines : allDeadlines.filter(d => d.type === activeFilter);

  // Stats
  const urgentCount = allDeadlines.filter(d => d.daysLeft <= 7 && d.daysLeft >= 0).length;
  const soonCount = allDeadlines.filter(d => d.daysLeft > 7 && d.daysLeft <= 30).length;

  const filterTypes = ["All", "EA", "ED", "ED2", "RD", "Scholarship"] as const;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1.5px solid var(--border)", padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "var(--bg)", zIndex: 100
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setShowSettings(s => !s)} className="btn btn-ghost" style={{ fontSize: "0.85rem", padding: "8px 14px" }}>
            ⚙ Settings
          </button>
          <button onClick={onSignOut} className="btn btn-ghost" style={{ fontSize: "0.85rem", padding: "8px 14px" }}>
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {/* Welcome + stats */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: 4 }}>
            Your Application Dashboard
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            {prefs.email} · {selectedColleges.length} school{selectedColleges.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Total Deadlines", value: allDeadlines.length, color: "var(--accent2)", icon: "📅" },
            { label: "Urgent (≤7 days)", value: urgentCount, color: "var(--red)", icon: "🔴" },
            { label: "Soon (≤30 days)", value: soonCount, color: "var(--yellow)", icon: "🟡" },
            { label: "Schools Tracked", value: selectedColleges.length, color: "var(--green)", icon: "🏫" },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "16px 12px" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="card" style={{ marginBottom: 24, border: "1.5px solid var(--accent)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>⚙ Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", color: "var(--muted)", fontSize: "1.2rem" }}>×</button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button className="btn btn-secondary" onClick={onUpdateSchools} style={{ fontSize: "0.85rem" }}>
                🏫 Edit School List
              </button>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📧</span>
                <span>Email: {prefs.emailEnabled ? `✅ ${prefs.email}` : "Disabled"}</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📱</span>
                <span>SMS: {prefs.smsEnabled ? `✅ ${prefs.phone}` : "Disabled"}</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⏰</span>
                <span>Reminders: {[prefs.reminder30 && "30d", prefs.reminder7 && "7d", prefs.reminder1 && "1d"].filter(Boolean).join(", ")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {filterTypes.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: "7px 16px", borderRadius: 99, fontSize: "0.82rem", fontWeight: 700,
              cursor: "pointer", transition: "all 0.15s", border: "1.5px solid",
              background: activeFilter === f ? "var(--accent)" : "transparent",
              color: activeFilter === f ? "#fff" : "var(--muted)",
              borderColor: activeFilter === f ? "var(--accent)" : "var(--border)"
            }}>
              {f} {f !== "All" && <span style={{ opacity: 0.7 }}>({allDeadlines.filter(d => d.type === f).length})</span>}
            </button>
          ))}
        </div>

        {/* Deadline list */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 48 }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎓</div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>No deadlines found</h3>
            <p style={{ color: "var(--muted)" }}>
              {prefs.selectedSchools.length === 0
                ? "Add schools to start tracking deadlines"
                : `No ${activeFilter} deadlines for your selected schools`}
            </p>
            {prefs.selectedSchools.length === 0 && (
              <button className="btn btn-primary" onClick={onUpdateSchools} style={{ marginTop: 16 }}>
                Add Schools
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((entry, i) => {
              const key = `${entry.college.id}-${entry.type}`;
              const isExpanded = expandedSchool === key;
              const urgency = getUrgencyColor(entry.daysLeft);
              const isUrgent = entry.daysLeft <= 7;
              const isPassed = entry.daysLeft < 0;

              return (
                <div
                  key={key}
                  className="card"
                  style={{
                    padding: 0, overflow: "hidden",
                    border: `1.5px solid ${isUrgent && !isPassed ? "rgba(248,113,113,0.4)" : "var(--border)"}`,
                    background: isUrgent && !isPassed ? "rgba(248,113,113,0.04)" : "var(--surface)"
                  }}
                >
                  <div
                    onClick={() => setExpandedSchool(isExpanded ? null : key)}
                    style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
                  >
                    {/* Priority number */}
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", flexShrink: 0
                    }}>
                      {i + 1}
                    </div>

                    {/* College name + location */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{entry.college.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{entry.college.location}</div>
                    </div>

                    {/* Deadline type badge */}
                    <span className={`badge badge-${entry.type.toLowerCase()}`}>{entry.type}</span>

                    {/* Date */}
                    <div style={{ textAlign: "center", minWidth: 100 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{formatDate(entry.date)}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>deadline</div>
                    </div>

                    {/* Countdown */}
                    <div style={{
                      minWidth: 90, textAlign: "center",
                      background: isPassed ? "rgba(136,146,176,0.1)" : `${urgency}18`,
                      border: `1.5px solid ${isPassed ? "var(--border)" : urgency}40`,
                      borderRadius: "var(--radius-sm)", padding: "8px 14px"
                    }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 900, color: isPassed ? "var(--muted)" : urgency, lineHeight: 1 }}>
                        {formatCountdown(entry.daysLeft)}
                      </div>
                      {entry.daysLeft >= 0 && <div style={{ fontSize: "0.65rem", color: "var(--muted)", marginTop: 2 }}>remaining</div>}
                    </div>

                    {/* Reminder dots */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {prefs.emailEnabled && <span title="Email reminder" style={{ fontSize: "1rem" }}>📧</span>}
                      {prefs.smsEnabled && <span title="SMS reminder" style={{ fontSize: "1rem" }}>📱</span>}
                    </div>

                    <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{isExpanded ? "▲" : "▼"}</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      borderTop: "1px solid var(--border)", padding: "16px 20px",
                      background: "var(--surface2)", display: "flex", flexWrap: "wrap", gap: 24
                    }}>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          All Deadlines for {entry.college.name}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {(["EA", "ED", "ED2", "RD", "Scholarship"] as const).map(t => {
                            const d = entry.college.deadlines[t];
                            if (!d) return null;
                            const date = getDeadlineDate(d);
                            const days = getDaysLeft(date);
                            return (
                              <div key={t} style={{
                                padding: "8px 14px", borderRadius: "var(--radius-sm)",
                                background: "var(--surface)", border: "1.5px solid var(--border)"
                              }}>
                                <span className={`badge badge-${t.toLowerCase()}`}>{t}</span>
                                <div style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: 6 }}>{formatDate(date)}</div>
                                <div style={{ fontSize: "0.75rem", color: getUrgencyColor(days), fontWeight: 600 }}>{formatCountdown(days)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          Reminder Schedule
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.82rem" }}>
                          {prefs.reminder30 && entry.daysLeft > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                              <span>⏰</span>
                              <span>{formatDate(new Date(entry.date.getTime() - 30 * 86400000))} — 30 day reminder</span>
                            </div>
                          )}
                          {prefs.reminder7 && entry.daysLeft > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                              <span>⏰</span>
                              <span>{formatDate(new Date(entry.date.getTime() - 7 * 86400000))} — 7 day reminder</span>
                            </div>
                          )}
                          {prefs.reminder1 && entry.daysLeft > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)" }}>
                              <span>⏰</span>
                              <span>{formatDate(new Date(entry.date.getTime() - 1 * 86400000))} — 1 day reminder</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        <span className="tag">{entry.college.type}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center", color: "var(--muted)", fontSize: "0.78rem" }}>
          All deadlines are based on standard cycles. Always verify with official school websites.
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<AppStep>("auth");
  const [prefs, setPrefs] = useState<UserPrefs>({
    email: "",
    selectedSchools: [],
    emailEnabled: true,
    smsEnabled: false,
    phone: "",
    reminder30: true,
    reminder7: true,
    reminder1: true,
  });

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});

    // Restore from localStorage
    const saved = loadPrefs();
    if (saved.email) {
      setPrefs(p => ({ ...p, ...saved }));
      setStep("dashboard");
    }
  }, []);

  const handleAuth = useCallback((email: string) => {
    setPrefs(p => {
      const saved = loadPrefs();
      const merged = { ...p, ...saved, email };
      if (saved.selectedSchools && saved.selectedSchools.length > 0) {
        savePrefs(merged);
        return merged;
      }
      const base = { ...p, email };
      savePrefs(base);
      return base;
    });
    const saved = loadPrefs();
    if (saved.selectedSchools && saved.selectedSchools.length > 0) {
      setStep("dashboard");
    } else {
      setStep("onboarding-schools");
    }
  }, []);

  const handleSchoolsDone = useCallback((schools: string[]) => {
    setPrefs(p => {
      const updated = { ...p, selectedSchools: schools };
      savePrefs(updated);
      return updated;
    });
    setStep("onboarding-reminders");
  }, []);

  const handleRemindersDone = useCallback((updates: Partial<UserPrefs>) => {
    setPrefs(p => {
      const updated = { ...p, ...updates };
      savePrefs(updated);
      return updated;
    });

    // Persist to DB
    setPrefs(current => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "/onboarding-complete" }),
      }).catch(() => {});
      return current;
    });

    setStep("dashboard");
  }, []);

  const handleSignOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPrefs({
      email: "",
      selectedSchools: [],
      emailEnabled: true,
      smsEnabled: false,
      phone: "",
      reminder30: true,
      reminder7: true,
      reminder1: true,
    });
    setStep("auth");
  }, []);

  const handleUpdateSchools = useCallback(() => {
    setStep("onboarding-schools");
  }, []);

  if (step === "auth") return <AuthScreen onAuth={handleAuth} />;
  if (step === "onboarding-schools") return (
    <SchoolSelector
      selected={prefs.selectedSchools}
      onComplete={handleSchoolsDone}
    />
  );
  if (step === "onboarding-reminders") return (
    <ReminderSetup
      prefs={prefs}
      onComplete={handleRemindersDone}
      onBack={() => setStep("onboarding-schools")}
    />
  );
  return (
    <Dashboard
      prefs={prefs}
      onSignOut={handleSignOut}
      onUpdateSchools={handleUpdateSchools}
    />
  );
}