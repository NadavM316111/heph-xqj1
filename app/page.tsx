"use client";

import { useState, useEffect } from "react";
import { COLLEGES } from "../lib/colleges";
import type { College, DeadlineType } from "../lib/colleges";

type Step = "onboarding" | "select" | "dashboard";

interface SavedDeadline {
  collegeId: string;
  collegeName: string;
  type: DeadlineType;
  date: string;
  label: string;
}

const DEADLINE_LABELS: Record<DeadlineType, string> = {
  ea: "Early Action",
  ed: "Early Decision",
  ed2: "Early Decision II",
  rd: "Regular Decision",
  faid: "Financial Aid",
};

const DEADLINE_COLORS: Record<DeadlineType, string> = {
  ea: "#6366f1",
  ed: "#ec4899",
  ed2: "#f97316",
  rd: "#0ea5e9",
  faid: "#10b981",
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyColor(days: number): string {
  if (days < 0) return "#94a3b8";
  if (days < 14) return "#ef4444";
  if (days < 30) return "#f59e0b";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past";
  if (days < 14) return "Urgent";
  if (days < 30) return "Soon";
  return "Upcoming";
}

function urgencyBg(days: number): string {
  if (days < 0) return "#f1f5f9";
  if (days < 14) return "#fef2f2";
  if (days < 30) return "#fffbeb";
  return "#f0fdf4";
}

export default function Home() {
  const [step, setStep] = useState<Step>("onboarding");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savedDeadlines, setSavedDeadlines] = useState<SavedDeadline[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<DeadlineType | "all">("all");
  const [filterUrgency, setFilterUrgency] = useState<"all" | "urgent" | "soon" | "upcoming" | "past">("all");
  const [sortBy, setSortBy] = useState<"date" | "school" | "urgency">("date");
  const [activeTab, setActiveTab] = useState<"timeline" | "list">("timeline");
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [onboardingName, setOnboardingName] = useState("");
  const [onboardingGrad, setOnboardingGrad] = useState("2025");

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});

    const saved = localStorage.getItem("edutracker_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.step) setStep(parsed.step);
        if (parsed.selectedIds) setSelectedIds(new Set(parsed.selectedIds));
        if (parsed.savedDeadlines) setSavedDeadlines(parsed.savedDeadlines);
        if (parsed.onboardingName) setOnboardingName(parsed.onboardingName);
        if (parsed.onboardingGrad) setOnboardingGrad(parsed.onboardingGrad);
      } catch {}
    }
  }, []);

  function persist(updates: {
    step?: Step;
    selectedIds?: Set<string>;
    savedDeadlines?: SavedDeadline[];
  }) {
    const current = {
      step,
      selectedIds: [...selectedIds],
      savedDeadlines,
      onboardingName,
      onboardingGrad,
      ...updates,
      selectedIds: updates.selectedIds ? [...updates.selectedIds] : [...selectedIds],
    };
    localStorage.setItem("edutracker_state", JSON.stringify(current));
  }

  function handleOnboardingContinue() {
    persist({ step: "select" });
    setStep("select");
  }

  function toggleCollege(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= 20) return;
      next.add(id);
    }
    setSelectedIds(next);
  }

  function buildDeadlines(ids: Set<string>): SavedDeadline[] {
    const result: SavedDeadline[] = [];
    ids.forEach((id) => {
      const college = COLLEGES.find((c) => c.id === id);
      if (!college) return;
      (Object.keys(college.deadlines) as DeadlineType[]).forEach((type) => {
        const date = college.deadlines[type];
        if (date) {
          result.push({
            collegeId: id,
            collegeName: college.name,
            type,
            date,
            label: DEADLINE_LABELS[type],
          });
        }
      });
    });
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  function handleConfirmSelection() {
    const deadlines = buildDeadlines(selectedIds);
    setSavedDeadlines(deadlines);
    persist({ step: "dashboard", selectedIds, savedDeadlines: deadlines });
    setStep("dashboard");
  }

  function handleReset() {
    localStorage.removeItem("edutracker_state");
    setStep("onboarding");
    setSelectedIds(new Set());
    setSavedDeadlines([]);
    setSearch("");
    setOnboardingName("");
    setOnboardingGrad("2025");
  }

  function removeCollege(id: string) {
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
    const deadlines = buildDeadlines(next);
    setSavedDeadlines(deadlines);
    persist({ selectedIds: next, savedDeadlines: deadlines });
  }

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.location.toLowerCase().includes(search.toLowerCase())
  );

  const filteredDeadlines = savedDeadlines.filter((d) => {
    if (filterType !== "all" && d.type !== filterType) return false;
    const days = daysUntil(d.date);
    if (filterUrgency === "urgent" && !(days >= 0 && days < 14)) return false;
    if (filterUrgency === "soon" && !(days >= 14 && days < 30)) return false;
    if (filterUrgency === "upcoming" && days < 30) return false;
    if (filterUrgency === "past" && days >= 0) return false;
    return true;
  });

  const sortedDeadlines = [...filteredDeadlines].sort((a, b) => {
    if (sortBy === "date") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === "school") return a.collegeName.localeCompare(b.collegeName);
    if (sortBy === "urgency") return daysUntil(a.date) - daysUntil(b.date);
    return 0;
  });

  const groupedBySchool: Record<string, SavedDeadline[]> = {};
  savedDeadlines.forEach((d) => {
    if (!groupedBySchool[d.collegeId]) groupedBySchool[d.collegeId] = [];
    groupedBySchool[d.collegeId].push(d);
  });

  const nextDeadline = savedDeadlines.find((d) => daysUntil(d.date) >= 0);
  const urgentCount = savedDeadlines.filter((d) => {
    const days = daysUntil(d.date);
    return days >= 0 && days < 14;
  }).length;

  if (step === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "3rem", padding: "0.5rem 1.25rem", marginBottom: "2rem" }}>
              <span style={{ fontSize: "1.5rem" }}>🎓</span>
              <span style={{ color: "#a5b4fc", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "0.05em" }}>EDUTRACKER</span>
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, color: "#f8fafc", lineHeight: 1.15, marginBottom: "1rem" }}>
              Never miss a<br />
              <span style={{ background: "linear-gradient(90deg, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>college deadline</span>
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "1.1rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
              Track EA, ED, RD, and financial aid deadlines for 200 top US colleges — all in one place.
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.25rem", padding: "2rem", backdropFilter: "blur(10px)", marginBottom: "1.5rem" }}>
            <div style={{ marginBottom: "1.25rem", textAlign: "left" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your First Name</label>
              <input
                type="text"
                value={onboardingName}
                onChange={(e) => setOnboardingName(e.target.value)}
                placeholder="e.g. Alex"
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#f8fafc", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
              <label style={{ display: "block", color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Graduation Year</label>
              <select
                value={onboardingGrad}
                onChange={(e) => setOnboardingGrad(e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(30,27,75,0.9)", color: "#f8fafc", fontSize: "1rem", outline: "none", boxSizing: "border-box" }}
              >
                <option value="2025">Class of 2025</option>
                <option value="2026">Class of 2026</option>
                <option value="2027">Class of 2027</option>
              </select>
            </div>
            <button
              onClick={handleOnboardingContinue}
              style={{ width: "100%", padding: "0.9rem", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "0.75rem", fontSize: "1rem", fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}
            >
              Get Started →
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "2rem" }}>
            {[["200+", "Colleges"], ["5", "Deadline Types"], ["Free", "Forever"]].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color: "#818cf8", fontWeight: 800, fontSize: "1.25rem" }}>{num}</div>
                <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* Header */}
        <div style={{ background: "rgba(15,23,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.5rem", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(10px)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.15rem" }}>🎓 Edutracker</div>
              <h2 style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.15rem", margin: 0 }}>
                Select Your Schools
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "2rem", padding: "0.4rem 1rem", color: "#a5b4fc", fontSize: "0.9rem", fontWeight: 600 }}>
                {selectedIds.size}/20 selected
              </div>
              <button
                onClick={handleConfirmSelection}
                disabled={selectedIds.size === 0}
                style={{ background: selectedIds.size === 0 ? "#334155" : "linear-gradient(135deg, #6366f1, #8b5cf6)", color: selectedIds.size === 0 ? "#64748b" : "#fff", border: "none", borderRadius: "0.65rem", padding: "0.6rem 1.25rem", fontWeight: 700, fontSize: "0.95rem", cursor: selectedIds.size === 0 ? "not-allowed" : "pointer" }}
              >
                Build My Calendar →
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
          <input
            type="text"
            placeholder="Search colleges by name or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.85rem 1.25rem", borderRadius: "0.85rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#f8fafc", fontSize: "1rem", outline: "none", marginBottom: "1.5rem", boxSizing: "border-box" }}
          />

          {selectedIds.size > 0 && (
            <div style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "1rem", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Selected Schools</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {[...selectedIds].map((id) => {
                  const c = COLLEGES.find((x) => x.id === id);
                  return c ? (
                    <div key={id} style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: "2rem", padding: "0.3rem 0.85rem", color: "#a5b4fc", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {c.name}
                      <button onClick={() => toggleCollege(id)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "1rem", lineHeight: 1, padding: 0 }}>×</button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "0.85rem" }}>
            {filteredColleges.map((college) => {
              const isSelected = selectedIds.has(college.id);
              const hasEd = !!college.deadlines.ed;
              const hasEa = !!college.deadlines.ea;
              return (
                <div
                  key={college.id}
                  onClick={() => toggleCollege(college.id)}
                  style={{
                    background: isSelected ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                    border: isSelected ? "1.5px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "1rem",
                    padding: "1rem 1.25rem",
                    cursor: selectedIds.size >= 20 && !isSelected ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    opacity: selectedIds.size >= 20 && !isSelected ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "0.95rem", marginBottom: "0.2rem", lineHeight: 1.3 }}>{college.name}</div>
                      <div style={{ color: "#64748b", fontSize: "0.8rem", marginBottom: "0.6rem" }}>{college.location}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                        {hasEd && <span style={{ background: "rgba(236,72,153,0.15)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.25)", borderRadius: "0.35rem", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>ED {college.deadlines.ed}</span>}
                        {hasEa && <span style={{ background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "0.35rem", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>EA {college.deadlines.ea}</span>}
                        {college.deadlines.ed2 && <span style={{ background: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.25)", borderRadius: "0.35rem", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>ED2 {college.deadlines.ed2}</span>}
                        <span style={{ background: "rgba(14,165,233,0.15)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.25)", borderRadius: "0.35rem", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 600 }}>RD {college.deadlines.rd}</span>
                      </div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", border: isSelected ? "2px solid #6366f1" : "2px solid #334155", background: isSelected ? "#6366f1" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const selectedColleges = COLLEGES.filter((c) => selectedIds.has(c.id));

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "'Inter', -apple-system, sans-serif", color: "#f8fafc" }}>
      {/* Header */}
      <div style={{ background: "rgba(15,23,42,0.97)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "1rem 1.5rem", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(10px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1.5rem" }}>🎓</span>
            <div>
              <div style={{ color: "#a5b4fc", fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Edutracker</div>
              <div style={{ color: "#f8fafc", fontWeight: 700, fontSize: "1.1rem" }}>
                {onboardingName ? `${onboardingName}'s` : "My"} College Deadlines
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => { persist({ step: "select" }); setStep("select"); }}
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", borderRadius: "0.65rem", padding: "0.5rem 1rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
            >
              + Add Schools
            </button>
            <button
              onClick={handleReset}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#64748b", borderRadius: "0.65rem", padding: "0.5rem 1rem", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem" }}>
        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
          {[
            { label: "Schools Tracking", value: selectedIds.size, icon: "🏫", color: "#818cf8" },
            { label: "Total Deadlines", value: savedDeadlines.length, icon: "📅", color: "#38bdf8" },
            { label: "Urgent (<14 days)", value: urgentCount, icon: "🔴", color: "#ef4444" },
            { label: "Next Deadline", value: nextDeadline ? `${daysUntil(nextDeadline.date)}d` : "—", icon: "⏰", color: "#f59e0b" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.1rem 1.25rem" }}>
              <div style={{ fontSize: "1.4rem", marginBottom: "0.35rem" }}>{stat.icon}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "0.25rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Next Deadline Banner */}
        {nextDeadline && daysUntil(nextDeadline.date) < 30 && (
          <div style={{ background: daysUntil(nextDeadline.date) < 14 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)", border: `1px solid ${daysUntil(nextDeadline.date) < 14 ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`, borderRadius: "1rem", padding: "1rem 1.5rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ fontSize: "1.5rem" }}>{daysUntil(nextDeadline.date) < 14 ? "🚨" : "⚠️"}</div>
            <div>
              <div style={{ fontWeight: 700, color: daysUntil(nextDeadline.date) < 14 ? "#fca5a5" : "#fcd34d", fontSize: "0.95rem" }}>
                {daysUntil(nextDeadline.date) === 0 ? "Due TODAY" : `${daysUntil(nextDeadline.date)} days left`}: {nextDeadline.collegeName} — {DEADLINE_LABELS[nextDeadline.type]}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.82rem" }}>
                {new Date(nextDeadline.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.85rem", padding: "0.3rem", width: "fit-content" }}>
          {(["timeline", "list"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ padding: "0.5rem 1.25rem", borderRadius: "0.65rem", border: "none", background: activeTab === tab ? "rgba(99,102,241,0.25)" : "transparent", color: activeTab === tab ? "#a5b4fc" : "#64748b", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer", textTransform: "capitalize" }}
            >
              {tab === "timeline" ? "📋 By School" : "📆 Timeline"}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {(["all", "ea", "ed", "ed2", "rd", "faid"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "2rem",
                  border: "1px solid",
                  borderColor: filterType === t ? (t === "all" ? "#6366f1" : DEADLINE_COLORS[t as DeadlineType] || "#6366f1") : "rgba(255,255,255,0.1)",
                  background: filterType === t ? (t === "all" ? "rgba(99,102,241,0.2)" : `${DEADLINE_COLORS[t as DeadlineType]}22`) : "transparent",
                  color: filterType === t ? (t === "all" ? "#a5b4fc" : DEADLINE_COLORS[t as DeadlineType]) : "#64748b",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t === "all" ? "All Types" : t === "faid" ? "Fin. Aid" : t.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {(["all", "urgent", "soon", "upcoming", "past"] as const).map((u) => (
              <button
                key={u}
                onClick={() => setFilterUrgency(u)}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: "2rem",
                  border: `1px solid`,
                  borderColor: filterUrgency === u ? (u === "urgent" ? "#ef4444" : u === "soon" ? "#f59e0b" : u === "upcoming" ? "#22c55e" : "rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)",
                  background: filterUrgency === u ? (u === "urgent" ? "rgba(239,68,68,0.15)" : u === "soon" ? "rgba(245,158,11,0.15)" : u === "upcoming" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)") : "transparent",
                  color: filterUrgency === u ? (u === "urgent" ? "#fca5a5" : u === "soon" ? "#fcd34d" : u === "upcoming" ? "#86efac" : "#94a3b8") : "#64748b",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {u === "all" ? "All" : u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "date" | "school" | "urgency")}
            style={{ marginLeft: "auto", padding: "0.4rem 0.85rem", borderRadius: "0.65rem", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: "0.82rem", outline: "none" }}
          >
            <option value="date">Sort: Date</option>
            <option value="school">Sort: School</option>
            <option value="urgency">Sort: Urgency</option>
          </select>
        </div>

        {/* By School View */}
        {activeTab === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {selectedColleges.map((college) => {
              const cDeadlines = groupedBySchool[college.id] || [];
              const minDays = Math.min(...cDeadlines.map((d) => daysUntil(d.date)).filter((d) => d >= 0));
              const isExpanded = expandedSchool === college.id;
              return (
                <div key={college.id} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", overflow: "hidden" }}>
                  <div
                    onClick={() => setExpandedSchool(isExpanded ? null : college.id)}
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "1rem", justifyContent: "space-between" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                      <div style={{ width: 4, height: 40, borderRadius: 2, background: isFinite(minDays) ? urgencyColor(minDays) : "#334155", flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>{college.name}</div>
                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>{college.location} · {cDeadlines.length} deadlines</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", align: "center", gap: "0.75rem", flexShrink: 0, alignItems: "center" }}>
                      {isFinite(minDays) && (
                        <div style={{ background: urgencyBg(minDays), border: `1px solid ${urgencyColor(minDays)}44`, borderRadius: "2rem", padding: "0.25rem 0.75rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: urgencyColor(minDays) }} />
                          <span style={{ color: urgencyColor(minDays), fontSize: "0.78rem", fontWeight: 700 }}>{minDays}d</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeCollege(college.id); }}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: "1rem", padding: "0.25rem" }}
                      >
                        ✕
                      </button>
                      <span style={{ color: "#475569", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "1rem 1.25rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                        {(["ed", "ea", "ed2", "rd", "faid"] as DeadlineType[]).map((type) => {
                          const date = college.deadlines[type];
                          if (!date) return null;
                          const days = daysUntil(date);
                          return (
                            <div key={type} style={{ background: urgencyBg(days), border: `1px solid ${urgencyColor(days)}33`, borderRadius: "0.75rem", padding: "0.85rem 1rem" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                                <span style={{ background: `${DEADLINE_COLORS[type]}22`, color: DEADLINE_COLORS[type], border: `1px solid ${DEADLINE_COLORS[type]}44`, borderRadius: "0.35rem", padding: "0.1rem 0.5rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                                  {type === "faid" ? "Fin. Aid" : type.toUpperCase()}
                                </span>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: urgencyColor(days) }}>{days < 0 ? "Passed" : `${days}d left`}</span>
                              </div>
                              <div style={{ color: "#1e293b", fontWeight: 700, fontSize: "0.9rem" }}>
                                {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </div>
                              <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.2rem" }}>{DEADLINE_LABELS[type]}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Timeline View */}
        {activeTab === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {sortedDeadlines.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#475569" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</div>
                <div>No deadlines match your filters.</div>
              </div>
            )}
            {sortedDeadlines.map((d, i) => {
              const days = daysUntil(d.date);
              return (
                <div
                  key={`${d.collegeId}-${d.type}-${i}`}
                  style={{ background: urgencyBg(days), border: `1px solid ${urgencyColor(days)}33`, borderRadius: "0.85rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}
                >
                  <div style={{ width: 4, height: 44, borderRadius: 2, background: urgencyColor(days), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.95rem" }}>{d.collegeName}</div>
                    <div style={{ color: "#475569", fontSize: "0.8rem", marginTop: "0.1rem" }}>{DEADLINE_LABELS[d.type]}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "#1e293b", fontWeight: 700, fontSize: "0.9rem" }}>
                      {new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </div>
                    <div style={{ color: "#64748b", fontSize: "0.75rem" }}>
                      {new Date(d.date).toLocaleDateString("en-US", { year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ background: `${DEADLINE_COLORS[d.type]}22`, color: DEADLINE_COLORS[d.type], border: `1px solid ${DEADLINE_COLORS[d.type]}44`, borderRadius: "0.35rem", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                      {d.type === "faid" ? "Fin. Aid" : d.type.toUpperCase()}
                    </span>
                    <div style={{ minWidth: 80, textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "white", border: `1px solid ${urgencyColor(days)}44`, borderRadius: "2rem", padding: "0.25rem 0.75rem" }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: urgencyColor(days) }} />
                        <span style={{ color: urgencyColor(days), fontSize: "0.78rem", fontWeight: 700 }}>
                          {days < 0 ? "Passed" : days === 0 ? "Today!" : `${days}d`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: "2rem", padding: "1rem 1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.85rem", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#475569", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Urgency:</span>
          {[["#ef4444", "< 14 days"], ["#f59e0b", "14–30 days"], ["#22c55e", "> 30 days"], ["#94a3b8", "Past"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <span style={{ color: "#64748b", fontSize: "0.78rem" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}