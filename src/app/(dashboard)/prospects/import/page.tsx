import Link from "next/link";
import { ImportWizard } from "../import-wizard";

export default function ProspectImportPage() {
  return (
    <>
      <header className="border-b border-border px-6 py-5 md:px-10"><Link href="/prospects" className="text-sm font-medium text-muted hover:text-zinc-900">← Prospects</Link></header>
      <div className="space-y-6 px-6 py-8 md:px-10">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-accent">Data acquisition</p><h1 className="font-display text-2xl font-semibold">Import prospects</h1><p className="mt-1 text-sm text-muted">Upload CSV or Excel, map columns, review a preview, then import without losing original row data.</p></div>
        <div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><ImportWizard /></div>
      </div>
    </>
  );
}
