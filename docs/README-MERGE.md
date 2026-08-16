# How this project is being evolved

The existing AyyazTech CRM is retained as the runnable UI foundation. It currently uses Next.js + Prisma + SQLite and provides login, contacts, deals, drag-and-drop pipeline, and dashboard functionality.

The target architecture is documented in `docs/FINAL-ARCHITECTURE.md` and `docs/target-schema.prisma`.

For immediate local work, keep the SQLite runtime. Do not switch the active Prisma datasource to PostgreSQL until the NestJS API and workspace migration are implemented together. This avoids breaking the existing demo app mid-migration.

Recommended order:

1. Run the current app and verify the baseline.
2. Add workspace-aware auth and tenant isolation.
3. Introduce Companies, Leads, Opportunities, Tasks, Activities, Meetings, Notes, Tags, Notifications and AuditLog.
4. Extract/introduce the NestJS API under `/api/v1`.
5. Move production persistence to PostgreSQL.
6. Add Redis-backed jobs/notifications.
7. Add import, prospecting and provider integrations.
