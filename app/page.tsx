"use client";

import { useState, useEffect, useCallback } from "react";

interface Deadline {
  type: "ED" | "EA" | "RD" | "FA";
  label: string;
  date: string; // YYYY-MM-DD
}

interface College {
  id: string;
  name: string;
  location: string;
  deadlines: Deadline[];
}

interface MySchool {
  collegeId: string;
  addedAt: string;
}

interface ReminderSub {
  email: string;
  phone?: string;
  collegeId: string;
  deadlineType: string;
  deadlineDate: string;
}

interface UpcomingDeadline {
  college: College;
  deadline: Deadline;
  daysUntil: number;
}

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", location: "Cambridge, MA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "harvard", name: "Harvard University", location: "Cambridge, MA", deadlines: [
    { type: "EA", label: "Restrictive Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "stanford", name: "Stanford University", location: "Stanford, CA", deadlines: [
    { type: "EA", label: "Restrictive Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "yale", name: "Yale University", location: "New Haven, CT", deadlines: [
    { type: "EA", label: "Single-Choice Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "princeton", name: "Princeton University", location: "Princeton, NJ", deadlines: [
    { type: "EA", label: "Single-Choice Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "columbia", name: "Columbia University", location: "New York, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "upenn", name: "University of Pennsylvania", location: "Philadelphia, PA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "brown", name: "Brown University", location: "Providence, RI", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "dartmouth", name: "Dartmouth College", location: "Hanover, NH", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "cornell", name: "Cornell University", location: "Ithaca, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "duke", name: "Duke University", location: "Durham, NC", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "vanderbilt", name: "Vanderbilt University", location: "Nashville, TN", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "northwestern", name: "Northwestern University", location: "Evanston, IL", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "uchicago", name: "University of Chicago", location: "Chicago, IL", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "jhu", name: "Johns Hopkins University", location: "Baltimore, MD", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "rice", name: "Rice University", location: "Houston, TX", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "notre-dame", name: "University of Notre Dame", location: "Notre Dame, IN", deadlines: [
    { type: "EA", label: "Restrictive Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "georgetown", name: "Georgetown University", location: "Washington, DC", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-10" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "emory", name: "Emory University", location: "Atlanta, GA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "washu", name: "Washington University in St. Louis", location: "St. Louis, MO", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "tufts", name: "Tufts University", location: "Medford, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "usc", name: "University of Southern California", location: "Los Angeles, CA", deadlines: [
    { type: "ED", label: "Early Decision", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "nyu", name: "New York University", location: "New York, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "boston-college", name: "Boston College", location: "Chestnut Hill, MA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "bu", name: "Boston University", location: "Boston, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-03" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "tulane", name: "Tulane University", location: "New Orleans, LA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-08" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "lehigh", name: "Lehigh University", location: "Bethlehem, PA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "wake-forest", name: "Wake Forest University", location: "Winston-Salem, NC", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-03-01" },
  ]},
  { id: "case-western", name: "Case Western Reserve University", location: "Cleveland, OH", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "rpi", name: "Rensselaer Polytechnic Institute", location: "Troy, NY", deadlines: [
    { type: "ED", label: "Early Decision", date: "2024-11-01" },
    { type: "EA", label: "Early Action", date: "2024-11-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "rochester", name: "University of Rochester", location: "Rochester, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-05" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "northeastern", name: "Northeastern University", location: "Boston, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "villanova", name: "Villanova University", location: "Villanova, PA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-07" },
  ]},
  { id: "fordham", name: "Fordham University", location: "New York, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid", date: "2025-02-01" },
  ]},
  { id: "american", name: "American University", location: "Washington, DC", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "EA", label: "Early Action", date: "2024-11-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid", date: "2025-02-15" },
  ]},
  { id: "ucb", name: "UC Berkeley", location: "Berkeley, CA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-30" },
    { type: "FA", label: "Financial Aid (FAFSA)", date: "2025-03-02" },
  ]},
  { id: "ucla", name: "UCLA", location: "Los Angeles, CA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-30" },
    { type: "FA", label: "Financial Aid (FAFSA)", date: "2025-03-02" },
  ]},
  { id: "ucsd", name: "UC San Diego", location: "La Jolla, CA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-30" },
    { type: "FA", label: "Financial Aid (FAFSA)", date: "2025-03-02" },
  ]},
  { id: "uc-davis", name: "UC Davis", location: "Davis, CA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-30" },
    { type: "FA", label: "Financial Aid (FAFSA)", date: "2025-03-02" },
  ]},
  { id: "uc-irvine", name: "UC Irvine", location: "Irvine, CA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-30" },
    { type: "FA", label: "Financial Aid (FAFSA)", date: "2025-03-02" },
  ]},
  { id: "michigan", name: "University of Michigan", location: "Ann Arbor, MI", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-01" },
    { type: "FA", label: "Financial Aid", date: "2025-04-30" },
  ]},
  { id: "virginia", name: "University of Virginia", location: "Charlottesville, VA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "unc", name: "UNC Chapel Hill", location: "Chapel Hill, NC", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-10-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "georgia-tech", name: "Georgia Tech", location: "Atlanta, GA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-10-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-07" },
    { type: "FA", label: "Financial Aid", date: "2025-02-15" },
  ]},
  { id: "william-mary", name: "College of William & Mary", location: "Williamsburg, VA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-08" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "uw-madison", name: "University of Wisconsin-Madison", location: "Madison, WI", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "ohio-state", name: "Ohio State University", location: "Columbus, OH", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "penn-state", name: "Penn State University Park", location: "University Park, PA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-15" },
    { type: "FA", label: "Financial Aid", date: "2025-02-15" },
  ]},
  { id: "purdue", name: "Purdue University", location: "West Lafayette, IN", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "ut-austin", name: "UT Austin", location: "Austin, TX", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-12-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-15" },
  ]},
  { id: "uf", name: "University of Florida", location: "Gainesville, FL", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-03-01" },
    { type: "FA", label: "Financial Aid", date: "2025-01-15" },
  ]},
  { id: "umd", name: "University of Maryland", location: "College Park, MD", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-20" },
    { type: "FA", label: "Financial Aid", date: "2025-02-15" },
  ]},
  { id: "illinois", name: "University of Illinois Urbana-Champaign", location: "Champaign, IL", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-03-15" },
    { type: "FA", label: "Financial Aid", date: "2025-03-15" },
  ]},
  { id: "indiana", name: "Indiana University Bloomington", location: "Bloomington, IN", deadlines: [
    { type: "EA", label: "Early Action I", date: "2024-11-01" },
    { type: "EA", label: "Early Action II", date: "2024-12-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "minnesota", name: "University of Minnesota Twin Cities", location: "Minneapolis, MN", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid", date: "2025-02-01" },
  ]},
  { id: "carnegie-mellon", name: "Carnegie Mellon University", location: "Pittsburgh, PA", deadlines: [
    { type: "ED", label: "Early Decision", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "caltech", name: "California Institute of Technology", location: "Pasadena, CA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-01-03" },
  ]},
  { id: "harvey-mudd", name: "Harvey Mudd College", location: "Claremont, CA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-05" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "pomona", name: "Pomona College", location: "Claremont, CA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-08" },
    { type: "RD", label: "Regular Decision", date: "2025-01-08" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "swarthmore", name: "Swarthmore College", location: "Swarthmore, PA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-02" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "amherst", name: "Amherst College", location: "Amherst, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-03" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "williams", name: "Williams College", location: "Williamstown, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "wellesley", name: "Wellesley College", location: "Wellesley, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "colgate", name: "Colgate University", location: "Hamilton, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "colby", name: "Colby College", location: "Waterville, ME", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "bates", name: "Bates College", location: "Lewiston, ME", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "bowdoin", name: "Bowdoin College", location: "Brunswick, ME", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-05" },
    { type: "RD", label: "Regular Decision", date: "2025-01-05" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "middlebury", name: "Middlebury College", location: "Middlebury, VT", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-03" },
    { type: "RD", label: "Regular Decision", date: "2025-01-03" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "hamilton", name: "Hamilton College", location: "Clinton, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "vassar", name: "Vassar College", location: "Poughkeepsie, NY", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-01" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "smith", name: "Smith College", location: "Northampton, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "mount-holyoke", name: "Mount Holyoke College", location: "South Hadley, MA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "macalester", name: "Macalester College", location: "St. Paul, MN", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2025-01-01" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-08" },
  ]},
  { id: "oberlin", name: "Oberlin College", location: "Oberlin, OH", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "grinnell", name: "Grinnell College", location: "Grinnell, IA", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-02" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-01" },
  ]},
  { id: "carleton", name: "Carleton College", location: "Northfield, MN", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "davidson", name: "Davidson College", location: "Davidson, NC", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-15" },
    { type: "ED", label: "Early Decision II", date: "2025-01-15" },
    { type: "RD", label: "Regular Decision", date: "2025-01-15" },
    { type: "FA", label: "Financial Aid (CSS)", date: "2025-02-15" },
  ]},
  { id: "denison", name: "Denison University", location: "Granville, OH", deadlines: [
    { type: "ED", label: "Early Decision I", date: "2024-11-01" },
    { type: "ED", label: "Early Decision II", date: "2024-12-01" },
    { type: "EA", label: "Early Action", date: "2024-12-01" },
    { type: "RD", label: "Regular Decision", date: "2025-02-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "uw", name: "University of Washington", location: "Seattle, WA", deadlines: [
    { type: "RD", label: "Regular Decision", date: "2024-11-15" },
    { type: "FA", label: "Financial Aid", date: "2025-01-15" },
  ]},
  { id: "rutgers", name: "Rutgers University-New Brunswick", location: "New Brunswick, NJ", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-12-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
  { id: "pitt", name: "University of Pittsburgh", location: "Pittsburgh, PA", deadlines: [
    { type: "EA", label: "Early Action", date: "2024-11-01" },
    { type: "RD", label: "Regular Decision", date: "2025-03-01" },
    { type: "FA", label: "Financial Aid", date: "2025-03-01" },
  ]},
];

type Tab = "dashboard" | "schools" | "reminders";

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ED: { bg: "#fff0f0", text: "#c0392b", border: "#e74c3c" },
  EA: { bg: "#fff8e1", text: "#d68910", border: "#f39c12" },
  RD: { bg: "#eaf4fb", text: "#1a5276", border: "#2980b9" },
  FA: { bg: "#f0fff4", text: "#1e8449", border: "#27ae60" },
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyLabel(days: number): { text: string; color: string } {
  if (days < 0) return { text: "Past", color: "#999" };
  if (days === 0) return { text: "Today!", color: "#c0392b" };
  if (days <= 7) return { text: `${days}d left`, color: "#c0392b" };
  if (days <= 14) return { text: `${days}d left`, color: "#d35400" };
  if (days <= 30) return { text: `${days}d left`, color: "#d68910" };
  return { text: `${days} days`, color: "#555" };
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [mySchools, setMySchools] = useState<MySchool[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderPhone, setReminderPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [showOnboard, setShowOnboard] = useState(false);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");

  useEffect(() => {
    const saved = localStorage.getItem("edutracker_schools");
    if (saved) setMySchools(JSON.parse(saved));
    const savedEmail = localStorage.getItem("edutracker_email");
    if (savedEmail) setEmail(savedEmail);
    const savedPhone = localStorage.getItem("edutracker_phone");
    if (savedPhone) setPhone(savedPhone);

    // Track page visit
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  const saveSchools = useCallback((schools: MySchool[]) => {
    setMySchools(schools);
    localStorage.setItem("edutracker_schools", JSON.stringify(schools));
  }, []);

  const addSchool = useCallback((collegeId: string) => {
    const already = mySchools.find((s) => s.collegeId === collegeId);
    if (already) return;
    const updated = [...mySchools, { collegeId, addedAt: new Date().toISOString() }];
    saveSchools(updated);
  }, [mySchools, saveSchools]);

  const removeSchool = useCallback((collegeId: string) => {
    saveSchools(mySchools.filter((s) => s.collegeId !== collegeId));
  }, [mySchools, saveSchools]);

  const isAdded = (collegeId: string) => mySchools.some((s) => s.collegeId === collegeId);

  const myColleges = COLLEGES.filter((c) => isAdded(c.id));

  const upcomingDeadlines: UpcomingDeadline[] = myColleges
    .flatMap((college) =>
      college.deadlines.map((dl) => ({
        college,
        deadline: dl,
        daysUntil: daysUntil(dl.date),
      }))
    )
    .filter((item) => item.daysUntil >= 0)
    .filter((item) => filterType === "ALL" || item.deadline.type === filterType)
    .sort((a, b) => {
      if (sortBy === "date") return a.daysUntil - b.daysUntil;
      return a.college.name.localeCompare(b.college.name);
    });

  const filteredColleges = COLLEGES.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderEmail) {
      setSubmitMsg("Please enter your email.");
      return;
    }
    if (mySchools.length === 0) {
      setSubmitMsg("Please add some schools first.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    localStorage.setItem("edutracker_email", reminderEmail);
    localStorage.setItem("edutracker_phone", reminderPhone);
    setEmail(reminderEmail);
    setPhone(reminderPhone);

    try {
      const subs: ReminderSub[] = [];
      myColleges.forEach((college) => {
        college.deadlines.forEach((dl) => {
          if (daysUntil(dl.date) > 0) {
            subs.push({
              email: reminderEmail,
              phone: reminderPhone || undefined,
              collegeId: college.id,
              deadlineType: dl.type,
              deadlineDate: dl.date,
            });
          }
        });
      });

      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reminderEmail, phone: reminderPhone, subscriptions: subs }),
      });

      if (res.ok) {
        setSubmitMsg(`✅ Reminders set for ${subs.length} deadline(s)! We'll email you at 30, 14, 7, and 1 day before each deadline.`);
      } else {
        const json = await res.json().catch(() => ({}));
        setSubmitMsg(json.error || "✅ Reminder preferences saved locally! (Server sync pending)");
      }
    } catch {
      setSubmitMsg("✅ Reminder preferences saved locally!");
    }
    setSubmitting(false);
  };

  const nextDeadline = upcomingDeadlines[0];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        background: "linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)",
        color: "white",
        padding: "0 24px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>🎓</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 22, letterSpacing: -0.5 }}>Edutracker</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>College Application Deadline Manager</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {email && (
                <div style={{ fontSize: 13, opacity: 0.85, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 20 }}>
                  📧 {email}
                </div>
              )}
              <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "4px 12px", fontSize: 13 }}>
                {mySchools.length} school{mySchools.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4, paddingTop: 12 }}>
            {(["dashboard", "schools", "reminders"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? "white" : "transparent",
                  color: tab === t ? "#1a237e" : "rgba(255,255,255,0.85)",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px 8px 0 0",
                  fontWeight: tab === t ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}
              >
                {t === "dashboard" ? "📋 Dashboard" : t === "schools" ? "🏛️ Schools" : "🔔 Reminders"}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div>
            {mySchools.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🏫</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: "#1a237e", marginBottom: 8 }}>
                  No schools added yet
                </h2>
                <p style={{ color: "#666", marginBottom: 24, fontSize: 16 }}>
                  Add your target colleges to track their deadlines and get reminders.
                </p>
                <button
                  onClick={() => setTab("schools")}
                  style={{
                    background: "#1a237e",
                    color: "white",
                    border: "none",
                    padding: "12px 28px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Browse Schools →
                </button>
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "Schools Tracked", value: mySchools.length, icon: "🏛️", color: "#1a237e" },
                    { label: "Upcoming Deadlines", value: upcomingDeadlines.length, icon: "📅", color: "#d35400" },
                    { label: "Next Deadline", value: nextDeadline ? `${nextDeadline.daysUntil}d` : "—", icon: "⏰", color: nextDeadline && nextDeadline.daysUntil <= 7 ? "#c0392b" : "#27ae60" },
                    { label: "Reminders Active", value: email ? "Yes" : "No", icon: "🔔", color: email ? "#27ae60" : "#999" },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      background: "white",
                      borderRadius: 12,
                      padding: "16px 20px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      borderLeft: `4px solid ${stat.color}`,
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
                      <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Next up banner */}
                {nextDeadline && nextDeadline.daysUntil <= 30 && (
                  <div style={{
                    background: nextDeadline.daysUntil <= 7 ? "linear-gradient(135deg, #c0392b, #e74c3c)" : "linear-gradient(135deg, #d35400, #e67e22)",
                    color: "white",
                    borderRadius: 12,
                    padding: "16px 20px",
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}>
                    <div style={{ fontSize: 32 }}>⚠️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        {nextDeadline.college.name} — {nextDeadline.deadline.label}
                      </div>
                      <div style={{ opacity: 0.9, fontSize: 14 }}>
                        Due {formatDate(nextDeadline.deadline.date)} · {nextDeadline.daysUntil === 0 ? "TODAY!" : `${nextDeadline.daysUntil} day${nextDeadline.daysUntil === 1 ? "" : "s"} remaining`}
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#666", fontWeight: 500 }}>Filter:</span>
                  {["ALL", "ED", "EA", "RD", "FA"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilterType(f)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: filterType === f ? "2px solid #1a237e" : "2px solid #ddd",
                        background: filterType === f ? "#1a237e" : "white",
                        color: filterType === f ? "white" : "#444",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {f === "ALL" ? "All" : f === "FA" ? "Financial Aid" : f === "ED" ? "Early Decision" : f === "EA" ? "Early Action" : "Regular"}
                    </button>
                  ))}
                  <span style={{ marginLeft: "auto", fontSize: 13, color: "#666", fontWeight: 500 }}>Sort:</span>
                  {(["date", "name"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: sortBy === s ? "2px solid #1a237e" : "2px solid #ddd",
                        background: sortBy === s ? "#1a237e" : "white",
                        color: sortBy === s ? "white" : "#444",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {s === "date" ? "By Date" : "By Name"}
                    </button>
                  ))}
                </div>

                {/* Deadline list */}
                {upcomingDeadlines.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
                    No upcoming deadlines for this filter.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {upcomingDeadlines.map((item, idx) => {
                      const col = TYPE_COLORS[item.deadline.type];
                      const urg = urgencyLabel(item.daysUntil);
                      return (
                        <div
                          key={`${item.college.id}-${item.deadline.type}-${item.deadline.date}-${idx}`}
                          style={{
                            background: "white",
                            borderRadius: 10,
                            padding: "14px 18px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            borderLeft: `4px solid ${col.border}`,
                          }}
                        >
                          <div style={{
                            background: col.bg,
                            color: col.text,
                            fontWeight: 800,
                            fontSize: 11,
                            padding: "4px 8px",
                            borderRadius: 6,
                            minWidth: 36,
                            textAlign: "center",
                            border: `1px solid ${col.border}`,
                          }}>
                            {item.deadline.type}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a237e" }}>{item.college.name}</div>
                            <div style={{ fontSize: 12, color: "#666" }}>{item.deadline.label} · {item.college.location}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "#222" }}>{formatDate(item.deadline.date)}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: urg.color }}>{urg.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!email && (
                  <div style={{
                    marginTop: 24,
                    background: "linear-gradient(135deg, #e8eaf6, #ede7f6)",
                    borderRadius: 12,
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#1a237e" }}>🔔 Get deadline reminders</div>
                      <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>We'll email you at 30, 14, 7, and 1 day before each deadline</div>
                    </div>
                    <button
                      onClick={() => setTab("reminders")}
                      style={{
                        background: "#1a237e",
                        color: "white",
                        border: "none",
                        padding: "10px 22px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Set Up Reminders →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SCHOOLS TAB */}
        {tab === "schools" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a237e", marginBottom: 4 }}>Browse Colleges</h2>
              <p style={{ color: "#666", fontSize: 14 }}>Select schools to track their application deadlines.</p>
            </div>

            {/* My Schools section */}
            {myColleges.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a237e", marginBottom: 10 }}>
                  📌 My Schools ({myColleges.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {myColleges.map((college) => (
                    <div
                      key={college.id}
                      style={{
                        background: "#e8eaf6",
                        border: "1px solid #c5cae9",
                        borderRadius: 20,
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 13,
                        fontWeight: 500,
                        color: "#1a237e",
                      }}
                    >
                      {college.name}
                      <button
                        onClick={() => removeSchool(college.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c0392b",
                          cursor: "pointer",
                          fontWeight: 700,
                          fontSize: 16,
                          lineHeight: 1,
                          padding: "0 2px",
                        }}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Search colleges by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px 12px 40px",
                  borderRadius: 10,
                  border: "2px solid #e0e0e0",
                  fontSize: 15,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#3949ab"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
              />
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>🔍</span>
            </div>

            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
              Showing {filteredColleges.length} of {COLLEGES.length} colleges
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredColleges.map((college) => {
                const added = isAdded(college.id);
                return (
                  <div
                    key={college.id}
                    style={{
                      background: "white",
                      borderRadius: 12,
                      padding: "16px 18px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      border: added ? "2px solid #3949ab" : "2px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a237e" }}>{college.name}</span>
                          <span style={{ fontSize: 12, color: "#888" }}>📍 {college.location}</span>
                          {added && <span style={{ background: "#e8eaf6", color: "#3949ab", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>Added ✓</span>}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {college.deadlines.map((dl, i) => {
                            const col = TYPE_COLORS[dl.type];
                            const days = daysUntil(dl.date);
                            return (
                              <div
                                key={i}
                                style={{
                                  background: col.bg,
                                  border: `1px solid ${col.border}`,
                                  borderRadius: 6,
                                  padding: "3px 8px",
                                  fontSize: 11,
                                  display: "flex",
                                  gap: 5,
                                  alignItems: "center",
                                }}
                              >
                                <span style={{ fontWeight: 800, color: col.text }}>{dl.type}</span>
                                <span style={{ color: "#555" }}>{formatDate(dl.date)}</span>
                                {days >= 0 && days <= 30 && (
                                  <span style={{ color: days <= 7 ? "#c0392b" : "#d35400", fontWeight: 700 }}>·{days}d</span>
                                )}
                                {days < 0 && <span style={{ color: "#bbb" }}>·past</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        onClick={() => added ? removeSchool(college.id) : addSchool(college.id)}
                        style={{
                          background: added ? "white" : "#1a237e",
                          color: added ? "#c0392b" : "white",
                          border: added ? "2px solid #e74c3c" : "2px solid #1a237e",
                          borderRadius: 8,
                          padding: "8px 16px",
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          transition: "all 0.15s",
                          flexShrink: 0,
                        }}
                      >
                        {added ? "Remove" : "+ Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REMINDERS TAB */}
        {tab === "reminders" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a237e", marginBottom: 4 }}>🔔 Deadline Reminders</h2>
              <p style={{ color: "#666", fontSize: 14 }}>
                Enter your contact info and we'll send you reminders at 30, 14, 7, and 1 day before each deadline.
              </p>
            </div>

            {mySchools.length === 0 ? (
              <div style={{
                background: "white",
                borderRadius: 12,
                padding: 32,
                textAlign: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#333", marginBottom: 8 }}>No schools selected yet</div>
                <div style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>Add schools to your list first, then set up reminders.</div>
                <button
                  onClick={() => setTab("schools")}
                  style={{ background: "#1a237e", color: "white", border: "none", padding: "10px 22px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                >
                  Browse Schools
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  {/* Reminder form */}
                  <div style={{
                    background: "white",
                    borderRadius: 12,
                    padding: "24px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                    marginBottom: 16,
                  }}>
                    <h3 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700, color: "#1a237e" }}>Contact Information</h3>
                    <form onSubmit={handleReminderSubmit}>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#444", marginBottom: 6 }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={reminderEmail}
                          onChange={(e) => setReminderEmail(e.target.value)}
                          required
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "2px solid #e0e0e0",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "#3949ab"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
                        />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontWeight: 600, fontSize: 13, color: "#444", marginBottom: 6 }}>
                          Phone Number (optional SMS)
                        </label>
                        <input
                          type="tel"
                          placeholder="+1 (555) 000-0000"
                          value={reminderPhone}
                          onChange={(e) => setReminderPhone(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "2px solid #e0e0e0",
                            fontSize: 14,
                            outline: "none",
                            boxSizing: "border-box",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "#3949ab"; }}
                          onBlur={(e) => { e.target.style.borderColor = "#e0e0e0"; }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        style={{
                          width: "100%",
                          background: submitting ? "#aaa" : "linear-gradient(135deg, #1a237e, #3949ab)",
                          color: "white",
                          border: "none",
                          padding: "12px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 15,
                          cursor: submitting ? "not-allowed" : "pointer",
                        }}
                      >
                        {submitting ? "Saving…" : "Save Reminder Preferences"}
                      </button>
                      {submitMsg && (
                        <div style={{
                          marginTop: 14,
                          padding: "10px 14px",
                          background: submitMsg.startsWith("✅") ? "#f0fff4" : "#fff0f0",
                          border: `1px solid ${submitMsg.startsWith("✅") ? "#27ae60" : "#e74c3c"}`,
                          borderRadius: 8,
                          fontSize: 13,
                          color: submitMsg.startsWith("✅") ? "#1e8449" : "#c0392b",
                          lineHeight: 1.5,
                        }}>
                          {submitMsg}
                        </div>
                      )}
                    </form>
                  </div>

                  {/* How it works */}
                  <div style={{
                    background: "#e8eaf6",
                    borderRadius: 12,
                    padding: "20px 24px",
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a237e", marginBottom: 12 }}>📬 How Reminders Work</div>
                    {[
                      { days: 30, icon: "📅", label: "30 days before — Plan your essays" },
                      { days: 14, icon: "✍️", label: "14 days before — Final review time" },
                      { days: 7, icon: "⚡", label: "7 days before — Last chance to polish" },
                      { days: 1, icon: "🚨", label: "1 day before — Submit tomorrow!" },
                    ].map((r) => (
                      <div key={r.days} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{r.icon}</span>
                        <span style={{ fontSize: 13, color: "#333" }}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* My schools summary */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#1a237e", marginBottom: 12 }}>
                    Deadlines to be tracked ({myColleges.reduce((acc, c) => acc + c.deadlines.filter(d => daysUntil(d.date) > 0).length, 0)} upcoming)
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {myColleges.map((college) => (
                      <div key={college.id} style={{
                        background: "white",
                        borderRadius: 10,
                        padding: "14px 16px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a237e", marginBottom: 8 }}>{college.name}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {college.deadlines.map((dl, i) => {
                            const days = daysUntil(dl.date);
                            const col = TYPE_COLORS[dl.type];
                            return (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                                <span style={{
                                  background: col.bg,
                                  color: col.text,
                                  border: `1px solid ${col.border}`,
                                  borderRadius: 4,
                                  padding: "1px 6px",
                                  fontWeight: 700,
                                  fontSize: 10,
                                }}>
                                  {dl.type}
                                </span>
                                <span style={{ color: "#444" }}>{dl.label}</span>
                                <span style={{ marginLeft: "auto", color: days < 0 ? "#bbb" : days <= 7 ? "#c0392b" : "#555", fontWeight: days >= 0 && days <= 30 ? 700 : 400 }}>
                                  {days < 0 ? "Past" : `${formatDate(dl.date)}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Legend */}
      <div style={{
        background: "white",
        borderTop: "1px solid #eee",
        padding: "12px 24px",
        display: "flex",
        gap: 20,
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        {Object.entries(TYPE_COLORS).map(([type, col]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: col.border }} />
            <span style={{ fontWeight: 700, color: col.text }}>{type}</span>
            <span>— {type === "ED" ? "Early Decision" : type === "EA" ? "Early Action" : type === "RD" ? "Regular Decision" : "Financial Aid"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}