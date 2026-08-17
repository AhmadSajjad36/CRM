import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateProspect, deleteProspect } from "../actions";

export const dynamic = "force-dynamic";

function pretty(value: string) {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

function parseObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch { return {}; }
}

const input = "rounded-lg border border-border bg-white px-3 py-2.5 text-sm";

export default async function ProspectDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null;
  const { id } = await params;
  const prospect = await prisma.prospect.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: { importJob: true, owner: { select: { username: true } } },
  });
  if (!prospect) notFound();

  const audits = await prisma.auditLog.findMany({
    where: { workspaceId: user.workspaceId, entity: "Prospect", entityId: prospect.id },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { user: { select: { username: true } } },
  });

  const custom = parseObject(prospect.customFields);
  const raw = pretty(prospect.rawData);
  const name = prospect.fullName || [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.email || "Unnamed prospect";
  const completenessFields = [prospect.email, prospect.phone, prospect.companyName, prospect.jobTitle, prospect.website, prospect.city, prospect.industry];
  const completeness = Math.round((completenessFields.filter(Boolean).length / completenessFields.length) * 100);
  const sourceMetadata = parseObject(prospect.sourceMetadata);

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 px-6 py-5 backdrop-blur md:px-10"><div className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/prospects" className="text-sm text-muted hover:text-zinc-900">← Prospects</Link><p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-accent">Prospect 360</p><h1 className="mt-1 font-display text-2xl font-semibold">{name}</h1><p className="mt-1 text-sm text-muted">{prospect.companyName || "Unassigned company"}{prospect.jobTitle ? ` · ${prospect.jobTitle}` : ""}</p></div><div className="flex flex-wrap gap-2"><a href={prospect.phone ? `tel:${prospect.phone}` : undefined} className={`rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold ${prospect.phone ? "" : "pointer-events-none opacity-40"}`}>Call</a><a href={prospect.email ? `mailto:${prospect.email}` : undefined} className={`rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold ${prospect.email ? "" : "pointer-events-none opacity-40"}`}>Email</a>{prospect.website && <a href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Website</a>}{prospect.sourceUrl && <a href={prospect.sourceUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Source</a>}</div></div></header>

      <div className="space-y-6 px-6 py-7 md:px-10">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[["Status", prospect.status], ["Score", String(prospect.score)], ["Owner", prospect.owner?.username ?? "Unassigned"], ["Source", prospect.source], ["Completeness", `${completeness}%`]].map(([label,value]) => <div key={label} className="rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p></div>)}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Overview</h2><p className="mt-1 text-xs text-muted">Clean structured CRM information.</p></div><span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold">{prospect.status}</span></div><div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2"><div><p className="text-xs text-muted">Email</p><p className="mt-1 text-sm font-medium">{prospect.email || "—"}</p></div><div><p className="text-xs text-muted">Phone</p><p className="mt-1 text-sm font-medium">{prospect.phone || "—"}</p></div><div><p className="text-xs text-muted">Mobile</p><p className="mt-1 text-sm font-medium">{prospect.mobile || "—"}</p></div><div><p className="text-xs text-muted">LinkedIn</p><p className="mt-1 text-sm font-medium">{prospect.linkedinUrl || "—"}</p></div><div><p className="text-xs text-muted">Location</p><p className="mt-1 text-sm font-medium">{[prospect.city, prospect.state, prospect.country].filter(Boolean).join(", ") || "—"}</p></div><div><p className="text-xs text-muted">Industry</p><p className="mt-1 text-sm font-medium">{prospect.industry || "—"}</p></div><div><p className="text-xs text-muted">Website</p><p className="mt-1 text-sm font-medium break-all">{prospect.website || "—"}</p></div><div><p className="text-xs text-muted">Created</p><p className="mt-1 text-sm font-medium">{prospect.createdAt.toLocaleString()}</p></div></div>{prospect.notes && <div className="mt-5 rounded-xl border border-border bg-zinc-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Notes</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{prospect.notes}</p></div>}</div>
          <div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">Source lineage</h2><div className="mt-4 space-y-4 text-sm"><div><p className="text-xs text-muted">Source</p><p className="mt-1 font-medium">{prospect.source}</p></div><div><p className="text-xs text-muted">Source URL</p>{prospect.sourceUrl ? <a href={prospect.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block break-all font-medium text-accent">{prospect.sourceUrl}</a> : <p className="mt-1 font-medium">Not captured</p>}</div><div><p className="text-xs text-muted">Imported file</p><p className="mt-1 font-medium">{prospect.importJob?.filename ?? "Not imported from a file"}</p></div><div><p className="text-xs text-muted">Imported at</p><p className="mt-1 font-medium">{prospect.importJob?.createdAt.toLocaleString() ?? "—"}</p></div><div><p className="text-xs text-muted">Source metadata</p><pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs text-zinc-100">{pretty(prospect.sourceMetadata)}</pre></div></div></div>
        </section>

        <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Edit prospect</h2><p className="mt-1 text-xs text-muted">Update structured information without touching preserved raw source data.</p></div></div><form action={updateProspect} className="mt-5"><input type="hidden" name="id" value={prospect.id}/><div className="grid gap-4 md:grid-cols-3"><input name="firstName" defaultValue={prospect.firstName ?? ""} placeholder="First name" className={input}/><input name="lastName" defaultValue={prospect.lastName ?? ""} placeholder="Last name" className={input}/><input name="fullName" defaultValue={prospect.fullName ?? ""} placeholder="Full name" className={input}/><input name="jobTitle" defaultValue={prospect.jobTitle ?? ""} placeholder="Job title" className={input}/><input name="companyName" defaultValue={prospect.companyName ?? ""} placeholder="Company" className={input}/><input name="industry" defaultValue={prospect.industry ?? ""} placeholder="Industry" className={input}/><input name="email" type="email" defaultValue={prospect.email ?? ""} placeholder="Email" className={input}/><input name="phone" defaultValue={prospect.phone ?? ""} placeholder="Phone" className={input}/><input name="mobile" defaultValue={prospect.mobile ?? ""} placeholder="Mobile" className={input}/><input name="website" defaultValue={prospect.website ?? ""} placeholder="Website" className={input}/><input name="linkedinUrl" defaultValue={prospect.linkedinUrl ?? ""} placeholder="LinkedIn URL" className={input}/><input name="address" defaultValue={prospect.address ?? ""} placeholder="Address" className={input}/><input name="city" defaultValue={prospect.city ?? ""} placeholder="City" className={input}/><input name="state" defaultValue={prospect.state ?? ""} placeholder="State" className={input}/><input name="postalCode" defaultValue={prospect.postalCode ?? ""} placeholder="Postal code" className={input}/><input name="country" defaultValue={prospect.country ?? ""} placeholder="Country" className={input}/><select name="source" defaultValue={prospect.source} className={input}><option>Manual</option><option>CSV Import</option><option>Excel Import</option><option>Scraper</option><option>API</option><option>Website</option><option>Referral</option></select><input name="sourceUrl" defaultValue={prospect.sourceUrl ?? ""} placeholder="Source URL" className={input}/><select name="status" defaultValue={prospect.status} className={input}>{["NEW","CONTACTED","QUALIFIED","CONVERTED","ARCHIVED"].map(x => <option key={x}>{x}</option>)}</select><input name="score" type="number" min="0" max="100" defaultValue={prospect.score} className={input}/></div><textarea name="notes" defaultValue={prospect.notes ?? ""} placeholder="Notes" className={`mt-4 min-h-24 w-full ${input}`}/><div className="mt-4 flex justify-end"><button className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg">Save changes</button></div></form></section>

        <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">Custom fields</h2><p className="mt-1 text-xs text-muted">Unmapped source columns live here so no information is silently discarded.</p>{Object.keys(custom).length ? <div className="mt-4 divide-y divide-border rounded-xl border border-border">{Object.entries(custom).map(([key,value]) => <div key={key} className="grid grid-cols-[180px_1fr] gap-4 px-4 py-3 text-sm"><span className="font-medium">{key}</span><span className="break-words text-zinc-600">{String(value ?? "")}</span></div>)}</div> : <p className="mt-4 rounded-lg bg-zinc-50 p-4 text-sm text-muted">No custom fields captured.</p>}</div><div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">Original raw data</h2><p className="mt-1 text-xs text-muted">Exactly what the CRM received from the source.</p><pre className="mt-4 max-h-[360px] overflow-auto rounded-lg bg-zinc-950 p-4 text-xs leading-5 text-zinc-100">{raw}</pre></div></section>

        <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">History</h2><p className="mt-1 text-xs text-muted">Important changes, imports, and assignments for this record.</p><div className="mt-5 space-y-4">{audits.length ? audits.map(item => <div key={item.id} className="flex gap-3"><div className="mt-1 h-2.5 w-2.5 rounded-full bg-accent"/><div><p className="text-sm font-medium">{item.action.replaceAll("_", " ")}</p><p className="mt-0.5 text-xs text-muted">{item.user?.username ?? "System"} · {item.createdAt.toLocaleString()}</p>{item.metadata && <pre className="mt-2 max-w-4xl overflow-x-auto rounded-lg bg-zinc-50 p-3 text-[11px] text-zinc-600">{pretty(item.metadata)}</pre>}</div></div>) : <p className="py-6 text-sm text-muted">No history recorded yet.</p>}</div></section>

        <div className="flex justify-end"><form action={deleteProspect}><input type="hidden" name="id" value={prospect.id}/><button className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600">Delete prospect</button></form></div>
      </div>
    </>
  );
}
