import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const text = (v: unknown) => String(v ?? "").trim() || null;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = text(body.email);
  const phone = text(body.phone);
  const fullName = text(body.full_name ?? body.fullName) || [text(body.first_name ?? body.firstName), text(body.last_name ?? body.lastName)].filter(Boolean).join(" ") || null;
  const company = text(body.company ?? body.companyName);
  if (!email && !phone && !fullName && !company) return NextResponse.json({ error: "A prospect needs an identifier." }, { status: 422 });

  const duplicate = await prisma.prospect.findFirst({
    where: { workspaceId: user.workspaceId, OR: [...(email ? [{ email }] : []), ...(phone ? [{ phone }, { mobile: phone }] : []), ...(fullName && company ? [{ fullName, companyName: company }] : [])] },
    select: { id: true },
  });
  if (duplicate) return NextResponse.json({ duplicate: true, id: duplicate.id }, { status: 409 });

  const standard = new Set(["email","phone","mobile","full_name","fullName","first_name","firstName","last_name","lastName","company","companyName","job_title","jobTitle","website","linkedin","linkedinUrl","address","city","state","postal_code","postalCode","country","industry","source","sourceUrl","status","score","notes","custom_fields","raw_data"]);
  const custom = Object.fromEntries(Object.entries(body).filter(([key]) => !standard.has(key)));
  const raw = body.raw_data && typeof body.raw_data === "object" ? body.raw_data : body;

  const prospect = await prisma.prospect.create({
    data: {
      workspaceId: user.workspaceId,
      ownerId: user.id,
      firstName: text(body.first_name ?? body.firstName),
      lastName: text(body.last_name ?? body.lastName),
      fullName,
      companyName: company,
      jobTitle: text(body.job_title ?? body.jobTitle),
      email,
      phone,
      mobile: text(body.mobile),
      website: text(body.website),
      linkedinUrl: text(body.linkedin ?? body.linkedinUrl),
      address: text(body.address),
      city: text(body.city),
      state: text(body.state),
      postalCode: text(body.postal_code ?? body.postalCode),
      country: text(body.country),
      industry: text(body.industry),
      source: text(body.source) ?? "API",
      sourceUrl: text(body.sourceUrl),
      sourceMetadata: JSON.stringify(body.source_metadata && typeof body.source_metadata === "object" ? body.source_metadata : {}),
      status: text(body.status) ?? "NEW",
      score: Math.max(0, Math.min(100, Number(body.score ?? 0) || 0)),
      notes: text(body.notes),
      customFields: JSON.stringify(body.custom_fields && typeof body.custom_fields === "object" ? body.custom_fields : custom),
      rawData: JSON.stringify(raw),
    },
  });

  await prisma.auditLog.create({
    data: { workspaceId: user.workspaceId, userId: user.id, action: "PROSPECT_API_CREATED", entity: "Prospect", entityId: prospect.id, metadata: JSON.stringify({ source: prospect.source, sourceUrl: prospect.sourceUrl }) },
  });

  return NextResponse.json({ id: prospect.id, created: true }, { status: 201 });
}
