import { UrgencyInfo } from "./types";

export function getUrgency(dateStr: string): UrgencyInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) {
    return {
      daysRemaining: diff,
      color: "#6b7280",
      bgColor: "#f3f4f6",
      borderColor: "#d1d5db",
      label: "Past",
    };
  }
  if (diff === 0) {
    return {
      daysRemaining: 0,
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fca5a5",
      label: "Today!",
    };
  }
  if (diff <= 7) {
    return {
      daysRemaining: diff,
      color: "#dc2626",
      bgColor: "#fef2f2",
      borderColor: "#fca5a5",
      label: `${diff}d`,
    };
  }
  if (diff <= 30) {
    return {
      daysRemaining: diff,
      color: "#d97706",
      bgColor: "#fffbeb",
      borderColor: "#fcd34d",
      label: `${diff}d`,
    };
  }
  return {
    daysRemaining: diff,
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#86efac",
    label: `${diff}d`,
  };
}

export function getDeadlineTypeBadge(type: string): { bg: string; color: string } {
  switch (type) {
    case "EA":
      return { bg: "#dbeafe", color: "#1d4ed8" };
    case "ED":
      return { bg: "#ede9fe", color: "#7c3aed" };
    case "RD":
      return { bg: "#dcfce7", color: "#15803d" };
    case "Scholarship":
      return { bg: "#fef9c3", color: "#a16207" };
    default:
      return { bg: "#f3f4f6", color: "#374151" };
  }
}