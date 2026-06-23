"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

const TYPES = [
  { value: "", label: "All" },
  { value: "conference", label: "Conference" },
  { value: "event", label: "Event" },
  { value: "case_comp", label: "Case Competition" },
];

const INDUSTRIES = [
  { value: "", label: "All" },
  { value: "finance", label: "Finance" },
  { value: "consulting", label: "Consulting" },
  { value: "both", label: "Both" },
];

const GRAD_YEARS = [2027, 2028, 2029, 2030];

const SORT_OPTIONS = [
  { value: "deadline", label: "Soonest Deadline" },
  { value: "created_at", label: "Date Added" },
];

const TYPE_ACTIVE: Record<string, string> = {
  "": "bg-[#1A1A1A] text-white",
  conference: "bg-[#00B5B8] text-white",
  event: "bg-[#7B2FBE] text-white",
  case_comp: "bg-[#E8007D] text-white",
};

// Extracted to module scope to prevent remount on every parent render
interface FilterContentProps {
  selectedType: string;
  selectedIndustry: string;
  selectedGradYears: number[];
  selectedSort: string;
  organizerInput: string;
  onOrganizerChange: (v: string) => void;
  onOrganizerSubmit: () => void;
  onTypeChange: (v: string) => void;
  onIndustryChange: (v: string) => void;
  onGradYearToggle: (year: number) => void;
  onSortChange: (v: string) => void;
}

function FilterContent({
  selectedType,
  selectedIndustry,
  selectedGradYears,
  selectedSort,
  organizerInput,
  onOrganizerChange,
  onOrganizerSubmit,
  onTypeChange,
  onIndustryChange,
  onGradYearToggle,
  onSortChange,
}: FilterContentProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Type pills */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1.5 font-medium uppercase tracking-wide">Type</p>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <motion.button
              key={t.value}
              onClick={() => onTypeChange(t.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedType === t.value
                  ? TYPE_ACTIVE[t.value]
                  : "bg-white text-[#6B7280] border border-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {t.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Industry pills */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1.5 font-medium uppercase tracking-wide">Industry</p>
        <div className="flex gap-1.5">
          {INDUSTRIES.map((i) => (
            <motion.button
              key={i.value}
              onClick={() => onIndustryChange(i.value)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedIndustry === i.value
                  ? "bg-[#00B5B8] text-white"
                  : "bg-white text-[#6B7280] border border-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {i.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Grad year */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1.5 font-medium uppercase tracking-wide">Grad Year</p>
        <div className="flex gap-1.5">
          {GRAD_YEARS.map((year) => (
            <motion.button
              key={year}
              onClick={() => onGradYearToggle(year)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                selectedGradYears.includes(year)
                  ? "bg-[#7B2FBE] text-white"
                  : "bg-white text-[#6B7280] border border-gray-200"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              {String(year).slice(2)}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Organizer search */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1.5 font-medium uppercase tracking-wide">Organizer</p>
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="Search organizer…"
            value={organizerInput}
            onChange={(e) => onOrganizerChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onOrganizerSubmit()}
            className="bg-white border border-gray-200 text-[#1A1A1A] text-xs rounded-lg px-3 py-1.5 w-36 placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#00B5B8] transition-colors"
          />
          <button
            onClick={onOrganizerSubmit}
            className="bg-white border border-gray-200 hover:border-[#00B5B8] text-[#6B7280] text-xs px-2.5 py-1.5 rounded-lg transition-colors"
            aria-label="Search"
          >
            →
          </button>
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs text-[#6B7280] mb-1.5 font-medium uppercase tracking-wide">Sort By</p>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-white border border-gray-200 text-[#6B7280] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#00B5B8] transition-colors cursor-pointer"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const getParam = (key: string) => searchParams.get(key) ?? "";
  const getParamArray = (key: string): number[] => {
    const val = searchParams.get(key);
    if (!val) return [];
    return val.split(",").map(Number).filter(Boolean);
  };

  const selectedType = getParam("type");
  const selectedIndustry = getParam("industry");
  const selectedGradYears = getParamArray("grad_year");
  const selectedSort = getParam("sort") || "deadline";
  const urlOrganizer = getParam("organizer");

  // Local input state — decoupled from URL so typing doesn't cause remount
  const [organizerInput, setOrganizerInput] = useState(urlOrganizer);

  // Sync input if URL param changes externally (e.g. back/forward)
  useEffect(() => {
    setOrganizerInput(urlOrganizer);
  }, [urlOrganizer]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v) params.set(k, v);
        else params.delete(k);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

  const toggleGradYear = (year: number) => {
    const current = getParamArray("grad_year");
    const next = current.includes(year)
      ? current.filter((y) => y !== year)
      : [...current, year];
    updateParams({ grad_year: next.join(",") });
  };

  const submitOrganizer = () => updateParams({ organizer: organizerInput });

  const filterContentProps: FilterContentProps = {
    selectedType,
    selectedIndustry,
    selectedGradYears,
    selectedSort,
    organizerInput,
    onOrganizerChange: setOrganizerInput,
    onOrganizerSubmit: submitOrganizer,
    onTypeChange: (v) => updateParams({ type: v }),
    onIndustryChange: (v) => updateParams({ industry: v }),
    onGradYearToggle: toggleGradYear,
    onSortChange: (v) => updateParams({ sort: v }),
  };

  const hasActiveFilters = !!(selectedType || selectedIndustry || selectedGradYears.length || urlOrganizer);

  return (
    <>
      {/* Desktop filter bar */}
      <div className="hidden md:block sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 py-3 px-6">
        <FilterContent {...filterContentProps} />
      </div>

      {/* Mobile filter bar */}
      <div className="md:hidden sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3">
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex items-center gap-2 text-sm text-[#6B7280] border border-gray-200 rounded-lg px-4 py-2 w-full justify-between"
        >
          <span className="inline-flex items-center gap-1.5">
            <SlidersHorizontal size={13} />
            Filters{hasActiveFilters ? " •" : ""}
          </span>
          {drawerOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {drawerOpen && (
          <div className="pt-4 pb-2">
            <FilterContent {...filterContentProps} />
          </div>
        )}
      </div>
    </>
  );
}
