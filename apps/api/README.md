# apps/api

NestJS + Drizzle + PostgreSQL 16 + better-auth. Scaffolded in stage 1.

Routes: `docs/02-architecture/API_CONTRACT.md`. Schema: `docs/02-architecture/DATA_MODEL.md`.

## Local setup

Claude Code's permission settings deliberately block agents from writing or
reading `.env` (`.claude/settings.json`), so a human creates it. Create a
`.env` at the **repo root** (not in `apps/api/`) with:

```
DATABASE_URL=postgres://acte:acte@localhost:5432/acte
PORT=4000
BETTER_AUTH_URL=http://localhost:4000
BETTER_AUTH_SECRET=<openssl rand -hex 32>
ENCRYPTION_MASTER_KEY=<openssl rand -hex 32>
WEB_ORIGIN=http://localhost:3000
BREVO_API_KEY=
BREVO_SENDER_EMAIL=no-reply@acte.app
NEXT_PUBLIC_API_URL=http://localhost:4000
COMPLIANCE_CLAIMS_ENABLED=false
```

`BREVO_API_KEY` can stay empty in dev — the email service logs to the
console instead of sending (see `src/email/brevo.service.ts`).

Then, with Postgres 16 reachable at `DATABASE_URL` (docker-compose, or a
native install — no Docker was available when this was scaffolded, so it
was verified against a native `postgresql@17` service; either works):

```bash
pnpm --filter @acte/api db:generate   # only after changing src/db/schema
pnpm --filter @acte/api db:migrate
pnpm --filter @acte/api db:seed       # demo firm, 5 members, prints dev login emails
pnpm --filter @acte/api dev
```

Seeded members log in with `<initials>@charpentier-associes.fr` (e.g.
`vc@charpentier-associes.fr`) and the password printed by `db:seed`.
