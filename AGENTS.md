# KOMOLA Admin agent rules

Before starting work, read:

1. [`../cross-platform-assets/AGENT_WORKFLOW.md`](../cross-platform-assets/AGENT_WORKFLOW.md).
2. [`README.md`](README.md).
3. [`../go-api-backend/docs/api-current.md`](../go-api-backend/docs/api-current.md)
   and [`../go-api-backend/openapi/openapi.yaml`](../go-api-backend/openapi/openapi.yaml).
4. [`../cross-platform-assets/DPDP_DATA_GOVERNANCE.md`](../cross-platform-assets/DPDP_DATA_GOVERNANCE.md)
   before changing privacy, identity, analytics, retention, exports, or admin
   data views.

## Non-negotiable boundaries

- This is a Next.js admin client, not a database application. All application
  data goes through the typed client and same-origin `/api/v1` proxy.
- Never add PostgreSQL, Supabase table queries, MongoDB, Mongoose, Redis
  administration, or a second business-data store to this app.
- The Go API must enforce platform-admin access on every admin endpoint. A
  hidden navigation item or frontend role check is not authorization.
- Do not expose unnecessary personal data in tables, search, logs, exports, or
  screenshots. Privacy operations must use the backend workflow and audit trail.
- Admin mutations require explicit user intent, clear confirmation for
  destructive or irreversible actions, and an idempotency-safe API contract.
- Do not add global analytics or cross-tenant controls by calling
  organization-scoped endpoints with guessed headers.

## Change workflow

- Inspect status and existing diffs before editing; preserve unrelated work.
- Update this app's docs and the Go API OpenAPI/system references when the
  admin API contract changes.
- Run `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`
  before handoff.
- Never run a migration, direct SQL mutation, data reset, auth deletion, or
  production configuration change without asking the user for confirmation.
