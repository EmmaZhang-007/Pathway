"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { getSupabase, Opportunity } from "@/lib/supabase";
import OpportunityCard from "./OpportunityCard";

const PAGE_SIZE = 12;

interface Props {
  type: string;
  industry: string;
  gradYears: number[];
  organizer: string;
  sort: string;
}

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export default function OpportunityGrid({ type, industry, gradYears, organizer, sort }: Props) {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (pageIndex: number, reset: boolean) => {
      setLoading(true);
      let query = getSupabase()
        .from("opportunities")
        .select("*")
        .eq("is_verified", true)
        .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1);

      if (type) query = query.eq("type", type);
      if (industry) query = query.eq("industry", industry);
      if (organizer) query = query.ilike("organizer", `%${organizer}%`);
      if (gradYears.length > 0) query = query.overlaps("grad_year", gradYears);

      query = query
        .gte("date_start", "2026-06-17")
        .lte("date_start", "2027-08-31");

      if (sort === "created_at") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("deadline", { ascending: true, nullsFirst: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        const rows = data as Opportunity[];
        setItems((prev) => (reset ? rows : [...prev, ...rows]));
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoading(false);
    },
    [type, industry, gradYears, organizer, sort]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gradYearsKey = gradYears.join(",");

  useEffect(() => {
    setPage(0);
    setItems([]);
    setHasMore(true);
    fetchPage(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, industry, gradYearsKey, organizer, sort]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const next = page + 1;
          setPage(next);
          fetchPage(next, false);
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading, page, fetchPage]);

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <SearchX size={40} className="text-[#9CA3AF] mb-4" />
        <p className="text-[#1A1A1A] text-lg font-medium">No opportunities match your filters.</p>
        <p className="text-[#9CA3AF] text-sm mt-1">Try adjusting or clearing your filters.</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((opp, i) => (
          <OpportunityCard key={opp.id} opp={opp} delay={(i % 12) * 0.06} />
        ))}
      </motion.div>

      <div ref={sentinelRef} className="h-8 mt-6" />

      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#00B5B8] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-[#9CA3AF] text-sm py-8">
          You&apos;ve seen all {items.length} opportunities.
        </p>
      )}
    </div>
  );
}
