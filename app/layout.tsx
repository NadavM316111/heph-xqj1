import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edutracker — Never Miss a College Deadline",
  description:
    "Track college application deadlines for EA, ED, RD, and scholarships. Get automated reminders 30, 14, 7, and 1 day before each deadline.",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}