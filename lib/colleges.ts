export interface Deadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  date: string; // YYYY-MM-DD
  label?: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  deadlines: Deadline[];
}

export const COLLEGES: College[] = [
  {
    id: "mit",
    name: "MIT",
    location: "Cambridge, MA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Single-Choice Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "columbia",
    name: "Columbia University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "penn",
    name: "University of Pennsylvania",
    location: "Philadelphia, PA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "brown",
    name: "Brown University",
    location: "Providence, RI",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "cornell",
    name: "Cornell University",
    location: "Ithaca, NY",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2026-01-15", label: "Cornelius Vanderbilt Scholarship" },
    ],
  },
  {
    id: "rice",
    name: "Rice University",
    location: "Houston, TX",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-04", label: "Regular Decision" },
    ],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, DC",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-15", label: "Emory Scholars" },
    ],
  },
  {
    id: "georgetown-2",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-15", label: "Merit Aid" },
    ],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "EA", date: "2025-11-15", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-15", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "boston-college",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bu",
    name: "Boston University",
    location: "Boston, MA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "nyu",
    name: "New York University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
      { type: "Scholarship", date: "2026-03-02", label: "Regents/Chancellor Scholarship" },
    ],
  },
  {
    id: "ucberkeley",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
      { type: "Scholarship", date: "2026-01-09", label: "Regents & Chancellor's Scholarship" },
    ],
  },
  {
    id: "ucsd",
    name: "UC San Diego",
    location: "La Jolla, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
    ],
  },
  {
    id: "ucdavis",
    name: "UC Davis",
    location: "Davis, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
    ],
  },
  {
    id: "uchicago",
    name: "University of Chicago",
    location: "Chicago, IL",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "wash-u",
    name: "Washington University in St. Louis",
    location: "St. Louis, MO",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "uw-madison",
    name: "University of Wisconsin-Madison",
    location: "Madison, WI",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Honors Scholarship" },
    ],
  },
  {
    id: "umich",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "gatech",
    name: "Georgia Tech",
    location: "Atlanta, GA",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action I" },
      { type: "EA", date: "2026-01-02", label: "Early Action II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-10-15", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "caltech",
    name: "Caltech",
    location: "Pasadena, CA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "jhu",
    name: "Johns Hopkins University",
    location: "Baltimore, MD",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "georgetown-3",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
      { type: "Scholarship", date: "2026-01-05", label: "Jefferson Scholars" },
    ],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-10-15", label: "Robertson Scholars" },
    ],
  },
  {
    id: "georgetown-4",
    name: "University of Florida",
    location: "Gainesville, FL",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-03-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2026-01-09", label: "Bright Futures Scholarship" },
    ],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Morrill Scholarship" },
    ],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "State College, PA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action (Priority)" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-01", label: "Trustees Scholarship" },
    ],
  },
  {
    id: "texas",
    name: "University of Texas at Austin",
    location: "Austin, TX",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Priority Deadline" },
      { type: "RD", date: "2026-12-01", label: "Regular Decision" },
    ],
  },
  {
    id: "tamu",
    name: "Texas A&M University",
    location: "College Station, TX",
    deadlines: [
      { type: "EA", date: "2025-10-15", label: "Early Action" },
      { type: "RD", date: "2026-12-01", label: "Regular Decision" },
    ],
  },
  {
    id: "case-western",
    name: "Case Western Reserve University",
    location: "Cleveland, OH",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "President's Scholarship" },
    ],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "rpi",
    name: "Rensselaer Polytechnic Institute",
    location: "Troy, NY",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Rensselaer Medal" },
    ],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "santa-clara",
    name: "Santa Clara University",
    location: "Santa Clara, CA",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-01-07", label: "Regular Decision" },
    ],
  },
  {
    id: "loyola-chicago",
    name: "Loyola University Chicago",
    location: "Chicago, IL",
    deadlines: [
      { type: "EA", date: "2025-11-15", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Loyola Scholarship" },
    ],
  },
  {
    id: "american",
    name: "American University",
    location: "Washington, DC",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "EA", date: "2025-11-15", label: "Early Action" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "uc-irvine",
    name: "UC Irvine",
    location: "Irvine, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
    ],
  },
  {
    id: "uc-santa-barbara",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    deadlines: [
      { type: "RD", date: "2025-11-30", label: "Application Deadline" },
    ],
  },
  {
    id: "miami",
    name: "University of Miami",
    location: "Coral Gables, FL",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Foote Scholarship" },
    ],
  },
  {
    id: "colorado",
    name: "University of Colorado Boulder",
    location: "Boulder, CO",
    deadlines: [
      { type: "EA", date: "2025-11-15", label: "Early Action (Priority)" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Excellence Award" },
    ],
  },
  {
    id: "indiana",
    name: "Indiana University Bloomington",
    location: "Bloomington, IN",
    deadlines: [
      { type: "EA", date: "2025-11-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Wells Scholarship" },
    ],
  },
  {
    id: "miami-ohio",
    name: "Miami University of Ohio",
    location: "Oxford, OH",
    deadlines: [
      { type: "EA", date: "2025-12-01", label: "Early Action" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "colgate",
    name: "Colgate University",
    location: "Hamilton, NY",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
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
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision" },
      { type: "RD", date: "2026-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-02", label: "Early Decision II" },
      { type: "RD", date: "2026-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "pomona",
    name: "Pomona College",
    location: "Claremont, CA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-07", label: "Early Decision II" },
      { type: "RD", date: "2026-01-07", label: "Regular Decision" },
    ],
  },
  {
    id: "claremont",
    name: "Claremont McKenna College",
    location: "Claremont, CA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-03", label: "Early Decision II" },
      { type: "RD", date: "2026-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "davidson",
    name: "Davidson College",
    location: "Davidson, NC",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-11-15", label: "John Montgomery Belk Scholarship" },
    ],
  },
  {
    id: "kenyon",
    name: "Kenyon College",
    location: "Gambier, OH",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "bates",
    name: "Bates College",
    location: "Lewiston, ME",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-01", label: "Early Decision II" },
      { type: "RD", date: "2026-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "lafayette",
    name: "Lafayette College",
    location: "Easton, PA",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bucknell",
    name: "Bucknell University",
    location: "Lewisburg, PA",
    deadlines: [
      { type: "ED", date: "2025-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "gettysburg",
    name: "Gettysburg College",
    location: "Gettysburg, PA",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "denison",
    name: "Denison University",
    location: "Granville, OH",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "EA", date: "2025-12-01", label: "Early Action" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-12-01", label: "Denison Merit Scholarship" },
    ],
  },
  {
    id: "dickinson",
    name: "Dickinson College",
    location: "Carlisle, PA",
    deadlines: [
      { type: "ED", date: "2025-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2026-01-15", label: "Early Decision II" },
      { type: "RD", date: "2026-02-01", label: "Regular Decision" },
    ],
  },
];