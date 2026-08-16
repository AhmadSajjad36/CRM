import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getDeals() {
  const user = await getCurrentUser();
  if (!user) return [];
  return prisma.deal.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: [{ stage: "asc" }, { position: "asc" }],
    include: { contact: { select: { name: true } } },
  });
}
export type DealWithContact = Awaited<ReturnType<typeof getDeals>>[number];
