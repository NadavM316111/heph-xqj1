"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: {
    ea?: string;
    ed?: string;
    ed2?: string;
    rd: string;
    scholarship?: string;
  };
  acceptance_rate?: string;
  logo_color: string;
}

interface TrackedDeadline {
  college_id: string;
  college_name: string;
  deadline_type: string;
  deadline_date: string;
  reminder_30: boolean;
  reminder_7: boolean;
  reminder_1: boolean;
  notes: string;
}

interface UserData {
  email: string;
  phone?: string;
  grad_year?: string;
  selected_schools: string[];
  tracked_deadlines: TrackedDeadline[];
  reminders_enabled: boolean;
  sms_enabled: boolean;
  onboarded: boolean;
}

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "4%", logo_color: "#A31F34" },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "3%", logo_color: "#A51C30" },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "4%", logo_color: "#8C1515" },
  { id: "yale", name: "Yale University", location: "New Haven, CT", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "5%", logo_color: "#00356B" },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "4%", logo_color: "#FF6B00" },
  { id: "columbia", name: "Columbia University", location: "New York, NY", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "4%", logo_color: "#003DA5" },
  { id: "upenn", name: "UPenn", location: "Philadelphia, PA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-07", scholarship: "2024-11-01" }, acceptance_rate: "7%", logo_color: "#011F5B" },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-07", scholarship: "2024-11-01" }, acceptance_rate: "8%", logo_color: "#00693E" },
  { id: "brown", name: "Brown University", location: "Providence, RI", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-05", scholarship: "2024-11-01" }, acceptance_rate: "5%", logo_color: "#4E3629" },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "11%", logo_color: "#B31B1B" },
  { id: "duke", name: "Duke University", location: "Durham, NC", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-10-15" }, acceptance_rate: "6%", logo_color: "#012169" },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "9%", logo_color: "#866D4B" },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "7%", logo_color: "#4E2A84" },
  { id: "chicago", name: "University of Chicago", location: "Chicago, IL", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-06", scholarship: "2024-11-01" }, acceptance_rate: "6%", logo_color: "#800000" },
  { id: "jhu", name: "Johns Hopkins University", location: "Baltimore, MD", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "7%", logo_color: "#002D72" },
  { id: "rice", name: "Rice University", location: "Houston, TX", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "9%", logo_color: "#002469" },
  { id: "notre_dame", name: "Notre Dame", location: "Notre Dame, IN", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-12-01" }, acceptance_rate: "13%", logo_color: "#003C6C" },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-10", scholarship: "2025-01-10" }, acceptance_rate: "14%", logo_color: "#041E42" },
  { id: "carnegie_mellon", name: "Carnegie Mellon University", location: "Pittsburgh, PA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "15%", logo_color: "#C41230" },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "19%", logo_color: "#002878" },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "15%", logo_color: "#3E8EDE" },
  { id: "washu", name: "Washington University in St. Louis", location: "St. Louis, MO", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-11-01" }, acceptance_rate: "13%", logo_color: "#A51417" },
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01" }, acceptance_rate: "16%", logo_color: "#990000" },
  { id: "wake_forest", name: "Wake Forest University", location: "Winston-Salem, NC", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-15" }, acceptance_rate: "21%", logo_color: "#9E7E38" },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-01" }, acceptance_rate: "13%", logo_color: "#006747" },
  { id: "boston_college", name: "Boston College", location: "Chestnut Hill, MA", type: "Private Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-01-01" }, acceptance_rate: "18%", logo_color: "#8A0000" },
  { id: "bu", name: "Boston University", location: "Boston, MA", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-02", scholarship: "2024-12-01" }, acceptance_rate: "19%", logo_color: "#CC0000" },
  { id: "nyu", name: "New York University", location: "New York, NY", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-05", scholarship: "2024-12-01" }, acceptance_rate: "21%", logo_color: "#57068C" },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", type: "Private Research", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "44%", logo_color: "#653600" },
  { id: "case_western", name: "Case Western Reserve", location: "Cleveland, OH", type: "Private Research", deadlines: { ed: "2024-11-01", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "30%", logo_color: "#0A304E" },
  { id: "uc_berkeley", name: "UC Berkeley", location: "Berkeley, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2025-03-02" }, acceptance_rate: "14%", logo_color: "#003262" },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2025-03-02" }, acceptance_rate: "14%", logo_color: "#2D68C4" },
  { id: "uc_san_diego", name: "UC San Diego", location: "San Diego, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2024-12-01" }, acceptance_rate: "34%", logo_color: "#003B5C" },
  { id: "uc_davis", name: "UC Davis", location: "Davis, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2025-03-01" }, acceptance_rate: "37%", logo_color: "#003366" },
  { id: "uc_santa_barbara", name: "UC Santa Barbara", location: "Santa Barbara, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2025-03-01" }, acceptance_rate: "30%", logo_color: "#003660" },
  { id: "uc_irvine", name: "UC Irvine", location: "Irvine, CA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2025-03-01" }, acceptance_rate: "29%", logo_color: "#003764" },
  { id: "umich", name: "University of Michigan", location: "Ann Arbor, MI", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" }, acceptance_rate: "20%", logo_color: "#00274C" },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", type: "Public Research", deadlines: { ea: "2024-10-15", rd: "2025-01-15", scholarship: "2024-10-15" }, acceptance_rate: "19%", logo_color: "#4B9CD3" },
  { id: "virginia", name: "University of Virginia", location: "Charlottesville, VA", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "20%", logo_color: "#232D4B" },
  { id: "georgia_tech", name: "Georgia Tech", location: "Atlanta, GA", type: "Public Research", deadlines: { ea: "2024-10-15", rd: "2025-01-06", scholarship: "2024-10-15" }, acceptance_rate: "17%", logo_color: "#003057" },
  { id: "ut_austin", name: "UT Austin", location: "Austin, TX", type: "Public Research", deadlines: { ea: "2024-10-15", rd: "2025-12-01", scholarship: "2024-12-01" }, acceptance_rate: "31%", logo_color: "#BF5700" },
  { id: "ohio_state", name: "Ohio State University", location: "Columbus, OH", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" }, acceptance_rate: "57%", logo_color: "#BB0000" },
  { id: "penn_state", name: "Penn State University", location: "State College, PA", type: "Public Research", deadlines: { rd: "2024-11-30", scholarship: "2024-11-30" }, acceptance_rate: "54%", logo_color: "#1E407C" },
  { id: "florida", name: "University of Florida", location: "Gainesville, FL", type: "Public Research", deadlines: { ea: "2024-10-15", rd: "2025-01-01", scholarship: "2024-10-15" }, acceptance_rate: "31%", logo_color: "#003087" },
  { id: "florida_state", name: "Florida State University", location: "Tallahassee, FL", type: "Public Research", deadlines: { rd: "2025-03-01", scholarship: "2025-02-15" }, acceptance_rate: "32%", logo_color: "#782F40" },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" }, acceptance_rate: "67%", logo_color: "#CEB888" },
  { id: "indiana", name: "Indiana University", location: "Bloomington, IN", type: "Public Research", deadlines: { rd: "2025-02-01", scholarship: "2024-12-01" }, acceptance_rate: "80%", logo_color: "#990000" },
  { id: "minnesota", name: "University of Minnesota", location: "Minneapolis, MN", type: "Public Research", deadlines: { rd: "2025-01-01", scholarship: "2024-12-01" }, acceptance_rate: "70%", logo_color: "#7A0019" },
  { id: "colorado", name: "University of Colorado Boulder", location: "Boulder, CO", type: "Public Research", deadlines: { rd: "2025-01-15", scholarship: "2024-12-15" }, acceptance_rate: "84%", logo_color: "#CFB87C" },
  { id: "arizona", name: "University of Arizona", location: "Tucson, AZ", type: "Public Research", deadlines: { rd: "2025-05-01", scholarship: "2024-12-01" }, acceptance_rate: "85%", logo_color: "#AB0520" },
  { id: "arizona_state", name: "Arizona State University", location: "Tempe, AZ", type: "Public Research", deadlines: { rd: "2025-02-01", scholarship: "2024-12-01" }, acceptance_rate: "88%", logo_color: "#8C1D40" },
  { id: "michigan_state", name: "Michigan State University", location: "East Lansing, MI", type: "Public Research", deadlines: { rd: "2025-03-01", scholarship: "2024-12-01" }, acceptance_rate: "83%", logo_color: "#18453B" },
  { id: "rutgers", name: "Rutgers University", location: "New Brunswick, NJ", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-12-01", scholarship: "2024-12-01" }, acceptance_rate: "69%", logo_color: "#CC0033" },
  { id: "illinois", name: "University of Illinois", location: "Champaign, IL", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-01-05", scholarship: "2024-11-01" }, acceptance_rate: "62%", logo_color: "#E84A27" },
  { id: "wisconsin", name: "University of Wisconsin", location: "Madison, WI", type: "Public Research", deadlines: { ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" }, acceptance_rate: "57%", logo_color: "#C5050C" },
  { id: "washington", name: "University of Washington", location: "Seattle, WA", type: "Public Research", deadlines: { rd: "2024-11-15", scholarship: "2024-11-15" }, acceptance_rate: "56%", logo_color: "#4B2E83" },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", type: "Liberal Arts", deadlines: { ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "7%", logo_color: "#3F1F69" },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-10", scholarship: "2024-11-15" }, acceptance_rate: "9%", logo_color: "#500082" },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", type: "Liberal Arts", deadlines: { ed: "2024-11-01", rd: "2025-01-08", scholarship: "2024-11-01" }, acceptance_rate: "8%", logo_color: "#0C2340" },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-02", scholarship: "2024-11-15" }, acceptance_rate: "9%", logo_color: "#8E1C23" },
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", type: "Liberal Arts", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "16%", logo_color: "#0D395F" },
  { id: "colby", name: "Colby College", location: "Waterville, ME", type: "Liberal Arts", deadlines: { ed: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" }, acceptance_rate: "17%", logo_color: "#004F96" },
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-05", scholarship: "2024-11-15" }, acceptance_rate: "9%", logo_color: "#000000" },
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "24%", logo_color: "#821019" },
  { id: "hamilton", name: "Hamilton College", location: "Clinton, NY", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-01", scholarship: "2024-11-15" }, acceptance_rate: "16%", logo_color: "#00407A" },
  { id: "bates", name: "Bates College", location: "Lewiston, ME", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-01", scholarship: "2024-11-15" }, acceptance_rate: "17%", logo_color: "#830000" },
  { id: "wesleyan", name: "Wesleyan University", location: "Middletown, CT", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-01", scholarship: "2024-11-15" }, acceptance_rate: "20%", logo_color: "#CC0000" },
  { id: "oberlin", name: "Oberlin College", location: "Oberlin, OH", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "36%", logo_color: "#CC3333" },
  { id: "vassar", name: "Vassar College", location: "Poughkeepsie, NY", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-01", scholarship: "2024-11-15" }, acceptance_rate: "24%", logo_color: "#821F3A" },
  { id: "carleton", name: "Carleton College", location: "Northfield, MN", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2024-11-15" }, acceptance_rate: "18%", logo_color: "#1E5287" },
  { id: "davidson", name: "Davidson College", location: "Davidson, NC", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-10", scholarship: "2024-11-15" }, acceptance_rate: "20%", logo_color: "#CC0000" },
  { id: "grinnell", name: "Grinnell College", location: "Grinnell, IA", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2024-11-15" }, acceptance_rate: "15%", logo_color: "#C8102E" },
  { id: "denison", name: "Denison University", location: "Granville, OH", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2024-12-01" }, acceptance_rate: "32%", logo_color: "#C8102E" },
  { id: "kenyon", name: "Kenyon College", location: "Gambier, OH", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2024-11-15" }, acceptance_rate: "35%", logo_color: "#4F2984" },
  { id: "colby_sawyer", name: "Holy Cross", location: "Worcester, MA", type: "Liberal Arts", deadlines: { ed: "2024-11-01", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "35%", logo_color: "#602D8E" },
  { id: "union", name: "Union College", location: "Schenectady, NY", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2025-01-15" }, acceptance_rate: "40%", logo_color: "#862633" },
  { id: "connecticut", name: "Connecticut College", location: "New London, CT", type: "Liberal Arts", deadlines: { ed: "2024-11-15", rd: "2025-01-15", scholarship: "2024-11-15" }, acceptance_rate: "37%", logo_color: "#002366" },
];

const DEADLINE_TYPES: { key: string; label: string; color: string; description: string }[] = [
  { key: "ea", label: "Early Action", color: "#f59e0b", description: "Non-binding early application" },
  { key: "ed", label: "Early Decision", color: "#ef4444", description: "Binding early application" },
  { key: "ed2", label: "Early Decision II", color: "#dc2626", description: "Second binding early round" },
  { key: "rd", label: "Regular Decision", color: "#3b82f6", description: "Standard application deadline" },
  { key: "scholarship", label: "Scholarship", color: "#10b981", description: "Merit scholarship deadline" },
];

function getInitialUserData(): UserData {
  if (typeof window === "undefined") return defaultUserData();
  try {
    const stored = localStorage.getItem("edutracker_user");
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultUserData();
}

function defaultUserData(): UserData {
  return {
    email: "",
    phone: "",
    grad_year: "2025",
    selected_schools: [],
    tracked_deadlines: [],
    reminders_enabled: true,
    sms_enabled: false,
    onboarded: false,
  };
}

function saveUserData(data: UserData) {
  if (typeof window !== "undefined") {
    localStorage.setItem("edutracker_user", JSON.stringify(data));
  }
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr);
  deadline.setHours(0, 0, 0, 0);
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getUrgencyColor(days: number): string {
  if (days < 0) return "#6b7280";
  if (days <= 1) return "#dc2626";
  if (days <= 7) return "#f59e0b";
  if (days <= 30) return "#3b82f6";
  return "#10b981";
}

function getUrgencyBg(days: number): string {
  if (days < 0) return "#f3f4f6";
  if (days <= 1) return "#fef2f2";
  if (days <= 7) return "#fffbeb";
  if (days <= 30) return "#eff6ff";
  return "#f0fdf4";
}

export default function HomePage() {
  const [userData, setUserData] = useState<UserData>(defaultUserData());
  const [step, setStep] = useState<"loading" | "auth" | "onboard_schools" | "onboard_reminders" | "dashboard" | "school_detail">("loading");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedDetailCollege, setSelectedDetailCollege] = useState<College | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "all_schools" | "settings">("upcoming");
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});
    const stored = getInitialUserData();
    setUserData(stored);
    if (stored.onboarded && stored.email) {
      setStep("dashboard");
    } else if (stored.email) {
      setStep("onboard_schools");
    } else {
      setStep("auth");
    }
  }, []);

  const updateUserData = useCallback((updates: Partial<UserData>) => {
    setUserData(prev => {
      const next = { ...prev, ...updates };
      saveUserData(next);
      return next;
    });
  }, []);

  const showNotif = (msg: string) => {
    setNotifMessage(msg);
    setTimeout(() => setNotifMessage(""), 3000);
  };

  async function handleAuth() {
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        updateUserData({ email: data.email });
        setStep("onboard_schools");
      } else {
        setAuthError(data.error || "Authentication failed");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthLoading(false);
  }

  function toggleSchool(collegeId: string) {
    const selected = userData.selected_schools.includes(collegeId)
      ? userData.selected_schools.filter(id => id !== collegeId)
      : [...userData.selected_schools, collegeId];

    const college = COLLEGES.find(c => c.id === collegeId);
    let tracked = [...userData.tracked_deadlines];

    if (!userData.selected_schools.includes(collegeId) && college) {
      const newDeadlines = Object.entries(college.deadlines)
        .filter(([, date]) => date && getDaysUntil(date) >= 0)
        .map(([type, date]) => ({
          college_id: collegeId,
          college_name: college.name,
          deadline_type: type,
          deadline_date: date!,
          reminder_30: true,
          reminder_7: true,
          reminder_1: true,
          notes: "",
        }));
      tracked = [...tracked, ...newDeadlines];
    } else {
      tracked = tracked.filter(d => d.college_id !== collegeId);
    }

    updateUserData({ selected_schools: selected, tracked_deadlines: tracked });
  }

  function addSchoolFromDashboard(college: College) {
    if (userData.selected_schools.includes(college.id)) {
      showNotif(`${college.name} is already in your list`);
      return;
    }
    toggleSchool(college.id);
    showNotif(`Added ${college.name} to your list!`);
    setShowAddSchool(false);
  }

  function removeSchool(collegeId: string) {
    const college = COLLEGES.find(c => c.id === collegeId);
    toggleSchool(collegeId);
    showNotif(`Removed ${college?.name || "school"} from your list`);
  }

  function completeOnboarding() {
    updateUserData({ onboarded: true });
    setStep("dashboard");
  }

  const filteredColleges = COLLEGES.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || c.type.toLowerCase().includes(filterType.toLowerCase());
    return matchSearch && matchType;
  });

  const upcomingDeadlines = userData.tracked_deadlines
    .filter(d => getDaysUntil(d.deadline_date) >= 0)
    .sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());

  const pastDeadlines = userData.tracked_deadlines
    .filter(d => getDaysUntil(d.deadline_date) < 0)
    .sort((a, b) => new Date(b.deadline_date).getTime() - new Date(a.deadline_date).getTime());

  const nextDeadline = upcomingDeadlines[0];
  const urgentDeadlines = upcomingDeadlines.filter(d => getDaysUntil(d.deadline_date) <= 7);

  if (step === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 20, color: "#475569", fontWeight: 600 }}>Loading Edutracker...</div>
        </div>
      </div>
    );
  }

  if (step === "auth") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 50%, #1a8a6e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 24, padding: 48, maxWidth: 440, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🎓</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e3a5f", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {(["signup", "login"] as const).map(mode => (
              <button key={mode} onClick={() => setAuthMode(mode)} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 14, background: authMode === mode ? "white" : "transparent", color: authMode === mode ? "#1e3a5f" : "#64748b", boxShadow: authMode === mode ? "0 2px 8px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
                {mode === "signup" ? "Sign Up" : "Log In"}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Email Address</label>
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="you@example.com" style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#2d6a9f"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Password</label>
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="••••••••" style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} onKeyDown={e => e.key === "Enter" && handleAuth()} />
            </div>
            {authError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: 8, fontSize: 14, border: "1px solid #fecaca" }}>{authError}</div>}
            <button onClick={handleAuth} disabled={authLoading || !authEmail || !authPassword} style={{ padding: "14px", background: !authLoading && authEmail && authPassword ? "linear-gradient(135deg, #1e3a5f, #2d6a9f)" : "#94a3b8", color: "white", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: !authLoading && authEmail && authPassword ? "pointer" : "not-allowed", marginTop: 4, transition: "opacity 0.2s" }}>
              {authLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Log In"}
            </button>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#94a3b8" }}>
            Track deadlines for 80+ top colleges • Free forever
          </p>
        </div>
      </div>
    );
  }

  if (step === "onboard_schools") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <div style={{ background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)", padding: "32px 24px", color: "white" }}>
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 8, fontWeight: 600 }}>STEP 1 OF 2</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Choose Your Target Schools</h1>
            <p style={{ marginTop: 8, color: "#bfdbfe", fontSize: 15 }}>Select the colleges you're applying to. You can add more later.</p>
            <div style={{ marginTop: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 16px", fontSize: 14 }}>
                {userData.selected_schools.length} selected
              </div>
              {userData.selected_schools.length > 0 && (
                <button onClick={() => { setStep("onboard_reminders"); }} style={{ background: "white", color: "#1e3a5f", border: "none", borderRadius: 20, padding: "6px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Continue →
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 24px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search colleges..." style={{ flex: 1, minWidth: 200, padding: "10px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "10px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "white", cursor: "pointer" }}>
              <option value="all">All Types</option>
              <option value="private">Private</option>
              <option value="public">Public</option>
              <option value="liberal arts">Liberal Arts</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {filteredColleges.map(college => {
              const isSelected = userData.selected_schools.includes(college.id);
              return (
                <div key={college.id} onClick={() => toggleSchool(college.id)} style={{ background: isSelected ? "#eff6ff" : "white", border: `2px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 14, padding: 20, cursor: "pointer", transition: "all 0.2s", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: college.logo_color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                      {college.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{college.name}</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{college.location}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        {college.acceptance_rate && (
                          <span style={{ fontSize: 12, background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: 6 }}>
                            {college.acceptance_rate} accept
                          </span>
                        )}
                        {Object.entries(college.deadlines).map(([type, date]) => {
                          if (!date) return null;
                          const dt = DEADLINE_TYPES.find(d => d.key === type);
                          return (
                            <span key={type} style={{ fontSize: 12, background: dt?.color + "20", color: dt?.color, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                              {dt?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`, background: isSelected ? "#3b82f6" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSelected && <span style={{ color: "white", fontSize: 14 }}>✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {userData.selected_schools.length > 0 && (
            <div style={{ position: "sticky", bottom: 24, marginTop: 32, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setStep("onboard_reminders")} style={{ background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)", color: "white", border: "none", borderRadius: 16, padding: "16px 48px", fontSize: 17, fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(30,58,95,0.4)" }}>
                Continue with {userData.selected_schools.length} school{userData.selected_schools.length !== 1 ? "s" : ""} →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "onboard_reminders") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🔔</div>
            <div style={{ fontSize: 12, color: "#6366f1", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>STEP 2 OF 2</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e3a5f", margin: 0 }}>Set Up Reminders</h1>
            <p style={{ color: "#64748b", marginTop: 8 }}>We'll remind you before every deadline so you never miss one.</p>
          </div>

          <div style={{ background: "white", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Graduation Year</label>
              <select value={userData.grad_year} onChange={e => updateUserData({ grad_year: e.target.value })} style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", background: "white" }}>
                <option value="2025">Class of 2025</option>
                <option value="2026">Class of 2026</option>
                <option value="2027">Class of 2027</option>
                <option value="2028">Class of 2028</option>
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>📧 Email Reminders</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>Sent to {userData.email}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "30 days before", sub: "Plan ahead with a monthly reminder", key: "30" },
                  { label: "7 days before", sub: "One week warning", key: "7" },
                  { label: "1 day before", sub: "Final reminder the day before", key: "1" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: "#f8fafc", borderRadius: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{item.sub}</div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: "#3b82f6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 4px" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 8, background: "white" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>📱 SMS Reminders (Optional)</div>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Get text alerts too</div>
                </div>
                <button onClick={() => updateUserData({ sms_enabled: !userData.sms_enabled })} style={{ width: 44, height: 24, borderRadius: 12, background: userData.sms_enabled ? "#3b82f6" : "#cbd5e1", cursor: "pointer", border: "none", display: "flex", alignItems: "center", padding: "0 4px", justifyContent: userData.sms_enabled ? "flex-end" : "flex-start", transition: "background 0.2s" }}>
                  <div style={{ width: 16, height: 16, borderRadius: 8, background: "white" }} />
                </button>
              </div>
              {userData.sms_enabled && (
                <input value={userData.phone || ""} onChange={e => updateUserData({ phone: e.target.value })} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: "12px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              )}
            </div>

            <button onClick={completeOnboarding} style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)", color: "white", border: "none", borderRadius: 12, fontSize: 17, fontWeight: 700, cursor: "pointer" }}>
              🚀 Launch My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD
  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {notifMessage && (
        <div style={{ position: "fixed", top: 24, right: 24, background: "#1e3a5f", color: "white", padding: "12px 20px", borderRadius: 12, zIndex: 1000, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", animation: "fadeIn 0.3s" }}>
          {notifMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)", color: "white", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 28 }}>🎓</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Edutracker</span>
            </div>
            <div style={{ fontSize: 14, color: "#bfdbfe" }}>{userData.email}</div>
          </div>

          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, paddingBottom: 24 }}>
            {[
              { label: "Schools Tracked", value: userData.selected_schools.length, icon: "🏫" },
              { label: "Upcoming Deadlines", value: upcomingDeadlines.length, icon: "📅" },
              { label: "Urgent (≤7 days)", value: urgentDeadlines.length, icon: "⚠️", urgent: urgentDeadlines.length > 0 },
              { label: "Next Deadline", value: nextDeadline ? `${getDaysUntil(nextDeadline.deadline_date)}d` : "—", icon: "⏰" },
            ].map(stat => (
              <div key={stat.label} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 14, padding: "16px", backdropFilter: "blur(10px)", border: stat.urgent ? "1px solid #f59e0b" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: stat.urgent ? "#fbbf24" : "white" }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: "#93c5fd", marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab nav */}
          <div style={{ display: "flex", gap: 4, paddingTop: 8 }}>
            {[
              { key: "upcoming", label: "📅 Deadlines" },
              { key: "all_schools", label: "🏫 My Schools" },
              { key: "settings", label: "⚙️ Settings" },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as typeof activeTab)} style={{ padding: "10px 20px", border: "none", borderRadius: "10px 10px 0 0", cursor: "pointer", fontWeight: 600, fontSize: 14, background: activeTab === tab.key ? "#f0f4f8" : "transparent", color: activeTab === tab.key ? "#1e3a5f" : "#bfdbfe", transition: "all 0.2s" }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {/* UPCOMING DEADLINES TAB */}
        {activeTab === "upcoming" && (
          <div>
            {urgentDeadlines.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, #fef2f2, #fff7ed)", border: "1px solid #fca5a5", borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 16, marginBottom: 12 }}>🚨 Urgent — Act Now!</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {urgentDeadlines.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", borderRadius: 10, padding: "12px 16px" }}>
                      <div>
                        <span style={{ fontWeight: 700, color: "#1e293b" }}>{d.college_name}</span>
                        <span style={{ color: "#64748b", fontSize: 13 }}> · {DEADLINE_TYPES.find(t => t.key === d.deadline_type)?.label}</span>
                      </div>
                      <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 15 }}>
                        {getDaysUntil(d.deadline_date) === 0 ? "TODAY!" : `${getDaysUntil(d.deadline_date)}d left`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcomingDeadlines.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 20 }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No upcoming deadlines</div>
                <div style={{ color: "#64748b", marginBottom: 24 }}>
                  {userData.selected_schools.length === 0
                    ? "Add some schools to start tracking deadlines"
                    : "All your tracked deadlines have passed"}
                </div>
                <button onClick={() => setActiveTab("all_schools")} style={{ background: "#1e3a5f", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  + Add Schools
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {upcomingDeadlines.map((d, i) => {
                  const days = getDaysUntil(d.deadline_date);
                  const dt = DEADLINE_TYPES.find(t => t.key === d.deadline_type);
                  const college = COLLEGES.find(c => c.id === d.college_id);
                  return (
                    <div key={i} style={{ background: getUrgencyBg(days), border: `1px solid ${getUrgencyColor(days)}30`, borderLeft: `4px solid ${getUrgencyColor(days)}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: college?.logo_color || "#64748b", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                        {d.college_name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>{d.college_name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <span style={{ fontSize: 12, background: dt?.color + "20", color: dt?.color, padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>
                            {dt?.label}
                          </span>
                          <span style={{ fontSize: 13, color: "#64748b" }}>{formatDate(d.deadline_date)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: getUrgencyColor(days), lineHeight: 1 }}>
                          {days === 0 ? "TODAY" : `${days}d`}
                        </div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                          {days === 0 ? "DUE TODAY" : days === 1 ? "1 DAY LEFT" : `${days} DAYS LEFT`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {pastDeadlines.length > 0 && (
              <div style={{ marginTop: 36 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Past Deadlines</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pastDeadlines.slice(0, 5).map((d, i) => {
                    const dt = DEADLINE_TYPES.find(t => t.key === d.deadline_type);
                    return (
                      <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, opacity: 0.6 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, color: "#475569" }}>{d.college_name}</span>
                          <span style={{ color: "#94a3b8", fontSize: 13 }}> · {dt?.label}</span>
                        </div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>{formatDate(d.deadline_date)}</div>
                        <div style={{ fontSize: 13, color: "#94a3b8" }}>✓ Past</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY SCHOOLS TAB */}
        {activeTab === "all_schools" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>
                My Schools ({userData.selected_schools.length})
              </h2>
              <button onClick={() => setShowAddSchool(!showAddSchool)} style={{ background: "#1e3a5f", color: "white", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                {showAddSchool ? "✕ Close" : "+ Add School"}
              </button>
            </div>

            {showAddSchool && (
              <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                <h3 style={{ margin: "0 0 16px", color: "#1e293b" }}>Search & Add Schools</h3>
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search 80+ colleges..." style={{ width: "100%", padding: "10px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, maxHeight: 400, overflowY: "auto" }}>
                  {filteredColleges.filter(c => !userData.selected_schools.includes(c.id)).map(college => (
                    <div key={college.id} onClick={() => addSchoolFromDashboard(college)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#f8fafc", borderRadius: 10, cursor: "pointer", border: "2px solid transparent", transition: "all 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLDivElement).style.background = "#eff6ff"; }} onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; (e.currentTarget as HTMLDivElement).style.background = "#f8fafc"; }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: college.logo_color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {college.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>{college.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{college.location}</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "#3b82f6", fontWeight: 700, fontSize: 18 }}>+</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userData.selected_schools.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 20 }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🏫</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>No schools added yet</div>
                <button onClick={() => setShowAddSchool(true)} style={{ background: "#1e3a5f", color: "white", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                  + Add Your First School
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {userData.selected_schools.map(id => {
                  const college = COLLEGES.find(c => c.id === id);
                  if (!college) return null;
                  const myDeadlines = userData.tracked_deadlines.filter(d => d.college_id === id);
                  const upcoming = myDeadlines.filter(d => getDaysUntil(d.deadline_date) >= 0).sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime());
                  const nextDl = upcoming[0];
                  return (
                    <div key={id} style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: college.logo_color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 18 }}>
                            {college.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{college.name}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{college.location}</div>
                          </div>
                        </div>
                        <button onClick={() => removeSchool(id)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: 4 }} title="Remove school">✕</button>
                      </div>

                      {nextDl && (
                        <div style={{ background: getUrgencyBg(getDaysUntil(nextDl.deadline_date)), borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>Next deadline</div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                              {DEADLINE_TYPES.find(t => t.key === nextDl.deadline_type)?.label}
                            </div>
                            <div style={{ fontWeight: 800, color: getUrgencyColor(getDaysUntil(nextDl.deadline_date)), fontSize: 15 }}>
                              {getDaysUntil(nextDl.deadline_date) === 0 ? "TODAY!" : `${getDaysUntil(nextDl.deadline_date)}d`}
                            </div>
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {Object.entries(college.deadlines).map(([type, date]) => {
                          if (!date) return null;
                          const dt = DEADLINE_TYPES.find(t => t.key === type);
                          const days = getDaysUntil(date);
                          return (
                            <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                              <span style={{ color: dt?.color, fontWeight: 600 }}>{dt?.label}</span>
                              <span style={{ color: days < 0 ? "#94a3b8" : "#475569" }}>{formatDate(date)}</span>
                              {days >= 0 && <span style={{ color: getUrgencyColor(days), fontWeight: 700, minWidth: 40, textAlign: "right" }}>{days}d</span>}
                              {days < 0 && <span style={{ color: "#94a3b8", fontSize: 12 }}>passed</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 24px" }}>Settings</h2>

            <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 16 }}>👤 Account</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2 }}>Email</div>
                  <div style={{ fontWeight: 600, color: "#1e293b" }}>{userData.email}</div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Graduation Year</label>
                  <select value={userData.grad_year || "2025"} onChange={e => updateUserData({ grad_year: e.target.value })} style={{ width: "100%", padding: "10px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "white" }}>
                    <option value="2025">Class of 2025</option>
                    <option value="2026">Class of 2026</option>
                    <option value="2027">Class of 2027</option>
                    <option value="2028">Class of 2028</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 16 }}>🔔 Reminders</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>Email Reminders</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>30-day, 7-day, and 1-day alerts</div>
                  </div>
                  <button onClick={() => updateUserData({ reminders_enabled: !userData.reminders_enabled })} style={{ width: 48, height: 26, borderRadius: 13, background: userData.reminders_enabled ? "#3b82f6" : "#cbd5e1", cursor: "pointer", border: "none", display: "flex", alignItems: "center", padding: "0 4px", justifyContent: userData.reminders_enabled ? "flex-end" : "flex-start", transition: "background 0.2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: "white" }} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>SMS Reminders</div>
                    <div style={{ fontSize: 13, color: "#64748b" }}>Text message alerts</div>
                  </div>
                  <button onClick={() => updateUserData({ sms_enabled: !userData.sms_enabled })} style={{ width: 48, height: 26, borderRadius: 13, background: userData.sms_enabled ? "#3b82f6" : "#cbd5e1", cursor: "pointer", border: "none", display: "flex", alignItems: "center", padding: "0 4px", justifyContent: userData.sms_enabled ? "flex-end" : "flex-start", transition: "background 0.2s" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: "white" }} />
                  </button>
                </div>
                {userData.sms_enabled && (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Phone Number</label>
                    <input value={userData.phone || ""} onChange={e => updateUserData({ phone: e.target.value })} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: "10px 16px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 16px", color: "#1e293b", fontSize: 16 }}>📊 Deadline Legend</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {DEADLINE_TYPES.map(dt => (
                  <div key={dt.key} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: dt.color, flexShrink: 0 }} />
                    <div>
                      <span style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>{dt.label}</span>
                      <span style={{ color: "#64748b", fontSize: 13 }}> — {dt.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { updateUserData({ email: "", onboarded: false, selected_schools: [], tracked_deadlines: [] }); setStep("auth"); setAuthEmail(""); setAuthPassword(""); }} style={{ marginTop: 20, width: "100%", padding: "12px", background: "white", color: "#ef4444", border: "2px solid #fecaca", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}