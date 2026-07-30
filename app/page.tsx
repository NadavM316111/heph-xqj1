"use client";

import { useEffect, useState, useCallback } from "react";

interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  ea?: string;
  ed?: string;
  ed2?: string;
  rd: string;
  scholarship?: string;
  acceptanceRate: string;
}

interface Deadline {
  collegeId: string;
  collegeName: string;
  type: string;
  date: string;
  daysUntil: number;
}

interface UserData {
  email: string;
  gradYear: string;
  selectedColleges: string[];
  remindersScheduled: boolean;
}

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", type: "Ivy League", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "3%" },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", type: "Research University", ea: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "yale", name: "Yale University", location: "New Haven, CT", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-03-01", acceptanceRate: "5%" },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "4%" },
  { id: "columbia", name: "Columbia University", location: "New York, NY", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "upenn", name: "University of Pennsylvania", location: "Philadelphia, PA", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "brown", name: "Brown University", location: "Providence, RI", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-03-01", acceptanceRate: "6%" },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-01", acceptanceRate: "8%" },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "duke", name: "Duke University", location: "Durham, NC", type: "Research University", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-31", scholarship: "2024-12-01", acceptanceRate: "9%" },
  { id: "rice", name: "Rice University", location: "Houston, TX", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "notre-dame", name: "University of Notre Dame", location: "Notre Dame, IN", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "13%" },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", type: "Research University", ea: "2024-11-01", rd: "2025-01-10", scholarship: "2025-02-01", acceptanceRate: "12%" },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-15", scholarship: "2024-11-15", acceptanceRate: "19%" },
  { id: "carnegie-mellon", name: "Carnegie Mellon University", location: "Pittsburgh, PA", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "15%" },
  { id: "uchicago", name: "University of Chicago", location: "Chicago, IL", type: "Research University", ea: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "6%" },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "jhu", name: "Johns Hopkins University", location: "Baltimore, MD", type: "Research University", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-03-01", acceptanceRate: "8%" },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "washu", name: "Washington University in St. Louis", location: "St. Louis, MO", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-02", scholarship: "2024-12-01", acceptanceRate: "14%" },
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", type: "Research University", ea: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01", acceptanceRate: "16%" },
  { id: "nyu", name: "New York University", location: "New York, NY", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-12-01", acceptanceRate: "21%" },
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "19%" },
  { id: "bu", name: "Boston University", location: "Boston, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-02", rd: "2025-01-02", scholarship: "2024-12-01", acceptanceRate: "19%" },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", scholarship: "2024-11-15", acceptanceRate: "13%" },
  { id: "wake-forest", name: "Wake Forest University", location: "Winston-Salem, NC", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-01-15", acceptanceRate: "28%" },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-11-15", acceptanceRate: "44%" },
  { id: "rpi", name: "Rensselaer Polytechnic Institute", location: "Troy, NY", type: "Tech University", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-01", acceptanceRate: "67%" },
  { id: "case-western", name: "Case Western Reserve University", location: "Cleveland, OH", type: "Research University", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01", acceptanceRate: "42%" },
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-12-01", acceptanceRate: "18%" },
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", type: "Tech University", ea: "2024-10-15", rd: "2025-01-05", scholarship: "2024-10-15", acceptanceRate: "17%" },
  { id: "ucb", name: "UC Berkeley", location: "Berkeley, CA", type: "Public Research", rd: "2024-11-30", scholarship: "2025-03-01", acceptanceRate: "14%" },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", type: "Public Research", rd: "2024-11-30", scholarship: "2025-03-01", acceptanceRate: "11%" },
  { id: "umich", name: "University of Michigan", location: "Ann Arbor, MI", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2025-02-15", acceptanceRate: "20%" },
  { id: "virginia", name: "University of Virginia", location: "Charlottesville, VA", type: "Public Research", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01", acceptanceRate: "23%" },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", type: "Public Research", ea: "2024-10-15", rd: "2025-01-15", scholarship: "2024-10-15", acceptanceRate: "19%" },
  { id: "uw", name: "University of Washington", location: "Seattle, WA", type: "Public Research", ea: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-30", acceptanceRate: "48%" },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "62%" },
  { id: "penn-state", name: "Penn State University", location: "University Park, PA", type: "Public Research", rd: "2024-11-30", scholarship: "2024-11-30", acceptanceRate: "56%" },
  { id: "ohio-state", name: "Ohio State University", location: "Columbus, OH", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "68%" },
  { id: "uw-madison", name: "University of Wisconsin-Madison", location: "Madison, WI", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "51%" },
  { id: "uiuc", name: "U Illinois Urbana-Champaign", location: "Champaign, IL", type: "Public Research", ea: "2024-11-01", rd: "2025-01-05", scholarship: "2024-11-01", acceptanceRate: "45%" },
  { id: "indiana", name: "Indiana University Bloomington", location: "Bloomington, IN", type: "Public Research", rd: "2025-02-01", scholarship: "2024-12-01", acceptanceRate: "80%" },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-08", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-08", scholarship: "2025-02-15", acceptanceRate: "8%" },
  { id: "wellesley", name: "Wellesley College", location: "Wellesley, MA", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-10", scholarship: "2025-02-01", acceptanceRate: "16%" },
];

const DEADLINE_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  ea: { label: "Early Action", color: "#1a56db", bg: "#ebf5ff" },
  ed: { label: "Early Decision", color: "#7e3af2", bg: "#f3f0ff" },
  ed2: { label: "Early Decision II", color: "#9d174d", bg: "#fdf2f8" },
  rd: { label: "Regular Decision", color: "#057a55", bg: "#f0fdf4" },
  scholarship: { label: "Scholarship", color: "#b45309", bg: "#fffbeb" },
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getUrgencyStyle(days: number): { bg: string; color: string; label: string } {
  if (days < 0) return { bg: "#f3f4f6", color: "#6b7280", label: "Passed" };
  if (days === 0) return { bg: "#fef2f2", color: "#dc2626", label: "TODAY" };
  if (days <= 7) return { bg: "#fef2f2", color: "#dc2626", label: `${days}d` };
  if (days <= 14) return { bg: "#fff7ed", color: "#ea580c", label: `${days}d` };
  if (days <= 30) return { bg: "#fefce8", color: "#ca8a04", label: `${days}d` };
  return { bg: "#f0fdf4", color: "#16a34a", label: `${days}d` };
}

export default function EduTracker() {
  const [step, setStep] = useState<"onboarding-year" | "onboarding-schools" | "onboarding-email" | "dashboard">("onboarding-year");
  const [gradYear, setGradYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [dashSearch, setDashSearch] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("edutracker_user");
    if (saved) {
      try {
        const parsed: UserData = JSON.parse(saved);
        setUserData(parsed);
        setEmail(parsed.email);
        setGradYear(parsed.gradYear);
        setSelectedIds(parsed.selectedColleges);
        setStep("dashboard");
      } catch {}
    }
  }, []);

  const buildDeadlines = useCallback((ids: string[]): Deadline[] => {
    const result: Deadline[] = [];
    ids.forEach((id) => {
      const college = COLLEGES.find((c) => c.id === id);
      if (!college) return;
      const types: (keyof College)[] = ["ea", "ed", "ed2", "rd", "scholarship"];
      types.forEach((t) => {
        const dateVal = college[t];
        if (typeof dateVal === "string" && dateVal && t !== "id" && t !== "name" && t !== "location" && t !== "type" && t !== "acceptanceRate") {
          result.push({
            collegeId: id,
            collegeName: college.name,
            type: t,
            date: dateVal,
            daysUntil: getDaysUntil(dateVal),
          });
        }
      });
    });
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  useEffect(() => {
    if (userData) {
      setDeadlines(buildDeadlines(userData.selectedColleges));
    }
  }, [userData, buildDeadlines]);

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCollege = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEmailSubmit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setEmailError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setAuthError(data.error || "Authentication failed.");
        setSaving(false);
        return;
      }

      const newUserData: UserData = {
        email,
        gradYear,
        selectedColleges: selectedIds,
        remindersScheduled: false,
      };
      localStorage.setItem("edutracker_user", JSON.stringify(newUserData));
      setUserData(newUserData);

      // Schedule reminders
      try {
        const deadlineList = buildDeadlines(selectedIds);
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, deadlines: deadlineList, gradYear }),
        });
        const updated = { ...newUserData, remindersScheduled: true };
        localStorage.setItem("edutracker_user", JSON.stringify(updated));
        setUserData(updated);
      } catch {}

      setStep("dashboard");
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchools = async () => {
    if (!userData) return;
    const updated: UserData = { ...userData, selectedColleges: selectedIds };
    localStorage.setItem("edutracker_user", JSON.stringify(updated));
    setUserData(updated);
    setDeadlines(buildDeadlines(selectedIds));

    try {
      const deadlineList = buildDeadlines(selectedIds);
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userData.email, deadlines: deadlineList, gradYear: userData.gradYear }),
      });
      setReminderStatus("Reminders updated!");
      setTimeout(() => setReminderStatus(null), 3000);
    } catch {}
  };

  const handleLogout = () => {
    localStorage.removeItem("edutracker_user");
    setUserData(null);
    setSelectedIds([]);
    setEmail("");
    setPassword("");
    setGradYear("2025");
    setStep("onboarding-year");
  };

  const visibleDeadlines = deadlines.filter((d) => {
    if (!showPast && d.daysUntil < 0) return false;
    if (filterType !== "all" && d.type !== filterType) return false;
    if (dashSearch && !d.collegeName.toLowerCase().includes(dashSearch.toLowerCase())) return false;
    return true;
  });

  const upcomingCount = deadlines.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 30).length;
  const urgentCount = deadlines.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 7).length;

  // ONBOARDING: Grad Year
  if (step === "onboarding-year") {
    return (
      <div style={styles.onboardingWrap}>
        <div style={styles.onboardingCard}>
          <div style={styles.logoRow}>
            <span style={styles.logo}>🎓</span>
            <span style={styles.logoText}>EduTracker</span>
          </div>
          <div style={styles.stepBadge}>Step 1 of 3</div>
          <h1 style={styles.onboardingTitle}>When do you graduate?</h1>
          <p style={styles.onboardingSubtitle}>
            We&apos;ll show you the most relevant deadlines for your application cycle.
          </p>
          <div style={styles.yearGrid}>
            {["2025", "2026", "2027", "2028"].map((y) => (
              <button
                key={y}
                onClick={() => setGradYear(y)}
                style={{
                  ...styles.yearBtn,
                  ...(gradYear === y ? styles.yearBtnActive : {}),
                }}
              >
                <span style={styles.yearNum}>{y}</span>
                <span style={styles.yearLabel}>
                  {y === "2025" ? "This Year" : y === "2026" ? "Next Year" : `In ${parseInt(y) - 2024} years`}
                </span>
              </button>
            ))}
          </div>
          <button
            style={styles.primaryBtn}
            onClick={() => setStep("onboarding-schools")}
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // ONBOARDING: School Selection
  if (step === "onboarding-schools") {
    return (
      <div style={styles.onboardingWrap}>
        <div style={{ ...styles.onboardingCard, maxWidth: 720 }}>
          <div style={styles.logoRow}>
            <span style={styles.logo}>🎓</span>
            <span style={styles.logoText}>EduTracker</span>
          </div>
          <div style={styles.stepBadge}>Step 2 of 3</div>
          <h1 style={styles.onboardingTitle}>Select Your Target Schools</h1>
          <p style={styles.onboardingSubtitle}>
            Choose the colleges you&apos;re applying to. You can always add more later.
          </p>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput}
              placeholder="Search colleges by name, location, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedIds.length > 0 && (
            <div style={styles.selectedBadgeRow}>
              <span style={styles.selectedCount}>{selectedIds.length} selected</span>
              <button style={styles.clearBtn} onClick={() => setSelectedIds([])}>Clear all</button>
            </div>
          )}
          <div style={styles.collegeGrid}>
            {filteredColleges.map((c) => {
              const sel = selectedIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCollege(c.id)}
                  style={{
                    ...styles.collegeCard,
                    ...(sel ? styles.collegeCardSel : {}),
                  }}
                >
                  <div style={styles.collegeCardTop}>
                    <div style={styles.collegeInitial}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div style={styles.collegeName}>{c.name}</div>
                      <div style={styles.collegeLoc}>{c.location}</div>
                    </div>
                    {sel && <span style={styles.checkMark}>✓</span>}
                  </div>
                  <div style={styles.collegeTagRow}>
                    <span style={styles.collegeTag}>{c.type}</span>
                    <span style={styles.collegeAcc}>{c.acceptanceRate} acceptance</span>
                  </div>
                  <div style={styles.deadlinePills}>
                    {c.ea && <span style={{ ...styles.pill, background: "#ebf5ff", color: "#1a56db" }}>EA</span>}
                    {c.ed && <span style={{ ...styles.pill, background: "#f3f0ff", color: "#7e3af2" }}>ED</span>}
                    {c.ed2 && <span style={{ ...styles.pill, background: "#fdf2f8", color: "#9d174d" }}>ED II</span>}
                    <span style={{ ...styles.pill, background: "#f0fdf4", color: "#057a55" }}>RD</span>
                    {c.scholarship && <span style={{ ...styles.pill, background: "#fffbeb", color: "#b45309" }}>$</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={styles.onboardingBtnRow}>
            <button style={styles.secondaryBtn} onClick={() => setStep("onboarding-year")}>
              ← Back
            </button>
            <button
              style={{ ...styles.primaryBtn, opacity: selectedIds.length === 0 ? 0.5 : 1 }}
              onClick={() => selectedIds.length > 0 && setStep("onboarding-email")}
              disabled={selectedIds.length === 0}
            >
              Continue with {selectedIds.length} school{selectedIds.length !== 1 ? "s" : ""} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ONBOARDING: Email
  if (step === "onboarding-email") {
    return (
      <div style={styles.onboardingWrap}>
        <div style={styles.onboardingCard}>
          <div style={styles.logoRow}>
            <span style={styles.logo}>🎓</span>
            <span style={styles.logoText}>EduTracker</span>
          </div>
          <div style={styles.stepBadge}>Step 3 of 3</div>
          <h1 style={styles.onboardingTitle}>Set Up Your Reminders</h1>
          <p style={styles.onboardingSubtitle}>
            We&apos;ll send you email reminders 30, 14, 7, and 1 day before each deadline.
          </p>
          <div style={styles.reminderInfoBox}>
            <div style={styles.reminderInfoTitle}>📬 You&apos;ll receive reminders for:</div>
            <div style={styles.reminderInfoList}>
              {[30, 14, 7, 1].map((d) => (
                <div key={d} style={styles.reminderInfoItem}>
                  <span style={styles.reminderDot}>●</span>
                  <span>{d === 1 ? "1 day" : `${d} days`} before each deadline</span>
                </div>
              ))}
            </div>
            <div style={styles.reminderInfoFooter}>
              Tracking <strong>{selectedIds.length}</strong> schools with up to <strong>{selectedIds.length * 4}+</strong> deadlines
            </div>
          </div>

          <div style={styles.authToggle}>
            <button
              style={{ ...styles.authToggleBtn, ...(authMode === "signup" ? styles.authToggleBtnActive : {}) }}
              onClick={() => setAuthMode("signup")}
            >
              Create Account
            </button>
            <button
              style={{ ...styles.authToggleBtn, ...(authMode === "login" ? styles.authToggleBtnActive : {}) }}
              onClick={() => setAuthMode("login")}
            >
              Sign In
            </button>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              style={styles.input}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); setAuthError(""); }}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setEmailError(""); setAuthError(""); }}
            />
          </div>
          {(emailError || authError) && (
            <div style={styles.errorMsg}>{emailError || authError}</div>
          )}
          <div style={styles.onboardingBtnRow}>
            <button style={styles.secondaryBtn} onClick={() => setStep("onboarding-schools")}>
              ← Back
            </button>
            <button
              style={{ ...styles.primaryBtn, opacity: saving ? 0.7 : 1 }}
              onClick={handleEmailSubmit}
              disabled={saving}
            >
              {saving ? "Setting up..." : `${authMode === "signup" ? "Create Account & " : ""}Start Tracking →`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  const nextDeadline = visibleDeadlines.find((d) => d.daysUntil >= 0);

  return (
    <div style={styles.dashWrap}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={styles.logo}>🎓</span>
          <span style={styles.logoText}>EduTracker</span>
        </div>
        <nav style={styles.nav}>
          <div style={styles.navItem}>
            <span>📅</span> Deadlines
          </div>
        </nav>
        <div style={styles.sidebarStats}>
          <div style={styles.statBox}>
            <div style={styles.statNum}>{userData?.selectedColleges.length ?? 0}</div>
            <div style={styles.statLabel}>Schools</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNum, color: urgentCount > 0 ? "#dc2626" : "#16a34a" }}>{urgentCount}</div>
            <div style={styles.statLabel}>Urgent</div>
          </div>
          <div style={styles.statBox}>
            <div style={{ ...styles.statNum, color: "#ca8a04" }}>{upcomingCount}</div>
            <div style={styles.statLabel}>In 30 days</div>
          </div>
        </div>
        <div style={styles.sidebarUser}>
          <div style={styles.userEmail}>{userData?.email}</div>
          <div style={styles.userGrad}>Class of {userData?.gradYear}</div>
          <button
            style={styles.manageBtn}
            onClick={() => {
              setSearch("");
              setSelectedIds(userData?.selectedColleges ?? []);
              setStep("onboarding-schools");
            }}
          >
            ＋ Manage Schools
          </button>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.mainHeader}>
          <div>
            <h1 style={styles.mainTitle}>Upcoming Deadlines</h1>
            <p style={styles.mainSub}>
              {userData?.remindersScheduled
                ? "✅ Email reminders active — you'll be notified 30, 14, 7 & 1 day before each deadline"
                : "Tracking your college application deadlines"}
            </p>
          </div>
          {reminderStatus && (
            <div style={styles.reminderToast}>{reminderStatus}</div>
          )}
        </div>

        {/* Next deadline hero */}
        {nextDeadline && (
          <div style={styles.heroCard}>
            <div>
              <div style={styles.heroLabel}>NEXT DEADLINE</div>
              <div style={styles.heroCollege}>{nextDeadline.collegeName}</div>
              <div style={styles.heroType}>
                <span style={{
                  ...styles.typeChip,
                  background: DEADLINE_TYPES[nextDeadline.type]?.bg,
                  color: DEADLINE_TYPES[nextDeadline.type]?.color,
                }}>
                  {DEADLINE_TYPES[nextDeadline.type]?.label}
                </span>
              </div>
            </div>
            <div style={styles.heroRight}>
              <div style={styles.heroDate}>{formatDate(nextDeadline.date)}</div>
              <div style={{
                ...styles.heroDays,
                color: nextDeadline.daysUntil <= 7 ? "#dc2626" : nextDeadline.daysUntil <= 14 ? "#ea580c" : "#1a56db",
              }}>
                {nextDeadline.daysUntil === 0 ? "Today!" : nextDeadline.daysUntil === 1 ? "Tomorrow!" : `${nextDeadline.daysUntil} days away`}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={styles.filterRow}>
          <div style={styles.searchWrap2}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              style={styles.searchInput2}
              placeholder="Filter by school name..."
              value={dashSearch}
              onChange={(e) => setDashSearch(e.target.value)}
            />
          </div>
          <div style={styles.typeFilters}>
            {["all", "ea", "ed", "ed2", "rd", "scholarship"].map((t) => (
              <button
                key={t}
                style={{
                  ...styles.filterBtn,
                  ...(filterType === t ? styles.filterBtnActive : {}),
                }}
                onClick={() => setFilterType(t)}
              >
                {t === "all" ? "All" : DEADLINE_TYPES[t]?.label ?? t.toUpperCase()}
              </button>
            ))}
          </div>
          <label style={styles.checkLabel}>
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Show past
          </label>
        </div>

        {/* Deadline list */}
        {visibleDeadlines.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>No deadlines found</div>
            <div style={styles.emptySubtitle}>
              {userData?.selectedColleges.length === 0
                ? "Add some schools to start tracking their deadlines."
                : "Try adjusting your filters or enable 'Show past'."}
            </div>
          </div>
        ) : (
          <div style={styles.deadlineList}>
            {visibleDeadlines.map((d, i) => {
              const urgency = getUrgencyStyle(d.daysUntil);
              const typeInfo = DEADLINE_TYPES[d.type];
              const college = COLLEGES.find((c) => c.id === d.collegeId);
              return (
                <div key={`${d.collegeId}-${d.type}`} style={{
                  ...styles.deadlineRow,
                  ...(i === 0 && d.daysUntil >= 0 ? styles.deadlineRowFirst : {}),
                  opacity: d.daysUntil < 0 ? 0.55 : 1,
                }}>
                  <div style={styles.deadlineLeft}>
                    <div style={styles.deadlineInitial}>
                      {d.collegeName.charAt(0)}
                    </div>
                    <div>
                      <div style={styles.deadlineCollege}>{d.collegeName}</div>
                      <div style={styles.deadlineMeta}>
                        {college?.location} · {college?.acceptanceRate} acceptance
                      </div>
                    </div>
                  </div>
                  <div style={styles.deadlineMiddle}>
                    <span style={{ ...styles.typeChip, background: typeInfo?.bg, color: typeInfo?.color }}>
                      {typeInfo?.label}
                    </span>
                  </div>
                  <div style={styles.deadlineRight}>
                    <div style={styles.deadlineDateStr}>{formatDate(d.date)}</div>
                    <span style={{ ...styles.urgencyBadge, background: urgency.bg, color: urgency.color }}>
                      {urgency.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder schedule info */}
        {deadlines.length > 0 && (
          <div style={styles.reminderInfoPanel}>
            <div style={styles.reminderPanelTitle}>📬 Email Reminder Schedule</div>
            <div style={styles.reminderPanelGrid}>
              {[30, 14, 7, 1].map((days) => {
                const count = deadlines.filter((d) => d.daysUntil >= days - 2 && d.daysUntil <= days + 2 && d.daysUntil >= 0).length;
                return (
                  <div key={days} style={styles.reminderPanelItem}>
                    <div style={styles.reminderPanelDays}>{days === 1 ? "1 day" : `${days} days`}</div>
                    <div style={styles.reminderPanelLabel}>before each deadline</div>
                    {count > 0 && <div style={styles.reminderPanelCount}>{count} coming up</div>}
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

const styles: Record<string, React.CSSProperties> = {
  onboardingWrap: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  onboardingCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 40px",
    width: "100%",
    maxWidth: 520,
    boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  logo: { fontSize: 28 },
  logoText: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e3a5f",
    letterSpacing: "-0.5px",
  },
  stepBadge: {
    display: "inline-block",
    background: "#ebf5ff",
    color: "#1a56db",
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 12px",
    borderRadius: 20,
    marginBottom: 16,
  },
  onboardingTitle: {
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 8px 0",
  },
  onboardingSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    marginBottom: 28,
    lineHeight: 1.5,
  },
  yearGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 28,
  },
  yearBtn: {
    padding: "20px 16px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
    textAlign: "center" as const,
    transition: "all 0.15s",
  },
  yearBtnActive: {
    border: "2px solid #1a56db",
    background: "#ebf5ff",
  },
  yearNum: {
    display: "block",
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },
  yearLabel: {
    display: "block",
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  primaryBtn: {
    width: "100%",
    padding: "14px 24px",
    background: "linear-gradient(135deg, #1a56db, #2d6a4f)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.3px",
  },
  secondaryBtn: {
    padding: "14px 20px",
    background: "#f9fafb",
    color: "#374151",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    cursor: "pointer",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 14px",
    marginBottom: 16,
    gap: 10,
  },
  searchIcon: { fontSize: 16, color: "#9ca3af" },
  searchInput: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 15,
    color: "#111827",
    width: "100%",
  },
  selectedBadgeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: 600,
    color: "#1a56db",
    background: "#ebf5ff",
    padding: "3px 10px",
    borderRadius: 20,
  },
  clearBtn: {
    fontSize: 13,
    color: "#6b7280",
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },
  collegeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    maxHeight: 420,
    overflowY: "auto" as const,
    marginBottom: 24,
    paddingRight: 4,
  },
  collegeCard: {
    padding: "12px 14px",
    border: "2px solid #e5e7eb",
    borderRadius: 12,
    cursor: "pointer",
    background: "#fff",
    transition: "all 0.12s",
  },
  collegeCardSel: {
    border: "2px solid #1a56db",
    background: "#f0f7ff",
  },
  collegeCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
    position: "relative" as const,
  },
  collegeInitial: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "linear-gradient(135deg, #1e3a5f, #2d6a4f)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 700,
    flexShrink: 0,
  },
  collegeName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    lineHeight: 1.3,
  },
  collegeLoc: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  checkMark: {
    marginLeft: "auto",
    color: "#1a56db",
    fontWeight: 700,
    fontSize: 16,
  },
  collegeTagRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  collegeTag: {
    fontSize: 10,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "2px 7px",
    borderRadius: 20,
  },
  collegeAcc: { fontSize: 10, color: "#6b7280" },
  deadlinePills: { display: "flex", gap: 4, flexWrap: "wrap" as const },
  pill: {
    fontSize: 9,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    letterSpacing: "0.3px",
  },
  onboardingBtnRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  reminderInfoBox: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: "16px 20px",
    marginBottom: 24,
  },
  reminderInfoTitle: { fontSize: 14, fontWeight: 600, color: "#15803d", marginBottom: 10 },
  reminderInfoList: { display: "flex", flexDirection: "column" as const, gap: 6, marginBottom: 12 },
  reminderInfoItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151" },
  reminderDot: { color: "#16a34a", fontSize: 8 },
  reminderInfoFooter: { fontSize: 13, color: "#6b7280" },
  authToggle: {
    display: "flex",
    background: "#f3f4f6",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  authToggleBtn: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    background: "transparent",
    color: "#6b7280",
  },
  authToggleBtnActive: {
    background: "#fff",
    color: "#111827",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 15,
    color: "#111827",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  errorMsg: {
    color: "#dc2626",
    fontSize: 13,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 16,
  },

  // Dashboard
  dashWrap: {
    display: "flex",
    minHeight: "100vh",
    background: "#f9fafb",
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  sidebar: {
    width: 240,
    background: "#1e3a5f",
    display: "flex",
    flexDirection: "column" as const,
    padding: "24px 16px",
    position: "sticky" as const,
    top: 0,
    height: "100vh",
    overflowY: "auto" as const,
    flexShrink: 0,
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  nav: { marginBottom: 24 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.15)",
    cursor: "pointer",
  },
  sidebarStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 24,
  },
  statBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: "10px 6px",
    textAlign: "center" as const,
  },
  statNum: { fontSize: 20, fontWeight: 700, color: "#fff" },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  sidebarUser: {
    marginTop: "auto",
    paddingTop: 16,
    borderTop: "1px solid rgba(255,255,255,0.1)",
  },
  userEmail: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
    wordBreak: "break-all" as const,
  },
  userGrad: {
    fontSize: 13,
    fontWeight: 600,
    color: "#fff",
    marginBottom: 12,
  },
  manageBtn: {
    width: "100%",
    padding: "9px 12px",
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 8,
  },
  logoutBtn: {
    width: "100%",
    padding: "9px 12px",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  },
  main: { flex: 1, padding: "32px 36px", maxWidth: 900, overflowY: "auto" as const },
  mainHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  mainTitle: { fontSize: 28, fontWeight: 700, color: "#111827", margin: 0 },
  mainSub: { fontSize: 14, color: "#6b7280", marginTop: 6 },
  reminderToast: {
    background: "#f0fdf4",
    color: "#15803d",
    border: "1px solid #bbf7d0",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
  },
  heroCard: {
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
    borderRadius: 16,
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    color: "#fff",
  },
  heroLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  heroCollege: { fontSize: 22, fontWeight: 700, marginBottom: 8 },
  heroType: {},
  heroRight: { textAlign: "right" as const },
  heroDate: { fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginBottom: 4 },
  heroDays: { fontSize: 22, fontWeight: 700 },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap" as const,
  },
  searchWrap2: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "8px 12px",
    gap: 8,
    minWidth: 200,
  },
  searchInput2: {
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: 14,
    color: "#111827",
    width: 160,
  },
  typeFilters: { display: "flex", gap: 6, flexWrap: "wrap" as const },
  filterBtn: {
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    background: "#fff",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  },
  filterBtnActive: {
    background: "#1e3a5f",
    color: "#fff",
    border: "1px solid #1e3a5f",
  },
  checkLabel: { fontSize: 13, color: "#6b7280", display: "flex", alignItems: "center", cursor: "pointer" },
  deadlineList: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    marginBottom: 28,
  },
  deadlineRow: {
    display: "flex",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #f3f4f6",
    gap: 16,
    transition: "background 0.1s",
  },
  deadlineRowFirst: {
    background: "#fffbeb",
    borderLeft: "4px solid #f59e0b",
  },
  deadlineLeft: { display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  deadlineInitial: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #1e3a5f, #2d6a4f)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 17,
    fontWeight: 700,
    flexShrink: 0,
  },
  deadlineCollege: { fontSize: 15, fontWeight: 600, color: "#111827", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" },
  deadlineMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  deadlineMiddle: { width: 140, flexShrink: 0 },
  deadlineRight: { textAlign: "right" as const, flexShrink: 0 },
  deadlineDateStr: { fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 },
  typeChip: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
  },
  urgencyBadge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    marginBottom: 28,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6b7280" },
  reminderInfoPanel: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "20px 24px",
    marginBottom: 32,
  },
  reminderPanelTitle: { fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 16 },
  reminderPanelGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  reminderPanelItem: {
    background: "#f9fafb",
    borderRadius: 10,
    padding: "12px 14px",
    textAlign: "center" as const,
  },
  reminderPanelDays: { fontSize: 18, fontWeight: 700, color: "#1e3a5f" },
  reminderPanelLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  reminderPanelCount: {
    fontSize: 11,
    color: "#16a34a",
    fontWeight: 600,
    marginTop: 6,
    background: "#f0fdf4",
    borderRadius: 10,
    padding: "2px 6px",
    display: "inline-block",
  },
};