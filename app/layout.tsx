import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker – College Application Deadline Tracker",
  description: "Never miss a college application deadline. Track ED, EA, RD, and scholarship deadlines with automated reminders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}