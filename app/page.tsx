"use client";

import { useEffect, useState, useCallback } from "react";

interface College {
  id: number;
  name: string;
  state: string;
  ea_deadline: string | null;
  ed_deadline: string | null;
  ed2_deadline: string | null;
  rd_deadline: string | null;
  rolling: boolean;
}

interface UserDeadline {
  id: number;
  college_id: number;
  college_name: string;
  deadline_type: string;
  deadline_date: string;
  reminder_30: boolean;
  reminder_14: boolean;
  reminder_7: boolean;
  reminder_1: boolean;
  notes: string;
}

type Step = "splash" | "onboarding-schools" | "onboarding-email" | "dashboard";

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CountdownBadge({ days }: { days: number }) {
  const color = urgencyColor(days);
  return (
    <span style={{
      background: color,
      color: "white",
      borderRadius: "999px",
      padding: "2px 10px",
      fontSize: "12px",
      fontWeight: 700,
      whiteSpace: "nowrap"
    }}>
      {days < 0 ? "Past" : days === 0 ? "TODAY" : `${days}d`}
    </span>
  );
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [step, setStep] = useState<Step>("splash");
  const [colleges, setColleges] = useState<College[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Record<number, string[]>>({});
  const [emailInput, setEmailInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [deadlines, setDeadlines] = useState<UserDeadline[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingSchool, setAddingSchool] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [editNotes, setEditNotes] = useState<Record<number, string>>({});
  const [showNoteFor, setShowNoteFor] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "school">("date");
  const [toast, setToast] = useState<string>("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      if (d.email) {
        setUserEmail(d.email);
        setEmailInput(d.email);
      }
    });
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    loadColleges();
  }, []);

  const loadColleges = async () => {
    const r = await fetch("/api/colleges");
    const d = await r.json();
    setColleges(d.colleges || []);
  };

  const loadDeadlines = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/deadlines");
    const d = await r.json();
    setDeadlines(d.deadlines || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userEmail) {
      loadDeadlines().then(() => setStep("dashboard"));
    }
  }, [userEmail, loadDeadlines]);

  const filtered = colleges.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCollege = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        const t = { ...selectedTypes };
        delete t[id];
        setSelectedTypes(t);
      } else {
        next.add(id);
        // default select all available deadline types
        const college = colleges.find(c => c.id === id);
        if (college) {
          const types: string[] = [];
          if (college.ea_deadline) types.push("EA");
          if (college.ed_deadline) types.push("ED");
          if (college.ed2_deadline) types.push("ED2");
          if (college.rd_deadline) types.push("RD");
          if (college.rolling) types.push("Rolling");
          setSelectedTypes(prev2 => ({ ...prev2, [id]: types }));
        }
      }
      return next;
    });
  };

  const toggleType = (collegeId: number, type: string) => {
    setSelectedTypes(prev => {
      const types = prev[collegeId] || [];
      const has = types.includes(type);
      return { ...prev, [collegeId]: has ? types.filter(t => t !== type) : [...types, type] };
    });
  };

  const handleEmailSignup = async () => {
    if (!emailInput.includes("@")) { setEmailError("Please enter a valid email."); return; }
    setEmailError("");
    setSaving(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "signup", email: emailInput, password: "edutracker_auto_" + emailInput })
    });
    const d = await r.json();
    if (d.ok || d.email) {
      setUserEmail(emailInput);
      await saveDeadlines(emailInput);
    } else {
      // try login
      const r2 = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "login", email: emailInput, password: "edutracker_auto_" + emailInput })
      });
      const d2 = await r2.json();
      if (d2.ok || d2.email) {
        setUserEmail(emailInput);
        await saveDeadlines(emailInput);
      } else {
        setEmailError("Could not create account. Try a different email.");
      }
    }
    setSaving(false);
  };

  const saveDeadlines = async (email: string) => {
    const entries: Array<{ college_id: number; deadline_type: string; deadline_date: string }> = [];
    selected.forEach(id => {
      const college = colleges.find(c => c.id === id);
      if (!college) return;
      const types = selectedTypes[id] || [];
      types.forEach(type => {
        let date = "";
        if (type === "EA" && college.ea_deadline) date = college.ea_deadline;
        else if (type === "ED" && college.ed_deadline) date = college.ed_deadline;
        else if (type === "ED2" && college.ed2_deadline) date = college.ed2_deadline;
        else if (type === "RD" && college.rd_deadline) date = college.rd_deadline;
        else if (type === "Rolling" && college.rolling) date = college.rd_deadline || "";
        if (date) entries.push({ college_id: id, deadline_type: type, deadline_date: date });
      });
    });
    if (entries.length > 0) {
      await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries })
      });
    }
    await loadDeadlines();
    setStep("dashboard");
    showToast("Schools saved! Reminders scheduled.");
  };

  const deleteDeadline = async (id: number) => {
    await fetch("/api/deadlines", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    setDeadlines(prev => prev.filter(d => d.id !== id));
    showToast("Removed.");
  };

  const saveNote = async (id: number) => {
    const note = editNotes[id] || "";
    await fetch("/api/deadlines", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, notes: note })
    });
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, notes: note } : d));
    setShowNoteFor(null);
    showToast("Note saved.");
  };

  const logout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setUserEmail("");
    setStep("splash");
    setDeadlines([]);
    setSelected(new Set());
    setSelectedTypes({});
  };

  const displayDeadlines = deadlines
    .filter(d => {
      const days = daysUntil(d.deadline_date);
      if (filter === "upcoming") return days >= 0;
      if (filter === "past") return days < 0;
      return true;
    })
    .filter(d =>
      d.college_name.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      d.deadline_type.toLowerCase().includes(dashboardSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
      return a.college_name.localeCompare(b.college_name);
    });

  const upcomingCount = deadlines.filter(d => daysUntil(d.deadline_date) >= 0).length;
  const urgentCount = deadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 14; }).length;

  // ─── SPLASH ───────────────────────────────────────────────────────────────
  if (step === "splash") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #1d4ed8 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Segoe UI', sans-serif" }}>
        {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1d4ed8", color: "white", padding: "10px 24px", borderRadius: "8px", zIndex: 9999, fontWeight: 600 }}>{toast}</div>}
        <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ width: 140, marginBottom: 24 }} />
        <h1 style={{ color: "white", fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 800, textAlign: "center", margin: "0 0 12px" }}>Never Miss a Deadline</h1>
        <p style={{ color: "#93c5fd", fontSize: "18px", textAlign: "center", maxWidth: 480, margin: "0 0 40px" }}>
          Track every college application deadline. Get email reminders at 30, 14, 7, and 1 day before each one.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: 48 }}>
          {["200+ Top Colleges", "Automated Reminders", "Personal Dashboard", "Free Forever"].map(f => (
            <div key={f} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "10px 18px", color: "white", fontSize: "14px", fontWeight: 600 }}>
              ✓ {f}
            </div>
          ))}
        </div>
        <button onClick={() => setStep("onboarding-schools")} style={{ background: "white", color: "#1d4ed8", border: "none", borderRadius: "12px", padding: "16px 48px", fontSize: "18px", fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          Get Started →
        </button>
        <p style={{ color: "#93c5fd", marginTop: 20, fontSize: "14px" }}>No credit card required</p>
      </div>
    );
  }

  // ─── ONBOARDING: SCHOOL SELECTION ─────────────────────────────────────────
  if (step === "onboarding-schools") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
        {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1d4ed8", color: "white", padding: "10px 24px", borderRadius: "8px", zIndex: 9999, fontWeight: 600 }}>{toast}</div>}
        {/* Header */}
        <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 36 }} />
            <span style={{ fontWeight: 800, fontSize: 20, color: "#1e3a8a" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 6, background: "#1d4ed8", borderRadius: 3 }} />
            <div style={{ width: 32, height: 6, background: "#e2e8f0", borderRadius: 3 }} />
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Select Your Target Schools</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 16 }}>
            Choose the colleges you&apos;re applying to. We&apos;ll track all their deadlines for you.
          </p>

          <input
            type="text"
            placeholder="Search 200+ colleges..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: "10px", fontSize: 16, boxSizing: "border-box", marginBottom: 16, outline: "none" }}
          />

          {selected.size > 0 && (
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", marginBottom: 16, fontSize: 14, color: "#1d4ed8", fontWeight: 600 }}>
              {selected.size} school{selected.size > 1 ? "s" : ""} selected
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "55vh", overflowY: "auto" }}>
            {filtered.map(college => {
              const isSelected = selected.has(college.id);
              const types = selectedTypes[college.id] || [];
              return (
                <div
                  key={college.id}
                  style={{
                    background: isSelected ? "#eff6ff" : "white",
                    border: `2px solid ${isSelected ? "#1d4ed8" : "#e2e8f0"}`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} onClick={() => toggleCollege(college.id)}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>{college.name}</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>{college.state}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {college.ea_deadline && <span style={{ background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>EA</span>}
                        {college.ed_deadline && <span style={{ background: "#ede9fe", color: "#7c3aed", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>ED</span>}
                        {college.ed2_deadline && <span style={{ background: "#fce7f3", color: "#be185d", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>ED2</span>}
                        {college.rd_deadline && <span style={{ background: "#dcfce7", color: "#15803d", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>RD</span>}
                        {college.rolling && <span style={{ background: "#fef3c7", color: "#b45309", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontWeight: 700 }}>Rolling</span>}
                      </div>
                      <div style={{
                        width: 24, height: 24, borderRadius: "50%", border: `2px solid ${isSelected ? "#1d4ed8" : "#cbd5e1"}`,
                        background: isSelected ? "#1d4ed8" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                      }}>
                        {isSelected && <span style={{ color: "white", fontSize: 14, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #bfdbfe" }}>
                      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>Select deadline types to track:</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {college.ea_deadline && (
                          <button onClick={e => { e.stopPropagation(); toggleType(college.id, "EA"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${types.includes("EA") ? "#1d4ed8" : "#e2e8f0"}`, background: types.includes("EA") ? "#dbeafe" : "white", color: types.includes("EA") ? "#1d4ed8" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            EA · {formatDate(college.ea_deadline)}
                          </button>
                        )}
                        {college.ed_deadline && (
                          <button onClick={e => { e.stopPropagation(); toggleType(college.id, "ED"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${types.includes("ED") ? "#7c3aed" : "#e2e8f0"}`, background: types.includes("ED") ? "#ede9fe" : "white", color: types.includes("ED") ? "#7c3aed" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            ED · {formatDate(college.ed_deadline)}
                          </button>
                        )}
                        {college.ed2_deadline && (
                          <button onClick={e => { e.stopPropagation(); toggleType(college.id, "ED2"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${types.includes("ED2") ? "#be185d" : "#e2e8f0"}`, background: types.includes("ED2") ? "#fce7f3" : "white", color: types.includes("ED2") ? "#be185d" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            ED2 · {formatDate(college.ed2_deadline)}
                          </button>
                        )}
                        {college.rd_deadline && (
                          <button onClick={e => { e.stopPropagation(); toggleType(college.id, "RD"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${types.includes("RD") ? "#15803d" : "#e2e8f0"}`, background: types.includes("RD") ? "#dcfce7" : "white", color: types.includes("RD") ? "#15803d" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            RD · {formatDate(college.rd_deadline)}
                          </button>
                        )}
                        {college.rolling && (
                          <button onClick={e => { e.stopPropagation(); toggleType(college.id, "Rolling"); }}
                            style={{ padding: "4px 12px", borderRadius: 6, border: `2px solid ${types.includes("Rolling") ? "#b45309" : "#e2e8f0"}`, background: types.includes("Rolling") ? "#fef3c7" : "white", color: types.includes("Rolling") ? "#b45309" : "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            Rolling
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => { if (selected.size === 0) { showToast("Select at least one school."); return; } setStep("onboarding-email"); }}
            style={{ width: "100%", marginTop: 24, background: "#1d4ed8", color: "white", border: "none", borderRadius: "12px", padding: "16px", fontSize: 17, fontWeight: 800, cursor: "pointer" }}
          >
            Continue with {selected.size} school{selected.size !== 1 ? "s" : ""} →
          </button>
        </div>
      </div>
    );
  }

  // ─── ONBOARDING: EMAIL ────────────────────────────────────────────────────
  if (step === "onboarding-email") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>
        {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1d4ed8", color: "white", padding: "10px 24px", borderRadius: "8px", zIndex: 9999, fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 36 }} />
            <span style={{ fontWeight: 800, fontSize: 20, color: "#1e3a8a" }}>Edutracker</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 6, background: "#1d4ed8", borderRadius: 3 }} />
            <div style={{ width: 32, height: 6, background: "#1d4ed8", borderRadius: 3 }} />
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "48px 24px", flex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Set Up Your Reminders</h2>
            <p style={{ color: "#64748b", fontSize: 16 }}>We&apos;ll send you email reminders 30, 14, 7, and 1 day before each deadline.</p>
          </div>

          <div style={{ background: "white", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
            <label style={{ display: "block", fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Email Address</label>
            <input
              type="email"
              placeholder="you@email.com"
              value={emailInput}
              onChange={e => { setEmailInput(e.target.value); setEmailError(""); }}
              onKeyDown={e => { if (e.key === "Enter") handleEmailSignup(); }}
              style={{ width: "100%", padding: "14px 16px", border: `2px solid ${emailError ? "#ef4444" : "#e2e8f0"}`, borderRadius: "10px", fontSize: 16, boxSizing: "border-box", outline: "none", marginBottom: 4 }}
            />
            {emailError && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>{emailError}</div>}

            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "12px 14px", marginTop: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: "#0369a1", fontWeight: 600, marginBottom: 6 }}>📅 You&apos;ll be reminded before each deadline:</div>
              {["30 days before", "14 days before", "7 days before", "1 day before"].map(t => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#0369a1", marginBottom: 2 }}>
                  <span>✓</span><span>{t}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Your selected schools:</div>
              <div style={{ maxHeight: 120, overflowY: "auto" }}>
                {Array.from(selected).map(id => {
                  const c = colleges.find(col => col.id === id);
                  return c ? (
                    <div key={id} style={{ fontSize: 13, color: "#64748b", marginBottom: 2 }}>
                      • {c.name} ({(selectedTypes[id] || []).join(", ")})
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <button
              onClick={handleEmailSignup}
              disabled={saving}
              style={{ width: "100%", background: saving ? "#93c5fd" : "#1d4ed8", color: "white", border: "none", borderRadius: "12px", padding: "16px", fontSize: 17, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Setting up..." : "Start Tracking →"}
            </button>

            <button onClick={() => setStep("onboarding-schools")} style={{ width: "100%", background: "transparent", color: "#64748b", border: "none", marginTop: 12, fontSize: 14, cursor: "pointer" }}>
              ← Back to school selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DASHBOARD ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', sans-serif" }}>
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1d4ed8", color: "white", padding: "10px 24px", borderRadius: "8px", zIndex: 9999, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>{toast}</div>}

      {/* Nav */}
      <div style={{ background: "#1e3a8a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={{ height: 36 }} />
          <span style={{ fontWeight: 800, fontSize: 20, color: "white" }}>Edutracker</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#93c5fd", fontSize: 13, display: "none" }} className="email-label">{userEmail}</span>
          <button
            onClick={() => { setAddingSchool(true); setSearch(""); setSelected(new Set()); setSelectedTypes({}); setStep("onboarding-schools"); }}
            style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            + Add Schools
          </button>
          <button onClick={logout} style={{ background: "transparent", color: "#93c5fd", border: "1px solid #3b82f6", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Deadlines", value: deadlines.length, icon: "📋", color: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
            { label: "Upcoming", value: upcomingCount, icon: "📅", color: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
            { label: "Urgent (≤14d)", value: urgentCount, icon: "🔥", color: urgentCount > 0 ? "#fef2f2" : "#f8fafc", border: urgentCount > 0 ? "#fecaca" : "#e2e8f0", text: urgentCount > 0 ? "#dc2626" : "#64748b" },
            { label: "Schools", value: new Set(deadlines.map(d => d.college_id)).size, icon: "🎓", color: "#faf5ff", border: "#e9d5ff", text: "#7c3aed" },
          ].map(s => (
            <div key={s.label} style={{ background: s.color, border: `1px solid ${s.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.text }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Urgent banner */}
        {urgentCount > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#dc2626", fontSize: 15 }}>{urgentCount} deadline{urgentCount > 1 ? "s" : ""} in the next 14 days!</div>
              <div style={{ color: "#ef4444", fontSize: 13 }}>Check below and make sure your applications are ready.</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search deadlines..."
            value={dashboardSearch}
            onChange={e => setDashboardSearch(e.target.value)}
            style={{ flex: 1, minWidth: 180, padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none" }}
          />
          <select value={filter} onChange={e => setFilter(e.target.value as "all" | "upcoming" | "past")}
            style={{ padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "white", cursor: "pointer" }}>
            <option value="upcoming">Upcoming</option>
            <option value="all">All</option>
            <option value="past">Past</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "school")}
            style={{ padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "white", cursor: "pointer" }}>
            <option value="date">Sort by Date</option>
            <option value="school">Sort by School</option>
          </select>
        </div>

        {/* Email reminder info */}
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#1d4ed8", display: "flex", gap: 8, alignItems: "center" }}>
          <span>📧</span>
          <span>Reminders will be sent to <strong>{userEmail}</strong> at 30, 14, 7, and 1 day before each deadline.</span>
        </div>

        {/* Deadline list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Loading your deadlines...</div>
          </div>
        ) : displayDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>No deadlines found</div>
            <div style={{ color: "#64748b", marginBottom: 24 }}>
              {filter === "past" ? "No past deadlines." : "Add schools to start tracking!"}
            </div>
            <button onClick={() => { setSelected(new Set()); setSelectedTypes({}); setSearch(""); setStep("onboarding-schools"); }}
              style={{ background: "#1d4ed8", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              + Add Schools
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {displayDeadlines.map(dl => {
              const days = daysUntil(dl.deadline_date);
              const isPast = days < 0;
              return (
                <div key={dl.id} style={{
                  background: "white",
                  border: `1px solid ${isPast ? "#e2e8f0" : days <= 7 ? "#fecaca" : days <= 14 ? "#fed7aa" : "#e2e8f0"}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  opacity: isPast ? 0.7 : 1,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>{dl.college_name}</span>
                        <span style={{
                          background: dl.deadline_type === "ED" ? "#ede9fe" : dl.deadline_type === "EA" ? "#dbeafe" : dl.deadline_type === "ED2" ? "#fce7f3" : dl.deadline_type === "Rolling" ? "#fef3c7" : "#dcfce7",
                          color: dl.deadline_type === "ED" ? "#7c3aed" : dl.deadline_type === "EA" ? "#1d4ed8" : dl.deadline_type === "ED2" ? "#be185d" : dl.deadline_type === "Rolling" ? "#b45309" : "#15803d",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 12,
                          fontWeight: 700
                        }}>{dl.deadline_type}</span>
                        <CountdownBadge days={days} />
                      </div>
                      <div style={{ color: "#64748b", fontSize: 14, display: "flex", alignItems: "center", gap: 12 }}>
                        <span>📅 {formatDate(dl.deadline_date)}</span>
                        {!isPast && <span style={{ color: urgencyColor(days), fontWeight: 600 }}>
                          {days === 0 ? "Due today!" : `${days} days remaining`}
                        </span>}
                        {isPast && <span style={{ color: "#9ca3af" }}>Passed</span>}
                      </div>
                      {dl.notes && showNoteFor !== dl.id && (
                        <div style={{ marginTop: 8, fontSize: 13, color: "#64748b", background: "#f8fafc", borderRadius: 6, padding: "6px 10px", borderLeft: "3px solid #1d4ed8" }}>
                          📝 {dl.notes}
                        </div>
                      )}
                      {showNoteFor === dl.id && (
                        <div style={{ marginTop: 10 }}>
                          <textarea
                            value={editNotes[dl.id] !== undefined ? editNotes[dl.id] : dl.notes}
                            onChange={e => setEditNotes(prev => ({ ...prev, [dl.id]: e.target.value }))}
                            placeholder="Add a note (e.g., test scores, essay status...)"
                            rows={2}
                            style={{ width: "100%", padding: "8px 12px", border: "2px solid #bfdbfe", borderRadius: 8, fontSize: 13, boxSizing: "border-box", resize: "vertical", outline: "none" }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button onClick={() => saveNote(dl.id)} style={{ background: "#1d4ed8", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
                            <button onClick={() => setShowNoteFor(null)} style={{ background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer" }}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                      <button
                        onClick={() => { setShowNoteFor(showNoteFor === dl.id ? null : dl.id); setEditNotes(prev => ({ ...prev, [dl.id]: dl.notes })); }}
                        style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                        📝 Note
                      </button>
                      <button
                        onClick={() => { if (confirm("Remove this deadline?")) deleteDeadline(dl.id); }}
                        style={{ background: "#fff1f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Reminder timeline */}
                  {!isPast && (
                    <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { label: "30d reminder", active: dl.reminder_30 },
                        { label: "14d reminder", active: dl.reminder_14 },
                        { label: "7d reminder", active: dl.reminder_7 },
                        { label: "1d reminder", active: dl.reminder_1 },
                      ].map(r => (
                        <span key={r.label} style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: r.active ? "#eff6ff" : "#f1f5f9",
                          color: r.active ? "#1d4ed8" : "#94a3b8",
                          border: `1px solid ${r.active ? "#bfdbfe" : "#e2e8f0"}`,
                          fontWeight: 600
                        }}>
                          {r.active ? "✓" : "·"} {r.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 32, textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
          Edutracker © 2025 · Helping students never miss a deadline
        </div>
      </div>
    </div>
  );
}