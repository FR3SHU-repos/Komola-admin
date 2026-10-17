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
| Operations | Cross-organization views of listed products by category, seller business locations by address/PIN, POS registers, seller transaction totals, and buyer wallet balances, with shared filters and bounded pagination. Seller names link to a full seller snapshot covering profile, locations, registers, catalogue/pricing, stock, referrals, and sales. | `GET /api/v1/admin/operations/*` |
| Buyer detail | Buyer profiles include masked contact details, wallet state, category-tagged purchase lines, seller/locality context, ten transactions per page, and a local-time weekday-by-hour purchase heatmap. | `GET /api/v1/admin/operations/buyers/{personID}`, `/admin/operations/buyers/{personID}/insights` |
| Rewardor rewards | Read-only list of Rewardor-created campaigns with status, locality, point value, and claim totals | `GET /api/v1/admin/reward-campaigns` |
| Reconciliation | Read-only integrity checks for sales, payments, inventory, reward transfers, and stalled outbox retries | `GET /api/v1/admin/reconciliation` |
| Audit | Minimized, filterable platform audit-event view without raw before/after payloads | `GET /api/v1/admin/audit-events` |
| Alerts | Read-only privacy-SLA, outbox, and analytics-ingestion alert view | `GET /api/v1/admin/alerts` |
| Fraud signals | Explainable aggregate review signals for self-referrals, refunds, velocity, and claim bursts | `GET /api/v1/admin/fraud-signals` |
| Exports | Bounded CSV reports for approved operational datasets | `GET /api/v1/admin/exports/{report}` |
| Performance | Seller and Rewardor period aggregates with bounded filters and pagination; seller rows link to the full seller snapshot for operational follow-up | `GET /api/v1/admin/performance/sellers`, `/admin/performance/rewardors` |
| Inventory analytics | Stock health, low/out-of-stock items, movement volume, and fast-moving products | `GET /api/v1/admin/inventory/analytics` |
| Data health | Analytics watermark, outbox, PostgreSQL pool, and Redis cache snapshot | `GET /api/v1/admin/freshness` |

All mutations require an authenticated platform admin and explicit UI intent.
The UI is not an authorization boundary; the Go API must enforce every rule.

## Required backend follow-up

The following capabilities remain planned because they require additional
workflow design and, for durable state, an explicitly approved database
migration:

- `GET /api/v1/admin/organizations/:id/summary`
- platform-wide Rewardor campaign moderation and claim exception routes
- POS operational health, sales, inventory, and outbox views
- least-privilege platform-admin roles and permissions
- scheduled reports and report-run history
- notification preferences, escalation rules, and delivery history

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
- Operations drill-down tables with URL-persisted filters and server-side pagination.
- Seller snapshot drill-down links from seller, product, register, and business
  location operations rows.
- Buyer purchase history with category metadata, bounded ten-item pagination,
  and a weekday-by-hour local-time heatmap for completed purchases.
- Reconciliation dashboard with severity/type filters and safe operational references.
- Audit, alerts, fraud-signal, export, performance, inventory, and freshness pages.

### Phase 2 — backend contracts

- Global admin overview, sales/reward analytics, operations, reconciliation, audit, alert, fraud, export, performance, inventory, and freshness read endpoints.
- Platform-admin authorization and OpenAPI documentation for aggregate routes.
- Add organization summary and operational health endpoints.
- Add tests for platform-admin authorization and cross-tenant isolation.

### Phase 3 — operational controls

- Rewardor campaign moderation and claim exception handling.
- POS sales/inventory/outbox monitoring.
- Rate-limit, worker, and cache observability.
- Durable export-request audit records and short-lived export delivery with
  DPDP purpose and retention controls.

### Phase 4 — production hardening

- Staging environment and admin-only deployment checks.
- Read-only mode and break-glass access policy.
- Audit dashboards and alerting.
- Load tests for global analytics queries and large paginated tables.
