# Architecture

```
 Lawyer's machine                          EU cloud (Scaleway Paris, client account)
 ┌────────────────────────────┐            ┌──────────────────────────────────────────┐
 │ ACTE Companion (Tauri)     │  TLS 1.3 + │ apps/api (NestJS)                         │
 │  - source watchers         │  sealed    │  - auth (better-auth)                     │
 │  - local matcher (D-002)   │  payload   │  - ingest (no body logging)               │
 │  - SQLCipher queue         │ ─────────► │  - tasks, dossiers, firm, billing         │
 │  - never sends content     │            │  - notifications, audit log               │
 └────────────────────────────┘            │  - Stripe webhooks                        │
                                           │           │                               │
 Browser                                   │  PostgreSQL 16 (field-level encryption)   │
 ┌────────────────────────────┐   HTTPS    │           │                               │
 │ apps/web (Next.js 15)      │ ◄────────► │  Object storage (exports, installers)     │
 │  - faithful prototype port │            └──────────────────────────────────────────┘
 └────────────────────────────┘                 Brevo (email) · Stripe · Sentry EU
```

## Boundaries
- `packages/contracts` defines every payload on every arrow above.
- The Companion is the only component that ever sees content. It emits task metadata only (see PRIVACY_MODEL).
- `apps/web` talks only to `apps/api`. No direct DB access, no third-party calls from the browser except Stripe Checkout / Portal redirects.

## Environments
See `docs/04-engineering/ENVIRONMENTS.md`. Staging holds synthetic data only.

## Keys
- Per-firm data encryption key, wrapped by a key held in Scaleway Secret Manager.
- Activation keys stored as salted hashes; the plain key is shown once.
- Production keys held by the client. PRIONATION holds none after handover.
