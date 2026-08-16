# Implementation roadmap

## Phase 1 — Foundation
- Workspace tenant boundary
- User roles and authentication
- PostgreSQL/Prisma production schema
- API versioning
- validation and rate limiting
- audit logging

## Phase 2 — Core CRM
- Companies
- Contacts + 360 profile
- Leads + qualification
- Pipelines + opportunities
- Tasks
- Activities
- Meetings
- Notes
- Tags
- Notifications

## Phase 3 — UX
- Global search
- Advanced filters
- dashboard metrics
- reports
- timeline
- bulk actions

## Phase 4 — Data acquisition
- CSV/XLSX import
- mapping/preview/validation
- duplicate detection
- bulk lead/contact/company creation

## Phase 5 — Prospecting
- niche/location/ICP criteria
- provider abstraction
- prospect qualification
- lead scoring
- conversion to CRM records

## Phase 6 — Integrations
- calling providers
- SMS/WhatsApp
- email providers
- Google/Microsoft calendar

## Phase 7 — Automation
- triggers
- conditions
- actions
- follow-up cadences
- background jobs with Redis

## Phase 8 — Medical billing extensions
- practices/providers
- payers
- claims
- AR
- denials
- billing follow-ups
- revenue
