import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — Never Miss a College Deadline",
  description: "Track all your college application deadlines in one place. Get reminders at 30, 14, and 7 days out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}