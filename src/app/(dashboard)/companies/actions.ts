"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function createCompany(formData: FormData) {
  const user = await getCurrentUser(); if (!user) return;
  const name = String(formData.get("name") ?? "").trim(); if (!name) return;
  await prisma.company.create({ data: {
    workspaceId: user.workspaceId, name,
    website: String(formData.get("website") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    industry: String(formData.get("industry") ?? "").trim() || null,
    type: String(formData.get("type") ?? "PROSPECT"),
    location: String(formData.get("location") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  }});
  revalidatePath("/companies");
}
export async function deleteCompany(formData: FormData) {
  const user = await getCurrentUser(); const id=String(formData.get("id")??"");
  if (!user || !id) return;
  await prisma.company.deleteMany({where:{id,workspaceId:user.workspaceId}});
  revalidatePath("/companies");
}
