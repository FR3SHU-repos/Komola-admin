# KOMOLA Admin Console

## Purpose

`komola-admin` is the platform-admin control plane for KOMOLA. It provides a
protected operator interface for reviewing seller onboarding, managing enabled
platform locations, processing privacy requests, and preparing platform-wide
analytics and operational controls.

The app is intentionally an API client. It does **not** connect directly to
Supabase PostgreSQL, Supabase application tables, PostgREST, or Redis. The Go
API remains the only application-data boundary so that authentication,
platform-admin authorization, tenant scope, audit behavior, validation,
privacy handling, and transactions stay in one place.

## Current architecture

```text
Browser
  │ Supabase Auth session + bearer token
  ▼
komola-admin (Next.js)
  │ same-origin /api/v1 proxy
  ▼
go-api-backend (Gin)
  ├── identity.platform_admins authorization
  ├── platform-admin route handlers
  └── Supabase PostgreSQL / Auth / existing platform services
```

The Next proxy forwards the authentication and scope headers required by the
Go API. It is not a database proxy and must not gain SQL or service-role
credentials.

## Current operator capabilities

| Area | Current behavior | API routes |
| --- | --- | --- |
| Overview | Counts seller applications, active organizations, enabled locations, and open privacy requests | Existing admin routes + `/pos/bootstrap` |
| Organizations | Filter and approve, reject, or suspend seller applications | `GET/PATCH /api/v1/admin/seller-applications` |
| Locations | Create, edit, enable/disable, and safely archive platform locations | `GET/POST/PATCH/DELETE /api/v1/admin/locations` |
| Privacy operations | Claim, verify, complete, or reject requests; approved erasure uses the governed anonymization workflow | `GET/PATCH /api/v1/admin/privacy/requests` |
| Analytics | Period-filtered platform sales, reward, organization, locality, outbox, and consented-fact aggregates | `GET /api/v1/admin/overview`, `/admin/analytics/sales`, `/admin/analytics/rewards` |
| Operations | Cross-organization views of listed products by category, seller business locations by address/PIN, POS registers, seller transaction totals, and buyer wallet balances | `GET /api/v1/admin/operations/*` |
| Rewardor rewards | Read-only list of Rewardor-created campaigns with status, locality, point value, and claim totals | `GET /api/v1/admin/reward-campaigns` |

All mutations require an authenticated platform admin and explicit UI intent.
The UI is not an authorization boundary; the Go API must enforce every rule.

## Required backend follow-up

The following routes are deliberately listed as planned work rather than
pretending the current tenant-scoped APIs are global admin APIs:

- `GET /api/v1/admin/organizations/:id/summary`
- `GET /api/v1/admin/audit-events`
- platform-wide Rewardor campaign moderation and claim exception routes
- POS operational health, sales, inventory, and outbox views

Each new route should define its authorization, pagination, aggregation grain,
PII minimization, audit event, and performance budget before implementation.
Do not make the admin app call an organization-scoped route with a guessed
`X-Organization-ID` header.

## Security and privacy rules

1. Read `../cross-platform-assets/AGENT_WORKFLOW.md` and
   `../cross-platform-assets/DPDP_DATA_GOVERNANCE.md` before changing this app.
2. Keep Supabase service-role keys, database URLs, and Redis credentials out of
   browser code and `NEXT_PUBLIC_*` variables.
3. Show only the minimum personal data needed for the operator task. Prefer
   masked contact details and stable IDs in tables and exports.
4. Treat privacy-request completion as a governed workflow. Do not delete
   transaction facts or bypass the API's approved anonymization behavior.
5. Confirm destructive or consequential actions in the UI and send a reason
   when the API contract supports one.
6. Record audit events in the Go API for new administrative mutations.

## Local development

```bash
npm install
npm run dev
```

Required environment variables:

```text
NEXT_PUBLIC_KOMOLA_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_KOMOLA_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GO_API_BASE_URL=http://localhost:8080
```

The authenticated user must be represented in `identity.platform_admins` in the
backend environment. Database changes or direct data changes require explicit
operator confirmation under the shared project workflow.

## Delivery phases

### Phase 1 — implemented

- Protected admin shell and Supabase login.
- API proxy with bearer/cookie/header forwarding.
- Seller application review.
- Platform location control.
- Privacy request queue.
- Privacy-safe analytics dashboard with period selection, KPI cards, daily activity, and top organization/campaign/product tables.

### Phase 2 — backend contracts

- Global admin overview and sales/reward analytics read endpoints.
- Platform-admin authorization and OpenAPI documentation for aggregate routes.
- Add audit-event query endpoint with pagination and filters.
- Add organization summary and operational health endpoints.
- Add tests for platform-admin authorization and cross-tenant isolation.

### Phase 3 — operational controls

- Rewardor campaign moderation and claim exception handling.
- POS sales/inventory/outbox monitoring.
- Rate-limit, worker, and cache observability.
- Export jobs with DPDP purpose and retention controls.

### Phase 4 — production hardening

- Staging environment and admin-only deployment checks.
- Read-only mode and break-glass access policy.
- Audit dashboards and alerting.
- Load tests for global analytics queries and large paginated tables.
