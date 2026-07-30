"use client";

import { useEffect, useState, useCallback } from "react";

interface Deadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  date: string; // YYYY-MM-DD
  label: string;
}

interface College {
  id: string;
  name: string;
  location: string;
  deadlines: Deadline[];
}

interface UserDeadline {
  collegeId: string;
  collegeName: string;
  deadlineType: string;
  deadlineLabel: string;
  date: string;
  daysUntil: number;
}

interface ReminderPrefs {
  email: string;
  phone: string;
  remindAt: number[];
}

interface UserProfile {
  email: string;
  loggedIn: boolean;
}

type Step = "onboarding" | "schools" | "reminders" | "dashboard";

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", deadlines: [{ type: "RD", date: "2026-01-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Harvard Financial Aid" }] },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Restrictive Early Action" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "yale", name: "Yale University", location: "New Haven, CT", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", deadlines: [{ type: "EA", date: "2025-11-01", label: "Single-Choice Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "columbia", name: "Columbia University", location: "New York, NY", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "upenn", name: "UPenn", location: "Philadelphia, PA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "brown", name: "Brown University", location: "Providence, RI", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "duke", name: "Duke University", location: "Durham, NC", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-02", label: "Early Decision II" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-03", label: "Regular Decision" }] },
  { id: "rice", name: "Rice University", location: "Houston, TX", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Rice Merit Scholarship" }] },
  { id: "notredame", name: "Notre Dame", location: "Notre Dame, IN", deadlines: [{ type: "EA", date: "2025-11-01", label: "Restrictive Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-10", label: "Regular Decision" }] },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "wustl", name: "WashU St. Louis", location: "St. Louis, MO", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-02", label: "Early Decision II" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "boston", name: "Boston University", location: "Boston, MA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "usc", name: "USC", location: "Los Angeles, CA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Merit Scholarship" }] },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", deadlines: [{ type: "RD", date: "2025-11-30", label: "Regular Decision" }] },
  { id: "ucberkeley", name: "UC Berkeley", location: "Berkeley, CA", deadlines: [{ type: "RD", date: "2025-11-30", label: "Regular Decision" }] },
  { id: "ucsd", name: "UC San Diego", location: "San Diego, CA", deadlines: [{ type: "RD", date: "2025-11-30", label: "Regular Decision" }] },
  { id: "ucdavis", name: "UC Davis", location: "Davis, CA", deadlines: [{ type: "RD", date: "2025-11-30", label: "Regular Decision" }] },
  { id: "ucsb", name: "UC Santa Barbara", location: "Santa Barbara, CA", deadlines: [{ type: "RD", date: "2025-11-30", label: "Regular Decision" }] },
  { id: "umich", name: "U of Michigan", location: "Ann Arbor, MI", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", deadlines: [{ type: "EA", date: "2025-10-15", label: "Early Action" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "uga", name: "U of Georgia", location: "Athens, GA", deadlines: [{ type: "EA", date: "2025-10-15", label: "Early Action" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-10-15", label: "Foundation Fellowship" }] },
  { id: "uva", name: "U of Virginia", location: "Charlottesville, VA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "gatech", name: "Georgia Tech", location: "Atlanta, GA", deadlines: [{ type: "EA", date: "2025-10-15", label: "Early Action" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }, { type: "Scholarship", date: "2025-11-15", label: "Stamps Scholarship" }] },
  { id: "utaustin", name: "UT Austin", location: "Austin, TX", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2025-12-01", label: "Priority Deadline" }] },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "osu", name: "Ohio State", location: "Columbus, OH", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "uw", name: "U of Washington", location: "Seattle, WA", deadlines: [{ type: "RD", date: "2025-11-15", label: "Priority Deadline" }] },
  { id: "psu", name: "Penn State", location: "University Park, PA", deadlines: [{ type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "minnesota", name: "U of Minnesota", location: "Minneapolis, MN", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "wisconsin", name: "U of Wisconsin", location: "Madison, WI", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "illinois", name: "U of Illinois", location: "Urbana-Champaign, IL", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "nyu", name: "NYU", location: "New York, NY", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "fordham", name: "Fordham University", location: "New York, NY", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "bu", name: "Babson University", location: "Wellesley, MA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-15", label: "Early Decision II" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "american", name: "American University", location: "Washington, DC", deadlines: [{ type: "EA", date: "2025-11-15", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-11-01", label: "Dean's Honor Scholarship" }] },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "rpi", name: "RPI", location: "Troy, NY", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-11-01", label: "Rensselaer Medal" }] },
  { id: "wpi", name: "WPI", location: "Worcester, MA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "case", name: "Case Western Reserve", location: "Cleveland, OH", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Merit Scholarship" }] },
  { id: "rochester", name: "U of Rochester", location: "Rochester, NY", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "tulsa", name: "U of Tulsa", location: "Tulsa, OK", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-11-01", label: "Presidential Scholarship" }] },
  { id: "drexel", name: "Drexel University", location: "Philadelphia, PA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "temple", name: "Temple University", location: "Philadelphia, PA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Diamond Scholar" }] },
  { id: "smu", name: "SMU", location: "Dallas, TX", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }, { type: "Scholarship", date: "2025-11-01", label: "President's Scholar Award" }] },
  { id: "byu", name: "BYU", location: "Provo, UT", deadlines: [{ type: "RD", date: "2025-12-15", label: "Regular Decision" }] },
  { id: "colorado", name: "U of Colorado Boulder", location: "Boulder, CO", deadlines: [{ type: "EA", date: "2025-11-15", label: "Early Action" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "arizona", name: "U of Arizona", location: "Tucson, AZ", deadlines: [{ type: "RD", date: "2026-05-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Excellence Award" }] },
  { id: "asu", name: "Arizona State", location: "Tempe, AZ", deadlines: [{ type: "RD", date: "2026-02-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "New American University Scholarship" }] },
  { id: "fsu", name: "Florida State", location: "Tallahassee, FL", deadlines: [{ type: "EA", date: "2025-10-15", label: "Early Action" }, { type: "RD", date: "2026-03-01", label: "Regular Decision" }] },
  { id: "uf", name: "U of Florida", location: "Gainesville, FL", deadlines: [{ type: "EA", date: "2025-10-15", label: "Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "miami", name: "U of Miami", location: "Coral Gables, FL", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }, { type: "Scholarship", date: "2025-12-01", label: "Stamps Scholarship" }] },
  { id: "bu2", name: "Boston College", location: "Chestnut Hill, MA", deadlines: [{ type: "EA", date: "2025-11-01", label: "Early Action" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-15", label: "Early Decision II" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "colby", name: "Colby College", location: "Waterville, ME", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-03", label: "Regular Decision" }] },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision" }, { type: "RD", date: "2026-01-08", label: "Regular Decision" }] },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-02", label: "Early Decision II" }, { type: "RD", date: "2026-01-02", label: "Regular Decision" }] },
  { id: "wellesley", name: "Wellesley College", location: "Wellesley, MA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "bryn_mawr", name: "Bryn Mawr College", location: "Bryn Mawr, PA", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-15", label: "Early Decision II" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-08", label: "Early Decision II" }, { type: "RD", date: "2026-01-08", label: "Regular Decision" }] },
  { id: "harvey_mudd", name: "Harvey Mudd College", location: "Claremont, CA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "claremont", name: "Claremont McKenna", location: "Claremont, CA", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-10", label: "Early Decision II" }, { type: "RD", date: "2026-01-10", label: "Regular Decision" }] },
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-05", label: "Early Decision II" }, { type: "RD", date: "2026-01-05", label: "Regular Decision" }] },
  { id: "vassar", name: "Vassar College", location: "Poughkeepsie, NY", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "wesleyan", name: "Wesleyan University", location: "Middletown, CT", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "hamilton", name: "Hamilton College", location: "Clinton, NY", deadlines: [{ type: "ED", date: "2025-11-01", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-01", label: "Regular Decision" }] },
  { id: "bates", name: "Bates College", location: "Lewiston, ME", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-01", label: "Early Decision II" }, { type: "RD", date: "2026-01-15", label: "Regular Decision" }] },
  { id: "trinity", name: "Trinity College", location: "Hartford, CT", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-15", label: "Early Decision II" }, { type: "RD", date: "2026-02-01", label: "Regular Decision" }] },
  { id: "union", name: "Union College", location: "Schenectady, NY", deadlines: [{ type: "ED", date: "2025-11-15", label: "Early Decision I" }, { type: "ED2", date: "2026-01-15", label: "Early Decision II" }, { type: "RD", date: "2026-02-15", label: "Regular Decision" }] },
];

const DEADLINE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  EA: { bg: "#e0f2fe", text: "#0369a1", border: "#7dd3fc" },
  ED: { bg: "#fce7f3", text: "#be185d", border: "#f9a8d4" },
  ED2: { bg: "#ede9fe", text: "#6d28d9", border: "#c4b5fd" },
  RD: { bg: "#f0fdf4", text: "#166534", border: "#86efac" },
  Scholarship: { bg: "#fefce8", text: "#854d0e", border: "#fde047" },
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Home() {
  const [step, setStep] = useState<Step>("onboarding");
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reminderPrefs, setReminderPrefs] = useState<ReminderPrefs>({
    email: "",
    phone: "",
    remindAt: [30, 14, 7, 1],
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [expandedCollege, setExpandedCollege] = useState<string | null>(null);
  const [remindersSaved, setRemindersSaved] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("edutracker_schools");
    const storedProfile = localStorage.getItem("edutracker_profile");
    const storedReminders = localStorage.getItem("edutracker_reminders");
    if (stored) {
      const schools = JSON.parse(stored) as string[];
      setSelectedSchools(schools);
      if (schools.length > 0) setStep("dashboard");
    }
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile) as UserProfile);
    }
    if (storedReminders) {
      setReminderPrefs(JSON.parse(storedReminders) as ReminderPrefs);
    }
  }, []);

  const handleAuth = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json() as { ok?: boolean; email?: string; error?: string };
      if (data.ok && data.email) {
        const p: UserProfile = { email: data.email, loggedIn: true };
        setProfile(p);
        localStorage.setItem("edutracker_profile", JSON.stringify(p));
        setReminderPrefs((prev) => ({ ...prev, email: data.email ?? "" }));
      } else {
        setAuthError(data.error ?? "Authentication failed");
      }
    } catch {
      setAuthError("Network error, please try again");
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, authEmail, authPassword]);

  const toggleSchool = useCallback((id: string) => {
    setSelectedSchools((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const handleSchoolsNext = useCallback(() => {
    if (selectedSchools.length === 0) return;
    localStorage.setItem("edutracker_schools", JSON.stringify(selectedSchools));
    setStep("reminders");
  }, [selectedSchools]);

  const toggleReminderDay = useCallback((day: number) => {
    setReminderPrefs((prev) => ({
      ...prev,
      remindAt: prev.remindAt.includes(day)
        ? prev.remindAt.filter((d) => d !== day)
        : [...prev.remindAt, day].sort((a, b) => b - a),
    }));
  }, []);

  const handleSaveReminders = useCallback(async () => {
    localStorage.setItem("edutracker_reminders", JSON.stringify(reminderPrefs));
    setRemindersSaved(true);
    setDbSaving(true);

    if (profile?.loggedIn) {
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "/reminders-saved",
            meta: {
              email: reminderPrefs.email,
              phone: reminderPrefs.phone,
              remindAt: reminderPrefs.remindAt,
              schools: selectedSchools,
            },
          }),
        });
      } catch {
        // non-critical
      }
    }

    setDbSaving(false);
    setTimeout(() => {
      setStep("dashboard");
    }, 1200);
  }, [reminderPrefs, profile, selectedSchools]);

  const getUpcomingDeadlines = useCallback((): UserDeadline[] => {
    const deadlines: UserDeadline[] = [];
    selectedSchools.forEach((id) => {
      const college = COLLEGES.find((c) => c.id === id);
      if (!college) return;
      college.deadlines.forEach((dl) => {
        const daysUntil = getDaysUntil(dl.date);
        deadlines.push({
          collegeId: id,
          collegeName: college.name,
          deadlineType: dl.type,
          deadlineLabel: dl.label,
          date: dl.date,
          daysUntil,
        });
      });
    });
    return deadlines.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [selectedSchools]);

  const filteredColleges = COLLEGES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingDeadlines = getUpcomingDeadlines();
  const filteredDeadlines = filterType === "All"
    ? upcomingDeadlines
    : upcomingDeadlines.filter((d) => d.deadlineType === filterType);

  const urgentCount = upcomingDeadlines.filter((d) => d.daysUntil >= 0 && d.daysUntil <= 7).length;
  const pastCount = upcomingDeadlines.filter((d) => d.daysUntil < 0).length;
  const upcomingCount = upcomingDeadlines.filter((d) => d.daysUntil >= 0).length;

  if (step === "onboarding") {
    return (
      <div style={styles.onboardingPage}>
        <div style={styles.onboardingCard}>
          <div style={styles.logoArea}>
            <span style={styles.logoIcon}>🎓</span>
            <h1 style={styles.logoText}>Edutracker</h1>
          </div>
          <h2 style={styles.onboardingHeadline}>Never Miss a College Deadline</h2>
          <p style={styles.onboardingSubtitle}>
            Track EA, ED, RD, and scholarship deadlines for 80+ top colleges. Get reminders 30, 14, 7, and 1 day before each deadline.
          </p>

          <div style={styles.featureGrid}>
            {[
              { icon: "🏫", title: "80+ Colleges", desc: "Curated list of top US universities" },
              { icon: "📅", title: "All Deadline Types", desc: "EA, ED, ED2, RD & Scholarships" },
              { icon: "🔔", title: "Smart Reminders", desc: "Email & SMS at 30, 14, 7, 1 days out" },
              { icon: "📊", title: "Dashboard", desc: "Chronological view of your deadlines" },
            ].map((f) => (
              <div key={f.title} style={styles.featureCard}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <strong style={styles.featureTitle}>{f.title}</strong>
                <span style={styles.featureDesc}>{f.desc}</span>
              </div>
            ))}
          </div>

          <div style={styles.authBox}>
            <div style={styles.authTabs}>
              <button
                style={{ ...styles.authTab, ...(authMode === "signup" ? styles.authTabActive : {}) }}
                onClick={() => setAuthMode("signup")}
              >
                Create Account
              </button>
              <button
                style={{ ...styles.authTab, ...(authMode === "login" ? styles.authTabActive : {}) }}
                onClick={() => setAuthMode("login")}
              >
                Sign In
              </button>
            </div>
            {profile?.loggedIn ? (
              <div style={styles.loggedInBox}>
                <span style={styles.checkmark}>✓</span>
                <span>Signed in as <strong>{profile.email}</strong></span>
              </div>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  style={styles.input}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAuth(); }}
                />
                {authError && <p style={styles.errorText}>{authError}</p>}
                <button onClick={handleAuth} disabled={authLoading} style={styles.authBtn}>
                  {authLoading ? "..." : authMode === "signup" ? "Create Account" : "Sign In"}
                </button>
              </>
            )}
          </div>

          <button onClick={() => setStep("schools")} style={styles.ctaBtn}>
            {profile?.loggedIn ? "Choose My Schools →" : "Continue as Guest →"}
          </button>
          <p style={styles.guestNote}>You can always sign in later to save your reminders</p>
        </div>
      </div>
    );
  }

  if (step === "schools") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.logoSmall}>🎓 Edutracker</span>
            <div style={styles.stepIndicator}>
              <span style={styles.stepActive}>1. Schools</span>
              <span style={styles.stepDivider}>›</span>
              <span style={styles.stepInactive}>2. Reminders</span>
              <span style={styles.stepDivider}>›</span>
              <span style={styles.stepInactive}>3. Dashboard</span>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Select Your Target Schools</h2>
            <p style={styles.sectionSubtitle}>Choose all the colleges you&apos;re applying to. You can change this later.</p>
          </div>

          <div style={styles.searchBar}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search colleges by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} style={styles.clearBtn}>✕</button>
            )}
          </div>

          {selectedSchools.length > 0 && (
            <div style={styles.selectedBadge}>
              {selectedSchools.length} school{selectedSchools.length !== 1 ? "s" : ""} selected
            </div>
          )}

          <div style={styles.collegeGrid}>
            {filteredColleges.map((college) => {
              const isSelected = selectedSchools.includes(college.id);
              return (
                <button
                  key={college.id}
                  onClick={() => toggleSchool(college.id)}
                  style={{
                    ...styles.collegeCard,
                    ...(isSelected ? styles.collegeCardSelected : {}),
                  }}
                >
                  <div style={styles.collegeCardTop}>
                    <div style={styles.collegeCheckbox}>
                      {isSelected ? <span style={styles.checkmark}>✓</span> : null}
                    </div>
                    <div style={styles.collegeInfo}>
                      <strong style={styles.collegeName}>{college.name}</strong>
                      <span style={styles.collegeLocation}>📍 {college.location}</span>
                    </div>
                  </div>
                  <div style={styles.deadlinePills}>
                    {college.deadlines.map((dl) => {
                      const c = DEADLINE_COLORS[dl.type];
                      return (
                        <span key={dl.type + dl.date} style={{
                          ...styles.pill,
                          background: c.bg,
                          color: c.text,
                          border: `1px solid ${c.border}`,
                        }}>
                          {dl.type}
                        </span>
                      );
                    })}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredColleges.length === 0 && (
            <div style={styles.emptyState}>No colleges match your search.</div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={() => setStep("onboarding")} style={styles.backBtn}>← Back</button>
          <button
            onClick={handleSchoolsNext}
            disabled={selectedSchools.length === 0}
            style={{
              ...styles.nextBtn,
              ...(selectedSchools.length === 0 ? styles.nextBtnDisabled : {}),
            }}
          >
            Next: Set Reminders →
          </button>
        </div>
      </div>
    );
  }

  if (step === "reminders") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.logoSmall}>🎓 Edutracker</span>
            <div style={styles.stepIndicator}>
              <span style={styles.stepDone}>1. Schools ✓</span>
              <span style={styles.stepDivider}>›</span>
              <span style={styles.stepActive}>2. Reminders</span>
              <span style={styles.stepDivider}>›</span>
              <span style={styles.stepInactive}>3. Dashboard</span>
            </div>
          </div>
        </div>

        <div style={styles.content}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Set Up Reminders</h2>
            <p style={styles.sectionSubtitle}>
              We&apos;ll remind you before each deadline. Choose how and when you&apos;d like to be notified.
            </p>
          </div>

          <div style={styles.reminderCard}>
            <h3 style={styles.reminderSectionTitle}>📧 Email Reminders</h3>
            <input
              type="email"
              placeholder="your@email.com"
              value={reminderPrefs.email}
              onChange={(e) => setReminderPrefs((p) => ({ ...p, email: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={styles.reminderCard}>
            <h3 style={styles.reminderSectionTitle}>📱 SMS Reminders (optional)</h3>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={reminderPrefs.phone}
              onChange={(e) => setReminderPrefs((p) => ({ ...p, phone: e.target.value }))}
              style={styles.input}
            />
          </div>

          <div style={styles.reminderCard}>
            <h3 style={styles.reminderSectionTitle}>⏰ When to Remind Me</h3>
            <p style={styles.reminderNote}>Select all that apply — we&apos;ll send reminders this many days before each deadline:</p>
            <div style={styles.reminderDays}>
              {[30, 14, 7, 1].map((day) => {
                const active = reminderPrefs.remindAt.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleReminderDay(day)}
                    style={{
                      ...styles.dayBtn,
                      ...(active ? styles.dayBtnActive : {}),
                    }}
                  >
                    {active && <span style={{ marginRight: 4 }}>✓</span>}
                    {day} day{day > 1 ? "s" : ""} before
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.reminderCard}>
            <h3 style={styles.reminderSectionTitle}>📋 Your Selected Schools</h3>
            <div style={styles.schoolSummaryList}>
              {selectedSchools.map((id) => {
                const college = COLLEGES.find((c) => c.id === id);
                if (!college) return null;
                return (
                  <div key={id} style={styles.schoolSummaryItem}>
                    <span style={styles.schoolSummaryName}>{college.name}</span>
                    <div style={styles.deadlinePills}>
                      {college.deadlines.map((dl) => {
                        const c = DEADLINE_COLORS[dl.type];
                        return (
                          <span key={dl.type + dl.date} style={{
                            ...styles.pill,
                            background: c.bg,
                            color: c.text,
                            border: `1px solid ${c.border}`,
                          }}>
                            {dl.type}: {dl.date}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {remindersSaved && (
            <div style={styles.successBanner}>
              ✅ Preferences saved! Redirecting to your dashboard...
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={() => setStep("schools")} style={styles.backBtn}>← Back</button>
          <button
            onClick={handleSaveReminders}
            disabled={dbSaving || remindersSaved}
            style={styles.nextBtn}
          >
            {dbSaving ? "Saving..." : remindersSaved ? "Saved ✓" : "Save & View Dashboard →"}
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <span style={styles.logoSmall}>🎓 Edutracker</span>
          <div style={styles.headerActions}>
            {profile?.loggedIn && (
              <span style={styles.profileBadge}>👤 {profile.email}</span>
            )}
            <button onClick={() => setStep("schools")} style={styles.editBtn}>
              ✏️ Edit Schools
            </button>
          </div>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.dashboardStats}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{selectedSchools.length}</span>
            <span style={styles.statLabel}>Schools</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{upcomingCount}</span>
            <span style={styles.statLabel}>Upcoming</span>
          </div>
          <div style={{ ...styles.statCard, ...(urgentCount > 0 ? styles.statCardUrgent : {}) }}>
            <span style={styles.statNumber}>{urgentCount}</span>
            <span style={styles.statLabel}>Within 7 Days</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{pastCount}</span>
            <span style={styles.statLabel}>Past</span>
          </div>
        </div>

        {reminderPrefs.email && (
          <div style={styles.reminderInfo}>
            🔔 Reminders set to <strong>{reminderPrefs.email}</strong>
            {reminderPrefs.phone && <> and <strong>{reminderPrefs.phone}</strong></>}
            {" "}at{" "}
            {reminderPrefs.remindAt.map((d) => `${d}d`).join(", ")} before each deadline
            <button onClick={() => setStep("reminders")} style={styles.editReminderBtn}>
              Edit
            </button>
          </div>
        )}

        <div style={styles.filterRow}>
          <span style={styles.filterLabel}>Filter:</span>
          {["All", "EA", "ED", "ED2", "RD", "Scholarship"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                ...styles.filterBtn,
                ...(filterType === type ? styles.filterBtnActive : {}),
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {savedMessage && <div style={styles.successBanner}>{savedMessage}</div>}

        {filteredDeadlines.length === 0 ? (
          <div style={styles.emptyState}>
            No {filterType !== "All" ? filterType + " " : ""}deadlines found.
            {selectedSchools.length === 0 && (
              <button onClick={() => setStep("schools")} style={styles.ctaBtn}>
                Add Schools
              </button>
            )}
          </div>
        ) : (
          <div style={styles.deadlineList}>
            {filteredDeadlines.map((dl, idx) => {
              const isPast = dl.daysUntil < 0;
              const isUrgent = dl.daysUntil >= 0 && dl.daysUntil <= 7;
              const isWarning = dl.daysUntil > 7 && dl.daysUntil <= 14;
              const colors = DEADLINE_COLORS[dl.deadlineType] ?? DEADLINE_COLORS.RD;
              const isExpanded = expandedCollege === dl.collegeId + dl.date;
              const college = COLLEGES.find((c) => c.id === dl.collegeId);

              return (
                <div
                  key={idx}
                  style={{
                    ...styles.deadlineCard,
                    ...(isPast ? styles.deadlineCardPast : {}),
                    ...(isUrgent ? styles.deadlineCardUrgent : {}),
                  }}
                >
                  <div style={styles.deadlineCardLeft}>
                    <span style={{
                      ...styles.deadlineTypeBadge,
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}>
                      {dl.deadlineType}
                    </span>
                    <div style={styles.deadlineInfo}>
                      <strong style={styles.deadlineCollegeName}>{dl.collegeName}</strong>
                      <span style={styles.deadlineTypeLabel}>{dl.deadlineLabel}</span>
                      <span style={styles.deadlineDate}>📅 {formatDate(dl.date)}</span>
                    </div>
                  </div>
                  <div style={styles.deadlineCardRight}>
                    {isPast ? (
                      <span style={styles.pastBadge}>Past</span>
                    ) : (
                      <div style={styles.countdownContainer}>
                        <span style={{
                          ...styles.countdown,
                          ...(isUrgent ? styles.countdownUrgent : {}),
                          ...(isWarning ? styles.countdownWarning : {}),
                        }}>
                          {dl.daysUntil === 0 ? "TODAY" : `${dl.daysUntil}d`}
                        </span>
                        {(isUrgent || isWarning) && (
                          <span style={styles.urgentIcon}>{isUrgent ? "🔴" : "🟡"}</span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setExpandedCollege(isExpanded ? null : dl.collegeId + dl.date)}
                      style={styles.expandBtn}
                    >
                      {isExpanded ? "▲" : "▼"}
                    </button>
                  </div>

                  {isExpanded && college && (
                    <div style={styles.expandedPanel}>
                      <h4 style={styles.expandedTitle}>All {college.name} Deadlines</h4>
                      {college.deadlines.map((cdl) => {
                        const dc = getDaysUntil(cdl.date);
                        const cc = DEADLINE_COLORS[cdl.type];
                        return (
                          <div key={cdl.type + cdl.date} style={styles.expandedRow}>
                            <span style={{
                              ...styles.pill,
                              background: cc.bg,
                              color: cc.text,
                              border: `1px solid ${cc.border}`,
                            }}>
                              {cdl.type}
                            </span>
                            <span style={styles.expandedRowLabel}>{cdl.label}</span>
                            <span style={styles.expandedRowDate}>{formatDate(cdl.date)}</span>
                            <span style={{
                              ...styles.expandedCountdown,
                              color: dc < 0 ? "#9ca3af" : dc <= 7 ? "#dc2626" : "#374151",
                            }}>
                              {dc < 0 ? "Passed" : dc === 0 ? "Today!" : `${dc} days`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.dashboardFooter}>
        <button
          onClick={() => {
            localStorage.removeItem("edutracker_schools");
            setSelectedSchools([]);
            setStep("onboarding");
          }}
          style={styles.resetBtn}
        >
          Start Over
        </button>
        <span style={styles.footerNote}>
          Data current for 2025–2026 application cycle
        </span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  onboardingPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 50%, #1a5276 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  onboardingCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    maxWidth: 560,
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
    justifyContent: "center",
  },
  logoIcon: { fontSize: 36 },
  logoText: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e3a5f",
    margin: 0,
    letterSpacing: -0.5,
  },
  onboardingHeadline: {
    fontSize: 26,
    fontWeight: 700,
    color: "#1e3a5f",
    textAlign: "center",
    margin: "0 0 12px",
  },
  onboardingSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    margin: "0 0 28px",
    lineHeight: 1.6,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 28,
  },
  featureCard: {
    background: "#f8fafc",
    borderRadius: 12,
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
    border: "1px solid #e2e8f0",
  },
  featureIcon: { fontSize: 22 },
  featureTitle: { fontSize: 13, color: "#1e3a5f", fontWeight: 700 },
  featureDesc: { fontSize: 12, color: "#6b7280" },
  authBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "20px",
    marginBottom: 20,
  },
  authTabs: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  authTab: {
    flex: 1,
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  authTabActive: {
    background: "#1e3a5f",
    color: "#fff",
    borderColor: "#1e3a5f",
  },
  loggedInBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    background: "#f0fdf4",
    borderRadius: 8,
    border: "1px solid #86efac",
    color: "#166534",
    fontSize: 14,
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 10,
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    margin: "0 0 10px",
  },
  authBtn: {
    width: "100%",
    padding: "10px",
    background: "#2d6a9f",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  ctaBtn: {
    display: "block",
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    marginTop: 8,
  },
  guestNote: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  headerInner: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoSmall: {
    fontSize: 18,
    fontWeight: 800,
    color: "#1e3a5f",
  },
  stepIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
  },
  stepActive: { color: "#1e3a5f", fontWeight: 700 },
  stepInactive: { color: "#9ca3af" },
  stepDone: { color: "#16a34a", fontWeight: 600 },
  stepDivider: { color: "#d1d5db" },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  profileBadge: {
    fontSize: 13,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: 20,
  },
  editBtn: {
    padding: "6px 14px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
  },
  content: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "24px 20px",
    width: "100%",
    flex: 1,
    boxSizing: "border-box",
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "0 0 8px",
  },
  sectionSubtitle: {
    fontSize: 15,
    color: "#6b7280",
    margin: 0,
  },
  searchBar: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  searchIcon: { fontSize: 16, marginRight: 10, color: "#9ca3af" },
  searchInput: {
    border: "none",
    outline: "none",
    flex: 1,
    fontSize: 15,
    color: "#374151",
    background: "transparent",
    fontFamily: "inherit",
  },
  clearBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "#9ca3af",
    padding: "0 4px",
  },
  selectedBadge: {
    display: "inline-block",
    background: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 16,
  },
  collegeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 12,
    marginBottom: 80,
  },
  collegeCard: {
    background: "#fff",
    border: "2px solid #e2e8f0",
    borderRadius: 12,
    padding: "14px 16px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s",
  },
  collegeCardSelected: {
    borderColor: "#2563eb",
    background: "#eff6ff",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.12)",
  },
  collegeCardTop: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  collegeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    border: "2px solid #d1d5db",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  checkmark: { color: "#16a34a", fontWeight: 700, fontSize: 14 },
  collegeInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  collegeName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1e3a5f",
  },
  collegeLocation: {
    fontSize: 12,
    color: "#6b7280",
  },
  deadlinePills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 20,
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#fff",
    borderTop: "1px solid #e2e8f0",
    padding: "14px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 100,
    boxShadow: "0 -2px 8px rgba(0,0,0,0.07)",
  },
  backBtn: {
    padding: "10px 20px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
  },
  nextBtn: {
    padding: "12px 28px",
    background: "linear-gradient(135deg, #1e3a5f, #2d6a9f)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
  },
  nextBtnDisabled: {
    background: "#d1d5db",
    cursor: "not-allowed",
  },
  reminderCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "20px 24px",
    marginBottom: 16,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  reminderSectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "0 0 14px",
  },
  reminderNote: {
    fontSize: 13,
    color: "#6b7280",
    margin: "0 0 12px",
  },
  reminderDays: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 4,
  },
  dayBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "2px solid #d1d5db",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  dayBtnActive: {
    background: "#dbeafe",
    borderColor: "#2563eb",
    color: "#1d4ed8",
    fontWeight: 700,
  },
  schoolSummaryList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    maxHeight: 240,
    overflowY: "auto",
  },
  schoolSummaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  schoolSummaryName: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e3a5f",
  },
  successBanner: {
    background: "#f0fdf4",
    border: "1px solid #86efac",
    color: "#166534",
    borderRadius: 10,
    padding: "12px 16px",
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 500,
  },
  dashboardStats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: "16px",
    textAlign: "center",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  statCardUrgent: {
    background: "#fef2f2",
    borderColor: "#fca5a5",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 800,
    color: "#1e3a5f",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 500,
  },
  reminderInfo: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    color: "#1d4ed8",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  editReminderBtn: {
    background: "none",
    border: "1px solid #93c5fd",
    color: "#1d4ed8",
    borderRadius: 6,
    padding: "2px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
  },
  filterRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 500,
  },
  filterBtn: {
    padding: "5px 14px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
    transition: "all 0.15s",
  },
  filterBtnActive: {
    background: "#1e3a5f",
    borderColor: "#1e3a5f",
    color: "#fff",
    fontWeight: 700,
  },
  deadlineList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingBottom: 40,
  },
  deadlineCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    padding: "16px 18px",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    transition: "box-shadow 0.15s",
    width: "100%",
    boxSizing: "border-box",
  },
  deadlineCardPast: {
    opacity: 0.55,
    background: "#fafafa",
  },
  deadlineCardUrgent: {
    borderColor: "#fca5a5",
    background: "#fff7f7",
    boxShadow: "0 0 0 2px rgba(220,38,38,0.1)",
  },
  deadlineCardLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  deadlineTypeBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    marginTop: 2,
  },
  deadlineInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  deadlineCollegeName: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1e3a5f",
  },
  deadlineTypeLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  deadlineDate: {
    fontSize: 13,
    color: "#374151",
  },
  deadlineCardRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  pastBadge: {
    fontSize: 12,
    color: "#9ca3af",
    background: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: 20,
  },
  countdownContainer: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  countdown: {
    fontSize: 22,
    fontWeight: 800,
    color: "#1e3a5f",
  },
  countdownUrgent: {
    color: "#dc2626",
  },
  countdownWarning: {
    color: "#d97706",
  },
  urgentIcon: { fontSize: 14 },
  expandBtn: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: 6,
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: 12,
    color: "#6b7280",
  },
  expandedPanel: {
    width: "100%",
    background: "#f8fafc",
    borderRadius: 10,
    padding: "14px 16px",
    marginTop: 4,
    borderTop: "1px solid #e2e8f0",
  },
  expandedTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1e3a5f",
    margin: "0 0 10px",
  },
  expandedRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 0",
    borderBottom: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  expandedRowLabel: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
    minWidth: 120,
  },
  expandedRowDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  expandedCountdown: {
    fontSize: 13,
    fontWeight: 700,
    minWidth: 70,
    textAlign: "right",
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 24px",
    color: "#9ca3af",
    fontSize: 16,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  dashboardFooter: {
    borderTop: "1px solid #e2e8f0",
    padding: "14px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
  },
  resetBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    color: "#6b7280",
  },
  footerNote: {
    fontSize: 12,
    color: "#9ca3af",
  },
};