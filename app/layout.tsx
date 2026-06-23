import type { Metadata } from "next";
import { Righteous, DM_Sans, Syne } from "next/font/google";
import Link from "next/link";
import PageTransition from "@/components/PageTransition";
import FeedbackToast from "@/components/FeedbackToast";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const righteous = Righteous({ subsets: ["latin"], weight: "400", variable: "--font-righteous" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne" });

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
        className={`${dmSans.variable} ${righteous.variable} ${syne.variable} font-[family-name:var(--font-dm-sans)] antialiased text-[#1A1A1A]`}
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Fixed aura background — sits behind everything */}
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        >
          {/* Teal — top-left */}
          <div style={{
            position: "absolute", top: "-5%", left: "-8%",
            width: "55vw", height: "55vw",
            background: "radial-gradient(circle, #00B5B8 0%, transparent 70%)",
            opacity: 0.18, filter: "blur(80px)",
          }} />
          {/* Magenta — top-right */}
          <div style={{
            position: "absolute", top: "5%", right: "-10%",
            width: "50vw", height: "50vw",
            background: "radial-gradient(circle, #E8007D 0%, transparent 70%)",
            opacity: 0.14, filter: "blur(90px)",
          }} />
          {/* Purple — center */}
          <div style={{
            position: "absolute", top: "40%", left: "30%",
            width: "45vw", height: "45vw",
            background: "radial-gradient(circle, #7B2FBE 0%, transparent 70%)",
            opacity: 0.13, filter: "blur(80px)",
          }} />
          {/* Green — lower-left */}
          <div style={{
            position: "absolute", bottom: "5%", left: "5%",
            width: "40vw", height: "40vw",
            background: "radial-gradient(circle, #00C853 0%, transparent 70%)",
            opacity: 0.11, filter: "blur(90px)",
          }} />
          {/* Orange — lower-right */}
          <div style={{
            position: "absolute", bottom: "-5%", right: "5%",
            width: "40vw", height: "40vw",
            background: "radial-gradient(circle, #FF6D00 0%, transparent 70%)",
            opacity: 0.11, filter: "blur(80px)",
          }} />
        </div>

        <nav className="border-b border-gray-100 px-6 py-3 flex items-center justify-between bg-white/80 backdrop-blur-sm">
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
        <PageTransition>{children}</PageTransition>
        <FeedbackToast />
      </body>
    </html>
  );
}
