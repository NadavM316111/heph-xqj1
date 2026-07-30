import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduTracker — College Application Deadline Tracker",
  description: "Track your college application deadlines and never miss an EA, ED, or RD date. Get email reminders 30, 14, 7, and 1 day before each deadline.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}