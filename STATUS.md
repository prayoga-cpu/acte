# STATUS

**Last updated:** 2026-09-22 · **Current stage:** 0 — Setup · **Next milestone:** Stage 1 exit (seeded demo firm reproduces Home, Journal, Dossiers)

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
- [ ] `git init`, first commit of this pack, push to a **client-owned** private repository
- [ ] `bash scripts/verify-prototype.sh` passes; CI workflow runs it on every push
- [ ] Add `pnpm-lock.yaml` after first install; confirm Node version from `.nvmrc`
- [ ] Verify `packages/contracts` typechecks (`pnpm --filter @acte/contracts typecheck`)
- [ ] Record the Tailwind v3.4 pin and font strategy as DECIDED in `DECISIONS.md` (D-007)

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
- [ ] Scaffold `apps/web` (Next.js 15, Tailwind 3.4, prototype `tailwind.config` and CSS variables copied verbatim)
- [ ] Scaffold `apps/api` (NestJS, Drizzle, Postgres 16, better-auth)
- [ ] Docker Compose for local Postgres; `.env.example` complete
- [ ] Schema v1 from `docs/02-architecture/DATA_MODEL.md`: firm, member, dossier, task, correction, audit_log
- [ ] Field-level encryption helper for sensitive columns, with tests
- [ ] Auth: signup, login, logout, magic link, session; firm creation on first signup
- [ ] Seed script reproducing the prototype's mock firm (5 members, 4 dossiers, 6 tasks) from contracts fixtures
- [ ] Port app shell: sidebar nav, header, theme toggle (dark default, `html.light`), profile menu, toast
- [ ] Port Home view (KPIs, pending tasks, weekly chart) on real data
- [ ] Port Journal view: task list, confidence badge, dossier dropdown, validate, validate all, manual entry
- [ ] Port Dossiers view: grid, create, edit budget, archive / restore
- [ ] `COMPLIANCE_CLAIMS_ENABLED` flag implemented, default false
- [ ] Audit log on validate, reassign, dossier create / edit / archive
- [ ] Visual diff: prototype vs port screenshots at 1440 px and 390 px for Home, Journal, Dossiers
- [ ] Staging deploy on Scaleway with synthetic data only

### Human side
- [ ] Review the three ported views against the prototype and sign off (**Y**)
- [ ] Confirm the French copy is final or list changes (**Y**)
- [ ] Demo at end of period (**D, Y**)

---

## Stage 2 — Web app complete

### Gate
- [ ] Stage 1 signed off by Yann

### Code side
- [ ] Port Billing, Stats, Profile & Impact, Cloud & Sync, Settings views
- [ ] Port Admin console: team table, member menu, invite modal, edit modal, remind, suspend
- [ ] Subscription tab UI (Stripe wiring is stage 6)
- [ ] Activation key: generate, show once, store hashed, copy, revoke
- [ ] Notifications table and in-app centre; budget and validation-lag rules
- [ ] "Le Cerveau d'ACTE" panel with deterministic templated insights
- [ ] CSV export of validated time
- [ ] Transactional email via Brevo: invitation, reminder

### Human side
- [ ] Decide alert channels, D-005 (**Y**)
- [ ] Sign off all 9 views (**Y**)

---

## Stage 3 — Tracker architecture (not in current agreement)

### Gate
- [ ] Scope amendment or Diagnostic agreed in writing (**D, E, Y**)

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
