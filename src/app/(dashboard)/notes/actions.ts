"use server";
import{revalidatePath}from"next/cache";import{prisma}from"@/lib/prisma";import{getCurrentUser}from"@/lib/auth";
export async function createNote(f:FormData){const u=await getCurrentUser();if(!u)return;const content=String(f.get("content")||"").trim();if(!content)return;await prisma.note.create({data:{workspaceId:u.workspaceId,userId:u.id,content}});revalidatePath("/notes");}
