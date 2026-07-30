import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — College Application Deadline Tracker",
  description: "Track your college application deadlines all in one place. Never miss an Early Decision or Regular Decision deadline again.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}