export interface CollegeDeadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  label: string;
  date: string;
  notes?: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  deadlines: CollegeDeadline[];
}

export const COLLEGES: College[] = [
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    type: "Ivy League",
    deadlines: [
      { type: "EA", label: "Restrictive Early Action", date: "2025-11-01", notes: "Single-choice early action" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
      { type: "Scholarship", label: "Harvard Financial Aid", date: "2026-01-01", notes: "No separate scholarship app needed" },
    ],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    type: "Ivy League",
    deadlines: [
      { type: "EA", label: "Single-Choice Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
    ],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    type: "Ivy League",
    deadlines: [
      { type: "EA", label: "Restrictive Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "columbia",
    name: "Columbia University",
    location: "New York, NY",
    type: "Ivy League",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "penn",
    name: "University of Pennsylvania",
    location: "Philadelphia, PA",
    type: "Ivy League",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "brown",
    name: "Brown University",
    location: "Providence, RI",
    type: "Ivy League",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    type: "Ivy League",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "cornell",
    name: "Cornell University",
    location: "Ithaca, NY",
    type: "Ivy League",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-03" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "mit",
    name: "MIT",
    location: "Cambridge, MA",
    type: "Tech",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "caltech",
    name: "Caltech",
    location: "Pasadena, CA",
    type: "Tech",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Restrictive Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
    ],
  },
  {
    id: "uchicago",
    name: "University of Chicago",
    location: "Chicago, IL",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-04" },
      { type: "RD", label: "Regular Decision", date: "2026-01-04" },
      { type: "Scholarship", label: "Merit Scholarships", date: "2025-11-01" },
    ],
  },
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-03" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
      { type: "Scholarship", label: "Chancellor's Scholarship", date: "2025-11-01" },
    ],
  },
  {
    id: "rice",
    name: "Rice University",
    location: "Houston, TX",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-04" },
    ],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Restrictive Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
      { type: "Scholarship", label: "University Scholarships", date: "2025-12-01" },
    ],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, DC",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-10" },
    ],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
      { type: "Scholarship", label: "Emory Scholars Program", date: "2025-11-15" },
    ],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "cmu",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    type: "Tech",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "johns-hopkins",
    name: "Johns Hopkins University",
    location: "Baltimore, MD",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
    ],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
    ],
  },
  {
    id: "wash-u",
    name: "Washington University in St. Louis",
    location: "St. Louis, MO",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
      { type: "Scholarship", label: "John B. Ervin Scholarship", date: "2025-11-01" },
    ],
  },
  {
    id: "wake-forest",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Deans' Honor Scholarship", date: "2025-11-01" },
    ],
  },
  {
    id: "boston-university",
    name: "Boston University",
    location: "Boston, MA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
      { type: "Scholarship", label: "Trustee Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "bc",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Trustee Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "nyu",
    name: "New York University",
    location: "New York, NY",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "New York, NY",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "ga-tech",
    name: "Georgia Tech",
    location: "Atlanta, GA",
    type: "Tech",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-10-15", notes: "In-state EA deadline" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
      { type: "Scholarship", label: "Faculty Honors", date: "2025-10-15" },
    ],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
      { type: "Scholarship", label: "Stamps Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-10-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Morehead-Cain Scholarship", date: "2025-10-15" },
    ],
  },
  {
    id: "virginia",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Restrictive Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
      { type: "Scholarship", label: "Jefferson Scholarship", date: "2025-10-15" },
    ],
  },
  {
    id: "michigan",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
    ],
  },
  {
    id: "ucb",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30", notes: "All UC campuses share this deadline" },
      { type: "Scholarship", label: "Regents & Chancellor's Scholarship", date: "2025-11-30" },
    ],
  },
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30" },
    ],
  },
  {
    id: "ucsd",
    name: "UC San Diego",
    location: "La Jolla, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30" },
      { type: "Scholarship", label: "Chancellor's Scholarship", date: "2025-11-30" },
    ],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30" },
    ],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
      { type: "Scholarship", label: "Morrill Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "University Park, PA",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-30" },
      { type: "RD", label: "Regular Decision", date: "2026-03-01" },
    ],
  },
  {
    id: "ut-austin",
    name: "UT Austin",
    location: "Austin, TX",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-12-15" },
      { type: "Scholarship", label: "Forty Acres Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "florida",
    name: "University of Florida",
    location: "Gainesville, FL",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-10-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Florida Academic Scholarship", date: "2025-10-15" },
    ],
  },
  {
    id: "illinois",
    name: "University of Illinois Urbana-Champaign",
    location: "Champaign, IL",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "uw-madison",
    name: "University of Wisconsin-Madison",
    location: "Madison, WI",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
    ],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-03" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "williams",
    name: "Williams College",
    location: "Williamstown, MA",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "pomona",
    name: "Pomona College",
    location: "Claremont, CA",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-08" },
      { type: "RD", label: "Regular Decision", date: "2026-01-08" },
    ],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-15" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-02" },
    ],
  },
  {
    id: "wellesley",
    name: "Wellesley College",
    location: "Wellesley, MA",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-08" },
      { type: "Scholarship", label: "Wellesley Scholarship Program", date: "2026-01-08" },
    ],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-15" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-05" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-01" },
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-03" },
      { type: "RD", label: "Regular Decision", date: "2026-01-03" },
    ],
  },
  {
    id: "colgate",
    name: "Colgate University",
    location: "Hamilton, NY",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-15" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "holy-cross",
    name: "College of the Holy Cross",
    location: "Worcester, MA",
    type: "Liberal Arts",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-12-01" },
      { type: "ED", label: "Early Decision", date: "2025-11-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "davidson",
    name: "Davidson College",
    location: "Davidson, NC",
    type: "Liberal Arts",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-15" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-02" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "case-western",
    name: "Case Western Reserve University",
    location: "Cleveland, OH",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Merit Scholarships", date: "2025-12-01" },
    ],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    location: "Rochester, NY",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-05" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "rpi",
    name: "RPI (Rensselaer Polytechnic Institute)",
    location: "Troy, NY",
    type: "Tech",
    deadlines: [
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Rensselaer Medal Scholarship", date: "2026-01-15" },
    ],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "american",
    name: "American University",
    location: "Washington, DC",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Decision I", date: "2025-11-15" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Frederick Douglass Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "george-washington",
    name: "George Washington University",
    location: "Washington, DC",
    type: "Private",
    deadlines: [
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-05" },
      { type: "RD", label: "Regular Decision", date: "2026-01-05" },
    ],
  },
  {
    id: "pitt",
    name: "University of Pittsburgh",
    location: "Pittsburgh, PA",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Chancellor's Scholarship", date: "2025-11-01" },
    ],
  },
  {
    id: "umd",
    name: "University of Maryland",
    location: "College Park, MD",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-20" },
      { type: "Scholarship", label: "Banneker/Key Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "rutgers",
    name: "Rutgers University",
    location: "New Brunswick, NJ",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-12-01" },
    ],
  },
  {
    id: "minnesota",
    name: "University of Minnesota",
    location: "Minneapolis, MN",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-12-15" },
      { type: "Scholarship", label: "Maroon & Gold Distinguished Scholarship", date: "2025-12-15" },
    ],
  },
  {
    id: "indiana",
    name: "Indiana University Bloomington",
    location: "Bloomington, IN",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
      { type: "Scholarship", label: "Provost Scholarship", date: "2025-12-01" },
    ],
  },
  {
    id: "uga",
    name: "University of Georgia",
    location: "Athens, GA",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-10-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Foundation Fellowship", date: "2025-10-15" },
    ],
  },
  {
    id: "colorado",
    name: "University of Colorado Boulder",
    location: "Boulder, CO",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Priority Deadline", date: "2025-11-15" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
    ],
  },
  {
    id: "miami",
    name: "University of Miami",
    location: "Coral Gables, FL",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision", date: "2025-11-01" },
      { type: "RD", label: "Regular Decision", date: "2026-01-15" },
      { type: "Scholarship", label: "Stamps Scholarship", date: "2025-12-15" },
    ],
  },
  {
    id: "smu",
    name: "Southern Methodist University",
    location: "Dallas, TX",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-11-01" },
      { type: "ED", label: "Early Decision I", date: "2025-11-01" },
      { type: "ED2", label: "Early Decision II", date: "2026-01-15" },
      { type: "RD", label: "Regular Decision", date: "2026-03-15" },
      { type: "Scholarship", label: "President's Scholars Program", date: "2025-11-01" },
    ],
  },
  {
    id: "baylor",
    name: "Baylor University",
    location: "Waco, TX",
    type: "Private",
    deadlines: [
      { type: "EA", label: "Early Action I", date: "2025-10-15" },
      { type: "RD", label: "Regular Decision", date: "2026-02-01" },
      { type: "Scholarship", label: "Regents Gold Scholarship", date: "2025-11-01" },
    ],
  },
  {
    id: "texas-am",
    name: "Texas A&M University",
    location: "College Station, TX",
    type: "Public",
    deadlines: [
      { type: "EA", label: "Early Action", date: "2025-10-15" },
      { type: "RD", label: "Regular Decision", date: "2026-12-01" },
    ],
  },
  {
    id: "ucsb-honors",
    name: "UC Santa Cruz",
    location: "Santa Cruz, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30" },
    ],
  },
  {
    id: "uci",
    name: "UC Irvine",
    location: "Irvine, CA",
    type: "Public",
    deadlines: [
      { type: "RD", label: "UC Application Deadline", date: "2025-11-30" },
    ],
  },
];