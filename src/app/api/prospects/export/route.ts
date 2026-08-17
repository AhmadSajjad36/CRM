import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const ids = url.searchParams.getAll("id").filter(Boolean).slice(0, 10000);
  const q = String(url.searchParams.get("q") ?? "").trim();
  const status = String(url.searchParams.get("status") ?? "").trim();
  const source = String(url.searchParams.get("source") ?? "").trim();

  const where = {
    workspaceId: user.workspaceId,
    ...(ids.length ? { id: { in: ids } } : {}),
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(q ? {
      OR: [
        { fullName: { contains: q, mode: "insensitive" as const } },
        { companyName: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q, mode: "insensitive" as const } },
        { jobTitle: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  };

  const rows = await prisma.prospect.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const data = rows.map((p) => ({
    firstName: p.firstName ?? "", lastName: p.lastName ?? "", fullName: p.fullName ?? "",
    companyName: p.companyName ?? "", jobTitle: p.jobTitle ?? "", email: p.email ?? "",
    phone: p.phone ?? "", mobile: p.mobile ?? "", website: p.website ?? "",
    linkedinUrl: p.linkedinUrl ?? "", address: p.address ?? "", city: p.city ?? "",
    state: p.state ?? "", postalCode: p.postalCode ?? "", country: p.country ?? "",
    industry: p.industry ?? "", source: p.source, sourceUrl: p.sourceUrl ?? "", status: p.status, score: p.score,
    notes: p.notes ?? "", customFields: p.customFields, rawData: p.rawData,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  }));

  if (format === "xlsx") {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Prospects");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="osoz-prospects.xlsx"' } });
  }

  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const headers = Object.keys(data[0] ?? { firstName:"",lastName:"",fullName:"",companyName:"",jobTitle:"",email:"",phone:"",source:"",sourceUrl:"",status:"" });
  const csv = [headers.map(escape).join(","), ...data.map((row) => headers.map((h) => escape(row[h as keyof typeof row])).join(","))].join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="osoz-prospects.csv"' } });
}
