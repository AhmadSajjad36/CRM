import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ProspectTable, type ProspectRow } from "./prospect-table";

export const dynamic = "force-dynamic";
const pageSize = 25;
const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "ARCHIVED"];

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; owner?: string; page?: string; minScore?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;
  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "").trim();
  const source = String(params.source ?? "").trim();
  const owner = String(params.owner ?? "").trim();
  const minScore = Math.max(0, Number(params.minScore ?? 0) || 0);
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const baseWhere = { workspaceId: user.workspaceId };
  const where = {
    ...baseWhere,
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(owner ? { ownerId: owner } : {}),
    ...(minScore ? { score: { gte: minScore } } : {}),
    ...(q ? {
      OR: [
        { fullName: { contains: q, mode: "insensitive" as const } },
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { companyName: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
        { jobTitle: { contains: q, mode: "insensitive" as const } },
        { city: { contains: q, mode: "insensitive" as const } },
        { country: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const [prospects, total, globalTotal, sources, owners, statusCounts, emailCount, phoneCount, avgScoreAggregate, recentImports] = await Promise.all([
    prisma.prospect.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, fullName: true, firstName: true, lastName: true, companyName: true, jobTitle: true, email: true, phone: true, city: true, state: true, source: true, status: true, score: true },
    }),
    prisma.prospect.count({ where }),
    prisma.prospect.count({ where: baseWhere }),
    prisma.prospect.groupBy({ by: ["source"], where: baseWhere, _count: { _all: true }, orderBy: { source: "asc" } }),
    prisma.user.findMany({ where: { workspaceId: user.workspaceId }, select: { id: true, username: true }, orderBy: { username: "asc" } }),
    prisma.prospect.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.prospect.count({ where: { ...baseWhere, email: { not: null } } }),
    prisma.prospect.count({ where: { ...baseWhere, phone: { not: null } } }),
    prisma.prospect.aggregate({ where: baseWhere, _avg: { score: true } }),
    prisma.importJob.findMany({ where: baseWhere, orderBy: { createdAt: "desc" }, take: 5, select: { id: true, filename: true, source: true, totalRows: true, importedRows: true, duplicateRows: true, failedRows: true, status: true, createdAt: true } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const count = (key: string) => statusCounts.find((item) => item.status === key)?._count._all ?? 0;
  const newCount = count("NEW");
  const qualified = count("QUALIFIED");
  const contacted = count("CONTACTED");
  const converted = count("CONVERTED");
  const avgScore = Math.round(avgScoreAggregate._avg.score ?? 0);
  const completeness = globalTotal ? Math.round(((emailCount + phoneCount) / (globalTotal * 2)) * 100) : 0;
  const pageQuery = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set("q", q); if (status) qs.set("status", status); if (source) qs.set("source", source); if (owner) qs.set("owner", owner); if (minScore) qs.set("minScore", String(minScore)); qs.set("page", String(nextPage));
    return `?${qs.toString()}`;
  };

  return (
    <>
      <header className="border-b border-border bg-background/80 px-6 py-5 backdrop-blur md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Acquisition · Prospects</p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-zinc-900">Prospects</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted">One verified repository for manually created, imported, API-sourced, and future real-world prospect data.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/prospects/import" className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50">Import</Link>
            <Link href="/prospecting" className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50">Find prospects</Link>
            <Link href="/prospects/new" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg">Add prospect</Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-6 py-7 md:px-10">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["Total", globalTotal, "All prospects"],
            ["New", newCount, "Awaiting qualification"],
            ["Qualified", qualified, "Ready for sales"],
            ["Contacted", contacted, "Outreach started"],
            ["Converted", converted, "Moved into CRM"],
            ["Avg. score", avgScore, "0–100 quality score"],
          ].map(([label, value, helper]) => <div key={String(label)} className="rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted">{helper}</p></div>)}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Data quality</p><h2 className="mt-1 text-lg font-semibold">Contact coverage</h2></div><span className="text-2xl font-semibold text-accent">{completeness}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-accent" style={{ width: `${completeness}%` }} /></div><div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted"><div><span className="font-semibold text-zinc-900">{emailCount}</span> with email</div><div><span className="font-semibold text-zinc-900">{phoneCount}</span> with phone</div></div></div>
          <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Sources</p><div className="mt-3 space-y-2">{sources.slice(0, 4).map((item) => <div key={item.source} className="flex items-center justify-between text-sm"><span className="truncate">{item.source}</span><span className="font-semibold">{item._count._all}</span></div>)}</div></div>
          <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Status mix</p><div className="mt-3 space-y-2">{STATUSES.map((key) => <div key={key} className="flex items-center justify-between text-sm"><span>{key}</span><span className="font-semibold">{statusCounts.find((x) => x.status === key)?._count._all ?? 0}</span></div>)}</div></div>
        </section>

        <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <form className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_160px_180px_170px_120px_auto]">
            <div><label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Search</label><input name="q" defaultValue={q} placeholder="Name, company, email, phone, title…" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm" /></div>
            <div><label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Status</label><select name="status" defaultValue={status} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"><option value="">All statuses</option>{STATUSES.map(x => <option key={x}>{x}</option>)}</select></div>
            <div><label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Source</label><select name="source" defaultValue={source} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"><option value="">All sources</option>{sources.map(x => <option key={x.source}>{x.source}</option>)}</select></div>
            <div><label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Owner</label><select name="owner" defaultValue={owner} className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm"><option value="">All owners</option>{owners.map(x => <option key={x.id} value={x.id}>{x.username}</option>)}</select></div>
            <div><label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">Min score</label><input name="minScore" type="number" min="0" max="100" defaultValue={minScore || ""} placeholder="0" className="w-full rounded-lg border border-border px-3 py-2.5 text-sm" /></div>
            <div className="flex items-end"><button className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50">Apply filters</button></div>
          </form>
        </section>

        <section className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-semibold">Prospect directory</h2><p className="mt-0.5 text-xs text-muted">Showing {(page - 1) * pageSize + Math.min(prospects.length, pageSize)} of {total} matching records</p></div><div className="flex flex-wrap gap-2"><Link href={`/api/prospects/export?format=csv${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-zinc-50">Export CSV</Link><Link href={`/api/prospects/export?format=xlsx${q ? `&q=${encodeURIComponent(q)}` : ""}${status ? `&status=${encodeURIComponent(status)}` : ""}${source ? `&source=${encodeURIComponent(source)}` : ""}`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-zinc-50">Export Excel</Link></div></div>
          <ProspectTable rows={prospects as ProspectRow[]} owners={owners} />
          <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm"><span className="text-muted">Page {page} of {pages}</span><div className="flex gap-2"><Link aria-disabled={page <= 1} href={page > 1 ? pageQuery(page - 1) : "#"} className={`rounded-lg border border-border px-3 py-2 font-semibold ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-zinc-50"}`}>Previous</Link><Link aria-disabled={page >= pages} href={page < pages ? pageQuery(page + 1) : "#"} className={`rounded-lg border border-border px-3 py-2 font-semibold ${page >= pages ? "pointer-events-none opacity-40" : "hover:bg-zinc-50"}`}>Next</Link></div></div>
        </section>

        <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Recent imports</h2><p className="mt-0.5 text-xs text-muted">Every import keeps file, source, result counts, and errors.</p></div><Link href="/prospects/import" className="text-xs font-semibold text-accent">Open import wizard →</Link></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted"><tr><th className="p-3">File</th><th className="p-3">Source</th><th className="p-3">Rows</th><th className="p-3">Imported</th><th className="p-3">Duplicates</th><th className="p-3">Failed</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{recentImports.map(job => <tr key={job.id} className="border-b border-border last:border-0"><td className="p-3 font-medium">{job.filename}</td><td className="p-3">{job.source}</td><td className="p-3">{job.totalRows}</td><td className="p-3">{job.importedRows}</td><td className="p-3">{job.duplicateRows}</td><td className="p-3">{job.failedRows}</td><td className="p-3"><span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-semibold">{job.status}</span></td><td className="p-3 text-xs text-muted">{job.createdAt.toLocaleString()}</td></tr>)}</tbody></table>{recentImports.length === 0 && <p className="py-8 text-center text-sm text-muted">No imports yet.</p>}</div>
        </section>
      </div>
    </>
  );
}
