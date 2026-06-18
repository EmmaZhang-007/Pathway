import { getSupabase, Opportunity } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getOpportunity(id: string): Promise<Opportunity | null> {
  const { data } = await getSupabase()
    .from("opportunities")
    .select("*")
    .eq("id", id)
    .eq("is_verified", true)
    .single();
  return data as Opportunity | null;
}

export default async function OpportunityPage({ params }: { params: { id: string } }) {
  const opp = await getOpportunity(params.id);
  if (!opp) notFound();

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6B7280] transition-colors mb-8"
      >
        ← Back to listings
      </Link>

      <article
        className="bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 p-8"
        style={{ borderLeftColor: TYPE_BORDER[opp.type] ?? "#00B5B8" }}
      >
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_BADGE[opp.type] ?? ""}`}>
            {TYPE_LABELS[opp.type] ?? opp.type}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 capitalize">
            {opp.industry}
          </span>
          {opp.is_paid && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
              Paid
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-1">{opp.title}</h1>
        <p className="text-[#6B7280] text-base mb-6">{opp.organizer}</p>

        {/* CTA */}
        <a
          href={opp.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#00B5B8] hover:bg-[#009A9D] text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-8"
        >
          Register Now →
        </a>

        {/* Metadata grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 p-4 bg-[#F5F5F5] rounded-xl border border-gray-100">
          {opp.location && (
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium mb-0.5">Location</p>
              <p className="text-[#6B7280] text-sm">{opp.location}</p>
            </div>
          )}
          {opp.date_start && (
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium mb-0.5">Date</p>
              <p className="text-[#6B7280] text-sm">
                {formatDate(opp.date_start)}
                {opp.date_end && opp.date_end !== opp.date_start && (
                  <> — {formatDate(opp.date_end)}</>
                )}
              </p>
            </div>
          )}
          {opp.deadline && (
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium mb-0.5">Application Deadline</p>
              <p className="text-[#6B7280] text-sm">{formatDate(opp.deadline)}</p>
            </div>
          )}
          {opp.grad_year?.length > 0 && (
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide font-medium mb-0.5">Graduating Classes</p>
              <p className="text-[#6B7280] text-sm">{opp.grad_year.join(", ")}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {opp.description && (
          <div>
            <h2 className="text-sm text-[#9CA3AF] uppercase tracking-wide font-medium mb-3">About</h2>
            <p className="text-[#6B7280] leading-relaxed whitespace-pre-wrap">{opp.description}</p>
          </div>
        )}
      </article>
    </main>
  );
}
