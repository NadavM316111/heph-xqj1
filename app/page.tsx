"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: {
    ED?: string;
    ED2?: string;
    EA?: string;
    REA?: string;
    RD: string;
    scholarship?: string;
  };
}

interface MyDeadline {
  id: number;
  college_id: string;
  deadline_type: string;
  deadline_date: string;
  college_name: string;
  notes: string;
}

interface UserProfile {
  email: string;
  phone?: string;
  notify_email: boolean;
  notify_sms: boolean;
}

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-01", scholarship: "2025-02-15" } },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", type: "Private", deadlines: { REA: "2024-11-01", RD: "2025-01-01" } },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", type: "Private", deadlines: { REA: "2024-11-01", RD: "2025-01-02" } },
  { id: "yale", name: "Yale University", location: "New Haven, CT", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-02" } },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", type: "Private", deadlines: { REA: "2024-11-01", RD: "2025-01-01" } },
  { id: "columbia", name: "Columbia University", location: "New York, NY", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "upenn", name: "University of Pennsylvania", location: "Philadelphia, PA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "brown", name: "Brown University", location: "Providence, RI", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-05" } },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-02" } },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-02" } },
  { id: "duke", name: "Duke University", location: "Durham, NC", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-02" } },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01", scholarship: "2024-12-01" } },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "uchicago", name: "University of Chicago", location: "Chicago, IL", type: "Private", deadlines: { EA: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-06" } },
  { id: "washu", name: "Washington University in St. Louis", location: "St. Louis, MO", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-02", scholarship: "2024-12-01" } },
  { id: "jhu", name: "Johns Hopkins University", location: "Baltimore, MD", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-02" } },
  { id: "rice", name: "Rice University", location: "Houston, TX", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01", scholarship: "2024-12-01" } },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01", scholarship: "2024-11-15" } },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-10" } },
  { id: "notre-dame", name: "University of Notre Dame", location: "Notre Dame, IN", type: "Private", deadlines: { REA: "2024-11-01", RD: "2025-01-01" } },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "nyu", name: "New York University", location: "New York, NY", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-15", scholarship: "2024-12-01" } },
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-01" } },
  { id: "bu", name: "Boston University", location: "Boston, MA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-02", scholarship: "2024-12-01" } },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-15", RD: "2025-01-15", scholarship: "2024-11-15" } },
  { id: "wake-forest", name: "Wake Forest University", location: "Winston-Salem, NC", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-01" } },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-15" } },
  { id: "case-western", name: "Case Western Reserve University", location: "Cleveland, OH", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-15", scholarship: "2024-12-01" } },
  { id: "fordham", name: "Fordham University", location: "New York, NY", type: "Private", deadlines: { EA: "2024-11-01", ED: "2024-11-01", RD: "2025-01-15" } },
  { id: "villanova", name: "Villanova University", location: "Villanova, PA", type: "Private", deadlines: { EA: "2024-11-01", RD: "2025-01-15" } },
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", type: "Private", deadlines: { EA: "2024-11-01", ED: "2024-11-01", RD: "2025-01-01" } },
  { id: "american", name: "American University", location: "Washington, DC", type: "Private", deadlines: { EA: "2024-11-15", ED: "2024-11-15", RD: "2025-01-15", scholarship: "2024-12-01" } },
  { id: "gwu", name: "George Washington University", location: "Washington, DC", type: "Private", deadlines: { EA: "2024-11-01", ED: "2024-11-01", RD: "2025-01-05" } },
  { id: "miami", name: "University of Miami", location: "Coral Gables, FL", type: "Private", deadlines: { EA: "2024-11-01", ED: "2024-11-01", RD: "2025-02-01", scholarship: "2024-11-01" } },
  { id: "smu", name: "Southern Methodist University", location: "Dallas, TX", type: "Private", deadlines: { EA: "2024-11-01", ED: "2024-11-01", RD: "2025-01-15", scholarship: "2024-11-01" } },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-15", scholarship: "2024-12-01" } },
  { id: "uiuc", name: "University of Illinois Urbana-Champaign", location: "Champaign, IL", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-05" } },
  { id: "umich", name: "University of Michigan", location: "Ann Arbor, MI", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-01" } },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-01-15" } },
  { id: "uga", name: "University of Georgia", location: "Athens, GA", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-01-15", scholarship: "2024-10-15" } },
  { id: "uva", name: "University of Virginia", location: "Charlottesville, VA", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-01" } },
  { id: "ucb", name: "UC Berkeley", location: "Berkeley, CA", type: "Public", deadlines: { RD: "2024-11-30" } },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", type: "Public", deadlines: { RD: "2024-11-30" } },
  { id: "ucsd", name: "UC San Diego", location: "La Jolla, CA", type: "Public", deadlines: { RD: "2024-11-30" } },
  { id: "ucsb", name: "UC Santa Barbara", location: "Santa Barbara, CA", type: "Public", deadlines: { RD: "2024-11-30" } },
  { id: "ucdavis", name: "UC Davis", location: "Davis, CA", type: "Public", deadlines: { RD: "2024-11-30" } },
  { id: "uw", name: "University of Washington", location: "Seattle, WA", type: "Public", deadlines: { EA: "2024-11-15", RD: "2025-01-15" } },
  { id: "osu", name: "Ohio State University", location: "Columbus, OH", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-01", scholarship: "2024-12-01" } },
  { id: "penn-state", name: "Penn State University", location: "University Park, PA", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-01" } },
  { id: "ut-austin", name: "UT Austin", location: "Austin, TX", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-12-01" } },
  { id: "florida", name: "University of Florida", location: "Gainesville, FL", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-03-01", scholarship: "2024-10-15" } },
  { id: "fsu", name: "Florida State University", location: "Tallahassee, FL", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-03-01" } },
  { id: "colorado", name: "University of Colorado Boulder", location: "Boulder, CO", type: "Public", deadlines: { EA: "2024-11-15", RD: "2025-01-15" } },
  { id: "arizona", name: "University of Arizona", location: "Tucson, AZ", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-05-01", scholarship: "2024-12-01" } },
  { id: "asu", name: "Arizona State University", location: "Tempe, AZ", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-01", scholarship: "2024-12-01" } },
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-01-07" } },
  { id: "william-mary", name: "William & Mary", location: "Williamsburg, VA", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-15" } },
  { id: "unc-charlotte", name: "UNC Charlotte", location: "Charlotte, NC", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-02-01" } },
  { id: "pitt", name: "University of Pittsburgh", location: "Pittsburgh, PA", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-15", scholarship: "2024-11-01" } },
  { id: "rutgers", name: "Rutgers University", location: "New Brunswick, NJ", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-12-01" } },
  { id: "stonybrook", name: "Stony Brook University", location: "Stony Brook, NY", type: "Public", deadlines: { EA: "2024-11-15", RD: "2025-01-15" } },
  { id: "indiana", name: "Indiana University Bloomington", location: "Bloomington, IN", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-02-01", scholarship: "2024-12-01" } },
  { id: "msu", name: "Michigan State University", location: "East Lansing, MI", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-04-01" } },
  { id: "minnesota", name: "University of Minnesota", location: "Minneapolis, MN", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-15" } },
  { id: "maryland", name: "University of Maryland", location: "College Park, MD", type: "Public", deadlines: { EA: "2024-11-01", RD: "2025-01-20" } },
  { id: "iowa", name: "University of Iowa", location: "Iowa City, IA", type: "Public", deadlines: { EA: "2024-10-15", RD: "2025-04-01", scholarship: "2024-12-01" } },
  { id: "wustl-2", name: "Brandeis University", location: "Waltham, MA", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-15" } },
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-15" } },
  { id: "colby", name: "Colby College", location: "Waterville, ME", type: "Private", deadlines: { ED: "2024-11-15", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", type: "Private", deadlines: { ED: "2024-11-15", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-01", RD: "2025-01-01" } },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-01" } },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-09" } },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-15" } },
  { id: "harvey-mudd", name: "Harvey Mudd College", location: "Claremont, CA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-05" } },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-08" } },
  { id: "claremont-mckenna", name: "Claremont McKenna College", location: "Claremont, CA", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-08" } },
  { id: "wesleyan", name: "Wesleyan University", location: "Middletown, CT", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-01" } },
  { id: "vassar", name: "Vassar College", location: "Poughkeepsie, NY", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-01" } },
  { id: "smith", name: "Smith College", location: "Northampton, MA", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-15" } },
  { id: "macalester", name: "Macalester College", location: "Saint Paul, MN", type: "Private", deadlines: { ED: "2024-11-01", RD: "2025-01-15" } },
  { id: "grinnell", name: "Grinnell College", location: "Grinnell, IA", type: "Private", deadlines: { ED: "2024-11-15", RD: "2025-01-15" } },
  { id: "oberlin", name: "Oberlin College", location: "Oberlin, OH", type: "Private", deadlines: { ED: "2024-11-01", ED2: "2025-01-02", RD: "2025-01-15" } },
];

const DEADLINE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ED:  { label: "Early Decision",    color: "#7c3aed", bg: "#ede9fe" },
  ED2: { label: "Early Decision II", color: "#6d28d9", bg: "#ddd6fe" },
  EA:  { label: "Early Action",      color: "#0369a1", bg: "#e0f2fe" },
  REA: { label: "Restrictive EA",    color: "#0e7490", bg: "#cffafe" },
  RD:  { label: "Regular Decision",  color: "#065f46", bg: "#d1fae5" },
  scholarship: { label: "Scholarship", color: "#b45309", bg: "#fef3c7" },
};

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function urgencyBadge(days: number): { text: string; bg: string; color: string } {
  if (days < 0)   return { text: "Past",         bg: "#f3f4f6", color: "#9ca3af" };
  if (days === 0) return { text: "TODAY",         bg: "#dc2626", color: "#fff" };
  if (days <= 1)  return { text: "Tomorrow",      bg: "#dc2626", color: "#fff" };
  if (days <= 7)  return { text: `${days}d left`, bg: "#f97316", color: "#fff" };
  if (days <= 14) return { text: `${days}d left`, bg: "#eab308", color: "#1a1a1a" };
  if (days <= 30) return { text: `${days}d left`, bg: "#3b82f6", color: "#fff" };
  return { text: `${days}d left`, bg: "#6b7280", color: "#fff" };
}

type Tab = "dashboard" | "search" | "reminders" | "account";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [myDeadlines, setMyDeadlines] = useState<MyDeadline[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Public" | "Private">("All");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, string[]>>({});
  const [profilePhone, setProfilePhone] = useState("");
  const [profileNotifyEmail, setProfileNotifyEmail] = useState(true);
  const [profileNotifySMS, setProfileNotifySMS] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "urgency">("urgency");
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    const stored = localStorage.getItem("edutracker_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const loadMyData = useCallback(async (email: string) => {
    const [dlRes, prRes] = await Promise.all([
      fetch(`/api/deadlines?email=${encodeURIComponent(email)}`),
      fetch(`/api/profile?email=${encodeURIComponent(email)}`),
    ]);
    if (dlRes.ok) {
      const data = await dlRes.json();
      setMyDeadlines(data.deadlines || []);
    }
    if (prRes.ok) {
      const data = await prRes.json();
      if (data.profile) {
        setProfile(data.profile);
        setProfilePhone(data.profile.phone || "");
        setProfileNotifyEmail(data.profile.notify_email ?? true);
        setProfileNotifySMS(data.profile.notify_sms ?? false);
      }
    }
  }, []);

  useEffect(() => {
    if (user) loadMyData(user.email);
  }, [user, loadMyData]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
    });
    const data = await res.json();
    setAuthLoading(false);
    if (data.ok) {
      const u = { email: data.email };
      setUser(u);
      localStorage.setItem("edutracker_user", JSON.stringify(u));
    } else {
      setAuthError(data.error || "Something went wrong");
    }
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("edutracker_user");
    setMyDeadlines([]);
    setProfile(null);
    setTab("dashboard");
  }

  async function addDeadlines(college: College) {
    if (!user) return;
    const types = selectedTypes[college.id] || [];
    if (types.length === 0) return;
    setAddingId(college.id);
    for (const dtype of types) {
      const dateVal = college.deadlines[dtype as keyof typeof college.deadlines];
      if (!dateVal) continue;
      await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, college_id: college.id, college_name: college.name, deadline_type: dtype, deadline_date: dateVal }),
      });
    }
    await loadMyData(user.email);
    setAddingId(null);
    setSelectedTypes(prev => ({ ...prev, [college.id]: [] }));
  }

  async function removeDeadline(id: number) {
    if (!user) return;
    await fetch(`/api/deadlines?id=${id}&email=${encodeURIComponent(user.email)}`, { method: "DELETE" });
    setMyDeadlines(prev => prev.filter(d => d.id !== id));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileMsg("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, phone: profilePhone, notify_email: profileNotifyEmail, notify_sms: profileNotifySMS }),
    });
    const data = await res.json();
    setProfileSaving(false);
    setProfileMsg(data.ok ? "Saved successfully!" : data.error || "Error saving");
  }

  const toggleDeadlineType = (collegeId: string, dtype: string) => {
    setSelectedTypes(prev => {
      const cur = prev[collegeId] || [];
      return { ...prev, [collegeId]: cur.includes(dtype) ? cur.filter(x => x !== dtype) : [...cur, dtype] };
    });
  };

  const filteredColleges = COLLEGES.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchName = c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
    const matchType = filterType === "All" || c.type === filterType;
    return matchName && matchType;
  });

  const addedCollegeIds = new Set(myDeadlines.map(d => d.college_id));

  const sortedDeadlines = [...myDeadlines].filter(d => showPast || daysUntil(d.deadline_date) >= 0).sort((a, b) => {
    if (sortBy === "date" || sortBy === "urgency") {
      return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
    }
    return a.college_name.localeCompare(b.college_name);
  });

  const upcomingCount = myDeadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 30; }).length;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎓</div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#64748b", margin: "8px 0 0", fontSize: "15px" }}>Never miss a college application deadline</p>
          </div>
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "8px", padding: "4px", marginBottom: "24px" }}>
            {(["login", "signup"] as const).map(m => (
              <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "14px", transition: "all 0.2s", background: authMode === m ? "#fff" : "transparent", color: authMode === m ? "#0f172a" : "#64748b", boxShadow: authMode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form onSubmit={handleAuth}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email</label>
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", marginBottom: "16px", boxSizing: "border-box", outline: "none" }} />
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password</label>
            <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", marginBottom: "20px", boxSizing: "border-box", outline: "none" }} />
            {authError && <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 16px", background: "#fef2f2", padding: "10px 12px", borderRadius: "8px" }}>{authError}</p>}
            <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: authLoading ? "#94a3b8" : "#1e40af", color: "#fff", fontWeight: 700, fontSize: "15px", cursor: authLoading ? "not-allowed" : "pointer" }}>
              {authLoading ? "Loading…" : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: "#0f172a", color: "#fff", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "60px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🎓</span>
          <span style={{ fontWeight: 800, fontSize: "18px" }}>Edutracker</span>
          {upcomingCount > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "12px", padding: "2px 8px", fontSize: "12px", fontWeight: 700 }}>{upcomingCount} soon</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>{user.email}</span>
          <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid #475569", color: "#94a3b8", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Logout</button>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ background: "#1e293b", display: "flex", padding: "0 24px", gap: "4px" }}>
        {([
          { id: "dashboard", label: "📋 My Deadlines", count: myDeadlines.filter(d => daysUntil(d.deadline_date) >= 0).length },
          { id: "search",    label: "🔍 Find Colleges", count: null },
          { id: "reminders", label: "🔔 Reminders",    count: null },
          { id: "account",   label: "👤 Account",      count: null },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "12px 16px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 600, borderBottom: tab === t.id ? "2px solid #3b82f6" : "2px solid transparent", background: "transparent", color: tab === t.id ? "#fff" : "#94a3b8", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "6px" }}>
            {t.label}
            {t.count !== null && t.count > 0 && <span style={{ background: "#3b82f6", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "11px" }}>{t.count}</span>}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px" }}>

        {/* DASHBOARD */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>My Application Deadlines</h2>
                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>{myDeadlines.filter(d => daysUntil(d.deadline_date) >= 0).length} upcoming · {myDeadlines.length} total</p>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "13px", background: "#fff", cursor: "pointer" }}>
                  <option value="urgency">Sort: Most Urgent</option>
                  <option value="date">Sort: By Date</option>
                  <option value="name">Sort: By School</option>
                </select>
                <label style={{ fontSize: "13px", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <input type="checkbox" checked={showPast} onChange={e => setShowPast(e.target.checked)} />
                  Show past
                </label>
              </div>
            </div>

            {sortedDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "16px", border: "2px dashed #e2e8f0" }}>
                <div style={{ fontSize: "52px", marginBottom: "12px" }}>🏫</div>
                <h3 style={{ color: "#374151", margin: "0 0 8px" }}>No deadlines yet</h3>
                <p style={{ color: "#9ca3af", margin: "0 0 20px" }}>Search for colleges and add their deadlines to get started.</p>
                <button onClick={() => setTab("search")} style={{ background: "#1e40af", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Find Colleges →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {sortedDeadlines.map(dl => {
                  const days = daysUntil(dl.deadline_date);
                  const badge = urgencyBadge(days);
                  const dlInfo = DEADLINE_LABELS[dl.deadline_type] || { label: dl.deadline_type, color: "#374151", bg: "#f3f4f6" };
                  const dateObj = new Date(dl.deadline_date + "T00:00:00");
                  return (
                    <div key={dl.id} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: days < 0 ? "1px solid #f3f4f6" : days <= 7 ? "1px solid #fecaca" : "1px solid #e2e8f0", opacity: days < 0 ? 0.6 : 1, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "200px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: dlInfo.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: "18px" }}>
                            {dl.deadline_type === "scholarship" ? "💰" : dl.deadline_type === "RD" ? "📝" : dl.deadline_type.startsWith("ED") ? "⭐" : "🎯"}
                          </span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{dl.college_name}</div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: dlInfo.color, background: dlInfo.bg, padding: "2px 8px", borderRadius: "12px" }}>{dlInfo.label}</span>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: "5px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap" }}>{badge.text}</span>
                        <button onClick={() => removeDeadline(dl.id)} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#ef4444", padding: "5px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {myDeadlines.length > 0 && (
              <div style={{ marginTop: "24px", background: "#fff", borderRadius: "12px", padding: "16px 20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Urgency Legend</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { bg: "#dc2626", color: "#fff", text: "Today / Tomorrow" },
                    { bg: "#f97316", color: "#fff", text: "≤7 days" },
                    { bg: "#eab308", color: "#1a1a1a", text: "≤14 days" },
                    { bg: "#3b82f6", color: "#fff", text: "≤30 days" },
                    { bg: "#6b7280", color: "#fff", text: ">30 days" },
                  ].map(b => (
                    <span key={b.text} style={{ background: b.bg, color: b.color, padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{b.text}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEARCH */}
        {tab === "search" && (
          <div>
            <h2 style={{ margin: "0 0 16px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Find Colleges</h2>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or location…" style={{ flex: 1, minWidth: "200px", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", outline: "none" }} />
              {(["All", "Public", "Private"] as const).map(t => (
                <button key={t} onClick={() => setFilterType(t)} style={{ padding: "10px 18px", borderRadius: "8px", border: "1.5px solid", borderColor: filterType === t ? "#1e40af" : "#e2e8f0", background: filterType === t ? "#1e40af" : "#fff", color: filterType === t ? "#fff" : "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>{t}</button>
              ))}
            </div>
            <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>{filteredColleges.length} colleges · Click deadline types to select, then click Add</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredColleges.map(college => {
                const isAdded = addedCollegeIds.has(college.id);
                const selected = selectedTypes[college.id] || [];
                return (
                  <div key={college.id} style={{ background: "#fff", borderRadius: "12px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>{college.name}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{college.location}</span>
                          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: college.type === "Public" ? "#dbeafe" : "#fce7f3", color: college.type === "Public" ? "#1e40af" : "#9d174d", fontWeight: 600 }}>{college.type}</span>
                          {isAdded && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "#d1fae5", color: "#065f46", fontWeight: 600 }}>✓ Added</span>}
                        </div>
                        <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                          {Object.entries(college.deadlines).map(([dtype, date]) => {
                            const info = DEADLINE_LABELS[dtype] || { label: dtype, color: "#374151", bg: "#f3f4f6" };
                            const days = daysUntil(date);
                            const isSelected = selected.includes(dtype);
                            const dateObj = new Date(date + "T00:00:00");
                            return (
                              <button key={dtype} onClick={() => toggleDeadlineType(college.id, dtype)} style={{ padding: "5px 10px", borderRadius: "8px", border: `2px solid ${isSelected ? info.color : "#e2e8f0"}`, background: isSelected ? info.bg : "#f8fafc", color: isSelected ? info.color : "#374151", cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.15s" }}>
                                {dtype} · {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                {days >= 0 && days <= 30 && <span style={{ marginLeft: "4px", color: days <= 7 ? "#dc2626" : "#f97316" }}>({days}d)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={() => addDeadlines(college)} disabled={selected.length === 0 || addingId === college.id} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", background: selected.length === 0 ? "#e2e8f0" : "#1e40af", color: selected.length === 0 ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: "13px", cursor: selected.length === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                        {addingId === college.id ? "Adding…" : `Add ${selected.length > 0 ? `(${selected.length})` : ""}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REMINDERS */}
        {tab === "reminders" && (
          <div style={{ maxWidth: "600px" }}>
            <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Reminder Settings</h2>
            <p style={{ color: "#64748b", marginBottom: "24px", fontSize: "14px" }}>Get notified 30, 14, 7, and 1 day before each deadline.</p>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Notification Channels</h3>
              <form onSubmit={saveProfile}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}>
                  <input type="checkbox" checked={profileNotifyEmail} onChange={e => setProfileNotifyEmail(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#1e40af" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>📧 Email Reminders</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>Sent to {user.email}</div>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", cursor: "pointer" }}>
                  <input type="checkbox" checked={profileNotifySMS} onChange={e => setProfileNotifySMS(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#1e40af" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>📱 SMS Reminders</div>
                    <div style={{ color: "#64748b", fontSize: "12px" }}>Enter your phone number below</div>
                  </div>
                </label>

                {profileNotifySMS && (
                  <div style={{ marginBottom: "16px", marginLeft: "26px" }}>
                    <input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+1 555 000 0000" type="tel" style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #e2e8f0", fontSize: "14px", boxSizing: "border-box" }} />
                  </div>
                )}

                <button type="submit" disabled={profileSaving} style={{ background: profileSaving ? "#94a3b8" : "#1e40af", color: "#fff", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: 700, cursor: profileSaving ? "not-allowed" : "pointer", fontSize: "14px" }}>
                  {profileSaving ? "Saving…" : "Save Preferences"}
                </button>
                {profileMsg && <p style={{ marginTop: "12px", fontSize: "13px", color: profileMsg.includes("Error") ? "#dc2626" : "#059669" }}>{profileMsg}</p>}
              </form>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Reminder Schedule</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { days: 30, icon: "📅", label: "30 days before", desc: "Early heads-up to start preparing" },
                  { days: 14, icon: "📌", label: "14 days before", desc: "Time to finalize your essays" },
                  { days: 7,  icon: "⚠️", label: "7 days before",  desc: "One week countdown" },
                  { days: 1,  icon: "🚨", label: "1 day before",   desc: "Final reminder — submit today!" },
                ].map(r => (
                  <div key={r.days} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                    <span style={{ fontSize: "22px" }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>{r.label}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCOUNT */}
        {tab === "account" && (
          <div style={{ maxWidth: "500px" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>Account</h2>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "22px", fontWeight: 700 }}>
                  {user.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a" }}>{user.email}</div>
                  <div style={{ color: "#64748b", fontSize: "13px" }}>{myDeadlines.length} deadline{myDeadlines.length !== 1 ? "s" : ""} tracked</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                {[
                  { label: "Total", value: myDeadlines.length, color: "#1e40af" },
                  { label: "Upcoming (30d)", value: upcomingCount, color: "#f97316" },
                  { label: "Past", value: myDeadlines.filter(d => daysUntil(d.deadline_date) < 0).length, color: "#6b7280" },
                ].map(stat => (
                  <div key={stat.label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <button onClick={handleLogout} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1.5px solid #fca5a5", background: "#fff5f5", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>Sign Out</button>
            </div>

            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700 }}>Upcoming Deadlines Summary</h3>
              {myDeadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 30; }).length === 0
                ? <p style={{ color: "#9ca3af", fontSize: "14px" }}>No deadlines in the next 30 days.</p>
                : myDeadlines.filter(d => { const days = daysUntil(d.deadline_date); return days >= 0 && days <= 30; }).sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()).map(dl => {
                  const days = daysUntil(dl.deadline_date);
                  const badge = urgencyBadge(days);
                  return (
                    <div key={dl.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600 }}>{dl.college_name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{dl.deadline_type} · {new Date(dl.deadline_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                      </div>
                      <span style={{ background: badge.bg, color: badge.color, padding: "3px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>{badge.text}</span>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}
      </main>
    </div>
  );
}