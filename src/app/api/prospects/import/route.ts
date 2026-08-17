import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const clean = (value: unknown) => String(value ?? "").trim() || null;
const clampScore = (value: unknown) => Math.max(0, Math.min(100, Number(value ?? 0) || 0));
function parseObject(value: unknown): Record<string, unknown> { try { const parsed = JSON.parse(String(value ?? "{}")); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } }

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  let rows: Record<string, unknown>[];
  try { rows = JSON.parse(String(formData.get("rows") ?? "[]")); } catch { return NextResponse.json({ error: "Invalid import rows." }, { status: 400 }); }
  const mapping = parseObject(formData.get("mapping"));
  const source = clean(formData.get("source")) ?? "CSV Import";
  const filename = clean(formData.get("filename")) ?? "import";
  const duplicateMode = String(formData.get("duplicateMode") ?? "skip");

  if (!Array.isArray(rows) || rows.length < 1 || rows.length > 5000) return NextResponse.json({ error: "Import must contain between 1 and 5,000 rows." }, { status: 422 });

  const job = await prisma.importJob.create({ data: { workspaceId: user.workspaceId, userId: user.id, filename, source, totalRows: rows.length, status: "PROCESSING" } });
  const usedColumns = new Set(Object.values(mapping).map(String));
  let imported = 0, duplicates = 0, failed = 0;
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
      where: { workspaceId: user.workspaceId, OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }, { mobile: phone }] : []), ...(fullName && companyName ? [{ fullName, companyName }] : [])] },
      select: { id: true },
    });

    const customFields = Object.fromEntries(Object.entries(row).filter(([key]) => !usedColumns.has(key) && String(row[key] ?? "") !== ""));
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

    try {
      if (duplicate) {
        duplicates++;
        if (duplicateMode === "update") { await prisma.prospect.update({ where: { id: duplicate.id }, data }); imported++; }
        else if (duplicateMode === "create") { await prisma.prospect.create({ data }); imported++; }
        continue;
      }
      await prisma.prospect.create({ data });
      imported++;
    } catch {
      failed++;
      errors.push({ row: index + 2, reason: "Database validation failed." });
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: { status: failed ? (imported ? "COMPLETED_WITH_ERRORS" : "FAILED") : "COMPLETED", importedRows: imported, duplicateRows: duplicates, failedRows: failed, errors: JSON.stringify(errors) },
  });

  await prisma.auditLog.create({
    data: { workspaceId: user.workspaceId, userId: user.id, action: "PROSPECT_IMPORT_COMPLETED", entity: "ImportJob", entityId: job.id, metadata: JSON.stringify({ filename, source, imported, duplicates, failed }) },
  });

  return NextResponse.json({ imported, duplicates, failed, jobId: job.id });
}
