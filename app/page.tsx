"use client";

import { useEffect, useState } from "react";

interface Deadline {
  id: number;
  college_name: string;
  application_type: string;
  deadline_date: string;
  notes: string;
  reminder_sent: boolean;
  created_at: string;
}

const APPLICATION_TYPES = [
  "Early Decision (ED)",
  "Early Decision II (ED II)",
  "Early Action (EA)",
  "Restrictive Early Action (REA)",
  "Regular Decision (RD)",
  "Rolling Admission",
  "Priority Deadline",
];

const POPULAR_COLLEGES = [
  "Harvard University",
  "Yale University",
  "Princeton University",
  "Columbia University",
  "University of Pennsylvania",
  "Brown University",
  "Dartmouth College",
  "Cornell University",
  "Stanford University",
  "MIT",
  "Duke University",
  "Johns Hopkins University",
  "Northwestern University",
  "University of Chicago",
  "Vanderbilt University",
  "Rice University",
  "Notre Dame",
  "Georgetown University",
  "Emory University",
  "Carnegie Mellon University",
  "UC Berkeley",
  "UCLA",
  "University of Michigan",
  "University of Virginia",
  "UNC Chapel Hill",
  "NYU",
  "Boston University",
  "Tufts University",
  "Tulane University",
  "Wake Forest University",
  "Washington University in St. Louis",
  "Case Western Reserve University",
  "University of Rochester",
  "Lehigh University",
  "University of Southern California",
  "Georgia Tech",
  "University of Florida",
  "University of Texas at Austin",
  "Penn State",
  "Ohio State University",
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [formCollege, setFormCollege] = useState("");
  const [formCollegeSuggestions, setFormCollegeSuggestions] = useState<string[]>([]);
  const [formType, setFormType] = useState(APPLICATION_TYPES[0]);
  const [formDate, setFormDate] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    fetch("/api/auth").then(r => r.json()).then(d => {
      setEmail(d.email || "");
      setCheckingAuth(false);
    });
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
  }, []);

  useEffect(() => {
    if (email) fetchDeadlines();
  }, [email]);

  async function fetchDeadlines() {
    setLoadingDeadlines(true);
    const r = await fetch("/api/deadlines");
    const d = await r.json();
    setDeadlines(d.deadlines || []);
    setLoadingDeadlines(false);
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const d = await r.json();
    setAuthLoading(false);
    if (d.ok) {
      setEmail(d.email);
      setAuthEmail("");
      setAuthPassword("");
    } else {
      setAuthError(d.error || "Something went wrong");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setEmail("");
    setDeadlines([]);
  }

  async function handleAddDeadline(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!formCollege.trim()) { setFormError("Please enter a college name."); return; }
    if (!formDate) { setFormError("Please select a deadline date."); return; }
    setFormLoading(true);
    const r = await fetch("/api/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ college_name: formCollege.trim(), application_type: formType, deadline_date: formDate, notes: formNotes.trim() }),
    });
    const d = await r.json();
    setFormLoading(false);
    if (d.ok) {
      setShowAdd(false);
      setFormCollege("");
      setFormType(APPLICATION_TYPES[0]);
      setFormDate("");
      setFormNotes("");
      setFormCollegeSuggestions([]);
      fetchDeadlines();
    } else {
      setFormError(d.error || "Failed to add deadline.");
    }
  }

  async function handleDelete(id: number) {
    setDeleteId(id);
    const r = await fetch(`/api/deadlines?id=${id}`, { method: "DELETE" });
    const d = await r.json();
    if (d.ok) {
      setDeadlines(prev => prev.filter(dl => dl.id !== id));
    }
    setDeleteId(null);
  }

  function handleCollegeInput(val: string) {
    setFormCollege(val);
    if (val.length < 2) { setFormCollegeSuggestions([]); return; }
    const lower = val.toLowerCase();
    setFormCollegeSuggestions(POPULAR_COLLEGES.filter(c => c.toLowerCase().includes(lower)).slice(0, 6));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDeadlines = deadlines
    .filter(d => new Date(d.deadline_date + "T00:00:00") >= today)
    .sort((a, b) => a.deadline_date.localeCompare(b.deadline_date));

  const pastDeadlines = deadlines
    .filter(d => new Date(d.deadline_date + "T00:00:00") < today)
    .sort((a, b) => b.deadline_date.localeCompare(a.deadline_date));

  const displayDeadlines = activeTab === "upcoming" ? upcomingDeadlines : pastDeadlines;

  if (checkingAuth) {
    return (
      <div style={styles.loadingScreen}>
        <img src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png" alt="Edutracker" style={styles.loadingLogo} />
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!email) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker"
            style={styles.authLogo}
          />
          <h1 style={styles.authTitle}>Edutracker</h1>
          <p style={styles.authSubtitle}>Never miss a college application deadline.</p>

          <div style={styles.tabRow}>
            <button style={authMode === "login" ? styles.tabActive : styles.tabInactive} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Sign In</button>
            <button style={authMode === "signup" ? styles.tabActive : styles.tabInactive} onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Create Account</button>
          </div>

          <form onSubmit={handleAuth} style={styles.authForm}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={authEmail}
              onChange={e => setAuthEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="you@email.com"
              autoComplete="email"
            />
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={authPassword}
              onChange={e => setAuthPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
              autoComplete={authMode === "signup" ? "new-password" : "current-password"}
            />
            {authError && <div style={styles.errorBox}>{authError}</div>}
            <button type="submit" style={styles.primaryBtn} disabled={authLoading}>
              {authLoading ? "Please wait…" : authMode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src="https://kobwhnsy46wia1ga.public.blob.vercel-storage.com/olympus/MHzFM0XwMRAKcI38/ms9ar2f7-ee744c62-792d-4a40-9a12-3f39cebb7464-removebg-preview-3C58eOMxvVC76P595ELS8vavDN1zzQ.png"
            alt="Edutracker"
            style={styles.headerLogo}
          />
          <span style={styles.headerTitle}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.headerEmail}>{email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {/* Main */}
      <main style={styles.main}>
        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{upcomingDeadlines.length}</div>
            <div style={styles.statLabel}>Upcoming</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#e74c3c" }}>
              {upcomingDeadlines.filter(d => daysUntil(d.deadline_date) <= 7).length}
            </div>
            <div style={styles.statLabel}>Due This Week</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{pastDeadlines.length}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>

        {/* Add button */}
        <div style={styles.sectionHeader}>
          <div style={styles.tabRow2}>
            <button style={activeTab === "upcoming" ? styles.tab2Active : styles.tab2Inactive} onClick={() => setActiveTab("upcoming")}>Upcoming</button>
            <button style={activeTab === "past" ? styles.tab2Active : styles.tab2Inactive} onClick={() => setActiveTab("past")}>Past</button>
          </div>
          <button style={styles.addBtn} onClick={() => { setShowAdd(true); setFormError(""); }}>
            + Add Deadline
          </button>
        </div>

        {/* Add Deadline Modal */}
        {showAdd && (
          <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add Application Deadline</h2>
                <button style={styles.closeBtn} onClick={() => setShowAdd(false)}>✕</button>
              </div>
              <form onSubmit={handleAddDeadline}>
                <label style={styles.label}>College / University *</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    value={formCollege}
                    onChange={e => handleCollegeInput(e.target.value)}
                    style={styles.input}
                    placeholder="Start typing a college name…"
                    autoComplete="off"
                  />
                  {formCollegeSuggestions.length > 0 && (
                    <div style={styles.suggestions}>
                      {formCollegeSuggestions.map(s => (
                        <div key={s} style={styles.suggestion} onClick={() => { setFormCollege(s); setFormCollegeSuggestions([]); }}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label style={styles.label}>Application Type *</label>
                <select value={formType} onChange={e => setFormType(e.target.value)} style={styles.input}>
                  {APPLICATION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>

                <label style={styles.label}>Deadline Date *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  style={styles.input}
                  min={new Date().toISOString().split("T")[0]}
                />

                <label style={styles.label}>Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  style={{ ...styles.input, height: "72px", resize: "vertical" }}
                  placeholder="e.g. need teacher rec, supplement essay due…"
                />

                {formError && <div style={styles.errorBox}>{formError}</div>}

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
                  <button type="submit" style={styles.primaryBtn} disabled={formLoading}>
                    {formLoading ? "Saving…" : "Save Deadline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deadline list */}
        {loadingDeadlines ? (
          <div style={styles.emptyState}>Loading deadlines…</div>
        ) : displayDeadlines.length === 0 ? (
          <div style={styles.emptyState}>
            {activeTab === "upcoming"
              ? "No upcoming deadlines yet. Add your first one!"
              : "No past deadlines."}
          </div>
        ) : (
          <div style={styles.cardList}>
            {displayDeadlines.map(dl => {
              const days = daysUntil(dl.deadline_date);
              const urgent = days <= 7 && days >= 0;
              const overdue = days < 0;
              return (
                <div key={dl.id} style={{ ...styles.deadlineCard, borderLeft: urgent ? "4px solid #e74c3c" : overdue ? "4px solid #aaa" : "4px solid #1a6fc4" }}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.collegeName}>{dl.college_name}</div>
                      <div style={styles.appType}>{dl.application_type}</div>
                    </div>
                    <div style={styles.cardRight}>
                      <div style={{ ...styles.daysChip, background: urgent ? "#fdecea" : overdue ? "#f5f5f5" : "#e8f0fe", color: urgent ? "#c0392b" : overdue ? "#888" : "#1a6fc4" }}>
                        {overdue ? `${Math.abs(days)}d ago` : days === 0 ? "Today!" : `${days}d left`}
                      </div>
                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(dl.id)}
                        disabled={deleteId === dl.id}
                        title="Remove deadline"
                      >
                        {deleteId === dl.id ? "…" : "🗑"}
                      </button>
                    </div>
                  </div>
                  <div style={styles.cardDate}>📅 {formatDate(dl.deadline_date)}</div>
                  {dl.notes && <div style={styles.cardNotes}>📝 {dl.notes}</div>}
                  {urgent && (
                    <div style={styles.reminderBadge}>
                      🔔 Email reminder will be sent 7 days before deadline
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f4ff",
    gap: 20,
  },
  loadingLogo: { width: 80, height: 80, objectFit: "contain" },
  spinner: {
    width: 36,
    height: 36,
    border: "4px solid #dde8ff",
    borderTop: "4px solid #1a6fc4",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite",
  },
  authPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #e8f0fe 0%, #f0f4ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  authCard: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 4px 32px rgba(26,111,196,0.12)",
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  authLogo: { width: 80, height: 80, objectFit: "contain", marginBottom: 8 },
  authTitle: { fontSize: 28, fontWeight: 800, color: "#1a6fc4", margin: "0 0 4px" },
  authSubtitle: { fontSize: 14, color: "#666", marginBottom: 24, textAlign: "center" },
  authForm: { width: "100%", display: "flex", flexDirection: "column", gap: 4 },
  tabRow: { display: "flex", gap: 0, marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1.5px solid #1a6fc4", width: "100%" },
  tabActive: { flex: 1, padding: "10px 0", background: "#1a6fc4", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  tabInactive: { flex: 1, padding: "10px 0", background: "#fff", color: "#1a6fc4", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  label: { fontSize: 13, fontWeight: 600, color: "#444", marginTop: 10, marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #d0d9f0", fontSize: 15, boxSizing: "border-box", outline: "none", fontFamily: "inherit", color: "#222", background: "#fafdff" },
  errorBox: { background: "#fdecea", color: "#c0392b", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginTop: 8 },
  primaryBtn: { width: "100%", padding: "12px 0", background: "#1a6fc4", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 16 },
  page: { minHeight: "100vh", background: "#f0f4ff", display: "flex", flexDirection: "column" },
  header: { background: "#fff", boxShadow: "0 2px 12px rgba(26,111,196,0.08)", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerLogo: { width: 36, height: 36, objectFit: "contain" },
  headerTitle: { fontSize: 20, fontWeight: 800, color: "#1a6fc4" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  headerEmail: { fontSize: 13, color: "#666", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  logoutBtn: { padding: "6px 14px", background: "#e8f0fe", color: "#1a6fc4", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  main: { maxWidth: 720, margin: "0 auto", padding: "28px 16px", width: "100%" },
  statsRow: { display: "flex", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, background: "#fff", borderRadius: 12, padding: "18px 12px", textAlign: "center", boxShadow: "0 2px 8px rgba(26,111,196,0.07)" },
  statNumber: { fontSize: 32, fontWeight: 800, color: "#1a6fc4" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2, fontWeight: 500 },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  tabRow2: { display: "flex", gap: 0, borderRadius: 8, overflow: "hidden", border: "1.5px solid #1a6fc4" },
  tab2Active: { padding: "8px 20px", background: "#1a6fc4", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  tab2Inactive: { padding: "8px 20px", background: "#fff", color: "#1a6fc4", border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  addBtn: { padding: "10px 20px", background: "#1a6fc4", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal: { background: "#fff", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(26,111,196,0.18)", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#1a6fc4", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", padding: 0 },
  modalFooter: { display: "flex", gap: 12, marginTop: 16, justifyContent: "flex-end" },
  cancelBtn: { padding: "10px 20px", background: "#f0f4ff", color: "#1a6fc4", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" },
  suggestions: { position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1.5px solid #d0d9f0", borderRadius: "0 0 8px 8px", zIndex: 300, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" },
  suggestion: { padding: "10px 14px", cursor: "pointer", fontSize: 14, color: "#222", borderBottom: "1px solid #f0f4ff" },
  emptyState: { textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: 16 },
  cardList: { display: "flex", flexDirection: "column", gap: 14 },
  deadlineCard: { background: "#fff", borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(26,111,196,0.07)", transition: "box-shadow 0.2s" },
  cardTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 },
  collegeName: { fontSize: 17, fontWeight: 700, color: "#1a2744" },
  appType: { fontSize: 13, color: "#1a6fc4", fontWeight: 600, marginTop: 2 },
  cardRight: { display: "flex", alignItems: "center", gap: 10 },
  daysChip: { fontSize: 13, fontWeight: 700, borderRadius: 20, padding: "4px 12px" },
  deleteBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 0, opacity: 0.6 },
  cardDate: { fontSize: 13, color: "#555", marginBottom: 4 },
  cardNotes: { fontSize: 13, color: "#777", marginTop: 4 },
  reminderBadge: { marginTop: 8, background: "#fff8e1", color: "#b7860b", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600 },
};