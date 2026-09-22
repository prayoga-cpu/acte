# ACTE

Automatic time tracking and billing for French law firms (cabinets d'avocats).
Client: Yann (ACTE). Engineering: PRIONATION.io.

This folder is the single home for the long-term build: the client's prototype, every brief, the agreements, and the documentation that code agents work from.

## Start here

| If you are | Read, in order |
|---|---|
| A code agent (Claude Code, Codex, Cursor) | `CLAUDE.md` or `AGENTS.md` → `STATUS.md` → the doc your task points to |
| An engineer joining the project | This file → `ROADMAP.md` → `STATUS.md` → `docs/02-architecture/ARCHITECTURE.md` |
| Darwin, starting a session | `STATUS.md` → `DECISIONS.md` (open items) |
| Yann, checking progress | `STATUS.md`, section "Human side" of the current stage |

## Layout

```
acte/
├── CLAUDE.md               Rules for Claude Code. Read on every session.
├── AGENTS.md               Same rules, for other coding agents.
├── ROADMAP.md              Stages, goals, exit criteria.
├── STATUS.md               Live tracker: current stage, code-side and human-side todo.
├── DECISIONS.md            Decision log. Open decisions block stages.
├── CHANGELOG.md            What shipped, per stage.
├── prototype/              Yann's HTML prototype. READ-ONLY. Design source of truth.
├── docs/
│   ├── 00-brief/           Client briefs, original PDFs + reconciled summary.
│   ├── 01-product/         Product spec, prototype-to-feature map, FR/EN glossary.
│   ├── 02-architecture/    Architecture, data model, API, tracker and AI designs.
│   ├── 03-security/        Privacy model (hard rules) and threat model.
│   ├── 04-engineering/     Conventions, testing, environments, definition of done.
│   └── 05-commercial/      Agreement, Annex A, proposal. PDFs are not committed to git.
├── apps/
│   ├── web/                Next.js dashboard (port of the prototype).
│   ├── api/                NestJS backend.
│   └── tracker/            Desktop companion (Tauri). Gated, see ROADMAP stage 3.
├── packages/contracts/     Zod schemas. The only definition of every payload.
├── infra/                  Infrastructure as code (Scaleway, EU).
├── scripts/                Guard scripts, including the prototype integrity check.
└── .claude/                Claude Code settings and slash commands.
```

## Three rules that override everything else

1. **The prototype design does not change.** `prototype/acte-dashboard-v16.html` is ported, not redesigned.
2. **Raw content never leaves the lawyer's device.** See `docs/03-security/PRIVACY_MODEL.md`.
3. **Nothing outside the current stage gets built.** See `docs/05-commercial/SCOPE_BOUNDARY.md`.

## First run

```bash
git init && git add -A && git commit -m "chore: ACTE starter pack"
bash scripts/verify-prototype.sh     # must print OK
pnpm install                          # once apps are scaffolded in stage 1
```
