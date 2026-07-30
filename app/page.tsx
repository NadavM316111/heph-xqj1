"use client";

import { useState, useEffect, useCallback } from "react";

interface College {
  id: string;
  name: string;
  state: string;
  commonAppDeadline: string | null;
  schoolDeadline: string | null;
  earlyActionDeadline: string | null;
  earlyDecisionDeadline: string | null;
  type: string;
}

interface Application {
  id: number;
  college_name: string;
  college_id: string | null;
  deadline_date: string;
  deadline_type: string;
  notes: string;
  created_at: string;
}

type AuthMode = "login" | "signup";
type View = "dashboard" | "add";

const COLLEGES: College[] = [
  { id: "mit", name: "MIT", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "harvard", name: "Harvard University", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "stanford", name: "Stanford University", state: "CA", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "yale", name: "Yale University", state: "CT", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "princeton", name: "Princeton University", state: "NJ", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "columbia", name: "Columbia University", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "upenn", name: "University of Pennsylvania", state: "PA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "brown", name: "Brown University", state: "RI", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "dartmouth", name: "Dartmouth College", state: "NH", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "cornell", name: "Cornell University", state: "NY", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "caltech", name: "California Institute of Technology", state: "CA", commonAppDeadline: "2025-01-03", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "uchicago", name: "University of Chicago", state: "IL", commonAppDeadline: "2025-01-06", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "duke", name: "Duke University", state: "NC", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "jhu", name: "Johns Hopkins University", state: "MD", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "northwestern", name: "Northwestern University", state: "IL", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "vanderbilt", name: "Vanderbilt University", state: "TN", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "wustl", name: "Washington University in St. Louis", state: "MO", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "rice", name: "Rice University", state: "TX", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "notre-dame", name: "University of Notre Dame", state: "IN", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "emory", name: "Emory University", state: "GA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "georgetown", name: "Georgetown University", state: "DC", commonAppDeadline: null, schoolDeadline: "2025-01-10", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "carnegie-mellon", name: "Carnegie Mellon University", state: "PA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "usc", name: "University of Southern California", state: "CA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "tufts", name: "Tufts University", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "wake-forest", name: "Wake Forest University", state: "NC", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "nyu", name: "New York University", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "ucsd", name: "UC San Diego", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ucla", name: "UCLA", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ucberkeley", name: "UC Berkeley", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ucsb", name: "UC Santa Barbara", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ucdavis", name: "UC Davis", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ucirvine", name: "UC Irvine", state: "CA", commonAppDeadline: null, schoolDeadline: "2024-11-30", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "umich", name: "University of Michigan", state: "MI", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "unc", name: "UNC Chapel Hill", state: "NC", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-10-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "virginia", name: "University of Virginia", state: "VA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Public" },
  { id: "georgetown-ea", name: "Georgetown University (EA)", state: "DC", commonAppDeadline: null, schoolDeadline: "2025-01-10", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "gatech", name: "Georgia Tech", state: "GA", commonAppDeadline: "2025-01-05", schoolDeadline: null, earlyActionDeadline: "2024-10-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "illinois", name: "University of Illinois Urbana-Champaign", state: "IL", commonAppDeadline: null, schoolDeadline: "2025-01-05", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "purdue", name: "Purdue University", state: "IN", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "ohio-state", name: "Ohio State University", state: "OH", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "penn-state", name: "Penn State University", state: "PA", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "ut-austin", name: "UT Austin", state: "TX", commonAppDeadline: null, schoolDeadline: "2024-12-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "uw-madison", name: "University of Wisconsin-Madison", state: "WI", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "minnesota", name: "University of Minnesota", state: "MN", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "indiana", name: "Indiana University Bloomington", state: "IN", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "rutgers", name: "Rutgers University", state: "NJ", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "colorado", name: "University of Colorado Boulder", state: "CO", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "arizona", name: "University of Arizona", state: "AZ", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "asu", name: "Arizona State University", state: "AZ", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "florida", name: "University of Florida", state: "FL", commonAppDeadline: null, schoolDeadline: "2024-11-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "fsu", name: "Florida State University", state: "FL", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "miami", name: "University of Miami", state: "FL", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "tulane", name: "Tulane University", state: "LA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "boston-college", name: "Boston College", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "boston-university", name: "Boston University", state: "MA", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "northeastern", name: "Northeastern University", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "case-western", name: "Case Western Reserve University", state: "OH", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "lehigh", name: "Lehigh University", state: "PA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "rpi", name: "Rensselaer Polytechnic Institute", state: "NY", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "rochester", name: "University of Rochester", state: "NY", commonAppDeadline: "2025-01-05", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "brandeis", name: "Brandeis University", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "american", name: "American University", state: "DC", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "gwu", name: "George Washington University", state: "DC", commonAppDeadline: "2025-01-05", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "fordham", name: "Fordham University", state: "NY", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "villanova", name: "Villanova University", state: "PA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "santa-clara", name: "Santa Clara University", state: "CA", commonAppDeadline: "2025-01-07", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "loyola-chicago", name: "Loyola University Chicago", state: "IL", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "marquette", name: "Marquette University", state: "WI", commonAppDeadline: "2025-12-01", schoolDeadline: null, earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "drexel", name: "Drexel University", state: "PA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "syracuse", name: "Syracuse University", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "bucknell", name: "Bucknell University", state: "PA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "colgate", name: "Colgate University", state: "NY", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "hamilton", name: "Hamilton College", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "bowdoin", name: "Bowdoin College", state: "ME", commonAppDeadline: "2025-01-05", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "middlebury", name: "Middlebury College", state: "VT", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "amherst", name: "Amherst College", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "williams", name: "Williams College", state: "MA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "swarthmore", name: "Swarthmore College", state: "PA", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "pomona", name: "Pomona College", state: "CA", commonAppDeadline: "2025-01-08", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "harvey-mudd", name: "Harvey Mudd College", state: "CA", commonAppDeadline: "2025-01-05", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "claremont-mckenna", name: "Claremont McKenna College", state: "CA", commonAppDeadline: "2025-01-10", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "scripps", name: "Scripps College", state: "CA", commonAppDeadline: "2025-01-06", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "wellesley", name: "Wellesley College", state: "MA", commonAppDeadline: "2025-01-08", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "smith", name: "Smith College", state: "MA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "barnard", name: "Barnard College", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "vassar", name: "Vassar College", state: "NY", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "colby", name: "Colby College", state: "ME", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "bates", name: "Bates College", state: "ME", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "kenyon", name: "Kenyon College", state: "OH", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "oberlin", name: "Oberlin College", state: "OH", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "macalester", name: "Macalester College", state: "MN", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "carleton", name: "Carleton College", state: "MN", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "grinnell", name: "Grinnell College", state: "IA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "colorado-college", name: "Colorado College", state: "CO", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "whitman", name: "Whitman College", state: "WA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "reed", name: "Reed College", state: "OR", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "davidson", name: "Davidson College", state: "NC", commonAppDeadline: "2025-01-12", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "trinity", name: "Trinity College (CT)", state: "CT", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "holy-cross", name: "College of the Holy Cross", state: "MA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "lafayette", name: "Lafayette College", state: "PA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "skidmore", name: "Skidmore College", state: "NY", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "union-college", name: "Union College", state: "NY", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "gettysburg", name: "Gettysburg College", state: "PA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "furman", name: "Furman University", state: "SC", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "rhodes", name: "Rhodes College", state: "TN", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "denison", name: "Denison University", state: "OH", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "st-olaf", name: "St. Olaf College", state: "MN", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "dickinson", name: "Dickinson College", state: "PA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "muhlenberg", name: "Muhlenberg College", state: "PA", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "connecticut", name: "Connecticut College", state: "CT", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "hobart-william-smith", name: "Hobart and William Smith Colleges", state: "NY", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "ithaca", name: "Ithaca College", state: "NY", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "stonehill", name: "Stonehill College", state: "MA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "suffolk", name: "Suffolk University", state: "MA", commonAppDeadline: "2025-03-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "elon", name: "Elon University", state: "NC", commonAppDeadline: "2025-01-10", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "james-madison", name: "James Madison University", state: "VA", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "virginia-tech", name: "Virginia Tech", state: "VA", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "vcu", name: "Virginia Commonwealth University", state: "VA", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "wm", name: "College of William & Mary", state: "VA", commonAppDeadline: "2025-01-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Public" },
  { id: "umass-amherst", name: "UMass Amherst", state: "MA", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "umass-lowell", name: "UMass Lowell", state: "MA", commonAppDeadline: null, schoolDeadline: "2025-02-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "connecticut-uconn", name: "University of Connecticut", state: "CT", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "temple", name: "Temple University", state: "PA", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "pitt", name: "University of Pittsburgh", state: "PA", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "unc-charlotte", name: "UNC Charlotte", state: "NC", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "clemson", name: "Clemson University", state: "SC", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "south-carolina", name: "University of South Carolina", state: "SC", commonAppDeadline: null, schoolDeadline: "2025-12-01", earlyActionDeadline: "2024-10-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "alabama", name: "University of Alabama", state: "AL", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-10-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "auburn", name: "Auburn University", state: "AL", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-10-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "georgia", name: "University of Georgia", state: "GA", commonAppDeadline: null, schoolDeadline: "2025-01-01", earlyActionDeadline: "2024-10-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "lsu", name: "Louisiana State University", state: "LA", commonAppDeadline: null, schoolDeadline: "2025-04-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "missouri", name: "University of Missouri", state: "MO", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "kansas", name: "University of Kansas", state: "KS", commonAppDeadline: null, schoolDeadline: "2025-04-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "iowa", name: "University of Iowa", state: "IA", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "nebraska", name: "University of Nebraska", state: "NE", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "oklahoma", name: "University of Oklahoma", state: "OK", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "texas-am", name: "Texas A&M University", state: "TX", commonAppDeadline: null, schoolDeadline: "2024-12-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "texas-tech", name: "Texas Tech University", state: "TX", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "baylor", name: "Baylor University", state: "TX", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "tcu", name: "Texas Christian University", state: "TX", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "smu", name: "Southern Methodist University", state: "TX", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "gonzaga", name: "Gonzaga University", state: "WA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: null, type: "Private" },
  { id: "seattle", name: "Seattle University", state: "WA", commonAppDeadline: "2025-03-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "portland", name: "University of Portland", state: "OR", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "pepperdine", name: "Pepperdine University", state: "CA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "lmu", name: "Loyola Marymount University", state: "CA", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "university-san-diego", name: "University of San Diego", state: "CA", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "university-san-francisco", name: "University of San Francisco", state: "CA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "depaul", name: "DePaul University", state: "IL", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "uic", name: "University of Illinois Chicago", state: "IL", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "iit", name: "Illinois Institute of Technology", state: "IL", commonAppDeadline: "2025-08-01", schoolDeadline: null, earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "nd-marquette", name: "University of Detroit Mercy", state: "MI", commonAppDeadline: null, schoolDeadline: "2025-08-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "michigan-state", name: "Michigan State University", state: "MI", commonAppDeadline: null, schoolDeadline: "2025-08-01", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "western-michigan", name: "Western Michigan University", state: "MI", commonAppDeadline: null, schoolDeadline: "2025-08-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "kent-state", name: "Kent State University", state: "OH", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "miami-ohio", name: "Miami University (Ohio)", state: "OH", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "xavier", name: "Xavier University", state: "OH", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "dayton", name: "University of Dayton", state: "OH", commonAppDeadline: "2025-03-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "denver", name: "University of Denver", state: "CO", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "utah", name: "University of Utah", state: "UT", commonAppDeadline: null, schoolDeadline: "2025-04-01", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "byu", name: "Brigham Young University", state: "UT", commonAppDeadline: null, schoolDeadline: "2024-12-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "nevada-reno", name: "University of Nevada, Reno", state: "NV", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "unlv", name: "University of Nevada, Las Vegas", state: "NV", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "hawaii", name: "University of Hawaii at Manoa", state: "HI", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "new-mexico", name: "University of New Mexico", state: "NM", commonAppDeadline: null, schoolDeadline: "2025-06-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "wyoming", name: "University of Wyoming", state: "WY", commonAppDeadline: null, schoolDeadline: "2025-08-10", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "south-dakota", name: "University of South Dakota", state: "SD", commonAppDeadline: null, schoolDeadline: "2025-07-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "north-dakota", name: "University of North Dakota", state: "ND", commonAppDeadline: null, schoolDeadline: "2025-08-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "montana", name: "University of Montana", state: "MT", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "idaho", name: "University of Idaho", state: "ID", commonAppDeadline: null, schoolDeadline: "2025-08-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "boise-state", name: "Boise State University", state: "ID", commonAppDeadline: null, schoolDeadline: "2025-05-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "utah-state", name: "Utah State University", state: "UT", commonAppDeadline: null, schoolDeadline: "2025-05-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Public" },
  { id: "new-hampshire", name: "University of New Hampshire", state: "NH", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: null, type: "Public" },
  { id: "vermont", name: "University of Vermont", state: "VT", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "maine", name: "University of Maine", state: "ME", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "rhode-island", name: "University of Rhode Island", state: "RI", commonAppDeadline: null, schoolDeadline: "2025-02-01", earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "delaware", name: "University of Delaware", state: "DE", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "maryland", name: "University of Maryland", state: "MD", commonAppDeadline: null, schoolDeadline: "2025-01-20", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "howard", name: "Howard University", state: "DC", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "spelman", name: "Spelman College", state: "GA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "morehouse", name: "Morehouse College", state: "GA", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: null, type: "Private" },
  { id: "hampton", name: "Hampton University", state: "VA", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "fisk", name: "Fisk University", state: "TN", commonAppDeadline: null, schoolDeadline: "2025-04-15", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "xavier-la", name: "Xavier University of Louisiana", state: "LA", commonAppDeadline: null, schoolDeadline: "2025-03-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "george-mason", name: "George Mason University", state: "VA", commonAppDeadline: null, schoolDeadline: "2025-01-15", earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Public" },
  { id: "american-university", name: "American University", state: "DC", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-15", earlyDecisionDeadline: null, type: "Private" },
  { id: "fordham-rosehill", name: "Fordham University (Rose Hill)", state: "NY", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "marist", name: "Marist College", state: "NY", commonAppDeadline: "2025-02-15", schoolDeadline: null, earlyActionDeadline: "2024-12-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "quinnipiac", name: "Quinnipiac University", state: "CT", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "fairfield", name: "Fairfield University", state: "CT", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-15", type: "Private" },
  { id: "bentley", name: "Bentley University", state: "MA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "babson", name: "Babson College", state: "MA", commonAppDeadline: "2025-01-02", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "olin", name: "Olin College of Engineering", state: "MA", commonAppDeadline: null, schoolDeadline: "2024-12-01", earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "worcester-poly", name: "Worcester Polytechnic Institute", state: "MA", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: "2024-11-01", type: "Private" },
  { id: "roger-williams", name: "Roger Williams University", state: "RI", commonAppDeadline: "2025-02-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "providence", name: "Providence College", state: "RI", commonAppDeadline: "2025-01-15", schoolDeadline: null, earlyActionDeadline: "2024-11-01", earlyDecisionDeadline: null, type: "Private" },
  { id: "assumption", name: "Assumption University", state: "MA", commonAppDeadline: "2025-03-01", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
  { id: "merrimack", name: "Merrimack College", state: "MA", commonAppDeadline: "2025-03-15", schoolDeadline: null, earlyActionDeadline: null, earlyDecisionDeadline: null, type: "Private" },
];

const DEADLINE_TYPES = [
  { value: "regular_decision", label: "Regular Decision" },
  { value: "early_decision", label: "Early Decision (ED)" },
  { value: "early_action", label: "Early Action (EA)" },
  { value: "rolling", label: "Rolling Admission" },
  { value: "custom", label: "Custom" },
];

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = deadline.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function urgencyColor(days: number): string {
  if (days < 0) return "#9ca3af";
  if (days <= 7) return "#ef4444";
  if (days <= 14) return "#f97316";
  if (days <= 30) return "#eab308";
  return "#22c55e";
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Past";
  if (days === 0) return "TODAY!";
  if (days === 1) return "Tomorrow!";
  return `${days} days`;
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  const [view, setView] = useState<View>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Search/add state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [manualName, setManualName] = useState("");
  const [deadlineType, setDeadlineType] = useState("regular_decision");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [notes, setNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Reminders
  const [reminderPhone, setReminderPhone] = useState("");
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderSaving, setReminderSaving] = useState(false);
  const [reminderMsg, setReminderMsg] = useState("");
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [savedReminders, setSavedReminders] = useState<{ phone: string; email: string } | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Sort
  const [sortBy, setSortBy] = useState<"deadline" | "name">("deadline");

  useEffect(() => {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: window.location.pathname }) });
    const saved = localStorage.getItem("edutracker_user");
    if (saved) setUser(saved);
    const reminders = localStorage.getItem("edutracker_reminders");
    if (reminders) setSavedReminders(JSON.parse(reminders));
  }, []);

  const loadApplications = useCallback(async (userEmail: string) => {
    setAppsLoading(true);
    try {
      const res = await fetch(`/api/applications?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.applications) setApplications(data.applications);
    } catch {
      // silent
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadApplications(user);
  }, [user, loadApplications]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode, email, password }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else if (data.email) {
        setUser(data.email);
        localStorage.setItem("edutracker_user", data.email);
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const results = COLLEGES.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.state.toLowerCase().includes(lower)
    ).slice(0, 8);
    setSearchResults(results);
  };

  const selectCollege = (college: College) => {
    setSelectedCollege(college);
    setSearchQuery(college.name);
    setSearchResults([]);
    setManualName(college.name);
    // Pre-fill deadline based on type
    const dd = deadlineType === "early_decision"
      ? college.earlyDecisionDeadline
      : deadlineType === "early_action"
      ? college.earlyActionDeadline
      : college.commonAppDeadline || college.schoolDeadline;
    if (dd) setDeadlineDate(dd);
  };

  const handleDeadlineTypeChange = (val: string) => {
    setDeadlineType(val);
    if (selectedCollege) {
      const dd = val === "early_decision"
        ? selectedCollege.earlyDecisionDeadline
        : val === "early_action"
        ? selectedCollege.earlyActionDeadline
        : selectedCollege.commonAppDeadline || selectedCollege.schoolDeadline;
      if (dd) setDeadlineDate(dd);
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    const name = selectedCollege ? selectedCollege.name : manualName.trim();
    if (!name) { setAddError("Please enter a college name."); setAddLoading(false); return; }
    if (!deadlineDate) { setAddError("Please enter a deadline date."); setAddLoading(false); return; }
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user,
          college_name: name,
          college_id: selectedCollege?.id || null,
          deadline_date: deadlineDate,
          deadline_type: deadlineType,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAddError(data.error);
      } else {
        setAddSuccess(`${name} added!`);
        setSearchQuery("");
        setSelectedCollege(null);
        setManualName("");
        setDeadlineDate("");
        setNotes("");
        setDeadlineType("regular_decision");
        await loadApplications(user);
        setTimeout(() => { setView("dashboard"); setAddSuccess(""); }, 1200);
      }
    } catch {
      setAddError("Failed to add application.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      await fetch("/api/applications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: user }),
      });
      setDeleteId(null);
      await loadApplications(user);
    } catch {
      // silent
    }
  };

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    setReminderSaving(true);
    const obj = { phone: reminderPhone, email: reminderEmail };
    localStorage.setItem("edutracker_reminders", JSON.stringify(obj));
    setSavedReminders(obj);
    setTimeout(() => {
      setReminderSaving(false);
      setReminderMsg("Reminder preferences saved!");
      setTimeout(() => setReminderMsg(""), 3000);
    }, 500);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("edutracker_user");
    setApplications([]);
  };

  const sorted = [...applications].sort((a, b) => {
    if (sortBy === "deadline") {
      return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
    }
    return a.college_name.localeCompare(b.college_name);
  });

  const upcoming = sorted.filter(a => daysUntil(a.deadline_date) <= 30 && daysUntil(a.deadline_date) >= 0);

  // ─── Auth Screen ───
  if (!user) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>🎓</div>
          <h1 style={styles.logoTitle}>Edutracker</h1>
          <p style={styles.logoSub}>Never miss a college application deadline.</p>
          <div style={styles.tabRow}>
            <button style={{ ...styles.tab, ...(authMode === "login" ? styles.tabActive : {}) }} onClick={() => setAuthMode("login")}>Log In</button>
            <button style={{ ...styles.tab, ...(authMode === "signup" ? styles.tabActive : {}) }} onClick={() => setAuthMode("signup")}>Sign Up</button>
          </div>
          <form onSubmit={handleAuth} style={styles.form}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required autoComplete="email" />
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={authMode === "signup" ? "new-password" : "current-password"} />
            {authError && <div style={styles.errorMsg}>{authError}</div>}
            <button style={styles.primaryBtn} type="submit" disabled={authLoading}>
              {authLoading ? "..." : authMode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
          <p style={styles.smallText}>
            {authMode === "login" ? "No account? " : "Have an account? "}
            <span style={styles.link} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
              {authMode === "login" ? "Sign up free" : "Log in"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // ─── Main App ───
  return (
    <div style={styles.appShell}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={{ fontSize: 22 }}>🎓</span>
          <span style={styles.headerTitle}>Edutracker</span>
        </div>
        <div style={styles.headerRight}>
          <span style={styles.userEmail}>{user}</span>
          <button style={styles.ghostBtn} onClick={() => setShowReminderPanel(!showReminderPanel)}>🔔 Reminders</button>
          <button style={styles.ghostBtn} onClick={logout}>Log out</button>
        </div>
      </header>

      {/* Reminder banner for upcoming deadlines */}
      {upcoming.length > 0 && (
        <div style={styles.reminderBanner}>
          <span>⚠️ <strong>{upcoming.length} deadline{upcoming.length > 1 ? "s" : ""}</strong> coming up in the next 30 days!</span>
          <span style={{ marginLeft: 12 }}>
            {upcoming.slice(0, 3).map(a => (
              <span key={a.id} style={{ marginRight: 10, color: urgencyColor(daysUntil(a.deadline_date)), fontWeight: 600 }}>
                {a.college_name} ({urgencyLabel(daysUntil(a.deadline_date))})
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Reminder Panel */}
      {showReminderPanel && (
        <div style={styles.reminderPanel}>
          <h3 style={{ margin: "0 0 6px" }}>📬 Deadline Reminders</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6b7280" }}>
            We&apos;ll remind you 30, 14, and 7 days before each deadline. Save your info below.
            {savedReminders && (
              <span style={{ color: "#22c55e", marginLeft: 8 }}>✓ Currently saved</span>
            )}
          </p>
          <form onSubmit={handleSaveReminders} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div>
              <label style={styles.label}>Email for reminders</label>
              <input style={{ ...styles.input, width: 210 }} type="email" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)} placeholder={user} />
            </div>
            <div>
              <label style={styles.label}>Phone (SMS reminders)</label>
              <input style={{ ...styles.input, width: 160 }} type="tel" value={reminderPhone} onChange={e => setReminderPhone(e.target.value)} placeholder="+15551234567" />
            </div>
            <button style={{ ...styles.primaryBtn, width: "auto", padding: "8px 18px" }} type="submit" disabled={reminderSaving}>
              {reminderSaving ? "Saving..." : "Save"}
            </button>
          </form>
          {reminderMsg && <p style={{ color: "#22c55e", marginTop: 8, fontSize: 13 }}>{reminderMsg}</p>}
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
            Reminder intervals: 30 days, 14 days, and 7 days before each deadline.
          </p>
        </div>
      )}

      <div style={styles.main}>
        {/* Nav */}
        <div style={styles.navTabs}>
          <button
            style={{ ...styles.navTab, ...(view === "dashboard" ? styles.navTabActive : {}) }}
            onClick={() => setView("dashboard")}
          >
            📋 My Applications ({applications.length})
          </button>
          <button
            style={{ ...styles.navTab, ...(view === "add" ? styles.navTabActive : {}) }}
            onClick={() => setView("add")}
          >
            ➕ Add School
          </button>
        </div>

        {/* ── Dashboard ── */}
        {view === "dashboard" && (
          <div>
            {applications.length === 0 && !appsLoading && (
              <div style={styles.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <h2 style={{ margin: "0 0 8px", color: "#374151" }}>No applications yet</h2>
                <p style={{ color: "#6b7280", marginBottom: 20 }}>Add the colleges you&apos;re applying to and track their deadlines.</p>
                <button style={{ ...styles.primaryBtn, width: "auto", padding: "10px 24px" }} onClick={() => setView("add")}>
                  Add Your First School
                </button>
              </div>
            )}

            {applications.length > 0 && (
              <>
                <div style={styles.dashTop}>
                  <div style={styles.statsRow}>
                    <div style={styles.statCard}>
                      <div style={styles.statNum}>{applications.length}</div>
                      <div style={styles.statLabel}>Schools</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statNum, color: "#ef4444" }}>
                        {applications.filter(a => daysUntil(a.deadline_date) >= 0 && daysUntil(a.deadline_date) <= 7).length}
                      </div>
                      <div style={styles.statLabel}>Due ≤ 7 days</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statNum, color: "#f97316" }}>
                        {applications.filter(a => daysUntil(a.deadline_date) > 7 && daysUntil(a.deadline_date) <= 30).length}
                      </div>
                      <div style={styles.statLabel}>Due ≤ 30 days</div>
                    </div>
                    <div style={styles.statCard}>
                      <div style={{ ...styles.statNum, color: "#9ca3af" }}>
                        {applications.filter(a => daysUntil(a.deadline_date) < 0).length}
                      </div>
                      <div style={styles.statLabel}>Submitted/Past</div>
                    </div>
                  </div>
                  <div>
                    <label style={{ ...styles.label, marginRight: 6 }}>Sort:</label>
                    <select style={styles.select} value={sortBy} onChange={e => setSortBy(e.target.value as "deadline" | "name")}>
                      <option value="deadline">By Deadline</option>
                      <option value="name">By Name</option>
                    </select>
                  </div>
                </div>

                {appsLoading && <div style={styles.loading}>Loading...</div>}

                <div style={styles.cardGrid}>
                  {sorted.map(app => {
                    const days = daysUntil(app.deadline_date);
                    const color = urgencyColor(days);
                    const label = urgencyLabel(days);
                    const dtLabel = DEADLINE_TYPES.find(d => d.value === app.deadline_type)?.label || app.deadline_type;
                    return (
                      <div key={app.id} style={{ ...styles.appCard, borderLeft: `4px solid ${color}` }}>
                        <div style={styles.appCardTop}>
                          <div>
                            <div style={styles.appName}>{app.college_name}</div>
                            <div style={styles.appMeta}>{dtLabel}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ ...styles.daysLabel, color }}>{label}</div>
                            <div style={styles.dateLabel}>{formatDate(app.deadline_date)}</div>
                          </div>
                        </div>
                        {app.notes && (
                          <div style={styles.appNotes}>📝 {app.notes}</div>
                        )}
                        <div style={styles.appCardBottom}>
                          <div style={{ ...styles.reminderDots }}>
                            {[30, 14, 7].map(r => (
                              <span
                                key={r}
                                style={{
                                  ...styles.reminderDot,
                                  background: days <= r && days >= 0 ? color : "#e5e7eb",
                                  color: days <= r && days >= 0 ? "#fff" : "#9ca3af",
                                }}
                                title={`${r}-day reminder`}
                              >
                                {r}d
                              </span>
                            ))}
                          </div>
                          {deleteId === app.id ? (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button style={styles.dangerBtn} onClick={() => handleDelete(app.id)}>Confirm Delete</button>
                              <button style={styles.ghostSmallBtn} onClick={() => setDeleteId(null)}>Cancel</button>
                            </div>
                          ) : (
                            <button style={styles.ghostSmallBtn} onClick={() => setDeleteId(app.id)}>🗑 Remove</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Add School ── */}
        {view === "add" && (
          <div style={styles.addPanel}>
            <h2 style={styles.sectionTitle}>Add a College</h2>
            <p style={styles.sectionSub}>Search our database of 200 top US colleges, or enter any school manually.</p>

            <form onSubmit={handleAddApplication} style={styles.addForm}>
              {/* Search */}
              <div style={{ position: "relative" }}>
                <label style={styles.label}>Search colleges</label>
                <input
                  style={styles.input}
                  type="text"
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="e.g. Harvard, UCLA, Michigan..."
                  autoComplete="off"
                />
                {searchResults.length > 0 && (
                  <div style={styles.dropdown}>
                    {searchResults.map(c => (
                      <div
                        key={c.id}
                        style={styles.dropdownItem}
                        onClick={() => selectCollege(c)}
                      >
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        <span style={{ color: "#6b7280", fontSize: 12, marginLeft: 8 }}>{c.state} · {c.type}</span>
                        {c.commonAppDeadline && <span style={{ color: "#6b7280", fontSize: 12, marginLeft: 8 }}>Common App: {formatDate(c.commonAppDeadline)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Or manual */}
              {!selectedCollege && (
                <div>
                  <label style={styles.label}>Or enter school name manually</label>
                  <input style={styles.input} type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Any college name..." />
                </div>
              )}

              {selectedCollege && (
                <div style={styles.selectedBadge}>
                  ✓ Selected: <strong>{selectedCollege.name}</strong>
                  <button type="button" style={{ ...styles.ghostSmallBtn, marginLeft: 10 }} onClick={() => { setSelectedCollege(null); setSearchQuery(""); setManualName(""); setDeadlineDate(""); }}>Clear</button>
                </div>
              )}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={styles.label}>Deadline Type</label>
                  <select style={styles.select} value={deadlineType} onChange={e => handleDeadlineTypeChange(e.target.value)}>
                    {DEADLINE_TYPES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={styles.label}>Deadline Date</label>
                  <input
                    style={styles.input}
                    type="date"
                    value={deadlineDate}
                    onChange={e => setDeadlineDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {deadlineDate && (
                <div style={{ padding: "8px 12px", background: "#f0fdf4", borderRadius: 8, fontSize: 13, color: "#16a34a" }}>
                  📅 {formatDate(deadlineDate)} — <strong>{urgencyLabel(daysUntil(deadlineDate))}</strong> from today
                </div>
              )}

              <div>
                <label style={styles.label}>Notes (optional)</label>
                <textarea style={{ ...styles.input, height: 72, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Essays due separately, need rec letters by Nov 15..." />
              </div>

              {addError && <div style={styles.errorMsg}>{addError}</div>}
              {addSuccess && <div style={styles.successMsg}>{addSuccess}</div>}

              <div style={{ display: "flex", gap: 10 }}>
                <button style={styles.primaryBtn} type="submit" disabled={addLoading}>
                  {addLoading ? "Adding..." : "Add to My List"}
                </button>
                <button type="button" style={{ ...styles.ghostBtn, padding: "10px 20px" }} onClick={() => setView("dashboard")}>
                  Cancel
                </button>
              </div>
            </form>

            {/* Popular schools quick-add */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, color: "#374151" }}>⭐ Popular Schools (click to pre-fill)</h3>
              <div style={styles.quickAddGrid}>
                {COLLEGES.slice(0, 20).map(c => (
                  <button
                    key={c.id}
                    style={styles.quickAddBtn}
                    type="button"
                    onClick={() => {
                      selectCollege(c);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  authPage: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  authCard: {
    background: "#fff",
    borderRadius: 20,
    padding: "40px 36px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    textAlign: "center",
  },
  logo: { fontSize: 48, marginBottom: 4 },
  logoTitle: { margin: "0 0 4px", fontSize: 28, fontWeight: 800, color: "#1e3a5f" },
  logoSub: { margin: "0 0 24px", color: "#6b7280", fontSize: 14 },
  tabRow: { display: "flex", marginBottom: 24, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" },
  tab: { flex: 1, padding: "10px 0", background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "#6b7280" },
  tabActive: { background: "#2563eb", color: "#fff", fontWeight: 600 },
  form: { display: "flex", flexDirection: "column", gap: 12, textAlign: "left" },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" },
  input: {
    width: "100%",
    padding: "9px 12px",
    border: "1.5px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },
  primaryBtn: {
    width: "100%",
    padding: "11px 0",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 9,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
  },
  ghostBtn: {
    background: "transparent",
    border: "1.5px solid #e5e7eb",
    borderRadius: 8,
    padding: "7px 14px",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
  },
  errorMsg: { background: "#fef2f2", color: "#dc2626", padding: "8px 12px", borderRadius: 7, fontSize: 13 },
  successMsg: { background: "#f0fdf4", color: "#16a34a", padding: "8px 12px", borderRadius: 7, fontSize: 13 },
  smallText: { marginTop: 16, fontSize: 13, color: "#6b7280" },
  link: { color: "#2563eb", cursor: "pointer", fontWeight: 600 },
  appShell: { minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" },
  header: {
    background: "#1e3a5f",
    color: "#fff",
    padding: "0 24px",
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontWeight: 800, fontSize: 20, color: "#fff" },
  headerRight: { display: "flex", alignItems: "center", gap: 10 },
  userEmail: { fontSize: 13, color: "#93c5fd", marginRight: 4 },
  reminderBanner: {
    background: "#fff3cd",
    borderBottom: "1px solid #fbbf24",
    padding: "10px 24px",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  reminderPanel: {
    background: "#fff",
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 24px",
  },
  main: { maxWidth: 980, margin: "0 auto", padding: "24px 16px" },
  navTabs: { display: "flex", gap: 0, marginBottom: 24, borderBottom: "2px solid #e5e7eb" },
  navTab: {
    padding: "10px 22px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    color: "#6b7280",
    borderBottom: "2px solid transparent",
    marginBottom: -2,
  },
  navTabActive: { color: "#2563eb", borderBottom: "2px solid #2563eb" },
  emptyState: { textAlign: "center", padding: "60px 20px" },
  dashTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 },
  statsRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  statCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "12px 20px",
    textAlign: "center",
    minWidth: 80,
  },
  statNum: { fontSize: 26, fontWeight: 800, color: "#1e3a5f" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  select: {
    padding: "8px 12px",
    border: "1.5px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
  },
  loading: { textAlign: "center", color: "#6b7280", padding: 40 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  appCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  appCardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  appName: { fontWeight: 700, fontSize: 15, color: "#1e3a5f", marginBottom: 3 },
  appMeta: { fontSize: 12, color: "#6b7280" },
  daysLabel: { fontWeight: 800, fontSize: 18 },
  dateLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  appNotes: { fontSize: 12, color: "#4b5563", background: "#f9fafb", borderRadius: 6, padding: "5px 9px", marginBottom: 10 },
  appCardBottom: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  reminderDots: { display: "flex", gap: 5 },
  reminderDot: {
    padding: "2px 7px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  },
  ghostSmallBtn: {
    background: "transparent",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
    color: "#6b7280",
  },
  dangerBtn: {
    background: "#fee2e2",
    border: "1px solid #fca5a5",
    borderRadius: 6,
    padding: "4px 10px",
    cursor: "pointer",
    fontSize: 12,
    color: "#dc2626",
    fontWeight: 600,
  },
  addPanel: { maxWidth: 640 },
  sectionTitle: { margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#1e3a5f" },
  sectionSub: { margin: "0 0 24px", color: "#6b7280", fontSize: 14 },
  addForm: { display: "flex", flexDirection: "column", gap: 16 },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1.5px solid #d1d5db",
    borderRadius: 10,
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    zIndex: 200,
    maxHeight: 280,
    overflowY: "auto",
  },
  dropdownItem: {
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  selectedBadge: {
    background: "#eff6ff",
    border: "1.5px solid #93c5fd",
    borderRadius: 8,
    padding: "9px 14px",
    fontSize: 14,
    color: "#1e40af",
    display: "flex",
    alignItems: "center",
  },
  quickAddGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  quickAddBtn: {
    padding: "6px 14px",
    background: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    cursor: "pointer",
    fontSize: 13,
    color: "#334155",
    whiteSpace: "nowrap",
  },
};