"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function toggleIntegration(formData: FormData){const u=await getCurrentUser();if(!u)return;const provider=String(formData.get("provider")||"");const category=String(formData.get("category")||"");if(!provider)return;const current=await prisma.integration.findUnique({where:{workspaceId_provider:{workspaceId:u.workspaceId,provider}}});await prisma.integration.upsert({where:{workspaceId_provider:{workspaceId:u.workspaceId,provider}},update:{enabled:!current?.enabled,label:String(formData.get("label")||"").trim()||null},create:{workspaceId:u.workspaceId,provider,category,enabled:true,label:String(formData.get("label")||"").trim()||null}});revalidatePath("/integrations");}
