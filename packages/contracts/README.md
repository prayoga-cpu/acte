# @acte/contracts

The single definition of every payload in ACTE. Web, API and tracker import from here. Types are inferred from schemas; never hand-write a duplicate interface.

- `src/enums.ts` — roles, statuses, sources
- `src/entities.ts` — firm, member, dossier, task, device, notification
- `src/api.ts` — request and response bodies
- `src/ingest.ts` — the tracker upload allowlist (strict)
- `src/fixtures.ts` — the prototype's demo data, used by the seed script
