# Scope boundary

Governing documents (PDFs in this folder, not committed to git):
- Build Stage Agreement ACTE-BSA-08182026, EN/FR
- Annex A, Data Protection & Security ACTE-DPS-08182026
- MVP Proposal

## Covered by the agreement
Monthly build stages of product engineering: architecture, implementation, testing, staging deployment, weekly progress note, monthly demo. First period: foundation work (auth, firm setup, core data model, manual time entry end to end).

## Excluded unless added in writing (clause 1)
- The desktop capture agent
- Connectors to Secib, Kleos, Jarvis Legal
- Factur-X electronic invoicing
- Voice capture
- Stripe subscription billing
- Any mobile application

## The conflict agents must respect
Brief v2 makes the desktop tracker the heart of the product. The agreement excludes it. Until STATUS.md shows the scope amendment ticked, agents do not build excluded items. If a task drifts into excluded work, stop and flag it in STATUS.md under Blockers.

## Ownership
All code produced belongs to the client on payment of each period (clause 5). Work lives in a client-controlled repository from day one.

Fees and payment terms are in the agreement PDF and are intentionally not reproduced in tracked files.
