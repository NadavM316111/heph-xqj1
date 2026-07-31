import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduTracker – Never Miss a College Deadline",
  description: "Track all your college application deadlines in one place with smart reminders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}