"use client";

import { useSearchParams } from "next/navigation";
import OpportunityGrid from "./OpportunityGrid";

export default function HomeContent() {
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "";
  const industry = searchParams.get("industry") ?? "";
  const sort = searchParams.get("sort") ?? "deadline";
  const organizer = searchParams.get("organizer") ?? "";
  const gradYearParam = searchParams.get("grad_year") ?? "";
  const gradYears = gradYearParam ? gradYearParam.split(",").map(Number).filter(Boolean) : [];

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      <OpportunityGrid
        type={type}
        industry={industry}
        gradYears={gradYears}
        organizer={organizer}
        sort={sort}
      />
    </section>
  );
}
