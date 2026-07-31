"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College } from "@/lib/colleges";

type User = { email: string };
type Step = "landing" | "auth" | "onboarding-schools" | "onboarding-reminders" | "dashboard";

type DeadlineType = "EA" | "ED" | "ED2" | "RD" | "FAFSA";

interface TrackedDeadline {
  collegeId: string;
  collegeName: string;
  type: DeadlineType;
  date: string;
  reminderDays: number[];
}

interface ReminderPrefs {
  email: boolean;
  sms: boolean;
  phone: string;
  days: number[];
}

function getTimeUntil(dateStr: string): { days: number; hours: number; minutes: number; seconds: number; past: boolean } {
  const target = new Date(dateStr + "T23:59:00");
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds, past: false };
}

function urgencyColor(days: number, past: boolean): string {
  if (past) return "#9ca3af";
  if (days <= 1) return "#ef4444";
  if (days <= 7) return "#f97316";
  if (days <= 14) return "#eab308";
  if (days <= 30) return "#3b82f6";
  return "#10b981";
}

function deadlineTypeColor(type: DeadlineType): string {
  const map: Record<DeadlineType, string> = {
    EA: "#8b5cf6",
    ED: "#ec4899",
    ED2: "#f43f5e",
    RD: "#3b82f6",
    FAFSA: "#10b981",
  };
  return map[type];
}

const REMINDER_OPTIONS = [
  { label: "30 days before", value: 30 },
  { label: "14 days before", value: 14 },
  { label: "7 days before", value: 7 },
  { label: "1 day before", value: 1 },
];

export default function Home() {
  const [step, setStep] = useState<Step>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeadlineTypes, setSelectedDeadlineTypes] = useState<Record<string, DeadlineType[]>>({});

  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>({
    email: true,
    sms: false,
    phone: "",
    days: [30, 14, 7, 1],
  });

  const [trackedDeadlines, setTrackedDeadlines] = useState<TrackedDeadline[]>([]);
  const [tick, setTick] = useState(0);
  const [filterType, setFilterType] = useState<DeadlineType | "ALL">("ALL");
  const [showAddSchools, setShowAddSchools] = useState(false);
  const [addSearchQuery, setAddSearchQuery] = useState("");

  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        loadUserData(u.email);
        setStep("dashboard");
      } catch {}
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadUserData = useCallback((email: string) => {
    const key = `edutracker_data_${email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTrackedDeadlines(data.deadlines || []);
        setReminderPrefs(data.reminderPrefs || { email: true, sms: false, phone: "", days: [30, 14, 7, 1] });
      } catch {}
    }
  }, []);

  const saveUserData = useCallback((email: string, deadlines: TrackedDeadline[], prefs: ReminderPrefs) => {
    const key = `edutracker_data_${email}`;
    localStorage.setItem(key, JSON.stringify({ deadlines, reminderPrefs: prefs }));
  }, []);

  const handleAuth = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        const u = { email: data.email };
        setUser(u);
        localStorage.setItem("edutracker_user", JSON.stringify(u));
        const key = `edutracker_data_${u.email}`;
        const existing = localStorage.getItem(key);
        if (existing) {
          loadUserData(u.email);
          setStep("dashboard");
        } else {
          setStep("onboarding-schools");
        }
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  };

  const handleSchoolToggle = (collegeId: string) => {
    setSelectedSchools(prev => {
      if (prev.includes(collegeId)) {
        const next = prev.filter(id => id !== collegeId);
        setSelectedDeadlineTypes(dt => {
          const copy = { ...dt };
          delete copy[collegeId];
          return copy;
        });
        return next;
      } else {
        const college = COLLEGES.find(c => c.id === collegeId);
        if (college) {
          const availableTypes = (["EA", "ED", "ED2", "RD", "FAFSA"] as DeadlineType[]).filter(
            t => college.deadlines[t]
          );
          setSelectedDeadlineTypes(dt => ({ ...dt, [collegeId]: availableTypes }));
        }
        return [...prev, collegeId];
      }
    });
  };

  const toggleDeadlineType = (collegeId: string, type: DeadlineType) => {
    setSelectedDeadlineTypes(prev => {
      const current = prev[collegeId] || [];
      const next = current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type];
      return { ...prev, [collegeId]: next };
    });
  };

  const buildDeadlines = useCallback((schools: string[], types: Record<string, DeadlineType[]>, prefs: ReminderPrefs): TrackedDeadline[] => {
    const result: TrackedDeadline[] = [];
    for (const id of schools) {
      const college = COLLEGES.find(c => c.id === id);
      if (!college) continue;
      const selectedTypes = types[id] || [];
      for (const type of selectedTypes) {
        const date = college.deadlines[type];
        if (date) {
          result.push({
            collegeId: id,
            collegeName: college.name,
            type,
            date,
            reminderDays: prefs.days,
          });
        }
      }
    }
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const handleOnboardingComplete = () => {
    if (!user) return;
    const deadlines = buildDeadlines(selectedSchools, selectedDeadlineTypes, reminderPrefs);
    setTrackedDeadlines(deadlines);
    saveUserData(user.email, deadlines, reminderPrefs);
    setStep("dashboard");
    setSavedMessage("Your deadlines have been saved! ✓");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleAddSchoolsToDashboard = () => {
    if (!user) return;
    const existing = trackedDeadlines;
    const existingKeys = new Set(existing.map(d => `${d.collegeId}-${d.type}`));
    const newOnes: TrackedDeadline[] = [];
    for (const id of selectedSchools) {
      const college = COLLEGES.find(c => c.id === id);
      if (!college) continue;
      const types = selectedDeadlineTypes[id] || [];
      for (const type of types) {
        const key = `${id}-${type}`;
        if (!existingKeys.has(key)) {
          const date = college.deadlines[type];
          if (date) {
            newOnes.push({ collegeId: id, collegeName: college.name, type, date, reminderDays: reminderPrefs.days });
          }
        }
      }
    }
    const merged = [...existing, ...newOnes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTrackedDeadlines(merged);
    saveUserData(user.email, merged, reminderPrefs);
    setShowAddSchools(false);
    setSelectedSchools([]);
    setSelectedDeadlineTypes({});
    setAddSearchQuery("");
    setSavedMessage(`Added ${newOnes.length} new deadline(s)! ✓`);
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleRemoveDeadline = (collegeId: string, type: DeadlineType) => {
    if (!user) return;
    const updated = trackedDeadlines.filter(d => !(d.collegeId === collegeId && d.type === type));
    setTrackedDeadlines(updated);
    saveUserData(user.email, updated, reminderPrefs);
  };

  const handleSaveReminders = () => {
    if (!user) return;
    const updated = trackedDeadlines.map(d => ({ ...d, reminderDays: reminderPrefs.days }));
    setTrackedDeadlines(updated);
    saveUserData(user.email, updated, reminderPrefs);
    setSavedMessage("Reminder preferences saved! ✓");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("edutracker_user");
    setUser(null);
    setTrackedDeadlines([]);
    setSelectedSchools([]);
    setSelectedDeadlineTypes({});
    setStep("landing");
  };

  const filteredColleges = COLLEGES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAddColleges = COLLEGES.filter(c =>
    c.name.toLowerCase().includes(addSearchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(addSearchQuery.toLowerCase())
  );

  const displayedDeadlines = filterType === "ALL"
    ? trackedDeadlines
    : trackedDeadlines.filter(d => d.type === filterType);

  const upcomingCount = trackedDeadlines.filter(d => !getTimeUntil(d.date).past).length;
  const urgentCount = trackedDeadlines.filter(d => {
    const t = getTimeUntil(d.date);
    return !t.past && t.days <= 7;
  }).length;

  // ---- LANDING PAGE ----
  if (step === "landing") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ maxWidth: 600, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🎓</div>
          <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "white", marginBottom: "0.5rem", lineHeight: 1.1 }}>
            Edu<span style={{ color: "#818cf8" }}>tracker</span>
          </h1>
          <p style={{ fontSize: "1.25rem", color: "#c7d2fe", marginBottom: "2rem", lineHeight: 1.6 }}>
            Never miss a college application deadline.<br />
            Track EA, ED, RD & FAFSA deadlines for 80+ top schools.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
            {["80+ Top Colleges", "Countdown Timers", "Smart Reminders", "Free to Use"].map(f => (
              <span key={f} style={{ background: "rgba(255,255,255,0.1)", color: "#e0e7ff", padding: "0.4rem 1rem", borderRadius: "2rem", fontSize: "0.875rem", fontWeight: 500 }}>{f}</span>
            ))}
          </div>
          <button
            onClick={() => setStep("auth")}
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", padding: "1rem 3rem", borderRadius: "3rem", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.5)", transition: "transform 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
          >
            Get Started Free →
          </button>
        </div>
      </div>
    );
  }

  // ---- AUTH ----
  if (step === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "white", borderRadius: "1.5rem", padding: "2.5rem", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎓</div>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>
              {authMode === "signup" ? "Create Account" : "Welcome Back"}
            </h2>
            <p style={{ color: "#6b7280", marginTop: "0.5rem", fontSize: "0.95rem" }}>
              {authMode === "signup" ? "Start tracking your deadlines today" : "Sign in to your Edutracker"}
            </p>
          </div>
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "0.75rem", padding: "0.25rem", marginBottom: "1.5rem" }}>
            {(["signup", "login"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => { setAuthMode(mode); setAuthError(""); }}
                style={{ flex: 1, padding: "0.6rem", borderRadius: "0.5rem", border: "none", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", background: authMode === mode ? "white" : "transparent", color: authMode === mode ? "#4f46e5" : "#6b7280", boxShadow: authMode === mode ? "0 1px 3px rgba(0,0,0,0.15)" : "none", transition: "all 0.15s" }}
              >
                {mode === "signup" ? "Sign Up" : "Log In"}
              </button>
            ))}
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Email</label>
            <input
              type="email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "0.75rem", fontSize: "1rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontWeight: 600, color: "#374151", marginBottom: "0.4rem", fontSize: "0.9rem" }}>Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: "100%", padding: "0.75rem 1rem", border: "1.5px solid #d1d5db", borderRadius: "0.75rem", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = "#6366f1")}
              onBlur={e => (e.target.style.borderColor = "#d1d5db")}
              onKeyDown={e => e.key === "Enter" && handleAuth()}
            />
          </div>
          {authError && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "0.75rem", marginBottom: "1rem", fontSize: "0.9rem" }}>
              {authError}
            </div>
          )}
          <button
            onClick={handleAuth}
            disabled={authLoading || !authEmail || !authPassword}
            style={{ width: "100%", padding: "0.875rem", background: authLoading || !authEmail || !authPassword ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: authLoading || !authEmail || !authPassword ? "#9ca3af" : "white", border: "none", borderRadius: "0.75rem", fontSize: "1rem", fontWeight: 700, cursor: authLoading || !authEmail || !authPassword ? "not-allowed" : "pointer", transition: "all 0.15s" }}
          >
            {authLoading ? "Please wait..." : authMode === "signup" ? "Create Account →" : "Sign In →"}
          </button>
          <button
            onClick={() => setStep("landing")}
            style={{ width: "100%", marginTop: "0.75rem", padding: "0.75rem", background: "transparent", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "0.9rem" }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ---- ONBOARDING: SELECT SCHOOLS ----
  if (step === "onboarding-schools") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem" }}>🎓</span>
            <span style={{ color: "white", fontWeight: 800, fontSize: "1.25rem" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["Schools", "Reminders"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? "#6366f1" : "rgba(255,255,255,0.2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem" }}>{i + 1}</div>
                <span style={{ color: i === 0 ? "white" : "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 600 }}>{s}</span>
                {i < 1 && <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 0.25rem" }}>›</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b", margin: "0 0 0.5rem" }}>Select Your Target Schools</h2>
            <p style={{ color: "#6b7280", margin: 0 }}>Choose the colleges you&apos;re applying to and which deadlines to track.</p>
          </div>
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", fontSize: "1.1rem" }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search colleges by name or location..."
              style={{ width: "100%", padding: "0.875rem 1rem 0.875rem 2.75rem", border: "1.5px solid #e5e7eb", borderRadius: "0.875rem", fontSize: "1rem", outline: "none", background: "white", boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            />
          </div>
          {selectedSchools.length > 0 && (
            <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "1rem", fontSize: "0.9rem", color: "#4f46e5", fontWeight: 500 }}>
              ✓ {selectedSchools.length} school{selectedSchools.length !== 1 ? "s" : ""} selected
            </div>
          )}
          <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2rem" }}>
            {filteredColleges.map(college => {
              const isSelected = selectedSchools.includes(college.id);
              const selectedTypes = selectedDeadlineTypes[college.id] || [];
              const availableTypes = (["EA", "ED", "ED2", "RD", "FAFSA"] as DeadlineType[]).filter(t => college.deadlines[t]);
              return (
                <div
                  key={college.id}
                  style={{ background: "white", borderRadius: "1rem", border: `2px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`, padding: "1rem 1.25rem", transition: "all 0.15s", boxShadow: isSelected ? "0 2px 12px rgba(99,102,241,0.15)" : "0 1px 4px rgba(0,0,0,0.05)" }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <div
                      onClick={() => handleSchoolToggle(college.id)}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? "#6366f1" : "#d1d5db"}`, background: isSelected ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: "0.15rem", transition: "all 0.15s" }}
                    >
                      {isSelected && <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", cursor: "pointer" }} onClick={() => handleSchoolToggle(college.id)}>
                        <span style={{ fontWeight: 700, color: "#1e1b4b", fontSize: "1rem" }}>{college.name}</span>
                        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>{college.location}</span>
                        {college.rank && <span style={{ background: "#fef3c7", color: "#92400e", padding: "0.15rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>#{college.rank}</span>}
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {availableTypes.map(type => (
                            <button
                              key={type}
                              onClick={() => toggleDeadlineType(college.id, type)}
                              style={{ padding: "0.3rem 0.75rem", borderRadius: "2rem", border: `1.5px solid ${selectedTypes.includes(type) ? deadlineTypeColor(type) : "#e5e7eb"}`, background: selectedTypes.includes(type) ? deadlineTypeColor(type) : "white", color: selectedTypes.includes(type) ? "white" : "#6b7280", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                            >
                              {type} · {college.deadlines[type]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ position: "sticky", bottom: "1rem", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setStep("onboarding-reminders")}
              disabled={selectedSchools.length === 0}
              style={{ padding: "0.875rem 2.5rem", background: selectedSchools.length === 0 ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: selectedSchools.length === 0 ? "#9ca3af" : "white", border: "none", borderRadius: "2rem", fontSize: "1rem", fontWeight: 700, cursor: selectedSchools.length === 0 ? "not-allowed" : "pointer", boxShadow: selectedSchools.length > 0 ? "0 4px 15px rgba(99,102,241,0.4)" : "none", transition: "all 0.15s" }}
            >
              Continue → Set Up Reminders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- ONBOARDING: REMINDERS ----
  if (step === "onboarding-reminders") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
        <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.75rem" }}>🎓</span>
            <span style={{ color: "white", fontWeight: 800, fontSize: "1.25rem" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["Schools", "Reminders"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: i <= 1 ? "#6366f1" : "rgba(255,255,255,0.2)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.8rem" }}>{i + 1}</div>
                <span style={{ color: i <= 1 ? "white" : "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 600 }}>{s}</span>
                {i < 1 && <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 0.25rem" }}>›</span>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e1b4b", marginBottom: "0.5rem" }}>Set Up Reminders</h2>
          <p style={{ color: "#6b7280", marginBottom: "2rem" }}>We&apos;ll remind you before each deadline so you never miss one.</p>

          <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 1rem", fontSize: "1.05rem" }}>📧 Notification Channels</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                <div
                  onClick={() => setReminderPrefs(p => ({ ...p, email: !p.email }))}
                  style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${reminderPrefs.email ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.email ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                >
                  {reminderPrefs.email && <span style={{ color: "white", fontSize: "0.75rem" }}>✓</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#374151" }}>Email Reminders</div>
                  <div style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Sent to {user?.email}</div>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                <div
                  onClick={() => setReminderPrefs(p => ({ ...p, sms: !p.sms }))}
                  style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${reminderPrefs.sms ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.sms ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: "0.2rem" }}
                >
                  {reminderPrefs.sms && <span style={{ color: "white", fontSize: "0.75rem" }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#374151" }}>SMS Reminders</div>
                  {reminderPrefs.sms && (
                    <input
                      type="tel"
                      value={reminderPrefs.phone}
                      onChange={e => setReminderPrefs(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      style={{ marginTop: "0.5rem", width: "100%", padding: "0.6rem 0.875rem", border: "1.5px solid #e5e7eb", borderRadius: "0.625rem", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }}
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 1rem", fontSize: "1.05rem" }}>⏰ Remind Me Before Deadline</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              {REMINDER_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  onClick={() => setReminderPrefs(p => ({
                    ...p,
                    days: p.days.includes(opt.value) ? p.days.filter(d => d !== opt.value) : [...p.days, opt.value]
                  }))}
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1rem", borderRadius: "0.75rem", border: `1.5px solid ${reminderPrefs.days.includes(opt.value) ? "#6366f1" : "#e5e7eb"}`, background: reminderPrefs.days.includes(opt.value) ? "#eef2ff" : "white", cursor: "pointer", transition: "all 0.15s" }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${reminderPrefs.days.includes(opt.value) ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.days.includes(opt.value) ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {reminderPrefs.days.includes(opt.value) && <span style={{ color: "white", fontSize: "0.65rem" }}>✓</span>}
                  </div>
                  <span style={{ fontWeight: 600, color: reminderPrefs.days.includes(opt.value) ? "#4f46e5" : "#374151", fontSize: "0.9rem" }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "2rem" }}>
            <div style={{ fontWeight: 600, color: "#15803d", marginBottom: "0.5rem", fontSize: "0.95rem" }}>📋 Your Summary</div>
            <div style={{ color: "#166534", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Tracking <strong>{selectedSchools.length} school{selectedSchools.length !== 1 ? "s" : ""}</strong> with{" "}
              <strong>{Object.values(selectedDeadlineTypes).flat().length} deadline{Object.values(selectedDeadlineTypes).flat().length !== 1 ? "s" : ""}</strong>.<br />
              Reminders via {[reminderPrefs.email && "email", reminderPrefs.sms && "SMS"].filter(Boolean).join(" & ") || "none"} at{" "}
              {reminderPrefs.days.sort((a, b) => b - a).map(d => `${d} day${d !== 1 ? "s" : ""}`).join(", ")} before each deadline.
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              onClick={() => setStep("onboarding-schools")}
              style={{ padding: "0.875rem 1.5rem", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "2rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", color: "#374151" }}
            >
              ← Back
            </button>
            <button
              onClick={handleOnboardingComplete}
              style={{ flex: 1, padding: "0.875rem 2rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "2rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.4)" }}
            >
              Launch My Dashboard 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- DASHBOARD ----
  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* NAVBAR */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🎓</span>
          <span style={{ color: "white", fontWeight: 800, fontSize: "1.2rem" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {savedMessage && (
            <span style={{ background: "rgba(16,185,129,0.2)", color: "#34d399", padding: "0.4rem 0.875rem", borderRadius: "2rem", fontSize: "0.85rem", fontWeight: 600 }}>{savedMessage}</span>
          )}
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem" }}>{user?.email}</span>
          <button
            onClick={handleLogout}
            style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "0.4rem 1rem", borderRadius: "1rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}
          >
            Log Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1rem" }}>
        {/* STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total Deadlines", value: trackedDeadlines.length, icon: "📋", color: "#6366f1", bg: "#eef2ff" },
            { label: "Upcoming", value: upcomingCount, icon: "⏳", color: "#3b82f6", bg: "#eff6ff" },
            { label: "Urgent (≤7 days)", value: urgentCount, icon: "🔥", color: "#ef4444", bg: "#fef2f2" },
            { label: "Schools Tracked", value: new Set(trackedDeadlines.map(d => d.collegeId)).size, icon: "🏫", color: "#10b981", bg: "#f0fdf4" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 48, height: 48, borderRadius: "0.875rem", background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.2rem", fontWeight: 500 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", alignItems: "start" }}>
          {/* MAIN DEADLINES PANEL */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Your Deadlines</h2>
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {(["ALL", "EA", "ED", "ED2", "RD", "FAFSA"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    style={{ padding: "0.35rem 0.875rem", borderRadius: "2rem", border: "none", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", background: filterType === type ? (type === "ALL" ? "#1e1b4b" : deadlineTypeColor(type)) : "#e5e7eb", color: filterType === type ? "white" : "#6b7280", transition: "all 0.15s" }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {displayedDeadlines.length === 0 ? (
              <div style={{ background: "white", borderRadius: "1.25rem", padding: "3rem 2rem", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</div>
                <h3 style={{ color: "#1e1b4b", fontWeight: 700, marginBottom: "0.5rem" }}>No deadlines tracked yet</h3>
                <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>Add schools to start tracking your application deadlines.</p>
                <button
                  onClick={() => setShowAddSchools(true)}
                  style={{ padding: "0.75rem 2rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
                >
                  + Add Schools
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {displayedDeadlines.map((deadline, idx) => {
                  const timeLeft = getTimeUntil(deadline.date);
                  const color = urgencyColor(timeLeft.days, timeLeft.past);
                  const typeColor = deadlineTypeColor(deadline.type);
                  const isNext = idx === 0 && !timeLeft.past;
                  return (
                    <div
                      key={`${deadline.collegeId}-${deadline.type}`}
                      style={{ background: "white", borderRadius: "1rem", padding: "1.25rem 1.5rem", boxShadow: isNext ? `0 4px 20px ${color}30` : "0 1px 4px rgba(0,0,0,0.06)", border: `1.5px solid ${isNext ? color : "transparent"}`, transition: "all 0.15s", position: "relative", overflow: "hidden" }}
                    >
                      {isNext && (
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${typeColor})` }} />
                      )}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                            <span
                              style={{ background: typeColor, color: "white", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 700 }}
                            >
                              {deadline.type}
                            </span>
                            {isNext && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.72rem", fontWeight: 700 }}>NEXT UP</span>}
                            {!timeLeft.past && timeLeft.days <= 7 && !isNext && <span style={{ background: "#fff7ed", color: "#f97316", padding: "0.2rem 0.6rem", borderRadius: "1rem", fontSize: "0.72rem", fontWeight: 700 }}>URGENT</span>}
                          </div>
                          <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 0.25rem", fontSize: "1.05rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {deadline.collegeName}
                          </h3>
                          <div style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
                            📅 Due: <strong style={{ color: "#374151" }}>{new Date(deadline.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          {timeLeft.past ? (
                            <div style={{ color: "#9ca3af", fontWeight: 600, fontSize: "0.9rem" }}>Passed</div>
                          ) : (
                            <div>
                              <div style={{ color, fontWeight: 800, fontSize: "1.1rem", lineHeight: 1 }}>
                                {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
                              </div>
                              <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "0.2rem" }}>{timeLeft.seconds}s remaining</div>
                            </div>
                          )}
                          <button
                            onClick={() => handleRemoveDeadline(deadline.collegeId, deadline.type)}
                            style={{ marginTop: "0.5rem", background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: "0.8rem", padding: "0.2rem 0.4rem", borderRadius: "0.375rem" }}
                            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                            onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}
                          >
                            ✕ Remove
                          </button>
                        </div>
                      </div>
                      {!timeLeft.past && (
                        <div style={{ marginTop: "0.875rem" }}>
                          <div style={{ height: 4, background: "#f3f4f6", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", background: `linear-gradient(90deg, ${color}80, ${color})`, borderRadius: "2px", width: `${Math.max(2, Math.min(100, 100 - (timeLeft.days / 365) * 100))}%`, transition: "width 1s" }} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <button
                onClick={() => setShowAddSchools(true)}
                style={{ padding: "0.75rem 2rem", background: "white", border: "1.5px dashed #c7d2fe", borderRadius: "2rem", color: "#6366f1", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#eef2ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "white")}
              >
                + Add More Schools
              </button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* REMINDER PREFS */}
            <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 1rem", fontSize: "1rem" }}>⏰ Reminder Settings</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                {REMINDER_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    onClick={() => setReminderPrefs(p => ({
                      ...p,
                      days: p.days.includes(opt.value) ? p.days.filter(d => d !== opt.value) : [...p.days, opt.value]
                    }))}
                    style={{ display: "flex", alignItems: "center", gap: "0.625rem", cursor: "pointer", padding: "0.5rem 0.75rem", borderRadius: "0.625rem", background: reminderPrefs.days.includes(opt.value) ? "#eef2ff" : "#f9fafb", transition: "all 0.15s" }}
                  >
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${reminderPrefs.days.includes(opt.value) ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.days.includes(opt.value) ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {reminderPrefs.days.includes(opt.value) && <span style={{ color: "white", fontSize: "0.6rem" }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "0.85rem", fontWeight: 500, color: reminderPrefs.days.includes(opt.value) ? "#4f46e5" : "#6b7280" }}>{opt.label}</span>
                  </label>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}
                  onClick={() => setReminderPrefs(p => ({ ...p, email: !p.email }))}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${reminderPrefs.email ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.email ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {reminderPrefs.email && <span style={{ color: "white", fontSize: "0.6rem" }}>✓</span>}
                  </div>
                  📧 Email notifications
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", cursor: "pointer" }}
                  onClick={() => setReminderPrefs(p => ({ ...p, sms: !p.sms }))}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${reminderPrefs.sms ? "#6366f1" : "#d1d5db"}`, background: reminderPrefs.sms ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {reminderPrefs.sms && <span style={{ color: "white", fontSize: "0.6rem" }}>✓</span>}
                  </div>
                  💬 SMS notifications
                </label>
              </div>
              <button
                onClick={handleSaveReminders}
                style={{ width: "100%", padding: "0.65rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", border: "none", borderRadius: "0.75rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}
              >
                Save Preferences
              </button>
            </div>

            {/* LEGEND */}
            <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 0.875rem", fontSize: "1rem" }}>📖 Deadline Types</h3>
              {(["EA", "ED", "ED2", "RD", "FAFSA"] as DeadlineType[]).map(type => (
                <div key={type} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                  <span style={{ background: deadlineTypeColor(type), color: "white", padding: "0.1rem 0.5rem", borderRadius: "0.75rem", fontSize: "0.72rem", fontWeight: 700, flexShrink: 0, marginTop: "0.1rem" }}>{type}</span>
                  <span style={{ fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>
                    {type === "EA" && "Early Action – non-binding early decision"}
                    {type === "ED" && "Early Decision – binding commitment"}
                    {type === "ED2" && "Early Decision II – second round binding"}
                    {type === "RD" && "Regular Decision – standard deadline"}
                    {type === "FAFSA" && "Financial aid application deadline"}
                  </span>
                </div>
              ))}
            </div>

            {/* COUNTDOWN URGENCY LEGEND */}
            <div style={{ background: "white", borderRadius: "1.25rem", padding: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#1e1b4b", margin: "0 0 0.875rem", fontSize: "1rem" }}>🎨 Urgency Colors</h3>
              {[
                { label: "≤ 1 day", color: "#ef4444" },
                { label: "2–7 days", color: "#f97316" },
                { label: "8–14 days", color: "#eab308" },
                { label: "15–30 days", color: "#3b82f6" },
                { label: "30+ days", color: "#10b981" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ADD SCHOOLS MODAL */}
      {showAddSchools && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.5rem", width: "100%", maxWidth: 700, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "1.5rem 1.5rem 1rem", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontWeight: 800, color: "#1e1b4b", margin: 0, fontSize: "1.25rem" }}>Add More Schools</h3>
                <button onClick={() => { setShowAddSchools(false); setSelectedSchools([]); setSelectedDeadlineTypes({}); }} style={{ background: "none", border: "none", fontSize: "1.25rem", cursor: "pointer", color: "#9ca3af" }}>✕</button>
              </div>
              <div style={{ position: "relative", marginTop: "1rem" }}>
                <span style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
                <input
                  type="text"
                  value={addSearchQuery}
                  onChange={e => setAddSearchQuery(e.target.value)}
                  placeholder="Search colleges..."
                  style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.5rem", border: "1.5px solid #e5e7eb", borderRadius: "0.75rem", fontSize: "0.95rem", outline: "none", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {filteredAddColleges.map(college => {
                  const isSelected = selectedSchools.includes(college.id);
                  const isAlreadyTracked = trackedDeadlines.some(d => d.collegeId === college.id);
                  const selectedTypes = selectedDeadlineTypes[college.id] || [];
                  const availableTypes = (["EA", "ED", "ED2", "RD", "FAFSA"] as DeadlineType[]).filter(t => college.deadlines[t]);
                  return (
                    <div
                      key={college.id}
                      style={{ background: isAlreadyTracked && !isSelected ? "#f9fafb" : "white", borderRadius: "0.875rem", border: `1.5px solid ${isSelected ? "#6366f1" : "#e5e7eb"}`, padding: "0.875rem 1rem" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          onClick={() => !isAlreadyTracked && handleSchoolToggle(college.id)}
                          style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isSelected ? "#6366f1" : isAlreadyTracked ? "#e5e7eb" : "#d1d5db"}`, background: isSelected ? "#6366f1" : "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: isAlreadyTracked ? "default" : "pointer", flexShrink: 0 }}
                        >
                          {isSelected && <span style={{ color: "white", fontSize: "0.7rem" }}>✓</span>}
                        </div>
                        <div style={{ flex: 1, cursor: isAlreadyTracked ? "default" : "pointer" }} onClick={() => !isAlreadyTracked && handleSchoolToggle(college.id)}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontWeight: 700, color: isAlreadyTracked ? "#9ca3af" : "#1e1b4b", fontSize: "0.95rem" }}>{college.name}</span>
                            <span style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{college.location}</span>
                            {isAlreadyTracked && <span style={{ background: "#f0fdf4", color: "#15803d", padding: "0.1rem 0.4rem", borderRadius: "0.5rem", fontSize: "0.72rem", fontWeight: 600 }}>Already tracking</span>}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div style={{ marginTop: "0.625rem", marginLeft: "2rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                          {availableTypes.map(type => (
                            <button
                              key={type}
                              onClick={() => toggleDeadlineType(college.id, type)}
                              style={{ padding: "0.25rem 0.625rem", borderRadius: "1.5rem", border: `1.5px solid ${selectedTypes.includes(type) ? deadlineTypeColor(type) : "#e5e7eb"}`, background: selectedTypes.includes(type) ? deadlineTypeColor(type) : "white", color: selectedTypes.includes(type) ? "white" : "#6b7280", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                            >
                              {type} · {college.deadlines[type]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => { setShowAddSchools(false); setSelectedSchools([]); setSelectedDeadlineTypes({}); }}
                style={{ padding: "0.7rem 1.5rem", background: "white", border: "1.5px solid #e5e7eb", borderRadius: "2rem", color: "#374151", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchoolsToDashboard}
                disabled={selectedSchools.length === 0}
                style={{ padding: "0.7rem 1.75rem", background: selectedSchools.length === 0 ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: selectedSchools.length === 0 ? "#9ca3af" : "white", border: "none", borderRadius: "2rem", fontWeight: 700, cursor: selectedSchools.length === 0 ? "not-allowed" : "pointer", fontSize: "0.9rem" }}
              >
                Add {selectedSchools.length > 0 ? `${selectedSchools.length} School${selectedSchools.length !== 1 ? "s" : ""}` : "Schools"} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* invisible tick dependency to force re-render */}
      <span style={{ display: "none" }}>{tick}</span>
    </div>
  );
}