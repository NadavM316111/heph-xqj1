import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — College Application Deadline Tracker",
  description:
    "Track all your college application deadlines in one place. Never miss an Early Decision, Early Action, or Regular Decision date.",
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