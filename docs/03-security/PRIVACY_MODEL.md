# Privacy model — hard rules

Source: Annex A (Data Protection & Security), signed with the agreement. These are constraints, not preferences. Code that violates them does not merge.

## Data classes

| Class | Examples | Rule |
|---|---|---|
| P0 — never leaves device | Document contents, email bodies, attachments, full URLs, page content, screenshots, keystrokes | Not captured, or processed in memory on device and discarded. Never serialised to the network or logs. |
| P1 — sensitive, device-first | Filenames, email subjects, correspondent addresses, "why" text | Stay on device unless a DECIDED entry in `DECISIONS.md` allows a specific transformation |
| P2 — encrypted server data | Dossier name, client label, task title, invoice period | Field-level encryption with the firm key |
| P3 — operational | Durations, timestamps, source type, confidence, ids | Normal storage, still access-controlled |

## Rules
1. The ingest schema in `packages/contracts` is an allowlist. Unknown fields are rejected, not ignored.
2. No request body logging on any route. Sentry PII scrubbing on; `sendDefaultPii: false`.
3. No production data in development or staging. Fixtures only.
4. Firm admins see aggregates and per-member totals, not another member's task detail.
5. Deletion on account closure within 30 days, backups within 90.
6. Sub-processors limited to: Scaleway, Mistral (EU, stage 5+, only per D-002), Brevo, Stripe, Sentry EU. Adding one requires a DECISIONS entry and client notice.
7. No compliance claims in the product that are not true (D-008).

## Privacy tests (required from stage 4)
- Ingest rejects any payload containing fields outside the allowlist.
- A canary string placed in a test document never appears in network captures, DB rows, or logs.
- Logs from a full ingest run contain no P0 or P1 values.
