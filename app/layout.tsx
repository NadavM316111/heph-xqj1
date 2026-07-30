import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — Never Miss a College Deadline",
  description: "Track EA, ED, RD, and scholarship deadlines for 80+ top colleges. Get email and SMS reminders so you never miss an application deadline.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}