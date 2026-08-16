"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function createTag(formData: FormData) {
  const user = await getCurrentUser(); if (!user) return;
  const name = String(formData.get("name") ?? "").trim(); if (!name) return;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  await prisma.tag.upsert({ where: { workspaceId_slug: { workspaceId: user.workspaceId, slug } }, update: {}, create: { workspaceId: user.workspaceId, name, slug } });
  revalidatePath("/tags");
}
export async function deleteTag(formData: FormData) { const user=await getCurrentUser(), id=String(formData.get("id")??""); if(!user||!id)return; await prisma.tag.deleteMany({where:{id,workspaceId:user.workspaceId}}); revalidatePath("/tags"); }
