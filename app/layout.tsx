import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduTracker – Never Miss a College Deadline",
  description: "Track college application deadlines and get automatic reminders for EA, ED, and RD deadlines.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}