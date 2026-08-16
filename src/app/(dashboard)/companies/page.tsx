import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createCompany, deleteCompany } from "./actions";
export const dynamic="force-dynamic";
export default async function CompaniesPage(){
 const u=await getCurrentUser(); if(!u)return null;
 const rows=await prisma.company.findMany({where:{workspaceId:u.workspaceId},orderBy:{createdAt:"desc"},include:{_count:{select:{contacts:true,leads:true,opportunities:true}}}});
 return <><header className="border-b border-border bg-background/80 px-6 py-5 md:px-10"><h1 className="font-display text-2xl font-semibold">Companies</h1><p className="mt-0.5 text-sm text-muted">Manage practices, businesses and customer organizations.</p></header>
 <div className="space-y-6 px-6 py-8 md:px-10">
 <section className="rounded-[14px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">Add company</h2>
 <form action={createCompany} className="mt-4 grid gap-3 md:grid-cols-4">
 {["name","website","phone","email","industry","location"].map((n)=><input key={n} name={n} placeholder={n[0].toUpperCase()+n.slice(1)} className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-accent"/>)}
 <select name="type" className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm"><option>PROSPECT</option><option>CLIENT</option><option>PARTNER</option><option>OTHER</option></select>
 <button className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg">Add Company</button>
 </form></section>
 <section className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-card)]"><table className="w-full text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted"><tr><th className="p-4">Company</th><th className="p-4">Type</th><th className="p-4">Industry</th><th className="p-4">Records</th><th className="p-4"></th></tr></thead><tbody>{rows.map(c=><tr key={c.id} className="border-b border-border last:border-0"><td className="p-4 font-medium">{c.name}</td><td className="p-4">{c.type}</td><td className="p-4 text-muted">{c.industry||"—"}</td><td className="p-4 text-muted">{c._count.contacts} contacts · {c._count.leads} leads · {c._count.opportunities} opps</td><td className="p-4 text-right"><form action={deleteCompany}><input type="hidden" name="id" value={c.id}/><button className="text-xs font-semibold text-red-600">Delete</button></form></td></tr>)}</tbody></table></section>
 </div></>;
}
