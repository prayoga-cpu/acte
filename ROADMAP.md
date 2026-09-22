# ROADMAP

Product goal: a lawyer works normally; ACTE turns that work into billable, case-linked time entries with a confidence score; the lawyer validates in minutes; the firm bills more of the time it already spends. Nothing confidential leaves the lawyer's machine.

Stages are sequential. A stage starts when the previous stage's exit criteria are met **and** its human-side gates are cleared in `STATUS.md`.

## Overview

| # | Stage | Goal | Contract status | Gate to start |
|---|---|---|---|---|
| 0 | Setup | Repo, accounts, decisions, compliance copy | Covered | Agreement signed |
| 1 | Foundation | Auth, firm, roles, data model, manual entry end to end, app shell | Covered (period 1) | Stage 0 done |
| 2 | Web app complete | All 9 prototype views on real data, admin console, in-app alerts | Covered, monthly | Stage 1 done |
| 3 | Tracker architecture | Decide how capture runs on Windows and macOS; spikes | **Not covered** | Paid Diagnostic or amendment |
| 4 | Tracker MVP | Word + Outlook capture, activation keys, encrypted sync | **Not covered** | Stage 3 decisions closed |
| 5 | AI matching | Case matching, confidence score, corrections, low-confidence alerts | **Not covered** | Stage 4 done, eval set agreed |
| 6 | Billing and admin | Stripe seats, invoices, exports, budget alerts, feedback page | Partly covered | Stage 2 done |
| 7 | Beta | Security review, DPIA pack, 2–3 pilot firms | Not covered | Stages 4–6 done |
| — | Later | Browser source, PMS connectors, Factur-X, voice, mobile | Excluded | Separate scope |

"Covered" refers to the Build Stage Agreement ACTE-BSA-08182026 (see `docs/05-commercial/SCOPE_BOUNDARY.md`). Stages 3–5 are the product's core and are excluded by clause 1 until amended in writing.

## Stage 0 — Setup
**Goal:** a repo that any agent can pick up, with the accounts and decisions that later stages need.
**Exit:** repo pushed, CI green including prototype hash check, client-owned accounts created, D-004 and D-008 decided, compliance claims flagged off.

## Stage 1 — Foundation
**Goal:** a real, deployed skeleton of ACTE that a lawyer can log into and enter time manually.
**Includes:** auth (email + password, magic link), firm creation, member roles, the core schema (firm, member, dossier, task, audit log), manual task entry, validate / validate all, dossier create / edit budget / archive, the app shell (sidebar, header, theme toggle, profile menu) ported pixel-faithful, Home and Journal and Dossiers views on real data, staging deploy on Scaleway.
**Exit:** a seeded demo firm reproduces the prototype's Home, Journal and Dossiers screens from the database, visually indistinguishable from the prototype at 1440 px and 390 px.

## Stage 2 — Web app complete
**Goal:** every screen of the prototype backed by the API, still with manual and seeded data.
**Includes:** Billing, Stats, Profile & Impact, Cloud & Sync (device list reads from DB, actions stubbed until stage 4), Settings, Admin console (team tab: invite, edit rate, remind, suspend; subscription tab UI), activation key generation / hashing / revocation, in-app notifications for budget and validation lag, the "Le Cerveau d'ACTE" panel with deterministic templated insights (no LLM yet), CSV export.
**Exit:** all 9 views match the prototype; admin actions write to the DB and the audit log; activation keys are stored hashed.

## Stage 3 — Tracker architecture (Diagnostic)
**Goal:** close D-001, D-002, D-003 with evidence rather than opinion.
**Includes:** spike on Windows 11 and macOS 14: foreground app + document identity for Word, Outlook activity signal, idle detection, permission prompts required, CPU/RAM footprint, auto-start, signing and notarisation dry run. Written recommendation in `docs/02-architecture/TRACKER_DESIGN.md`.
**Exit:** decisions D-001 to D-003 marked DECIDED, signed off by Yann.

## Stage 4 — Tracker MVP
**Goal:** the Companion runs quietly on a lawyer's machine and fills the Journal.
**Includes:** Tauri app with tray icon, activation key linking, Word and Outlook sources, local encrypted queue (SQLCipher), sealed payload upload to the ingest route, multi-device, force sync, unlink, signed installers (.msi, notarised .dmg), auto-update.
**Exit:** one real lawyer runs it for 5 working days with no crash, under 1% CPU average, and every captured row passes the privacy test suite.

## Stage 5 — AI matching and confidence
**Goal:** tasks arrive pre-assigned to the right dossier with an honest confidence score.
**Includes:** eval set built first (200+ labelled synthetic examples), local matcher per D-002, scoring per `docs/02-architecture/AI_MATCHING.md`, thresholds ≥90 / 80–89 / <80, the "why" explanation per D-003, correction logging, low-confidence notifications.
**Exit:** ≥85% correct dossier assignment on the eval set; calibration check shows the ≥90 band is right at least 90% of the time.

## Stage 6 — Billing and admin
**Includes:** Stripe seat-based subscription and Customer Portal, subscription invoice history, firm-to-client invoice drafts from validated time, budget-limit alerts, app health alerts, the Feedback page (reuse the Epidom pattern), role gating of the admin console per D-005.

## Stage 7 — Beta
**Includes:** external security review, restore drill, DPIA template and staff-notice pack for firms, 2–3 pilot firms, onboarding flow for OS permission prompts.
**Exit:** pilot firms validate at least 80% of captured time without support.

## Later (excluded)
Browser source (needs Yann's site allowlist, D-006), Secib / Kleos / Jarvis connectors, Factur-X emission, voice capture, mobile app.
