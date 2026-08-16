import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  addContactNote,
  createContactMeeting,
  createContactTask,
  logContactActivity,
  updateContactStatus,
} from "./actions";

export const dynamic = "force-dynamic";

const statusOptions = [
  ["lead", "Lead"],
  ["contacted", "Contacted"],
  ["qualified", "Qualified"],
  ["customer", "Customer"],
  ["inactive", "Inactive"],
];

const activityTypes = [
  ["CALL", "Call"],
  ["EMAIL", "Email"],
  ["MESSAGE", "Message"],
  ["MEETING", "Meeting"],
  ["NOTE", "Note"],
];

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ContactProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;

  const contact = await prisma.contact.findFirst({
    where: { id, workspaceId: user.workspaceId },
    include: {
      company: true,
      leads: { orderBy: { createdAt: "desc" }, take: 8 },
      opportunities: {
        include: { stage: true, pipeline: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
      },
      activities: {
        orderBy: { occurredAt: "desc" },
        take: 20,
      },
      tasks: {
        orderBy: { dueAt: "asc" },
        take: 8,
      },
      notesList: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      meetings: {
        orderBy: { startsAt: "desc" },
        take: 8,
      },
    },
  });

  if (!contact) notFound();

  const companyWebsite = contact.company?.website
    ? contact.company.website.startsWith("http")
      ? contact.company.website
      : `https://${contact.company.website}`
    : null;

  const activityCount = contact.activities.length;
  const openTasks = contact.tasks.filter((task) => task.status !== "DONE").length;
  const upcomingMeetings = contact.meetings.filter(
    (meeting) => meeting.startsAt >= new Date(),
  ).length;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/contacts"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              ← Back
            </Link>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-fg">
              {initials(contact.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Contact 360
              </p>
              <h1 className="truncate font-display text-2xl font-semibold text-zinc-900">
                {contact.name}
              </h1>
              <p className="truncate text-sm text-muted">
                {contact.companyName || contact.company?.name || "No company"}
                {contact.email ? ` · ${contact.email}` : ""}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-accent-fg hover:brightness-110"
              >
                ☎ Call
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                ✉ Email
              </a>
            )}
            {contact.phone && (
              <a
                href={`sms:${contact.phone}`}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                💬 Message
              </a>
            )}
            <a
              href="#schedule-meeting"
              className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              📅 Meeting
            </a>
            {companyWebsite && (
              <a
                href={companyWebsite}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-zinc-50"
              >
                🌐 Website
              </a>
            )}
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:bg-zinc-50"
            >
              Edit
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-6 px-6 py-8 md:px-10">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Activities", activityCount],
            ["Open tasks", openTasks],
            ["Meetings", upcomingMeetings],
            ["Opportunities", contact.opportunities.length],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {label}
              </p>
              <p className="mt-2 font-mono text-2xl font-semibold text-zinc-900">
                {value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-zinc-900">Quick actions</h2>
                  <p className="mt-1 text-sm text-muted">
                    Communicate with this contact without leaving the profile.
                  </p>
                </div>
                <form action={updateContactStatus} className="flex items-center gap-2">
                  <input type="hidden" name="contactId" value={contact.id} />
                  <select
                    name="status"
                    defaultValue={contact.status}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {statusOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-zinc-50">
                    Save status
                  </button>
                </form>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {activityTypes.map(([type, label]) => (
                  <form key={type} action={logContactActivity}>
                    <input type="hidden" name="contactId" value={contact.id} />
                    <input type="hidden" name="type" value={type} />
                    <input type="hidden" name="subject" value={`${label} with ${contact.name}`} />
                    <button className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold transition hover:border-accent hover:bg-accent/5">
                      {label}
                    </button>
                  </form>
                ))}
              </div>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-zinc-900">Activity timeline</h2>
                  <p className="mt-1 text-sm text-muted">
                    Calls, emails, messages, meetings, notes and status changes.
                  </p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  {contact.activities.length}
                </span>
              </div>

              <div className="mt-5 space-y-4">
                {contact.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                    <div className="min-w-0 flex-1 border-b border-border/70 pb-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-900">
                          {activity.subject}
                        </p>
                        <span className="text-xs text-muted">
                          {formatDate(activity.occurredAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent">
                        {activity.type}
                      </p>
                      {activity.description && (
                        <p className="mt-2 text-sm text-zinc-600">
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {!contact.activities.length && (
                  <p className="py-8 text-center text-sm text-muted">
                    No activity yet. Use the quick actions above to start the timeline.
                  </p>
                )}
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Leads</h2>
                  <span className="text-xs text-muted">{contact.leads.length}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {contact.leads.map((lead) => (
                    <div key={lead.id} className="rounded-lg bg-zinc-50 p-3">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold">{lead.title || "Lead"}</p>
                        <span className="text-xs font-semibold text-accent">{lead.score}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {lead.status} · {lead.priority}
                      </p>
                    </div>
                  ))}
                  {!contact.leads.length && <p className="text-sm text-muted">No linked leads.</p>}
                </div>
              </div>

              <div className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Opportunities</h2>
                  <span className="text-xs text-muted">{contact.opportunities.length}</span>
                </div>
                <div className="mt-4 space-y-2">
                  {contact.opportunities.map((opportunity) => (
                    <div key={opportunity.id} className="rounded-lg bg-zinc-50 p-3">
                      <p className="text-sm font-semibold">{opportunity.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {opportunity.stage.name} · ${opportunity.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {!contact.opportunities.length && <p className="text-sm text-muted">No linked opportunities.</p>}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Contact details</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div><dt className="text-xs text-muted">Email</dt><dd className="mt-1 break-all font-medium">{contact.email || "—"}</dd></div>
                <div><dt className="text-xs text-muted">Phone</dt><dd className="mt-1 font-medium">{contact.phone || "—"}</dd></div>
                <div><dt className="text-xs text-muted">Company</dt><dd className="mt-1 font-medium">{contact.company?.name || contact.companyName || "—"}</dd></div>
                <div><dt className="text-xs text-muted">Company website</dt><dd className="mt-1">{companyWebsite ? <a className="text-accent hover:underline" href={companyWebsite} target="_blank" rel="noreferrer">{companyWebsite.replace(/^https?:\/\//, "")}</a> : "—"}</dd></div>
                <div><dt className="text-xs text-muted">Status</dt><dd className="mt-1 font-medium capitalize">{contact.status}</dd></div>
                <div><dt className="text-xs text-muted">Added</dt><dd className="mt-1">{formatDate(contact.createdAt)}</dd></div>
              </dl>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Add note</h2>
              <form action={addContactNote} className="mt-4 space-y-3">
                <input type="hidden" name="contactId" value={contact.id} />
                <textarea
                  name="content"
                  required
                  rows={4}
                  placeholder="Write a note about this contact..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
                <button className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:brightness-110">
                  Add note
                </button>
              </form>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Create follow-up task</h2>
              <form action={createContactTask} className="mt-4 space-y-3">
                <input type="hidden" name="contactId" value={contact.id} />
                <input name="title" required placeholder="Follow up with contact" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <select name="priority" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                    <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
                  </select>
                  <input name="dueAt" type="datetime-local" className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                </div>
                <button className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-zinc-50">
                  Create task
                </button>
              </form>
            </section>

            <section id="schedule-meeting" className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Schedule meeting</h2>
              <form action={createContactMeeting} className="mt-4 space-y-3">
                <input type="hidden" name="contactId" value={contact.id} />
                <input name="title" required placeholder="Meeting title" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                <input name="startsAt" required type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                <input name="endsAt" type="datetime-local" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                <input name="location" placeholder="Location or video link" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm" />
                <button className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg hover:brightness-110">
                  Schedule meeting
                </button>
              </form>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Recent notes</h2>
              <div className="mt-4 space-y-3">
                {contact.notesList.map((note) => (
                  <div key={note.id} className="rounded-lg bg-zinc-50 p-3">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-2 text-xs text-muted">{formatDate(note.createdAt)}</p>
                  </div>
                ))}
                {!contact.notesList.length && <p className="text-sm text-muted">No notes yet.</p>}
              </div>
            </section>

            <section className="rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold">Tasks & meetings</h2>
              <div className="mt-4 space-y-3">
                {contact.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">{task.title}</p>
                    <p className="mt-1 text-xs text-muted">{task.status} · {task.priority} · {formatDate(task.dueAt)}</p>
                  </div>
                ))}
                {contact.meetings.map((meeting) => (
                  <div key={meeting.id} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-semibold">{meeting.title}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(meeting.startsAt)}{meeting.location ? ` · ${meeting.location}` : ""}</p>
                  </div>
                ))}
                {!contact.tasks.length && !contact.meetings.length && (
                  <p className="text-sm text-muted">No tasks or meetings linked yet.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </>
  );
}
