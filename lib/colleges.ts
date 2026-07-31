export type DeadlineType = "EA" | "ED" | "ED2" | "RD" | "Scholarship";

export interface Deadline {
  type: DeadlineType;
  date: string; // YYYY-MM-DD
  label: string;
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
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "harvard",
    name: "Harvard University",
    location: "Cambridge, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "stanford",
    name: "Stanford University",
    location: "Stanford, CA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "yale",
    name: "Yale University",
    location: "New Haven, CT",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "princeton",
    name: "Princeton University",
    location: "Princeton, NJ",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Single Choice Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
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
  },
  {
    id: "dartmouth",
    name: "Dartmouth College",
    location: "Hanover, NH",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
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
  },
  {
    id: "duke",
    name: "Duke University",
    location: "Durham, NC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "Robertson Scholarship" },
    ],
  },
  {
    id: "vanderbilt",
    name: "Vanderbilt University",
    location: "Nashville, TN",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Cornelius Vanderbilt Scholarship" },
    ],
  },
  {
    id: "rice",
    name: "Rice University",
    location: "Houston, TX",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Rice Merit Scholarship" },
    ],
  },
  {
    id: "wustl",
    name: "Washington University in St. Louis",
    location: "St. Louis, MO",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Danforth Scholarship" },
    ],
  },
  {
    id: "notre-dame",
    name: "University of Notre Dame",
    location: "Notre Dame, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Restrictive Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "georgetown",
    name: "Georgetown University",
    location: "Washington, DC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "emory",
    name: "Emory University",
    location: "Atlanta, GA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-15", label: "Emory Scholars" },
    ],
  },
  {
    id: "georgetown-law",
    name: "Carnegie Mellon University",
    location: "Pittsburgh, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "tufts",
    name: "Tufts University",
    location: "Medford, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "boston-college",
    name: "Boston College",
    location: "Chestnut Hill, MA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bu",
    name: "Boston University",
    location: "Boston, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Trustee Scholarship" },
    ],
  },
  {
    id: "northeastern",
    name: "Northeastern University",
    location: "Boston, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "usc",
    name: "University of Southern California",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Trustee Scholarship" },
    ],
  },
  {
    id: "ucla",
    name: "UCLA",
    location: "Los Angeles, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application Deadline" },
    ],
  },
  {
    id: "ucberkeley",
    name: "UC Berkeley",
    location: "Berkeley, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application Deadline" },
    ],
  },
  {
    id: "ucsd",
    name: "UC San Diego",
    location: "La Jolla, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application Deadline" },
    ],
  },
  {
    id: "ucdavis",
    name: "UC Davis",
    location: "Davis, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application Deadline" },
    ],
  },
  {
    id: "ucsb",
    name: "UC Santa Barbara",
    location: "Santa Barbara, CA",
    deadlines: [
      { type: "RD", date: "2024-11-30", label: "UC Application Deadline" },
    ],
  },
  {
    id: "uchicago",
    name: "University of Chicago",
    location: "Chicago, IL",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "northwestern",
    name: "Northwestern University",
    location: "Evanston, IL",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "umich",
    name: "University of Michigan",
    location: "Ann Arbor, MI",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "unc",
    name: "UNC Chapel Hill",
    location: "Chapel Hill, NC",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "Morehead-Cain Scholarship" },
    ],
  },
  {
    id: "virginia",
    name: "University of Virginia",
    location: "Charlottesville, VA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "georgetown2",
    name: "Georgetown University",
    location: "Washington, DC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "wake-forest",
    name: "Wake Forest University",
    location: "Winston-Salem, NC",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-01-15", label: "Stamps Scholarship" },
    ],
  },
  {
    id: "tulane",
    name: "Tulane University",
    location: "New Orleans, LA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-15", label: "Dean's Honor Scholarship" },
    ],
  },
  {
    id: "lehigh",
    name: "Lehigh University",
    location: "Bethlehem, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "fordham",
    name: "Fordham University",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "villanova",
    name: "Villanova University",
    location: "Villanova, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Presidential Scholarship" },
    ],
  },
  {
    id: "ga-tech",
    name: "Georgia Tech",
    location: "Atlanta, GA",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-10-15", label: "Stamps President's Scholars" },
    ],
  },
  {
    id: "purdue",
    name: "Purdue University",
    location: "West Lafayette, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Purdue Scholarship" },
    ],
  },
  {
    id: "ohio-state",
    name: "Ohio State University",
    location: "Columbus, OH",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "National Merit Scholarship" },
    ],
  },
  {
    id: "penn-state",
    name: "Penn State University",
    location: "State College, PA",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "indiana",
    name: "Indiana University",
    location: "Bloomington, IN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Hutton Honors" },
    ],
  },
  {
    id: "uf",
    name: "University of Florida",
    location: "Gainesville, FL",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-03-01", label: "Regular Decision" },
    ],
  },
  {
    id: "fsu",
    name: "Florida State University",
    location: "Tallahassee, FL",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Early Action" },
      { type: "RD", date: "2025-03-01", label: "Regular Decision" },
    ],
  },
  {
    id: "umiami",
    name: "University of Miami",
    location: "Coral Gables, FL",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Stamps Scholarship" },
    ],
  },
  {
    id: "uw-madison",
    name: "University of Wisconsin-Madison",
    location: "Madison, WI",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "minnesota",
    name: "University of Minnesota",
    location: "Minneapolis, MN",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Priority Application" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "tamu",
    name: "Texas A&M University",
    location: "College Station, TX",
    deadlines: [
      { type: "EA", date: "2024-10-15", label: "Priority Deadline" },
      { type: "RD", date: "2025-12-01", label: "Regular Decision" },
    ],
  },
  {
    id: "ut-austin",
    name: "UT Austin",
    location: "Austin, TX",
    deadlines: [
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2024-12-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "University Scholarship" },
    ],
  },
  {
    id: "unc-charlotte",
    name: "Colgate University",
    location: "Hamilton, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "colby",
    name: "Colby College",
    location: "Waterville, ME",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "bowdoin",
    name: "Bowdoin College",
    location: "Brunswick, ME",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-05", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "middlebury",
    name: "Middlebury College",
    location: "Middlebury, VT",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "amherst",
    name: "Amherst College",
    location: "Amherst, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "RD", date: "2025-01-03", label: "Regular Decision" },
    ],
  },
  {
    id: "williams",
    name: "Williams College",
    location: "Williamstown, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "pomona",
    name: "Pomona College",
    location: "Claremont, CA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-08", label: "Early Decision II" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "harvey-mudd",
    name: "Harvey Mudd College",
    location: "Claremont, CA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-05", label: "Early Decision II" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "claremont-mckenna",
    name: "Claremont McKenna College",
    location: "Claremont, CA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-10", label: "Early Decision II" },
      { type: "RD", date: "2025-01-10", label: "Regular Decision" },
    ],
  },
  {
    id: "swarthmore",
    name: "Swarthmore College",
    location: "Swarthmore, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-02", label: "Early Decision II" },
      { type: "RD", date: "2025-01-02", label: "Regular Decision" },
    ],
  },
  {
    id: "haverford",
    name: "Haverford College",
    location: "Haverford, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "wellesley",
    name: "Wellesley College",
    location: "Wellesley, MA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "EA", date: "2024-11-01", label: "Early Evaluation" },
      { type: "RD", date: "2025-01-08", label: "Regular Decision" },
    ],
  },
  {
    id: "smith",
    name: "Smith College",
    location: "Northampton, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "mount-holyoke",
    name: "Mount Holyoke College",
    location: "South Hadley, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "barnard",
    name: "Barnard College",
    location: "New York, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "vassar",
    name: "Vassar College",
    location: "Poughkeepsie, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-01", label: "Regular Decision" },
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton College",
    location: "Clinton, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-04", label: "Early Decision II" },
      { type: "RD", date: "2025-01-04", label: "Regular Decision" },
    ],
  },
  {
    id: "bates",
    name: "Bates College",
    location: "Lewiston, ME",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "kenyon",
    name: "Kenyon College",
    location: "Gambier, OH",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "grinnell",
    name: "Grinnell College",
    location: "Grinnell, IA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-01-15", label: "Grinnell Scholarship" },
    ],
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
  },
  {
    id: "macalester",
    name: "Macalester College",
    location: "St. Paul, MN",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2025-01-15", label: "Macalester Scholarship" },
    ],
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
  },
  {
    id: "davidson",
    name: "Davidson College",
    location: "Davidson, NC",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-06", label: "Early Decision II" },
      { type: "RD", date: "2025-01-06", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-15", label: "John M. Belk Scholarship" },
    ],
  },
  {
    id: "richmond",
    name: "University of Richmond",
    location: "Richmond, VA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-15", label: "Richmond Scholarship" },
    ],
  },
  {
    id: "trinity",
    name: "Trinity College",
    location: "Hartford, CT",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "holy-cross",
    name: "College of the Holy Cross",
    location: "Worcester, MA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "bucknell",
    name: "Bucknell University",
    location: "Lewisburg, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "lafayette",
    name: "Lafayette College",
    location: "Easton, PA",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "dickinson",
    name: "Dickinson College",
    location: "Carlisle, PA",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-02-01", label: "Early Decision II" },
      { type: "EA", date: "2024-12-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
    ],
  },
  {
    id: "connecticut",
    name: "Connecticut College",
    location: "New London, CT",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
    ],
  },
  {
    id: "wofford",
    name: "Wofford College",
    location: "Spartanburg, SC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-15", label: "Wofford Scholarship" },
    ],
  },
  {
    id: "rpi",
    name: "Rensselaer Polytechnic Institute",
    location: "Troy, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-11-01", label: "Rensselaer Medal" },
    ],
  },
  {
    id: "case-western",
    name: "Case Western Reserve University",
    location: "Cleveland, OH",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-15", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Civic Scholarship" },
    ],
  },
  {
    id: "rochester",
    name: "University of Rochester",
    location: "Rochester, NY",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "american",
    name: "American University",
    location: "Washington, DC",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-02-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-02-01", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Merit Scholarship" },
    ],
  },
  {
    id: "gw",
    name: "George Washington University",
    location: "Washington, DC",
    deadlines: [
      { type: "ED", date: "2024-11-01", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-05", label: "Early Decision II" },
      { type: "EA", date: "2024-11-01", label: "Early Action" },
      { type: "RD", date: "2025-01-05", label: "Regular Decision" },
    ],
  },
  {
    id: "american-u",
    name: "Syracuse University",
    location: "Syracuse, NY",
    deadlines: [
      { type: "ED", date: "2024-11-15", label: "Early Decision I" },
      { type: "ED2", date: "2025-01-01", label: "Early Decision II" },
      { type: "EA", date: "2024-11-15", label: "Early Action" },
      { type: "RD", date: "2025-01-15", label: "Regular Decision" },
      { type: "Scholarship", date: "2024-12-01", label: "Dean's Scholarship" },
    ],
  },
];