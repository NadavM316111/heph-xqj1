export interface College {
  id: string;
  name: string;
  location: string;
}

export interface Deadline {
  id: string;
  collegeId: string;
  collegeName: string;
  collegeLocation: string;
  type: "EA" | "ED" | "RD" | "Scholarship";
  date: string; // ISO date string YYYY-MM-DD
  notes: string;
}

export interface UserData {
  email: string;
  colleges: College[];
  deadlines: Deadline[];
}

export type DeadlineType = "EA" | "ED" | "RD" | "Scholarship";

export interface UrgencyInfo {
  daysRemaining: number;
  color: string;
  label: string;
  bgColor: string;
  borderColor: string;
}