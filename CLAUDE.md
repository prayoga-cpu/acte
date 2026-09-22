# CLAUDE.md — ACTE

You are building ACTE, a time tracking and billing product for French law firms. Read this file fully at the start of every session. It overrides your defaults.

## 0. Session protocol

1. Read `STATUS.md`. Find the current stage and the first unchecked code-side task.
2. Read the docs that task references. Do not read the whole `docs/` tree by default.
3. Before writing code for anything new, check `DECISIONS.md`. If the task depends on a decision marked **OPEN**, stop and say so. Do not choose on the client's behalf.
4. Work the task. Keep changes scoped to it.
5. At the end of the session, update `STATUS.md`: tick what is done, add what you discovered, record blockers under the stage. Add a dated line to the log at the bottom.
6. If you made a design or architecture choice, append it to `DECISIONS.md`.

## 1. The prototype is the design. Do not redesign.

- `prototype/acte-dashboard-v16.html` is **read-only**. Never edit, reformat, or "fix" it. `scripts/verify-prototype.sh` checks its hash in CI.
- Port it **faithfully**: same Tailwind classes, same CSS variables (`--c-white`, `--c-carbon`, `--c-accent`, ...), same spacing, same French copy, same icons, same animations, same dark default with `html.light` variant.
- **Tailwind v3.4, not v4.** The prototype uses the v3 `tailwind.config` object with `rgb(var(--c-x) / <alpha-value>)` colours. v4 changes configuration and defaults and will shift the rendering. Pin `tailwindcss@3.4.x`.
- Fonts: Montserrat 500–800 (display), Inter 400–600 (body), Spline Sans Mono 400–500 (mono). Load with `next/font/google`, which self-hosts at build time. Never link fonts.googleapis.com at runtime (GDPR: it sends visitor IPs to Google).
- The ACTE visual identity is monochrome black and white, defined in the prototype. **Never apply the PRIONATION.io brand** (Blurple, Rubik, grid texture) to anything in `apps/web`.
- Where the prototype is ambiguous, match what it renders in a browser. Screenshot the prototype and your port side by side before calling a view done.
- Map of every view, element ID and JS function: `docs/01-product/PROTOTYPE_MAP.md`.

The only permitted content change is behind a flag: the ISO 27001 and "annual security audits" sentences (prototype lines ~1763 and ~2144) render only when `COMPLIANCE_CLAIMS_ENABLED=true`. Default is `false`. Those claims are not true today, and stating them to a law firm is a legal risk (Code de la consommation, art. L121-2). The layout stays identical either way.

## 2. Privacy rules. Non-negotiable.

Full model: `docs/03-security/PRIVACY_MODEL.md`. The short form:

- Document contents, email bodies, attachments, full URLs, screenshots, keystrokes: **never** leave the device, never reach `apps/api`, never appear in logs.
- Filenames, email subjects, and correspondent addresses are **sensitive**: they can name a client. They stay on the device unless a decision in `DECISIONS.md` explicitly allows otherwise.
- The AI "why" explanation shown in the Journal is sensitive by construction (the prototype's examples quote filenames and email addresses). See decision D-003 before implementing it.
- Server-side sensitive fields (dossier name, client label, task title) are encrypted at field level with a per-firm key.
- No real firm data in development or staging, ever. Use `packages/contracts` fixtures.
- Never log request bodies from the tracker ingest route.
- If a feature cannot be built without breaking these rules, stop and raise it. Do not work around them.

## 3. Contracts first

- Every payload crossing a boundary (web ↔ api, tracker ↔ api, api ↔ webhook) is defined once in `packages/contracts` as a Zod schema.
- Write or update the schema before the endpoint or the component that uses it.
- Types are inferred from schemas. No hand-written duplicate interfaces.

## 4. Scope

- Build only what the current stage in `ROADMAP.md` lists.
- The desktop tracker is **excluded** from the current agreement (clause 1). Do not scaffold or build `apps/tracker` beyond its README until STATUS.md shows the scope amendment ticked.
- Excluded until further notice: Secib, Kleos, Jarvis connectors; Factur-X emission; voice capture (`mic-btn`); mobile app. The prototype shows some of these. Port the UI as inert, clearly marked stubs only if the stage says so.

## 5. Stack

| Layer | Choice |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 15 App Router, React 19, Tailwind 3.4, TypeScript strict |
| API | NestJS, TypeScript strict |
| DB | PostgreSQL 16, Drizzle ORM, migrations committed |
| Auth | better-auth, self-hosted (no US identity provider) |
| Validation | Zod via `packages/contracts` |
| Tracker | Rust + Tauri v2 (gated) |
| Hosting | Scaleway, Paris region, client-owned account |
| Email | Brevo |
| Payments | Stripe (seat-based subscription) |
| Errors | Sentry, EU region, PII scrubbing on |

## 6. Commands

```bash
pnpm dev            # all apps
pnpm build
pnpm lint
pnpm typecheck
pnpm test
bash scripts/verify-prototype.sh
```

## 7. Conventions

- Code, comments, commit messages, docs: English. UI copy: French, exactly as in the prototype. Extract UI strings to `apps/web/src/i18n/fr.ts` as you port; do not translate them.
- Money is integer cents. Durations are integer minutes. Timestamps are UTC ISO-8601 in the API, rendered Europe/Paris in the UI.
- Conventional commits. Branches live under 48 hours.
- Details: `docs/04-engineering/CONVENTIONS.md`. Done means: `docs/04-engineering/DEFINITION_OF_DONE.md`.

## 8. Stop and ask when

- A task needs an OPEN decision.
- A change would alter the prototype's appearance.
- Data would need to leave the device or enter a log.
- You would add a third-party service not in section 5.
- The work belongs to a later stage.
- You are about to touch auth, encryption, key handling, or payments without a test first.
