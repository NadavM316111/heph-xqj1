"use client";

import { useState, useEffect, useCallback } from "react";
import { COLLEGES, College, Deadline } from "../lib/colleges";

type Step = "email" | "schools" | "reminders" | "dashboard";

interface UserDeadline {
  collegeId: string;
  collegeName: string;
  deadline: Deadline;
  daysUntil: number;
  isPast: boolean;
}

interface ReminderPrefs {
  email: boolean;
  sms: boolean;
  phone: string;
  days: number[];
}

const REMINDER_DAYS = [30, 14, 7, 1];

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBadgeColor(daysUntil: number, isPast: boolean): string {
  if (isPast) return "#9ca3af";
  if (daysUntil <= 1) return "#ef4444";
  if (daysUntil <= 7) return "#f97316";
  if (daysUntil <= 14) return "#eab308";
  if (daysUntil <= 30) return "#3b82f6";
  return "#22c55e";
}

function getTypeColor(type: string): string {
  switch (type) {
    case "ED": return "#7c3aed";
    case "ED2": return "#9333ea";
    case "EA": return "#2563eb";
    case "REA": return "#0891b2";
    case "RD": return "#16a34a";
    case "Scholarship": return "#d97706";
    default: return "#6b7280";
  }
}

export default function Home() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedSchools, setSelectedSchools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>({
    email: true,
    sms: false,
    phone: "",
    days: [30, 14, 7, 1],
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("upcoming");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_email");
    const storedSchools = localStorage.getItem("edutracker_schools");
    const storedPrefs = localStorage.getItem("edutracker_prefs");
    if (stored) {
      setEmail(stored);
      if (storedSchools) {
        setSelectedSchools(new Set(JSON.parse(storedSchools)));
      }
      if (storedPrefs) {
        setReminderPrefs(JSON.parse(storedPrefs));
      }
      setStep("dashboard");
    }
  }, []);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setEmail(trimmed);
    localStorage.setItem("edutracker_email", trimmed);
    setStep("schools");
  };

  const toggleSchool = (id: string) => {
    setSelectedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSchoolsNext = () => {
    if (selectedSchools.size === 0) {
      showToast("Please select at least one school.");
      return;
    }
    localStorage.setItem("edutracker_schools", JSON.stringify([...selectedSchools]));
    setStep("reminders");
  };

  const toggleReminderDay = (day: number) => {
    setReminderPrefs((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day],
    }));
  };

  const handleSaveReminders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reminderPrefs.sms && !reminderPrefs.phone.match(/^\+?[\d\s\-().]{7,15}$/)) {
      setSaveError("Please enter a valid phone number for SMS reminders.");
      return;
    }
    setSaveError("");
    setSaving(true);
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          schools: [...selectedSchools],
          prefs: reminderPrefs,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to save");
      localStorage.setItem("edutracker_prefs", JSON.stringify(reminderPrefs));
      setStep("dashboard");
      showToast("🎉 Reminders set up! You're all set.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save reminders";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const getUpcomingDeadlines = useCallback((): UserDeadline[] => {
    const results: UserDeadline[] = [];
    const schoolIds = selectedSchools.size > 0 ? selectedSchools : new Set(COLLEGES.map((c) => c.id));
    COLLEGES.forEach((college) => {
      if (!schoolIds.has(college.id)) return;
      college.deadlines.forEach((dl) => {
        const daysUntil = getDaysUntil(dl.date);
        results.push({
          collegeId: college.id,
          collegeName: college.name,
          deadline: dl,
          daysUntil,
          isPast: daysUntil < 0,
        });
      });
    });
    results.sort((a, b) => a.daysUntil - b.daysUntil);
    return results;
  }, [selectedSchools]);

  const filteredDeadlines = useCallback((): UserDeadline[] => {
    let all = getUpcomingDeadlines();
    if (filterType !== "all") all = all.filter((d) => d.deadline.type === filterType);
    if (filterStatus === "upcoming") all = all.filter((d) => !d.isPast);
    if (filterStatus === "past") all = all.filter((d) => d.isPast);
    return all;
  }, [getUpcomingDeadlines, filterType, filterStatus]);

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayColleges = showOnlySelected
    ? filteredColleges.filter((c) => selectedSchools.has(c.id))
    : filteredColleges;

  const upcomingCount = getUpcomingDeadlines().filter((d) => !d.isPast).length;
  const urgentCount = getUpcomingDeadlines().filter((d) => !d.isPast && d.daysUntil <= 14).length;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
        color: "white",
        padding: "0 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🎓</span>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Edutracker</span>
          </div>
          {step === "dashboard" && email && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, opacity: 0.85 }}>{email}</span>
              <button
                onClick={() => {
                  setStep("schools");
                  setSearchQuery("");
                }}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Edit Schools
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  setEmail("");
                  setEmailInput("");
                  setSelectedSchools(new Set());
                  setStep("email");
                }}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "white",
                  padding: "6px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {step !== "dashboard" && (
        <div style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {(["email", "schools", "reminders"] as Step[]).map((s, i) => {
                const labels = ["Your Email", "Select Schools", "Set Reminders"];
                const stepIndex = ["email", "schools", "reminders"].indexOf(step);
                const isActive = s === step;
                const isDone = i < stepIndex;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : undefined }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: isDone ? "#22c55e" : isActive ? "#2563eb" : "#e2e8f0",
                        color: isDone || isActive ? "white" : "#9ca3af",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: 600,
                      }}>
                        {isDone ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? "#1e3a5f" : "#6b7280" }}>
                        {labels[i]}
                      </span>
                    </div>
                    {i < 2 && <div style={{ flex: 1, height: 2, background: isDone ? "#22c55e" : "#e2e8f0", margin: "0 8px" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1e3a5f", color: "white", padding: "12px 24px", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 9999, fontSize: 14, fontWeight: 500,
        }}>
          {toastMsg}
        </div>
      )}

      <main style={{ maxWidth: step === "dashboard" ? 1100 : 700, margin: "0 auto", padding: "32px 24px" }}>

        {/* STEP: Email */}
        {step === "email" && (
          <div style={{ background: "white", borderRadius: 16, padding: "48px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#1e3a5f", margin: "0 0 12px" }}>
              Never Miss a Deadline
            </h1>
            <p style={{ color: "#64748b", fontSize: 16, marginBottom: 36, lineHeight: 1.6 }}>
              Track EA, ED, RD, and scholarship deadlines for 80+ top colleges.<br />
              Get reminders at 30, 14, 7, and 1 day before each deadline.
            </p>
            <form onSubmit={handleEmailSubmit} style={{ maxWidth: 400, margin: "0 auto" }}>
              <div style={{ marginBottom: 16 }}>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    width: "100%", padding: "14px 18px", fontSize: 16,
                    border: emailError ? "2px solid #ef4444" : "2px solid #e2e8f0",
                    borderRadius: 10, outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                  onBlur={(e) => e.target.style.borderColor = emailError ? "#ef4444" : "#e2e8f0"}
                  autoFocus
                />
                {emailError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 6, textAlign: "left" }}>{emailError}</p>}
              </div>
              <button
                type="submit"
                style={{
                  width: "100%", padding: "14px", background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                  color: "white", border: "none", borderRadius: 10, fontSize: 16, fontWeight: 600,
                  cursor: "pointer", letterSpacing: "0.3px",
                }}
              >
                Get Started →
              </button>
            </form>
            <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 32 }}>
              {[["80+", "Colleges"], ["4", "Deadline Types"], ["100%", "Free"]].map(([num, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#2563eb" }}>{num}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP: Schools */}
        {step === "schools" && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: "0 0 8px" }}>
                Select Your Target Schools
              </h2>
              <p style={{ color: "#64748b", margin: 0 }}>
                Choose the colleges you&apos;re applying to. Selected: <strong>{selectedSchools.size}</strong>
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="Search colleges or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1, minWidth: 200, padding: "10px 16px", fontSize: 14,
                  border: "2px solid #e2e8f0", borderRadius: 10, outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
              <button
                onClick={() => setShowOnlySelected(!showOnlySelected)}
                style={{
                  padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
                  border: "2px solid",
                  borderColor: showOnlySelected ? "#2563eb" : "#e2e8f0",
                  background: showOnlySelected ? "#eff6ff" : "white",
                  color: showOnlySelected ? "#2563eb" : "#64748b",
                  cursor: "pointer",
                }}
              >
                {showOnlySelected ? "✓ Selected Only" : "Show Selected Only"}
              </button>
              <button
                onClick={() => setSelectedSchools(new Set(COLLEGES.map((c) => c.id)))}
                style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, border: "2px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedSchools(new Set())}
                style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, border: "2px solid #e2e8f0", background: "white", cursor: "pointer", color: "#64748b" }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 24 }}>
              {displayColleges.map((college) => {
                const selected = selectedSchools.has(college.id);
                return (
                  <div
                    key={college.id}
                    onClick={() => toggleSchool(college.id)}
                    style={{
                      background: selected ? "#eff6ff" : "white",
                      border: `2px solid ${selected ? "#2563eb" : "#e2e8f0"}`,
                      borderRadius: 12, padding: "14px 16px", cursor: "pointer",
                      transition: "all 0.15s", display: "flex", alignItems: "flex-start", gap: 12,
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: selected ? "#2563eb" : "white",
                      border: `2px solid ${selected ? "#2563eb" : "#d1d5db"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2, color: "white", fontSize: 13,
                    }}>
                      {selected && "✓"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1e3a5f", marginBottom: 2 }}>{college.name}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{college.location} · {college.type}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {college.deadlines.map((dl) => (
                          <span key={dl.type + dl.date} style={{
                            fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                            background: getTypeColor(dl.type) + "20",
                            color: getTypeColor(dl.type),
                          }}>
                            {dl.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {displayColleges.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No colleges match your search.</div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setStep("email")} style={{ padding: "12px 24px", borderRadius: 10, border: "2px solid #e2e8f0", background: "white", fontSize: 15, cursor: "pointer", color: "#64748b" }}>
                ← Back
              </button>
              <button
                onClick={handleSchoolsNext}
                style={{
                  padding: "12px 32px", background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
                  color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Continue with {selectedSchools.size} school{selectedSchools.size !== 1 ? "s" : ""} →
              </button>
            </div>
          </div>
        )}

        {/* STEP: Reminders */}
        {step === "reminders" && (
          <div style={{ background: "white", borderRadius: 16, padding: "40px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: "0 0 8px" }}>Set Up Reminders</h2>
            <p style={{ color: "#64748b", marginBottom: 32 }}>
              We&apos;ll remind you before each deadline for your {selectedSchools.size} selected school{selectedSchools.size !== 1 ? "s" : ""}.
            </p>
            <form onSubmit={handleSaveReminders}>
              <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 600, fontSize: 15, color: "#374151", display: "block", marginBottom: 12 }}>
                  Reminder Timing
                </label>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Choose when to receive reminders before each deadline:</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {REMINDER_DAYS.map((day) => {
                    const active = reminderPrefs.days.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleReminderDay(day)}
                        style={{
                          padding: "10px 20px", borderRadius: 10, fontWeight: 600, fontSize: 14,
                          border: "2px solid",
                          borderColor: active ? "#2563eb" : "#e2e8f0",
                          background: active ? "#eff6ff" : "white",
                          color: active ? "#2563eb" : "#6b7280",
                          cursor: "pointer", transition: "all 0.15s",
                        }}
                      >
                        {day} day{day !== 1 ? "s" : ""} before
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 28 }}>
                <label style={{ fontWeight: 600, fontSize: 15, color: "#374151", display: "block", marginBottom: 12 }}>
                  Notification Channels
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "14px 16px", borderRadius: 10, border: "2px solid", borderColor: reminderPrefs.email ? "#2563eb" : "#e2e8f0", background: reminderPrefs.email ? "#eff6ff" : "white" }}>
                    <input
                      type="checkbox"
                      checked={reminderPrefs.email}
                      onChange={(e) => setReminderPrefs((p) => ({ ...p, email: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "#2563eb" }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1e3a5f" }}>📧 Email Reminders</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Sent to {email}</div>
                    </div>
                  </label>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "14px 16px", borderRadius: 10, border: "2px solid", borderColor: reminderPrefs.sms ? "#2563eb" : "#e2e8f0", background: reminderPrefs.sms ? "#eff6ff" : "white" }}>
                    <input
                      type="checkbox"
                      checked={reminderPrefs.sms}
                      onChange={(e) => setReminderPrefs((p) => ({ ...p, sms: e.target.checked }))}
                      style={{ width: 18, height: 18, accentColor: "#2563eb", marginTop: 2 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1e3a5f" }}>📱 SMS Reminders</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: reminderPrefs.sms ? 10 : 0 }}>Text messages to your phone</div>
                      {reminderPrefs.sms && (
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={reminderPrefs.phone}
                          onChange={(e) => setReminderPrefs((p) => ({ ...p, phone: e.target.value }))}
                          style={{ width: "100%", padding: "8px 12px", fontSize: 14, border: "2px solid #e2e8f0", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
                        />
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {saveError && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button type="button" onClick={() => setStep("schools")} style={{ padding: "12px 24px", borderRadius: 10, border: "2px solid #e2e8f0", background: "white", fontSize: 15, cursor: "pointer", color: "#64748b" }}>
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "12px 32px", background: saving ? "#94a3b8" : "linear-gradient(135deg, #1e3a5f, #2563eb)",
                    color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save & View Dashboard →"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP: Dashboard */}
        {step === "dashboard" && (
          <div>
            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[
                { icon: "🏫", label: "Schools Tracked", value: selectedSchools.size.toString(), color: "#2563eb" },
                { icon: "📅", label: "Total Deadlines", value: upcomingCount.toString(), color: "#16a34a" },
                { icon: "🔥", label: "Due in 14 Days", value: urgentCount.toString(), color: urgentCount > 0 ? "#ef4444" : "#9ca3af" },
                { icon: "📧", label: "Reminders Active", value: reminderPrefs.email || reminderPrefs.sms ? "Yes" : "No", color: "#7c3aed" },
              ].map(({ icon, label, value, color }) => (
                <div key={label} style={{ background: "white", borderRadius: 12, padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ background: "white", borderRadius: 12, padding: "16px 20px", marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Filter:</span>
              <div style={{ display: "flex", gap: 6 }}>
                {["all", "upcoming", "past"].map((s) => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: filterStatus === s ? 600 : 400,
                    border: "2px solid", borderColor: filterStatus === s ? "#2563eb" : "#e2e8f0",
                    background: filterStatus === s ? "#eff6ff" : "white",
                    color: filterStatus === s ? "#2563eb" : "#6b7280", cursor: "pointer",
                  }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["all", "ED", "ED2", "EA", "REA", "RD", "Scholarship"].map((t) => (
                  <button key={t} onClick={() => setFilterType(t)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: filterType === t ? 600 : 400,
                    border: "2px solid", borderColor: filterType === t ? getTypeColor(t === "all" ? "RD" : t) : "#e2e8f0",
                    background: filterType === t ? getTypeColor(t === "all" ? "RD" : t) + "15" : "white",
                    color: filterType === t ? getTypeColor(t === "all" ? "RD" : t) : "#6b7280", cursor: "pointer",
                  }}>
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredDeadlines().length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af", background: "white", borderRadius: 12 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>No deadlines match your filters.</div>
                </div>
              )}
              {filteredDeadlines().map((item, idx) => {
                const badgeColor = getBadgeColor(item.daysUntil, item.isPast);
                const typeColor = getTypeColor(item.deadline.type);
                return (
                  <div key={`${item.collegeId}-${item.deadline.type}-${item.deadline.date}-${idx}`}
                    style={{
                      background: "white",
                      borderRadius: 12,
                      padding: "16px 20px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      border: `1px solid ${item.isPast ? "#f1f5f9" : item.daysUntil <= 7 ? "#fecaca" : "#f1f5f9"}`,
                      display: "flex", alignItems: "center", gap: 16,
                      opacity: item.isPast ? 0.65 : 1,
                    }}
                  >
                    <div style={{
                      minWidth: 72, textAlign: "center", background: badgeColor + "15",
                      border: `2px solid ${badgeColor}40`, borderRadius: 10, padding: "8px 4px",
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: badgeColor, lineHeight: 1 }}>
                        {item.isPast ? "✓" : item.daysUntil === 0 ? "TODAY" : item.daysUntil}
                      </div>
                      {!item.isPast && item.daysUntil > 0 && (
                        <div style={{ fontSize: 9, color: badgeColor, fontWeight: 600, textTransform: "uppercase" }}>days left</div>
                      )}
                      {item.isPast && (
                        <div style={{ fontSize: 9, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>passed</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e3a5f" }}>{item.collegeName}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                          background: typeColor + "20", color: typeColor,
                        }}>
                          {item.deadline.type}
                        </span>
                        {item.deadline.label && (
                          <span style={{ fontSize: 11, color: "#64748b", fontStyle: "italic" }}>{item.deadline.label}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        📅 {formatDate(item.deadline.date)}
                        {item.deadline.note && <span style={{ marginLeft: 8, color: "#94a3b8" }}>· {item.deadline.note}</span>}
                      </div>
                    </div>
                    {!item.isPast && item.daysUntil <= 7 && (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                        URGENT
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}