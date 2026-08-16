"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function updateWorkspace(formData: FormData){const u=await getCurrentUser();if(!u)return;const name=String(formData.get("name")||"").trim();const slug=String(formData.get("slug")||"").trim().toLowerCase().replace(/[^a-z0-9-]+/g,"-");if(!name||!slug)return;await prisma.workspace.update({where:{id:u.workspaceId},data:{name,slug}});revalidatePath("/settings");revalidatePath("/dashboard");}
