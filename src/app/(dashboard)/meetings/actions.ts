"use server";
import{revalidatePath}from"next/cache";import{prisma}from"@/lib/prisma";import{getCurrentUser}from"@/lib/auth";
export async function createMeeting(f:FormData){const u=await getCurrentUser();if(!u)return;const title=String(f.get("title")||"").trim();const starts=String(f.get("startsAt")||"");if(!title||!starts)return;await prisma.meeting.create({data:{workspaceId:u.workspaceId,userId:u.id,title,startsAt:new Date(starts),location:String(f.get("location")||"").trim()||null,notes:String(f.get("notes")||"").trim()||null}});revalidatePath("/meetings");}
