"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ProspectRow = {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  source: string;
  status: string;
  score: number;
};

const statusClass: Record<string, string> = {
  NEW: "bg-indigo-50 text-indigo-700",
  CONTACTED: "bg-sky-50 text-sky-700",
  QUALIFIED: "bg-emerald-50 text-emerald-700",
  CONVERTED: "bg-violet-50 text-violet-700",
  ARCHIVED: "bg-zinc-100 text-zinc-600",
};

export function ProspectTable({ rows, owners }: { rows: ProspectRow[]; owners: { id: string; username: string }[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const selectedCount = selected.length;
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleAll() {
    setSelected(allSelected ? [] : rows.map((row) => row.id));
  }

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function bulk(action: string, value?: string) {
    if (!selected.length) return;
    if (action === "delete" && !window.confirm(`Delete ${selected.length} selected prospects? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/prospects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action, value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Bulk action failed.");
      setMessage(`${data.updated} prospect${data.updated === 1 ? "" : "s"} updated.`);
      setSelected([]);
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bulk action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-indigo-50/70 px-5 py-3 text-sm">
          <strong>{selectedCount}</strong><span className="text-muted">selected</span>
          <span className="mx-1 h-4 w-px bg-indigo-200" />
          <select disabled={busy} onChange={(event) => { const value = event.target.value; if (value) bulk("status", value); event.currentTarget.value = ""; }} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold">
            <option value="">Change status</option>
            <option value="NEW">New</option><option value="CONTACTED">Contacted</option><option value="QUALIFIED">Qualified</option><option value="CONVERTED">Converted</option><option value="ARCHIVED">Archived</option>
          </select>
          <select disabled={busy} onChange={(event) => { const value = event.target.value; if (value) bulk("owner", value); event.currentTarget.value = ""; }} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">
            <option value="">Assign owner</option>
            {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.username}</option>)}
          </select>
          <button disabled={busy} onClick={() => bulk("archive")} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Archive</button>
          <button disabled={busy} onClick={() => { if (!selected.length) return; const query = selected.map((id) => `id=${encodeURIComponent(id)}`).join("&"); window.location.href = `/api/prospects/export?format=xlsx&${query}`; }} className="rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold">Export</button>
          <button disabled={busy} onClick={() => bulk("delete")} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600">Delete</button>
          {message && <span className="text-xs text-muted">{message}</span>}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="border-b border-border bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
            <tr>
              <th className="w-10 p-4"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all prospects" /></th>
              <th className="p-4">Prospect</th><th className="p-4">Company</th><th className="p-4">Title</th><th className="p-4">Contact</th><th className="p-4">Location</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Score</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = row.fullName || [row.firstName, row.lastName].filter(Boolean).join(" ") || "Unnamed prospect";
              const location = [row.city, row.state].filter(Boolean).join(", ");
              return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-zinc-50/70">
                  <td className="p-4"><input type="checkbox" checked={selectedSet.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${name}`} /></td>
                  <td className="p-4"><Link href={`/prospects/${row.id}`} className="font-semibold text-zinc-900 hover:text-accent">{name}</Link><div className="mt-0.5 text-xs text-muted">{row.email || "No email"}</div></td>
                  <td className="p-4"><div className="font-medium">{row.companyName || "—"}</div></td>
                  <td className="p-4 text-zinc-700">{row.jobTitle || "—"}</td>
                  <td className="p-4"><div>{row.email || "—"}</div><div className="mt-0.5 text-xs text-muted">{row.phone || "No phone"}</div></td>
                  <td className="p-4 text-zinc-700">{location || "—"}</td>
                  <td className="p-4"><span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{row.source}</span></td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass[row.status] ?? "bg-zinc-100 text-zinc-600"}`}>{row.status}</span></td>
                  <td className="p-4"><div className="font-semibold">{row.score}</div><div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-accent" style={{ width: `${row.score}%` }} /></div></td>
                  <td className="p-4 text-right"><Link href={`/prospects/${row.id}`} className="text-xs font-semibold text-accent">View</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <div className="px-6 py-14 text-center"><p className="font-semibold">No prospects match these filters.</p><p className="mt-1 text-sm text-muted">Import a file, add one manually, or broaden your search.</p></div>}
    </div>
  );
}
