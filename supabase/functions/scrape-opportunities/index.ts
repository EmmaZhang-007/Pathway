// Supabase Edge Function — scrape-opportunities
// Runtime: Deno (deployed via `supabase functions deploy scrape-opportunities`)
//
// Invoke:
//   curl -X POST https://<project>.supabase.co/functions/v1/scrape-opportunities \
//     -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
//     -H "Content-Type: application/json"
//
// Or schedule with pg_cron / Supabase Cron (see README).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVENTBRITE_API_KEY = Deno.env.get("EVENTBRITE_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Types ─────────────────────────────────────────────────────────────────────

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
  if (/case\s*comp|case\s*competition|\bchallenge\b|\bcup\b|\binvitational\b/.test(t)) return "case_comp";
  if (/\bconference\b|\bsummit\b|\bforum\b|\bsymposium\b/.test(t)) return "conference";
  return "event";
}

function classifyIndustry(text: string): "finance" | "consulting" | "both" | "other" {
  const t = text.toLowerCase();
  const fin = /\bbank|capital\s+market|investment\s*bank|trading|equity|financial|wealth|\brbc\b|\btd\b|\bbmo\b|\bcibc\b|scotiabank|mastercard|capital\s*one|\bmnp\b/.test(t);
  const con = /consult|advisory|strategy|mckinsey|bcg|bain|\bdeloitte\b|\bkpmg\b|\bpwc\b|\bey\b|management\s+consult|accenture|oliver\s*wyman/.test(t);
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
  } catch { return null; }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Eventbrite ────────────────────────────────────────────────────────────────

async function scrapeEventbrite(apiKey: string): Promise<{ records: Scraped[]; errors: string[] }> {
  const errors: string[] = [];
  const records: Scraped[] = [];

  for (const page of [1, 2]) {
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

      const resp = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${params}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (resp.status === 401) { errors.push("Eventbrite: invalid API key"); break; }
      if (!resp.ok) { errors.push(`Eventbrite: HTTP ${resp.status}`); break; }

      // deno-lint-ignore no-explicit-any
      const data: any = await resp.json();
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
          organizer: (ev.organizer as Record<string, string>)?.name ?? "Unknown",
          type: classifyType(combined),
          industry: classifyIndustry(combined),
          grad_year: [2027, 2028, 2029, 2030],
          location: addr ? `${addr.city ?? "Toronto"}, ${addr.region ?? "ON"}` : "Toronto, ON",
          date_start: parseIsoDate((ev.start as Record<string, string>)?.local),
          date_end: parseIsoDate((ev.end as Record<string, string>)?.local),
          deadline: null,
          description: desc.slice(0, 600),
          registration_url: url,
          is_paid: !(ev.is_free as boolean),
          is_verified: false,
          source_url: url,
        });
      }

      if (events.length < 50) break;
      await delay(1000);
    } catch (e: unknown) {
      errors.push(`Eventbrite page ${page}: ${e instanceof Error ? e.message : String(e)}`);
      break;
    }
  }

  return { records, errors };
}

// ── Conference Alerts ─────────────────────────────────────────────────────────

async function scrapeConferenceAlerts(): Promise<{ records: Scraped[]; errors: string[] }> {
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
          "User-Agent": "Mozilla/5.0 (compatible; PathwaysBot/1.0; +https://pathways.app)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();

      const linkRe = /<a\s+href="(\/conf\/[^"]+)"[^>]*>\s*([^<]{10,150})\s*<\/a>/gi;
      let m: RegExpExecArray | null;

      while ((m = linkRe.exec(html)) !== null) {
        const href = m[1];
        const title = m[2].replace(/&amp;/g, "&").replace(/&[a-z]+;/gi, "").trim();
        if (!title || title.length < 8) continue;

        const start = Math.max(0, m.index - 200);
        const end = Math.min(html.length, m.index + 500);
        const ctx = html.slice(start, end);
        if (!/toronto|ontario/i.test(ctx)) continue;

        const dateRe = /(\d{1,2})\s*[-–]\s*\d{1,2}\s+(\w+)\s+(\d{4})|(\d{1,2})\s+(\w+)\s+(\d{4})/;
        const dm = ctx.replace(/&nbsp;/g, " ").match(dateRe);
        let dateStart: string | null = null;
        if (dm) {
          const raw = dm[0].replace(/\d+\s*[-–]\s*\d+\s+/, "").trim();
          const d = new Date(raw);
          if (!isNaN(d.getTime())) dateStart = d.toISOString().slice(0, 10);
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
      errors.push(`Conference Alerts (${url}): ${e instanceof Error ? e.message : String(e)}`);
    }
    await delay(1000);
  }

  return { records, errors };
}

// ── Career pages (best-effort; most SPAs) ─────────────────────────────────────

const CAREER_SOURCES = [
  { url: "https://www.rbc.com/careers/students.html", organizer: "RBC", industry: "finance" as const },
  { url: "https://www.td.com/ca/en/about-td/for-students", organizer: "TD Bank", industry: "finance" as const },
  { url: "https://www2.deloitte.com/ca/en/pages/careers/articles/campus-recruiting.html", organizer: "Deloitte", industry: "consulting" as const },
  { url: "https://www.ey.com/en_ca/careers/students", organizer: "EY", industry: "consulting" as const },
  { url: "https://home.kpmg/ca/en/home/careers/students-and-graduates.html", organizer: "KPMG", industry: "consulting" as const },
  { url: "https://www.pwc.com/ca/en/careers/campus.html", organizer: "PwC", industry: "consulting" as const },
];

const EVENT_PATTERN_RE = /(?:info\s+session|networking\s+(?:event|night|reception)|open\s+house|campus\s+(?:event|day)|workshop|case\s+comp(?:etition)?|conference|summit|panel|recruiting)[^<]{0,200}/gi;
const DATE_RE = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+20(?:26|27|28)/gi;

async function scrapeCareerPage(source: { url: string; organizer: string; industry: "finance" | "consulting" }): Promise<{ records: Scraped[]; errors: string[] }> {
  const errors: string[] = [];
  const records: Scraped[] = [];

  try {
    const resp = await fetch(source.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    const stripped = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

    const dates: string[] = [];
    for (const dm of stripped.matchAll(DATE_RE)) {
      const d = parseIsoDate(dm[0]);
      if (d) dates.push(d);
    }

    const snippets = new Set<string>();
    for (const em of stripped.matchAll(EVENT_PATTERN_RE)) {
      const clean = em[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (clean.length > 15 && clean.length < 200) snippets.add(clean);
    }

    if (snippets.size === 0) {
      errors.push(`${source.organizer}: no event listings found (likely JS-rendered)`);
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
    errors.push(`${source.organizer}: ${e instanceof Error ? e.message : String(e)}`);
  }

  return { records, errors };
}

// ── Main serve handler ────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  const runAt = new Date().toISOString();
  let allRecords: Scraped[] = [];
  const allErrors: string[] = [];

  // 1. Eventbrite
  if (EVENTBRITE_API_KEY) {
    const { records, errors } = await scrapeEventbrite(EVENTBRITE_API_KEY);
    allRecords.push(...records);
    allErrors.push(...errors);
  } else {
    allErrors.push("Eventbrite: EVENTBRITE_API_KEY not set");
  }
  await delay(1000);

  // 2. Conference Alerts
  const ca = await scrapeConferenceAlerts();
  allRecords.push(...ca.records);
  allErrors.push(...ca.errors);
  await delay(1000);

  // 3. Career pages
  for (const source of CAREER_SOURCES) {
    const r = await scrapeCareerPage(source);
    allRecords.push(...r.records);
    allErrors.push(...r.errors);
    await delay(1000);
  }

  // Filter: must have title and registration_url
  const newRecords = allRecords.filter((r) => r.title?.trim() && r.registration_url?.trim());
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

  await supabase.from("ingestion_logs").insert({
    run_at: runAt,
    source: "scrape-opportunities",
    records_added: inserted,
    errors: allErrors.length > 0 ? allErrors.join("\n") : null,
  });

  return new Response(
    JSON.stringify({ added: inserted, errors: allErrors }),
    { headers: { "Content-Type": "application/json" } }
  );
});
