# Product specification

Functional reference derived from brief v2 and the prototype. Where this file and the prototype disagree on appearance, the prototype wins. Where they disagree on behaviour, raise it in `DECISIONS.md`.

## Users and roles

| Role (FR, as in prototype) | Default rate | Admin |
|---|---|---|
| Associé / Associée | set per person (partner flag) | per D-004 |
| Collaborateur / Collaboratrice | set per person | no |
| Juriste stagiaire | set per person | no |

Member status: `active`, `in_court` ("En audience"), `suspended`, `invited`.

## Lawyer app

| View | Must do |
|---|---|
| Home | Minutes captured today (validated vs pending), secured revenue this month ("CA sécurisé"), average rate, ROI widget (minutes recovered vs manual entry), AI daily insight, pending tasks with "Tout intégrer", weekly billed-time chart |
| Journal | Task rows: title, source badge (Word / Outlook / Web), time range, duration, dossier dropdown, confidence badge, "why" text, validate. Reassigning logs a correction. Batch validate. Manual entry. |
| Dossiers | Grid: name, client, minutes used vs budget, status (En cours / Prêt à facturer / Archivé), last activity. Create, edit budget, archive / restore. Archived dossiers stop receiving captures. |
| Billing | Validated time ready to invoice, per dossier; generate invoice draft; CSV export. Factur-X is Later. |
| Stats | Monthly secured revenue trend and per-source breakdown, as in prototype |
| Profile & Impact | Monthly personal report; activation key (show, copy, revoke) |
| Cloud & Sync | Linked devices: name, Companion version, online / offline, last sync; force sync, unlink, export |
| Settings | Sources on / off (Word, Outlook, Web), integrations (inert until Later), theme |

## Admin console

| Tab | Must do |
|---|---|
| Équipe du cabinet | Members with role, minutes, validation rate, status, partner flag, rate. Actions: edit profile / rate, remind to validate, suspend / reactivate, invite (role pre-fills default rate), resend / cancel invite. Firm insight: lowest validation rate, totals. |
| Abonnement Cabinet | Seats × monthly seat price, live; Stripe Customer Portal; invoice history |
| Feedback (new) | Epidom-style feedback page. Not in the prototype; designed in stage 6 using the prototype's visual language. |

## Confidence thresholds (defined by the client)

| Score | Badge | Behaviour |
|---|---|---|
| ≥ 90 | Gold (accent) | No action |
| 80–89 | Neutral | No action |
| < 80 | Amber, "à vérifier" | Flag in Journal and raise a notification |

## Alerts

| Alert | Audience | Stage |
|---|---|---|
| Low-confidence task | Lawyer | 5 |
| Dossier budget approaching limit | Lawyer, admin | 2 |
| Team validation lagging | Admin | 2 |
| App health: device offline, pending invites, billing issue | Lawyer, admin | 2 / 4 / 6 |
