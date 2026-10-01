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

**Email verification (D-017).** Signup sends a verification link and no session is opened until it
is followed; password reset and magic links are emailed too. Locally these all land in the dev
outbox (see above). Anywhere without `BREVO_API_KEY` and without the outbox — the Vercel beta today —
new signups, magic links and password resets fail on purpose. `db:seed` presets the demo accounts as
verified.

**Alert digest (D-019).** `GET/POST /v1/internal/alert-digest` emails each member a count of their
unread alerts. It needs `CRON_SECRET` (the caller sends `Authorization: Bearer $CRON_SECRET`; Vercel
Cron does this by itself once the variable is set on `acte-api`, see `vercel.json`) and answers 503
without it. To run it by hand locally:
`curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:4000/v1/internal/alert-digest`.

**Tests.** `pnpm --filter @acte/api test` runs the unit tests (no services). `pnpm --filter @acte/api test:routes`
runs the route tests with Supertest against the real app: they drop, re-create and migrate their own
database (`<DATABASE_URL's name>_routes`, local hosts only), so they never touch dev or e2e data.

**LLM chat (D-015), off by default.** The Cerveau d'ACTE chat calls an
OpenAI-compatible LLM API from `apps/api` only (never the browser). To try it
locally, add to the repo-root `.env`:

```
LLM_CHAT_ENABLED=true
LLM_API_KEY=<your Mistral API key>
LLM_MODEL=mistral-small-latest   # default on Mistral; use a model your Mistral plan allows
```

To use Scaleway Generative APIs instead, set all three: `LLM_BASE_URL=https://api.scaleway.ai/v1`,
a Scaleway secret key in `LLM_API_KEY`, and a Scaleway model id in `LLM_MODEL`
(e.g. `mistral-small-3.2-24b-instruct-2506`; Mistral's `-latest` aliases don't
exist there). `LLM_MODEL` is only optional on Mistral.

With the flag off or the key missing, `POST /v1/me/chat` answers 503
`llm_disabled` and the panel keeps its deterministic replies. The provider
receives aggregates with opaque dossier refs **plus the member's chat turns**,
pseudonymized best-effort: known dossier names and client labels (and their
words, punctuation-joined forms such as H&M or N'Diaye, and reference numbers),
the member's last 500 task titles typed in full, and links, e-mails,
whitespace-free filenames and paths with a common extension, phone numbers in
common French and international formats, and 6+ digit runs. Replies go back to
the panel twice — with names for display, with refs for history — so restored
names are never sent again. It fails closed (no provider call) for a firm with
more names than it can mask. Anything else typed — an opposing party's name, a
filename with spaces, pasted content — goes out as typed; the
full list is D-015's residual risk in `DECISIONS.md`, which you should read
before pointing a real firm at it. Rate limits are in memory, per instance (one request in flight per member).
Mistral's free tier can allow some models and not others (a model capped at
zero answers 429 on every call); if replies fall back to the deterministic
ones, try `LLM_MODEL=ministral-14b-latest`.

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

## Deploying the Vercel beta (D-013, D-016)

**Automatic:** every push to `main` that passes CI is deployed by the
`deploy-beta` GitHub workflow, once the repository has a `VERCEL_TOKEN`
secret (create a token at vercel.com/account/tokens with access to the team,
then `gh secret set VERCEL_TOKEN`). Until then the workflow skips with a
notice. **By hand:** `pnpm deploy:beta` from a clean, committed tree, with the
`vercel` CLI logged in.

Both run `scripts/deploy-beta.sh`, which does the steps in the only safe order:

1. **Checks the committed bundle.** The API is served from the committed
   esbuild bundle `api/index.js`, not from `src/`; the script rebuilds it and
   stops if it differs. Fix: `node scripts/build-vercel.mjs` in `apps/api`,
   commit `api/index.js` with the source it came from.
2. **Migrates Neon first.** Migrations here are additive, so the running
   deployment keeps working on the migrated schema; the reverse order (new
   code, old schema) fails every successful sign-in — that happened on
   2026-09-28. A migration that is *not* additive (drop, rename) needs two
   deploys: stop using the column first, drop it in the next one.
3. **Deploys the API, then the web app**, from the repo root (both projects
   have their Root Directory set to `apps/api` / `apps/web`).
4. **Smoke-tests** the API, `/login`, and a refused sign-in.

`BREVO_API_KEY` must be set on the `acte-api` project for magic links and
invitations to work (they fail on purpose without it, see above).
