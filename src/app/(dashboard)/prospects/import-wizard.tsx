"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

const fields = [
  ["firstName","First name"],["lastName","Last name"],["fullName","Full name"],["companyName","Company"],
  ["jobTitle","Job title"],["email","Email"],["phone","Phone"],["mobile","Mobile"],["website","Website"],
  ["linkedinUrl","LinkedIn"],["address","Address"],["city","City"],["state","State"],["postalCode","Postal code"],
  ["country","Country"],["industry","Industry"],["source","Source"],["sourceUrl","Source URL"],["status","Status"],["notes","Notes"],["score","Score"],
] as const;

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
function suggest(header: string) {
  const h = normalize(header);
  const aliases: Record<string,string[]> = {
    firstName:["firstname","fname","givenname"], lastName:["lastname","lname","surname"], fullName:["fullname","name","contactname"],
    companyName:["company","companyname","organization","organisation"], jobTitle:["jobtitle","title","position","role"],
    email:["email","emailaddress","e-mail"], phone:["phone","telephone","phonenumber","tel"], mobile:["mobile","cell","cellphone"],
    website:["website","url","domain"], linkedinUrl:["linkedin","linkedinurl","linkedinprofile"], sourceUrl:["sourceurl","sourcepage","sourcewebsite","originalurl"],
    address:["address","street","streetaddress"], city:["city","town"], state:["state","province","region"], postalCode:["zip","zipcode","postalcode","postcode"],
    country:["country"], industry:["industry","niche"], source:["source","leadsource"], status:["status"], notes:["notes","note","comments","comment"], score:["score","leadscore"],
  };
  return Object.entries(aliases).find(([, values]) => values.includes(h))?.[0] ?? "";
}

export function ImportWizard() {
  const [rows, setRows] = useState<Record<string,unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string,string>>({});
  const [filename, setFilename] = useState("");
  const [source, setSource] = useState("CSV Import");
  const [duplicateMode, setDuplicateMode] = useState("skip");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    setFilename(file.name); setMessage("");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string,unknown>>(sheet, { defval: "" });
    if (data.length > 5000) throw new Error("Please keep imports at or below 5,000 rows for the current import workflow.");
    const hs = data.length ? Object.keys(data[0]) : [];
    setRows(data);
    setHeaders(hs);
    const next: Record<string,string> = {};
    for (const [field] of fields) { const found = hs.find((h) => suggest(h) === field); if (found) next[field] = found; }
    setMapping(next);
  }

  const preview = useMemo(() => rows.slice(0, 5), [rows]);
  const mappedColumns = useMemo(() => new Set(Object.values(mapping)), [mapping]);
  const unmappedColumns = headers.filter((header) => !mappedColumns.has(header));

  async function submit() {
    if (!rows.length) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/prospects/import", {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.set("rows", JSON.stringify(rows)); fd.set("mapping", JSON.stringify(mapping)); fd.set("filename", filename); fd.set("source", source); fd.set("duplicateMode", duplicateMode);
          return fd;
        })(),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Import failed.");
      setMessage(`Imported ${result.imported} prospects. ${result.duplicates} duplicates, ${result.failed} failed.`);
      setRows([]); setHeaders([]); setMapping({});
    } catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <div className="grid gap-4 md:grid-cols-3"><label className="block text-sm font-medium">File<input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => { void handleFile(e.target.files?.[0]).catch(err => setMessage(err instanceof Error ? err.message : "Unable to read file.")); }} className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" /></label><label className="block text-sm font-medium">Source<input value={source} onChange={(e) => setSource(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm" /></label><label className="block text-sm font-medium">Duplicate handling<select value={duplicateMode} onChange={(e) => setDuplicateMode(e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"><option value="skip">Skip existing</option><option value="update">Update existing</option><option value="create">Create anyway</option></select></label></div>
    {headers.length > 0 && <>
      <div className="rounded-xl border border-border overflow-hidden"><div className="border-b border-border bg-zinc-50 px-4 py-3"><h3 className="font-semibold">Column mapping</h3><p className="mt-1 text-xs text-muted">Map source columns to CRM fields. Unmapped columns are preserved in Custom Fields and Raw Data.</p></div><div className="grid gap-3 p-4 md:grid-cols-2">{fields.map(([field,label]) => <label key={field} className="grid grid-cols-[140px_1fr] items-center gap-3 text-sm"><span className="font-medium">{label}</span><select value={mapping[field] ?? ""} onChange={(e) => setMapping((m) => ({...m,[field]:e.target.value}))} className="rounded-lg border border-border bg-white px-3 py-2"><option value="">Not mapped</option>{headers.map((h) => <option key={h} value={h}>{h}</option>)}</select></label>)}</div>{unmappedColumns.length > 0 && <div className="border-t border-border bg-amber-50 px-4 py-3 text-xs text-amber-800"><strong>{unmappedColumns.length} unmapped columns:</strong> {unmappedColumns.join(", ")}</div>}</div>
      <div className="rounded-xl border border-border overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-zinc-50 px-4 py-3"><div><h3 className="font-semibold">Preview</h3><p className="text-xs text-muted">{rows.length} rows detected · showing first 5</p></div><button disabled={busy} onClick={submit} className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-fg disabled:opacity-50">{busy ? "Importing…" : "Import prospects"}</button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="border-b border-border"><tr>{headers.slice(0,10).map(h=><th key={h} className="p-3 whitespace-nowrap">{h}</th>)}</tr></thead><tbody>{preview.map((row,i)=><tr key={i} className="border-b border-border last:border-0">{headers.slice(0,10).map(h=><td key={h} className="p-3 max-w-48 truncate">{String(row[h] ?? "")}</td>)}</tr>)}</tbody></table></div></div>
    </>}
    {message && <div className="rounded-lg border border-border bg-zinc-50 px-4 py-3 text-sm">{message}</div>}
  </div>;
}
