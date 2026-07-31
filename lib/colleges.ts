export interface Deadline {
  type: "EA" | "ED" | "ED2" | "RD" | "Scholarship";
  date: string;
  label?: string;
}

export interface College {
  id: string;
  name: string;
  location: string;
  deadlines: Deadline[];
  tags: string[];
}

export const DEFAULT_COLLEGES: College[] = [
  {
    id: "mit",
    name: "MIT",
    location: "Cambridge, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["STEM", "Research", "Ivy-Plus"],
  },
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Harvard Scholarship" },
    ],
    tags: ["Ivy League", "Liberal Arts", "Research"],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Liberal Arts", "Arts"],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Single-Choice Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Research", "STEM"],
  },
  {
    id: "columbia",
    name: "Columbia University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Urban", "Research"],
  },
  {
    id: "upenn",
    name: "University of Pennsylvania",
    location: "Philadelphia, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Business", "Research"],
  },
  {
    id: "brown",
    name: "Brown University",
    location: "Providence, RI",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Liberal Arts", "Open Curriculum"],
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "Liberal Arts", "Rural"],
  },
  {
    id: "cornell",
    name: "Cornell University",
    location: "Ithaca, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Ivy League", "STEM", "Agriculture"],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Ivy-Plus", "STEM", "Entrepreneurship"],
  },
  {
    id: "caltech",
    name: "Caltech",
    location: "Pasadena, CA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
    tags: ["STEM", "Research", "Science"],
  },
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Research", "Sports", "Liberal Arts"],
  },
  {
    id: "johns-hopkins",
    name: "Johns Hopkins University",
    location: "Baltimore, MD",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Research", "STEM", "Medicine"],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
    tags: ["Research", "Journalism", "Arts"],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Research", "Music", "Southern"],
  },
  {
    id: "rice",
    name: "Rice University",
    location: "Houston, TX",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2024-12-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["STEM", "Research", "Small"],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Catholic", "Sports", "Research"],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, DC",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-10", label: "Regular Decision" },
    ],
    tags: ["Political Science", "Urban", "Catholic"],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Research", "Medicine", "Southern"],
  },
  {
    id: "wake-forest",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Business", "Sports"],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
    ],
    tags: ["International", "Liberal Arts", "Research"],
  },
  {
    id: "boston-college",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Catholic", "Jesuit", "Business"],
  },
  {
    id: "bu",
    name: "Boston University",
    location: "Boston, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-03", label: "Early Decision II" },
      { type: "RD", date: "2025-01-04", label: "Regular Decision" },
    ],
    tags: ["Urban", "Research", "Large"],
  },
  {
    id: "nyu",
    name: "New York University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Urban", "Arts", "Business"],
  },
  {
    id: "carnegie-mellon",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["STEM", "CS", "Arts"],
  },
  {
    id: "georgia-tech",
    name: "Georgia Tech",
    location: "Atlanta, GA",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
    ],
    tags: ["STEM", "Engineering", "Public"],
  },
  {
    id: "uc-berkeley",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application" },
    ],
    tags: ["Public", "Research", "STEM"],
  },
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application" },
    ],
    tags: ["Public", "Research", "Arts"],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application" },
    ],
    tags: ["Public", "Research", "Coastal"],
  },
  {
    id: "ucsd",
    name: "UC San Diego",
    location: "La Jolla, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application" },
    ],
    tags: ["Public", "Research", "STEM"],
  },
  {
    id: "ucd",
    name: "UC Davis",
    location: "Davis, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application" },
    ],
    tags: ["Public", "Agriculture", "Research"],
  },
  {
    id: "michigan",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Merit Scholarship" },
    ],
    tags: ["Public", "Research", "Sports"],
  },
  {
    id: "virginia",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Public", "Liberal Arts", "Southern"],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Public", "Research", "Sports"],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Trustee Scholarship" },
    ],
    tags: ["Research", "Film", "Urban"],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Engineering", "Business", "Research"],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    deadlines: [
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-15", label: "Dean's Honor Scholarship" },
    ],
    tags: ["Southern", "Research", "Public Health"],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "Bronx, NY",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Jesuit", "Urban", "Business"],
  },
  {
    id: "rpi",
    name: "RPI (Rensselaer Polytechnic)",
    location: "Troy, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Rensselaer Medal" },
    ],
    tags: ["STEM", "Engineering", "Research"],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Catholic", "Business", "Engineering"],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Merit Scholarship" },
    ],
    tags: ["STEM", "Engineering", "Public"],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "University Park, PA",
    deadlines: [
      { type: "EA", date: "2024-11-30", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Public", "Research", "Sports"],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Maximus Scholarship" },
    ],
    tags: ["Public", "Research", "Sports"],
  },
  {
    id: "indiana",
    name: "Indiana University Bloomington",
    location: "Bloomington, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Provost Scholarship" },
    ],
    tags: ["Public", "Business", "Music"],
  },
  {
    id: "william-mary",
    name: "William & Mary",
    location: "Williamsburg, VA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
    tags: ["Public", "Liberal Arts", "History"],
  },
  {
    id: "uf",
    name: "University of Florida",
    location: "Gainesville, FL",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "FAS Scholarship" },
    ],
    tags: ["Public", "Research", "Sports"],
  },
  {
    id: "ut-austin",
    name: "UT Austin",
    location: "Austin, TX",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2024-12-01", label: "Regular Decision" },
    ],
    tags: ["Public", "Research", "Business"],
  },
  {
    id: "texas-am",
    name: "Texas A&M University",
    location: "College Station, TX",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "Academic Excellence" },
    ],
    tags: ["Public", "Engineering", "Agriculture"],
  },
  {
    id: "minnesota",
    name: "University of Minnesota",
    location: "Minneapolis, MN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Priority Deadline" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Public", "Research", "Midwest"],
  },
  {
    id: "wisconsin",
    name: "University of Wisconsin-Madison",
    location: "Madison, WI",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Public", "Research", "Midwest"],
  },
  {
    id: "illinois",
    name: "UIUC",
    location: "Champaign, IL",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Public", "STEM", "Engineering"],
  },
  {
    id: "lehigh-u",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01" },
      { type: "ED2", date: "2025-01-01" },
      { type: "RD", date: "2025-01-15" },
    ],
    tags: ["Engineering", "Business", "Research"],
  },
  {
    id: "case-western",
    name: "Case Western Reserve",
    location: "Cleveland, OH",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Merit Scholarship" },
    ],
    tags: ["STEM", "Research", "Medicine"],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    location: "Rochester, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
    tags: ["Research", "Music", "STEM"],
  },
  {
    id: "wellesley",
    name: "Wellesley College",
    location: "Wellesley, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
    tags: ["Women's", "Liberal Arts", "Ivy-Plus"],
  },
  {
    id: "smith",
    name: "Smith College",
    location: "Northampton, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Women's", "Liberal Arts", "Five Colleges"],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Ivy-Plus"],
  },
  {
    id: "williams",
    name: "Williams College",
    location: "Williamstown, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Ivy-Plus"],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Maine"],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Language", "Environmental"],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Maine"],
  },
  {
    id: "colgate",
    name: "Colgate University",
    location: "Hamilton, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Sports"],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "Writing"],
  },
  {
    id: "vassar",
    name: "Vassar College",
    location: "Poughkeepsie, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-04", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Arts", "Small"],
  },
  {
    id: "bryn-mawr",
    name: "Bryn Mawr College",
    location: "Bryn Mawr, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Women's", "Liberal Arts", "Small"],
  },
  {
    id: "haverford",
    name: "Haverford College",
    location: "Haverford, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Quaker", "Small"],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Quaker", "Ivy-Plus"],
  },
  {
    id: "barnard",
    name: "Barnard College",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-04", label: "Regular Decision" },
    ],
    tags: ["Women's", "Urban", "Columbia Affiliate"],
  },
  {
    id: "oberlin",
    name: "Oberlin College",
    location: "Oberlin, OH",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Music", "Arts"],
  },
  {
    id: "davidson",
    name: "Davidson College",
    location: "Davidson, NC",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-10", label: "Early Decision II" },
      { type: "RD", date: "2025-01-10", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Sports", "Southern"],
  },
  {
    id: "grinnell",
    name: "Grinnell College",
    location: "Grinnell, IA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Midwest", "Progressive"],
  },
  {
    id: "carleton",
    name: "Carleton College",
    location: "Northfield, MN",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Midwest", "STEM"],
  },
  {
    id: "macalester",
    name: "Macalester College",
    location: "Saint Paul, MN",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "International", "Midwest"],
  },
  {
    id: "colorado-college",
    name: "Colorado College",
    location: "Colorado Springs, CO",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Block Plan", "Outdoor"],
  },
  {
    id: "reed",
    name: "Reed College",
    location: "Portland, OR",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Progressive", "Pacific Northwest"],
  },
  {
    id: "trinity",
    name: "Trinity College",
    location: "Hartford, CT",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Urban", "Small"],
  },
  {
    id: "holy-cross",
    name: "College of the Holy Cross",
    location: "Worcester, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-15", label: "Early Decision" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Jesuit", "Liberal Arts", "Small"],
  },
  {
    id: "santa-clara",
    name: "Santa Clara University",
    location: "Santa Clara, CA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-07", label: "Regular Decision" },
    ],
    tags: ["Jesuit", "Business", "Silicon Valley"],
  },
  {
    id: "loyola-chicago",
    name: "Loyola University Chicago",
    location: "Chicago, IL",
    deadlines: [
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Loyola Scholarship" },
    ],
    tags: ["Jesuit", "Urban", "Midwest"],
  },
  {
    id: "seton-hall",
    name: "Seton Hall University",
    location: "South Orange, NJ",
    deadlines: [
      { type: "EA", date: "2024-12-01", label: "Early Action" },
      { type: "RD", date: "2025-03-01", label: "Regular Decision" },
    ],
    tags: ["Catholic", "Business", "Urban"],
  },
  {
    id: "marquette",
    name: "Marquette University",
    location: "Milwaukee, WI",
    deadlines: [
      { type: "EA", date: "2024-12-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
    tags: ["Jesuit", "Business", "Midwest"],
  },
  {
    id: "connecticut-college",
    name: "Connecticut College",
    location: "New London, CT",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Small", "New England"],
  },
  {
    id: "furman",
    name: "Furman University",
    location: "Greenville, SC",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
    tags: ["Liberal Arts", "Southern", "Small"],
  },
  {
    id: "georgia",
    name: "University of Georgia",
    location: "Athens, GA",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "Foundation Fellowship" },
    ],
    tags: ["Public", "Southern", "Research"],
  },
  {
    id: "pitt",
    name: "University of Pittsburgh",
    location: "Pittsburgh, PA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Chancellor's Scholarship" },
    ],
    tags: ["Public", "Research", "Medicine"],
  },
  {
    id: "drexel",
    name: "Drexel University",
    location: "Philadelphia, PA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-03-01", label: "Regular Decision" },
    ],
    tags: ["Co-op", "Engineering", "Urban"],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
    tags: ["Co-op", "Urban", "Research"],
  },
];