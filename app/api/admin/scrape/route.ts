import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// ── Types ────────────────────────────────────────────────────────────────────

interface Scraped {
  title: string;
  organizer: string;
  type: "conference" | "event" | "case_comp";
  industry: "finance" | "consulting" | "both" | "other";
  grad_year: number[];
  location: string;
  date_start: string | null;
  date_end: string | null;
  deadline: string | null;
  description: string;
  registration_url: string;
  is_paid: boolean;
  is_verified: false;
  source_url: string | null;
}

// ── Classifiers ───────────────────────────────────────────────────────────────

function classifyType(text: string): "conference" | "event" | "case_comp" {
  const t = text.toLowerCase();
  if (/case\s*comp|case\s*competition|\bchallenge\b|\bcup\b|\binvitational\b/.test(t))
    return "case_comp";
  if (/\bconference\b|\bsummit\b|\bforum\b|\bsymposium\b/.test(t))
    return "conference";
  return "event";
}

function classifyIndustry(
  text: string
): "finance" | "consulting" | "both" | "other" {
  const t = text.toLowerCase();
  const fin =
    /\bbank|capital\s+market|investment\s*bank|trading|equity|fixed\s*income|financial|wealth|\brbc\b|\btd\b|\bbmo\b|\bcibc\b|scotiabank|mastercard|capital\s*one|\bmnp\b/.test(
      t
    );
  const con =
    /consult|advisory|strategy|mckinsey|bcg|bain|\bdeloitte\b|ernst\s*&?\s*young|\bkpmg\b|\bpwc\b|\bey\b|management\s+consult|accenture|oliver\s*wyman|l\.e\.k/.test(
      t
    );
  if (fin && con) return "both";
  if (fin) return "finance";
  if (con) return "consulting";
  return "other";
}

function parseIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Eventbrite ────────────────────────────────────────────────────────────────

async function scrapeEventbrite(
  apiKey: string
): Promise<{ records: Scraped[]; errors: string[] }> {
  const errors: string[] = [];
  const records: Scraped[] = [];

  const pages = [1, 2]; // fetch up to 2 pages
  for (const page of pages) {
    try {
      const params = new URLSearchParams({
        q: "finance business consulting student networking Toronto",
        "location.address": "Toronto, Ontario, Canada",
        "location.within": "25km",
        categories: "102,105",
        expand: "venue,organizer",
        "start_date.keyword": "next_90_days",
        page_size: "50",
        page: String(page),
      });

      const resp = await fetch(
        `https://www.eventbriteapi.com/v3/events/search/?${params}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15000),
        }
      );

      if (resp.status === 401) {
        errors.push("Eventbrite: invalid API key");
        break;
      }
      if (!resp.ok) {
        errors.push(`Eventbrite: HTTP ${resp.status}`);
        break;
      }

      const data = await resp.json();
      const events: unknown[] = data.events ?? [];
      if (events.length === 0) break;

      for (const ev of events as Record<string, unknown>[]) {
        const url = ev.url as string | undefined;
        if (!url) continue;
        const title = ((ev.name as Record<string, string>)?.text ?? "").trim();
        if (!title) continue;

        const desc = (ev.description as Record<string, string>)?.text ?? "";
        const combined = `${title} ${desc}`;
        const venue = ev.venue as Record<string, unknown> | undefined;
        const addr = venue?.address as Record<string, string> | undefined;

        records.push({
          title,
          organizer:
            (ev.organizer as Record<string, string>)?.name ?? "Unknown",
          type: classifyType(combined),
          industry: classifyIndustry(combined),
          grad_year: [2027, 2028, 2029, 2030],
          location: addr
            ? `${addr.city ?? "Toronto"}, ${addr.region ?? "ON"}`
            : "Toronto, ON",
          date_start: parseIsoDate(
            (ev.start as Record<string, string>)?.local
          ),
          date_end: parseIsoDate((ev.end as Record<string, string>)?.local),
          deadline: null,
          description: desc.slice(0, 600),
          registration_url: url,
          is_paid: !(ev.is_free as boolean),
          is_verified: false,
          source_url: url,
        });
      }

      // If we got a full page, there may be more — else stop
      if (events.length < 50) break;
      await delay(1000);
    } catch (e: unknown) {
      errors.push(
        `Eventbrite page ${page}: ${e instanceof Error ? e.message : String(e)}`
      );
      break;
    }
  }

  return { records, errors };
}

// ── Conference Alerts ─────────────────────────────────────────────────────────

async function scrapeConferenceAlerts(): Promise<{
  records: Scraped[];
  errors: string[];
}> {
  const errors: string[] = [];
  const records: Scraped[] = [];
  const BASE = "https://conferencealerts.co.in";

  const urls = [
    `${BASE}/topic-listing?topic=Banking+and+Finance&country=CA`,
    `${BASE}/topic-listing?topic=Business+and+Management&country=CA`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; PathwaysBot/1.0; +https://pathways.app)",
          Accept: "text/html,application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      // Conference Alerts renders a table; each row has a link, date, and location
      // Pattern: <a href="/conf/NNNNN">Event Title</a>
      const linkRe =
        /<a\s+href="(\/conf\/[^"]+)"[^>]*>\s*([^<]{10,150})\s*<\/a>/gi;
      let m: RegExpExecArray | null;

      while ((m = linkRe.exec(html)) !== null) {
        const href = m[1];
        const title = m[2]
          .replace(/&amp;/g, "&")
          .replace(/&[a-z]+;/gi, "")
          .trim();
        if (!title || title.length < 8) continue;

        // Look for Toronto/Ontario in surrounding text (±500 chars)
        const start = Math.max(0, m.index - 200);
        const end = Math.min(html.length, m.index + 500);
        const ctx = html.slice(start, end);
        if (!/toronto|ontario/i.test(ctx)) continue;

        // Extract date from context
        const dateRe =
          /(\d{1,2})\s*[-–]\s*\d{1,2}\s+(\w+)\s+(\d{4})|(\d{1,2})\s+(\w+)\s+(\d{4})/;
        const dm = ctx.replace(/&nbsp;/g, " ").match(dateRe);
        let dateStart: string | null = null;
        if (dm) {
          const raw = dm[0].replace(/\d+\s*[-–]\s*\d+\s+/, "").trim();
          try {
            const d = new Date(raw);
            if (!isNaN(d.getTime()))
              dateStart = d.toISOString().slice(0, 10);
          } catch {}
        }

        const fullHref = `${BASE}${href}`;
        records.push({
          title,
          organizer: "Conference Alerts",
          type: classifyType(title),
          industry: classifyIndustry(title),
          grad_year: [2027, 2028, 2029, 2030],
          location: "Toronto, ON",
          date_start: dateStart,
          date_end: null,
          deadline: null,
          description: "",
          registration_url: fullHref,
          is_paid: false,
          is_verified: false,
          source_url: fullHref,
        });

        if (records.length >= 30) break;
      }
    } catch (e: unknown) {
      errors.push(
        `Conference Alerts (${url}): ${e instanceof Error ? e.message : String(e)}`
      );
    }
    await delay(1000);
  }

  return { records, errors };
}

// ── Career page scrapers ──────────────────────────────────────────────────────

const CAREER_SOURCES = [
  {
    url: "https://www.rbc.com/careers/students.html",
    organizer: "RBC",
    industry: "finance" as const,
  },
  {
    url: "https://www.td.com/ca/en/about-td/for-students",
    organizer: "TD Bank",
    industry: "finance" as const,
  },
  {
    url: "https://www2.deloitte.com/ca/en/pages/careers/articles/campus-recruiting.html",
    organizer: "Deloitte",
    industry: "consulting" as const,
  },
  {
    url: "https://www.ey.com/en_ca/careers/students",
    organizer: "EY",
    industry: "consulting" as const,
  },
  {
    url: "https://home.kpmg/ca/en/home/careers/students-and-graduates.html",
    organizer: "KPMG",
    industry: "consulting" as const,
  },
  {
    url: "https://www.pwc.com/ca/en/careers/campus.html",
    organizer: "PwC",
    industry: "consulting" as const,
  },
];

// Matches text like "September 15, 2026" or "Sep 15, 2026" or "15 September 2026"
const DATE_RE =
  /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20(?:26|27|28)|\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+20(?:26|27|28)/gi;

// Matches phrases that look like event titles/descriptions in static HTML
const EVENT_PATTERN_RE =
  /(?:info\s+session|networking\s+(?:event|night|reception)|open\s+house|campus\s+(?:event|day|visit)|workshop|case\s+comp(?:etition)?|conference|summit|panel|hiring\s+event|recruiting)[^<]{0,200}/gi;

async function scrapeCareerPage(source: {
  url: string;
  organizer: string;
  industry: "finance" | "consulting";
}): Promise<{ records: Scraped[]; errors: string[] }> {
  const errors: string[] = [];
  const records: Scraped[] = [];

  try {
    const resp = await fetch(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    // Strip script/style blocks before scanning
    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    // Collect dates found on page
    const dates: string[] = [];
    const dateReCopy = new RegExp(DATE_RE.source, "gi");
    let dateM: RegExpExecArray | null;
    while ((dateM = dateReCopy.exec(stripped)) !== null) {
      const d = parseIsoDate(dateM[0]);
      if (d) dates.push(d);
    }

    // Collect event snippets
    const snippets: string[] = [];
    const seen = new Set<string>();
    const evReCopy = new RegExp(EVENT_PATTERN_RE.source, "gi");
    let evM: RegExpExecArray | null;
    while ((evM = evReCopy.exec(stripped)) !== null) {
      const clean = evM[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (clean.length > 15 && clean.length < 200 && !seen.has(clean)) {
        seen.add(clean);
        snippets.push(clean);
      }
    }

    if (snippets.length === 0) {
      // Most corporate career sites are JS-rendered SPAs — static fetch yields empty shell
      errors.push(
        `${source.organizer}: no event listings found (page likely JS-rendered)`
      );
      return { records, errors };
    }

    let i = 0;
    for (const snippet of snippets) {
      if (records.length >= 3) break;
      records.push({
        title: `${source.organizer} — ${snippet.slice(0, 80).trim()}`,
        organizer: source.organizer,
        type: classifyType(snippet),
        industry: source.industry,
        grad_year: [2027, 2028, 2029, 2030],
        location: "Toronto, ON",
        date_start: dates[i] ?? null,
        date_end: null,
        deadline: null,
        description: snippet,
        registration_url: source.url,
        is_paid: false,
        is_verified: false,
        source_url: null,
      });
      i++;
    }
  } catch (e: unknown) {
    errors.push(
      `${source.organizer}: ${e instanceof Error ? e.message : String(e)}`
    );
  }

  return { records, errors };
}

// ── Main handler ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const runAt = new Date().toISOString();
  let allRecords: Scraped[] = [];
  const allErrors: string[] = [];

  // 1. Eventbrite
  const ebKey = process.env.EVENTBRITE_API_KEY;
  if (ebKey) {
    const { records, errors } = await scrapeEventbrite(ebKey);
    allRecords.push(...records);
    allErrors.push(...errors);
  } else {
    allErrors.push("Eventbrite: EVENTBRITE_API_KEY not configured");
  }
  await delay(1000);

  // 2. Conference Alerts
  const ca = await scrapeConferenceAlerts();
  allRecords.push(...ca.records);
  allErrors.push(...ca.errors);
  await delay(1000);

  // 3. Career pages (best-effort; most are JS-rendered)
  for (const source of CAREER_SOURCES) {
    const result = await scrapeCareerPage(source);
    allRecords.push(...result.records);
    allErrors.push(...result.errors);
    await delay(1000);
  }

  // Filter: must have title and registration_url
  const newRecords = allRecords.filter(
    (r) => r.title?.trim() && r.registration_url?.trim()
  );

  let inserted = 0;
  if (newRecords.length > 0) {
    const { data, error } = await supabase
      .from("opportunities")
      .insert(newRecords)
      .select("id");
    if (error) {
      allErrors.push(`Insert failed: ${error.message}`);
    } else {
      inserted = data?.length ?? 0;
    }
  }

  // Log run to ingestion_logs
  await supabase.from("ingestion_logs").insert({
    run_at: runAt,
    source: "scrape-opportunities",
    records_added: inserted,
    errors: allErrors.length > 0 ? allErrors.join("\n") : null,
  });

  return NextResponse.json({ added: inserted, errors: allErrors });
}
