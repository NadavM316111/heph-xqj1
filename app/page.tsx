"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College } from "@/lib/colleges";

type DeadlineType = "EA" | "ED" | "RD" | "Scholarship";

interface Deadline {
  collegeId: string;
  collegeName: string;
  type: DeadlineType;
  date: string;
  description: string;
}

interface UserProfile {
  email: string;
  phone: string;
  name: string;
  selectedColleges: string[];
  remindersEmail: boolean;
  remindersSMS: boolean;
  onboardingComplete: boolean;
}

interface ReminderLog {
  deadlineKey: string;
  daysBeforeList: number[];
  notifiedAt: string;
}

const STORAGE_KEY = "edutracker_profile";
const REMINDERS_KEY = "edutracker_reminders";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): { bg: string; text: string; label: string; border: string } {
  if (days < 0) return { bg: "#f1f5f9", text: "#94a3b8", label: "Passed", border: "#e2e8f0" };
  if (days === 0) return { bg: "#fef2f2", text: "#dc2626", label: "TODAY", border: "#fca5a5" };
  if (days <= 7) return { bg: "#fef2f2", text: "#dc2626", label: `${days}d`, border: "#fca5a5" };
  if (days <= 30) return { bg: "#fff7ed", text: "#ea580c", label: `${days}d`, border: "#fdba74" };
  if (days <= 60) return { bg: "#fefce8", text: "#ca8a04", label: `${days}d`, border: "#fde047" };
  return { bg: "#f0fdf4", text: "#16a34a", label: `${days}d`, border: "#86efac" };
}

function typeColor(type: DeadlineType): { bg: string; text: string } {
  switch (type) {
    case "EA": return { bg: "#dbeafe", text: "#1d4ed8" };
    case "ED": return { bg: "#ede9fe", text: "#7c3aed" };
    case "RD": return { bg: "#dcfce7", text: "#15803d" };
    case "Scholarship": return { bg: "#fce7f3", text: "#be185d" };
  }
}

function getAllDeadlines(colleges: College[], selectedIds: string[]): Deadline[] {
  const deadlines: Deadline[] = [];
  const selected = colleges.filter(c => selectedIds.includes(c.id));
  for (const college of selected) {
    for (const dl of college.deadlines) {
      deadlines.push({
        collegeId: college.id,
        collegeName: college.name,
        type: dl.type as DeadlineType,
        date: dl.date,
        description: dl.description,
      });
    }
  }
  deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return deadlines;
}

// ── Onboarding Step 1: Welcome ──────────────────────────────────────────────
function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
        Welcome to Edutracker
      </h1>
      <p style={{ fontSize: 18, color: "#64748b", maxWidth: 480, margin: "0 auto 40px" }}>
        Never miss a college application deadline again. We'll track EA, ED, RD, and scholarship
        deadlines for all your target schools and send you timely reminders.
      </p>
      <div style={{ display: "flex", gap: 24, justifyContent: "center", marginBottom: 48, flexWrap: "wrap" }}>
        {[
          { icon: "🏫", label: "80+ colleges", sub: "curated database" },
          { icon: "⏰", label: "Smart reminders", sub: "30, 7 & 1 day alerts" },
          { icon: "📊", label: "Live dashboard", sub: "color-coded urgency" },
        ].map(f => (
          <div key={f.label} style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16,
            padding: "20px 28px", minWidth: 140,
          }}>
            <div style={{ fontSize: 32 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, color: "#1e293b", marginTop: 8 }}>{f.label}</div>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{f.sub}</div>
          </div>
        ))}
      </div>
      <button onClick={onNext} style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff", border: "none", borderRadius: 12, padding: "16px 48px",
        fontSize: 18, fontWeight: 700, cursor: "pointer",
      }}>
        Get Started →
      </button>
    </div>
  );
}

// ── Onboarding Step 2: Profile ───────────────────────────────────────────────
function StepProfile({
  profile, onChange, onNext, onBack,
}: {
  profile: Partial<UserProfile>;
  onChange: (p: Partial<UserProfile>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!profile.name?.trim()) e.name = "Name is required";
    if (!profile.email?.trim() || !/\S+@\S+\.\S+/.test(profile.email)) e.email = "Valid email required";
    if (profile.remindersSMS && profile.phone && !/^\+?[\d\s\-()]{7,}$/.test(profile.phone)) {
      e.phone = "Enter a valid phone number";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 15, marginBottom: 24 }}>
        ← Back
      </button>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>Your Profile</h2>
      <p style={{ color: "#64748b", marginBottom: 32 }}>Tell us how to reach you when deadlines approach.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Full Name *</span>
          <input
            value={profile.name || ""}
            onChange={e => onChange({ ...profile, name: e.target.value })}
            placeholder="Jane Smith"
            style={inputStyle(!!errors.name)}
          />
          {errors.name && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.name}</span>}
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Email Address *</span>
          <input
            type="email"
            value={profile.email || ""}
            onChange={e => onChange({ ...profile, email: e.target.value })}
            placeholder="jane@example.com"
            style={inputStyle(!!errors.email)}
          />
          {errors.email && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.email}</span>}
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontWeight: 600, color: "#374151", fontSize: 14 }}>Phone Number (optional)</span>
          <input
            type="tel"
            value={profile.phone || ""}
            onChange={e => onChange({ ...profile, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
            style={inputStyle(!!errors.phone)}
          />
          {errors.phone && <span style={{ color: "#dc2626", fontSize: 12 }}>{errors.phone}</span>}
        </label>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontWeight: 700, color: "#1e293b", margin: 0 }}>Reminder Preferences</p>
          {[
            { key: "remindersEmail", label: "📧 Email reminders", sub: "30, 7, and 1 day before deadlines" },
            { key: "remindersSMS", label: "📱 SMS reminders", sub: "Text alerts (requires phone number)" },
          ].map(r => (
            <label key={r.key} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!profile[r.key as keyof UserProfile]}
                onChange={e => onChange({ ...profile, [r.key]: e.target.checked })}
                style={{ marginTop: 3, width: 18, height: 18, cursor: "pointer" }}
              />
              <div>
                <div style={{ fontWeight: 600, color: "#374151" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.sub}</div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={() => { if (validate()) onNext(); }}
          style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", border: "none", borderRadius: 12, padding: "14px",
            fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8,
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ── Onboarding Step 3: Select Schools ───────────────────────────────────────
function StepSelectSchools({
  selected, onChange, onNext, onBack,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const states = ["All", ...Array.from(new Set(COLLEGES.map(c => c.state))).sort()];
  const types = ["All", "Public", "Private", "Liberal Arts"];

  const filtered = COLLEGES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase());
    const matchState = filterState === "All" || c.state === filterState;
    const matchType = filterType === "All" || c.type === filterType;
    return matchSearch && matchState && matchType;
  });

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else onChange([...selected, id]);
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 15, marginBottom: 24 }}>
        ← Back
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: 0 }}>Select Your Target Schools</h2>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>Choose at least 1 school to track deadlines</p>
        </div>
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
          borderRadius: 24, padding: "8px 20px", fontWeight: 700, fontSize: 15,
        }}>
          {selected.length} selected
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search colleges..."
          style={{ ...inputStyle(false), flex: "1 1 200px", minWidth: 200 }}
        />
        <select value={filterState} onChange={e => setFilterState(e.target.value)} style={selectStyle}>
          {states.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selectStyle}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
        {filtered.map(college => {
          const isSelected = selected.includes(college.id);
          return (
            <div
              key={college.id}
              onClick={() => toggle(college.id)}
              style={{
                border: `2px solid ${isSelected ? "#6366f1" : "#e2e8f0"}`,
                borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                background: isSelected ? "#f5f3ff" : "#fff",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute", top: 10, right: 10,
                  background: "#6366f1", color: "#fff", borderRadius: "50%",
                  width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, paddingRight: 28 }}>{college.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{college.location}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                  {college.type}
                </span>
                <span style={{ background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                  {college.deadlines.length} deadlines
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#64748b", fontSize: 14 }}>{filtered.length} colleges shown</span>
        <button
          onClick={() => { if (selected.length > 0) onNext(); }}
          disabled={selected.length === 0}
          style={{
            background: selected.length === 0 ? "#e2e8f0" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: selected.length === 0 ? "#94a3b8" : "#fff",
            border: "none", borderRadius: 12, padding: "14px 36px",
            fontSize: 16, fontWeight: 700, cursor: selected.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Track {selected.length} School{selected.length !== 1 ? "s" : ""} →
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({
  profile, onReset,
}: {
  profile: UserProfile;
  onReset: () => void;
}) {
  const [activeFilter, setActiveFilter] = useState<"All" | DeadlineType>("All");
  const [showPast, setShowPast] = useState(false);
  const [editingSchools, setEditingSchools] = useState(false);
  const [tempSelected, setTempSelected] = useState(profile.selectedColleges);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [reminders, setReminders] = useState<ReminderLog[]>(() => {
    try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) || "[]"); } catch { return []; }
  });
  const [toastMsg, setToastMsg] = useState("");

  const allDeadlines = getAllDeadlines(COLLEGES, currentProfile.selectedColleges);
  const filtered = allDeadlines.filter(d => {
    const days = daysUntil(d.date);
    if (!showPast && days < 0) return false;
    if (activeFilter !== "All" && d.type !== activeFilter) return false;
    return true;
  });

  const upcoming30 = allDeadlines.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 30; });
  const upcoming7 = allDeadlines.filter(d => { const x = daysUntil(d.date); return x >= 0 && x <= 7; });

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  }

  function saveProfile(p: UserProfile) {
    setCurrentProfile(p);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function handleSaveSchools() {
    saveProfile({ ...currentProfile, selectedColleges: tempSelected });
    setEditingSchools(false);
    showToast(`✅ Tracking ${tempSelected.length} schools`);
  }

  function scheduleReminder(dl: Deadline) {
    const key = `${dl.collegeId}-${dl.type}-${dl.date}`;
    const existing = reminders.find(r => r.deadlineKey === key);
    const days = daysUntil(dl.date);
    const intervals = [30, 7, 1].filter(i => days >= i);
    const newLog: ReminderLog = {
      deadlineKey: key,
      daysBeforeList: intervals,
      notifiedAt: new Date().toISOString(),
    };
    const updated = [...reminders.filter(r => r.deadlineKey !== key), newLog];
    setReminders(updated);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(updated));
    const channelList = [];
    if (currentProfile.remindersEmail) channelList.push("email");
    if (currentProfile.remindersSMS && currentProfile.phone) channelList.push("SMS");
    if (channelList.length === 0) {
      showToast(`⚠️ No reminder channels set — enable email/SMS in settings`);
    } else {
      showToast(`🔔 Reminder set via ${channelList.join(" & ")} at ${intervals.join(", ")} days before`);
    }
    return !!existing;
  }

  function isReminderSet(dl: Deadline) {
    const key = `${dl.collegeId}-${dl.type}-${dl.date}`;
    return reminders.some(r => r.deadlineKey === key);
  }

  const typeCounts: Record<string, number> = { All: allDeadlines.filter(d => daysUntil(d.date) >= 0).length };
  for (const t of ["EA", "ED", "RD", "Scholarship"] as DeadlineType[]) {
    typeCounts[t] = allDeadlines.filter(d => d.type === t && daysUntil(d.date) >= 0).length;
  }

  if (editingSchools) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
          <h2 style={{ margin: 0, fontWeight: 800, color: "#1e293b" }}>Edit Your Schools</h2>
        </div>
        <StepSelectSchools
          selected={tempSelected}
          onChange={setTempSelected}
          onNext={handleSaveSchools}
          onBack={() => { setEditingSchools(false); setTempSelected(currentProfile.selectedColleges); }}
        />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000,
          background: "#1e293b", color: "#fff", borderRadius: 12, padding: "14px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)", fontSize: 14, fontWeight: 600, maxWidth: 360,
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🎓</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: "#1e293b" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#64748b" }}>Hi, {currentProfile.name.split(" ")[0]}!</span>
          <button onClick={() => setEditingSchools(true)} style={pillBtn}>+ Edit Schools</button>
          <button onClick={onReset} style={{ ...pillBtn, background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Schools Tracked", value: currentProfile.selectedColleges.length, icon: "🏫", bg: "#f5f3ff", accent: "#6366f1" },
            { label: "Total Deadlines", value: typeCounts.All, icon: "📅", bg: "#fff7ed", accent: "#ea580c" },
            { label: "Due in 30 Days", value: upcoming30.length, icon: "⚡", bg: upcoming30.length > 0 ? "#fff7ed" : "#f0fdf4", accent: upcoming30.length > 0 ? "#ea580c" : "#16a34a" },
            { label: "Due in 7 Days", value: upcoming7.length, icon: "🔥", bg: upcoming7.length > 0 ? "#fef2f2" : "#f0fdf4", accent: upcoming7.length > 0 ? "#dc2626" : "#16a34a" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: "20px 24px" }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: s.accent, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Reminder channel banner */}
        {(!currentProfile.remindersEmail && !currentProfile.remindersSMS) && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12,
            padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <span style={{ color: "#92400e", fontSize: 14 }}>
              You haven't enabled any reminders. Enable email or SMS notifications so you don't miss deadlines!
            </span>
            <button onClick={() => {
              const updated = { ...currentProfile, remindersEmail: true };
              saveProfile(updated);
              showToast("📧 Email reminders enabled!");
            }} style={{ ...pillBtn, marginLeft: "auto", whiteSpace: "nowrap" }}>
              Enable Email
            </button>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Urgency:</span>
          {[
            { bg: "#fef2f2", text: "#dc2626", border: "#fca5a5", label: "≤7 days" },
            { bg: "#fff7ed", text: "#ea580c", border: "#fdba74", label: "≤30 days" },
            { bg: "#fefce8", text: "#ca8a04", border: "#fde047", label: "≤60 days" },
            { bg: "#f0fdf4", text: "#16a34a", border: "#86efac", label: ">60 days" },
          ].map(u => (
            <div key={u.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: u.bg, border: `1px solid ${u.border}` }} />
              <span style={{ fontSize: 12, color: u.text, fontWeight: 600 }}>{u.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          {(["All", "EA", "ED", "RD", "Scholarship"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              style={{
                border: "none", borderRadius: 24, padding: "8px 18px", fontSize: 14, fontWeight: 600,
                cursor: "pointer",
                background: activeFilter === t ? "#6366f1" : "#fff",
                color: activeFilter === t ? "#fff" : "#475569",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              }}
            >
              {t} {typeCounts[t] !== undefined ? `(${typeCounts[t]})` : ""}
            </button>
          ))}
          <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748b", cursor: "pointer" }}>
            <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
            Show past deadlines
          </label>
        </div>

        {/* Deadline list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ fontSize: 18, marginTop: 12 }}>No deadlines found for the current filter.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((dl, i) => {
              const days = daysUntil(dl.date);
              const urgency = urgencyColor(days);
              const tc = typeColor(dl.type);
              const reminded = isReminderSet(dl);
              const isPast = days < 0;

              return (
                <div
                  key={`${dl.collegeId}-${dl.type}-${dl.date}-${i}`}
                  style={{
                    background: isPast ? "#fafafa" : "#fff",
                    border: `1px solid ${urgency.border}`,
                    borderLeft: `5px solid ${urgency.border}`,
                    borderRadius: 12, padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                    flexWrap: "wrap", opacity: isPast ? 0.6 : 1,
                  }}
                >
                  {/* Urgency badge */}
                  <div style={{
                    background: urgency.bg, color: urgency.text, border: `1px solid ${urgency.border}`,
                    borderRadius: 8, padding: "6px 12px", fontWeight: 800, fontSize: 13,
                    minWidth: 60, textAlign: "center", flexShrink: 0,
                  }}>
                    {urgency.label}
                  </div>

                  {/* College info */}
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>{dl.collegeName}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{dl.description}</div>
                  </div>

                  {/* Type badge */}
                  <span style={{
                    background: tc.bg, color: tc.text,
                    borderRadius: 8, padding: "4px 12px", fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {dl.type}
                  </span>

                  {/* Date */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14 }}>
                      {new Date(dl.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    {!isPast && days <= 30 && (
                      <div style={{ fontSize: 11, color: urgency.text, fontWeight: 600 }}>
                        {days === 0 ? "Due Today!" : `In ${days} day${days !== 1 ? "s" : ""}`}
                      </div>
                    )}
                  </div>

                  {/* Reminder button */}
                  {!isPast && (
                    <button
                      onClick={() => scheduleReminder(dl)}
                      style={{
                        border: `1.5px solid ${reminded ? "#6366f1" : "#e2e8f0"}`,
                        background: reminded ? "#f5f3ff" : "#fff",
                        color: reminded ? "#6366f1" : "#94a3b8",
                        borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", flexShrink: 0,
                        transition: "all 0.15s",
                      }}
                    >
                      {reminded ? "🔔 Set" : "🔕 Remind"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder summary */}
        {reminders.length > 0 && (
          <div style={{ marginTop: 40, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontWeight: 800, color: "#1e293b" }}>
              🔔 Active Reminders ({reminders.length})
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 16px" }}>
              Reminders are logged here. In production, these would trigger emails/SMS via a job scheduler.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reminders.slice(0, 5).map(r => {
                const [cid, type, date] = r.deadlineKey.split("-");
                const college = COLLEGES.find(c => c.id === cid);
                return (
                  <div key={r.deadlineKey} style={{
                    display: "flex", gap: 12, alignItems: "center", fontSize: 13,
                    background: "#f8fafc", borderRadius: 8, padding: "10px 14px",
                  }}>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{college?.name ?? cid}</span>
                    <span style={{ color: "#6366f1", fontWeight: 700 }}>{type}</span>
                    <span style={{ color: "#64748b" }}>{date}</span>
                    <span style={{ marginLeft: "auto", color: "#94a3b8" }}>
                      Alerts: {r.daysBeforeList.join(", ")} days before
                    </span>
                  </div>
                );
              })}
              {reminders.length > 5 && (
                <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>+{reminders.length - 5} more reminders</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    border: `1.5px solid ${hasError ? "#dc2626" : "#e2e8f0"}`,
    borderRadius: 10, padding: "11px 14px", fontSize: 15, color: "#1e293b",
    outline: "none", width: "100%", boxSizing: "border-box",
    background: "#fff",
  };
}

const selectStyle: React.CSSProperties = {
  border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "11px 14px",
  fontSize: 14, color: "#374151", background: "#fff", cursor: "pointer",
};

const pillBtn: React.CSSProperties = {
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
  border: "none", borderRadius: 24, padding: "8px 18px", fontSize: 14,
  fontWeight: 600, cursor: "pointer",
};

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep] = useState(0); // 0=welcome,1=profile,2=schools,3=dashboard
  const [profileDraft, setProfileDraft] = useState<Partial<UserProfile>>({
    remindersEmail: true, remindersSMS: false,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved) as UserProfile;
        if (p.onboardingComplete) { setProfile(p); setStep(3); }
      } catch { /* ignore */ }
    }
    setHydrated(true);
  }, []);

  const handleProfileChange = useCallback((p: Partial<UserProfile>) => setProfileDraft(p), []);

  function handleFinishOnboarding(selectedIds: string[]) {
    const full: UserProfile = {
      name: profileDraft.name!,
      email: profileDraft.email!,
      phone: profileDraft.phone || "",
      remindersEmail: profileDraft.remindersEmail ?? true,
      remindersSMS: profileDraft.remindersSMS ?? false,
      selectedColleges: selectedIds,
      onboardingComplete: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
    setProfile(full);
    setStep(3);
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(REMINDERS_KEY);
    setProfile(null);
    setProfileDraft({ remindersEmail: true, remindersSMS: false });
    setStep(0);
  }

  if (!hydrated) return null;

  if (step === 3 && profile) {
    return <Dashboard profile={profile} onReset={handleReset} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Progress bar */}
      {step > 0 && step < 3 && (
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 8 }}>
            {["Profile", "Schools"].map((label, i) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 13, fontWeight: 700,
                  background: step > i + 1 ? "#6366f1" : step === i + 1 ? "#6366f1" : "#e2e8f0",
                  color: step >= i + 1 ? "#fff" : "#94a3b8",
                }}>
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: step === i + 1 ? "#6366f1" : "#94a3b8" }}>
                  {label}
                </span>
                {i < 1 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? "#6366f1" : "#e2e8f0", borderRadius: 2 }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {step === 0 && <StepWelcome onNext={() => setStep(1)} />}
        {step === 1 && (
          <StepProfile
            profile={profileDraft}
            onChange={handleProfileChange}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepSelectSchools
            selected={profileDraft.selectedColleges || []}
            onChange={ids => setProfileDraft(p => ({ ...p, selectedColleges: ids }))}
            onNext={() => handleFinishOnboarding(profileDraft.selectedColleges || [])}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  );
}