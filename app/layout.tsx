import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — Never Miss a College Deadline",
  description:
    "Track EA, ED, RD, and scholarship deadlines for your target colleges. Get email and SMS reminders 30, 7, and 1 day before each deadline.",
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