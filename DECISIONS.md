# DECISIONS

Every decision that shapes the product lives here. **OPEN** decisions block the tasks that depend on them. Agents must not resolve an OPEN decision themselves; they may add evidence under it.

Format: ID · title · status · owner · date · context · options · decision · consequences.

---

## D-001 · How the tracker runs on each machine — OPEN
**Owner:** Darwin (recommendation), Yann (sign-off) · **Blocks:** stages 3–4
**Context:** Brief v2 §4.4 asks for a real design. The v1 dev guide prefers Tauri.
**Options:**
| Option | For | Against |
|---|---|---|
| Tauri background app + OS APIs | Small, one codebase, v1 guide preference | macOS window titles need Accessibility or Screen Recording permission |
| Office add-ins (Word, Outlook) + small Tauri agent | Reliable document and mail metadata, local | Add-in deployment via Microsoft 365 admin per firm |
| Browser extension only | Easy install | Cannot see Word or desktop Outlook |
**Decision:** —

## D-002 · Where case matching runs — OPEN
**Owner:** Darwin, Yann · **Blocks:** stage 5
**Context:** Annex A promises raw content stays on the device. Matching needs filenames and correspondents.
**Options:** local matcher on device (recommended) · hybrid with pseudonymised tokens · server-side (breaks Annex A, not acceptable without re-papering).
**Decision:** —

## D-003 · The "why" explanation — OPEN
**Owner:** Darwin, Yann · **Blocks:** stage 5 Journal work
**Context:** The prototype's reasoning text quotes filenames ("Conclusions_Delcourt_v3.docx") and addresses ("contact@sci-alma.fr"). Sent to the server as-is, it breaks Annex A.
**Options:**
1. Generated on device, encrypted end to end with a key the server never holds; the web app decrypts locally.
2. Templated server-side from non-sensitive signals only ("document linked to this dossier, active 1 h 17").
3. Shown only in the desktop Companion, not in the web app.
**Decision:** —

## D-004 · Admin console gating — OPEN
**Owner:** Yann · **Blocks:** stage 2 admin work
**Context:** In the prototype any user reaches the admin view from the profile menu.
**Recommendation:** role-gated. Only members with `is_admin` see Admin; server enforces it, not only the UI.
**Decision:** —

## D-005 · Alert delivery channels — OPEN
**Owner:** Yann · **Blocks:** stage 2 notifications
**Options:** in-app only · in-app + email digest · in-app + desktop notification from the Companion (stage 4+).
**Decision:** —

## D-006 · Browser source and site allowlist — OPEN
**Owner:** Yann · **Blocks:** browser source (Later)
**Context:** Légifrance and Dalloz in the prototype are placeholders. Browser tracking is the most invasive source.
**Rule regardless of outcome:** allowlist only; send domain and duration, never the URL path or page content.
**Decision:** —

## D-007 · Faithful port stack — DECIDED
**Date:** 2026-09-22 · **Owner:** Darwin
**Decision:** Next.js 15 + Tailwind **3.4** (not 4), prototype `tailwind.config` and CSS variables copied verbatim, fonts via `next/font/google` (self-hosted at build). The prototype file is never edited; a hash check enforces it.
**Why:** v4 changes configuration and colour handling and would alter the rendering; runtime Google Fonts leaks visitor IPs to Google.

## D-008 · Compliance claims in the UI — OPEN
**Owner:** Yann · **Blocks:** any demo to a real firm
**Context:** Prototype lines ~1763 and ~2144 state ISO 27001 "en préparation" and annual audits.
**Recommendation:** render behind `COMPLIANCE_CLAIMS_ENABLED`, default false, until a certification process has actually started.
**Decision:** — still OPEN (Yann has not decided). The recommended flag mechanism itself is implemented and verified default-off in the Cloud & Sync view (the only place the claim appears so far — Admin console isn't built yet, D-004); that's a stage 1 code task, not a resolution of this decision.

## D-009 · `apps/api` runtime is tsx everywhere, not a compiled artifact — DECIDED
**Date:** 2026-09-22 · **Owner:** Darwin
**Decision:** `pnpm --filter @acte/api start` runs `node --import tsx src/main.ts`, the same way `dev` does (minus `--watch`). There is no `node dist/main.js` production path.
**Why:** `packages/contracts` ships TypeScript source with extensionless internal imports (works under tsx, vitest, and Next's webpack via `moduleResolution: "Bundler"`). Plain Node's ESM loader needs explicit `.js` extensions and doesn't reliably fall back to sibling `.ts` files across the experimental type-stripping and non-type-stripping code paths — chasing that compatibility (tried: adding `.js` extensions everywhere) broke the web app's webpack build instead. tsx sidesteps the whole class of problem by using bundler-style resolution consistently in every environment.
**Consequence:** Before a real Scaleway deployment, revisit this — either accept tsx in production (used in production by real projects; images just need Node not just static JS) or invest in bundling `apps/api` with esbuild/tsup so `packages/contracts` gets inlined and Node's strict resolution stops mattering. `tsc -p tsconfig.build.json` (`pnpm build`) is kept as a type-check-shaped CI sanity step even though its `dist/` output isn't used to run anything.

## D-010 · Billing invoice-draft endpoint added ahead of API_CONTRACT.md — DECIDED
**Date:** 2026-09-22 · **Owner:** Darwin
**Decision:** Added `GET/POST /v1/billing/invoices` (list drafts, generate one from a dossier's validated minutes) even though the original `API_CONTRACT.md` never listed a billing route. Now reconciled in that file.
**Why:** `PRODUCT_SPEC.md`'s Billing view explicitly requires "generate invoice draft", and `DATA_MODEL.md` already specifies the `client_invoice` table — the contract table was a starter-pack gap, not a deliberate exclusion. Distinct from the stage 6 Stripe *subscription* billing, which stays untouched.

## D-011 · Companion download modal and chat voice dictation built as a scope override — DECIDED
**Date:** 2026-09-22 · **Owner:** Darwin
**Context:** `CLAUDE.md` section 4 explicitly excludes both the desktop tracker (needs a scope amendment, clause 1) and "voice capture (`mic-btn`)", saying to port their UI only as inert stubs "if the stage says so" — it didn't. An agent flagged this conflict directly (`AskUserQuestion`) before building anything, and Darwin explicitly chose "build them fully now" for this session, overriding the exclusion.
**Decision:** Built both as UI-only simulations, byte-for-byte matching what the prototype itself already does (no real installer, no real microphone/Web Speech API access) — `apps/web/src/components/companion-modal.tsx` (OS-detected download modal, fake download+toast sequence) and the mic button in `apps/web/src/components/brain-panel.tsx` (fake "listening" state, hardcoded fake transcript, sent through the same deterministic chat as typed input).
**Why this is still safe:** neither touches `apps/tracker` (still untouched beyond its README) and neither requests real OS permissions or captures anything — it's cosmetic parity with the prototype's own mock, not a step toward the real Companion. D-001–D-003 remain OPEN; nothing here decides them.
**Consequence:** The sidebar's download icon and the chat's mic button are now live in the local build. Don't demo this to Yann or a firm without being clear it's non-functional — a firm could reasonably read "Télécharger ACTE Tracker" as a real download, which it isn't. If the scope amendment for the tracker doesn't happen, revert `companion-modal.tsx` and the download rail button before any real demo; the voice button is harmless either way (it's exactly as fake as the prototype's).

## D-012 · Public marketing site added as parallel scope — DECIDED
**Date:** 2026-09-23 · **Owner:** Darwin
**Context:** The product had no public page before `/login` — visiting the site landed a stranger on a bare sign-in form with no explanation of what ACTE is. Darwin asked for a marketing site "before the login screen," then for terms/privacy/overview/about/guides/blog pages, then for a bilingual toggle on it.
**Decision:** Built a public marketing site in `apps/web` (`/`, `/overview`, `/about`, `/guides`, `/blog`, `/terms`, `/privacy`), moved the authenticated dashboard from `/` to `/dashboard`, and added `/signup` (the `sign-up/email` better-auth endpoint already worked — auto-creates a firm — but had no frontend). Not a ROADMAP.md stage item, but touches none of the excluded scope (tracker, connectors, admin console) — it's the front door in front of already-built auth.
**Why not built as a translated dashboard:** kept `apps/web/src/i18n/fr.ts` untouched and out of scope; that file is documented as French-only, ported verbatim from the prototype, and a separate concurrent session was already deep in unrelated dashboard work there. Marketing copy lives in its own components instead.
**Consequences:**
1. `/terms` and `/privacy` ship with placeholder legal identifiers (SIRET, registered address, legal representative, DPO contact) since no company registration exists yet (Stage 0 human side, blocker B4) — needs real info and a lawyer's review before any real firm sees them. Privacy content is otherwise grounded directly in `docs/03-security/PRIVACY_MODEL.md`, not invented.
2. No fabricated marketing claims anywhere on the site — no customer counts, testimonials, press mentions, named team bios, or compliance certifications (same discipline as D-008) — copy only describes features already checked off in STATUS.md, with the Companion/tracker and AI dossier-matching explicitly marked "à venir".
3. The requested bilingual (FR/EN) toggle was **deferred**, not built: mid-session, a separate concurrent session turned out to be building a full FR/EN i18n system for the dashboard itself (`apps/web/src/i18n/{fr,en}.ts`, `locale-context.tsx`, `lib/locale-server.ts`). Rather than ship a second, incompatible toggle mechanism, Darwin chose to wait for that to land and reuse it for the marketing site. Pick this up once that infrastructure is stable — do not build an independent one without checking again first.

**Update, 2026-09-23 (same day):** the dashboard session finished, and Darwin asked to continue the toggle. Reused the now-stable `useI18n()`/`locale-context.tsx` infrastructure exactly as planned above — added `landing`/`overview`/`about`/`guides`/`blog`/`terms`/`privacy` dictionary keys to both `fr.ts` and `en.ts`, and rewired every marketing page plus `/login` and `/signup` to read through `useI18n()` instead of the static `fr` import. `/login` and `/signup` have no navbar, so they get a standalone `LocaleToggleButton` component (extracted from the navbar's toggle, now shared by both). `/dashboard` was not touched — it already had its own complete, separate i18n migration from the concurrent session. See the Stage 2 / "Marketing site" log entries in `STATUS.md` for the full file list.
