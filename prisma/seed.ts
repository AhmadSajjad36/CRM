import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { hashPassword } from "../src/lib/password.ts";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const contacts = [
  {
    name: "Ava Thompson",
    email: "ava.thompson@northwind.io",
    phone: "+1 (415) 555-0112",
    companyName: "Northwind Labs",
    status: "customer",
    notes: "Renewed annual plan in March. Champion for the analytics module.",
  },
  {
    name: "Marcus Lee",
    email: "marcus.lee@hooli.com",
    phone: "+1 (650) 555-0143",
    companyName: "Hooli",
    status: "active",
    notes: "Evaluating the team tier. Wants SSO before rollout.",
  },
  {
    name: "Priya Nair",
    email: "priya.nair@acme.dev",
    phone: "+44 20 7946 0321",
    companyName: "Acme Corp",
    status: "lead",
    notes: "Inbound from the pricing page. Booked a demo for next week.",
  },
  {
    name: "Diego Alvarez",
    email: "diego.alvarez@globex.com",
    phone: "+1 (312) 555-0198",
    companyName: "Globex",
    status: "customer",
    notes: "Expanded to 40 seats last quarter.",
  },
  {
    name: "Sofia Rossi",
    email: "sofia.rossi@initech.com",
    phone: "+39 02 8051 2277",
    companyName: "Initech",
    status: "churned",
    notes: "Downgraded then cancelled — cited budget cuts. Worth a re-engage in Q3.",
  },
  {
    name: "Liam O'Brien",
    email: "liam.obrien@umbrella.co",
    phone: "+353 1 437 2210",
    companyName: "Umbrella Co",
    status: "lead",
    notes: "Met at SaaStr. Forwarding to a wider buying committee.",
  },
  {
    name: "Hana Kim",
    email: "hana.kim@piedpiper.com",
    phone: "+1 (206) 555-0167",
    companyName: "Pied Piper",
    status: "active",
    notes: "In a 30-day trial. Heavy API usage — good upsell signal.",
  },
  {
    name: "Noah Schmidt",
    email: "noah.schmidt@vandelay.com",
    phone: "+49 30 901820",
    companyName: "Vandelay Industries",
    status: "lead",
    notes: "Requested a security questionnaire.",
  },
  {
    name: "Emma Dubois",
    email: "emma.dubois@soylent.com",
    phone: "+33 1 70 18 99 00",
    companyName: "Soylent",
    status: "customer",
    notes: "Reference customer — happy to do a case study.",
  },
  {
    name: "Yuki Tanaka",
    email: "yuki.tanaka@cyberdyne.com",
    phone: "+81 3 6743 1200",
    companyName: "Cyberdyne Systems",
    status: "active",
    notes: "Migrating from a competitor. Onboarding scheduled.",
  },
];

type SeedDeal = {
  title: string;
  value: number;
  stage: string;
  position: number;
  companyName: string;
  contactEmail?: string;
  closedAt?: string; // ISO date — set for won deals
};

// The active pipeline: 8 deals spread across the five stages. Some are tied to a
// seeded contact via their email; `position` orders cards within a stage.
const deals: SeedDeal[] = [
  { title: "Acme — Pilot rollout", value: 12000, stage: "lead", position: 0, companyName: "Acme Corp", contactEmail: "priya.nair@acme.dev" },
  { title: "Umbrella — Team plan", value: 8400, stage: "lead", position: 1, companyName: "Umbrella Co", contactEmail: "liam.obrien@umbrella.co" },
  { title: "Hooli — Enterprise SSO", value: 48000, stage: "contacted", position: 0, companyName: "Hooli", contactEmail: "marcus.lee@hooli.com" },
  { title: "Vandelay — Security review", value: 16500, stage: "contacted", position: 1, companyName: "Vandelay Industries", contactEmail: "noah.schmidt@vandelay.com" },
  { title: "Pied Piper — Usage upsell", value: 22000, stage: "proposal", position: 0, companyName: "Pied Piper", contactEmail: "hana.kim@piedpiper.com" },
  { title: "Cyberdyne — Migration", value: 75000, stage: "proposal", position: 1, companyName: "Cyberdyne Systems", contactEmail: "yuki.tanaka@cyberdyne.com" },
  { title: "Northwind — Annual renewal", value: 36000, stage: "won", position: 6, companyName: "Northwind Labs", contactEmail: "ava.thompson@northwind.io", closedAt: "2026-05-09" },
  { title: "Initech — Expansion", value: 9500, stage: "lost", position: 0, companyName: "Initech", contactEmail: "sofia.rossi@initech.com" },
];

// Historically-won deals across the last ~6 months, so the dashboard's
// revenue-by-month chart reflects a real trend. These also live in the Won
// column of the board.
const closedDeals: SeedDeal[] = [
  { title: "Northwind — Initial contract", value: 18000, stage: "won", position: 0, companyName: "Northwind Labs", contactEmail: "ava.thompson@northwind.io", closedAt: "2025-12-12" },
  { title: "Hooli — Q4 expansion", value: 27500, stage: "won", position: 1, companyName: "Hooli", contactEmail: "marcus.lee@hooli.com", closedAt: "2026-01-15" },
  { title: "Globex — Add-on seats", value: 19500, stage: "won", position: 2, companyName: "Globex", contactEmail: "diego.alvarez@globex.com", closedAt: "2026-02-08" },
  { title: "Soylent — Renewal", value: 22000, stage: "won", position: 3, companyName: "Soylent", contactEmail: "emma.dubois@soylent.com", closedAt: "2026-02-20" },
  { title: "Soylent — Onboarding package", value: 33000, stage: "won", position: 4, companyName: "Soylent", contactEmail: "emma.dubois@soylent.com", closedAt: "2026-03-18" },
  { title: "Globex — Platform license", value: 52000, stage: "won", position: 5, companyName: "Globex", contactEmail: "diego.alvarez@globex.com", closedAt: "2026-04-22" },
];

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.note.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  const workspace = await prisma.workspace.create({
    data: { name: "OSOZ Demo Workspace", slug: "osoz-demo" },
  });
  const user = await prisma.user.create({
    data: {
      username: "admin",
      passwordHash: await hashPassword("admin123"),
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });
  console.log("Seeded OSOZ workspace + admin / admin123.");

  const emailToId = new Map<string, string>();
  for (const contact of contacts) {
    const { companyName, ...contactData } = contact;
    const created = await prisma.contact.create({ data: { ...contactData, companyName, workspaceId: workspace.id } });
    emailToId.set(created.email, created.id);
  }
  console.log(`Seeded ${contacts.length} contacts.`);

  const allDeals = [...deals, ...closedDeals];
  for (const { contactEmail, closedAt, ...deal } of allDeals) {
    await prisma.deal.create({
      data: {
        workspaceId: workspace.id,
        ...deal,
        closedAt: closedAt ? new Date(closedAt) : null,
        contactId: contactEmail ? (emailToId.get(contactEmail) ?? null) : null,
      },
    });
  }
  console.log(`Seeded ${allDeals.length} deals.`);
  const companyNames = [...new Set(contacts.map((c) => c.companyName).filter(Boolean) as string[])];
  const companyMap = new Map<string, string>();
  for (const name of companyNames) {
    const company = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name,
        type: "PROSPECT",
        industry: "Healthcare",
      },
    });
    companyMap.set(name, company.id);
  }

  const leadSeeds = [
    { firstName: "Priya", lastName: "Nair", title: "Billing Manager", email: "priya.nair@acme.dev", companyName: "Acme Corp", score: 82, status: "QUALIFIED" },
    { firstName: "Marcus", lastName: "Lee", title: "Practice Administrator", email: "marcus.lee@hooli.com", companyName: "Hooli", score: 68, status: "CONTACTED" },
    { firstName: "Noah", lastName: "Schmidt", title: "Operations Director", email: "noah.schmidt@vandelay.com", companyName: "Vandelay Industries", score: 91, status: "NEW" },
  ];
  for (const lead of leadSeeds) {
    await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        title: lead.title,
        email: lead.email,
        companyId: companyMap.get(lead.company),
        score: lead.score,
        status: lead.status,
        priority: lead.score >= 80 ? "HIGH" : "MEDIUM",
        source: "Seed",
        industry: "Healthcare",
      },
    });
  }

  const pipeline = await prisma.pipeline.create({
    data: {
      workspaceId: workspace.id,
      name: "Sales Pipeline",
      isDefault: true,
      stages: {
        create: [
          { name: "Lead", key: "lead", position: 0, probability: 10 },
          { name: "Contacted", key: "contacted", position: 1, probability: 25 },
          { name: "Qualified", key: "qualified", position: 2, probability: 50 },
          { name: "Meeting", key: "meeting", position: 3, probability: 65 },
          { name: "Proposal", key: "proposal", position: 4, probability: 75 },
          { name: "Negotiation", key: "negotiation", position: 5, probability: 90 },
          { name: "Won", key: "won", position: 6, probability: 100 },
          { name: "Lost", key: "lost", position: 7, probability: 0 },
        ],
      },
    },
    include: { stages: true },
  });
  const proposal = pipeline.stages.find((s) => s.key === "proposal")!;
  const qualified = pipeline.stages.find((s) => s.key === "qualified")!;
  await prisma.opportunity.create({
    data: {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: proposal.id,
      name: "Acme Revenue Cycle Optimization",
      amount: 25000,
      probability: 75,
      companyId: companyMap.get("Acme Corp"),
      ownerId: user.id,
      position: 0,
    },
  });
  await prisma.opportunity.create({
    data: {
      workspaceId: workspace.id,
      pipelineId: pipeline.id,
      stageId: qualified.id,
      name: "Hooli Billing Operations",
      amount: 18000,
      probability: 50,
      companyId: companyMap.get("Hooli"),
      ownerId: user.id,
      position: 0,
    },
  });
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      assigneeId: user.id,
      title: "Follow up with qualified leads",
      priority: "HIGH",
      status: "TODO",
      dueAt: new Date(Date.now() + 2 * 86400000),
    },
  });
  await prisma.activity.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      type: "NOTE",
      subject: "OSOZ CRM initialized",
      description: "Workspace, pipeline and core CRM records created by seed.",
    },
  });
  await prisma.note.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      content: "Welcome to OSOZ — One Stop Online Zone.",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
