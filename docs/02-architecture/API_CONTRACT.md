# API contract

REST, JSON, versioned under `/v1`. Every request and response body is a schema in `packages/contracts`. Auth by session cookie (web) or device token (Companion).

| Method | Path | Purpose | Stage |
|---|---|---|---|
| POST | /v1/auth/* | better-auth routes: sign-up (sends a verification link; no session until it is followed, D-017), sign-in, sign-out, magic link (existing accounts only), `request-password-reset` / `reset-password`, `change-password` | 1 |
| GET | /v1/me/profile | Current member (header, profile menu, Profile view) | 1 |
| GET | /v1/me/summary | Home KPIs | 1 |
| GET | /v1/me/week | Weekly billed minutes | 1 |
| GET | /v1/tasks?date= | Journal | 1 |
| POST | /v1/tasks | Manual entry | 1 |
| PATCH | /v1/tasks/:id | `UpdateTaskBody`: `dossierId` reassigns (writes a correction; refused once the time is invoiced), `title` / `startedAt` / `durationMin` edit a still-pending task | 1 |
| DELETE | /v1/tasks/:id | Discard a pending task (soft delete → 204) | 1 (D-018) |
| GET | /v1/tasks/backlog | The member's pending tasks from before today (Paris) | 1 (D-018) |
| POST | /v1/tasks/:id/unvalidate | Back to pending; 409 `task_invoiced` once on an invoice draft | 1 (D-018) |
| POST | /v1/tasks/:id/validate | Validate | 1 |
| POST | /v1/tasks/validate-all | `ValidateTasksBody {taskIds}`: validates exactly those pending tasks of the caller — never "everything pending" | 1 |
| GET/POST | /v1/dossiers | List, create | 1 |
| PATCH | /v1/dossiers/:id | Name, client label, budget, status, archive | 1 |
| GET | /v1/me/stats | Stats view | 2 |
| GET/POST/DELETE | /v1/me/keys | Activation keys | 2 |
| GET | /v1/devices | Cloud & Sync | 2 |
| POST | /v1/devices/:id/sync · DELETE /v1/devices/:id | Force sync, unlink | 4 |
| GET | /v1/notifications · POST /v1/notifications/:id/read · POST /v1/notifications/read-all | Alerts (D-014: in-app only; episodes synced on read). Both POSTs → 204 | 2 |
| GET | /v1/exports/validated.csv | CSV export (each task at the rate it was validated at, D-020) | 2 |
| GET | /v1/exports/my-data.json | The member's own tasks and the dossiers they point to (Cloud & Sync « Exporter mes données ») | 2 |
| PATCH | /v1/me/preferences | `UpdatePreferencesBody`: `theme`, `alertEmails` — saved on the member | 2 |
| GET/POST | /v1/billing/invoices | List drafts; generate one from the dossier's validated time not yet invoiced (409 `nothing_to_invoice` when there is none, D-020) | 2 — not in the original contract; added to match PRODUCT_SPEC.md's "generate invoice draft" and the `client_invoice` table already in DATA_MODEL.md |
| GET | /v1/firm/members · PATCH /v1/firm/members/:id | Admin team (figures for the current month). PATCH: role, rate, `isAdmin` (409 `last_admin` when it would leave the firm without an admin, D-019) | 2 |
| POST | /v1/firm/members/:id/remind · /suspend · /reactivate | Admin actions | 2 |
| POST/DELETE | /v1/firm/invitations · POST /v1/firm/invitations/:id/resend | Invite, cancel (→ 204), resend — admin-only via AdminGuard (D-014). `:id` is the invitation id | 2 |
| GET | /v1/invitations/:token | Public, token-gated invite preview for `/invite/[token]` — no session | 2 |
| POST | /v1/invitations/:token/accept | Public, token-gated: `{name, password}` → creates the account for the invitation's own email, joins that firm, sets the session cookie (→ 204). 409 `account_exists` if the address already has an account (D-014) | 2 |
| GET | /v1/me/activity | Brain panel activity feed, templated from audit_log (own actions; admins also see admin/dossier actions) | 2 |
| POST | /v1/me/chat | Cerveau d'ACTE chat, `ChatRequest` → `ChatReply` `{reply, history}` — `history` is the reply with refs instead of names, sent back as the next assistant turn (D-015). 503 `llm_disabled` unless `LLM_CHAT_ENABLED=true` **and** `LLM_API_KEY` is set (the web app then uses its deterministic replies); 503 `llm_unavailable` on provider failure, an empty reply, or more names than the pseudonymizer can mask (fails closed); 429 `rate_limited` (per member and per instance, in memory). Sends `LlmChatContext` plus the member's chat turns, pseudonymised best-effort — see D-015 | 2 (D-015 override; stage 5 in ROADMAP) |
| GET | /v1/me/onboarding · POST /v1/me/onboarding/complete | First-run welcome state and the help centre's "Premiers pas" checklist, `OnboardingState`: `completedAt` plus five booleans computed from the member's own rows (an admin's also says whether the team has anyone else). `complete` stamps `member.onboarded_at` once and answers the same shape (→ 200). Not in the prototype (D-021) | 2 (D-021) |
| GET | /v1/firm/subscription · POST /v1/firm/subscription/portal | Stripe | 6 |
| POST | /v1/webhooks/stripe | Stripe events | 6 |
| POST | /v1/ingest/tasks | Companion upload, sealed payload, no body logging | 4 |
| POST · GET | /v1/feedback | Send feedback (any member, `FeedbackBody`); list the firm's feedback (admins) | 6 (built early, D-019) |
| PATCH | /v1/firm | Rename the firm (admin) | 2 (D-018) |
| GET · POST | /v1/internal/alert-digest | Scheduled alert-email digest; `Authorization: Bearer $CRON_SECRET`, 503 `digest_disabled` without the secret. No session | 2 (D-019) |

Errors: `{ "error": { "code": "string", "message": "string" } }`. Never echo request bodies in errors.
