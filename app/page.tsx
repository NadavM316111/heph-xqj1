"use client";

import { useEffect, useState, useCallback } from "react";
import { COLLEGES, College, Deadline } from "@/lib/colleges";

type AuthMode = "login" | "signup";
type AppView = "auth" | "onboarding" | "dashboard";

interface UserState {
  email: string;
  selectedSchools: string[]; // college ids
  reminderEmail: string;
  reminderPhone: string;
  onboardingComplete: boolean;
}

interface ReminderLog {
  collegeId: string;
  deadlineType: string;
  intervalDays: number;
  sentAt: string;
}

const DEFAULT_USER: UserState = {
  email: "",
  selectedSchools: [],
  reminderEmail: "",
  reminderPhone: "",
  onboardingComplete: false,
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function deadlineLabel(type: Deadline["type"]): string {
  const map: Record<Deadline["type"], string> = {
    EA: "Early Action",
    ED: "Early Decision",
    ED2: "Early Decision II",
    RD: "Regular Decision",
    Scholarship: "Scholarship",
    "Financial Aid": "Financial Aid",
  };
  return map[type] || type;
}

function deadlineColor(type: Deadline["type"]): string {
  const map: Record<Deadline["type"], string> = {
    EA: "#7c3aed",
    ED: "#dc2626",
    ED2: "#ea580c",
    RD: "#2563eb",
    Scholarship: "#16a34a",
    "Financial Aid": "#0891b2",
  };
  return map[type] || "#6b7280";
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#dc2626";
  if (days <= 14) return "#ea580c";
  if (days <= 30) return "#d97706";
  return "#16a34a";
}

// ===================== AUTH PANEL =====================
function AuthPanel({ onAuth }: { onAuth: (email: string) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
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
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "48px 40px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎓</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e3a8a", margin: "0 0 4px" }}>Edutracker</h1>
          <p style={{ color: "#6b7280", margin: 0, fontSize: "14px" }}>Never miss a college application deadline</p>
        </div>

        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: "10px", padding: "4px", marginBottom: "24px" }}>
          {(["login", "signup"] as AuthMode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.2s", background: mode === m ? "#fff" : "transparent", color: mode === m ? "#1e3a8a" : "#6b7280", boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.1)" : "none" }}>
              {m === "login" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#a5b4fc" : "linear-gradient(135deg, #1e3a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===================== ONBOARDING =====================
function OnboardingFlow({ userState, onComplete }: { userState: UserState; onComplete: (updates: Partial<UserState>) => void }) {
  const [step, setStep] = useState(1);
  const [selectedSchools, setSelectedSchools] = useState<string[]>(userState.selectedSchools);
  const [reminderEmail, setReminderEmail] = useState(userState.reminderEmail || userState.email);
  const [reminderPhone, setReminderPhone] = useState(userState.reminderPhone);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("All");

  const categories = ["All", "Ivy League", "Public", "Liberal Arts", "STEM-focused", "Large University"];

  const filtered = COLLEGES.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterType === "All" || c.category === filterType;
    return matchSearch && matchCat;
  });

  function toggleSchool(id: string) {
    setSelectedSchools((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function handleFinish() {
    onComplete({ selectedSchools, reminderEmail, reminderPhone, onboardingComplete: true });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", padding: "20px 24px", color: "#fff" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "28px" }}>🎓</span>
            <span style={{ fontSize: "20px", fontWeight: "800" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", background: step >= s ? "#fff" : "rgba(255,255,255,0.3)", color: step >= s ? "#1e3a8a" : "#fff" }}>{s}</div>
                <span style={{ fontSize: "13px", opacity: step === s ? 1 : 0.6, fontWeight: step === s ? "700" : "400" }}>{s === 1 ? "Pick Schools" : s === 2 ? "Set Reminders" : "All Done"}</span>
                {s < 3 && <div style={{ width: "40px", height: "2px", background: "rgba(255,255,255,0.3)", marginLeft: "4px" }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
        {/* Step 1: Select Schools */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1e1e2e", margin: "0 0 6px" }}>Choose Your Target Schools</h2>
              <p style={{ color: "#6b7280", margin: 0 }}>Select all colleges you're applying to. You can always change this later.</p>
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schools..." style={{ flex: "1 1 200px", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {categories.map((cat) => (
                  <button key={cat} onClick={() => setFilterType(cat)} style={{ padding: "8px 14px", border: "2px solid", borderColor: filterType === cat ? "#7c3aed" : "#e5e7eb", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer", background: filterType === cat ? "#7c3aed" : "#fff", color: filterType === cat ? "#fff" : "#374151", transition: "all 0.2s" }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden", marginBottom: "20px" }}>
              <div style={{ padding: "12px 16px", background: "#f9fafb", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#6b7280" }}>{filtered.length} schools shown</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#7c3aed" }}>{selectedSchools.length} selected</span>
              </div>
              <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                {filtered.map((college) => {
                  const isSelected = selectedSchools.includes(college.id);
                  return (
                    <div key={college.id} onClick={() => toggleSchool(college.id)} style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", background: isSelected ? "#f5f3ff" : "#fff", transition: "background 0.15s" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "6px", border: "2px solid", borderColor: isSelected ? "#7c3aed" : "#d1d5db", background: isSelected ? "#7c3aed" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "14px", flexShrink: 0, fontSize: "13px", color: "#fff" }}>
                        {isSelected && "✓"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", color: "#1e1e2e", fontSize: "14px" }}>{college.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{college.location} • {college.category}</div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {college.deadlines.map((d) => (
                          <span key={d.type} style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: deadlineColor(d.type) + "22", color: deadlineColor(d.type), fontWeight: "700" }}>{d.type}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>{selectedSchools.length === 0 ? "Select at least one school to continue" : `${selectedSchools.length} school${selectedSchools.length > 1 ? "s" : ""} selected`}</span>
              <button onClick={() => setStep(2)} disabled={selectedSchools.length === 0} style={{ padding: "12px 28px", background: selectedSchools.length === 0 ? "#d1d5db" : "linear-gradient(135deg, #1e3a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: selectedSchools.length === 0 ? "not-allowed" : "pointer" }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Reminders */}
        {step === 2 && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1e1e2e", margin: "0 0 6px" }}>Set Up Your Reminders</h2>
              <p style={{ color: "#6b7280", margin: 0 }}>We'll send you alerts at 30, 14, 7, and 1 day before each deadline.</p>
            </div>

            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "28px", marginBottom: "20px" }}>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>📧 Email Reminders</label>
                <input type="email" value={reminderEmail} onChange={(e) => setReminderEmail(e.target.value)} placeholder="your@email.com" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "6px 0 0" }}>We'll send reminder emails to this address.</p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>📱 SMS Reminders (Optional)</label>
                <input type="tel" value={reminderPhone} onChange={(e) => setReminderPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "15px", outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: "6px 0 0" }}>US numbers only. Leave blank to skip SMS.</p>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0", padding: "16px 20px", marginBottom: "24px" }}>
              <div style={{ fontWeight: "700", color: "#16a34a", marginBottom: "8px" }}>📅 Your reminder schedule:</div>
              {["30 days before — Start your application", "14 days before — Final push reminder", "7 days before — Last week alert", "1 day before — Final warning"].map((r) => (
                <div key={r} style={{ fontSize: "13px", color: "#374151", padding: "3px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#16a34a" }}>✓</span> {r}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(1)} style={{ padding: "12px 24px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} style={{ padding: "12px 28px", background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ fontSize: "64px", marginBottom: "12px" }}>🎉</div>
              <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e1e2e", margin: "0 0 6px" }}>You're all set!</h2>
              <p style={{ color: "#6b7280", margin: 0 }}>Here's a summary of your tracking setup.</p>
            </div>

            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px" }}>
              <div style={{ fontWeight: "700", color: "#374151", marginBottom: "14px", fontSize: "15px" }}>📚 Schools you're tracking ({selectedSchools.length})</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedSchools.map((id) => {
                  const c = COLLEGES.find((col) => col.id === id);
                  return c ? (
                    <span key={id} style={{ background: "#ede9fe", color: "#7c3aed", padding: "6px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>{c.name}</span>
                  ) : null;
                })}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "28px" }}>
              <div style={{ fontWeight: "700", color: "#374151", marginBottom: "14px", fontSize: "15px" }}>🔔 Reminder channels</div>
              <div style={{ fontSize: "14px", color: "#374151" }}>
                <div style={{ marginBottom: "8px" }}>📧 Email: <strong>{reminderEmail || "Not set"}</strong></div>
                <div>📱 SMS: <strong>{reminderPhone || "Not set"}</strong></div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setStep(2)} style={{ padding: "12px 24px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600", cursor: "pointer" }}>← Back</button>
              <button onClick={handleFinish} style={{ padding: "14px 36px", background: "linear-gradient(135deg, #16a34a, #059669)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
                Go to Dashboard 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== DASHBOARD =====================
function Dashboard({ userState, onUpdateUser }: { userState: UserState; onUpdateUser: (updates: Partial<UserState>) => void }) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "schools" | "settings">("upcoming");
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [searchAdd, setSearchAdd] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Simulated reminder check
  useEffect(() => {
    const stored = localStorage.getItem("edutracker_reminder_logs");
    if (stored) {
      try { setReminderLogs(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Build all deadlines for selected schools
  const allDeadlines: Array<{ college: College; deadline: Deadline; days: number }> = [];
  userState.selectedSchools.forEach((id) => {
    const college = COLLEGES.find((c) => c.id === id);
    if (!college) return;
    college.deadlines.forEach((dl) => {
      const days = daysUntil(dl.date);
      allDeadlines.push({ college, deadline: dl, days });
    });
  });

  // Sort by date
  allDeadlines.sort((a, b) => a.days - b.days);

  const upcoming = allDeadlines.filter((d) => d.days >= 0);
  const past = allDeadlines.filter((d) => d.days < 0);

  // Urgent (<=7 days)
  const urgent = upcoming.filter((d) => d.days <= 7);

  function removeSchool(id: string) {
    onUpdateUser({ selectedSchools: userState.selectedSchools.filter((s) => s !== id) });
    showToast("School removed from your list.");
  }

  function addSchool(id: string) {
    if (userState.selectedSchools.includes(id)) return;
    onUpdateUser({ selectedSchools: [...userState.selectedSchools, id] });
    showToast("School added to your list!");
  }

  function simulateReminder(college: College, deadline: Deadline, intervalDays: number) {
    const log: ReminderLog = {
      collegeId: college.id,
      deadlineType: deadline.type,
      intervalDays,
      sentAt: new Date().toISOString(),
    };
    const newLogs = [...reminderLogs, log];
    setReminderLogs(newLogs);
    localStorage.setItem("edutracker_reminder_logs", JSON.stringify(newLogs));
    showToast(`✉️ Reminder simulated: ${college.name} ${deadline.type} (${intervalDays}-day alert)`);
  }

  const untracked = COLLEGES.filter(
    (c) => !userState.selectedSchools.includes(c.id) && c.name.toLowerCase().includes(searchAdd.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", background: "#1e1e2e", color: "#fff", padding: "12px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: "600", zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%)", padding: "0 24px", color: "#fff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "28px" }}>🎓</span>
              <span style={{ fontSize: "20px", fontWeight: "800" }}>Edutracker</span>
            </div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>👤 {userState.email}</div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "20px", padding: "20px 0 0", flexWrap: "wrap" }}>
            {[
              { label: "Schools Tracked", value: userState.selectedSchools.length, icon: "🏫" },
              { label: "Upcoming Deadlines", value: upcoming.length, icon: "📅" },
              { label: "Urgent (≤7 days)", value: urgent.length, icon: "🚨" },
              { label: "Past Deadlines", value: past.length, icon: "✅" },
            ].map((stat) => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "14px 20px", minWidth: "120px" }}>
                <div style={{ fontSize: "22px", marginBottom: "4px" }}>{stat.icon}</div>
                <div style={{ fontSize: "24px", fontWeight: "800" }}>{stat.value}</div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "4px", marginTop: "20px" }}>
            {(["upcoming", "schools", "settings"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0", cursor: "pointer", fontSize: "14px", fontWeight: "700", background: activeTab === tab ? "#f8fafc" : "transparent", color: activeTab === tab ? "#1e3a8a" : "rgba(255,255,255,0.8)", transition: "all 0.2s" }}>
                {tab === "upcoming" ? "📅 Deadlines" : tab === "schools" ? "🏫 My Schools" : "⚙️ Settings"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px" }}>
        {/* TAB: Upcoming Deadlines */}
        {activeTab === "upcoming" && (
          <div>
            {urgent.length > 0 && (
              <div style={{ background: "#fef2f2", border: "2px solid #fecaca", borderRadius: "12px", padding: "16px 20px", marginBottom: "24px" }}>
                <div style={{ fontWeight: "800", color: "#dc2626", fontSize: "16px", marginBottom: "10px" }}>🚨 Urgent Deadlines (within 7 days)</div>
                {urgent.map(({ college, deadline, days }) => (
                  <div key={college.id + deadline.type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #fee2e2" }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "#1e1e2e" }}>{college.name}</span>
                      <span style={{ marginLeft: "8px", fontSize: "12px", background: deadlineColor(deadline.type) + "22", color: deadlineColor(deadline.type), padding: "2px 8px", borderRadius: "6px", fontWeight: "700" }}>{deadline.type}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", color: "#dc2626", fontSize: "15px" }}>{days === 0 ? "TODAY" : `${days} day${days > 1 ? "s" : ""}`}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{formatDate(deadline.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e1e2e", margin: "0 0 16px" }}>All Upcoming Deadlines</h3>

            {upcoming.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
                <div style={{ fontSize: "16px", fontWeight: "600" }}>No upcoming deadlines</div>
                <div style={{ fontSize: "14px" }}>Add more schools or check the past deadlines below.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                {upcoming.map(({ college, deadline, days }) => {
                  const reminderIntervals = [30, 14, 7, 1].filter((i) => days >= i);
                  return (
                    <div key={college.id + deadline.type} style={{ background: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: urgencyColor(days) + "15", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: urgencyColor(days), lineHeight: 1 }}>{days === 0 ? "!" : days}</div>
                        <div style={{ fontSize: "9px", color: urgencyColor(days), fontWeight: "700" }}>{days === 0 ? "TODAY" : "DAYS"}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: "800", color: "#1e1e2e", fontSize: "15px" }}>{college.name}</span>
                          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", background: deadlineColor(deadline.type) + "22", color: deadlineColor(deadline.type), fontWeight: "700" }}>{deadlineLabel(deadline.type)}</span>
                        </div>
                        <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>{college.location} • Due: {formatDate(deadline.date)}</div>
                        {deadline.notes && <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}>{deadline.notes}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: "700", color: urgencyColor(days), marginBottom: "6px" }}>
                          {days === 0 ? "⚠️ Due Today!" : days === 1 ? "⚠️ Tomorrow!" : `${days} days left`}
                        </div>
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                          {reminderIntervals.map((interval) => (
                            <button key={interval} onClick={() => simulateReminder(college, deadline, interval)} title={`Simulate ${interval}-day reminder`} style={{ padding: "3px 8px", fontSize: "10px", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", background: "#f9fafb", color: "#374151", fontWeight: "600" }}>
                              {interval}d
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#9ca3af", margin: "0 0 12px", borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>Past Deadlines</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {past.slice().reverse().map(({ college, deadline, days }) => (
                    <div key={college.id + deadline.type} style={{ background: "#f9fafb", borderRadius: "10px", border: "1px solid #f3f4f6", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", opacity: 0.7 }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ fontSize: "16px" }}>✅</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: "700", color: "#374151", fontSize: "14px" }}>{college.name}</span>
                        <span style={{ marginLeft: "8px", fontSize: "11px", color: "#9ca3af" }}>{deadlineLabel(deadline.type)}</span>
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>Was due {formatDate(deadline.date)} • {Math.abs(days)} days ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: My Schools */}
        {activeTab === "schools" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e1e2e", margin: 0 }}>My Schools ({userState.selectedSchools.length})</h3>
              <button onClick={() => setShowAddSchool(!showAddSchool)} style={{ padding: "10px 20px", background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                + Add School
              </button>
            </div>

            {showAddSchool && (
              <div style={{ background: "#fff", borderRadius: "12px", border: "2px solid #7c3aed", padding: "20px", marginBottom: "20px" }}>
                <div style={{ fontWeight: "700", color: "#7c3aed", marginBottom: "12px" }}>Add a New School</div>
                <input value={searchAdd} onChange={(e) => setSearchAdd(e.target.value)} placeholder="Search schools to add..." style={{ width: "100%", padding: "10px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} />
                <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                  {untracked.slice(0, 20).map((college) => (
                    <div key={college.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", background: "#f9fafb", marginBottom: "6px" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "14px", color: "#1e1e2e" }}>{college.name}</div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>{college.location}</div>
                      </div>
                      <button onClick={() => addSchool(college.id)} style={{ padding: "6px 14px", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Add</button>
                    </div>
                  ))}
                  {untracked.length === 0 && <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>No schools found</div>}
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {userState.selectedSchools.map((id) => {
                const college = COLLEGES.find((c) => c.id === id);
                if (!college) return null;
                const schoolDeadlines = college.deadlines.map((dl) => ({ ...dl, days: daysUntil(dl.date) })).sort((a, b) => a.days - b.days);
                const nextDeadline = schoolDeadlines.find((d) => d.days >= 0);
                return (
                  <div key={id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "18px 20px", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "16px", color: "#1e1e2e" }}>{college.name}</div>
                        <div style={{ fontSize: "13px", color: "#6b7280" }}>{college.location} • {college.category}</div>
                        {nextDeadline && (
                          <div style={{ fontSize: "12px", marginTop: "4px", color: urgencyColor(nextDeadline.days), fontWeight: "600" }}>
                            Next: {deadlineLabel(nextDeadline.type)} — {nextDeadline.days === 0 ? "TODAY" : `${nextDeadline.days} days`}
                          </div>
                        )}
                      </div>
                      <button onClick={() => removeSchool(id)} style={{ padding: "6px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>Remove</button>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {schoolDeadlines.map((dl) => (
                        <div key={dl.type} style={{ padding: "6px 12px", borderRadius: "8px", background: dl.days < 0 ? "#f9fafb" : deadlineColor(dl.type) + "15", border: `1px solid ${dl.days < 0 ? "#e5e7eb" : deadlineColor(dl.type) + "44"}` }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: dl.days < 0 ? "#9ca3af" : deadlineColor(dl.type) }}>{dl.type}</div>
                          <div style={{ fontSize: "12px", color: dl.days < 0 ? "#9ca3af" : "#374151", fontWeight: "600" }}>{formatDate(dl.date)}</div>
                          <div style={{ fontSize: "11px", color: dl.days < 0 ? "#9ca3af" : urgencyColor(dl.days) }}>{dl.days < 0 ? "Passed" : dl.days === 0 ? "Today!" : `${dl.days}d`}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Settings */}
        {activeTab === "settings" && (
          <SettingsPanel userState={userState} onUpdateUser={onUpdateUser} showToast={showToast} reminderLogs={reminderLogs} />
        )}
      </div>
    </div>
  );
}

// ===================== SETTINGS PANEL =====================
function SettingsPanel({ userState, onUpdateUser, showToast, reminderLogs }: { userState: UserState; onUpdateUser: (u: Partial<UserState>) => void; showToast: (m: string) => void; reminderLogs: ReminderLog[] }) {
  const [email, setEmail] = useState(userState.reminderEmail);
  const [phone, setPhone] = useState(userState.reminderPhone);

  function handleSave() {
    onUpdateUser({ reminderEmail: email, reminderPhone: phone });
    showToast("Settings saved!");
  }

  return (
    <div>
      <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#1e1e2e", margin: "0 0 20px" }}>⚙️ Settings & Reminders</h3>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontWeight: "700", color: "#374151", fontSize: "15px", marginBottom: "18px" }}>🔔 Reminder Channels</div>
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>Email Address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "6px" }}>Phone Number (SMS)</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: "11px 14px", border: "2px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", boxSizing: "border-box" }} onFocus={(e) => (e.target.style.borderColor = "#7c3aed")} onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
        </div>
        <button onClick={handleSave} style={{ padding: "11px 24px", background: "linear-gradient(135deg, #1e3a8a, #7c3aed)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>Save Changes</button>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px", marginBottom: "20px" }}>
        <div style={{ fontWeight: "700", color: "#374151", fontSize: "15px", marginBottom: "14px" }}>📅 Reminder Schedule</div>
        {[
          { days: 30, title: "30-Day Reminder", desc: "Time to start brainstorming essays and gathering materials." },
          { days: 14, title: "14-Day Reminder", desc: "Two weeks out — finalize essays and get recommendations ready." },
          { days: 7, title: "7-Day Reminder", desc: "Final week — proofread everything and submit test scores." },
          { days: 1, title: "1-Day Reminder", desc: "Submit tomorrow! Double-check all materials are uploaded." },
        ].map((r) => (
          <div key={r.days} style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: urgencyColor(r.days) + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "800", color: urgencyColor(r.days), flexShrink: 0 }}>{r.days}d</div>
            <div>
              <div style={{ fontWeight: "700", color: "#374151", fontSize: "14px" }}>{r.title}</div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>{r.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {reminderLogs.length > 0 && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "24px" }}>
          <div style={{ fontWeight: "700", color: "#374151", fontSize: "15px", marginBottom: "14px" }}>📋 Reminder Log ({reminderLogs.length} sent)</div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {reminderLogs.slice().reverse().map((log, i) => {
              const college = COLLEGES.find((c) => c.id === log.collegeId);
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                  <span style={{ color: "#374151" }}><strong>{college?.name}</strong> — {log.deadlineType} ({log.intervalDays}-day alert)</span>
                  <span style={{ color: "#9ca3af", fontSize: "11px" }}>{new Date(log.sentAt).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", padding: "16px 20px", marginTop: "20px" }}>
        <div style={{ fontWeight: "700", color: "#dc2626", marginBottom: "6px" }}>⚠️ Reset Data</div>
        <div style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px" }}>This will clear all your tracked schools and return to onboarding.</div>
        <button onClick={() => { localStorage.removeItem("edutracker_user"); window.location.reload(); }} style={{ padding: "8px 16px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }}>Reset Everything</button>
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function Home() {
  const [view, setView] = useState<AppView>("auth");
  const [userState, setUserState] = useState<UserState>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Analytics
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});

    // Load from localStorage
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      try {
        const parsed: UserState = JSON.parse(stored);
        setUserState(parsed);
        if (parsed.email) {
          setView(parsed.onboardingComplete ? "dashboard" : "onboarding");
        }
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  function persistUser(state: UserState) {
    localStorage.setItem("edutracker_user", JSON.stringify(state));
  }

  function handleAuth(email: string) {
    const stored = localStorage.getItem("edutracker_user");
    let existing: UserState = DEFAULT_USER;
    if (stored) {
      try { existing = JSON.parse(stored); } catch { /* ignore */ }
    }
    const newState: UserState = { ...existing, email };
    setUserState(newState);
    persistUser(newState);
    setView(newState.onboardingComplete ? "dashboard" : "onboarding");
  }

  function handleOnboardingComplete(updates: Partial<UserState>) {
    const newState: UserState = { ...userState, ...updates };
    setUserState(newState);
    persistUser(newState);
    setView("dashboard");
  }

  const handleUpdateUser = useCallback((updates: Partial<UserState>) => {
    setUserState((prev) => {
      const newState: UserState = { ...prev, ...updates };
      persistUser(newState);
      return newState;
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1e3a8a, #7c3aed)" }}>
        <div style={{ color: "#fff", fontSize: "20px", fontWeight: "700" }}>🎓 Loading Edutracker...</div>
      </div>
    );
  }

  if (view === "auth") return <AuthPanel onAuth={handleAuth} />;
  if (view === "onboarding") return <OnboardingFlow userState={userState} onComplete={handleOnboardingComplete} />;
  return <Dashboard userState={userState} onUpdateUser={handleUpdateUser} />;
}