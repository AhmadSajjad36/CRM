import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getContacts() {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.contact.findMany({ where: { workspaceId: user.workspaceId }, orderBy: { createdAt: "desc" } });
}

export async function getContact(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;
  return prisma.contact.findFirst({ where: { id, workspaceId: user.workspaceId } });
}
