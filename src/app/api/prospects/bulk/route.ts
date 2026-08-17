import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ids?: unknown; action?: unknown; value?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean).slice(0, 500) : [];
  const action = String(body.action ?? "");
  const value = String(body.value ?? "");
  if (!ids.length) return NextResponse.json({ error: "Select at least one prospect." }, { status: 422 });

  const scoped = { workspaceId: user.workspaceId, id: { in: ids } };
  const existing = await prisma.prospect.findMany({ where: scoped, select: { id: true, status: true } });

  if (action === "status") {
    if (!["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "ARCHIVED"].includes(value)) return NextResponse.json({ error: "Invalid status." }, { status: 422 });
    await prisma.prospect.updateMany({ where: scoped, data: { status: value } });
  } else if (action === "archive") {
    await prisma.prospect.updateMany({ where: scoped, data: { status: "ARCHIVED" } });
  } else if (action === "owner") {
    if (!value) return NextResponse.json({ error: "Choose an owner." }, { status: 422 });
    const owner = await prisma.user.findFirst({ where: { id: value, workspaceId: user.workspaceId }, select: { id: true } });
    if (!owner) return NextResponse.json({ error: "Owner not found." }, { status: 404 });
    await prisma.prospect.updateMany({ where: scoped, data: { ownerId: owner.id } });
  } else if (action === "delete") {
    await prisma.prospect.deleteMany({ where: scoped });
  } else {
    return NextResponse.json({ error: "Unsupported bulk action." }, { status: 422 });
  }

  const auditAction = action === "delete" ? "PROSPECT_BULK_DELETED" : action === "archive" ? "PROSPECT_ARCHIVED" : action === "owner" ? "PROSPECT_OWNER_CHANGED" : "PROSPECT_STATUS_CHANGED";
  if (existing.length) {
    await prisma.auditLog.createMany({
      data: existing.map((item) => ({
        workspaceId: user.workspaceId,
        userId: user.id,
        action: auditAction,
        entity: "Prospect",
        entityId: item.id,
        metadata: JSON.stringify({ value, previousStatus: item.status }),
      })),
    });
  }

  return NextResponse.json({ updated: existing.length });
}
