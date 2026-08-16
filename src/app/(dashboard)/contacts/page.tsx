import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { DeleteContactButton } from "./delete-contact-button";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_TINTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
];

const statuses = [
  ["", "All statuses"],
  ["lead", "Lead"],
  ["contacted", "Contacted"],
  ["qualified", "Qualified"],
  ["customer", "Customer"],
  ["inactive", "Inactive"],
];

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const q = String(params.q ?? "").trim();
  const status = String(params.status ?? "").trim();
  const company = String(params.company ?? "").trim();

  const contacts = await prisma.contact.findMany({
    where: {
      workspaceId: user.workspaceId,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
              { companyName: { contains: q } },
              { company: { name: { contains: q } } },
            ],
          }
        : {}),
      ...(company ? { companyName: { contains: company } } : {}),
    },
    include: { company: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <>
      <header className="border-b border-border bg-background">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              CRM
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">
              Contacts
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {contacts.length} matching {contacts.length === 1 ? "contact" : "contacts"}
            </p>
          </div>
          <Link
            href="/contacts/new"
            className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg shadow-[var(--shadow-card)] transition hover:brightness-110"
          >
            + New contact
          </Link>
        </div>
      </header>

      <div className="space-y-5 px-6 py-7 md:px-10">
        <form
          method="get"
          className="rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]"
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_200px_auto_auto]">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, phone or company..."
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <select
              name="status"
              defaultValue={status}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            >
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              name="company"
              defaultValue={company}
              placeholder="Filter company..."
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <button className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg">
              Filter
            </button>
            <Link
              href="/contacts"
              className="rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold hover:bg-zinc-50"
            >
              Clear
            </Link>
          </div>
        </form>

        {contacts.length === 0 ? (
          <div className="rounded-[14px] border border-dashed border-border bg-surface px-8 py-16 text-center">
            <h2 className="font-display text-lg font-semibold">No matching contacts</h2>
            <p className="mt-1 text-sm text-muted">
              Try a different search or clear the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact, i) => (
                    <tr
                      key={contact.id}
                      className="group border-b border-border/70 last:border-0 hover:bg-zinc-50/80"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}
                          >
                            {initials(contact.name)}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="text-sm font-semibold text-zinc-900 hover:text-accent"
                            >
                              {contact.name}
                            </Link>
                            <p className="truncate text-xs text-muted">{contact.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-zinc-600">
                        {contact.company?.name || contact.companyName || "—"}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] text-zinc-500">
                        {contact.phone ? (
                          <a href={`tel:${contact.phone}`} className="hover:text-accent">
                            {contact.phone}
                          </a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={contact.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          {contact.phone && (
                            <a
                              href={`tel:${contact.phone}`}
                              title="Call"
                              className="rounded-md border border-border px-2 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                            >
                              Call
                            </a>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              title="Email"
                              className="rounded-md border border-border px-2 py-1.5 text-xs font-semibold hover:border-accent hover:text-accent"
                            >
                              Email
                            </a>
                          )}
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-fg"
                          >
                            View
                          </Link>
                          <Link
                            href={`/contacts/${contact.id}/edit`}
                            className="rounded-md border border-border px-2 py-1.5 text-xs font-semibold hover:bg-zinc-50"
                          >
                            Edit
                          </Link>
                          <DeleteContactButton id={contact.id} name={contact.name} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
