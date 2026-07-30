export interface Deadline {
  type: "ED" | "ED2" | "EA" | "REA" | "RD" | "Scholarship";
  date: string; // YYYY-MM-DD
  label?: string;
  note?: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: Deadline[];
}

export const COLLEGES: College[] = [
  {
    id: "mit",
    name: "MIT",
    location: "Cambridge, MA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-15", label: "Need-Based Aid", note: "CSS Profile" },
    ],
  },
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    type: "Ivy League",
    deadlines: [
      { type: "REA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    type: "Ivy League",
    deadlines: [
      { type: "REA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    type: "Ivy League",
    deadlines: [
      { type: "REA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "columbia",
    name: "Columbia University",
    location: "New York, NY",
    type: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "upenn",
    name: "University of Pennsylvania",
    location: "Philadelphia, PA",
    type: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
    ],
  },
  {
    id: "brown",
    name: "Brown University",
    location: "Providence, RI",
    type: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    type: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "cornell",
    name: "Cornell University",
    location: "Ithaca, NY",
    type: "Ivy League",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    type: "Research University",
    deadlines: [
      { type: "REA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "caltech",
    name: "Caltech",
    location: "Pasadena, CA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "uchicago",
    name: "University of Chicago",
    location: "Chicago, IL",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-10-15", label: "Robertson Scholarship" },
    ],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Cornelius Vanderbilt Scholarship" },
    ],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "johns-hopkins",
    name: "Johns Hopkins University",
    location: "Baltimore, MD",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "rice",
    name: "Rice University",
    location: "Houston, TX",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "wustl",
    name: "Washington University in St. Louis",
    location: "St. Louis, MO",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Danforth Scholarship" },
    ],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    type: "Research University",
    deadlines: [
      { type: "REA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, D.C.",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "wake-forest",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "EA", date: "2025-11-15", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "bc",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bu",
    name: "Boston University",
    location: "Boston, MA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-02-15", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
    ],
  },
  {
    id: "nyu",
    name: "New York University",
    location: "New York, NY",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "New York, NY",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "case-western",
    name: "Case Western Reserve University",
    location: "Cleveland, OH",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "uva",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    type: "Public Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Jefferson Scholarship" },
    ],
  },
  {
    id: "umich",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-10-15", label: "Morehead-Cain Scholarship" },
    ],
  },
  {
    id: "ga-tech",
    name: "Georgia Tech",
    location: "Atlanta, GA",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    type: "Public Research University",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "UC Application", note: "Same for all UCs" },
    ],
  },
  {
    id: "ucberkeley",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    type: "Public Research University",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "UC Application", note: "Same for all UCs" },
    ],
  },
  {
    id: "ucsd",
    name: "UC San Diego",
    location: "La Jolla, CA",
    type: "Public Research University",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "UC Application", note: "Same for all UCs" },
    ],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    type: "Public Research University",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "UC Application", note: "Same for all UCs" },
    ],
  },
  {
    id: "ucdavis",
    name: "UC Davis",
    location: "Davis, CA",
    type: "Public Research University",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "UC Application", note: "Same for all UCs" },
    ],
  },
  {
    id: "uw",
    name: "University of Washington",
    location: "Seattle, WA",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2025-12-01", label: "Regular Decision" },
    ],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Morrill Scholarship" },
    ],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "University Park, PA",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Rolling Admission" },
    ],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "uiuc",
    name: "UIUC",
    location: "Champaign, IL",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "ut-austin",
    name: "UT Austin",
    location: "Austin, TX",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Priority Deadline" },
      { type: "RD", date: "2025-12-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Plan II Honors" },
    ],
  },
  {
    id: "florida",
    name: "University of Florida",
    location: "Gainesville, FL",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2025-11-01", label: "Regular Decision" },
    ],
  },
  {
    id: "fsu",
    name: "Florida State University",
    location: "Tallahassee, FL",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-03-01", label: "Regular Decision" },
    ],
  },
  {
    id: "unc-ga",
    name: "University of Georgia",
    location: "Athens, GA",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "maryland",
    name: "University of Maryland",
    location: "College Park, MD",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-20", label: "Regular Decision" },
    ],
  },
  {
    id: "pitt",
    name: "University of Pittsburgh",
    location: "Pittsburgh, PA",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-15", label: "Regular Decision" },
    ],
  },
  {
    id: "rutgers",
    name: "Rutgers University",
    location: "New Brunswick, NJ",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Priority Deadline" },
      { type: "RD", date: "2026-12-01", label: "Regular Decision" },
    ],
  },
  {
    id: "indiana",
    name: "Indiana University",
    location: "Bloomington, IN",
    type: "Public Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Wells Scholarship" },
    ],
  },
  {
    id: "william-mary",
    name: "William & Mary",
    location: "Williamsburg, VA",
    type: "Public Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "williams",
    name: "Williams College",
    location: "Williamstown, MA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision" },
      { type: "RD", date: "2026-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-03", label: "Early Decision II" },
      { type: "RD", date: "2026-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "colgate",
    name: "Colgate University",
    location: "Hamilton, NY",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "vassar",
    name: "Vassar College",
    location: "Poughkeepsie, NY",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "bates",
    name: "Bates College",
    location: "Lewiston, ME",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "grinnell",
    name: "Grinnell College",
    location: "Grinnell, IA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "oberlin",
    name: "Oberlin College",
    location: "Oberlin, OH",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "davidson",
    name: "Davidson College",
    location: "Davidson, NC",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-08", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-15", label: "John Montgomery Belk Scholarship" },
    ],
  },
  {
    id: "macalester",
    name: "Macalester College",
    location: "St. Paul, MN",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "carleton",
    name: "Carleton College",
    location: "Northfield, MN",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "scripps",
    name: "Scripps College",
    location: "Claremont, CA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "pomona",
    name: "Pomona College",
    location: "Claremont, CA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-03", label: "Early Decision II" },
      { type: "RD", date: "2026-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "claremont-mckenna",
    name: "Claremont McKenna College",
    location: "Claremont, CA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-10", label: "Early Decision II" },
      { type: "RD", date: "2026-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "harvey-mudd",
    name: "Harvey Mudd College",
    location: "Claremont, CA",
    type: "Liberal Arts College",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "santa-clara",
    name: "Santa Clara University",
    location: "Santa Clara, CA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-09", label: "Regular Decision" },
    ],
  },
  {
    id: "gonzaga",
    name: "Gonzaga University",
    location: "Spokane, WA",
    type: "Research University",
    deadlines: [
      { type: "EA", date: "2025-11-15", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "george-washington",
    name: "George Washington University",
    location: "Washington, D.C.",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-05", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "american",
    name: "American University",
    location: "Washington, D.C.",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    location: "Rochester, NY",
    type: "Research University",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
];