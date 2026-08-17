import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import { STAGE_META, formatCurrency } from "@/lib/deal-stage";
import { RevenueChart } from "./revenue-chart";

export const dynamic = "force-dynamic";

const iconPaths = {
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  building: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/></>,
  target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
  dollar: <><circle cx="12" cy="12" r="9"/><path d="M12 6v12M15 9.5c0-1.1-1.2-2-3-2s-3 .9-3 2 1.2 2 3 2 3 .9 3 2-1.2 2-3 2-3-.9-3-2"/></>,
  check: <><path d="m5 12 4 4L19 6"/></>,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  activity: <><path d="M3 12h4l3-8 4 16 3-8h4"/></>,
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  warning: <><path d="m10.3 3.2-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.7-2.8l-8-14a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
};

type IconName = keyof typeof iconPaths;

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)] ${className}`}>{children}</section>;
}

function SectionHeader({ title, description, href }: { title: string; description?: string; href?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] font-semibold text-zinc-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
      </div>
      {href && <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-accent hover:underline">View all <Icon name="arrow" size={13}/></Link>}
    </div>
  );
}

function KpiCard({ label, value, note, href, icon, tone = "indigo" }: { label: string; value: string; note: string; href: string; icon: IconName; tone?: "indigo" | "green" | "amber" | "blue" }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Link href={href} className="group rounded-[14px] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-2 font-mono text-[25px] font-semibold tracking-tight text-zinc-900">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}><Icon name={icon} size={19}/></span>
      </div>
      <p className="mt-3 text-[11px] text-muted">{note}</p>
    </Link>
  );
}

function MiniMetric({ label, value, href, icon }: { label: string; value: string; href: string; icon: IconName }) {
  return <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)] transition hover:border-zinc-300 hover:bg-zinc-50">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50 text-zinc-500"><Icon name={icon} size={15}/></span>
    <span className="min-w-0 flex-1"><span className="block text-[10px] font-medium text-muted">{label}</span><span className="mt-0.5 block font-mono text-sm font-semibold text-zinc-800">{value}</span></span>
  </Link>;
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "bg-emerald-50 text-emerald-700";
  if (status === "URGENT") return "bg-red-50 text-red-700";
  if (status === "HIGH") return "bg-orange-50 text-orange-700";
  if (status === "LOW") return "bg-zinc-100 text-zinc-600";
  return "bg-amber-50 text-amber-700";
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function DashboardPage() {
  const stats = await getDashboardStats(6);
  const maxStageValue = Math.max(...stats.byStage.map((stage) => stage.value), 1);
  const maxSourceCount = Math.max(...stats.leadsBySource.map((source) => source.count), 1);
  const maxProspectSource = Math.max(...stats.prospectSources.map((source) => source.count), 1);
  const revenueTotal = stats.revenueByMonth.reduce((sum, month) => sum + month.total, 0);

  return (
    <>
      <header className="sticky top-14 z-10 border-b border-border bg-background/90 px-6 py-4 backdrop-blur md:top-0 md:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
              <span className="rounded-full bg-accent/8 px-2 py-0.5 text-[10px] font-semibold text-accent">Overview</span>
            </div>
            <p className="mt-0.5 text-sm text-muted">A live view of acquisition, pipeline and today&apos;s work.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-zinc-600">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
            <Link href="/prospects/new" className="inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90"><Icon name="plus" size={15}/> Add prospect</Link>
          </div>
        </div>
      </header>

      <div className="space-y-5 px-6 py-6 md:px-10 md:py-7">
        <div className="rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{stats.workspaceName}</p>
              <p className="mt-1 text-sm font-medium text-zinc-800">Good morning, {stats.username}.</p>
            </div>
            <p className="text-xs text-muted">This dashboard uses workspace data only — no generated business metrics.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total prospects" value={stats.totalProspects.toLocaleString()} note={`+${stats.newProspects} added this month`} href="/prospects" icon="target" />
          <KpiCard label="New leads" value={stats.totalLeads.toLocaleString()} note={`${stats.qualifiedLeads} currently qualified`} href="/leads" icon="users" tone="green" />
          <KpiCard label="Open pipeline" value={formatCurrency(stats.pipelineValue)} note={`${stats.openDeals} open deals`} href="/deals" icon="briefcase" tone="blue" />
          <KpiCard label="Revenue won" value={formatCurrency(stats.wonValue)} note={`${stats.activitiesToday} activities today`} href="/deals" icon="dollar" tone="green" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniMetric label="Companies" value={stats.totalCompanies.toLocaleString()} href="/companies" icon="building" />
          <MiniMetric label="Contacts" value={stats.totalContacts.toLocaleString()} href="/contacts" icon="users" />
          <MiniMetric label="Lead qualification" value={stats.conversionRate === null ? "—" : `${stats.conversionRate.toFixed(1)}%`} href="/leads" icon="target" />
          <MiniMetric label="Meetings today" value={stats.meetingsToday.toLocaleString()} href="/meetings" icon="calendar" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <Card className="p-6">
            <SectionHeader title="Pipeline by stage" description="Current deal value and volume across the active sales pipeline." href="/deals" />
            <div className="mt-6 space-y-4">
              {stats.byStage.map((stage) => {
                const meta = STAGE_META[stage.stage];
                return (
                  <div key={stage.stage}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="flex items-center gap-2 font-medium text-zinc-700"><span className={`h-2 w-2 rounded-full ${meta.bar}`}/>{meta.label}<span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">{stage.count}</span></span>
                      <span className="font-mono font-semibold text-zinc-800">{formatCurrency(stage.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${stage.value ? Math.max(4, (stage.value / maxStageValue) * 100) : 0}%` }}/></div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-zinc-50 p-4"><p className="text-[11px] text-muted">Open deals</p><p className="mt-1 font-mono text-lg font-semibold">{stats.openDeals}</p></div>
              <div className="rounded-xl bg-zinc-50 p-4"><p className="text-[11px] text-muted">Pipeline value</p><p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(stats.pipelineValue)}</p></div>
              <div className="rounded-xl bg-zinc-50 p-4"><p className="text-[11px] text-muted">Won revenue</p><p className="mt-1 font-mono text-lg font-semibold text-emerald-600">{formatCurrency(stats.wonValue)}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Today&apos;s focus" description="Work that needs attention now." href="/tasks" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-red-50 p-3 text-center"><p className="text-[10px] font-semibold uppercase text-red-600">Overdue</p><p className="mt-1 text-xl font-semibold text-red-700">{stats.overdueTasks}</p></div>
              <div className="rounded-xl bg-amber-50 p-3 text-center"><p className="text-[10px] font-semibold uppercase text-amber-700">Due today</p><p className="mt-1 text-xl font-semibold text-amber-800">{stats.tasksDueToday}</p></div>
              <div className="rounded-xl bg-blue-50 p-3 text-center"><p className="text-[10px] font-semibold uppercase text-blue-600">Upcoming</p><p className="mt-1 text-xl font-semibold text-blue-700">{stats.upcomingTasks}</p></div>
            </div>
            <div className="mt-5 divide-y divide-border">
              {stats.tasks.length ? stats.tasks.map((task) => (
                <Link key={task.id} href="/tasks" className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-zinc-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><Icon name="check" size={15}/></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-800">{task.title}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{task.companyName || "No company"}{task.dueAt ? ` · ${formatShortDate(task.dueAt)}` : ""}</span></span>
                  <span className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${statusTone(task.priority)}`}>{task.priority}</span>
                </Link>
              )) : <p className="py-8 text-center text-xs text-muted">No pending tasks.</p>}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <Card className="p-6">
            <SectionHeader title="Revenue trend" description="Won deal revenue from the last six months." />
            <div className="mt-5 flex items-end justify-between gap-4"><div><p className="font-mono text-2xl font-semibold">{formatCurrency(revenueTotal)}</p><p className="text-xs text-muted">six-month total</p></div><div className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">Actual won revenue</div></div>
            <div className="mt-5"><RevenueChart data={stats.revenueByMonth}/></div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Lead funnel" description="Current workspace lead progression." href="/leads" />
            <div className="mt-5 space-y-3">
              <FunnelRow label="Prospects" value={stats.totalProspects} />
              <FunnelRow label="Qualified prospects" value={stats.qualifiedProspects} percent={stats.totalProspects ? (stats.qualifiedProspects / stats.totalProspects) * 100 : 0}/>
              <FunnelRow label="Leads" value={stats.totalLeads} percent={stats.totalProspects ? (stats.totalLeads / stats.totalProspects) * 100 : 0}/>
              <FunnelRow label="Qualified leads" value={stats.qualifiedLeads} percent={stats.totalLeads ? (stats.qualifiedLeads / stats.totalLeads) * 100 : 0}/>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="p-6">
            <SectionHeader title="Leads by source" description="Where current leads came from." href="/leads" />
            <div className="mt-5 space-y-4">
              {stats.leadsBySource.length ? stats.leadsBySource.map((source) => (
                <div key={source.source}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-zinc-700">{source.source}</span><span className="text-muted">{source.count} · {source.qualificationRate.toFixed(0)}% qualified</span></div>
                  <div className="h-2 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${(source.count / maxSourceCount) * 100}%` }}/></div>
                </div>
              )) : <p className="py-8 text-center text-xs text-muted">No lead source data yet.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Prospecting performance" description="Actual prospect records grouped by source." href="/prospecting" />
            <div className="mt-5 space-y-4">
              {stats.prospectSources.length ? stats.prospectSources.map((source) => (
                <div key={source.source}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="font-medium text-zinc-700">{source.source}</span><span className="font-mono text-muted">{source.count}</span></div>
                  <div className="h-2 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${(source.count / maxProspectSource) * 100}%` }}/></div>
                </div>
              )) : <div className="rounded-xl border border-dashed border-border p-6 text-center"><Icon name="search" size={20}/><p className="mt-2 text-xs font-semibold text-zinc-700">No prospecting data yet</p><p className="mt-1 text-[10px] text-muted">Run a real source search or import prospects to populate this section.</p></div>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Opportunities at risk" description="Open deals without a recent update." href="/deals" />
            <div className="mt-5 space-y-3">
              {stats.atRiskDeals.length ? stats.atRiskDeals.map((deal) => (
                <Link key={deal.id} href="/deals" className="block rounded-xl border border-border p-3 transition hover:border-red-200 hover:bg-red-50/30">
                  <div className="flex items-start gap-3"><span className="mt-0.5 text-red-500"><Icon name="warning" size={16}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-800">{deal.title}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{deal.companyName}</span></span><span className="font-mono text-xs font-semibold text-zinc-800">{formatCurrency(deal.value)}</span></div>
                  <p className="mt-2 pl-7 text-[10px] text-red-600">No update for {deal.staleDays} days</p>
                </Link>
              )) : <div className="rounded-xl border border-dashed border-border p-7 text-center"><span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Icon name="check" size={17}/></span><p className="mt-2 text-xs font-semibold text-zinc-700">No stale open deals</p><p className="mt-1 text-[10px] text-muted">Great — your current open pipeline is being updated.</p></div>}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
          <Card className="p-6">
            <SectionHeader title="Activities today" description="Latest activity across the workspace." href="/activities" />
            <div className="mt-5 divide-y divide-border">
              {stats.activities.length ? stats.activities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Icon name={activity.type === "CALL" ? "phone" : activity.type === "EMAIL" ? "mail" : activity.type === "MEETING" ? "calendar" : "activity"} size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-800">{activity.subject}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{activity.type.replaceAll("_", " ")}{activity.companyName ? ` · ${activity.companyName}` : ""}</span></span><span className="shrink-0 text-[10px] text-muted">{formatTime(activity.occurredAt)}</span></div>
              )) : <p className="py-8 text-center text-xs text-muted">No recent activity.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Meetings today" description={`${stats.meetingsToday} scheduled today.`} href="/meetings" />
            <div className="mt-5 space-y-3">
              {stats.meetings.length ? stats.meetings.map((meeting) => (
                <Link key={meeting.id} href="/meetings" className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-zinc-50"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon name="calendar" size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{meeting.title}</span><span className="mt-0.5 block truncate text-[10px] text-muted">{meeting.companyName || "No company"}</span></span><span className="text-[10px] font-semibold text-blue-600">{formatTime(meeting.startsAt)}</span></Link>
              )) : <p className="py-8 text-center text-xs text-muted">No meetings scheduled today.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="Forecast overview" description="Based on opportunity probability data." href="/reports" />
            <div className="mt-5 space-y-4">
              <ForecastRow label="Pipeline" value={stats.forecast.pipeline}/>
              <ForecastRow label="Weighted" value={stats.forecast.weighted}/>
              <ForecastRow label="Committed" value={stats.forecast.committed}/>
              <ForecastRow label="Won" value={stats.forecast.won}/>
            </div>
            <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-[10px] text-muted">A formal monthly target is not stored in the current data model, so OSOZ does not invent a target or forecast gap.</div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <Card className="p-6">
            <SectionHeader title="Team performance" description="Current opportunity ownership and weighted pipeline." href="/reports" />
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead><tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted"><th className="pb-2 font-medium">Owner</th><th className="pb-2 font-medium">Pipeline</th><th className="pb-2 font-medium">Weighted</th><th className="pb-2 font-medium">Won</th><th className="pb-2 font-medium">Deals</th></tr></thead><tbody>{stats.teamPerformance.length ? stats.teamPerformance.map((member) => <tr key={member.id} className="border-b border-border/70 last:border-0"><td className="py-3 font-semibold text-zinc-800">{member.username}</td><td className="py-3 font-mono">{formatCurrency(member.pipeline)}</td><td className="py-3 font-mono">{formatCurrency(member.weighted)}</td><td className="py-3 font-mono text-emerald-600">{formatCurrency(member.won)}</td><td className="py-3 text-muted">{member.opportunities}</td></tr>) : <tr><td colSpan={5} className="py-10 text-center text-muted">No assigned opportunities yet.</td></tr>}</tbody></table></div>
          </Card>

          <Card className="p-6">
            <SectionHeader title="OSOZ smart insights" description="Deterministic insights from current CRM data." />
            <div className="mt-5 space-y-3">
              {stats.insights.length ? stats.insights.map((insight, index) => {
                const tone = insight.tone === "warning" ? "bg-red-50 text-red-600" : insight.tone === "success" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600";
                return <Link key={`${insight.title}-${index}`} href={insight.href} className="flex gap-3 rounded-xl border border-border p-3 hover:bg-zinc-50"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon name={insight.tone === "warning" ? "warning" : insight.tone === "success" ? "check" : "activity"} size={15}/></span><span><span className="block text-xs font-semibold text-zinc-800">{insight.title}</span><span className="mt-0.5 block text-[10px] leading-4 text-muted">{insight.detail}</span></span></Link>;
              }) : <p className="py-8 text-center text-xs text-muted">More insights will appear as CRM data grows.</p>}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function FunnelRow({ label, value, percent }: { label: string; value: number; percent?: number }) {
  return <div className="rounded-xl border border-border p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-zinc-700">{label}</span><span className="font-mono text-xs font-semibold text-zinc-800">{value.toLocaleString()}</span></div>{percent !== undefined && <div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-zinc-100"><div className="h-full rounded-full bg-indigo-500" style={{width: `${Math.min(100, Math.max(0, percent))}%`}}/></div><span className="w-10 text-right text-[9px] text-muted">{percent.toFixed(1)}%</span></div>}</div>;
}

function ForecastRow({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"><span className="text-xs text-muted">{label}</span><span className="font-mono text-sm font-semibold text-zinc-800">{formatCurrency(value)}</span></div>;
}
