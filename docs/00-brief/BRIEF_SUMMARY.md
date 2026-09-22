# Brief summary and reconciliation

Three client-side sources exist. They do not fully agree. This file is the reconciled reading agents should use.

| Source | Date | Author | What it is |
|---|---|---|---|
| `acte_dev_guide_v1.pdf` | July 2026 | Yann | First dev guide: backend + Tauri desktop agent, Stripe, admin actions, security rules |
| `prototype/acte-dashboard-v16.html` | 8 July 2026 | Yann | Working front-end mock, 9 views, all data mocked |
| `acte_project_brief_v2.pdf` | Sept 2026 | Evan (PRIONATION), from the prototype | Functional spec of what the prototype does, with open points |

A verbal MVP scope from Yann (18 Aug 2026) described email + documents + AI suggestions + manual entry, without a desktop agent. Brief v2 returns the desktop tracker to the centre of the product.

## Where they agree
- Two sides: lawyer app and firm admin console.
- Time captured passively, matched to a dossier with a confidence score, validated by the lawyer.
- Only time metadata reaches the server; content stays local; AES-256; EU hosting.
- Seat-based subscription via Stripe.
- Activation key per user to link a device.

## Where they conflict

| Topic | Conflict | Resolution in this repo |
|---|---|---|
| Capture method | Verbal MVP: APIs, no agent. Brief v2: desktop tracker. | Brief v2 is the product. Tracker is gated behind a scope amendment (stage 3). |
| Matching data | Brief v2 §4.3 matches on "filename or content cues"; §3.3 says content stays local | Matching must run on the device. Decision D-002. |
| "Why" text | Prototype examples quote filenames and email addresses | Decision D-003 before implementation |
| Compliance copy | Prototype claims ISO 27001 in preparation and annual audits | Flag off by default, D-008 |
| Integrations | Prototype shows Secib, Kleos, Jarvis as connectable | Later stage, inert in UI |
| Stats view | In prototype nav, absent from brief v2 | Ported as-is (design is frozen) |

## Open points carried from brief v2 §8
1. Legal research site list → D-006
2. Tracker background approach → D-001
3. Confidence scoring algorithm → `docs/02-architecture/AI_MATCHING.md`, stage 5
4. Alert channels → D-005
5. Admin role gating → D-004
6. Feedback page (Epidom pattern) → stage 6
7. Real compliance status → D-008
