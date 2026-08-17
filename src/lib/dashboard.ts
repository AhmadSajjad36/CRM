import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { DEAL_STAGES, type DealStage } from "@/lib/deal-stage";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type StageSummary = {
  stage: DealStage;
  count: number;
  value: number;
};

export type MonthRevenue = {
  key: string;
  label: string;
  total: number;
};

export type SourceSummary = {
  source: string;
  count: number;
  qualified: number;
  qualificationRate: number;
};

export type DashboardTask = {
  id: string;
  title: string;
  priority: string;
  status: string;
  dueAt: string | null;
  companyName: string | null;
};

export type DashboardActivity = {
  id: string;
  type: string;
  subject: string;
  occurredAt: string;
  companyName: string | null;
};

export type DashboardMeeting = {
  id: string;
  title: string;
  startsAt: string;
  companyName: string | null;
};

export type AtRiskDeal = {
  id: string;
  title: string;
  value: number;
  stage: string;
  companyName: string | null;
  updatedAt: string;
  staleDays: number;
};

export type TeamPerformance = {
  id: string;
  username: string;
  pipeline: number;
  won: number;
  weighted: number;
  opportunities: number;
};

export type ForecastSummary = {
  target: number | null;
  pipeline: number;
  weighted: number;
  committed: number;
  won: number;
};

export type DashboardInsight = {
  tone: "info" | "success" | "warning";
  title: string;
  detail: string;
  href: string;
};

export type DashboardStats = {
  workspaceName: string;
  username: string;
  totalProspects: number;
  newProspects: number;
  qualifiedProspects: number;
  contactedProspects: number;
  totalCompanies: number;
  totalContacts: number;
  totalLeads: number;
  qualifiedLeads: number;
  totalDeals: number;
  openDeals: number;
  pipelineValue: number;
  wonValue: number;
  conversionRate: number | null;
  tasksDueToday: number;
  overdueTasks: number;
  upcomingTasks: number;
  meetingsToday: number;
  activitiesToday: number;
  byStage: StageSummary[];
  revenueByMonth: MonthRevenue[];
  leadsBySource: SourceSummary[];
  prospectSources: { source: string; count: number }[];
  tasks: DashboardTask[];
  activities: DashboardActivity[];
  meetings: DashboardMeeting[];
  atRiskDeals: AtRiskDeal[];
  teamPerformance: TeamPerformance[];
  forecast: ForecastSummary;
  insights: DashboardInsight[];
};

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function endOfToday() {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function daysSince(date: Date) {
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

export async function getDashboardStats(months = 6): Promise<DashboardStats> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const workspaceId = user.workspaceId;
  const today = startOfToday();
  const tomorrow = endOfToday();
  const monthStart = startOfMonth();

  const [
    totalProspects,
    newProspects,
    qualifiedProspects,
    contactedProspects,
    totalCompanies,
    totalContacts,
    totalLeads,
    qualifiedLeads,
    groupedDeals,
    wonDeals,
    tasksDueToday,
    overdueTasks,
    upcomingTasks,
    meetingsToday,
    activitiesToday,
    recentTasks,
    recentActivities,
    todayMeetings,
    leadSourceGroups,
    prospectSourceGroups,
    staleDeals,
    opportunities,
  ] = await Promise.all([
    prisma.prospect.count({ where: { workspaceId } }),
    prisma.prospect.count({ where: { workspaceId, createdAt: { gte: monthStart } } }),
    prisma.prospect.count({ where: { workspaceId, status: "QUALIFIED" } }),
    prisma.prospect.count({ where: { workspaceId, status: "CONTACTED" } }),
    prisma.company.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.lead.count({ where: { workspaceId } }),
    prisma.lead.count({ where: { workspaceId, status: "QUALIFIED" } }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: { workspaceId },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.deal.findMany({
      where: { workspaceId, stage: "won", closedAt: { not: null } },
      select: { value: true, closedAt: true },
    }),
    prisma.task.count({ where: { workspaceId, status: { not: "COMPLETED" }, dueAt: { gte: today, lt: tomorrow } } }),
    prisma.task.count({ where: { workspaceId, status: { not: "COMPLETED" }, dueAt: { lt: today } } }),
    prisma.task.count({ where: { workspaceId, status: { not: "COMPLETED" }, dueAt: { gte: tomorrow } } }),
    prisma.meeting.count({ where: { workspaceId, startsAt: { gte: today, lt: tomorrow } } }),
    prisma.activity.count({ where: { workspaceId, occurredAt: { gte: today, lt: tomorrow } } }),
    prisma.task.findMany({
      where: { workspaceId, status: { not: "COMPLETED" } },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: { id: true, title: true, priority: true, status: true, dueAt: true, company: { select: { name: true } } },
    }),
    prisma.activity.findMany({
      where: { workspaceId },
      orderBy: { occurredAt: "desc" },
      take: 6,
      select: { id: true, type: true, subject: true, occurredAt: true, company: { select: { name: true } } },
    }),
    prisma.meeting.findMany({
      where: { workspaceId, startsAt: { gte: today, lt: tomorrow } },
      orderBy: { startsAt: "asc" },
      take: 5,
      select: { id: true, title: true, startsAt: true, company: { select: { name: true } } },
    }),
    prisma.lead.groupBy({
      by: ["source", "status"],
      where: { workspaceId },
      _count: { _all: true },
    }),
    prisma.prospect.groupBy({
      by: ["source"],
      where: { workspaceId },
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 8,
    }),
    prisma.deal.findMany({
      where: {
        workspaceId,
        stage: { notIn: ["won", "lost"] },
      },
      orderBy: { updatedAt: "asc" },
      take: 20,
      select: { id: true, title: true, value: true, stage: true, companyName: true, updatedAt: true },
    }),
    prisma.opportunity.findMany({
      where: { workspaceId },
      select: {
        id: true,
        amount: true,
        probability: true,
        wonAt: true,
        lostAt: true,
        owner: { select: { id: true, username: true } },
      },
    }),
  ]);

  const groupMap = new Map(groupedDeals.map((g) => [g.stage, g]));
  const byStage: StageSummary[] = DEAL_STAGES.map((stage) => {
    const group = groupMap.get(stage);
    return {
      stage,
      count: group?._count._all ?? 0,
      value: group?._sum.value ?? 0,
    };
  });

  const valueOf = (stage: DealStage) => byStage.find((item) => item.stage === stage)?.value ?? 0;
  const pipelineValue = ["lead", "contacted", "proposal"]
    .reduce((sum, stage) => sum + valueOf(stage as DealStage), 0);
  const wonValue = valueOf("won");
  const totalDeals = byStage.reduce((sum, stage) => sum + stage.count, 0);
  const openDeals = byStage
    .filter((stage) => !["won", "lost"].includes(stage.stage))
    .reduce((sum, stage) => sum + stage.count, 0);

  const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : null;

  const buckets: MonthRevenue[] = [];
  const indexByKey = new Map<string, number>();
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    indexByKey.set(key, buckets.length);
    buckets.push({ key, label: MONTH_LABELS[d.getMonth()], total: 0 });
  }
  for (const deal of wonDeals) {
    if (!deal.closedAt) continue;
    const key = `${deal.closedAt.getFullYear()}-${String(deal.closedAt.getMonth() + 1).padStart(2, "0")}`;
    const index = indexByKey.get(key);
    if (index !== undefined) buckets[index].total += deal.value;
  }

  const sourceMap = new Map<string, { count: number; qualified: number }>();
  for (const row of leadSourceGroups) {
    const source = row.source?.trim() || "Unknown";
    const current = sourceMap.get(source) ?? { count: 0, qualified: 0 };
    current.count += row._count._all;
    if (row.status === "QUALIFIED") current.qualified += row._count._all;
    sourceMap.set(source, current);
  }
  const leadsBySource: SourceSummary[] = [...sourceMap.entries()]
    .map(([source, data]) => ({
      source,
      count: data.count,
      qualified: data.qualified,
      qualificationRate: data.count ? (data.qualified / data.count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const prospectSources = prospectSourceGroups.map((row) => ({
    source: row.source?.trim() || "Unknown",
    count: row._count._all,
  }));

  const atRiskDeals: AtRiskDeal[] = staleDeals
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      companyName: deal.companyName ?? null,
      updatedAt: deal.updatedAt.toISOString(),
      staleDays: daysSince(deal.updatedAt),
    }))
    .filter((deal) => deal.staleDays >= 5)
    .slice(0, 5);

  const teamMap = new Map<string, TeamPerformance>();
  for (const opportunity of opportunities) {
    if (!opportunity.owner) continue;
    const current = teamMap.get(opportunity.owner.id) ?? {
      id: opportunity.owner.id,
      username: opportunity.owner.username,
      pipeline: 0,
      won: 0,
      weighted: 0,
      opportunities: 0,
    };
    current.opportunities += 1;
    if (!opportunity.wonAt && !opportunity.lostAt) {
      current.pipeline += opportunity.amount;
      current.weighted += opportunity.amount * (opportunity.probability / 100);
    }
    if (opportunity.wonAt) current.won += opportunity.amount;
    teamMap.set(opportunity.owner.id, current);
  }

  const forecast: ForecastSummary = {
    target: null,
    pipeline: opportunities.filter((o) => !o.wonAt && !o.lostAt).reduce((sum, o) => sum + o.amount, 0),
    weighted: opportunities.filter((o) => !o.wonAt && !o.lostAt).reduce((sum, o) => sum + o.amount * (o.probability / 100), 0),
    committed: opportunities.filter((o) => !o.wonAt && !o.lostAt && o.probability >= 75).reduce((sum, o) => sum + o.amount, 0),
    won: opportunities.filter((o) => o.wonAt).reduce((sum, o) => sum + o.amount, 0),
  };

  const insights: DashboardInsight[] = [];
  if (overdueTasks > 0) {
    insights.push({ tone: "warning", title: `${overdueTasks} overdue task${overdueTasks === 1 ? "" : "s"}`, detail: "Clear overdue work before adding new follow-ups.", href: "/tasks" });
  }
  if (atRiskDeals.length > 0) {
    insights.push({ tone: "warning", title: `${atRiskDeals.length} deal${atRiskDeals.length === 1 ? "" : "s"} need attention`, detail: "These open deals have had no update for at least five days.", href: "/deals" });
  }
  if (conversionRate !== null) {
    insights.push({ tone: "success", title: `${conversionRate.toFixed(1)}% lead qualification rate`, detail: "Based on current workspace lead statuses.", href: "/leads" });
  }
  if (totalProspects > 0) {
    insights.push({ tone: "info", title: `${totalProspects.toLocaleString()} prospects in your repository`, detail: "Use Prospecting and Imports to keep the acquisition pipeline growing.", href: "/prospects" });
  }

  return {
    workspaceName: user.workspace.name,
    username: user.username,
    totalProspects,
    newProspects,
    qualifiedProspects,
    contactedProspects,
    totalCompanies,
    totalContacts,
    totalLeads,
    qualifiedLeads,
    totalDeals,
    openDeals,
    pipelineValue,
    wonValue,
    conversionRate,
    tasksDueToday,
    overdueTasks,
    upcomingTasks,
    meetingsToday,
    activitiesToday,
    byStage,
    revenueByMonth: buckets,
    leadsBySource,
    prospectSources,
    tasks: recentTasks.map((task) => ({
      id: task.id,
      title: task.title,
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt?.toISOString() ?? null,
      companyName: task.company?.name ?? null,
    })),
    activities: recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      occurredAt: activity.occurredAt.toISOString(),
      companyName: activity.company?.name ?? null,
    })),
    meetings: todayMeetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      startsAt: meeting.startsAt.toISOString(),
      companyName: meeting.company?.name ?? null,
    })),
    atRiskDeals,
    teamPerformance: [...teamMap.values()].sort((a, b) => b.pipeline - a.pipeline).slice(0, 5),
    forecast,
    insights: insights.slice(0, 5),
  };
}