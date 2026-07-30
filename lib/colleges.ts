export interface College {
  id: string;
  name: string;
  location: string;
  type: string;
  ea?: string;
  ed?: string;
  ed2?: string;
  rd: string;
  scholarship?: string;
  acceptanceRate: string;
}

export const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", type: "Ivy League", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "3%" },
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", type: "Research University", ea: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "yale", name: "Yale University", location: "New Haven, CT", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-03-01", acceptanceRate: "5%" },
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "4%" },
  { id: "columbia", name: "Columbia University", location: "New York, NY", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "4%" },
  { id: "upenn", name: "University of Pennsylvania", location: "Philadelphia, PA", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "brown", name: "Brown University", location: "Providence, RI", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-03-01", acceptanceRate: "6%" },
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-01", acceptanceRate: "8%" },
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", type: "Ivy League", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "duke", name: "Duke University", location: "Durham, NC", type: "Research University", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-31", scholarship: "2024-12-01", acceptanceRate: "9%" },
  { id: "rice", name: "Rice University", location: "Houston, TX", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "notre-dame", name: "University of Notre Dame", location: "Notre Dame, IN", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "13%" },
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", type: "Research University", ea: "2024-11-01", rd: "2025-01-10", scholarship: "2025-02-01", acceptanceRate: "12%" },
  { id: "emory", name: "Emory University", location: "Atlanta, GA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-15", scholarship: "2024-11-15", acceptanceRate: "19%" },
  { id: "carnegie-mellon", name: "Carnegie Mellon University", location: "Pittsburgh, PA", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "15%" },
  { id: "uchicago", name: "University of Chicago", location: "Chicago, IL", type: "Research University", ea: "2024-11-01", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "6%" },
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", type: "Research University", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "7%" },
  { id: "jhu", name: "Johns Hopkins University", location: "Baltimore, MD", type: "Research University", ed: "2024-11-01", rd: "2025-01-02", scholarship: "2025-03-01", acceptanceRate: "8%" },
  { id: "tufts", name: "Tufts University", location: "Medford, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "washu", name: "Washington University in St. Louis", location: "St. Louis, MO", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-02", scholarship: "2024-12-01", acceptanceRate: "14%" },
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", type: "Research University", ea: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01", acceptanceRate: "16%" },
  { id: "nyu", name: "New York University", location: "New York, NY", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-12-01", acceptanceRate: "21%" },
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", type: "Research University", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-01", acceptanceRate: "19%" },
  { id: "bu", name: "Boston University", location: "Boston, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-02", rd: "2025-01-02", scholarship: "2024-12-01", acceptanceRate: "19%" },
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-15", rd: "2025-01-15", scholarship: "2024-11-15", acceptanceRate: "13%" },
  { id: "wake-forest", name: "Wake Forest University", location: "Winston-Salem, NC", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-01-15", acceptanceRate: "28%" },
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-11-15", acceptanceRate: "44%" },
  { id: "rpi", name: "Rensselaer Polytechnic Institute", location: "Troy, NY", type: "Tech University", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-01", acceptanceRate: "67%" },
  { id: "case-western", name: "Case Western Reserve University", location: "Cleveland, OH", type: "Research University", ed: "2024-11-01", rd: "2025-01-15", scholarship: "2024-12-01", acceptanceRate: "42%" },
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", type: "Research University", ed: "2024-11-01", ed2: "2025-01-01", rd: "2025-01-01", scholarship: "2024-12-01", acceptanceRate: "18%" },
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", type: "Tech University", ea: "2024-10-15", rd: "2025-01-05", scholarship: "2024-10-15", acceptanceRate: "17%" },
  { id: "ucb", name: "UC Berkeley", location: "Berkeley, CA", type: "Public Research", rd: "2024-11-30", scholarship: "2025-03-01", acceptanceRate: "14%" },
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", type: "Public Research", rd: "2024-11-30", scholarship: "2025-03-01", acceptanceRate: "11%" },
  { id: "umich", name: "University of Michigan", location: "Ann Arbor, MI", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2025-02-15", acceptanceRate: "20%" },
  { id: "virginia", name: "University of Virginia", location: "Charlottesville, VA", type: "Public Research", ea: "2024-11-01", rd: "2025-01-01", scholarship: "2024-11-01", acceptanceRate: "23%" },
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", type: "Public Research", ea: "2024-10-15", rd: "2025-01-15", scholarship: "2024-10-15", acceptanceRate: "19%" },
  { id: "uw", name: "University of Washington", location: "Seattle, WA", type: "Public Research", ea: "2024-11-01", rd: "2025-01-15", scholarship: "2024-11-30", acceptanceRate: "48%" },
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "62%" },
  { id: "penn-state", name: "Penn State University", location: "University Park, PA", type: "Public Research", rd: "2024-11-30", scholarship: "2024-11-30", acceptanceRate: "56%" },
  { id: "ohio-state", name: "Ohio State University", location: "Columbus, OH", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "68%" },
  { id: "uw-madison", name: "University of Wisconsin-Madison", location: "Madison, WI", type: "Public Research", ea: "2024-11-01", rd: "2025-02-01", scholarship: "2024-11-01", acceptanceRate: "51%" },
  { id: "uiuc", name: "U Illinois Urbana-Champaign", location: "Champaign, IL", type: "Public Research", ea: "2024-11-01", rd: "2025-01-05", scholarship: "2024-11-01", acceptanceRate: "45%" },
  { id: "indiana", name: "Indiana University Bloomington", location: "Bloomington, IN", type: "Public Research", rd: "2025-02-01", scholarship: "2024-12-01", acceptanceRate: "80%" },
  { id: "williams", name: "Williams College", location: "Williamstown, MA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-08", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-01", scholarship: "2025-02-15", acceptanceRate: "11%" },
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-02", scholarship: "2025-02-15", acceptanceRate: "9%" },
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", type: "Liberal Arts", ed: "2024-11-15", rd: "2025-01-08", scholarship: "2025-02-15", acceptanceRate: "8%" },
  { id: "wellesley", name: "Wellesley College", location: "Wellesley, MA", type: "Liberal Arts", ed: "2024-11-01", rd: "2025-01-10", scholarship: "2025-02-01", acceptanceRate: "16%" },
];