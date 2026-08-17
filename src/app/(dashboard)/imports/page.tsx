import Link from "next/link";
import { ModulePage } from "@/components/module-page";

export default function Imports() {
  return (
    <ModulePage title="Imports" description="Import and manage prospect data without losing original source fields.">
      <div className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold">Prospect imports</h2>
        <p className="mt-1 text-sm text-muted">Upload CSV or Excel, map columns, preview records, detect duplicates and preserve every original row.</p>
        <Link href="/prospects/import" className="mt-5 inline-flex rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg">Open import workflow</Link>
      </div>
    </ModulePage>
  );
}
