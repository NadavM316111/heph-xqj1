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
}

interface Deadline {
  collegeId: string;
  collegeName: string;
  type: string;
  date: string;
  daysUntil: number;
}

interface UserSchool {
  id: number;
  college_id: string;
  college_name: string;
  deadline_type: string;
  deadline_date: string;
  email_reminder: boolean;
  sms_reminder: boolean;
  phone_number: string;
  reminder_email: string;
}

interface ReminderSettings {
  email: string;
  phone: string;
  emailReminders: boolean;
  smsReminders: boolean;
}

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", type: "Private", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15" },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", type: "Private", ed: "2024-11-01", rd: "2025-01-01" },
  { id: "yale", name: "Yale University", location: "New Haven, CT", type: "Private", ed: "2024-11-01", rd: "2025-01-02" },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", type: "Private", ed: "2024-11-01", rd: "2025-01-01" },
  { id: "columbia", name: "Columbia University", location: "New York, NY", type: "Private", ed: "2024-11-01", rd: "2025-01-01" },
  { id: "upenn", name: "UPenn", location: "Philadelphia, PA", type: "Private", ed: "2024-11-01", rd: "2025-01-05" },
  { id: "brown", name: "Brown University", location: "Providence, RI", type: "Private", ed: "2024-11-01", rd: "2025-01-05" },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", type: "Private", ed: "2024-11-01", rd: "2025-01-03" },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", type: "Private", ed: "2024-11-01", rd: "2025-01-02" },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", type: "Private", ea: "2024-11-01", rd: "2025-01-05" },
  { id: "caltech", name: "Caltech", location: "Pasadena, CA", type: "Private", ea: "2024-11-01", rd: "2025-01-03", scholarship: "2025-01-03" },
  { id: "duke", name: "Duke University", location: "Durham, NC", type: "Private", ed: "2024-11-01", ed2: "2025-01-03", rd: "2025-01-06" },
  { id: "jhu", name: "Johns Hopkins", location: "Baltimore, MD", type: "Private", ed: "2024-11-01", ed2: "2025-01-02", rd: "2025-01-05" },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-03" },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-03" },
  { id: "rice", name: "Rice University", location: "Houston, TX", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-06", scholarship: "2025-01-06" },
  { id: "wustl", name: "WashU St. Louis", location: "St. Louis, MO", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-03", scholarship: "2025-01-15" },
  { id: "notre-dame", name: "Notre Dame", location: "Notre Dame, IN", type: "Private", ea: "2024-11-01", rd: "2025-01-05" },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", type: "Private", ea: "2024-11-01", rd: "2025-01-10" },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-07", scholarship: "2025-02-01" },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-06" },
  { id: "carnegie-mellon", name: "Carnegie Mellon", location: "Pittsburgh, PA", type: "Private", ed: "2024-11-01", rd: "2025-01-04" },
  { id: "uchicago", name: "UChicago", location: "Chicago, IL", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-06" },
  { id: "usc", name: "USC", location: "Los Angeles, CA", type: "Private", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01" },
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-03" },
  { id: "bu", name: "Boston University", location: "Boston, MA", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-05", scholarship: "2024-12-01" },
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-06" },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", type: "Private", ea: "2024-11-01", rd: "2025-01-15", scholarship: "2025-02-15" },
  { id: "wake-forest", name: "Wake Forest", location: "Winston-Salem, NC", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-05" },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", type: "Private", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-10" },
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", type: "Private", ed: "2024-11-15", rd: "2025-01-15" },
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", type: "Private", ed: "2024-11-15", ed2: "2025-01-01", rd: "2025-01-15" },
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", type: "Private", ed: "2024-11-15", rd: "2025-01-08" },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", type: "Private", ed: "2024-11-15", rd: "2025-01-10" },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", type: "Private", ed: "2024-11-01", rd: "2025-01-07" },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", type: "Private", ed: "2024-11-15", rd: "2025-01-05" },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", type: "Private", ed: "2024-11-15", rd: "2025-01-08" },
  { id: "harvey-mudd", name: "Harvey Mudd College", location: "Claremont, CA", type: "Private", ed: "2024-11-15", rd: "2025-01-05" },
  { id: "claremont-mckenna", name: "Claremont McKenna", location: "Claremont, CA", type: "Private", ed: "2024-11-01", rd: "2025-01-08" },
  { id: "hamilton", name: "Hamilton College", location: "Clinton, NY", type: "Private", ed: "2024-11-15", rd: "2025-01-05" },
  { id: "uchicago-booth", name: "Oberlin College", location: "Oberlin, OH", type: "Private", ed: "2024-11-15", rd: "2025-01-15" },
  { id: "vassar", name: "Vassar College", location: "Poughkeepsie, NY", type: "Private", ed: "2024-11-15", rd: "2025-01-05" },
  { id: "colby", name: "Colby College", location: "Waterville, ME", type: "Private", ed: "2024-11-15", rd: "2025-01-04" },
  { id: "bates", name: "Bates College", location: "Lewiston, ME", type: "Private", ed: "2024-11-15", rd: "2025-01-15" },
  { id: "haverford", name: "Haverford College", location: "Haverford, PA", type: "Private", ed: "2024-11-15", rd: "2025-01-15" },
  { id: "uc-berkeley", name: "UC Berkeley", location: "Berkeley, CA", type: "Public", rd: "2024-11-30", scholarship: "2025-02-28" },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", type: "Public", rd: "2024-11-30", scholarship: "2025-03-02" },
  { id: "ucsd", name: "UC San Diego", location: "La Jolla, CA", type: "Public", rd: "2024-11-30" },
  { id: "ucsb", name: "UC Santa Barbara", location: "Santa Barbara, CA", type: "Public", rd: "2024-11-30" },
  { id: "ucdavis", name: "UC Davis", location: "Davis, CA", type: "Public", rd: "2024-11-30" },
  { id: "uci", name: "UC Irvine", location: "Irvine, CA", type: "Public", rd: "2024-11-30" },
  { id: "umich", name: "U of Michigan", location: "Ann Arbor, MI", type: "Public", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", type: "Public", ea: "2024-10-15", rd: "2025-01-15", scholarship: "2024-10-15" },
  { id: "virginia", name: "U of Virginia", location: "Charlottesville, VA", type: "Public", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01" },
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", type: "Public", ea: "2024-10-15", rd: "2025-01-07", scholarship: "2025-02-01" },
  { id: "ut-austin", name: "UT Austin", location: "Austin, TX", type: "Public", ea: "2024-10-15", rd: "2024-12-01", scholarship: "2024-12-01" },
  { id: "ohio-state", name: "Ohio State", location: "Columbus, OH", type: "Public", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-12-01" },
  { id: "penn-state", name: "Penn State", location: "State College, PA", type: "Public", rd: "2024-11-30", scholarship: "2024-11-30" },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", type: "Public", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" },
  { id: "illinois", name: "U of Illinois", location: "Champaign, IL", type: "Public", ea: "2024-11-01", rd: "2025-01-05" },
  { id: "minnesota", name: "U of Minnesota", location: "Minneapolis, MN", type: "Public", ea: "2024-11-01", rd: "2025-01-01" },
  { id: "indiana", name: "Indiana University", location: "Bloomington, IN", type: "Public", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-12-01" },
  { id: "florida", name: "U of Florida", location: "Gainesville, FL", type: "Public", rd: "2024-11-01", scholarship: "2024-11-01" },
  { id: "fsu", name: "Florida State", location: "Tallahassee, FL", type: "Public", rd: "2025-03-01", scholarship: "2025-01-15" },
  { id: "colorado", name: "U of Colorado Boulder", location: "Boulder, CO", type: "Public", ea: "2024-11-15", rd: "2025-01-15" },
  { id: "wisconsin", name: "U of Wisconsin", location: "Madison, WI", type: "Public", ea: "2024-11-01", rd: "2025-02-01" },
  { id: "nyu", name: "NYU", location: "New York, NY", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-05", scholarship: "2024-12-01" },
  { id: "fordham", name: "Fordham University", location: "Bronx, NY", type: "Private", ea: "2024-11-01", rd: "2025-01-15" },
  { id: "george-washington", name: "George Washington", location: "Washington, DC", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-10" },
  { id: "american", name: "American University", location: "Washington, DC", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2025-02-01" },
  { id: "villanova", name: "Villanova University", location: "Villanova, PA", type: "Private", ea: "2024-11-01", rd: "2025-01-15" },
  { id: "santa-clara", name: "Santa Clara University", location: "Santa Clara, CA", type: "Private", ea: "2024-11-01", rd: "2025-01-13" },
  { id: "loyola-chicago", name: "Loyola U Chicago", location: "Chicago, IL", type: "Private", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01" },
  { id: "drexel", name: "Drexel University", location: "Philadelphia, PA", type: "Private", ea: "2024-11-01", rd: "2025-03-01", scholarship: "2024-11-01" },
  { id: "case-western", name: "Case Western Reserve", location: "Cleveland, OH", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2025-02-01" },
  { id: "rochester", name: "U of Rochester", location: "Rochester, NY", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-05" },
  { id: "rensselaer", name: "RPI", location: "Troy, NY", type: "Private", ea: "2024-11-01", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-01" },
  { id: "worcester", name: "WPI", location: "Worcester, MA", type: "Private", ea: "2024-11-01", rd: "2025-02-01" },
  { id: "stevens", name: "Stevens Institute", location: "Hoboken, NJ", type: "Private", ea: "2024-11-15", ed: "2024-11-15", rd: "2025-02-01", scholarship: "2025-01-15" },
  { id: "bucknell", name: "Bucknell University", location: "Lewisburg, PA", type: "Private", ed: "2024-11-15", rd: "2025-01-15" },
  { id: "lafayette", name: "Lafayette College", location: "Easton, PA", type: "Private", ed: "2024-11-15", rd: "2025-02-01" },
  { id: "denison", name: "Denison University", location: "Granville, OH", type: "Private", ea: "2024-11-15", rd: "2025-02-01", scholarship: "2025-01-15" },
  { id: "ohio-wesleyan", name: "Dickinson College", location: "Carlisle, PA", type: "Private", ed: "2024-11-15", rd: "2025-02-01", scholarship: "2025-02-01" },
];

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDeadlineColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function getDeadlineBadgeStyle(type: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    EA: { background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" },
    ED: { background: "#fce7f3", color: "#be185d", border: "1px solid #fbcfe8" },
    "ED II": { background: "#f3e8ff", color: "#7c3aed", border: "1px solid #e9d5ff" },
    RD: { background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" },
    Scholarship: { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" },
  };
  return map[type] || { background: "#f3f4f6", color: "#374151" };
}

export default function Home() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [step, setStep] = useState<"loading" | "auth" | "onboard-schools" | "onboard-reminders" | "dashboard">("loading");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(new Set());
  const [selectedDeadlineTypes, setSelectedDeadlineTypes] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"All" | "Private" | "Public">("All");

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    email: "",
    phone: "",
    emailReminders: true,
    smsReminders: false,
  });

  const [userSchools, setUserSchools] = useState<UserSchool[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [savingSchools, setSavingSchools] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth");
      const data = await res.json();
      if (data.email) {
        setUserEmail(data.email);
        setReminderSettings(prev => ({ ...prev, email: data.email }));
        await loadUserSchools();
        setStep("dashboard");
      } else {
        setStep("auth");
      }
    } catch {
      setStep("auth");
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadUserSchools = async () => {
    setLoadingSchools(true);
    try {
      const res = await fetch("/api/schools");
      if (res.ok) {
        const data = await res.json();
        setUserSchools(data.schools || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email: authEmail, password: authPassword }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setUserEmail(data.email);
        setReminderSettings(prev => ({ ...prev, email: data.email }));
        const schoolsRes = await fetch("/api/schools");
        if (schoolsRes.ok) {
          const schoolsData = await schoolsRes.json();
          if (schoolsData.schools && schoolsData.schools.length > 0) {
            setUserSchools(schoolsData.schools);
            setStep("dashboard");
          } else {
            setStep("onboard-schools");
          }
        } else {
          setStep("onboard-schools");
        }
      }
    } catch {
      setAuthError("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "logout" }) });
    setUserEmail("");
    setUserSchools([]);
    setSelectedColleges(new Set());
    setStep("auth");
  };

  const toggleCollege = (collegeId: string) => {
    setSelectedColleges(prev => {
      const next = new Set(prev);
      if (next.has(collegeId)) {
        next.delete(collegeId);
        setSelectedDeadlineTypes(dt => {
          const n = { ...dt };
          delete n[collegeId];
          return n;
        });
      } else {
        next.add(collegeId);
        const college = COLLEGES.find(c => c.id === collegeId);
        if (college) {
          const types: string[] = [];
          if (college.ea) types.push("EA");
          if (college.ed) types.push("ED");
          if (college.ed2) types.push("ED II");
          types.push("RD");
          if (college.scholarship) types.push("Scholarship");
          setSelectedDeadlineTypes(dt => ({ ...dt, [collegeId]: types }));
        }
      }
      return next;
    });
  };

  const toggleDeadlineType = (collegeId: string, type: string) => {
    setSelectedDeadlineTypes(prev => {
      const current = prev[collegeId] || [];
      const exists = current.includes(type);
      return {
        ...prev,
        [collegeId]: exists ? current.filter(t => t !== type) : [...current, type],
      };
    });
  };

  const handleSaveSchools = async () => {
    setSavingSchools(true);
    try {
      const entries: Array<{ collegeId: string; collegeName: string; deadlineType: string; deadlineDate: string; emailReminder: boolean; smsReminder: boolean; phone: string; email: string }> = [];

      selectedColleges.forEach(collegeId => {
        const college = COLLEGES.find(c => c.id === collegeId);
        if (!college) return;
        const types = selectedDeadlineTypes[collegeId] || [];
        types.forEach(type => {
          let date = "";
          if (type === "EA" && college.ea) date = college.ea;
          else if (type === "ED" && college.ed) date = college.ed;
          else if (type === "ED II" && college.ed2) date = college.ed2;
          else if (type === "RD") date = college.rd;
          else if (type === "Scholarship" && college.scholarship) date = college.scholarship;
          if (date) {
            entries.push({
              collegeId,
              collegeName: college.name,
              deadlineType: type,
              deadlineDate: date,
              emailReminder: reminderSettings.emailReminders,
              smsReminder: reminderSettings.smsReminders,
              phone: reminderSettings.phone,
              email: reminderSettings.email,
            });
          }
        });
      });

      await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schools: entries }),
      });

      await loadUserSchools();
      setStep("dashboard");
    } catch {
      // ignore
    } finally {
      setSavingSchools(false);
    }
  };

  const handleDeleteSchool = async (id: number) => {
    try {
      await fetch(`/api/schools?id=${id}`, { method: "DELETE" });
      setUserSchools(prev => prev.filter(s => s.id !== id));
    } catch {
      // ignore
    }
  };

  const getCountdown = (dateStr: string) => {
    const target = new Date(dateStr + "T00:00:00");
    const diff = target.getTime() - now.getTime();
    if (diff < 0) return "Past";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today!";
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const filteredColleges = COLLEGES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const deadlines: Deadline[] = userSchools.map(s => ({
    collegeId: s.college_id,
    collegeName: s.college_name,
    type: s.deadline_type,
    date: s.deadline_date,
    daysUntil: getDaysUntil(s.deadline_date),
  }));

  const filteredDeadlines = deadlines
    .filter(d => {
      if (activeFilter === "upcoming") return d.daysUntil >= 0;
      if (activeFilter === "past") return d.daysUntil < 0;
      return true;
    })
    .filter(d => d.collegeName.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
      d.type.toLowerCase().includes(dashboardSearch.toLowerCase()))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingCount = deadlines.filter(d => d.daysUntil >= 0).length;
  const urgentCount = deadlines.filter(d => d.daysUntil >= 0 && d.daysUntil <= 14).length;

  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
        <div style={{ textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Loading Edutracker...</div>
        </div>
      </div>
    );
  }

  if (step === "auth") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 420, boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🎓</div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Edutracker</h1>
            <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>Never miss a college application deadline</p>
          </div>

          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {(["signup", "login"] as const).map(mode => (
              <button key={mode} onClick={() => setAuthMode(mode)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, transition: "all 0.2s", background: authMode === mode ? "white" : "transparent", color: authMode === mode ? "#4f46e5" : "#6b7280", boxShadow: authMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {mode === "signup" ? "Sign Up" : "Log In"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email</label>
              <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required placeholder="you@example.com" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#4f46e5"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#4f46e5"} onBlur={e => e.target.style.borderColor = "#e5e7eb"} />
            </div>
            {authError && <div style={{ background: "#fef2f2", color: "#dc2626", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 16, border: "1px solid #fecaca" }}>{authError}</div>}
            <button type="submit" disabled={authLoading} style={{ width: "100%", padding: "12px 0", background: authLoading ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: authLoading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
              {authLoading ? "Please wait..." : authMode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === "onboard-schools") {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "0 0 80px" }}>
        <div style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", padding: "32px 24px", color: "white", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏫</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Choose Your Target Schools</h1>
          <p style={{ opacity: 0.85, marginTop: 6, fontSize: 14 }}>Select schools and which deadlines to track</p>
          <div style={{ marginTop: 12, display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 16px", fontSize: 13 }}>
            {selectedColleges.size} school{selectedColleges.size !== 1 ? "s" : ""} selected
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="🔍 Search schools..." style={{ flex: 1, minWidth: 200, padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }} />
            {(["All", "Private", "Public"] as const).map(t => (
              <button key={t} onClick={() => setFilterType(t)} style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid", borderColor: filterType === t ? "#4f46e5" : "#e5e7eb", background: filterType === t ? "#4f46e5" : "white", color: filterType === t ? "white" : "#6b7280", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {filteredColleges.map(college => {
              const isSelected = selectedColleges.has(college.id);
              const selectedTypes = selectedDeadlineTypes[college.id] || [];
              const availableTypes: string[] = [];
              if (college.ea) availableTypes.push("EA");
              if (college.ed) availableTypes.push("ED");
              if (college.ed2) availableTypes.push("ED II");
              availableTypes.push("RD");
              if (college.scholarship) availableTypes.push("Scholarship");

              return (
                <div key={college.id} style={{ background: "white", borderRadius: 12, border: `2px solid ${isSelected ? "#4f46e5" : "#e5e7eb"}`, overflow: "hidden", transition: "all 0.2s", boxShadow: isSelected ? "0 4px 12px rgba(79,70,229,0.15)" : "0 1px 3px rgba(0,0,0,0.05)" }}>
                  <div onClick={() => toggleCollege(college.id)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e1b4b" }}>{college.name}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{college.location}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ fontSize: 11, background: college.type === "Public" ? "#dbeafe" : "#fce7f3", color: college.type === "Public" ? "#1d4ed8" : "#be185d", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{college.type}</span>
                      </div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? "#4f46e5" : "#d1d5db"}`, background: isSelected ? "#4f46e5" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8 }}>
                      {isSelected && <span style={{ color: "white", fontSize: 13, lineHeight: 1 }}>✓</span>}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ padding: "0 16px 14px", borderTop: "1px solid #f3f4f6" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, marginTop: 10 }}>TRACK DEADLINES:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {availableTypes.map(type => {
                          const active = selectedTypes.includes(type);
                          let dateStr = "";
                          if (type === "EA" && college.ea) dateStr = formatDate(college.ea);
                          else if (type === "ED" && college.ed) dateStr = formatDate(college.ed);
                          else if (type === "ED II" && college.ed2) dateStr = formatDate(college.ed2);
                          else if (type === "RD") dateStr = formatDate(college.rd);
                          else if (type === "Scholarship" && college.scholarship) dateStr = formatDate(college.scholarship);
                          return (
                            <button key={type} onClick={() => toggleDeadlineType(college.id, type)} style={{ padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${active ? "#4f46e5" : "#e5e7eb"}`, background: active ? "#eef2ff" : "white", color: active ? "#4f46e5" : "#6b7280", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                              {type} · {dateStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedColleges.size > 0 && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e5e7eb", padding: "16px 24px", display: "flex", justifyContent: "center" }}>
            <button onClick={() => setStep("onboard-reminders")} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: 12, padding: "14px 40px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
              Set Up Reminders →
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === "onboard-reminders") {
    const totalDeadlines = Array.from(selectedColleges).reduce((sum, id) => {
      return sum + (selectedDeadlineTypes[id]?.length || 0);
    }, 0);

    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 500, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🔔</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b4b", margin: 0 }}>Set Up Reminders</h2>
            <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8 }}>
              We'll remind you 30, 14, 7, and 1 day before each of your <strong>{totalDeadlines} deadlines</strong>
            </p>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 20, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>📧 Email Reminders</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
              <input type="checkbox" checked={reminderSettings.emailReminders} onChange={e => setReminderSettings(prev => ({ ...prev, emailReminders: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ fontSize: 14, color: "#374151" }}>Enable email reminders</span>
            </label>
            {reminderSettings.emailReminders && (
              <input type="email" value={reminderSettings.email} onChange={e => setReminderSettings(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 18px", marginBottom: 28, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>📱 SMS Reminders</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 12 }}>
              <input type="checkbox" checked={reminderSettings.smsReminders} onChange={e => setReminderSettings(prev => ({ ...prev, smsReminders: e.target.checked }))} style={{ width: 18, height: 18, cursor: "pointer" }} />
              <span style={{ fontSize: 14, color: "#374151" }}>Enable SMS reminders</span>
            </label>
            {reminderSettings.smsReminders && (
              <input type="tel" value={reminderSettings.phone} onChange={e => setReminderSettings(prev => ({ ...prev, phone: e.target.value }))} placeholder="+1 (555) 000-0000" style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setStep("onboard-schools")} style={{ flex: 1, padding: "12px 0", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              ← Back
            </button>
            <button onClick={handleSaveSchools} disabled={savingSchools} style={{ flex: 2, padding: "12px 0", background: savingSchools ? "#a5b4fc" : "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: savingSchools ? "not-allowed" : "pointer" }}>
              {savingSchools ? "Saving..." : "Save & View Dashboard 🎉"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "white", padding: "0 0 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 28 }}>🎓</span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Edutracker</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, opacity: 0.85 }}>{userEmail}</span>
              <button onClick={() => { setSelectedColleges(new Set()); setSelectedDeadlineTypes({}); setStep("onboard-schools"); }} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                + Add Schools
              </button>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "7px 14px", fontSize: 13, cursor: "pointer" }}>
                Sign Out
              </button>
            </div>
          </div>

          <div style={{ marginTop: 28, marginBottom: 8 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Application Dashboard</h1>
            <p style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>2024–25 College Application Cycle</p>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
            {[
              { label: "Total Deadlines", value: deadlines.length, icon: "📋" },
              { label: "Upcoming", value: upcomingCount, icon: "⏰" },
              { label: "Urgent (≤14 days)", value: urgentCount, icon: "🔥", alert: urgentCount > 0 },
              { label: "Schools Tracked", value: new Set(userSchools.map(s => s.college_id)).size, icon: "🏫" },
            ].map(stat => (
              <div key={stat.label} style={{ background: stat.alert ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.12)", borderRadius: 12, padding: "14px 18px", minWidth: 130, border: stat.alert ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.15)" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1100, margin: "-20px auto 0", padding: "0 20px 40px" }}>
        {/* Controls */}
        <div style={{ background: "white", borderRadius: 14, padding: "16px 20px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input value={dashboardSearch} onChange={e => setDashboardSearch(e.target.value)} placeholder="🔍 Search deadlines..." style={{ flex: 1, minWidth: 180, padding: "9px 14px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" }} />
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 3, gap: 2 }}>
            {(["all", "upcoming", "past"] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: activeFilter === f ? "white" : "transparent", color: activeFilter === f ? "#4f46e5" : "#6b7280", boxShadow: activeFilter === f ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loadingSchools ? (
          <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <div>Loading your deadlines...</div>
          </div>
        ) : filteredDeadlines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "white", borderRadius: 14, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "#1e1b4b", margin: "0 0 8px" }}>
              {userSchools.length === 0 ? "No schools added yet" : "No deadlines match your filter"}
            </h3>
            <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
              {userSchools.length === 0 ? "Add your target schools to start tracking deadlines" : "Try changing the filter or search term"}
            </p>
            {userSchools.length === 0 && (
              <button onClick={() => { setSelectedColleges(new Set()); setSelectedDeadlineTypes({}); setStep("onboard-schools"); }} style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", border: "none", borderRadius: 10, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Add Schools Now
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {filteredDeadlines.map((deadline, idx) => {
              const daysUntil = deadline.daysUntil;
              const isPast = daysUntil < 0;
              const color = getDeadlineColor(daysUntil);
              const countdown = getCountdown(deadline.date);
              const school = userSchools.find(s => s.college_id === deadline.collegeId && s.deadline_type === deadline.type);
              const college = COLLEGES.find(c => c.id === deadline.collegeId);

              return (
                <div key={`${deadline.collegeId}-${deadline.type}-${idx}`} style={{ background: "white", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${isPast ? "#f3f4f6" : daysUntil <= 7 ? "#fee2e2" : "#f3f4f6"}`, opacity: isPast ? 0.65 : 1, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {/* Countdown ring */}
                  <div style={{ width: 64, height: 64, borderRadius: "50%", background: isPast ? "#f3f4f6" : `${color}18`, border: `3px solid ${isPast ? "#d1d5db" : color}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, flexDirection: "column" }}>
                    <div style={{ fontSize: isPast ? 10 : 12, fontWeight: 800, color: isPast ? "#9ca3af" : color, lineHeight: 1.1, textAlign: "center" }}>
                      {isPast ? "✓" : (
                        <>
                          <div style={{ fontSize: daysUntil === 0 ? 9 : 15, fontWeight: 800 }}>{daysUntil <= 0 ? "!" : daysUntil}</div>
                          {daysUntil > 0 && <div style={{ fontSize: 9, opacity: 0.8 }}>days</div>}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: "#1e1b4b" }}>{deadline.collegeName}</span>
                      <span style={{ ...getDeadlineBadgeStyle(deadline.type), padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{deadline.type}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: "#6b7280" }}>📅 {formatDate(deadline.date)}</span>
                      {college && <span style={{ fontSize: 12, color: "#9ca3af" }}>{college.location}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      {school?.email_reminder && <span style={{ fontSize: 11, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: 20 }}>📧 Email on</span>}
                      {school?.sms_reminder && <span style={{ fontSize: 11, background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd", padding: "2px 8px", borderRadius: 20 }}>📱 SMS on</span>}
                    </div>
                  </div>

                  {/* Countdown */}
                  <div style={{ textAlign: "center", minWidth: 90 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isPast ? "#9ca3af" : color }}>{countdown}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{isPast ? "Deadline passed" : "remaining"}</div>
                    {!isPast && daysUntil <= 30 && (
                      <div style={{ marginTop: 6, background: `${color}15`, borderRadius: 6, padding: "3px 8px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color }}>
                          {daysUntil <= 1 ? "🚨 DUE SOON" : daysUntil <= 7 ? "⚠️ THIS WEEK" : daysUntil <= 14 ? "📌 2 WEEKS" : "📅 THIS MONTH"}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  {school && (
                    <button onClick={() => handleDeleteSchool(school.id)} style={{ background: "none", border: "none", color: "#d1d5db", cursor: "pointer", fontSize: 16, padding: 4, borderRadius: 6, transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")} title="Remove deadline">
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reminder legend */}
        {deadlines.length > 0 && (
          <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginTop: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>⏰ Automatic Reminder Schedule</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["30 days before", "14 days before", "7 days before", "1 day before"].map((label, i) => (
                <div key={label} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#374151" }}>
                  <span style={{ fontWeight: 700 }}>{["📅", "📌", "⚠️", "🚨"][i]}</span> {label}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 10, marginBottom: 0 }}>
              Reminders are sent via email{userSchools.some(s => s.sms_reminder) ? " and SMS" : ""} to configured addresses for each tracked deadline.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}