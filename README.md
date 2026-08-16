# OSOZ CRM — One Stop Online Zone

A modular CRM foundation being developed into the OSOZ customer relationship and revenue platform.

## Current local MVP

- Next.js + React + TypeScript
- Prisma 7 + SQLite for local development
- Workspace-aware tenant boundary
- OSOZ branding
- Dashboard, contacts and drag/drop deals retained from the original CRM base
- Companies, Leads, Opportunities, Tasks, Activities, Meetings and Notes
- Contact 360 profile with integration-aware Call / Email / Message actions
- Lead scoring and qualification fields
- CSV lead import with workspace duplicate protection
- Tags, Reports, Integrations, Prospecting and Settings module shells

## Target architecture

The production architecture is a modular monolith with Next.js frontend, NestJS REST API under `/api/v1`, PostgreSQL and Redis. The complete target blueprint is in `docs/FINAL-ARCHITECTURE.md` and `docs/target-schema.prisma`.

Medical billing remains an extension layer; the CRM core does not require patient or clinical data.

## Local run

```powershell
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Demo login: `admin` / `admin123`.
