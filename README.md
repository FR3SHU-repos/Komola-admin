# KOMOLA Admin

Platform administration console for KOMOLA.

## Current scope

This app is a protected Next.js client of the Go API. It does **not** connect
directly to PostgreSQL, Supabase application tables, or Redis. The Go API is the
authority for platform-admin authorization, tenant scope, audit logging,
privacy operations, and database writes.

Implemented with the current API:

- Platform-admin sign-in through the shared Supabase Auth project.
- Overview metrics for organizations, enabled locations, and privacy queue.
- Seller/Rewardor organization access review: approve, reject, suspend.
- Platform location enable/disable control.
- Privacy request queue with identity verification and resolution actions.
- Period-filtered platform analytics with weekly, monthly, and yearly detail
  pages.
- Cross-organization operations tables for products, categories, registers,
  business locations, sellers, and buyer wallet aggregates.
- Shared operations filters, URL-persisted views, and server-side pagination.
- Read-only reconciliation checks for sales, payments, inventory, rewards, and
  stalled outbox retries.
- Read-only admin audit log, operational alerts, fraud/abuse review signals,
  and bounded CSV exports for sales, sellers, products, and buyer wallet
  aggregates.

The implemented and planned admin capabilities are documented in
[`docs/ADMIN-FEATURE-ROADMAP.md`](docs/ADMIN-FEATURE-ROADMAP.md). The roadmap
includes the delivered phases plus exports, fraud review, operational alerts,
audit logs, role-based access, and privacy-safe reporting.

The current Go API exposes platform-admin operations for seller applications,
locations, privacy requests, analytics, operations tables, Rewardor campaign
read models, reconciliation, audit events, alerts, fraud signals, and exports.
Persistent alert acknowledgement, export-request audit records, and fraud
review decisions remain planned workflows.

The complete implemented route inventory is maintained in
[`../go-api-backend/docs/admin-platform-api.md`](../go-api-backend/docs/admin-platform-api.md).
The machine-readable contract is
[`../go-api-backend/openapi/openapi.yaml`](../go-api-backend/openapi/openapi.yaml)
and is also served by the API at `/openapi.yaml`; Swagger UI is available at
`/docs`.

## Local development

Create `.env.local`:

```env
NEXT_PUBLIC_KOMOLA_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_KOMOLA_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GO_API_BASE_URL=http://localhost:8080
```

Then run:

```bash
npm install
npm run dev
```

The signed-in Supabase user must exist in `identity.platform_admins`; ordinary
seller, buyer, and Rewardor accounts are denied by the Go API.

## Verification

From the repository roots:

```bash
# Go API
GOCACHE=/tmp/komola-go-build go test ./...
jq empty openapi/openapi.yaml

# Admin app
npm run typecheck
npm run build
npm run lint
```

Lint currently reports warnings only. No database migration or direct database
mutation is part of the admin analytics work documented here.

## Source of truth

- Shared agent workflow: `../cross-platform-assets/AGENT_WORKFLOW.md`
- Privacy baseline: `../cross-platform-assets/DPDP_DATA_GOVERNANCE.md`
- API contract: `../go-api-backend/openapi/openapi.yaml`
- Current API routes: `../go-api-backend/docs/api-current.md`
- Backend runtime: `../go-api-backend/docs/system-reference.md`
