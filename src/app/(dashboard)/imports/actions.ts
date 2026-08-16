"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseCsv(text:string){
 const lines=text.replace(/\r/g,"").split("\n").filter(Boolean); if(lines.length<2)return [];
 const headers=lines[0].split(",").map(x=>x.trim().replace(/^"|"$/g,""));
 return lines.slice(1).map(line=>{const cells=line.split(",").map(x=>x.trim().replace(/^"|"$/g,""));return Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""]))});
}
export async function importLeads(formData:FormData){
 const u=await getCurrentUser(); if(!u)return;
 const file=formData.get("file"); if(!(file instanceof File))return;
 const rows=parseCsv(await file.text());
 for(const r of rows){
   const email=String(r.email||"").trim()||null;
   if(email && await prisma.lead.findFirst({where:{workspaceId:u.workspaceId,email}}))continue;
   await prisma.lead.create({data:{workspaceId:u.workspaceId,firstName:String(r.firstName||r.name||"").trim()||null,lastName:String(r.lastName||"").trim()||null,title:String(r.title||r.jobTitle||"").trim()||null,email,phone:String(r.phone||"").trim()||null,companyId:null,source:"CSV Import",status:"NEW",priority:"MEDIUM",score:0}});
 }
 revalidatePath("/leads"); revalidatePath("/imports");
}
