import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import HomeContent from "@/components/HomeContent";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section
        className="relative px-6 pt-20 pb-16 text-center overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse at 15% 60%, rgba(0, 181, 184, 0.30) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 25%, rgba(232, 0, 125, 0.22) 0%, transparent 55%),
            radial-gradient(ellipse at 65% 80%, rgba(123, 47, 190, 0.22) 0%, transparent 50%),
            radial-gradient(ellipse at 35% 20%, rgba(0, 200, 83, 0.18) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 109, 0, 0.18) 0%, transparent 45%),
            #ffffff
          `,
        }}
      >
        {/* Soft blur overlay for depth */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backdropFilter: "blur(0px)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1
            className="font-[family-name:var(--font-righteous)] leading-none mb-5"
            style={{
              fontSize: "clamp(64px, 10vw, 96px)",
              background: "linear-gradient(135deg, #00B5B8 0%, #7B2FBE 50%, #E8007D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Pathways
          </h1>
          <p
            className="font-[family-name:var(--font-dm-sans)] font-medium text-[#333333]"
            style={{ fontSize: "clamp(18px, 2.5vw, 22px)" }}
          >
            The launchpad for students who want to stay ahead.
          </p>
        </div>
      </section>

      {/* Filter bar + results */}
      <Suspense fallback={<div className="h-16 border-b border-gray-100" />}>
        <FilterBar />
        <HomeContent />
      </Suspense>
    </main>
  );
}
