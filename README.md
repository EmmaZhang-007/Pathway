# Pathways — Student Opportunity Hub

A curated hub for Toronto-area students to discover conferences, case competitions, and events. Built with Next.js 14 (App Router), Tailwind CSS, and Supabase.

---

## Features

- **Filterable listings** — filter by type, industry, graduating class, and organizer; all state lives in URL params so links are shareable
- **Infinite scroll** — paginated client-side fetching from Supabase
- **Detail pages** — full metadata and a prominent registration CTA per opportunity
- **Admin dashboard** — password-gated page to add, approve, and delete opportunities
- **Mobile responsive** — filter bar collapses to a slide-down drawer on small screens

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local` (or edit `.env.local` directly) and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=choose-a-strong-password
EVENTBRITE_API_KEY=your-eventbrite-key
```

> `NEXT_PUBLIC_*` vars are exposed to the browser. `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` are server-only and never sent to the client.

### 3. Database schema

The Supabase project must have an `opportunities` table with this schema:

```sql
create table opportunities (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  organizer        text,
  type             text check (type in ('conference', 'event', 'case_comp')),
  industry         text check (industry in ('finance', 'consulting', 'both', 'other')),
  grad_year        int[],
  location         text,
  date_start       date,
  date_end         date,
  deadline         date,
  description      text,
  registration_url text not null,
  is_paid          boolean default false,
  is_verified      boolean default false,
  created_at       timestamptz default now(),
  source_url       text
);
```

Public pages only query `is_verified = true` rows. Newly added opportunities default to `is_verified = false` and must be approved in the admin dashboard.

### 4. Run locally

```bash
npm run dev
```

Opens at [http://localhost:3001](http://localhost:3001).

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, filter bar, opportunity grid |
| `/opportunity/[id]` | Detail page for a single opportunity |
| `/admin` | Password-gated admin dashboard |

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create pathways --public --push
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **Import Git Repository**.
2. Select the `pathways` repo.
3. Vercel auto-detects Next.js — leave all build settings at defaults.

### 3. Add environment variables

In **Settings → Environment Variables**, add all five variables from `.env.example`:

| Variable | Where to find it | Expose to |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **Server only** |
| `ADMIN_PASSWORD` | Your choice | **Server only** |
| `EVENTBRITE_API_KEY` | Eventbrite Developer portal | Server only |

> **Important:** `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` must be scoped to **Production** and **Preview** environments only — never exposed to the browser.

### 4. Deploy

Click **Deploy**. Subsequent pushes to `main` redeploy automatically.

### 5. Configure Supabase allowed origins

In Supabase → Settings → API → CORS, add your Vercel URL (e.g. `https://pathways.vercel.app`) to the allowed origins list.

---

## Project Structure

```
pathways/
├── app/
│   ├── page.tsx                        # Homepage
│   ├── layout.tsx                      # Root layout (Inter font, metadata)
│   ├── globals.css                     # Tailwind + CSS variables
│   ├── admin/page.tsx                  # Admin dashboard
│   ├── opportunity/[id]/page.tsx       # Detail page
│   └── api/admin/
│       ├── auth/route.ts               # POST — validate admin password
│       └── opportunities/
│           ├── route.ts                # GET unverified, POST new
│           └── [id]/route.ts           # PATCH (approve), DELETE
├── components/
│   ├── FilterBar.tsx                   # Sticky filter bar + mobile drawer
│   ├── HomeContent.tsx                 # Reads search params, passes to grid
│   ├── OpportunityCard.tsx             # Card UI
│   └── OpportunityGrid.tsx             # Infinite-scroll grid with Supabase queries
└── lib/
    └── supabase.ts                     # Typed client + service client
```
