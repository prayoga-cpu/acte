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
