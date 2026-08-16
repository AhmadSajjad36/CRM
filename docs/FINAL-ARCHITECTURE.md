# Medical Billing CRM — Final Architecture

## Product direction

The CRM is an industry-agnostic modular monolith. Medical-billing functionality is an extension layer and must not require patient/clinical data for core CRM workflows.

## Runtime

- Next.js + React + TypeScript frontend
- NestJS + TypeScript backend (target service)
- Prisma ORM
- PostgreSQL production database
- Redis for jobs/cache/notifications
- REST API under `/api/v1`

## Tenant boundary

`Workspace` is the primary tenant boundary. Every tenant-owned record must carry `workspaceId`, and every read/write must verify workspace membership before accessing the record.

## Core modules

Auth, Users, Workspaces, Companies, Contacts, Leads, Pipelines, Opportunities, Activities, Tasks, Meetings, Notes, Tags, Notifications, Reports, Audit Logs.

## Future modules

Prospecting providers, imports, integrations, automation/workflows, custom fields/objects, email/templates, subscriptions/invoices, and medical billing extensions.

## Communication principle

Call, Message, Email and Meeting actions are integration-aware UI actions. They must never claim success unless a configured provider actually performs the action.
