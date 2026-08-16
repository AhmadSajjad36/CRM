"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function getUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function logContactActivity(formData: FormData) {
  const user = await getUser();
  const contactId = String(formData.get("contactId") ?? "");
  const type = String(formData.get("type") ?? "NOTE");
  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!contactId || !subject) return;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId: user.workspaceId },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.activity.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      contactId,
      type,
      subject,
      description: description || null,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
}

export async function addContactNote(formData: FormData) {
  const user = await getUser();
  const contactId = String(formData.get("contactId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!contactId || !content) return;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId: user.workspaceId },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.note.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      contactId,
      content,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
}

export async function createContactTask(formData: FormData) {
  const user = await getUser();
  const contactId = String(formData.get("contactId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const priority = String(formData.get("priority") ?? "MEDIUM");
  const dueRaw = String(formData.get("dueAt") ?? "");

  if (!contactId || !title) return;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId: user.workspaceId },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.task.create({
    data: {
      workspaceId: user.workspaceId,
      contactId,
      assigneeId: user.id,
      title,
      priority,
      dueAt: dueRaw ? new Date(dueRaw) : null,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
}

export async function createContactMeeting(formData: FormData) {
  const user = await getUser();
  const contactId = String(formData.get("contactId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "");
  const endsAtRaw = String(formData.get("endsAt") ?? "");
  const location = String(formData.get("location") ?? "").trim();

  if (!contactId || !title || !startsAtRaw) return;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, workspaceId: user.workspaceId },
  });
  if (!contact) throw new Error("Contact not found");

  await prisma.meeting.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      contactId,
      title,
      startsAt: new Date(startsAtRaw),
      endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
      location: location || null,
    },
  });

  await prisma.activity.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      contactId,
      type: "MEETING",
      subject: `Meeting scheduled: ${title}`,
      description: location || null,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/meetings");
}

export async function updateContactStatus(formData: FormData) {
  const user = await getUser();
  const contactId = String(formData.get("contactId") ?? "");
  const status = String(formData.get("status") ?? "lead");

  await prisma.contact.update({
    where: { id: contactId, workspaceId: user.workspaceId },
    data: { status },
  });

  await prisma.activity.create({
    data: {
      workspaceId: user.workspaceId,
      userId: user.id,
      contactId,
      type: "STATUS_CHANGE",
      subject: `Status changed to ${status}`,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
}
