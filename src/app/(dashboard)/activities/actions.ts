"use server";
import{revalidatePath}from"next/cache";import{prisma}from"@/lib/prisma";import{getCurrentUser}from"@/lib/auth";
export async function createActivity(f:FormData){const u=await getCurrentUser();if(!u)return;const subject=String(f.get("subject")||"").trim();if(!subject)return;await prisma.activity.create({data:{workspaceId:u.workspaceId,userId:u.id,type:String(f.get("type")||"NOTE"),subject,description:String(f.get("description")||"").trim()||null}});revalidatePath("/activities");}
