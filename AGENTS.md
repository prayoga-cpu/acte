# AGENTS.md

Instructions for any coding agent working in this repository (Codex, Cursor, Copilot, Aider, and others). Claude Code reads `CLAUDE.md`, which is the full version of this file. **If the two ever disagree, `CLAUDE.md` wins.**

## Read first

1. `STATUS.md` — current stage and the next task.
2. `CLAUDE.md` — full rules.
3. The doc the task references.

## Hard rules

1. Never modify `prototype/`. Port its design faithfully with Tailwind 3.4. Never apply another brand.
2. Raw content (documents, email bodies, URLs, screenshots, keystrokes) never leaves the device. Filenames and email subjects are sensitive. See `docs/03-security/PRIVACY_MODEL.md`.
3. Schemas in `packages/contracts` come before endpoints and components.
4. Build only the current stage. The desktop tracker is gated behind a scope amendment.
5. No real client data outside production.
6. Update `STATUS.md` at the end of every session. Log choices in `DECISIONS.md`.
7. If a task needs a decision marked OPEN in `DECISIONS.md`, stop and ask.
