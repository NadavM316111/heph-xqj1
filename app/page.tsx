"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { COLLEGES } from "@/lib/colleges";
import { getUrgency, getDeadlineTypeBadge } from "@/lib/urgency";
import type { College, Deadline, DeadlineType } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "auth" | "onboarding" | "dashboard" | "add-deadline" | "manage";
type AuthMode = "login" | "signup";

interface AuthState {
  email: string;
  loggedIn: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function apiPost(body: Record<string, unknown>) {
  const r = await fetch("/api/deadlines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, color: "#fff", fontWeight: 700, flexShrink: 0,
      }}>E</div>
      <span style={{ fontWeight: 800, fontSize: 20, color: "#1e293b", letterSpacing: "-0.5px" }}>
        Edu<span style={{ color: "#6366f1" }}>tracker</span>
      </span>
    </div>
  );
}

function CollegeSearch({
  value,
  onChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (name: string, location: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 2
    ? COLLEGES.filter(c =>
        c.name.toLowerCase().includes(value.toLowerCase()) ||
        c.location.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search colleges…"}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 10,
          border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
          background: "#fff",
          transition: "border-color 0.15s",
        }}
        onMouseOver={e => (e.currentTarget.style.borderColor = "#6366f1")}
        onMouseOut={e => (e.currentTarget.style.borderColor = "#e2e8f0")}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
          zIndex: 100, maxHeight: 280, overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
        }}>
          {filtered.map(c => (
            <button
              key={c.name}
              type="button"
              onClick={() => { onSelect(c.name, c.location); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
                transition: "background 0.1s",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseOut={e => (e.currentTarget.style.background = "none")}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{c.location} · {c.type}</div>
            </button>
          ))}
          {value.length >= 2 && (
            <button
              type="button"
              onClick={() => { onSelect(value, ""); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 14px",
                background: "none", border: "none", cursor: "pointer",
                color: "#6366f1", fontSize: 14, fontWeight: 600,
              }}
              onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
              onMouseOut={e => (e.currentTarget.style.background = "none")}
            >
              + Add "{value}" manually
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [auth, setAuth] = useState<AuthState>({ email: "", loggedIn: false });
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>("auth");
  const [colleges, setColleges] = useState<College[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Onboarding
  const [onboardStep, setOnboardStep] = useState(0);
  const [onboardColleges, setOnboardColleges] = useState<Array<{ name: string; location: string }>>([]);
  const [onboardSearch, setOnboardSearch] = useState("");
  const [onboardLoading, setOnboardLoading] = useState(false);

  // Add deadline modal
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [dlCollege, setDlCollege] = useState<College | null>(null);
  const [dlType, setDlType] = useState<DeadlineType>("RD");
  const [dlDate, setDlDate] = useState("");
  const [dlNotes, setDlNotes] = useState("");
  const [dlError, setDlError] = useState("");

  // Add college modal (from dashboard)
  const [showAddCollege, setShowAddCollege] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addCollegeName, setAddCollegeName] = useState("");
  const [addCollegeLocation, setAddCollegeLocation] = useState("");

  // Manage tab
  const [manageTab, setManageTab] = useState<"list" | "colleges">("list");

  // Filter
  const [filterType, setFilterType] = useState<"all" | DeadlineType>("all");
  const [showPast, setShowPast] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});

    const saved = lsGet<{ email: string } | null>("et_auth", null);
    if (saved?.email) {
      setAuth({ email: saved.email, loggedIn: true });
      loadData(saved.email);
    }
  }, []);

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async (email: string) => {
    // Load from localStorage first (fast)
    const lsColleges = lsGet<College[]>(`et_colleges_${email}`, []);
    const lsDeadlines = lsGet<Deadline[]>(`et_deadlines_${email}`, []);
    if (lsColleges.length > 0 || lsDeadlines.length > 0) {
      setColleges(lsColleges);
      setDeadlines(lsDeadlines);
      setDataLoaded(true);
      setView(lsColleges.length === 0 ? "onboarding" : "dashboard");
    }

    // Then sync with DB
    try {
      const r = await fetch(`/api/deadlines?email=${encodeURIComponent(email)}`);
      const data = await r.json();
      if (data.colleges && data.deadlines) {
        const dbColleges: College[] = data.colleges.map((c: Record<string, unknown>) => ({
          id: String(c.id),
          name: String(c.college_name),
          location: String(c.location ?? ""),
        }));
        const dbDeadlines: Deadline[] = data.deadlines.map((d: Record<string, unknown>) => ({
          id: String(d.id),
          collegeId: String(d.college_id),
          collegeName: String(d.college_name),
          collegeLocation: dbColleges.find(c => c.id === String(d.college_id))?.location ?? "",
          type: d.deadline_type as DeadlineType,
          date: typeof d.deadline_date === "string" ? d.deadline_date.slice(0, 10) : "",
          notes: String(d.notes ?? ""),
        }));
        setColleges(dbColleges);
        setDeadlines(dbDeadlines);
        lsSet(`et_colleges_${email}`, dbColleges);
        lsSet(`et_deadlines_${email}`, dbDeadlines);
        setDataLoaded(true);
        setView(dbColleges.length === 0 ? "onboarding" : "dashboard");
      }
    } catch {
      setDataLoaded(true);
      if (lsColleges.length === 0) setView("onboarding");
    }
  }, []);

  function persistColleges(email: string, c: College[]) {
    setColleges(c);
    lsSet(`et_colleges_${email}`, c);
  }
  function persistDeadlines(email: string, d: Deadline[]) {
    setDeadlines(d);
    lsSet(`et_deadlines_${email}`, d);
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await r.json();
      if (data.ok) {
        const email = data.email as string;
        setAuth({ email, loggedIn: true });
        lsSet("et_auth", { email });
        await loadData(email);
      } else {
        setAuthError(data.error ?? "Something went wrong");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  function handleLogout() {
    lsSet("et_auth", null);
    setAuth({ email: "", loggedIn: false });
    setColleges([]);
    setDeadlines([]);
    setView("auth");
    setDataLoaded(false);
  }

  // ── Onboarding ────────────────────────────────────────────────────────────

  function selectOnboardCollege(name: string, location: string) {
    if (onboardColleges.some(c => c.name === name)) return;
    setOnboardColleges(prev => [...prev, { name, location }]);
    setOnboardSearch("");
  }

  function removeOnboardCollege(name: string) {
    setOnboardColleges(prev => prev.filter(c => c.name !== name));
  }

  async function finishOnboarding() {
    if (onboardColleges.length === 0) {
      setView("dashboard");
      return;
    }
    setOnboardLoading(true);
    const newColleges: College[] = [];
    for (const oc of onboardColleges) {
      try {
        const data = await apiPost({
          action: "add_college",
          email: auth.email,
          name: oc.name,
          location: oc.location,
        });
        if (data.college) {
          newColleges.push({
            id: String(data.college.id),
            name: oc.name,
            location: oc.location,
          });
        }
      } catch {
        // localStorage fallback
        newColleges.push({
          id: `local_${Date.now()}_${Math.random()}`,
          name: oc.name,
          location: oc.location,
        });
      }
    }
    persistColleges(auth.email, newColleges);
    setOnboardLoading(false);
    setView("dashboard");
  }

  // ── Add College (dashboard) ───────────────────────────────────────────────

  async function handleAddCollege() {
    const name = addCollegeName.trim() || addSearch.trim();
    if (!name) return;
    const location = addCollegeLocation.trim();
    try {
      const data = await apiPost({ action: "add_college", email: auth.email, name, location });
      if (data.college) {
        const c: College = {
          id: String(data.college.id),
          name: String(data.college.college_name ?? name),
          location: String(data.college.location ?? location),
        };
        persistColleges(auth.email, [...colleges, c]);
      }
    } catch {
      const c: College = {
        id: `local_${Date.now()}`,
        name,
        location,
      };
      persistColleges(auth.email, [...colleges, c]);
    }
    setShowAddCollege(false);
    setAddSearch("");
    setAddCollegeName("");
    setAddCollegeLocation("");
  }

  // ── Add Deadline ──────────────────────────────────────────────────────────

  function openAddDeadline(college?: College) {
    setDlCollege(college ?? null);
    setDlType("RD");
    setDlDate("");
    setDlNotes("");
    setDlError("");
    setShowAddDeadline(true);
  }

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    if (!dlCollege) { setDlError("Select a college"); return; }
    if (!dlDate) { setDlError("Pick a date"); return; }
    setDlError("");
    try {
      const data = await apiPost({
        action: "add_deadline",
        email: auth.email,
        collegeId: dlCollege.id,
        collegeName: dlCollege.name,
        collegeLocation: dlCollege.location,
        type: dlType,
        date: dlDate,
        notes: dlNotes,
      });
      if (data.deadline) {
        const dl: Deadline = {
          id: String(data.deadline.id),
          collegeId: String(data.deadline.college_id),
          collegeName: dlCollege.name,
          collegeLocation: dlCollege.location,
          type: dlType,
          date: dlDate,
          notes: dlNotes,
        };
        persistDeadlines(auth.email, [...deadlines, dl]);
      }
    } catch {
      const dl: Deadline = {
        id: `local_${Date.now()}`,
        collegeId: dlCollege.id,
        collegeName: dlCollege.name,
        collegeLocation: dlCollege.location,
        type: dlType,
        date: dlDate,
        notes: dlNotes,
      };
      persistDeadlines(auth.email, [...deadlines, dl]);
    }
    setShowAddDeadline(false);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDeleteDeadline(id: string) {
    try {
      await apiPost({ action: "delete_deadline", email: auth.email, deadlineId: id });
    } catch {
      // local only
    }
    persistDeadlines(auth.email, deadlines.filter(d => d.id !== id));
  }

  async function handleDeleteCollege(id: string) {
    try {
      await apiPost({ action: "delete_college", email: auth.email, collegeId: id });
    } catch {
      // local only
    }
    persistColleges(auth.email, colleges.filter(c => c.id !== id));
    persistDeadlines(auth.email, deadlines.filter(d => d.collegeId !== id));
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const sortedDeadlines = [...deadlines]
    .filter(d => {
      const u = getUrgency(d.date);
      if (!showPast && u.daysRemaining < 0) return false;
      if (filterType !== "all" && d.type !== filterType) return false;
      return true;
    })
    .sort((a, b) => {
      const ua = getUrgency(a.date).daysRemaining;
      const ub = getUrgency(b.date).daysRemaining;
      return ua - ub;
    });

  const upcomingCount = deadlines.filter(d => {
    const u = getUrgency(d.date);
    return u.daysRemaining >= 0 && u.daysRemaining <= 30;
  }).length;

  const urgentCount = deadlines.filter(d => {
    const u = getUrgency(d.date);
    return u.daysRemaining >= 0 && u.daysRemaining <= 7;
  }).length;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  // ── Auth Screen ───────────────────────────────────────────────────────────

  if (!auth.loggedIn || view === "auth") {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #f0fdf4 100%)",
        padding: 16,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 36px",
          width: "100%", maxWidth: 420,
          boxShadow: "0 20px 60px rgba(99,102,241,0.12)",
        }} className="fade-in">
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <Logo />
            <p style={{ marginTop: 10, color: "#64748b", fontSize: 15 }}>
              Never miss a college application deadline
            </p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {(["login", "signup"] as AuthMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setAuthMode(m); setAuthError(""); }}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                  fontWeight: 600, fontSize: 14, transition: "all 0.2s",
                  background: authMode === m ? "#fff" : "transparent",
                  color: authMode === m ? "#6366f1" : "#64748b",
                  boxShadow: authMode === m ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "11px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
                }}
              />
            </div>

            {authError && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10,
                padding: "10px 14px", fontSize: 14, color: "#dc2626", marginBottom: 16,
              }}>
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%", padding: "13px", borderRadius: 12, border: "none",
                background: authLoading ? "#a5b4fc" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 16, cursor: authLoading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                transition: "all 0.2s",
              }}
            >
              {authLoading ? "Loading…" : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
            {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
              style={{ background: "none", border: "none", color: "#6366f1", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              {authMode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Onboarding ────────────────────────────────────────────────────────────

  if (view === "onboarding") {
    const steps = ["Welcome", "Add Colleges", "You're set!"];
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #f0fdf4 100%)",
        padding: 16,
      }}>
        <div style={{
          background: "#fff", borderRadius: 20, padding: "40px 36px",
          width: "100%", maxWidth: 500,
          boxShadow: "0 20px 60px rgba(99,102,241,0.12)",
        }} className="fade-in">
          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 32, gap: 8 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : undefined }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  background: i <= onboardStep ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  color: i <= onboardStep ? "#fff" : "#94a3b8",
                }}>
                  {i < onboardStep ? "✓" : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: "0 6px",
                    background: i < onboardStep ? "#6366f1" : "#e2e8f0",
                    borderRadius: 1,
                  }} />
                )}
              </div>
            ))}
          </div>

          {onboardStep === 0 && (
            <div className="fade-in">
              <div style={{ fontSize: 40, marginBottom: 16 }}>🎓</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>
                Welcome to Edutracker!
              </h2>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
                You're signed in as <strong>{auth.email}</strong>.<br />
                Let's set up your college list in 2 quick steps so you never miss a deadline.
              </p>
              <button
                onClick={() => setOnboardStep(1)}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 16,
                  boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                }}
              >
                Get Started →
              </button>
            </div>
          )}

          {onboardStep === 1 && (
            <div className="fade-in">
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                Add your colleges
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
                Search for up to 3 colleges you're applying to. You can add more later.
              </p>

              <CollegeSearch
                value={onboardSearch}
                onChange={setOnboardSearch}
                onSelect={selectOnboardCollege}
                placeholder="Search college name or city…"
              />

              {onboardColleges.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  {onboardColleges.map(c => (
                    <div key={c.name} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 10, background: "#f8fafc",
                      border: "1.5px solid #e2e8f0", marginBottom: 8,
                    }} className="slide-in">
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{c.name}</div>
                        {c.location && <div style={{ fontSize: 12, color: "#64748b" }}>{c.location}</div>}
                      </div>
                      <button
                        onClick={() => removeOnboardCollege(c.name)}
                        style={{
                          background: "none", border: "none", color: "#ef4444",
                          fontSize: 18, lineHeight: 1, padding: "0 4px",
                        }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  onClick={() => setOnboardStep(0)}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12,
                    border: "1.5px solid #e2e8f0", background: "#fff",
                    color: "#374151", fontWeight: 600, fontSize: 15,
                  }}
                >← Back</button>
                <button
                  onClick={async () => { setOnboardStep(2); await finishOnboarding(); }}
                  disabled={onboardLoading}
                  style={{
                    flex: 2, padding: "12px", borderRadius: 12, border: "none",
                    background: onboardColleges.length === 0
                      ? "#e2e8f0"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: onboardColleges.length === 0 ? "#94a3b8" : "#fff",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: onboardColleges.length > 0 ? "0 4px 14px rgba(99,102,241,0.35)" : "none",
                  }}
                >
                  {onboardLoading ? "Saving…" : onboardColleges.length === 0 ? "Skip for now →" : `Add ${onboardColleges.length} college${onboardColleges.length !== 1 ? "s" : ""} →`}
                </button>
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div className="fade-in" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>
                You're all set!
              </h2>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, marginBottom: 28 }}>
                {onboardColleges.length > 0
                  ? `Added ${onboardColleges.length} college${onboardColleges.length !== 1 ? "s" : ""} to your list. Now go add your deadlines!`
                  : "Your account is ready. Go add your colleges and deadlines!"}
              </p>
              {onboardLoading && (
                <p style={{ color: "#6366f1", fontSize: 14, marginBottom: 16, animation: "pulse 1.5s infinite" }}>
                  Saving your colleges…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <header style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "0 24px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 50,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <Logo />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#64748b", display: "none" }}
            className="email-label">
            {auth.email}
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14,
          }}>
            {auth.email.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "1.5px solid #e2e8f0", background: "#fff",
              color: "#64748b", fontSize: 13, fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px" }}>
        {/* Stats bar */}
        {dataLoaded && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16, marginBottom: 28,
          }} className="fade-in">
            {[
              { label: "Colleges", value: colleges.length, icon: "🏫", color: "#6366f1" },
              { label: "Upcoming (30d)", value: upcomingCount, icon: "📅", color: "#d97706" },
              { label: "Urgent (7d)", value: urgentCount, icon: "🔥", color: "#dc2626" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#fff", borderRadius: 14, padding: "18px 20px",
                border: "1.5px solid #e2e8f0",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${stat.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap",
          gap: 10, marginBottom: 24,
          justifyContent: "space-between",
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>
            Upcoming Deadlines
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowAddCollege(true)}
              style={{
                padding: "9px 16px", borderRadius: 10,
                border: "1.5px solid #6366f1", background: "#fff",
                color: "#6366f1", fontSize: 14, fontWeight: 600,
              }}
            >
              + Add College
            </button>
            <button
              onClick={() => openAddDeadline()}
              style={{
                padding: "9px 16px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontSize: 14, fontWeight: 700,
                boxShadow: "0 3px 10px rgba(99,102,241,0.3)",
              }}
            >
              + Add Deadline
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center",
        }}>
          {(["all", "EA", "ED", "RD", "Scholarship"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: "1.5px solid",
                borderColor: filterType === t ? "#6366f1" : "#e2e8f0",
                background: filterType === t ? "#6366f1" : "#fff",
                color: filterType === t ? "#fff" : "#64748b",
                transition: "all 0.15s",
              }}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
          <button
            onClick={() => setShowPast(!showPast)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: "1.5px solid",
              borderColor: showPast ? "#6366f1" : "#e2e8f0",
              background: showPast ? "#ede9fe" : "#fff",
              color: showPast ? "#6366f1" : "#64748b",
              marginLeft: "auto",
            }}
          >
            {showPast ? "✓ Show Past" : "Show Past"}
          </button>
        </div>

        {/* Deadline list */}
        {!dataLoaded ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>Loading your deadlines…</p>
          </div>
        ) : sortedDeadlines.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 24px",
            background: "#fff", borderRadius: 16, border: "1.5px dashed #e2e8f0",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
              {colleges.length === 0 ? "No colleges added yet" : "No deadlines yet"}
            </h3>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
              {colleges.length === 0
                ? "Start by adding the colleges you're applying to."
                : "Add your application deadlines to start tracking them."}
            </p>
            <button
              onClick={() => colleges.length === 0 ? setShowAddCollege(true) : openAddDeadline()}
              style={{
                padding: "11px 24px", borderRadius: 12, border: "none",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 15,
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              }}
            >
              {colleges.length === 0 ? "+ Add College" : "+ Add Deadline"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sortedDeadlines.map((dl, i) => {
              const urgency = getUrgency(dl.date);
              const badge = getDeadlineTypeBadge(dl.type);
              const isPast = urgency.daysRemaining < 0;
              return (
                <div
                  key={dl.id}
                  className="fade-in"
                  style={{
                    background: isPast ? "#fafafa" : urgency.bgColor,
                    border: `1.5px solid ${isPast ? "#e5e7eb" : urgency.borderColor}`,
                    borderRadius: 14,
                    padding: "16px 20px",
                    display: "flex", alignItems: "center", gap: 16,
                    opacity: isPast ? 0.65 : 1,
                    animationDelay: `${i * 0.04}s`,
                    transition: "box-shadow 0.2s",
                  }}
                  onMouseOver={e => !isPast && ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                  onMouseOut={e => ((e.currentTarget as HTMLElement).style.boxShadow = "none")}
                >
                  {/* Urgency badge */}
                  <div style={{
                    flexShrink: 0, width: 56, height: 56, borderRadius: 12,
                    background: isPast ? "#f3f4f6" : urgency.color,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    color: isPast ? "#9ca3af" : "#fff",
                    fontWeight: 800,
                  }}>
                    <span style={{ fontSize: isPast ? 11 : urgency.daysRemaining === 0 ? 9 : 15, lineHeight: 1.1 }}>
                      {isPast ? "PAST" : urgency.daysRemaining === 0 ? "TODAY" : urgency.label}
                    </span>
                    {urgency.daysRemaining > 0 && !isPast && (
                      <span style={{ fontSize: 9, opacity: 0.85 }}>days</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                        {dl.collegeName}
                      </span>
                      <span style={{
                        padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: badge.bg, color: badge.color,
                      }}>
                        {dl.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {dl.collegeLocation && <span>{dl.collegeLocation} · </span>}
                      <span>{new Date(dl.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                    {dl.notes && (
                      <div style={{ fontSize: 12, color: "#6366f1", marginTop: 4, fontStyle: "italic" }}>
                        {dl.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => { openAddDeadline(colleges.find(c => c.id === dl.collegeId)); }}
                      title="Add another deadline for this college"
                      style={{
                        padding: "6px 10px", borderRadius: 8,
                        border: "1.5px solid #e2e8f0", background: "#fff",
                        color: "#6366f1", fontSize: 13, fontWeight: 600,
                      }}
                    >+</button>
                    <button
                      onClick={() => handleDeleteDeadline(dl.id)}
                      title="Remove deadline"
                      style={{
                        padding: "6px 10px", borderRadius: 8,
                        border: "1.5px solid #fca5a5", background: "#fff",
                        color: "#ef4444", fontSize: 13,
                      }}
                    >×</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* College management section */}
        {colleges.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>My Colleges</h2>
              <button
                onClick={() => setShowAddCollege(true)}
                style={{
                  padding: "7px 14px", borderRadius: 9,
                  border: "1.5px solid #6366f1", background: "#fff",
                  color: "#6366f1", fontSize: 13, fontWeight: 600,
                }}
              >
                + Add College
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {colleges.map(c => {
                const colDeadlines = deadlines.filter(d => d.collegeId === c.id);
                const nextDeadline = colDeadlines
                  .filter(d => getUrgency(d.date).daysRemaining >= 0)
                  .sort((a, b) => getUrgency(a.date).daysRemaining - getUrgency(b.date).daysRemaining)[0];
                return (
                  <div key={c.id} style={{
                    background: "#fff", borderRadius: 14, padding: "16px",
                    border: "1.5px solid #e2e8f0",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", lineHeight: 1.3 }}>{c.name}</div>
                        {c.location && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{c.location}</div>}
                      </div>
                      <button
                        onClick={() => handleDeleteCollege(c.id)}
                        title="Remove college"
                        style={{
                          background: "none", border: "none", color: "#d1d5db",
                          fontSize: 16, cursor: "pointer", marginLeft: 8, flexShrink: 0,
                        }}
                        onMouseOver={e => (e.currentTarget.style.color = "#ef4444")}
                        onMouseOut={e => (e.currentTarget.style.color = "#d1d5db")}
                      >×</button>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
                      {colDeadlines.length} deadline{colDeadlines.length !== 1 ? "s" : ""}
                      {nextDeadline && (
                        <span style={{ color: getUrgency(nextDeadline.date).color }}>
                          {" · Next: "}{getUrgency(nextDeadline.date).label}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => openAddDeadline(c)}
                      style={{
                        width: "100%", padding: "7px 0", borderRadius: 8, border: "none",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        color: "#fff", fontSize: 12, fontWeight: 700,
                      }}
                    >
                      + Add Deadline
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ── Add College Modal ───────────────────────────────────────────────── */}
      {showAddCollege && (
        <Modal title="Add College" onClose={() => setShowAddCollege(false)}>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
            Search our list or type any college name.
          </p>
          <CollegeSearch
            value={addSearch}
            onChange={v => { setAddSearch(v); setAddCollegeName(v); }}
            onSelect={(name, loc) => { setAddCollegeName(name); setAddCollegeLocation(loc); setAddSearch(name); }}
            placeholder="Search college…"
          />
          {addCollegeName && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Location (optional)
              </label>
              <input
                type="text"
                value={addCollegeLocation}
                onChange={e => setAddCollegeLocation(e.target.value)}
                placeholder="City, State"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                }}
              />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setShowAddCollege(false)}
              style={{
                flex: 1, padding: "11px", borderRadius: 10,
                border: "1.5px solid #e2e8f0", background: "#fff",
                color: "#374151", fontWeight: 600, fontSize: 14,
              }}
            >Cancel</button>
            <button
              onClick={handleAddCollege}
              disabled={!addCollegeName.trim() && !addSearch.trim()}
              style={{
                flex: 2, padding: "11px", borderRadius: 10, border: "none",
                background: (!addCollegeName.trim() && !addSearch.trim()) ? "#e2e8f0" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: (!addCollegeName.trim() && !addSearch.trim()) ? "#94a3b8" : "#fff",
                fontWeight: 700, fontSize: 14,
              }}
            >Add College</button>
          </div>
        </Modal>
      )}

      {/* ── Add Deadline Modal ──────────────────────────────────────────────── */}
      {showAddDeadline && (
        <Modal title="Add Deadline" onClose={() => setShowAddDeadline(false)}>
          <form onSubmit={handleAddDeadline}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                College *
              </label>
              {colleges.length === 0 ? (
                <p style={{ fontSize: 14, color: "#ef4444" }}>Add a college first.</p>
              ) : (
                <select
                  value={dlCollege?.id ?? ""}
                  onChange={e => {
                    const c = colleges.find(c => c.id === e.target.value) ?? null;
                    setDlCollege(c);
                  }}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                    background: "#fff", color: dlCollege ? "#1e293b" : "#94a3b8",
                  }}
                >
                  <option value="">Select a college…</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Deadline Type *
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(["EA", "ED", "RD", "Scholarship"] as DeadlineType[]).map(t => {
                  const badge = getDeadlineTypeBadge(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDlType(t)}
                      style={{
                        padding: "10px 0", borderRadius: 10,
                        border: `2px solid ${dlType === t ? badge.color : "#e2e8f0"}`,
                        background: dlType === t ? badge.bg : "#fff",
                        color: dlType === t ? badge.color : "#64748b",
                        fontWeight: 700, fontSize: 14, transition: "all 0.15s",
                      }}
                    >
                      {t}
                      <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>
                        {t === "EA" ? "Early Action" : t === "ED" ? "Early Decision" : t === "RD" ? "Regular Decision" : "Scholarship"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Deadline Date *
              </label>
              <input
                type="date"
                required
                value={dlDate}
                onChange={e => setDlDate(e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Notes (optional)
              </label>
              <input
                type="text"
                value={dlNotes}
                onChange={e => setDlNotes(e.target.value)}
                placeholder="e.g. Portal-only, need 3 recs…"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none",
                }}
              />
            </div>

            {dlError && (
              <div style={{
                background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8,
                padding: "9px 14px", fontSize: 13, color: "#dc2626", marginBottom: 14,
              }}>
                {dlError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowAddDeadline(false)}
                style={{
                  flex: 1, padding: "11px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#374151", fontWeight: 600, fontSize: 14,
                }}
              >Cancel</button>
              <button
                type="submit"
                style={{
                  flex: 2, padding: "11px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color: "#fff", fontWeight: 700, fontSize: 14,
                  boxShadow: "0 3px 10px rgba(99,102,241,0.3)",
                }}
              >Save Deadline</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(15,23,42,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: "#fff", borderRadius: 20, padding: "28px 28px 24px",
          width: "100%", maxWidth: 460,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        }}
        className="fade-in"
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "50%", border: "none",
              background: "#f1f5f9", color: "#64748b", fontSize: 18, lineHeight: 1,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>
        {children}
      </div>
    </div>
  );
}