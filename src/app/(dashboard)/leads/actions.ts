"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
export async function createLead(formData: FormData){
 const u=await getCurrentUser(); if(!u)return;
 const email=String(formData.get("email")??"").trim()||null;
 const score=Math.max(0,Math.min(100,Number(formData.get("score")??0)||0));
 await prisma.lead.create({data:{workspaceId:u.workspaceId,firstName:String(formData.get("firstName")??"").trim()||null,lastName:String(formData.get("lastName")??"").trim()||null,title:String(formData.get("title")??"").trim()||null,email,phone:String(formData.get("phone")??"").trim()||null,source:String(formData.get("source")??"").trim()||null,location:String(formData.get("location")??"").trim()||null,status:String(formData.get("status")??"NEW"),priority:score>=80?"HIGH":score>=50?"MEDIUM":"LOW",score,notes:String(formData.get("notes")??"").trim()||null}});
 revalidatePath("/leads");
}
export async function deleteLead(formData: FormData){
 const u=await getCurrentUser(),id=String(formData.get("id")??"");if(!u||!id)return;
 await prisma.lead.deleteMany({where:{id,workspaceId:u.workspaceId}});revalidatePath("/leads");
}
