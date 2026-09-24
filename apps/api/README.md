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

`BREVO_API_KEY` can stay empty locally and in CI: emails (magic links,
invitations, reminders) are written as JSON files to a dev outbox —
`$EMAIL_DEV_OUTBOX`, default `<os tmpdir>/acte-dev-outbox` — and the console
only prints the file path, never the link. The e2e suite reads invite links
from there. The outbox is **opt-in**: the `dev` script enables it
(`NODE_ENV=development`), CI sets `EMAIL_DEV_OUTBOX`. Anywhere else, and
always on Vercel or with `NODE_ENV=production`, a missing key makes every
send **fail loudly**: magic links and invite links are bearer credentials,
so they are never logged, written to disk on a server, or silently dropped
(see `src/email/brevo.service.ts`). If you start the API by hand for the
e2e suite, set `EMAIL_DEV_OUTBOX` for both the API and Playwright.

The API scripts load the repo-root `.env` with `--env-file-if-exists`, so CI
(which has no `.env` and sets real env vars instead) works too.

**Note:** `COMPLIANCE_CLAIMS_ENABLED` and `COMPANION_UI_ENABLED` are both
read by `apps/web` (`apps/web/src/app/dashboard/page.tsx`), not `apps/api`
— `next dev` only auto-loads env files from `apps/web/` itself, never this
repo-root `.env` (only `apps/api`'s `--env-file` flag reads that). To flip
either one locally, set it in `apps/web/.env.local` or
`apps/web/.env.development.local` instead; on Vercel, set it on the
`apps/web` project directly. Both default to `false`/off when unset.
`COMPANION_UI_ENABLED` gates the sidebar "Télécharger ACTE — Compagnon"
button and its download modal (`companion-modal.tsx`) — both are UI-only
simulations (no real installer, see D-011 in `DECISIONS.md`) and stay off
by default so a real firm never sees what could read as a working
download; flip it on only for an internal demo that will explicitly call
out the simulation.

Then, with Postgres 16 reachable at `DATABASE_URL` (docker-compose, or a
native install — no Docker was available when this was scaffolded, so it
was verified against a native `postgresql@17` service; either works):

```bash
pnpm --filter @acte/api db:generate   # only after changing src/db/schema
pnpm --filter @acte/api db:migrate
pnpm --filter @acte/api db:seed       # demo firm, 5 members, prints dev login emails
pnpm --filter @acte/api dev
```

**Encrypted rows only decrypt with the exact `ENCRYPTION_MASTER_KEY` they were
written under.** If you ever regenerate that key (e.g. recreating `.env` from
scratch) against a database seeded under a different one, every task/dossier
read fails with a Node `Unsupported state or unable to authenticate data`
error (a GCM auth-tag mismatch) — not recoverable, by design. For a **local**
database, reset with:

```bash
pnpm --filter @acte/api db:reset      # drops + recreates the DB, then migrate + seed
```

`db:reset` is local-only: it refuses any host other than `localhost` /
`127.0.0.1` / `::1`, and refuses outright on Vercel or with
`NODE_ENV=production` (an exported shell `DATABASE_URL` overrides `.env`, so
it can't rely on the file). If you see the GCM error against the **Neon
beta**, the cause is a key mismatch with Vercel's `ENCRYPTION_MASTER_KEY` —
use that key; never reset a shared database. (A one-off override for a
disposable remote DB: `ACTE_ALLOW_DB_RESET_HOST=<exact hostname>`.)

`db:reset` needs the `DATABASE_URL` role to have `CREATEDB`. The official
`postgres` Docker image's default user already has it; a native install's
role may not — if `db:reset` fails with "permission denied to create
database", grant it once: `psql -d postgres -c "ALTER ROLE acte CREATEDB;"`
(adjust the role name if your `DATABASE_URL` differs from the default).

Seeded members log in with `<initials>@charpentier-associes.fr` (e.g.
`vc@charpentier-associes.fr`) and the password printed by `db:seed`.

## Deploying the Vercel beta (D-013)

Neither Vercel project is linked to GitHub — pushing to `main` deploys
nothing. A deploy is manual, and the API is served from the **committed**
esbuild bundle `api/index.js`, not from `src/`. Order matters:

1. **Migrate Neon first**, with `DATABASE_URL` pointed at Neon for that one
   run: `pnpm --filter @acte/api db:migrate`. Migrations here are additive, so
   the currently deployed bundle keeps working against the migrated schema;
   the reverse order (new bundle, old schema) fails every authenticated
   request.
2. **Rebuild and commit the bundle**: `node scripts/build-vercel.mjs` in
   `apps/api`, commit `api/index.js` with the source it came from. The build
   is deterministic; if `src/` changed and `api/index.js` didn't, the bundle
   is stale.
3. **Set `BREVO_API_KEY`** on the `acte-api` project if it isn't — without it,
   magic links and invitations now fail on purpose (see above).
4. `vercel deploy --prod` from `apps/api`, then from `apps/web`.
