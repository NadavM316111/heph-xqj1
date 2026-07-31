"use client";

import { useState, useEffect } from "react";
import {
  COLLEGES,
  type College,
  type AppType,
  getDeadline,
} from "@/lib/colleges";

interface TrackedCollege {
  id: string;
  name: string;
  appType: AppType;
  deadline: string; // ISO date string
  customDeadline: boolean;
  location: string;
  website: string;
}

const APP_TYPES: AppType[] = ["EA", "ED", "ED2", "RD", "Rolling"];

const APP_TYPE_LABELS: Record<AppType, string> = {
  EA: "Early Action",
  ED: "Early Decision",
  ED2: "Early Decision II",
  RD: "Regular Decision",
  Rolling: "Rolling Admissions",
};

function getDaysUntil(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getUrgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days < 7) return "#ef4444";
  if (days < 30) return "#f59e0b";
  return "#22c55e";
}

function getUrgencyBg(days: number): string {
  if (days < 0) return "#f9fafb";
  if (days < 7) return "#fef2f2";
  if (days < 30) return "#fffbeb";
  return "#f0fdf4";
}

function getUrgencyBorder(days: number): string {
  if (days < 0) return "#e5e7eb";
  if (days < 7) return "#fecaca";
  if (days < 30) return "#fde68a";
  return "#bbf7d0";
}

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatCountdown(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`;
  if (days === 0) return "Due today!";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export default function Home() {
  const [tracked, setTracked] = useState<TrackedCollege[]>([]);
  const [onboarding, setOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingColleges, setOnboardingColleges] = useState<TrackedCollege[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [manualWebsite, setManualWebsite] = useState("");
  const [selectedAppType, setSelectedAppType] = useState<AppType>("RD");
  const [customDeadlineInput, setCustomDeadlineInput] = useState("");
  const [useCustomDeadline, setUseCustomDeadline] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<AppType | "All">("All");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_colleges");
    const hasOnboarded = localStorage.getItem("edutracker_onboarded");
    if (stored) {
      try {
        setTracked(JSON.parse(stored));
      } catch {
        setTracked([]);
      }
    }
    if (!hasOnboarded) {
      setOnboarding(true);
    }
    setLoaded(true);

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("edutracker_colleges", JSON.stringify(tracked));
    }
  }, [tracked, loaded]);

  const filteredSearch = searchQuery.length > 0
    ? COLLEGES.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.location.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 8)
    : [];

  function resetModal() {
    setSearchQuery("");
    setSelectedCollege(null);
    setManualName("");
    setManualLocation("");
    setManualWebsite("");
    setSelectedAppType("RD");
    setCustomDeadlineInput("");
    setUseCustomDeadline(false);
    setIsManualEntry(false);
    setEditingId(null);
  }

  function buildTrackedCollege(overrideId?: string): TrackedCollege | null {
    const id = overrideId ?? `tc_${Date.now()}_${Math.random()}`;
    if (isManualEntry) {
      if (!manualName.trim()) return null;
      const deadline = customDeadlineInput || new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0];
      return {
        id,
        name: manualName.trim(),
        appType: selectedAppType,
        deadline,
        customDeadline: true,
        location: manualLocation.trim(),
        website: manualWebsite.trim(),
      };
    } else {
      if (!selectedCollege) return null;
      let deadline = getDeadline(selectedCollege, selectedAppType);
      let customDeadline = false;
      if (useCustomDeadline && customDeadlineInput) {
        deadline = customDeadlineInput;
        customDeadline = true;
      } else if (!deadline) {
        if (customDeadlineInput) {
          deadline = customDeadlineInput;
          customDeadline = true;
        } else {
          deadline = new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split("T")[0];
          customDeadline = true;
        }
      }
      return {
        id,
        name: selectedCollege.name,
        appType: selectedAppType,
        deadline: deadline as string,
        customDeadline,
        location: selectedCollege.location,
        website: selectedCollege.website,
      };
    }
  }

  function handleAddCollege() {
    const entry = buildTrackedCollege();
    if (!entry) return;
    const exists = tracked.find(
      (t) => t.name === entry.name && t.appType === entry.appType
    );
    if (exists) {
      alert(`${entry.name} (${entry.appType}) is already in your list!`);
      return;
    }
    setTracked((prev) => [...prev, entry]);
    setShowAddModal(false);
    resetModal();
  }

  function handleSaveEdit() {
    if (!editingId) return;
    const entry = buildTrackedCollege(editingId);
    if (!entry) return;
    setTracked((prev) => prev.map((t) => (t.id === editingId ? entry : t)));
    setShowAddModal(false);
    resetModal();
  }

  function openEdit(college: TrackedCollege) {
    setEditingId(college.id);
    setSelectedCollege(COLLEGES.find((c) => c.name === college.name) ?? null);
    setManualName(college.name);
    setManualLocation(college.location);
    setManualWebsite(college.website);
    setSelectedAppType(college.appType);
    setCustomDeadlineInput(college.deadline);
    setUseCustomDeadline(college.customDeadline);
    setIsManualEntry(!COLLEGES.find((c) => c.name === college.name));
    setShowAddModal(true);
  }

  function handleDelete(id: string) {
    if (confirm("Remove this college from your tracker?")) {
      setTracked((prev) => prev.filter((t) => t.id !== id));
    }
  }

  // Onboarding
  function handleOnboardingAdd() {
    const entry = buildTrackedCollege();
    if (!entry) return;
    const exists = onboardingColleges.find(
      (t) => t.name === entry.name && t.appType === entry.appType
    );
    if (exists) {
      alert(`${entry.name} (${entry.appType}) is already added!`);
      return;
    }
    const next = [...onboardingColleges, entry];
    setOnboardingColleges(next);
    resetModal();
    if (next.length >= 3) {
      finishOnboarding(next);
    } else {
      setOnboardingStep(next.length);
    }
  }

  function finishOnboarding(colleges?: TrackedCollege[]) {
    const toAdd = colleges ?? onboardingColleges;
    setTracked(toAdd);
    localStorage.setItem("edutracker_onboarded", "true");
    setOnboarding(false);
    setOnboardingStep(0);
    setOnboardingColleges([]);
    resetModal();
  }

  function skipOnboarding() {
    localStorage.setItem("edutracker_onboarded", "true");
    setOnboarding(false);
    setOnboardingStep(0);
    setOnboardingColleges([]);
    resetModal();
  }

  const autoDeadline = selectedCollege && !isManualEntry
    ? getDeadline(selectedCollege, selectedAppType)
    : null;

  const sortedTracked = [...tracked]
    .filter((t) => filterType === "All" || t.appType === filterType)
    .sort((a, b) => {
      const da = getDaysUntil(a.deadline);
      const db = getDaysUntil(b.deadline);
      // Past deadlines go to bottom
      if (da < 0 && db >= 0) return 1;
      if (db < 0 && da >= 0) return -1;
      return da - db;
    });

  const upcomingCount = tracked.filter((t) => getDaysUntil(t.deadline) >= 0).length;
  const urgentCount = tracked.filter((t) => {
    const d = getDaysUntil(t.deadline);
    return d >= 0 && d < 7;
  }).length;

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ fontSize: "1.2rem", color: "#64748b" }}>Loading Edutracker…</div>
      </div>
    );
  }

  // ===== ONBOARDING MODAL =====
  if (onboarding) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          background: "white",
          borderRadius: "1.5rem",
          padding: "2.5rem",
          maxWidth: "540px",
          width: "100%",
          boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
        }}>
          {onboardingStep === 0 && onboardingColleges.length === 0 ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎓</div>
                <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e293b", margin: 0 }}>
                  Welcome to Edutracker
                </h1>
                <p style={{ color: "#64748b", marginTop: "0.5rem", lineHeight: 1.6 }}>
                  Never miss a college application deadline again. Let's add your first colleges to track.
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", justifyContent: "center" }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: "2.5rem", height: "0.375rem", borderRadius: "9999px",
                    background: i === 0 ? "#667eea" : "#e2e8f0",
                    transition: "background 0.3s",
                  }} />
                ))}
              </div>
              <p style={{ textAlign: "center", color: "#94a3b8", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                Step 1 of 3 — Add your first college
              </p>
            </>
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  {onboardingColleges.length === 1 ? "✅" : "🔥"}
                </div>
                <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  {onboardingColleges.length === 1
                    ? "Great start! Add another."
                    : "Almost there! One more."}
                </h2>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", justifyContent: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: "2.5rem", height: "0.375rem", borderRadius: "9999px",
                      background: i <= onboardingStep ? "#667eea" : "#e2e8f0",
                      transition: "background 0.3s",
                    }} />
                  ))}
                </div>
                <p style={{ color: "#94a3b8", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  Step {onboardingStep + 1} of 3
                </p>
              </div>
              {onboardingColleges.length > 0 && (
                <div style={{ background: "#f8fafc", borderRadius: "0.75rem", padding: "0.75rem", marginBottom: "1rem" }}>
                  {onboardingColleges.map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.375rem 0" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>{c.name}</span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", background: "#e2e8f0", padding: "0.2rem 0.5rem", borderRadius: "9999px" }}>
                        {c.appType} · {formatDeadline(c.deadline)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <CollegeForm
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredSearch={filteredSearch}
            selectedCollege={selectedCollege}
            setSelectedCollege={setSelectedCollege}
            manualName={manualName}
            setManualName={setManualName}
            manualLocation={manualLocation}
            setManualLocation={setManualLocation}
            manualWebsite={manualWebsite}
            setManualWebsite={setManualWebsite}
            selectedAppType={selectedAppType}
            setSelectedAppType={setSelectedAppType}
            customDeadlineInput={customDeadlineInput}
            setCustomDeadlineInput={setCustomDeadlineInput}
            useCustomDeadline={useCustomDeadline}
            setUseCustomDeadline={setUseCustomDeadline}
            isManualEntry={isManualEntry}
            setIsManualEntry={setIsManualEntry}
            searchFocused={searchFocused}
            setSearchFocused={setSearchFocused}
            autoDeadline={autoDeadline}
          />

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            <button
              onClick={handleOnboardingAdd}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.875rem",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Add College
            </button>
          </div>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            {onboardingColleges.length > 0 ? (
              <button
                onClick={() => finishOnboarding()}
                style={{ background: "none", border: "none", color: "#667eea", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 }}
              >
                Skip & go to dashboard →
              </button>
            ) : (
              <button
                onClick={skipOnboarding}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.85rem" }}
              >
                Skip onboarding
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===== MAIN DASHBOARD =====
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 20px rgba(102,126,234,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.75rem" }}>🎓</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Edutracker
            </h1>
            <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.8 }}>
              College Application Deadline Tracker
            </p>
          </div>
        </div>
        <button
          onClick={() => { resetModal(); setShowAddModal(true); }}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "2px solid rgba(255,255,255,0.4)",
            color: "white",
            borderRadius: "0.75rem",
            padding: "0.6rem 1.25rem",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
        >
          + Add College
        </button>
      </header>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1rem" }}>
        {/* Stats Bar */}
        {tracked.length > 0 && (
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            {[
              { label: "Total Tracked", value: tracked.length, color: "#667eea" },
              { label: "Upcoming", value: upcomingCount, color: "#22c55e" },
              { label: "Urgent (<7 days)", value: urgentCount, color: "#ef4444" },
            ].map((stat) => (
              <div key={stat.label} style={{
                flex: "1 1 120px",
                background: "white",
                borderRadius: "1rem",
                padding: "1.25rem",
                textAlign: "center",
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                border: `2px solid ${stat.color}22`,
              }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem", fontWeight: 500 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {tracked.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            {(["All", ...APP_TYPES] as (AppType | "All")[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: "0.4rem 1rem",
                  borderRadius: "9999px",
                  border: "2px solid",
                  borderColor: filterType === type ? "#667eea" : "#e2e8f0",
                  background: filterType === type ? "#667eea" : "white",
                  color: filterType === type ? "white" : "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {type === "All" ? "All" : APP_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}

        {/* College Cards */}
        {sortedTracked.length === 0 && tracked.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "white",
            borderRadius: "1.5rem",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>📋</div>
            <h2 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>No colleges tracked yet</h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Add colleges to start tracking their deadlines.
            </p>
            <button
              onClick={() => { resetModal(); setShowAddModal(true); }}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                padding: "0.875rem 2rem",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              + Add Your First College
            </button>
          </div>
        ) : sortedTracked.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            No colleges match this filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sortedTracked.map((college) => {
              const days = getDaysUntil(college.deadline);
              const color = getUrgencyColor(days);
              const bg = getUrgencyBg(days);
              const border = getUrgencyBorder(days);
              return (
                <div
                  key={college.id}
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    borderRadius: "1.25rem",
                    padding: "1.25rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* Countdown Circle */}
                  <div style={{
                    minWidth: "5.5rem",
                    height: "5.5rem",
                    borderRadius: "50%",
                    background: color,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    textAlign: "center",
                    flexShrink: 0,
                    boxShadow: `0 4px 12px ${color}55`,
                  }}>
                    {days < 0 ? (
                      <>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, opacity: 0.9 }}>PAST</span>
                      </>
                    ) : days === 0 ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 800 }}>TODAY!</span>
                    ) : (
                      <>
                        <span style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1 }}>{days}</span>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, opacity: 0.9 }}>DAYS LEFT</span>
                      </>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#1e293b" }}>
                        {college.name}
                      </h3>
                      <span style={{
                        background: color,
                        color: "white",
                        padding: "0.15rem 0.6rem",
                        borderRadius: "9999px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {college.appType}
                      </span>
                      {college.customDeadline && (
                        <span style={{
                          background: "#e2e8f0",
                          color: "#64748b",
                          padding: "0.15rem 0.5rem",
                          borderRadius: "9999px",
                          fontSize: "0.7rem",
                          fontWeight: 600,
                        }}>
                          Custom date
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0.25rem 0 0", color: "#475569", fontSize: "0.85rem" }}>
                      {APP_TYPE_LABELS[college.appType]} Deadline: <strong>{formatDeadline(college.deadline)}</strong>
                    </p>
                    {college.location && (
                      <p style={{ margin: "0.15rem 0 0", color: "#94a3b8", fontSize: "0.8rem" }}>
                        📍 {college.location}
                      </p>
                    )}
                    <p style={{
                      margin: "0.35rem 0 0",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: days < 0 ? "#9ca3af" : color,
                    }}>
                      {formatCountdown(days)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                    {college.website && (
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "0.4rem 0.8rem",
                          background: "white",
                          border: "1.5px solid #e2e8f0",
                          borderRadius: "0.5rem",
                          fontSize: "0.8rem",
                          color: "#667eea",
                          fontWeight: 600,
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Apply ↗
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(college)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "white",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#475569",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(college.id)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "white",
                        border: "1.5px solid #fecaca",
                        borderRadius: "0.5rem",
                        fontSize: "0.8rem",
                        color: "#ef4444",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {tracked.length > 0 && (
          <div style={{
            display: "flex", gap: "1.5rem", marginTop: "2rem", justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {[
              { color: "#ef4444", label: "< 7 days (Urgent)" },
              { color: "#f59e0b", label: "< 30 days (Soon)" },
              { color: "#22c55e", label: "> 30 days (On track)" },
              { color: "#9ca3af", label: "Past deadline" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "0.75rem", height: "0.75rem", borderRadius: "50%", background: item.color }} />
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 1000, backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); resetModal(); } }}
        >
          <div style={{
            background: "white",
            borderRadius: "1.5rem",
            padding: "2rem",
            maxWidth: "500px",
            width: "100%",
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            maxHeight: "90vh",
            overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0, color: "#1e293b", fontSize: "1.3rem", fontWeight: 800 }}>
                {editingId ? "Edit College" : "Add College"}
              </h2>
              <button
                onClick={() => { setShowAddModal(false); resetModal(); }}
                style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}
              >
                ×
              </button>
            </div>

            <CollegeForm
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredSearch={filteredSearch}
              selectedCollege={selectedCollege}
              setSelectedCollege={setSelectedCollege}
              manualName={manualName}
              setManualName={setManualName}
              manualLocation={manualLocation}
              setManualLocation={setManualLocation}
              manualWebsite={manualWebsite}
              setManualWebsite={setManualWebsite}
              selectedAppType={selectedAppType}
              setSelectedAppType={setSelectedAppType}
              customDeadlineInput={customDeadlineInput}
              setCustomDeadlineInput={setCustomDeadlineInput}
              useCustomDeadline={useCustomDeadline}
              setUseCustomDeadline={setUseCustomDeadline}
              isManualEntry={isManualEntry}
              setIsManualEntry={setIsManualEntry}
              searchFocused={searchFocused}
              setSearchFocused={setSearchFocused}
              autoDeadline={autoDeadline}
            />

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => { setShowAddModal(false); resetModal(); }}
                style={{
                  flex: 1,
                  background: "white",
                  border: "2px solid #e2e8f0",
                  color: "#64748b",
                  borderRadius: "0.75rem",
                  padding: "0.875rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={editingId ? handleSaveEdit : handleAddCollege}
                style={{
                  flex: 2,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "0.75rem",
                  padding: "0.875rem",
                  fontWeight: 700,
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                {editingId ? "Save Changes" : "Add to Tracker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== COLLEGE FORM COMPONENT =====
interface CollegeFormProps {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredSearch: College[];
  selectedCollege: College | null;
  setSelectedCollege: (c: College | null) => void;
  manualName: string;
  setManualName: (v: string) => void;
  manualLocation: string;
  setManualLocation: (v: string) => void;
  manualWebsite: string;
  setManualWebsite: (v: string) => void;
  selectedAppType: AppType;
  setSelectedAppType: (v: AppType) => void;
  customDeadlineInput: string;
  setCustomDeadlineInput: (v: string) => void;
  useCustomDeadline: boolean;
  setUseCustomDeadline: (v: boolean) => void;
  isManualEntry: boolean;
  setIsManualEntry: (v: boolean) => void;
  searchFocused: boolean;
  setSearchFocused: (v: boolean) => void;
  autoDeadline: string | null | undefined;
}

function CollegeForm({
  searchQuery, setSearchQuery,
  filteredSearch,
  selectedCollege, setSelectedCollege,
  manualName, setManualName,
  manualLocation, setManualLocation,
  manualWebsite, setManualWebsite,
  selectedAppType, setSelectedAppType,
  customDeadlineInput, setCustomDeadlineInput,
  useCustomDeadline, setUseCustomDeadline,
  isManualEntry, setIsManualEntry,
  searchFocused, setSearchFocused,
  autoDeadline,
}: CollegeFormProps) {
  const inputStyle = {
    width: "100%",
    padding: "0.75rem 1rem",
    border: "2px solid #e2e8f0",
    borderRadius: "0.75rem",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
    color: "#1e293b",
  };

  const labelStyle = {
    display: "block",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "0.4rem",
    fontSize: "0.9rem",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" as const, gap: "1rem" }}>
      {/* Toggle */}
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "0.75rem", padding: "0.25rem" }}>
        <button
          onClick={() => setIsManualEntry(false)}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "0.5rem",
            background: !isManualEntry ? "white" : "transparent",
            color: !isManualEntry ? "#667eea" : "#94a3b8",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.85rem",
            boxShadow: !isManualEntry ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          🔍 Search Database
        </button>
        <button
          onClick={() => setIsManualEntry(true)}
          style={{
            flex: 1,
            padding: "0.5rem",
            border: "none",
            borderRadius: "0.5rem",
            background: isManualEntry ? "white" : "transparent",
            color: isManualEntry ? "#667eea" : "#94a3b8",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.85rem",
            boxShadow: isManualEntry ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all 0.2s",
          }}
        >
          ✏️ Manual Entry
        </button>
      </div>

      {!isManualEntry ? (
        <div style={{ position: "relative" }}>
          <label style={labelStyle}>Search for a College</label>
          {selectedCollege ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "#f0fdf4",
              border: "2px solid #bbf7d0",
              borderRadius: "0.75rem",
            }}>
              <div>
                <div style={{ fontWeight: 700, color: "#1e293b" }}>{selectedCollege.name}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{selectedCollege.location}</div>
              </div>
              <button
                onClick={() => { setSelectedCollege(null); setSearchQuery(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1.1rem" }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                style={inputStyle}
                type="text"
                placeholder="Type college name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              />
              {searchFocused && filteredSearch.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "2px solid #e2e8f0",
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  zIndex: 100,
                  maxHeight: "220px",
                  overflowY: "auto",
                  marginTop: "0.25rem",
                }}>
                  {filteredSearch.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCollege(c);
                        setSearchQuery("");
                        setSearchFocused(false);
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.75rem 1rem",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.9rem" }}>{c.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{c.location}</div>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.length > 0 && filteredSearch.length === 0 && (
                <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: "0.35rem 0 0" }}>
                  No results — try Manual Entry to add this college.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div>
            <label style={labelStyle}>College Name *</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., University of Dreams"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="e.g., Boston, MA"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Application Website</label>
            <input
              style={inputStyle}
              type="url"
              placeholder="https://apply.college.edu"
              value={manualWebsite}
              onChange={(e) => setManualWebsite(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Application Type */}
      <div>
        <label style={labelStyle}>Application Type</label>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" as const }}>
          {APP_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedAppType(type)}
              style={{
                padding: "0.45rem 0.9rem",
                border: "2px solid",
                borderColor: selectedAppType === type ? "#667eea" : "#e2e8f0",
                background: selectedAppType === type ? "#667eea" : "white",
                color: selectedAppType === type ? "white" : "#64748b",
                borderRadius: "0.5rem",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {type}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0" }}>
          {APP_TYPE_LABELS[selectedAppType]}
        </p>
      </div>

      {/* Deadline */}
      <div>
        <label style={labelStyle}>Deadline</label>
        {!isManualEntry && autoDeadline && (
          <div style={{
            padding: "0.6rem 1rem",
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
            borderRadius: "0.6rem",
            marginBottom: "0.5rem",
            fontSize: "0.85rem",
            color: "#166534",
            fontWeight: 600,
          }}>
            ✅ Auto-populated: {formatDeadline(autoDeadline)}
          </div>
        )}
        {!isManualEntry && !autoDeadline && selectedCollege && (
          <div style={{
            padding: "0.6rem 1rem",
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            borderRadius: "0.6rem",
            marginBottom: "0.5rem",
            fontSize: "0.85rem",
            color: "#92400e",
          }}>
            ⚠️ No {selectedAppType} deadline in our database. Please enter one below.
          </div>
        )}
        {(isManualEntry || !autoDeadline || useCustomDeadline) ? (
          <input
            style={inputStyle}
            type="date"
            value={customDeadlineInput}
            onChange={(e) => setCustomDeadlineInput(e.target.value)}
          />
        ) : (
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "#64748b" }}>
              <input
                type="checkbox"
                checked={useCustomDeadline}
                onChange={(e) => setUseCustomDeadline(e.target.checked)}
              />
              Override with custom date
            </label>
            {useCustomDeadline && (
              <input
                style={{ ...inputStyle, marginTop: "0.5rem" }}
                type="date"
                value={customDeadlineInput}
                onChange={(e) => setCustomDeadlineInput(e.target.value)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}