import Link from "next/link";
import { searchProspects, type ProspectingSearchState } from "./actions";
import ProspectingResults from "./prospecting-results";

export const dynamic = "force-dynamic";

function value(input: string | string[] | undefined): string {
  return Array.isArray(input) ? String(input[0] ?? "") : String(input ?? "");
}

export default async function ProspectingPage({
  searchParams,
}: {
  searchParams: Promise<{
    imported?: string;
    duplicates?: string;
    targetType?: string;
    keyword?: string;
    industry?: string;
    country?: string;
    state?: string;
    city?: string;
    companySize?: string;
    jobTitle?: string;
    seniority?: string;
    source?: string;
  }>;
}) {
  const params = await searchParams;

  const imported = Math.max(0, Number(value(params.imported) || "0"));
  const duplicates = Math.max(0, Number(value(params.duplicates) || "0"));

  const current = {
    targetType: value(params.targetType) || "People and companies",
    keyword: value(params.keyword),
    industry: value(params.industry),
    country: value(params.country) || "USA",
    state: value(params.state),
    city: value(params.city),
    companySize: value(params.companySize),
    jobTitle: value(params.jobTitle),
    seniority: value(params.seniority),
    source: value(params.source) || "All available",
  };

  const hasSearch = Boolean(
    current.keyword ||
      current.industry ||
      current.state ||
      current.city ||
      current.jobTitle,
  );

  let searchState: ProspectingSearchState = {
    ok: false,
    error: null,
    query: "",
    searchedAt: null,
    results: [],
  };

  if (hasSearch) {
    const formData = new FormData();
    Object.entries(current).forEach(([key, item]) => formData.set(key, item));
    searchState = await searchProspects(formData);
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-background/80 px-6 py-5 backdrop-blur md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Acquisition · Prospecting
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900">
              Find prospects
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted">
              Search for real people and companies across industries, review
              public-source evidence, then bulk import only the prospects you
              choose.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/prospects"
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Prospect directory
            </Link>
            <Link
              href="/prospects/import"
              className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold"
            >
              Import file
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-6 py-7 md:px-10">
        {imported > 0 && (
          <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Imported {imported} prospect{imported === 1 ? "" : "s"}.
            {duplicates > 0
              ? ` ${duplicates} duplicate${duplicates === 1 ? "" : "s"} skipped.`
              : ""}
          </div>
        )}

        <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Universal prospect search
              </p>
              <h2 className="mt-1 text-xl font-semibold">
                Search any industry, market, or role
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted">
                Medical, software, legal, construction, manufacturing,
                agencies, services, or any other market. Industry-specific
                providers can be added later as optional connectors; the core
                Prospect model stays generic.
              </p>
            </div>

            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
              Industry-agnostic
            </span>
          </div>

          <form method="get" className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Target
              </span>
              <select
                name="targetType"
                defaultValue={current.targetType}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              >
                <option>People and companies</option>
                <option>People</option>
                <option>Companies</option>
                <option>Organizations</option>
                <option>Decision makers</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Keywords
              </span>
              <input
                name="keyword"
                defaultValue={current.keyword}
                placeholder="SaaS, architect, dental clinic, manufacturer..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Industry
              </span>
              <input
                name="industry"
                defaultValue={current.industry}
                placeholder="Software, Healthcare, Construction..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Country
              </span>
              <input
                name="country"
                defaultValue={current.country}
                placeholder="USA"
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                State / Province
              </span>
              <input
                name="state"
                defaultValue={current.state}
                placeholder="Texas, California, Ontario..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                City
              </span>
              <input
                name="city"
                defaultValue={current.city}
                placeholder="Austin, Miami, Toronto..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Company size
              </span>
              <select
                name="companySize"
                defaultValue={current.companySize}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Any size</option>
                <option>1-10</option>
                <option>11-50</option>
                <option>51-200</option>
                <option>201-500</option>
                <option>501-1000</option>
                <option>1000+</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Role / title
              </span>
              <input
                name="jobTitle"
                defaultValue={current.jobTitle}
                placeholder="CEO, Founder, Manager..."
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Seniority
              </span>
              <select
                name="seniority"
                defaultValue={current.seniority}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              >
                <option value="">Any level</option>
                <option>C-Level</option>
                <option>VP</option>
                <option>Director</option>
                <option>Manager</option>
                <option>Owner / Founder</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Source
              </span>
              <select
                name="source"
                defaultValue={current.source}
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"
              >
                <option>All available</option>
                <option>Web</option>
                <option>Public directory</option>
                <option>Public registry</option>
                <option>API</option>
              </select>
            </label>

            <div className="md:col-span-2 flex items-end">
              <div className="w-full rounded-xl bg-zinc-50 px-4 py-3 text-xs text-muted">
                <span className="font-semibold text-zinc-900">
                  Trust rule:
                </span>{" "}
                OSOZ only stores contact information that is actually present
                in a retrieved public source. Missing values remain empty.
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-accent-fg">
                Find prospects
              </button>
            </div>
          </form>
        </section>

        {searchState.error && (
          <section className="rounded-[14px] border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-semibold">Search could not run</p>
            <p className="mt-1">{searchState.error}</p>
          </section>
        )}

        <ProspectingResults
          results={searchState.results}
          query={searchState.query}
        />
      </div>
    </div>
  );
}