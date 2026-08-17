# OSOZ CRM — Prospects Module Phase 2

This build upgrades the existing OSOZ CRM Prospects module without replacing the overall CRM architecture.

## Included

- Prospect repository with server-side pagination
- Search across name, company, email, phone, title, city and country
- Filters for status, source, owner and minimum score
- Prospect KPI/status/source/data-quality summaries
- Manual prospect creation with source and source URL
- Prospect 360 detail page
- Source lineage and original raw-data viewer
- Custom/unmapped field viewer
- Prospect history backed by audit logs
- CSV/Excel import with column mapping and preview
- Unmapped-column preservation in Custom Fields + Raw Data
- Duplicate detection with Skip / Update / Create Anyway options
- Import job history summary
- Bulk status changes, owner assignment, archive, delete and export
- Filtered CSV/Excel export
- Selected-prospect Excel export
- API ingestion at `/api/prospects`
- Additive PostgreSQL schema fields for source lineage

## Existing project conventions

This is still the same OSOZ Next.js + Prisma + PostgreSQL project. Existing authentication, workspace tenancy, CRM modules, dashboard, integrations, and UI design system are preserved.

## Setup

Copy your existing Neon `.env` into this project before running Prisma.

```powershell
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

Open:

```text
http://localhost:3000
```

Important: `prisma db push` is needed once in this build because the Prospect model adds `sourceUrl` and `sourceMetadata`. It is an additive schema change only; do not run database reset commands.

## Production

After local verification:

```powershell
git add .
git commit -m "feat: upgrade prospects module"
git push origin main
```

Vercel will build from GitHub using the project's existing environment variables. Confirm the Production `DATABASE_URL` and `SESSION_SECRET` are still configured before deploying.

## Prospecting provider

The Prospecting page uses the Exa Search API for real public-web discovery. Set `EXA_API_KEY` in local `.env` and in Vercel Production/Preview. The provider key is used only on the server. Search results are reviewed before they are imported into Prospects, and the source URL/query/raw response metadata are preserved.
