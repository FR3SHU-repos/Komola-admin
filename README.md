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
- Analytics readiness page that distinguishes available organization-scoped
  analytics from global admin endpoints that still need backend exposure.

The current Go API exposes global admin operations for seller applications,
locations, and privacy requests. Global Rewardor campaign moderation, POS
catalogue/inventory controls, sales exploration, and cross-organization
analytics require dedicated platform-admin API endpoints before this console
can safely manage them.

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

## Source of truth

- Shared agent workflow: `../cross-platform-assets/AGENT_WORKFLOW.md`
- Privacy baseline: `../cross-platform-assets/DPDP_DATA_GOVERNANCE.md`
- API contract: `../go-api-backend/openapi/openapi.yaml`
- Current API routes: `../go-api-backend/docs/api-current.md`
- Backend runtime: `../go-api-backend/docs/system-reference.md`
