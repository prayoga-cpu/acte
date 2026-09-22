# Conventions

- TypeScript `strict: true` everywhere. No `any` without a comment explaining why.
- Naming: files `kebab-case.ts`, React components `PascalCase.tsx`, DB columns `snake_case`, API JSON `camelCase`.
- UI strings in `apps/web/src/i18n/fr.ts`, copied verbatim from the prototype.
- Money: integer cents; format with `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`.
- Time: store UTC, display `Europe/Paris`. Durations as "1 h 17" exactly as the prototype formats them (`fmtMin`).
- Commits: Conventional Commits (`feat(web): port journal view`). One logical change per commit.
- Branches: `stage-N/short-description`, merged within 48 hours.
- Every PR states which STATUS.md task it closes.
