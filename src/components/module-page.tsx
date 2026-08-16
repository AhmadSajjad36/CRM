import Link from "next/link";
import { getWorkspaceSummary } from "@/lib/workspace";

type ModulePageProps = {
  title: string;
  description: string;
  keyName?: keyof Awaited<ReturnType<typeof getWorkspaceSummary>>;
  actionLabel?: string;
  actionHref?: string;
  children?: React.ReactNode;
};

export async function ModulePage({
  title, description, keyName, actionLabel, actionHref, children,
}: ModulePageProps) {
  const summary = await getWorkspaceSummary();
  const count = summary && keyName ? summary[keyName] : undefined;
  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-5 backdrop-blur md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          </div>
          {actionHref && <Link href={actionHref} className="rounded-[var(--radius)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-[var(--shadow-card)] hover:brightness-110">{actionLabel ?? "Create"}</Link>}
        </div>
      </header>
      <div className="space-y-6 px-6 py-8 md:px-10">
        {count !== undefined && (
          <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Workspace records</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-zinc-900">{count}</p>
          </div>
        )}
        {children ?? (
          <div className="rounded-[14px] border border-dashed border-border bg-surface p-8">
            <h2 className="font-display text-lg font-semibold text-zinc-900">OSOZ module</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              This module is connected to the workspace architecture. CRUD screens, filters,
              bulk actions and integrations are being built on top of the same tenant boundary.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
