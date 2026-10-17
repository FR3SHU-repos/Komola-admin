# Git Rules — KOMOLA Admin

- Work on `staging` first; merge to `main` only after checks and approval.
- Keep commits focused and use imperative, descriptive messages.
- Never commit `.env`, Supabase secrets, database URLs, service-role keys, or
  Redis credentials.
- Before committing, run `npm run typecheck`, `npm run lint`, `npm run build`,
  and `git diff --check`.
- Do not add direct database access to this app. Backend API contract changes
  belong in `go-api-backend` and must be documented there.
- Do not run migrations, direct SQL, or destructive data operations without
  explicit user confirmation.
- Preserve unrelated user changes and inspect the final diff before commit.
- Tag coordinated releases consistently across the KOMOLA repositories only
  when the user explicitly requests a release snapshot.
