"use client";

import { useMemo, useState } from "react";
import { bulkImportProspects, type GenericProspectResult } from "./actions";

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-xs font-medium ${
          value ? "text-zinc-800" : "text-zinc-400"
        }`}
        title={value ?? undefined}
      >
        {value || "Not found"}
      </p>
    </div>
  );
}

export default function ProspectingResults({
  results,
  query,
}: {
  results: GenericProspectResult[];
  query: string;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    results.map((result) => result.id),
  );

  const selected = useMemo(
    () => results.filter((result) => selectedIds.includes(result.id)),
    [results, selectedIds],
  );

  if (!results.length) {
    return (
      <section className="rounded-[14px] border border-border bg-surface p-10 text-center shadow-[var(--shadow-card)]">
        <p className="text-sm font-semibold text-zinc-900">
          Search results will appear here
        </p>
        <p className="mt-1 text-sm text-muted">
          Run a search above to discover real public-source prospects.
        </p>
      </section>
    );
  }

  const emailCount = results.filter((result) => result.email).length;
  const phoneCount = results.filter((result) => result.phone).length;
  const websiteCount = results.filter((result) => result.url).length;

  return (
    <section className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]">
      <form action={bulkImportProspects}>
        <input type="hidden" name="query" value={query} />
        <input
          type="hidden"
          name="results"
          value={JSON.stringify(selected)}
        />

        <div className="border-b border-border px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Real-source results
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {results.length} prospects found
              </h2>
              <p className="mt-1 text-xs text-muted">{query}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {emailCount} email
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                {phoneCount} phone
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                {websiteCount} website
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3">
            <div className="text-xs text-muted">
              <span className="font-semibold text-zinc-900">
                {selected.length}
              </span>{" "}
              selected of {results.length}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(results.map((item) => item.id))}
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold"
              >
                Select all
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={!selected.length}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-fg disabled:opacity-50"
              >
                Import {selected.length} prospect{selected.length === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {results.map((result) => {
            const isSelected = selectedIds.includes(result.id);

            return (
              <article key={result.id} className="p-5">
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setSelectedIds((current) =>
                        isSelected
                          ? current.filter((id) => id !== result.id)
                          : [...current, result.id],
                      )
                    }
                    className="mt-1 h-4 w-4 rounded border-border accent-accent"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-zinc-900">
                            {result.title}
                          </h3>
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                            {result.domain}
                          </span>
                        </div>

                        <a
                          href={result.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-xs font-medium text-accent hover:underline"
                        >
                          {result.url}
                        </a>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                          <Field label="Email" value={result.email} />
                          <Field label="Phone" value={result.phone} />
                          <Field label="LinkedIn" value={result.linkedinUrl} />
                          <Field label="Source" value={result.domain} />
                        </div>

                        {result.description && (
                          <p className="mt-4 max-w-4xl text-sm leading-6 text-muted">
                            {result.description}
                          </p>
                        )}
                      </div>

                      <a
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg border border-border bg-white px-4 py-2.5 text-xs font-semibold"
                      >
                        Review source
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </form>
    </section>
  );
}