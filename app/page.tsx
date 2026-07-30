"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: string;
  name: string;
  location: string;
  commonApp: string | null;
  ea: string | null;
  ed: string | null;
  ed2: string | null;
  rd: string;
  logo: string;
}

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  gradYear: string;
}

interface SavedCollege {
  id: string;
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineDate: string;
  reminders: string[];
  addedAt: string;
}

interface Reminder {
  id: string;
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineDate: string;
  daysLeft: number;
  urgency: "critical" | "urgent" | "moderate" | "early";
}

const COLLEGES: College[] = [
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "yale", name: "Yale University", location: "New Haven, CT", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-02", logo: "🎓" },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "columbia", name: "Columbia University", location: "New York, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "mit", name: "MIT", location: "Cambridge, MA", commonApp: null, ea: "2024-11-01", ed: null, ed2: null, rd: "2025-01-01", logo: "⚙️" },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-01-02", logo: "🌲" },
  { id: "chicago", name: "University of Chicago", location: "Chicago, IL", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-04", rd: "2025-01-06", logo: "🎓" },
  { id: "upenn", name: "University of Pennsylvania", location: "Philadelphia, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "duke", name: "Duke University", location: "Durham, NC", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-02", logo: "🔵" },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "brown", name: "Brown University", location: "Providence, RI", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-02", logo: "🎓" },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "⭐" },
  { id: "rice", name: "Rice University", location: "Houston, TX", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "wustl", name: "Washington University in St. Louis", location: "St. Louis, MO", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-02", logo: "🎓" },
  { id: "notre-dame", name: "University of Notre Dame", location: "Notre Dame, IN", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-01-01", logo: "☘️" },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", commonApp: null, ea: null, ed: null, ed2: null, rd: "2025-01-10", logo: "🎓" },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-15", logo: "🎓" },
  { id: "uc-berkeley", name: "UC Berkeley", location: "Berkeley, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🐻" },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🐻" },
  { id: "uc-san-diego", name: "UC San Diego", location: "La Jolla, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🔱" },
  { id: "uc-santa-barbara", name: "UC Santa Barbara", location: "Santa Barbara, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🌊" },
  { id: "uc-irvine", name: "UC Irvine", location: "Irvine, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🦅" },
  { id: "uc-davis", name: "UC Davis", location: "Davis, CA", commonApp: null, ea: null, ed: null, ed2: null, rd: "2024-11-30", logo: "🐄" },
  { id: "michigan", name: "University of Michigan", location: "Ann Arbor, MI", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-02-01", logo: "🐺" },
  { id: "virginia", name: "University of Virginia", location: "Charlottesville, VA", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "georgetown-u", name: "Georgetown University", location: "Washington, DC", commonApp: null, ea: null, ed: null, ed2: null, rd: "2025-01-10", logo: "🎓" },
  { id: "carnegie-mellon", name: "Carnegie Mellon University", location: "Pittsburgh, PA", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: null, rd: "2025-01-03", logo: "🤖" },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", logo: "🐘" },
  { id: "johns-hopkins", name: "Johns Hopkins University", location: "Baltimore, MD", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-02", logo: "🎓" },
  { id: "nyu", name: "New York University", location: "New York, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", logo: "🗽" },
  { id: "boston-university", name: "Boston University", location: "Boston, MA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-02", rd: "2025-01-02", logo: "🎓" },
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🦅" },
  { id: "wake-forest", name: "Wake Forest University", location: "Winston-Salem, NC", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", logo: "🌿" },
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-15", logo: "✌️" },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", commonApp: "2024-10-15", ea: "2024-10-15", ed: null, ed2: null, rd: "2025-01-15", logo: "🐏" },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-02-01", logo: "🚂" },
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", commonApp: "2024-11-01", ea: "2024-10-15", ed: null, ed2: null, rd: "2025-01-05", logo: "🐝" },
  { id: "penn-state", name: "Penn State University", location: "State College, PA", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-02-01", logo: "🦁" },
  { id: "ohio-state", name: "Ohio State University", location: "Columbus, OH", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-02-01", logo: "🌰" },
  { id: "ut-austin", name: "UT Austin", location: "Austin, TX", commonApp: null, ea: "2024-11-01", ed: null, ed2: null, rd: "2025-12-01", logo: "🤘" },
  { id: "uw-madison", name: "UW Madison", location: "Madison, WI", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-02-01", logo: "🦡" },
  { id: "florida", name: "University of Florida", location: "Gainesville, FL", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-03-01", logo: "🐊" },
  { id: "miami", name: "University of Miami", location: "Coral Gables, FL", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: null, rd: "2025-02-01", logo: "🌴" },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", logo: "🎓" },
  { id: "villanova", name: "Villanova University", location: "Villanova, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-15", logo: "🎓" },
  { id: "fordham", name: "Fordham University", location: "New York, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "american", name: "American University", location: "Washington, DC", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", logo: "🦅" },
  { id: "gw", name: "George Washington University", location: "Washington, DC", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-05", logo: "🏛️" },
  { id: "syracuse", name: "Syracuse University", location: "Syracuse, NY", commonApp: "2024-11-01", ea: "2024-11-15", ed: "2024-11-15", ed2: null, rd: "2025-01-01", logo: "🍊" },
  { id: "drexel", name: "Drexel University", location: "Philadelphia, PA", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-03-01", logo: "🐉" },
  { id: "arizona-state", name: "Arizona State University", location: "Tempe, AZ", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-02-01", logo: "☀️" },
  { id: "arizona", name: "University of Arizona", location: "Tucson, AZ", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-05-01", logo: "🌵" },
  { id: "colorado", name: "University of Colorado Boulder", location: "Boulder, CO", commonApp: "2024-11-01", ea: null, ed: null, ed2: null, rd: "2025-01-15", logo: "🏔️" },
  { id: "denver", name: "University of Denver", location: "Denver, CO", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", logo: "🏔️" },
  { id: "smu", name: "Southern Methodist University", location: "Dallas, TX", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-03-15", logo: "🐴" },
  { id: "case-western", name: "Case Western Reserve University", location: "Cleveland, OH", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", logo: "🎓" },
  { id: "rochester", name: "University of Rochester", location: "Rochester, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-05", logo: "🎓" },
  { id: "lehigh2", name: "Rensselaer Polytechnic Institute", location: "Troy, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-15", logo: "⚙️" },
  { id: "wpi", name: "Worcester Polytechnic Institute", location: "Worcester, MA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-02-01", rd: "2025-02-01", logo: "⚙️" },
  { id: "stevens", name: "Stevens Institute of Technology", location: "Hoboken, NJ", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-02-01", logo: "⚙️" },
  { id: "william-mary", name: "College of William & Mary", location: "Williamsburg, VA", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-01-08", logo: "🎓" },
  { id: "james-madison", name: "James Madison University", location: "Harrisonburg, VA", commonApp: "2024-11-01", ea: "2024-11-01", ed: null, ed2: null, rd: "2025-01-15", logo: "🎓" },
  { id: "clark", name: "Clark University", location: "Worcester, MA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-02-01", logo: "🎓" },
  { id: "bucknell", name: "Bucknell University", location: "Lewisburg, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-15", logo: "🦬" },
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-15", ed2: null, rd: "2025-01-15", logo: "🎓" },
  { id: "colby", name: "Colby College", location: "Waterville, ME", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", commonApp: "2024-11-01", ea: null, ed: "2024-11-15", ed2: null, rd: "2025-01-01", logo: "🐻" },
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🏔️" },
  { id: "hamilton", name: "Hamilton College", location: "Clinton, NY", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "bates", name: "Bates College", location: "Lewiston, ME", commonApp: "2024-11-01", ea: null, ed: "2024-11-01", ed2: null, rd: "2025-01-01", logo: "🎓" },
  { id: "trinity", name: "Trinity College", location: "Hartford, CT", commonApp: "2024-11-01", ea: null, ed: "2024-11-15", ed2: null, rd: "2025-01-15", logo: "🎓" },
  { id: "lafayette", name: "Lafayette College", location: "Easton, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-15", ed2: null, rd: "2025-01-15", logo: "🎓" },
  { id: "dennison", name: "Denison University", location: "Granville, OH", commonApp: "2024-11-01", ea: "2024-11-01", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-02-01", logo: "🎓" },
  { id: "dickinson", name: "Dickinson College", location: "Carlisle, PA", commonApp: "2024-11-01", ea: null, ed: "2024-11-15", ed2: null, rd: "2025-02-01", logo: "🎓" },
];

type Step = "onboarding" | "search" | "dashboard";
type Tab = "search" | "mycolleges" | "reminders";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getUrgency(days: number): "critical" | "urgent" | "moderate" | "early" {
  if (days <= 7) return "critical";
  if (days <= 14) return "urgent";
  if (days <= 30) return "moderate";
  return "early";
}

function urgencyColor(urgency: string): string {
  switch (urgency) {
    case "critical": return "#dc2626";
    case "urgent": return "#ea580c";
    case "moderate": return "#d97706";
    default: return "#16a34a";
  }
}

function urgencyBg(urgency: string): string {
  switch (urgency) {
    case "critical": return "#fef2f2";
    case "urgent": return "#fff7ed";
    case "moderate": return "#fffbeb";
    default: return "#f0fdf4";
  }
}

export default function Home() {
  const [step, setStep] = useState<Step>("onboarding");
  const [activeTab, setActiveTab] = useState<Tab>("search");
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "", gradYear: "" });
  const [savedColleges, setSavedColleges] = useState<SavedCollege[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardErrors, setOnboardErrors] = useState<Partial<UserProfile>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [addingCollegeId, setAddingCollegeId] = useState<string | null>(null);
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [filterState, setFilterState] = useState("all");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_profile");
    const storedColleges = localStorage.getItem("edutracker_colleges");
    const storedUserId = localStorage.getItem("edutracker_userid");
    if (stored) {
      const p = JSON.parse(stored) as UserProfile;
      setProfile(p);
      setStep("dashboard");
    }
    if (storedColleges) {
      setSavedColleges(JSON.parse(storedColleges) as SavedCollege[]);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const computeReminders = useCallback((colleges: SavedCollege[]) => {
    const upcoming: Reminder[] = [];
    colleges.forEach((sc) => {
      const days = daysUntil(sc.deadlineDate);
      if (days >= 0 && days <= 90) {
        upcoming.push({
          id: sc.id,
          collegeId: sc.collegeId,
          collegeName: sc.collegeName,
          deadlineType: sc.deadlineType,
          deadlineDate: sc.deadlineDate,
          daysLeft: days,
          urgency: getUrgency(days),
        });
      }
    });
    upcoming.sort((a, b) => a.daysLeft - b.daysLeft);
    setReminders(upcoming);
  }, []);

  useEffect(() => {
    computeReminders(savedColleges);
  }, [savedColleges, computeReminders]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const validateOnboard = (): boolean => {
    const errors: Partial<UserProfile> = {};
    if (onboardStep === 1) {
      if (!profile.name.trim()) errors.name = "Name is required";
      if (!profile.gradYear || parseInt(profile.gradYear) < 2024 || parseInt(profile.gradYear) > 2030) errors.gradYear = "Enter a valid graduation year (2024–2030)";
    }
    if (onboardStep === 2) {
      if (!profile.email.trim() || !profile.email.includes("@")) errors.email = "Valid email is required";
    }
    setOnboardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOnboardNext = async () => {
    if (!validateOnboard()) return;
    if (onboardStep < 2) {
      setOnboardStep(2);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "signup", email: profile.email, password: `edu_${profile.email}_${profile.gradYear}` }),
      });
      const data = await res.json() as { ok?: boolean; email?: string; error?: string };
      if (data.ok || data.email) {
        const uid = `user_${Date.now()}`;
        setUserId(uid);
        localStorage.setItem("edutracker_userid", uid);
        localStorage.setItem("edutracker_profile", JSON.stringify(profile));
        setStep("dashboard");
        showToast(`Welcome, ${profile.name}! 🎉`);
      } else {
        const loginRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "login", email: profile.email, password: `edu_${profile.email}_${profile.gradYear}` }),
        });
        const loginData = await loginRes.json() as { ok?: boolean; email?: string; error?: string };
        if (loginData.ok || loginData.email) {
          const uid = `user_${Date.now()}`;
          setUserId(uid);
          localStorage.setItem("edutracker_userid", uid);
          localStorage.setItem("edutracker_profile", JSON.stringify(profile));
          setStep("dashboard");
          showToast(`Welcome back, ${profile.name}! 👋`);
        } else {
          setOnboardErrors({ email: "Could not create account. Try a different email." });
        }
      }
    } catch {
      const uid = `user_${Date.now()}`;
      setUserId(uid);
      localStorage.setItem("edutracker_userid", uid);
      localStorage.setItem("edutracker_profile", JSON.stringify(profile));
      setStep("dashboard");
      showToast(`Welcome, ${profile.name}! 🎉`);
    } finally {
      setLoading(false);
    }
  };

  const addCollege = (college: College, deadlineType: string, deadlineDate: string) => {
    const existing = savedColleges.find((s) => s.collegeId === college.id && s.deadlineType === deadlineType);
    if (existing) {
      showToast("Already in your list!");
      return;
    }
    const newEntry: SavedCollege = {
      id: `${college.id}_${deadlineType}_${Date.now()}`,
      collegeId: college.id,
      collegeName: college.name,
      deadlineType,
      deadlineDate,
      reminders: ["30", "14", "7", "1"],
      addedAt: new Date().toISOString(),
    };
    const updated = [...savedColleges, newEntry];
    setSavedColleges(updated);
    localStorage.setItem("edutracker_colleges", JSON.stringify(updated));
    showToast(`${college.name} (${deadlineType}) added! ✅`);
  };

  const removeCollege = (id: string) => {
    const updated = savedColleges.filter((s) => s.id !== id);
    setSavedColleges(updated);
    localStorage.setItem("edutracker_colleges", JSON.stringify(updated));
    showToast("Removed from your list");
  };

  const isAdded = (collegeId: string, deadlineType: string): boolean => {
    return savedColleges.some((s) => s.collegeId === collegeId && s.deadlineType === deadlineType);
  };

  const filteredColleges = COLLEGES.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q);
    if (filterState === "all") return matchesSearch;
    const stateAbbr = filterState.toLowerCase();
    return matchesSearch && c.location.toLowerCase().includes(stateAbbr);
  });

  const states = Array.from(new Set(COLLEGES.map((c) => c.location.split(", ")[1]))).sort();

  const deadlineTypes = (college: College): { type: string; date: string }[] => {
    const types: { type: string; date: string }[] = [];
    if (college.ea) types.push({ type: "EA", date: college.ea });
    if (college.ed) types.push({ type: "ED", date: college.ed });
    if (college.ed2) types.push({ type: "ED2", date: college.ed2 });
    if (college.rd) types.push({ type: "RD", date: college.rd });
    if (college.commonApp && !types.find((t) => t.date === college.commonApp)) {
      types.unshift({ type: "Common App", date: college.commonApp });
    }
    return types;
  };

  if (step === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
        <div style={{ background: "#fff", borderRadius: "24px", padding: "40px 32px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎓</div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1e1b4b", margin: "0 0 8px" }}>EduTracker</h1>
            <p style={{ color: "#6b7280", fontSize: "15px", margin: 0 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: onboardStep >= s ? "#667eea" : "#e5e7eb", transition: "background 0.3s" }} />
            ))}
          </div>

          {onboardStep === 1 && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "24px" }}>Let&apos;s get started 👋</h2>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: onboardErrors.name ? "2px solid #dc2626" : "2px solid #e5e7eb", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                />
                {onboardErrors.name && <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{onboardErrors.name}</p>}
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Graduation Year</label>
                <select
                  value={profile.gradYear}
                  onChange={(e) => setProfile({ ...profile, gradYear: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: onboardErrors.gradYear ? "2px solid #dc2626" : "2px solid #e5e7eb", fontSize: "15px", outline: "none", background: "#fff", boxSizing: "border-box" }}
                >
                  <option value="">Select year</option>
                  {[2024, 2025, 2026, 2027, 2028].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {onboardErrors.gradYear && <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{onboardErrors.gradYear}</p>}
              </div>
            </div>
          )}

          {onboardStep === 2 && (
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Contact Details</h2>
              <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "24px" }}>We&apos;ll use these to send you deadline reminders</p>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: onboardErrors.email ? "2px solid #dc2626" : "2px solid #e5e7eb", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                />
                {onboardErrors.email && <p style={{ color: "#dc2626", fontSize: "12px", margin: "4px 0 0" }}>{onboardErrors.email}</p>}
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Phone Number <span style={{ color: "#9ca3af", fontWeight: 400 }}>(optional)</span></label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "12px", padding: "12px 16px", marginBottom: "24px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#166534" }}>
                  📅 You&apos;ll receive reminders at <strong>30, 14, 7, and 1 day</strong> before each deadline
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleOnboardNext}
            disabled={loading}
            style={{ width: "100%", padding: "14px", background: loading ? "#9ca3af" : "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Setting up..." : onboardStep === 1 ? "Continue →" : "Start Tracking 🚀"}
          </button>
          {onboardStep === 2 && (
            <button onClick={() => setOnboardStep(1)} style={{ width: "100%", padding: "12px", background: "none", border: "none", color: "#6b7280", fontSize: "14px", cursor: "pointer", marginTop: "8px" }}>
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "16px 20px 0", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 20px rgba(102,126,234,0.4)" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🎓</span>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: "18px", lineHeight: 1 }}>EduTracker</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>Hi, {profile.name} · Class of {profile.gradYear}</div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{savedColleges.length}</span>
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>saved</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "4px", paddingBottom: "1px" }}>
            {(["search", "mycolleges", "reminders"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: "10px 4px", background: activeTab === tab ? "#fff" : "transparent",
                  border: "none", borderRadius: "12px 12px 0 0", cursor: "pointer",
                  color: activeTab === tab ? "#667eea" : "rgba(255,255,255,0.8)",
                  fontWeight: activeTab === tab ? 700 : 500, fontSize: "13px",
                  transition: "all 0.2s",
                }}
              >
                {tab === "search" ? "🔍 Search" : tab === "mycolleges" ? `📚 My List${savedColleges.length > 0 ? ` (${savedColleges.length})` : ""}` : `⏰ Reminders${reminders.length > 0 ? ` (${reminders.length})` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
        {/* SEARCH TAB */}
        {activeTab === "search" && (
          <div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <input
                type="text"
                placeholder="Search colleges by name or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "2px solid #e5e7eb", fontSize: "15px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }}
              />
              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                <button
                  onClick={() => setFilterState("all")}
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: filterState === "all" ? "#667eea" : "#f3f4f6", color: filterState === "all" ? "#fff" : "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                  All States
                </button>
                {states.map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterState(filterState === s ? "all" : s)}
                    style={{ padding: "6px 14px", borderRadius: "20px", border: "none", background: filterState === s ? "#667eea" : "#f3f4f6", color: filterState === s ? "#fff" : "#374151", fontWeight: 600, fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>{filteredColleges.length} colleges found</p>

            {filteredColleges.map((college) => {
              const isExpanded = expandedCollege === college.id;
              const types = deadlineTypes(college);
              const addedCount = types.filter((t) => isAdded(college.id, t.type)).length;
              return (
                <div key={college.id} style={{ background: "#fff", borderRadius: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <button
                    onClick={() => setExpandedCollege(isExpanded ? null : college.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #667eea20, #764ba220)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                      {college.logo}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#111827", fontSize: "15px", marginBottom: "2px" }}>{college.name}</div>
                      <div style={{ color: "#6b7280", fontSize: "13px" }}>📍 {college.location}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      {addedCount > 0 && (
                        <div style={{ background: "#dcfce7", color: "#16a34a", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                          {addedCount} added
                        </div>
                      )}
                      <div style={{ color: "#9ca3af", fontSize: "20px" }}>{isExpanded ? "▲" : "▼"}</div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
                        {types.map(({ type, date }) => {
                          const days = daysUntil(date);
                          const added = isAdded(college.id, type);
                          const urgency = getUrgency(days);
                          return (
                            <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: added ? "#f0fdf4" : "#f9fafb", border: `1px solid ${added ? "#bbf7d0" : "#e5e7eb"}` }}>
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "13px", color: "#374151" }}>{type}</span>
                                  {days >= 0 && days <= 90 && (
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: urgencyColor(urgency), background: urgencyBg(urgency), padding: "2px 6px", borderRadius: "8px" }}>
                                      {days === 0 ? "Today!" : days === 1 ? "1 day" : `${days}d`}
                                    </span>
                                  )}
                                  {days < 0 && <span style={{ fontSize: "11px", color: "#9ca3af" }}>Passed</span>}
                                </div>
                                <div style={{ color: "#6b7280", fontSize: "12px", marginTop: "2px" }}>{formatDate(date)}</div>
                              </div>
                              <button
                                disabled={added || addingCollegeId === `${college.id}_${type}`}
                                onClick={() => { setAddingCollegeId(`${college.id}_${type}`); addCollege(college, type, date); setTimeout(() => setAddingCollegeId(null), 500); }}
                                style={{ padding: "8px 14px", borderRadius: "10px", border: "none", background: added ? "#16a34a" : "#667eea", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: added ? "default" : "pointer" }}
                              >
                                {added ? "✓ Added" : "+ Add"}
                              </button>
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

        {/* MY COLLEGES TAB */}
        {activeTab === "mycolleges" && (
          <div>
            {savedColleges.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>📚</div>
                <h3 style={{ color: "#374151", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>No colleges yet</h3>
                <p style={{ color: "#6b7280", marginBottom: "24px" }}>Search and add colleges to track their deadlines</p>
                <button
                  onClick={() => setActiveTab("search")}
                  style={{ padding: "12px 24px", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}
                >
                  Search Colleges
                </button>
              </div>
            ) : (
              <div>
                <div style={{ background: "linear-gradient(135deg, #667eea20, #764ba220)", borderRadius: "16px", padding: "16px", marginBottom: "16px", display: "flex", gap: "16px" }}>
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#667eea" }}>{savedColleges.length}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Deadlines tracked</div>
                  </div>
                  <div style={{ width: "1px", background: "#e5e7eb" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626" }}>{reminders.filter((r) => r.urgency === "critical").length}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Due ≤ 7 days</div>
                  </div>
                  <div style={{ width: "1px", background: "#e5e7eb" }} />
                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a" }}>{new Set(savedColleges.map((s) => s.collegeId)).size}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>Unique schools</div>
                  </div>
                </div>

                {savedColleges
                  .slice()
                  .sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime())
                  .map((sc) => {
                    const days = daysUntil(sc.deadlineDate);
                    const urgency = getUrgency(days);
                    return (
                      <div key={sc.id} style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `4px solid ${urgencyColor(urgency)}` }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "15px", marginBottom: "4px" }}>{sc.collegeName}</div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ background: "#f3f4f6", color: "#374151", fontSize: "12px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>{sc.deadlineType}</span>
                              <span style={{ color: "#6b7280", fontSize: "13px" }}>{formatDate(sc.deadlineDate)}</span>
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              {days < 0 ? (
                                <span style={{ fontSize: "12px", color: "#9ca3af" }}>✓ Deadline passed</span>
                              ) : days === 0 ? (
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#dc2626" }}>🚨 Due TODAY!</span>
                              ) : (
                                <span style={{ fontSize: "13px", fontWeight: 600, color: urgencyColor(urgency) }}>
                                  {urgency === "critical" ? "🚨" : urgency === "urgent" ? "⚠️" : urgency === "moderate" ? "📅" : "📆"} {days} day{days !== 1 ? "s" : ""} left
                                </span>
                              )}
                            </div>
                            <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                              {sc.reminders.map((r) => (
                                <span key={r} style={{ fontSize: "11px", background: "#ede9fe", color: "#7c3aed", padding: "2px 7px", borderRadius: "8px" }}>
                                  🔔 {r}d
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => removeCollege(sc.id)}
                            style={{ padding: "8px", background: "#fef2f2", border: "none", borderRadius: "10px", cursor: "pointer", color: "#dc2626", fontSize: "16px" }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* REMINDERS TAB */}
        {activeTab === "reminders" && (
          <div>
            <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 4px", fontWeight: 700, color: "#111827" }}>📧 How Reminders Work</h3>
              <p style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 12px" }}>
                Reminders are automatically scheduled to {profile.email}{profile.phone ? ` and ${profile.phone}` : ""} at:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { days: "30 days", icon: "📆", label: "Early heads-up" },
                  { days: "14 days", icon: "📅", label: "Two weeks out" },
                  { days: "7 days", icon: "⚠️", label: "One week warning" },
                  { days: "1 day", icon: "🚨", label: "Final reminder" },
                ].map((r) => (
                  <div key={r.days} style={{ background: "#f9fafb", borderRadius: "12px", padding: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "20px" }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "#111827" }}>{r.days} before</div>
                      <div style={{ fontSize: "11px", color: "#6b7280" }}>{r.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {reminders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px" }}>
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>⏰</div>
                <h3 style={{ color: "#374151", fontWeight: 700, marginBottom: "8px" }}>No upcoming reminders</h3>
                <p style={{ color: "#6b7280", marginBottom: "24px" }}>Add colleges to your list to see upcoming deadline reminders</p>
                <button
                  onClick={() => setActiveTab("search")}
                  style={{ padding: "12px 24px", background: "linear-gradient(135deg, #667eea, #764ba2)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Find Colleges
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>
                  {reminders.length} deadline{reminders.length !== 1 ? "s" : ""} in the next 90 days
                </p>
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    style={{ background: urgencyBg(r.urgency), border: `1px solid ${urgencyColor(r.urgency)}30`, borderRadius: "16px", padding: "16px", marginBottom: "10px", display: "flex", gap: "12px", alignItems: "center" }}
                  >
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: urgencyColor(r.urgency), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 800, fontSize: "16px", lineHeight: 1 }}>{r.daysLeft}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "9px", lineHeight: 1 }}>days</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>{r.collegeName}</div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                        <span style={{ background: "rgba(0,0,0,0.08)", fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "8px", color: "#374151" }}>{r.deadlineType}</span>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{formatDate(r.deadlineDate)}</span>
                      </div>
                      <div style={{ marginTop: "6px", display: "flex", gap: "4px" }}>
                        {[30, 14, 7, 1].filter((d) => d >= r.daysLeft).map((d) => (
                          <span key={d} style={{ fontSize: "10px", background: urgencyColor(r.urgency) + "20", color: urgencyColor(r.urgency), padding: "2px 6px", borderRadius: "8px", fontWeight: 600 }}>
                            🔔 {d}d ✓
                          </span>
                        ))}
                        {[30, 14, 7, 1].filter((d) => d < r.daysLeft).map((d) => (
                          <span key={d} style={{ fontSize: "10px", background: "#f3f4f6", color: "#9ca3af", padding: "2px 6px", borderRadius: "8px" }}>
                            🔔 {d}d
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: "#1e1b4b", color: "#fff", padding: "12px 24px", borderRadius: "100px", fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.3)", zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}