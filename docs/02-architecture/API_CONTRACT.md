# API contract

REST, JSON, versioned under `/v1`. Every request and response body is a schema in `packages/contracts`. Auth by session cookie (web) or device token (Companion).

| Method | Path | Purpose | Stage |
|---|---|---|---|
| POST | /v1/auth/* | better-auth routes | 1 |
| GET | /v1/me/profile | Current member (header, profile menu, Profile view) | 1 |
| GET | /v1/me/summary | Home KPIs | 1 |
| GET | /v1/me/week | Weekly billed minutes | 1 |
| GET | /v1/tasks?date= | Journal | 1 |
| POST | /v1/tasks | Manual entry | 1 |
| PATCH | /v1/tasks/:id | Reassign dossier (writes correction), edit | 1 |
| POST | /v1/tasks/:id/validate | Validate | 1 |
| POST | /v1/tasks/validate-all | Batch validate pending | 1 |
| GET/POST | /v1/dossiers | List, create | 1 |
| PATCH | /v1/dossiers/:id | Budget, status, archive | 1 |
| GET | /v1/me/stats | Stats view | 2 |
| GET/POST/DELETE | /v1/me/keys | Activation keys | 2 |
| GET | /v1/devices | Cloud & Sync | 2 |
| POST | /v1/devices/:id/sync · DELETE /v1/devices/:id | Force sync, unlink | 4 |
| GET | /v1/notifications · POST /v1/notifications/:id/read · POST /v1/notifications/read-all | Alerts (D-014: in-app only; episodes synced on read). Both POSTs → 204 | 2 |
| GET | /v1/exports/validated.csv | CSV export | 2 |
| GET/POST | /v1/billing/invoices | List drafts, generate one from validated time (Billing view) | 2 — not in the original contract; added to match PRODUCT_SPEC.md's "generate invoice draft" and the `client_invoice` table already in DATA_MODEL.md |
| GET | /v1/firm/members · PATCH /v1/firm/members/:id | Admin team | 2 |
| POST | /v1/firm/members/:id/remind · /suspend · /reactivate | Admin actions | 2 |
| POST/DELETE | /v1/firm/invitations · POST /v1/firm/invitations/:id/resend | Invite, cancel (→ 204), resend — admin-only via AdminGuard (D-014). `:id` is the invitation id | 2 |
| GET | /v1/invitations/:token | Public, token-gated invite preview for `/invite/[token]` — no session | 2 |
| POST | /v1/invitations/:token/accept | Public, token-gated: `{name, password}` → creates the account for the invitation's own email, joins that firm, sets the session cookie (→ 204). 409 `account_exists` if the address already has an account (D-014) | 2 |
| GET | /v1/me/activity | Brain panel activity feed, templated from audit_log (own actions; admins also see admin/dossier actions) | 2 |
| GET | /v1/firm/subscription · POST /v1/firm/subscription/portal | Stripe | 6 |
| POST | /v1/webhooks/stripe | Stripe events | 6 |
| POST | /v1/ingest/tasks | Companion upload, sealed payload, no body logging | 4 |
| POST | /v1/feedback | Feedback page | 6 |

Errors: `{ "error": { "code": "string", "message": "string" } }`. Never echo request bodies in errors.
