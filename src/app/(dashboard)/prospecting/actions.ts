"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const EXA_ENDPOINT = "https://api.exa.ai/search";

function value(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function safeUrl(input: string): string | null {
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function normalize(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function extractEmails(text: string): string[] {
  const matches = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi);
  return unique((matches ?? []).map((item) => item.toLowerCase()));
}

function extractPhones(text: string): string[] {
  const matches = text.match(
    /(?:\+?1[\s().-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
  );
  return unique((matches ?? []).map(normalize));
}

function extractLinkedIn(text: string): string | null {
  const match = text.match(
    /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[^\s)"'<>]+/i,
  );
  return match?.[0]?.replace(/[),.;]+$/, "") ?? null;
}

function buildQuery(formData: FormData): string {
  const target = value(formData, "targetType") || "People and companies";
  const keyword = value(formData, "keyword");
  const industry = value(formData, "industry");
  const country = value(formData, "country");
  const state = value(formData, "state");
  const city = value(formData, "city");
  const companySize = value(formData, "companySize");
  const jobTitle = value(formData, "jobTitle");
  const seniority = value(formData, "seniority");
  const source = value(formData, "source");

  const parts = [
    target,
    keyword,
    industry,
    jobTitle,
    seniority,
    companySize,
    city,
    state,
    country,
    source !== "All available" ? source : "",
  ].filter(Boolean);

  return parts.join(" ");
}

export type GenericProspectResult = {
  id: string;
  title: string;
  url: string;
  domain: string;
  description: string;
  sourceText: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  publishedDate: string | null;
};

export type ProspectingSearchState = {
  ok: boolean;
  error: string | null;
  query: string;
  searchedAt: string | null;
  results: GenericProspectResult[];
};

export async function searchProspects(
  formData: FormData,
): Promise<ProspectingSearchState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      error: "You must be signed in to run a prospecting search.",
      query: "",
      searchedAt: null,
      results: [],
    };
  }

  const query = buildQuery(formData);

  if (!query.trim()) {
    return {
      ok: false,
      error: "Enter at least a keyword, industry, or location.",
      query: "",
      searchedAt: null,
      results: [],
    };
  }

  const apiKey = process.env.EXA_API_KEY?.trim();

  if (!apiKey) {
    return {
      ok: false,
      error: "Add EXA_API_KEY to the server environment before running a real search.",
      query,
      searchedAt: null,
      results: [],
    };
  }

  try {
    const response = await fetch(EXA_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        type: "auto",
        numResults: 20,
        contents: {
          text: { maxCharacters: 5000 },
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      return {
        ok: false,
        error: `Search provider returned ${response.status}. ${message.slice(0, 240)}`.trim(),
        query,
        searchedAt: new Date().toISOString(),
        results: [],
      };
    }

    const payload = (await response.json()) as {
      results?: Array<{
        id?: string;
        title?: string;
        url?: string;
        text?: string;
        summary?: string;
        publishedDate?: string;
      }>;
    };

    const results = (payload.results ?? [])
      .map((item, index): GenericProspectResult | null => {
        const url = safeUrl(String(item.url ?? ""));
        if (!url) return null;

        const domain = new URL(url).hostname.replace(/^www\./, "");
        const sourceText = normalize(String(item.text ?? item.summary ?? ""));
        const description = normalize(String(item.summary ?? item.text ?? "")).slice(0, 480);

        const emails = extractEmails(sourceText);
        const phones = extractPhones(sourceText);

        return {
          id: String(item.id ?? `${domain}-${index}`),
          title: String(item.title ?? domain).trim() || domain,
          url,
          domain,
          description,
          sourceText,
          email: emails[0] ?? null,
          phone: phones[0] ?? null,
          linkedinUrl: extractLinkedIn(sourceText),
          publishedDate: item.publishedDate ? String(item.publishedDate) : null,
        };
      })
      .filter((item): item is GenericProspectResult => Boolean(item));

    return {
      ok: true,
      error: null,
      query,
      searchedAt: new Date().toISOString(),
      results,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown search error.",
      query,
      searchedAt: new Date().toISOString(),
      results: [],
    };
  }
}

function parseResults(input: string): GenericProspectResult[] {
  try {
    const parsed = JSON.parse(input) as unknown;
    return Array.isArray(parsed) ? (parsed as GenericProspectResult[]) : [];
  } catch {
    return [];
  }
}

async function importOneProspect(
  workspaceId: string,
  result: GenericProspectResult,
  query: string,
): Promise<"imported" | "duplicate"> {
  const url = safeUrl(result.url);
  if (!url) return "duplicate";

  const duplicate = await prisma.prospect.findFirst({
    where: {
      workspaceId,
      OR: [
        { sourceUrl: url },
        { website: url },
        result.email ? { email: result.email } : { email: "__none__" },
      ],
    },
    select: { id: true },
  });

  if (duplicate) return "duplicate";

  const quality =
    (result.email ? 30 : 0) +
    (result.phone ? 25 : 0) +
    (result.linkedinUrl ? 15 : 0) +
    (result.url ? 15 : 0) +
    (result.title ? 15 : 0);

  const rawData = {
    provider: "Exa",
    query,
    title: result.title,
    url,
    domain: result.domain,
    description: result.description,
    sourceText: result.sourceText,
    extracted: {
      email: result.email,
      phone: result.phone,
      linkedinUrl: result.linkedinUrl,
    },
    discoveredAt: new Date().toISOString(),
  };

  await prisma.prospect.create({
    data: {
      workspaceId,
      fullName: null,
      companyName: result.title,
      jobTitle: null,
      email: result.email,
      phone: result.phone,
      mobile: null,
      website: url,
      linkedinUrl: result.linkedinUrl,
      source: "Web Prospecting",
      sourceUrl: url,
      sourceMetadata: JSON.stringify({
        provider: "Exa",
        query,
        discoveredAt: new Date().toISOString(),
      }),
      status: "NEW",
      score: quality,
      notes: result.description || null,
      rawData: JSON.stringify(rawData),
      customFields: JSON.stringify({
        domain: result.domain,
        publishedDate: result.publishedDate,
      }),
    },
  });

  return "imported";
}

export async function bulkImportProspects(
  formData: FormData,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const results = parseResults(value(formData, "results")).slice(0, 50);
  const query = value(formData, "query");

  let imported = 0;
  let duplicates = 0;

  for (const result of results) {
    const outcome = await importOneProspect(user.workspaceId, result, query);
    if (outcome === "imported") imported += 1;
    else duplicates += 1;
  }

  revalidatePath("/prospects");
  revalidatePath("/prospecting");

  redirect(`/prospecting?imported=${imported}&duplicates=${duplicates}`);
}