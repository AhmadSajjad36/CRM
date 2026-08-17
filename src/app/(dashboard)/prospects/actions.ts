"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const clean = (value: unknown) => String(value ?? "").trim() || null;

function clampScore(value: unknown) {
  return Math.max(0, Math.min(100, Number(value ?? 0) || 0));
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  try {
    const parsed = JSON.parse(String(value ?? "{}"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function auditMeta(values: Record<string, unknown>) {
  return JSON.stringify(values);
}

async function writeAudit(workspaceId: string, userId: string | null, action: string, prospectId: string | null, metadata: Record<string, unknown> = {}) {
  await prisma.auditLog.create({
    data: {
      workspaceId,
      userId,
      action,
      entity: "Prospect",
      entityId: prospectId,
      metadata: auditMeta(metadata),
    },
  });
}

export async function createProspect(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const firstName = clean(formData.get("firstName"));
  const lastName = clean(formData.get("lastName"));
  const fullName = clean(formData.get("fullName")) || [firstName, lastName].filter(Boolean).join(" ") || null;
  const email = clean(formData.get("email"));
  const phone = clean(formData.get("phone"));
  const companyName = clean(formData.get("companyName"));

  if (!fullName && !email && !phone && !companyName) {
    throw new Error("Add a name, email, phone, or company to identify the prospect.");
  }

  if (email || phone) {
    const duplicate = await prisma.prospect.findFirst({
      where: {
        workspaceId: user.workspaceId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }, { mobile: phone }] : []),
        ],
      },
      select: { id: true },
    });
    if (duplicate) throw new Error("A prospect with this email or phone already exists.");
  }

  const prospect = await prisma.prospect.create({
    data: {
      workspaceId: user.workspaceId,
      ownerId: user.id,
      firstName,
      lastName,
      fullName,
      companyName,
      jobTitle: clean(formData.get("jobTitle")),
      email,
      phone,
      mobile: clean(formData.get("mobile")),
      website: clean(formData.get("website")),
      linkedinUrl: clean(formData.get("linkedinUrl")),
      address: clean(formData.get("address")),
      city: clean(formData.get("city")),
      state: clean(formData.get("state")),
      postalCode: clean(formData.get("postalCode")),
      country: clean(formData.get("country")),
      industry: clean(formData.get("industry")),
      source: clean(formData.get("source")) ?? "Manual",
      sourceUrl: clean(formData.get("sourceUrl")),
      sourceMetadata: clean(formData.get("sourceMetadata")) ?? "{}",
      status: clean(formData.get("status")) ?? "NEW",
      notes: clean(formData.get("notes")),
      score: clampScore(formData.get("score")),
      rawData: "{}",
      customFields: "{}",
    },
  });

  await writeAudit(user.workspaceId, user.id, "PROSPECT_CREATED", prospect.id, {
    source: prospect.source,
    sourceUrl: prospect.sourceUrl,
  });

  revalidatePath("/prospects");
  return prospect.id;
}

export async function updateProspect(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.prospect.findFirst({ where: { id, workspaceId: user.workspaceId } });
  if (!existing) throw new Error("Prospect not found.");

  const email = clean(formData.get("email"));
  if (email) {
    const duplicate = await prisma.prospect.findFirst({
      where: { workspaceId: user.workspaceId, email, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) throw new Error("Another prospect already uses this email.");
  }

  const nextStatus = clean(formData.get("status")) ?? "NEW";
  const nextScore = clampScore(formData.get("score"));

  await prisma.prospect.update({
    where: { id },
    data: {
      firstName: clean(formData.get("firstName")),
      lastName: clean(formData.get("lastName")),
      fullName: clean(formData.get("fullName")),
      companyName: clean(formData.get("companyName")),
      jobTitle: clean(formData.get("jobTitle")),
      email,
      phone: clean(formData.get("phone")),
      mobile: clean(formData.get("mobile")),
      website: clean(formData.get("website")),
      linkedinUrl: clean(formData.get("linkedinUrl")),
      address: clean(formData.get("address")),
      city: clean(formData.get("city")),
      state: clean(formData.get("state")),
      postalCode: clean(formData.get("postalCode")),
      country: clean(formData.get("country")),
      industry: clean(formData.get("industry")),
      source: clean(formData.get("source")) ?? "Manual",
      sourceUrl: clean(formData.get("sourceUrl")),
      status: nextStatus,
      notes: clean(formData.get("notes")),
      score: nextScore,
    },
  });

  await writeAudit(user.workspaceId, user.id, "PROSPECT_UPDATED", id, {
    previousStatus: existing.status,
    status: nextStatus,
    previousScore: existing.score,
    score: nextScore,
  });

  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
}

export async function deleteProspect(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  const id = String(formData.get("id") ?? "");
  const existing = await prisma.prospect.findFirst({ where: { id, workspaceId: user.workspaceId }, select: { id: true, fullName: true, email: true } });
  if (!existing) return;

  await writeAudit(user.workspaceId, user.id, "PROSPECT_DELETED", id, {
    name: existing.fullName,
    email: existing.email,
  });
  await prisma.prospect.deleteMany({ where: { id, workspaceId: user.workspaceId } });
  revalidatePath("/prospects");
}

export async function importProspects(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const rows = JSON.parse(String(formData.get("rows") ?? "[]")) as Record<string, unknown>[];
  const mapping = parseJsonObject(formData.get("mapping"));
  const source = clean(formData.get("source")) ?? "CSV Import";
  const filename = clean(formData.get("filename")) ?? "import";
  const duplicateMode = String(formData.get("duplicateMode") ?? "skip");

  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 5000) {
    throw new Error("Import must contain between 1 and 5,000 rows.");
  }

  const job = await prisma.importJob.create({
    data: { workspaceId: user.workspaceId, userId: user.id, filename, source, totalRows: rows.length, status: "PROCESSING" },
  });

  let imported = 0;
  let duplicates = 0;
  let failed = 0;
  const errors: Array<{ row: number; reason: string }> = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] ?? {};
    const get = (field: string) => clean(row[String(mapping[field] ?? "")]);
    const email = get("email");
    const phone = get("phone") ?? get("mobile");
    const companyName = get("companyName");
    const firstName = get("firstName");
    const lastName = get("lastName");
    const fullName = get("fullName") || [firstName, lastName].filter(Boolean).join(" ") || null;

    if (!email && !phone && !fullName && !companyName) {
      failed++;
      errors.push({ row: index + 2, reason: "No name, email, phone, or company identifier." });
      continue;
    }

    const duplicate = await prisma.prospect.findFirst({
      where: {
        workspaceId: user.workspaceId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }, { mobile: phone }] : []),
          ...(fullName && companyName ? [{ fullName, companyName }] : []),
        ],
      },
      select: { id: true },
    });

    const usedColumns = new Set(Object.values(mapping).map((value) => String(value)));
    const customFields = Object.fromEntries(
      Object.entries(row).filter(([key]) => !usedColumns.has(key) && String(row[key] ?? "") !== "")
    );

    const data = {
      workspaceId: user.workspaceId,
      ownerId: user.id,
      firstName,
      lastName,
      fullName,
      companyName,
      jobTitle: get("jobTitle"),
      email,
      phone,
      mobile: get("mobile"),
      website: get("website"),
      linkedinUrl: get("linkedinUrl"),
      address: get("address"),
      city: get("city"),
      state: get("state"),
      postalCode: get("postalCode"),
      country: get("country"),
      industry: get("industry"),
      source,
      sourceUrl: get("sourceUrl"),
      sourceMetadata: JSON.stringify({ filename, importedAt: new Date().toISOString() }),
      status: get("status") ?? "NEW",
      notes: get("notes"),
      score: clampScore(get("score")),
      customFields: JSON.stringify(customFields),
      rawData: JSON.stringify(row),
      importJobId: job.id,
    };

    if (duplicate) {
      duplicates++;
      if (duplicateMode === "update") {
        await prisma.prospect.update({ where: { id: duplicate.id }, data });
        await writeAudit(user.workspaceId, user.id, "PROSPECT_IMPORTED_UPDATED", duplicate.id, { jobId: job.id, filename, source });
        imported++;
      } else if (duplicateMode === "create") {
        const created = await prisma.prospect.create({ data });
        await writeAudit(user.workspaceId, user.id, "PROSPECT_IMPORTED", created.id, { jobId: job.id, filename, source, duplicate: true });
        imported++;
      }
      continue;
    }

    try {
      const created = await prisma.prospect.create({ data });
      await writeAudit(user.workspaceId, user.id, "PROSPECT_IMPORTED", created.id, { jobId: job.id, filename, source });
      imported++;
    } catch {
      failed++;
      errors.push({ row: index + 2, reason: "Database validation failed." });
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: failed ? (imported ? "COMPLETED_WITH_ERRORS" : "FAILED") : "COMPLETED",
      importedRows: imported,
      duplicateRows: duplicates,
      failedRows: failed,
      errors: JSON.stringify(errors),
    },
  });

  await writeAudit(user.workspaceId, user.id, "PROSPECT_IMPORT_COMPLETED", null, { jobId: job.id, filename, source, imported, duplicates, failed });

  revalidatePath("/prospects");
  revalidatePath("/imports");
  return { imported, duplicates, failed, jobId: job.id };
}
