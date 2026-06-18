"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, ClipboardList, Check } from "lucide-react";
import { Opportunity } from "@/lib/supabase";

// ── Shared field components ───────────────────────────────────────────────────

const FL = "block text-[10px] text-[#6B7280] uppercase tracking-widest font-medium mb-1";
const FI =
  "w-full bg-white border border-gray-200 text-[#1A1A1A] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00B5B8] transition-colors placeholder:text-[#9CA3AF]";

const GRAD_YEAR_OPTIONS = [2027, 2028, 2029, 2030];

function GradYearPills({
  value,
  onChange,
}: {
  value: number[];
  onChange: (v: number[]) => void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {GRAD_YEAR_OPTIONS.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() =>
            onChange(
              value.includes(y) ? value.filter((v) => v !== y) : [...value, y]
            )
          }
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
            value.includes(y)
              ? "bg-[#7B2FBE] text-white"
              : "bg-white text-[#6B7280] border border-gray-200"
          }`}
        >
          &apos;{String(y).slice(2)}
        </button>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface IngestionLog {
  id: string;
  run_at: string;
  source: string;
  records_added: number;
  errors: string | null;
}

type Tab = "pending" | "add" | "logs";

// ── AdminGate ─────────────────────────────────────────────────────────────────

function AdminGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      onAuth(password);
    } else {
      setError("Incorrect password.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Admin Access</h1>
        <p className="text-[#6B7280] text-sm mb-6">
          Enter your admin password to continue.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={FI}
            autoFocus
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#00B5B8] hover:bg-[#009A9D] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Inline edit form (row expansion) ─────────────────────────────────────────

function EditRow({
  opp,
  onSave,
  onCancel,
}: {
  opp: Opportunity;
  onSave: (updated: Partial<Opportunity>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: opp.title ?? "",
    organizer: opp.organizer ?? "",
    type: opp.type ?? "event",
    industry: opp.industry ?? "other",
    location: opp.location ?? "",
    date_start: opp.date_start ?? "",
    date_end: opp.date_end ?? "",
    deadline: opp.deadline ?? "",
    description: opp.description ?? "",
    registration_url: opp.registration_url ?? "",
    is_paid: opp.is_paid ?? false,
    grad_year: opp.grad_year ?? [],
    source_url: opp.source_url ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <tr>
      <td
        colSpan={6}
        className="py-4 px-2 bg-[#F5F5F5] border-b border-gray-100"
      >
        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div className="lg:col-span-3">
            <label className={FL}>Title *</label>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className={FI}
            />
          </div>
          <div>
            <label className={FL}>Organizer *</label>
            <input
              required
              value={form.organizer}
              onChange={(e) => set("organizer", e.target.value)}
              className={FI}
            />
          </div>
          <div>
            <label className={FL}>Type</label>
            <select
              value={form.type}
              onChange={(e) =>
                set("type", e.target.value as typeof form.type)
              }
              className={FI}
            >
              <option value="conference">Conference</option>
              <option value="event">Event</option>
              <option value="case_comp">Case Competition</option>
            </select>
          </div>
          <div>
            <label className={FL}>Industry</label>
            <select
              value={form.industry}
              onChange={(e) =>
                set("industry", e.target.value as typeof form.industry)
              }
              className={FI}
            >
              <option value="finance">Finance</option>
              <option value="consulting">Consulting</option>
              <option value="both">Both</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={FL}>Registration URL *</label>
            <input
              required
              type="text"
              pattern="https?://.+"
              title="Must start with http:// or https://"
              value={form.registration_url}
              onChange={(e) => set("registration_url", e.target.value)}
              className={FI}
              placeholder="https://…"
            />
          </div>
          <div>
            <label className={FL}>Location</label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className={FI}
              placeholder="Toronto, ON"
            />
          </div>
          <div>
            <label className={FL}>Start Date</label>
            <input
              type="date"
              value={form.date_start}
              onChange={(e) => set("date_start", e.target.value)}
              className={FI}
            />
          </div>
          <div>
            <label className={FL}>End Date</label>
            <input
              type="date"
              value={form.date_end}
              onChange={(e) => set("date_end", e.target.value)}
              className={FI}
            />
          </div>
          <div>
            <label className={FL}>Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
              className={FI}
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              checked={form.is_paid}
              onChange={(e) => set("is_paid", e.target.checked)}
              className="w-4 h-4 accent-[#00B5B8]"
            />
            <span className="text-sm text-[#6B7280]">Paid opportunity</span>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={FL}>Grad Years</label>
            <GradYearPills
              value={form.grad_year}
              onChange={(v) => set("grad_year", v)}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={FL}>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={`${FI} resize-none`}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className={FL}>Source URL</label>
            <input
              type="text"
              value={form.source_url}
              onChange={(e) => set("source_url", e.target.value)}
              className={FI}
              placeholder="https://…"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#00B5B8] hover:bg-[#009A9D] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-[#6B7280] border border-gray-200 hover:border-[#00B5B8] px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

// ── Pending Review tab ────────────────────────────────────────────────────────

function PendingReview({ password }: { password: string }) {
  const [unverified, setUnverified] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<{
    added: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const loadUnverified = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/opportunities");
    if (res.ok) setUnverified(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUnverified();
  }, [loadUnverified]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/admin/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_verified: true }),
    });
    setUnverified((prev) => prev.filter((o) => o.id !== id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" });
    setUnverified((prev) => prev.filter((o) => o.id !== id));
  };

  const handleSaveEdit = async (id: string, updated: Partial<Opportunity>) => {
    const res = await fetch(`/api/admin/opportunities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      setUnverified((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...updated } : o))
      );
      setEditingId(null);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeResult(null);
    const res = await fetch("/api/admin/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    setScrapeResult(data);
    setScraping(false);
    if (data.added > 0) loadUnverified();
  };

  return (
    <div>
      {/* Scraper controls */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-[#6B7280]">
          {unverified.length} record{unverified.length !== 1 ? "s" : ""} pending
          review
        </p>
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-[#00B5B8] disabled:opacity-50 text-[#6B7280] text-xs font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {scraping ? (
            <>
              <span className="w-3 h-3 border border-[#00B5B8] border-t-transparent rounded-full animate-spin" />
              Scraping…
            </>
          ) : (
            <>↓ Run Scraper</>
          )}
        </button>
      </div>

      {/* Scrape result banner */}
      {scrapeResult && (
        <div
          className={`rounded-xl border px-4 py-3 mb-6 text-sm ${
            scrapeResult.errors.length === 0 || scrapeResult.added > 0
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-amber-50 border-amber-200 text-amber-700"
          }`}
        >
          <p className="font-medium mb-1">
            Scrape complete — {scrapeResult.added} new record
            {scrapeResult.added !== 1 ? "s" : ""} added
            {scrapeResult.skipped > 0
              ? `, ${scrapeResult.skipped} duplicate${scrapeResult.skipped !== 1 ? "s" : ""} skipped`
              : ""}
          </p>
          {scrapeResult.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs opacity-70">
                {scrapeResult.errors.length} source error
                {scrapeResult.errors.length !== 1 ? "s" : ""}
              </summary>
              <ul className="mt-1 text-xs space-y-0.5 opacity-70">
                {scrapeResult.errors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-[#00B5B8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : unverified.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 size={36} className="text-[#00B5B8] mx-auto mb-3" />
          <p className="text-[#1A1A1A] font-medium">No pending records.</p>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Run the scraper or add an opportunity manually.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-[#9CA3AF] uppercase tracking-widest bg-[#F5F5F5]">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Organizer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unverified.map((opp) =>
                editingId === opp.id ? (
                  <EditRow
                    key={opp.id}
                    opp={opp}
                    onSave={(updated) => handleSaveEdit(opp.id, updated)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <tr
                    key={opp.id}
                    className="border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium max-w-[220px]">
                      <span className="line-clamp-2">{opp.title}</span>
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">
                      {opp.organizer}
                    </td>
                    <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap capitalize">
                      {opp.type?.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3 text-[#9CA3AF] whitespace-nowrap text-xs">
                      {opp.date_start ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[140px]">
                      {opp.source_url ? (
                        <a
                          href={opp.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00B5B8] hover:underline line-clamp-1 block"
                        >
                          {new URL(opp.source_url).hostname.replace("www.", "")}
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF]">manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <button
                          onClick={() => handleApprove(opp.id)}
                          className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            setEditingId(
                              editingId === opp.id ? null : opp.id
                            )
                          }
                          className="text-xs bg-white text-[#6B7280] border border-gray-200 px-2.5 py-1 rounded-lg hover:border-[#00B5B8] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(opp.id)}
                          className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Add Manually tab ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: "",
  organizer: "",
  type: "conference" as const,
  industry: "finance" as const,
  grad_year: [] as number[],
  location: "",
  date_start: "",
  date_end: "",
  deadline: "",
  description: "",
  registration_url: "",
  is_paid: false,
  source_url: "",
};

function AddManually() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    const res = await fetch("/api/admin/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccessMsg("Opportunity added to pending review.");
      setForm(EMPTY_FORM);
    } else {
      const err = await res.json();
      setErrorMsg(err.error ?? "Failed to add opportunity.");
    }
    setSubmitting(false);
  };

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <h2 className="text-base font-semibold text-[#1A1A1A] mb-5">
        Add New Opportunity
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className={FL}>Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={FI}
            placeholder="e.g. Queen's Commerce Finance Conference"
          />
        </div>
        <div>
          <label className={FL}>Organizer *</label>
          <input
            required
            value={form.organizer}
            onChange={(e) => set("organizer", e.target.value)}
            className={FI}
            placeholder="e.g. QCFC"
          />
        </div>
        <div>
          <label className={FL}>Registration URL *</label>
          <input
            required
            type="text"
            pattern="https?://.+"
            title="Must start with http:// or https://"
            value={form.registration_url}
            onChange={(e) => set("registration_url", e.target.value)}
            className={FI}
            placeholder="https://…"
          />
        </div>
        <div>
          <label className={FL}>Type *</label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value as typeof form.type)}
            className={FI}
          >
            <option value="conference">Conference</option>
            <option value="event">Event</option>
            <option value="case_comp">Case Competition</option>
          </select>
        </div>
        <div>
          <label className={FL}>Industry *</label>
          <select
            value={form.industry}
            onChange={(e) =>
              set("industry", e.target.value as typeof form.industry)
            }
            className={FI}
          >
            <option value="finance">Finance</option>
            <option value="consulting">Consulting</option>
            <option value="both">Both</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={FL}>Location</label>
          <input
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={FI}
            placeholder="Toronto, ON"
          />
        </div>
        <div>
          <label className={FL}>Deadline</label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => set("deadline", e.target.value)}
            className={FI}
          />
        </div>
        <div>
          <label className={FL}>Start Date</label>
          <input
            type="date"
            value={form.date_start}
            onChange={(e) => set("date_start", e.target.value)}
            className={FI}
          />
        </div>
        <div>
          <label className={FL}>End Date</label>
          <input
            type="date"
            value={form.date_end}
            onChange={(e) => set("date_end", e.target.value)}
            className={FI}
          />
        </div>
        <div>
          <label className={FL}>Source URL</label>
          <input
            type="text"
            value={form.source_url}
            onChange={(e) => set("source_url", e.target.value)}
            className={FI}
            placeholder="https://…"
          />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="is_paid_add"
            checked={form.is_paid}
            onChange={(e) => set("is_paid", e.target.checked)}
            className="w-4 h-4 accent-[#00B5B8]"
          />
          <label htmlFor="is_paid_add" className="text-sm text-[#6B7280]">
            Paid opportunity
          </label>
        </div>
        <div className="md:col-span-2">
          <label className={FL}>Grad Years</label>
          <GradYearPills
            value={form.grad_year}
            onChange={(v) => set("grad_year", v)}
          />
        </div>
        <div className="md:col-span-2">
          <label className={FL}>Description</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={`${FI} resize-none`}
            placeholder="Brief description…"
          />
        </div>
        {successMsg && (
          <p className="md:col-span-2 text-green-600 text-sm">{successMsg}</p>
        )}
        {errorMsg && (
          <p className="md:col-span-2 text-red-500 text-sm">{errorMsg}</p>
        )}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#00B5B8] hover:bg-[#009A9D] disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {submitting ? "Adding…" : "Add Opportunity"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Ingestion Logs tab ────────────────────────────────────────────────────────

function IngestionLogs() {
  const [logs, setLogs] = useState<IngestionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/ingestion-logs");
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#00B5B8] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (logs.length === 0)
    return (
      <div className="text-center py-16">
        <ClipboardList size={36} className="text-[#9CA3AF] mx-auto mb-3" />
        <p className="text-[#1A1A1A] font-medium">No ingestion runs yet.</p>
        <p className="text-[#9CA3AF] text-sm mt-1">
          Run the scraper to see logs here.
        </p>
      </div>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs text-[#9CA3AF] uppercase tracking-widest bg-[#F5F5F5]">
            <th className="px-4 py-3">Run At</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Added</th>
            <th className="px-4 py-3">Errors</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr
              key={log.id}
              className="border-b border-gray-100 hover:bg-[#F5F5F5] transition-colors"
            >
              <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap text-xs">
                {new Date(log.run_at).toLocaleString("en-CA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
              <td className="px-4 py-3 text-[#1A1A1A] font-mono text-xs">
                {log.source}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs font-semibold ${
                    log.records_added > 0
                      ? "text-green-600"
                      : "text-[#9CA3AF]"
                  }`}
                >
                  +{log.records_added}
                </span>
              </td>
              <td className="px-4 py-3 text-xs max-w-xs">
                {log.errors ? (
                  <details>
                    <summary className="cursor-pointer text-amber-600 hover:text-amber-500">
                      {log.errors.split("\n").length} error
                      {log.errors.split("\n").length !== 1 ? "s" : ""}
                    </summary>
                    <pre className="mt-1 text-[10px] text-[#9CA3AF] whitespace-pre-wrap break-words">
                      {log.errors}
                    </pre>
                  </details>
                ) : (
                  <span className="inline-flex items-center gap-1 text-green-600 text-xs"><Check size={11} /> clean</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Admin Dashboard shell ─────────────────────────────────────────────────────

function AdminDashboard({ password }: { password: string }) {
  const [tab, setTab] = useState<Tab>("pending");

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pending Review" },
    { id: "add", label: "Add Manually" },
    { id: "logs", label: "Ingestion Logs" },
  ];

  return (
    <main className="min-h-screen bg-[#F5F5F5] px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            Admin Dashboard
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">
            Pathways — Opportunity management
          </p>
        </div>
        <a
          href="/"
          className="text-xs text-[#6B7280] hover:text-[#1A1A1A] border border-gray-200 hover:border-[#00B5B8] px-3 py-1.5 rounded-lg transition-colors"
        >
          ← Public site
        </a>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
              tab === t.id
                ? "text-[#1A1A1A] border-[#00B5B8]"
                : "text-[#6B7280] border-transparent hover:text-[#1A1A1A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "pending" && <PendingReview password={password} />}
      {tab === "add" && <AddManually />}
      {tab === "logs" && <IngestionLogs />}
    </main>
  );
}

// ── Page entry point ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  if (!authed)
    return (
      <AdminGate
        onAuth={(pw) => {
          setPassword(pw);
          setAuthed(true);
        }}
      />
    );
  return <AdminDashboard password={password} />;
}
