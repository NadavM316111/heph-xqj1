import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — College Deadline Tracker",
  description: "Track EA, ED, RD, and scholarship deadlines for the top 200 US colleges. Never miss a college application deadline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}