# KOMOLA Admin Feature Roadmap

**Status:** Phases 1–10 are implemented in the current read-only admin/API
baseline; management workflows remain planned follow-up work.

**Applies to:** `komola-admin`, the Go API admin endpoints, platform
operations, analytics, privacy operations, and future admin tooling.

## Purpose

The admin console should become the operational control plane for KOMOLA. It
must help authorized staff understand platform activity, investigate issues,
take controlled operational actions, and produce privacy-safe reports without
connecting directly to PostgreSQL, Supabase tables, Redis, or other business
stores.

The Go API remains responsible for authorization, tenant and platform scope,
business rules, aggregation, privacy filtering, audit logging, and all writes.
The Next.js admin app is a typed client of those API contracts.

## Priority order

### Phase 1 — Daily operations (implemented)

1. Global filters — implemented for the operations tables with server-side
   locality, seller-type, status, category, search, and period filters.
2. Full drill-down tables — implemented for sellers, products, registers,
   business locations, buyer wallet aggregates, and Rewardor campaigns with
   bounded server-side pagination.
3. Reconciliation dashboard — implemented as a read-only page and API route
   for sales, payments, inventory, reward transfers, and stalled outbox checks.
4. Admin audit log — implemented as a minimized, read-only event view.
5. Operational alerts — implemented for privacy SLA, outbox, and analytics
   ingestion conditions.

### Phase 2 — Reporting and risk

6. CSV exports — implemented as bounded server-side downloads for sales,
   sellers, products, and buyer wallet aggregates.
7. Fraud and abuse monitoring — implemented as explainable review signals for
   self-referrals, refund rates, transaction velocity, and claim bursts.
8. Seller and Rewardor performance pages — implemented
9. Inventory analytics — implemented
10. Data freshness and pipeline health — implemented

### Phase 3 — Management workflows

11. Admin roles and permissions
12. Scheduled reports
13. Notification preferences and escalation rules

## Feature requirements

### 1. Global filters

Add shared filters to analytics and operations pages:

- date range or Weekly/Monthly/Yearly view;
- locality, PIN code, and state;
- seller or Rewardor organization;
- product category and product;
- sale status and payment method; and
- campaign status and reward type.

Requirements:

- Filters must be represented in the URL so views can be bookmarked and
  shared.
- The backend must validate every filter and enforce platform-admin access.
- Empty, invalid, and conflicting filters must return clear responses.
- Aggregates must not expose buyer phone numbers, email addresses, exact
  addresses, or raw claim payloads.

### 2. Full drill-down tables

Replace top-ten-only views with paginated, searchable, sortable tables for:

- sales and returns;
- seller organizations;
- Rewardor campaigns and claims;
- products and categories;
- business locations and PIN codes;
- buyer wallet aggregates; and
- operational queues.

Requirements:

- Use server-side pagination and bounded page sizes.
- Show the period and filters applied to every table.
- Include a data-freshness timestamp.
- Use masked or aggregate buyer information only where operationally
  necessary.
- Keep row-level navigation within the Go API authorization boundary.

### 3. Reconciliation dashboard (implemented)

Detect mismatches between operational systems, including:

- completed sales and sale lines;
- payments, refunds, and voids;
- buyer wallet credits and reward ledger entries;
- seller referral rewards;
- reward claims and point reservations;
- outbox events and analytics facts; and
- inventory movements and current stock.

Each mismatch should show a safe reference ID, category, severity, detected
time, current status, and recommended next action. Financial facts must be
read-only in this dashboard; corrections must use explicit, idempotent API
operations with audit events.

Current implementation note: the first release exposes the safe reference,
category, severity, description, occurrence time, filtered counts, and bounded
pagination. It intentionally does not auto-correct records. Future checks can
add referral-ledger and analytics-watermark comparisons once their operational
source/consumer invariants are formalized.

### 4. CSV exports

Allow authorized admins to export filtered reports for operations, finance,
support, and approved analytics purposes.

Requirements:

- Export generation must be server-side and scope-checked.
- Apply the same filters shown on screen.
- Mask personal data by default; privileged unmasking requires a documented
  role and purpose.
- Record who requested the export, what report/filter was used, and when it
  expires.
- Prefer short-lived downloads over permanent files.
- Do not include auth tokens, raw claims, unnecessary contact data, or data
  outside the stated report purpose.

Current implementation note: `GET /admin/exports/{report}` supports bounded
`sales`, `sellers`, `products`, and `wallets` CSV reports with a maximum of
5,000 rows. The current release is read-only and does not create export files
or perform a database write. Export-request audit records and short-lived
object storage should be added when the approved export-audit workflow is
defined.

### 5. Admin audit log

Record administrative access and actions, including:

- sign-in and sign-out;
- viewing sensitive operational pages;
- organization approval, rejection, or suspension;
- location changes;
- privacy-request assignment and resolution;
- exports;
- fraud-review decisions; and
- configuration changes.

Audit events must contain actor, action, target type, target reference,
request ID, outcome, timestamp, and a minimized reason. Do not copy raw phone
numbers, emails, addresses, access tokens, or full request bodies into audit
events.

Current implementation note: `GET /admin/audit-events` returns actor,
organization, action, entity type/reference, request ID, and timestamp while
excluding `before_data` and `after_data`. Existing API mutations continue to
write their normal audit events; this phase adds the protected read model.

### 6. Operational alerts

Provide an alert centre for:

- API error-rate or latency thresholds;
- PostgreSQL pool saturation or slow queries;
- Redis errors or degraded cache performance;
- pending or repeatedly failing outbox events;
- failed analytics jobs;
- payment or settlement mismatches;
- inventory anomalies; and
- unresolved privacy requests approaching their target date.

Alerts need severity, owner, status, first-seen time, last-seen time,
deduplication, acknowledgement, and resolution notes. Alert payloads must be
privacy-minimized.

Current implementation note: `GET /admin/alerts` exposes read-only alerts for
overdue or soon-due privacy requests, stalled outbox events, and failed
analytics ingestion runs. Acknowledgement, ownership, escalation, and
resolution persistence are intentionally deferred until an alert workflow and
retention policy are approved.

### 7. Fraud and abuse monitoring

Create a review queue for risk signals such as:

- a buyer and seller sharing identity or contact signals;
- repeated self-referrals;
- unusually high transaction velocity;
- repeated refunds or voids;
- many accounts using the same device or contact signal;
- abnormal reward claims or rapid redemptions; and
- unusual activity concentrated in one locality or organization.

Risk signals are review aids, not automatic proof of fraud. The API should
preserve explainable reason codes, confidence/severity, evidence references,
review decisions, and appeal/support notes. Do not expose raw profiling data
to ordinary admins.

Current implementation note: `GET /admin/fraud-signals` returns review signals,
not automated fraud decisions. It currently checks self-referral ownership,
high recent refund rates, unusually high hourly completed-sale volume, and
campaign claim counts beyond configured buyer limits. Signals are aggregate and
omit buyer contact data; review decisions and appeals remain future workflow
features.

### 8. Seller and Rewardor performance

Seller views should include:

- transaction count and gross value;
- returns, refunds, and voids;
- product and category movement;
- stock and register activity;
- linked buyer-referral performance; and
- locality performance.

Rewardor views should include:

- published, paused, expired, and archived campaigns;
- claims by status;
- approval, delivery, and confirmation conversion;
- points issued, settled, redeemed, and reversed; and
- campaign and locality performance.

Use organization and campaign identifiers as the primary dimensions. Buyer
identity must remain excluded unless a separately authorized support or
privacy workflow requires it.

Current implementation note: `/admin/performance/sellers` reports bounded
period totals for seller organizations, products, locations, completed sales,
gross value, refunds, voids, linked referral counts, and referral coins.
`/admin/performance/rewardors` reports campaign lifecycle counts, claims,
approval/redemption totals, and point transfer totals. Both endpoints are
platform-admin-only, searchable, paginated, and exclude buyer identity.

### 9. Inventory analytics

Provide:

- low-stock and out-of-stock products;
- fast-moving products;
- slow-moving or inactive products;
- stock value by seller and category;
- stock receipt and adjustment history; and
- inventory anomalies requiring review.

Inventory facts should remain linked to the seller organization and product,
not to unnecessary buyer identity.

Current implementation note: `/admin/inventory/analytics` reports available
stock units, estimated stock value from configured SKU cost, low/out-of-stock
items, recent movement volume, and the top completed-sale movers. The default
low-stock threshold is 10 available units per SKU; this is an operational
signal rather than a product-specific replenishment policy. Results support
bounded search, category, locality, seller type, period, and pagination filters.

### 10. Data freshness and pipeline health

Every analytics card and table should show:

- source endpoint;
- generated-at timestamp;
- source-event watermark where available;
- whether the result is live, delayed, partial, or unavailable; and
- the last successful refresh or job run.

The UI must not present stale or partial data as current. Backend responses
should expose stable freshness metadata rather than making the frontend infer
it from timestamps.

Current implementation note: `/admin/freshness` exposes analytics ingestion
watermarks, unpublished/stalled outbox counts, analytics-fact watermarks,
PostgreSQL pool acquisition metrics, and process-local Redis cache counters.
Analytics is marked stale after 15 minutes, database pool use warns at 80%,
and Redis metrics are marked unavailable when Redis is not configured. The
endpoint is a read-only snapshot; it does not acknowledge alerts or change
pipeline state.

### 11. Admin roles and permissions

Introduce least-privilege roles, for example:

- platform administrator;
- operations administrator;
- finance reviewer;
- privacy operator;
- fraud reviewer; and
- read-only analyst.

Roles must be enforced by the Go API. Frontend navigation is only a usability
feature and is never an authorization boundary. Sensitive exports, personal
data access, privacy resolution, and financial correction actions need
separate permissions and audit events.

### 12. Scheduled reports

Allow authorized admins to schedule weekly or monthly reports for approved
recipients. Each schedule must have a purpose, owner, data scope, delivery
destination, retention/expiry, and pause/delete controls. Report generation
must reuse the same API aggregation and privacy rules as interactive reports.

## API and architecture rules

For every new feature:

1. Add a platform-admin Go API handler and authorization check.
2. Add request/response schemas to `go-api-backend/openapi/openapi.yaml`.
3. Add implementation-derived route notes to
   `go-api-backend/docs/api-current.md`.
4. Add typed functions to `komola-admin/shared/lib/api/admin.ts`.
5. Keep the Next.js app free of direct database, Supabase table, Redis, or
   service-role access.
6. Add tests for authorization, pagination, filters, minimization, and error
   handling.

## Current phase-1-to-3 implementation notes

- `GET /api/v1/admin/operations/*` accepts shared `location`, `sellerType`,
  and `status` filters where the underlying dimension exists. Product tables
  also accept `category`; seller tables accept `days`.
- The operations UI uses 25-row pages and displays previous/next controls from
  API `meta` totals. Search and filter changes reset to the first page.
- `GET /api/v1/admin/reconciliation` is read-only and platform-admin scoped.
  Its current checks are deliberately conservative: completed-sale totals and
  lines, captured payment totals, inventory balances versus movements, reward
  claim/transfer state, and retry-stalled outbox events.
- No database migration or direct database mutation was used for these phases.
- The Go API remains the only layer allowed to query application data; the
  Next.js admin app consumes typed API responses only.
7. Add audit and idempotency behavior for every mutation or export.

## Privacy and DPDP guardrails

These features must follow `../cross-platform-assets/DPDP_DATA_GOVERNANCE.md`.

- Define the purpose before collecting or deriving a metric.
- Minimize, mask, aggregate, or coarsen personal data wherever possible.
- Keep service, fraud/security, marketing, and market-intelligence purposes
  separate.
- Do not treat retained commerce facts as permission to retain personal
  identity indefinitely.
- Apply access, correction, erasure/anonymization, retention, export, cache,
  log, backup, and processor-propagation rules consistently.
- Ask for explicit confirmation before any direct database mutation,
  migration, reset, anonymization, auth deletion, or production change.

## Definition of done

A feature is ready for implementation handoff when it has:

- a documented user and operational purpose;
- a defined data minimization and retention decision;
- an API route and response contract;
- platform-admin authorization and audit behavior;
- pagination and bounded query behavior where lists are involved;
- loading, empty, stale, partial, and error UI states;
- tests for access control and privacy boundaries;
- updated API and system documentation; and
- verification results recorded without exposing secrets or personal data.

## Suggested implementation sequence

Start with global filters and paginated drill-down tables. Then implement
reconciliation and audit logging, because later exports, fraud workflows, and
scheduled reports depend on trustworthy scoped data and traceable admin
actions. Add alerts and performance health after the operational data views
are stable.
