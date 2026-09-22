# Data model (v1)

Conventions: UUID v7 primary keys, `created_at` / `updated_at` on every table, money in integer cents, durations in integer minutes, timestamps UTC. 🔒 = field-level encrypted with the firm key.

## firm
| column | type | notes |
|---|---|---|
| id | uuid | |
| name | text 🔒 | |
| seat_count | int | |
| stripe_customer_id | text | stage 6 |
| data_key_wrapped | bytea | per-firm key, wrapped |

## member
| column | type | notes |
|---|---|---|
| id | uuid | |
| firm_id | uuid → firm | |
| email | citext unique | |
| display_name | text | e.g. "Me V. Charpentier" |
| initials | text | |
| role | enum | associe, associee, collaborateur, collaboratrice, juriste_stagiaire |
| is_partner | bool | |
| is_admin | bool | D-004 |
| hourly_rate_cents | int | |
| status | enum | active, in_court, suspended, invited |

## dossier
| column | type | notes |
|---|---|---|
| id | uuid | |
| firm_id | uuid | |
| name | text 🔒 | "Bône c/ SCI Alma" names a client |
| client_label | text 🔒 | |
| budget_minutes | int nullable | |
| status | enum | progress, ready, archived |
| last_activity_at | timestamptz | |
| is_billable | bool | "Non facturable" is a dossier with false |

## task
| column | type | notes |
|---|---|---|
| id | uuid | |
| firm_id, member_id | uuid | |
| dossier_id | uuid nullable | null = unassigned |
| source | enum | word, outlook, web, manual |
| title | text 🔒 | |
| started_at, ended_at | timestamptz | |
| duration_min | int | |
| confidence | smallint nullable | 0–100, null for manual |
| why_ref | per D-003 | do not implement before D-003 |
| status | enum | pending, validated, discarded |
| validated_at | timestamptz | |
| device_id | uuid nullable | |

## correction
`id, task_id, member_id, from_dossier_id, to_dossier_id, created_at` — feeds the matcher later (stage 5).

## device
`id, member_id, name, os, companion_version, last_sync_at, status (online, offline, unlinked)`

## activation_key
`id, member_id, prefix (first 8 chars, for display), key_hash, created_at, revoked_at`

## notification
`id, member_id, type (low_confidence, budget, validation_lag, health), ref_id, created_at, read_at` — no free text containing client data.

## client_invoice
`id, firm_id, dossier_id, number ("FA-2026-041"), period_label 🔒, minutes, amount_cents, status (draft, issued)`

## feedback (stage 6, Epidom pattern)
`id, firm_id, member_id, category, message, status, created_at`

## audit_log
`id, firm_id, actor_member_id, action, target_type, target_id, created_at, ip_hash` — append-only.

## Computed, not stored
Minutes validated, pending minutes, secured revenue, ROI minutes, validation rate per member, weekly chart. Compute in SQL views or the service layer.
