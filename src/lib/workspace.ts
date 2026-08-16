import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function getWorkspaceSummary() {
  const user = await getCurrentUser();
  if (!user) return null;
  const workspaceId = user.workspaceId;
  const [
    companies, contacts, leads, opportunities, tasks,
    activities, meetings, notes, tags, unreadNotifications,
  ] = await Promise.all([
    prisma.company.count({ where: { workspaceId } }),
    prisma.contact.count({ where: { workspaceId } }),
    prisma.lead.count({ where: { workspaceId } }),
    prisma.opportunity.count({ where: { workspaceId } }),
    prisma.task.count({ where: { workspaceId } }),
    prisma.activity.count({ where: { workspaceId } }),
    prisma.meeting.count({ where: { workspaceId } }),
    prisma.note.count({ where: { workspaceId } }),
    prisma.tag.count({ where: { workspaceId } }),
    prisma.notification.count({ where: { workspaceId, userId: user.id, readAt: null } }),
  ]);
  return { companies, contacts, leads, opportunities, tasks, activities, meetings, notes, tags, unreadNotifications };
}
