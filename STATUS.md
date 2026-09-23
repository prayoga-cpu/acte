# STATUS

**Last updated:** 2026-09-23 · **Current stage:** 1/2 code-side substantially built, **gates still open** (see Blockers); public marketing site added in parallel · **Next milestone:** Yann's sign-off on Home/Journal/Dossiers so Stage 1 can formally close

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
| B4 | `/terms` and `/privacy` (new marketing site, see below) ship with placeholder legal identifiers (SIRET, registered address, legal representative, DPO contact) — no company registration exists yet (Stage 0 human side). Needs real info and a lawyer's review before any real firm sees them. | Y | Any demo to a firm |

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
- [x] Billing view invoice download — the prototype's `downloadInvoice` (client-side demo `.txt`, no back-end) was missing from the ported Billing view; added `downloadInvoiceDemo` in `billing-view.tsx` with a "Télécharger" button next to a generated invoice's "Générée" badge, same disclaimer caption as the prototype ("document de démonstration, sans back-end"). No new API surface, no new sensitive data exposed — built from `ClientInvoiceSummary` fields already rendered on screen plus `member.hourlyRateCents`/`displayName`
- [~] Transactional email via Brevo: invitation, reminder — the Brevo service itself exists and is used for magic-link sign-in email (`apps/api/src/email/brevo.service.ts`, falls back to a console log when `BREVO_API_KEY` is unset); invitation and reminder emails specifically are Admin console actions and are blocked along with it (D-004)
- [x] Settings source toggles now persist for real — `GET/PATCH /v1/me/sources` (per-member `jsonb` column), replacing the earlier local-only `useState`. Nothing acts on the preference yet (no Companion to turn on/off), but the setting itself is genuine.
- [x] Companion download modal + sidebar download icon, and a mic/voice-dictation button in the Cerveau d'ACTE chat — **both explicitly excluded by `CLAUDE.md` §4** ("desktop tracker" needs a scope amendment; "voice capture (mic-btn)" is excluded until further notice). Built anyway at Darwin's explicit direction after being asked to confirm the override — see **D-011**. Both are UI-only simulations matching the prototype's own mock behaviour exactly (no real installer, no real microphone access, no `apps/tracker` code touched). Don't demo either to Yann/a firm without flagging they're non-functional.
- [x] French/English i18n with device-language auto-detect and a persistent toggle — infrastructure in `apps/web/src/i18n/{fr,en}.ts`, `locale-context.tsx`, `lib/locale-server.ts` (Accept-Language header on first visit with zero flash, `acte-locale` cookie once switched, `Widen<T>` type so both dictionaries satisfy one `Dictionary` type), wired into the root layout and `Shell` (language toggle next to the theme toggle). Every dashboard component (Home, Journal + its 4 sub-components, Dossiers + its 3 modals/menu, Stats, Billing, Profile + activation keys, Cloud, Settings, Brain panel, Companion modal) now reads through `useI18n()` — none import the static `fr` object directly any more. Verified server-side with real login + cookie/header overrides on `/dashboard` (both locales render correctly, cookie beats header). Only `apps/web/src/components/marketing/*` still import `fr` directly — out of scope by design, see D-012 (marketing site stays French-only for now).

### Human side
- [ ] Decide alert channels, D-005 (**Y**)
- [ ] Sign off all 9 views (**Y**)

---

## Marketing site (parallel to the ROADMAP stages)

Not a ROADMAP.md stage item — the product had no public page before `/login`. Built at Darwin's explicit request, in `apps/web` alongside the authenticated app, sharing its design system but not its `fr.ts` (which stays scoped to the ported dashboard). See D-012.

### Code side
- [x] Public landing page at `/` (navbar, hero with a labelled demo-data preview, features, how-it-works, security, CTA banner, footer); authenticated visitors hitting `/` are redirected to `/dashboard`
- [x] Dashboard moved from `/` to `/dashboard` (was the whole app before this session)
- [x] `/signup` page — the `sign-up/email` better-auth endpoint already worked (auto-creates a firm) but had no frontend at all until now
- [x] `/overview`, `/about`, `/guides`, `/blog`, `/terms`, `/privacy` — shared `LandingNavbar` / `LandingFooter` / `Logo` components (`apps/web/src/components/marketing/`)
- [x] No fabricated marketing claims: no customer counts, testimonials, press mentions, named team bios, or compliance certifications — copy is scoped to features already checked off elsewhere in this file, with the Companion/tracker and AI dossier-matching explicitly marked "à venir" wherever mentioned
- [x] Bilingual FR/EN toggle across the entire public site — picked back up once the dashboard's i18n migration (`useI18n()`, `locale-context.tsx`, `lib/locale-server.ts`) landed, per D-012's plan to reuse it rather than build a second mechanism. Every marketing page (`/`, `/overview`, `/about`, `/guides`, `/blog`, `/terms`, `/privacy`) plus `/login` and `/signup` now read through `useI18n()` — none import the static `fr` object directly any more. `/login` and `/signup` (no navbar) get a standalone `LocaleToggleButton` (new shared component, `apps/web/src/components/locale-toggle-button.tsx`, also now used by the marketing navbar) fixed top-right. Full English copy for every page's content lives in `apps/web/src/i18n/en.ts` alongside the French in `fr.ts`, in new top-level keys: `landing`, `overview`, `about`, `guides`, `blog`, `terms`, `privacy`. `/dashboard` is untouched by any of this — it stays on the prototype's French copy per `CLAUDE.md` §7, exactly as the dashboard's own i18n work already respected.

### Human side
- [ ] Provide real company identity (SIRET, registered address, legal representative, DPO contact) for `/terms` and `/privacy` — currently placeholder text, blocks any real demo (B4) (**Y**)
- [ ] Choose the production domain (Stage 0 human side) so `/terms`/`/privacy` can carry a real contact address (**Y**)

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
| 2026-09-23 | D (agent) | Asked to "implement settings and the download features" and "add the voice message on the chatbox". Found Settings (`settings-view.tsx`) and the chatbox voice dictation (`brain-panel.tsx` mic button, per D-011) already fully built and uncommitted in the working tree from a prior pass, matching the prototype's real runtime behaviour byte-for-byte (checked against `prototype/acte-dashboard-v16.html`'s actual `mic-btn` handler, not the stale "Inert, Later" note in `PROTOTYPE_MAP.md` line 44 — the prototype itself simulates listening + a fixed transcript + send, exactly what's ported). The Companion download modal (`companion-modal.tsx`, wired into `shell.tsx`'s sidebar) and the CSV export (Billing view) were likewise already done. One real gap remained: the prototype's per-invoice `downloadInvoice()` (a client-side, no-back-end demo `.txt`, distinct from the CSV export) had no equivalent in the ported Billing view — a generated invoice showed a "Générée" badge with no way to download it. Added `downloadInvoiceDemo` + a "Télécharger" button in `billing-view.tsx` (threaded `member` and `onToast` props from `shell.tsx`), same disclaimer caption as the prototype. Did not touch `fr.ts`/`en.ts`, `login/**`, `signup/**`, or marketing components — those belong to a separate, concurrent i18n-migration pass already underway in this tree (visible in `shell.tsx`'s `useI18n()` usage), out of scope for this session. `pnpm --filter @acte/web typecheck`, `lint`, and `scripts/verify-prototype.sh` all pass. No DECISIONS.md entry needed — this is a faithful completion of the already in-scope, already-checked-off Stage 2 Billing item, not a new scope override (unlike D-011, which the download/voice features already fell under before this session). |
| 2026-09-23 | D (agent) | Asked to build a public marketing site "before the login screen" with concrete data, then to add terms/privacy/overview/about/guides/blog pages. Built the "Marketing site" section above in full: `/` (landing), `/dashboard` (moved from `/`), `/signup` (new — wraps the already-working but frontend-less `sign-up/email` endpoint), `/overview`, `/about`, `/guides`, `/blog` (the last four written by 4 parallel Workflow agents, one file each, no shared-file edits, reviewed afterward), and `/terms`/`/privacy` (written directly, not delegated, given their legal sensitivity — privacy content is grounded line-for-line in `docs/03-security/PRIVACY_MODEL.md`; both carry placeholder legal identifiers, see B4/D-012). Kept `fr.ts` untouched by choice — see D-012. **Found and recovered from a live collision**: another concurrent session (`acte-12`) was mid-flight on unrelated dashboard work in this exact tree and, partway through, an untracked new file (`apps/web/src/app/dashboard/page.tsx`) and a `fr.ts` edit were wiped from under this session — both recovered by re-writing them; no data was permanently lost, but flagging it here in case anything else got clipped that wasn't this session's to notice. That session turned out to be building a FR/EN i18n system for the dashboard itself (`apps/web/src/i18n/{fr,en}.ts`, `locale-context.tsx`, `lib/locale-server.ts` — see the Stage 2 log entry above) — asked by Darwin mid-session whether the marketing site's own requested language toggle should proceed independently; Darwin chose to defer it until that lands, so the marketing site is French-only for now. `pnpm --filter @acte/web typecheck`, `lint`, and `build` all pass (all new routes compile). Live browser verification of `/` succeeded; `/signup` hit a stale-chunk error from the *other* session's dev server (`.next` cache corruption from two sessions writing concurrently) rather than from this code — not re-verified live to avoid touching that session's running process. |
| 2026-09-23 | D (agent) | Finished the i18n migration (fr/en, `useI18n()`) started earlier this session. A 10-agent background Workflow fanned out one file group per agent; 6 landed cleanly (home, stats, profile, cloud, settings, brain-panel/companion-modal — the last two done together by the `billing-view` agent, which also restructured `companion.body` into `bodyPre`/`bodyEmphasis`/`bodyPost` in `fr.ts`/`en.ts` to preserve the prototype's bold "en local" emphasis). The other 4 agents (journal-group, dossiers-group, billing-view, and a duplicate pass on billing-view) got confused by leftover conversational framing in their prompts — each one treated an unrelated relayed-context blurb ("implement settings and the download features…", already-done work from earlier this session) as a competing "user request" that overrode their actual assigned file list, and did no i18n work on their targets. One of them (journal-group) used its idle run productively anyway: it found and fixed a real gap (the prototype's per-invoice `downloadInvoice()` demo download had no port) — see the Stage 2 checklist entry above — but left journal/dossiers/billing untouched. I finished the remaining ~10 files directly (no second workflow, to avoid repeating the same prompt-framing bug): `journal-card.tsx`, `manual-entry-modal.tsx`, `task-row.tsx`, `confidence-badge.tsx`, `source-badge.tsx`, `dossiers-view.tsx`, `dossier-menu.tsx`, `budget-modal.tsx`, `new-dossier-modal.tsx`, `billing-view.tsx`, plus `activation-keys.tsx` (Profile view) and small fixups in `home-view.tsx`/`stats-view.tsx`/`cloud-view.tsx` for strings the workflow agents had correctly flagged as missing dictionary keys rather than inventing translations. Added ~35 new key pairs to `fr.ts`/`en.ts` for strings that were previously inline literals never routed through the dictionary at all (e.g. "Aucune activité", "Non assigné", "Saisie manuelle", dossier-menu actions, the new-dossier modal, budget modal) — all copied verbatim from the existing inline French, with matching English added. Left as French-only by design, matching how other agents treated similar cases: `downloadInvoiceDemo()`'s generated `.txt` document body (data-templated content, not on-screen UI), file-size units ("Mo"), and OS names. Every dashboard component now reads through `useI18n()`; only `apps/web/src/components/marketing/*` still imports the static `fr` object (correct — out of scope, D-012). Verified: `pnpm --filter @acte/web typecheck` and `lint` clean, `scripts/verify-prototype.sh` passes, and live server-rendered checks via real login + cookie/header overrides confirm both locales render correctly on Home/Journal/Settings/Billing-nav-label on `/dashboard`. **Not verified live**: clicking into the Dossiers/Billing tabs specifically — the shared dev server's `.next` client bundle is 404ing (`main-app.js`, `app-pages-internals.js`), so the page isn't hydrating and nothing is clickable right now. This is the same stale-chunk symptom the marketing-site log entry above already hit once from concurrent `next dev`/`build` processes; did not restart the dev server or touch `.next` to avoid disrupting the other session's in-progress work. Whoever picks this up next: if `acte-81`'s session has ended, `pkill -f "next dev"` + `rm -r apps/web/.next` + fresh `pnpm dev` should clear it, then a quick click-through of Dossiers/Billing in both languages would close this out. |
| 2026-09-23 | D (agent) | Picked the marketing-site FR/EN toggle back up per D-012's plan, now that the dashboard's `useI18n()` migration (previous log entry) is done. Added `landing`, `overview`, `about`, `guides`, `blog`, `terms`, `privacy` dictionary keys to both `fr.ts` and `en.ts` (full English copy, not machine-translated placeholders — written by hand for `terms`/`privacy`/the landing hero, and via 4 parallel Workflow agents for `overview`/`about`/`guides`/`blog`'s bulk prose, each given the exact French source and told to preserve the existing "à venir"/no-fabricated-claims framing). Split `apps/web/src/app/page.tsx` into a server component (the auth-redirect check) plus a new client component `components/marketing/landing-content.tsx` so it could read `useI18n()`. Rewired `navbar.tsx`, `footer.tsx`, and all of `/overview`, `/about`, `/guides`, `/blog`, `/terms`, `/privacy` (the last six via a second parallel Workflow — purely mechanical "swap literal strings for dictionary fields" with no content changes, since the dictionary was already finalized before dispatch) to read through `useI18n()` instead of the static `fr` import. One agent (`about`) initially went further than asked — it saw the relayed live conversation and built its own bilingual version depending on `lib/locale-server.ts` directly, overriding an explicit earlier "hold off" instruction — caught in review and reverted to match the others before the second workflow ran. Darwin then flagged that `/login` and `/signup` (no navbar, so no toggle at all) were still missed; fixed by extracting a standalone `LocaleToggleButton` component (`apps/web/src/components/locale-toggle-button.tsx`, now also used by the marketing navbar) and rewiring `login-form.tsx`/`signup-form.tsx` off the static `fr` import. Every public page now reads through `useI18n()`; `/dashboard` is untouched, as intended (`CLAUDE.md` §7 keeps the ported prototype French-only). Verified: `pnpm --filter @acte/web typecheck`, `lint`, and `build` all pass (all 11 routes compile). **Not verified live in a browser**: the shared dev server hit the same `.next` cache corruption noted in the two log entries above (concurrent `next dev` processes across sessions) both times a screenshot was attempted — did not touch that process, per the same reasoning as before. |
| 2026-09-23 | D (agent) | Darwin hit the `.next` cache corruption above directly in Safari (blocked, not just a log note) and asked to fix it. By this point every other session was idle, so restarted cleanly: killed the stale `next dev` on :3000, relaunched `pnpm dev` fresh (no `.next` wipe — `rm -rf` is denied by this project's permission settings, and a clean restart with no concurrent writer turned out to be enough on its own). Verified live in a real browser this time: landing page renders correctly in both languages, the navbar toggle switches FR↔EN instantly with no console errors, `/terms` and `/privacy` render correctly. Caught one real bug while checking `/terms` in English: the publisher-name placeholder in section 1 (`[Raison sociale de l'éditeur — à compléter]`) was still a hardcoded French literal in `terms/page.tsx`, never routed through the dictionary — missed during the earlier rewiring because, unlike section 13's placeholders, section 1 never got its own dictionary field. Added `terms.s1.companyPlaceholder` to `fr.ts`/`en.ts` and fixed the reference. `typecheck`/`lint`/`build` all pass. |
