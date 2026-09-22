# STATUS

**Last updated:** 2026-09-22 · **Current stage:** 1/2 code-side substantially built, **gates still open** (see Blockers) · **Next milestone:** Yann's sign-off on Home/Journal/Dossiers so Stage 1 can formally close

**Note on how this got built:** an agent session built stage 1 and most of stage 2's code side in one pass, ahead of B1 (agreement not signed) and the stage 1/2 human sign-offs. Nothing here has been deployed, shown to a real firm, or pushed to a client-owned remote — it's local-only, ready for review. Items genuinely gated by an OPEN decision (Admin console/D-004, Notifications/D-005) were *not* built. See the Log entry below for the full rundown.

How to use this file: agents tick code-side boxes and append to the log at the end of every session. Humans tick human-side boxes. A stage cannot close while any box in its "Gate" list is open.

Owners: **D** = Darwin (engineering) · **Y** = Yann (client, product) · **E** = Evan (commercial)

---

## Blockers right now

| # | Blocker | Owner | Blocks |
|---|---|---|---|
| B1 | Agreement signature and period dates unconfirmed. Period 1 was written as 18 Aug – 17 Sep 2026, which has passed. Re-date if work starts later. | D, Y | Stage 1 |
| B2 | Brief v2 makes the desktop tracker the core product; the agreement excludes it (clause 1). Needs a scope amendment or a paid Diagnostic. | D, E, Y | Stages 3–5 |
| B3 | Prototype shows "ISO 27001 en préparation" and "audits de sécurité annuels" to firms. Neither is true. | Y | Any demo to a firm |

---

## Stage 0 — Setup

### Gate
- [ ] Agreement ACTE-BSA-08182026 signed by both parties (**D, Y**)
- [ ] Annex A (Data Protection & Security) signed (**D, Y**)

### Code side
- [x] `git init`, first commit of this pack — **local only**; no client-owned remote exists yet (human side below), so nothing has been pushed
- [x] `bash scripts/verify-prototype.sh` passes; CI workflow runs it on every push
- [x] Add `pnpm-lock.yaml` after first install; confirm Node version from `.nvmrc` — lockfile generated; **note:** local Node is v23.7.0, `.nvmrc` pins 22 — use `nvm`/`fnm` to match 22 before relying on engine-specific behaviour
- [x] Verify `packages/contracts` typechecks (`pnpm --filter @acte/contracts typecheck`) — passes, tests pass (4/4)
- [x] Record the Tailwind v3.4 pin and font strategy as DECIDED in `DECISIONS.md` (D-007) — already DECIDED in this pack

### Human side
- [ ] Create private GitHub organisation / repository in Yann's name, invite Darwin (**Y**)
- [ ] Create Scaleway account in Yann's name, Paris region, invite Darwin with a scoped IAM role (**Y**)
- [ ] Choose production domain and create DNS access (**Y**)
- [ ] Decide D-004: is the admin console role-gated? (**Y**)
- [ ] Decide D-008: turn off ISO 27001 / audit claims until true (**Y**)
- [ ] Send the reference list of legal research sites to track, even if provisional (**Y**, feeds D-006)
- [ ] Decide commercial route for the tracker: Diagnostic, amendment, or rev-share (**D, E**)

---

## Stage 1 — Foundation

### Gate
- [ ] Stage 0 complete
- [ ] B1 cleared

### Code side
- [x] Scaffold `apps/web` (Next.js 15, Tailwind 3.4, prototype `tailwind.config` and CSS variables copied verbatim)
- [x] Scaffold `apps/api` (NestJS, Drizzle, Postgres 16, better-auth)
- [~] Docker Compose for local Postgres; `.env.example` complete — docker-compose.yml already existed and is untouched; Docker itself wasn't available in the agent's sandbox, so the stack was verified against a native `postgresql@17` install instead (documented in `apps/api/README.md`). `.env.example` was **not** touched: Claude Code's own permission settings (`.claude/settings.json`) deny reading *and* writing any `.env*` file, so an agent cannot verify or complete it — a human needs to check it against the variable list now in `apps/api/README.md`.
- [x] Schema v1 from `docs/02-architecture/DATA_MODEL.md`: firm, member, dossier, task, correction, audit_log — plus device, activation_key, client_invoice (needed for stage 2 items built alongside; notification table intentionally not added, see D-005 note in stage 2 below)
- [x] Field-level encryption helper for sensitive columns, with tests (`apps/api/src/crypto/field-encryption.test.ts`, 6 tests: round-trip, tamper detection via GCM auth tag, key wrap/unwrap)
- [x] Auth: signup, login, logout, magic link, session; firm creation on first signup (better-auth + Drizzle adapter; verified end-to-end with real sign-in/sign-out)
- [x] Seed script reproducing the prototype's mock firm (5 members, 6 dossiers, 6 tasks) from contracts fixtures — today's Journal (the 6 `demoTasks`) and the "3 h 10 already validated" baseline are reproduced exactly, matching the prototype's Home KPIs (6 h 20 / 3 h 10 / 3 h 10); historical per-dossier minutes are plausible synthetic data, not byte-identical to the prototype's mock totals (see the comment at the top of `apps/api/src/db/seed.ts` for why)
- [x] Port app shell: sidebar nav, header, theme toggle (dark default, `html.light`), profile menu, toast
- [x] Port Home view (KPIs, pending tasks, weekly chart) on real data
- [x] Port Journal view: task list, confidence badge, dossier dropdown, validate, validate all, manual entry — **the AI "why" reasoning expand panel was deliberately not built**: that field doesn't exist in the schema pending D-003 (OPEN), so rows don't expand rather than showing invented or empty content
- [x] Port Dossiers view: grid, create, edit budget, archive / restore
- [x] `COMPLIANCE_CLAIMS_ENABLED` flag implemented, default false — wired end-to-end (env var → `apps/web/src/app/page.tsx` → `Shell` → `CloudView`), the only view built so far that has a compliance sentence in the prototype
- [x] Audit log on validate, reassign, dossier create / edit / archive
- [~] Visual diff: prototype vs port screenshots at 1440 px — done informally during the build (Home, Journal, Dossiers, Stats, Billing, Profile, Cloud, Settings all screenshotted and compared against the prototype markup while porting); **not done**: a formal Playwright visual-regression suite, 390 px mobile widths, or light-mode screenshots. `apps/web/e2e/dashboard.spec.ts` is a functional smoke suite (6 scenarios), not a visual diff.
- [ ] Staging deploy on Scaleway with synthetic data only — blocked: no Scaleway account exists yet (Stage 0 human side)

### Human side
- [ ] Review the three ported views against the prototype and sign off (**Y**)
- [ ] Confirm the French copy is final or list changes (**Y**)
- [ ] Demo at end of period (**D, Y**)
- [ ] Discovered: agree a real methodology for the Home ROI widget ("minutes recovered vs manual entry"). It currently ships as a placeholder heuristic (3 minutes assumed saved per automatically captured task) — see the comment above `MANUAL_ENTRY_OVERHEAD_MIN` in `apps/api/src/me/me.service.ts`. Don't quote this number to a firm as-is. (**Y, D**)

---

## Stage 2 — Web app complete

### Gate
- [ ] Stage 1 signed off by Yann

### Code side
- [x] Port Billing, Stats, Profile & Impact, Cloud & Sync, Settings views — wired to real data (`/v1/me/stats`, `/v1/billing/invoices`, `/v1/devices`, `/v1/me/profile`); the prototype's purely-fictional set-dressing (fixed 45/35/20 % "top apps", the Secib/Kleos/Jarvis connector cards, Factur-X export) was **not** ported — those connectors and Factur-X are explicitly excluded scope (`docs/05-commercial/SCOPE_BOUNDARY.md`), and the fixed source percentages had no real equivalent to port faithfully once the view reads actual validated-minute source breakdown instead of made-up numbers
- [ ] Port Admin console: team table, member menu, invite modal, edit modal, remind, suspend — **not built.** D-004 (is the admin console role-gated?) is OPEN; building the console's access and its member-editing actions would mean guessing that answer
- [ ] Subscription tab UI (Stripe wiring is stage 6) — **not built**, it lives inside the Admin console, skipped for the same D-004 reason
- [x] Activation key: generate, show once, store hashed, copy, revoke — SHA-256 hash at rest, plain key shown once client-side only, tested end-to-end through the Profile view UI
- [ ] Notifications table and in-app centre; budget and validation-lag rules — **not built.** D-005 (alert delivery channels) is OPEN
- [x] "Le Cerveau d'ACTE" panel with deterministic templated insights — real pending-count / low-confidence templated messages plus a small deterministic chat (no LLM), from `/v1/me/insights`
- [x] CSV export of validated time — `GET /v1/exports/validated.csv`, matches the prototype's column order exactly
- [~] Transactional email via Brevo: invitation, reminder — the Brevo service itself exists and is used for magic-link sign-in email (`apps/api/src/email/brevo.service.ts`, falls back to a console log when `BREVO_API_KEY` is unset); invitation and reminder emails specifically are Admin console actions and are blocked along with it (D-004)

### Human side
- [ ] Decide alert channels, D-005 (**Y**)
- [ ] Sign off all 9 views (**Y**)

---

## Stage 3 — Tracker architecture (not in current agreement)

### Gate
- [ ] Scope amendment or Diagnostic agreed in writing (**D, E, Y**)

**Untouched, on purpose.** The 2026-09-22 build session did not attempt any part of this stage: the gate above is open, `apps/tracker/README.md` says explicitly not to scaffold anything there before the amendment and D-001–D-003 are decided, and the spikes need real Windows/macOS hardware with OS permission prompts to observe — not something to fake from a sandbox.

### Code side
- [ ] Spike: Windows 11 foreground window + Word document identity
- [ ] Spike: macOS 14 foreground app + document identity; record which permission prompts appear
- [ ] Spike: Outlook activity signal, local vs Graph
- [ ] Spike: idle detection, CPU and RAM footprint
- [ ] Code signing dry run: Apple Developer ID notarisation, Windows signing
- [ ] Write recommendation in `docs/02-architecture/TRACKER_DESIGN.md`

### Human side
- [ ] Buy Apple Developer Program membership and Windows code signing certificate, in the client's name (**Y**)
- [ ] Decide D-001, D-002, D-003 on the written recommendation (**Y, D**)

---

## Stages 4–7
Task lists are written when stage 3 closes, from the decisions it produces. See `ROADMAP.md` for scope.

---

## Log

| Date | Who | Entry |
|---|---|---|
| 2026-09-22 | D | Starter pack created. Prototype v16 archived unchanged (sha256 in `scripts/verify-prototype.sh`). Brief v2 and agreement reconciled in `docs/00-brief/BRIEF_SUMMARY.md`. |
| 2026-09-22 | D (agent) | Built stage 0 fully and stage 1/2 code side almost entirely in one session, explicitly asked for by Darwin despite B1 and the stage 1/2 human gates being open (see the note at the top of this file). **api**: NestJS + Drizzle + Postgres 16 + better-auth, AES-256-GCM field encryption with per-firm wrapped keys, a firm-scoped data-access layer (nothing else touches the DB directly), auth (email+password, magic link, firm-created-on-signup), tasks/dossiers CRUD with audit logging, activation keys, CSV export, billing invoice drafts (D-010), deterministic Cerveau d'ACTE insights. **web**: Next.js 15 App Router, prototype's Tailwind config and full `<style>` block copied verbatim, French strings in `src/i18n/fr.ts`, a client-side dashboard shell (no router — matches the prototype's own JS view-switching) covering Home/Journal/Dossiers/Stats/Billing/Profile/Cloud/Settings on real API data. Deliberately not built: Admin console + its Subscription tab (D-004 OPEN), Notifications (D-005 OPEN), the Journal row's AI "why" panel (D-003 OPEN), anything under `apps/tracker` (stage 3, gated). Two real bugs were caught and fixed by writing `apps/web/e2e/dashboard.spec.ts` and actually driving it with Playwright: (1) `@UsePipes()` at the Nest method level was validating *every* parameter including `@CurrentFirm()`, silently breaking every mutating endpoint that combined the two — fixed by moving the pipe to `@Body()`; (2) the manual time-entry modal computed "now" in the browser's local timezone instead of Europe/Paris, so an entry could vanish from "today" for anyone outside France — fixed with a shared `parisTimeToIso` helper. Also fixed: seed script wasn't updating `dossier.last_activity_at`. Verified against a local Postgres 16 (Docker wasn't available in the sandbox; used a native `postgresql@17` install) in both dev mode and a real production build/start, plus the full Playwright suite, twice, against a fresh seed each time. CI (`ci.yml`) rewritten to actually run all of this: a Postgres service container, migrate, seed, boot both apps, install Chromium, run the e2e suite — the old `pnpm test` would have failed outright since `apps/web` had no test config at all. Discovered gaps fixed: `API_CONTRACT.md` never listed a billing route (D-010) or `/v1/me/profile`; `packages/contracts`'s internal imports and `apps/api`'s compiled-`dist` runtime path fought each other under plain Node — resolved by making tsx the API's runtime everywhere (D-009), never a compiled artifact. Not done: pushing anywhere (no client-owned remote exists — Stage 0 human side), touching `.env`/`.env.example` (Claude Code's own permission settings block agents from reading or writing any `.env*` file; documented the required variables in `apps/api/README.md` instead), a formal Playwright visual-regression suite at 390 px/light mode (informal screenshot comparisons were done for every view while porting), and anything Scaleway (no account yet). |
