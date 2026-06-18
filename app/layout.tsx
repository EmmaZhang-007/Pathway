import type { Metadata } from "next";
import { Righteous, DM_Sans } from "next/font/google";
import Link from "next/link";
import FeedbackToast from "@/components/FeedbackToast";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-righteous",
});

const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfTtX4Di2o1c-_XCM81XW5UgeNEFcxajpjQH7-ZkMOwWik0iQ/viewform?usp=publish-editor";

export const metadata: Metadata = {
  title: "Pathways — Student Opportunity Hub",
  description: "Conferences, case competitions, and events for Toronto students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${righteous.variable} font-[family-name:var(--font-dm-sans)] antialiased bg-white text-[#1A1A1A]`}
      >
        <nav className="border-b border-gray-100 px-6 py-3 flex items-center justify-between bg-white">
          <Link
            href="/"
            className="text-lg font-[family-name:var(--font-righteous)] gradient-text"
          >
            Pathways
          </Link>
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold bg-[#E8007D] hover:bg-[#C4006A] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Request to Add Event
          </a>
        </nav>
        {children}
        <FeedbackToast />
      </body>
    </html>
  );
}
