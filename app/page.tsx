import { Suspense } from "react";
import HeroSection from "@/components/HeroSection";
import FilterBar from "@/components/FilterBar";
import HomeContent from "@/components/HomeContent";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />

      <Suspense fallback={<div className="h-16 border-b border-gray-100" />}>
        <FilterBar />
        <HomeContent />
      </Suspense>
    </main>
  );
}
