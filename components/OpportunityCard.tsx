"use client";

import Link from "next/link";
import { Trophy, CalendarDays, Zap, MapPin, Calendar, GraduationCap, AlertCircle } from "lucide-react";
import { Opportunity } from "@/lib/supabase";

const TYPE_LABELS: Record<string, string> = {
  conference: "Conference",
  event: "Event",
  case_comp: "Case Competition",
};

const TYPE_BADGE: Record<string, string> = {
  conference: "bg-[#E0F7F7] text-[#007A7C] border border-[#B2EBEC]",
  event: "bg-[#F0E8FF] text-[#5B1FA0] border border-[#D8C4F5]",
  case_comp: "bg-[#FFE0F0] text-[#A30058] border border-[#F9B3D5]",
};

const TYPE_BORDER: Record<string, string> = {
  conference: "#00B5B8",
  event: "#7B2FBE",
  case_comp: "#E8007D",
};

const TYPE_ICON = {
  conference: CalendarDays,
  event: Zap,
  case_comp: Trophy,
} as const;

const INDUSTRY_BADGE: Record<string, string> = {
  finance: "bg-blue-50 text-blue-700 border border-blue-100",
  consulting: "bg-amber-50 text-amber-700 border border-amber-100",
  both: "bg-indigo-50 text-indigo-700 border border-indigo-100",
  other: "bg-gray-50 text-gray-600 border border-gray-200",
};

function formatDate(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  const days = daysUntil(opp.deadline);
  const deadlineUrgent = days !== null && days <= 7 && days >= 0;
  const deadlinePassed = days !== null && days < 0;
  const TypeIcon = TYPE_ICON[opp.type as keyof typeof TYPE_ICON] ?? CalendarDays;

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
      style={{ borderLeftColor: TYPE_BORDER[opp.type] ?? "#00B5B8" }}
    >
      <div className="flex flex-wrap gap-1.5">
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[opp.type] ?? TYPE_BADGE.conference}`}>
          <TypeIcon size={10} />
          {TYPE_LABELS[opp.type] ?? opp.type}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INDUSTRY_BADGE[opp.industry] ?? INDUSTRY_BADGE.other}`}>
          {opp.industry.charAt(0).toUpperCase() + opp.industry.slice(1)}
        </span>
        {opp.is_paid && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
            Paid
          </span>
        )}
      </div>

      <div>
        <Link href={`/opportunity/${opp.id}`}>
          <h3 className="text-[#1A1A1A] font-semibold text-base leading-snug hover:text-[#00B5B8] transition-colors cursor-pointer">
            {opp.title}
          </h3>
        </Link>
        <p className="text-[#6B7280] text-sm mt-0.5">{opp.organizer}</p>
      </div>

      {opp.description && (
        <p className="text-[#6B7280] text-sm line-clamp-2">{opp.description}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#9CA3AF]">
        {opp.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} />
            {opp.location}
          </span>
        )}
        {opp.date_start && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {formatDate(opp.date_start)}{opp.date_end && opp.date_end !== opp.date_start ? ` – ${formatDate(opp.date_end)}` : ""}
          </span>
        )}
        {opp.grad_year?.length > 0 && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap size={11} />
            {opp.grad_year.map(y => `'${String(y).slice(2)}`).join(", ")}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <div className="text-xs">
          {opp.deadline ? (
            deadlinePassed ? (
              <span className="text-[#9CA3AF]">Deadline passed</span>
            ) : deadlineUrgent ? (
              <span className="inline-flex items-center gap-1 text-[#E8007D] font-medium">
                <AlertCircle size={11} />
                {days === 0 ? "Due today" : `${days}d left`}
              </span>
            ) : (
              <span className="text-[#6B7280]">Deadline: {formatDate(opp.deadline)}</span>
            )
          ) : (
            <span className="text-[#9CA3AF]">No deadline listed</span>
          )}
        </div>
        <a
          href={opp.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#00B5B8] hover:bg-[#009A9D] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          Register →
        </a>
      </div>
    </div>
  );
}
