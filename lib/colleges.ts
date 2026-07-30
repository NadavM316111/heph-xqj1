export type DeadlineType = "EA" | "ED" | "ED2" | "RD" | "Scholarship" | "Financial Aid";

export interface Deadline {
  type: DeadlineType;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  category: string;
  deadlines: Deadline[];
}

export const COLLEGES: College[] = [
  // ── IVY LEAGUE ──────────────────────────────────────────────────────────────
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    category: "Ivy League",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01" },
      { type: "Financial Aid", date: "2026-02-01" },
    ],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    category: "Ivy League",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Single-Choice Early Action" },
      { type: "RD", date: "2026-01-02" },
      { type: "Financial Aid", date: "2026-02-15" },
    ],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    category: "Ivy League",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01" },
      { type: "Financial Aid", date: "2026-02-01" },
    ],
  },
  {
    id: "columbia",
    name: "Columbia University",
    location: "New York, NY",
    category: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "upenn",
    name: "University of Pennsylvania",
    location: "Philadelphia, PA",
    category: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "brown",
    name: "Brown University",
    location: "Providence, RI",
    category: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    category: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-07" },
    ],
  },
  {
    id: "cornell",
    name: "Cornell University",
    location: "Ithaca, NY",
    category: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-02" },
    ],
  },

  // ── MIT / CALTECH / STANFORD ─────────────────────────────────────────────────
  {
    id: "mit",
    name: "Massachusetts Institute of Technology",
    location: "Cambridge, MA",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01" },
      { type: "Financial Aid", date: "2026-02-15" },
    ],
  },
  {
    id: "caltech",
    name: "California Institute of Technology",
    location: "Pasadena, CA",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-03" },
    ],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-02" },
      { type: "Scholarship", date: "2025-12-01", notes: "Knight-Hennessy Scholars" },
    ],
  },
  {
    id: "johns-hopkins",
    name: "Johns Hopkins University",
    location: "Baltimore, MD",
    category: "STEM-focused",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-02" },
    ],
  },
  {
    id: "carnegie-mellon",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    category: "STEM-focused",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-02" },
    ],
  },
  {
    id: "georgia-tech",
    name: "Georgia Institute of Technology",
    location: "Atlanta, GA",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-10-15" },
      { type: "RD", date: "2026-01-05" },
      { type: "Scholarship", date: "2025-10-15", notes: "Stamps President's Scholars" },
    ],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-11-01", notes: "Trustees Scholarship" },
    ],
  },

  // ── TOP LIBERAL ARTS ─────────────────────────────────────────────────────────
  {
    id: "williams",
    name: "Williams College",
    location: "Williamstown, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-07" },
    ],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-02" },
    ],
  },
  {
    id: "wellesley",
    name: "Wellesley College",
    location: "Wellesley, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-15" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "pomona",
    name: "Pomona College",
    location: "Claremont, CA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-08" },
      { type: "RD", date: "2026-01-08" },
    ],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "vassar",
    name: "Vassar College",
    location: "Poughkeepsie, NY",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-07" },
    ],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "colgate",
    name: "Colgate University",
    location: "Hamilton, NY",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-15" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "oberlin",
    name: "Oberlin College",
    location: "Oberlin, OH",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "grinnell",
    name: "Grinnell College",
    location: "Grinnell, IA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2026-01-15", notes: "Grinnell Scholarship" },
    ],
  },
  {
    id: "smith",
    name: "Smith College",
    location: "Northampton, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "mount-holyoke",
    name: "Mount Holyoke College",
    location: "South Hadley, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-15" },
      { type: "RD", date: "2026-02-01" },
    ],
  },

  // ── TOP PUBLIC UNIVERSITIES ──────────────────────────────────────────────────
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-30" },
      { type: "Scholarship", date: "2026-03-02", notes: "Regents Scholarship" },
    ],
  },
  {
    id: "uc-berkeley",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-30" },
      { type: "Scholarship", date: "2026-03-02", notes: "Regents & Chancellor's Scholarship" },
    ],
  },
  {
    id: "umich",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-11-01", notes: "University Scholarship" },
    ],
  },
  {
    id: "virginia",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
      { type: "Scholarship", date: "2025-12-01", notes: "Jefferson Scholarship" },
    ],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-10-15" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-10-15", notes: "Robertson Scholars" },
    ],
  },
  {
    id: "ut-austin",
    name: "University of Texas at Austin",
    location: "Austin, TX",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2025-12-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Forty Acres Scholars" },
    ],
  },
  {
    id: "florida",
    name: "University of Florida",
    location: "Gainesville, FL",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-03-01" },
      { type: "Scholarship", date: "2025-11-01", notes: "Machen Florida Opportunity Scholars" },
    ],
  },
  {
    id: "illinois",
    name: "University of Illinois Urbana-Champaign",
    location: "Champaign, IL",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Morrill Scholarship" },
    ],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "University Park, PA",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-11-30", notes: "Schreyer Honors Scholarship" },
    ],
  },
  {
    id: "wisconsin",
    name: "University of Wisconsin-Madison",
    location: "Madison, WI",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
    ],
  },
  {
    id: "washington",
    name: "University of Washington",
    location: "Seattle, WA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-15" },
      { type: "Scholarship", date: "2025-11-15", notes: "Husky Promise" },
    ],
  },
  {
    id: "uc-san-diego",
    name: "UC San Diego",
    location: "San Diego, CA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-30" },
    ],
  },
  {
    id: "uc-davis",
    name: "UC Davis",
    location: "Davis, CA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-30" },
    ],
  },
  {
    id: "uc-santa-barbara",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    category: "Public",
    deadlines: [
      { type: "RD", date: "2025-11-30" },
    ],
  },

  // ── TOP LARGE UNIVERSITIES ───────────────────────────────────────────────────
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-02" },
      { type: "Scholarship", date: "2025-10-15", notes: "Robertson Scholars" },
    ],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Cornelius Vanderbilt Scholarship" },
    ],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-02" },
      { type: "RD", date: "2026-01-02" },
    ],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01", notes: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Hesburgh-Yusko Scholars" },
    ],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-11-01", notes: "Emory Scholars" },
    ],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, D.C.",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-10" },
    ],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "wake-forest",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
      { type: "Scholarship", date: "2025-11-15", notes: "Merit Scholarship" },
    ],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-11-15", notes: "Deans Honor Scholarship" },
    ],
  },
  {
    id: "boston-university",
    name: "Boston University",
    location: "Boston, MA",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-03" },
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-03" },
      { type: "Scholarship", date: "2025-12-01", notes: "Trustee Scholarship" },
    ],
  },
  {
    id: "bc",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "University Honors Program" },
    ],
  },
  {
    id: "george-washington",
    name: "George Washington University",
    location: "Washington, D.C.",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-05" },
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "case-western",
    name: "Case Western Reserve University",
    location: "Cleveland, OH",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-12-01", notes: "National Merit" },
    ],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    location: "Rochester, NY",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-15" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "brandeis",
    name: "Brandeis University",
    location: "Waltham, MA",
    category: "Liberal Arts",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "RD", date: "2026-01-01" },
    ],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-12-01", notes: "Presidential Scholarship" },
    ],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "New York, NY",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-15" },
    ],
  },
  {
    id: "pepperdine",
    name: "Pepperdine University",
    location: "Malibu, CA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-12-01", notes: "Presidential Academic Scholarship" },
    ],
  },
  {
    id: "american",
    name: "American University",
    location: "Washington, D.C.",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "ED", date: "2025-11-15" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2026-01-15", notes: "Merit Scholarship" },
    ],
  },
  {
    id: "syracuse",
    name: "Syracuse University",
    location: "Syracuse, NY",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "ED", date: "2025-11-15" },
      { type: "RD", date: "2026-01-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Coronat Quam Servavit Scholarship" },
    ],
  },
  {
    id: "drexel",
    name: "Drexel University",
    location: "Philadelphia, PA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-03-01" },
    ],
  },
  {
    id: "miami",
    name: "University of Miami",
    location: "Coral Gables, FL",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "Foote Fellows Scholarship" },
    ],
  },
  {
    id: "rpi",
    name: "Rensselaer Polytechnic Institute",
    location: "Troy, NY",
    category: "STEM-focused",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "EA", date: "2025-11-15" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-12-01", notes: "Rensselaer Medal" },
    ],
  },
  {
    id: "wpi",
    name: "Worcester Polytechnic Institute",
    location: "Worcester, MA",
    category: "STEM-focused",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-11-01", notes: "WPI Scholarship" },
    ],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    category: "Large University",
    deadlines: [
      { type: "EA", date: "2025-12-01" },
      { type: "ED", date: "2025-11-01" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2026-01-15", notes: "Trustee & Presidential Scholarship" },
    ],
  },
  {
    id: "new-york-university",
    name: "New York University",
    location: "New York, NY",
    category: "Large University",
    deadlines: [
      { type: "ED", date: "2025-11-01" },
      { type: "ED2", date: "2026-01-01" },
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-01-05" },
    ],
  },
  {
    id: "arizona-state",
    name: "Arizona State University",
    location: "Tempe, AZ",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-01" },
      { type: "RD", date: "2026-02-01" },
      { type: "Scholarship", date: "2025-12-01", notes: "New American University Scholarship" },
    ],
  },
  {
    id: "colorado",
    name: "University of Colorado Boulder",
    location: "Boulder, CO",
    category: "Public",
    deadlines: [
      { type: "EA", date: "2025-11-15" },
      { type: "RD", date: "2026-01-15" },
      { type: "Scholarship", date: "2025-12-01", notes: "Esteemed Scholar Award" },
    ],
  },
];