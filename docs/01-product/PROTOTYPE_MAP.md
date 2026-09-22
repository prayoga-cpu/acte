# Prototype map

`prototype/acte-dashboard-v16.html` · 2,826 lines · single file · Tailwind via CDN (v3 config object) · all state in memory.

Use this map to port each piece and to know which backend capability replaces each mock.

## Design tokens (copy verbatim)

- Tailwind `theme.extend.colors`: `white`, `black`, `noir`, `carbon`, `ivory`, `ash`, and `gold` (`DEFAULT`, `deep`, `pale`), all as `rgb(var(--c-*) / <alpha-value>)`. The "gold" tokens are remapped to the monochrome ACTE accent. Keep the names; do not rename to "accent".
- CSS variables in `:root` (dark, default) and `html.light`: `--c-white`, `--c-black`, `--c-carbon`, `--c-ivory`, `--c-ash`, `--c-accent`, `--c-accent2`, `--c-noir`, `--c-bg`.
- Fonts: `display` Montserrat, `body` Inter, `mono` Spline Sans Mono.
- Copy the whole `<style>` block into `apps/web/src/app/globals.css` first, then split only if needed.

## Views

Navigation uses `data-view="…"` buttons and `switchView(name)`.

| data-view | Root element | Render function | Replaced by (API) | Stage |
|---|---|---|---|---|
| home | KPI ids `kpi-time`, `kpi-validated`, `kpi-pending`, `kpi-ca`, `kpi-roi`, `chart`, `week-total` | `updateKpis`, `renderChart`, `updateChart`, `updateInsight` | `GET /me/summary`, `GET /me/week` | 1 |
| journal | `journal-card`, `task-list`, `batch-bar`, `empty-state` | `renderJournal`, `journalCard`, `makeRow`, `confBadge`, `srcBadge` | `GET /tasks`, `POST /tasks/:id/validate`, `POST /tasks/validate-all`, `PATCH /tasks/:id` | 1 |
| dossiers | `dossiers-root` | `renderDossiers`, `setDossierStatus` | `/dossiers` CRUD | 1 |
| billing | `billing-root` | `renderBilling`, `generateInvoice`, `downloadInvoice` | `/billing/*` | 2 / 6 |
| stats | `stats-root` | `renderStats` | `GET /me/stats` | 2 |
| profile | `profile-root`, `api-key`, `key-copy`, `key-toggle` | `renderProfile` | `/me/profile`, `/me/keys` | 2 |
| cloud | `cloud-root`, `cloud-status`, `cloud-sync`, `cloud-export`, `cloud-backup`, `cloud-wipe` | `renderCloud` | `/devices`, `/exports` | 2 / 4 |
| settings | `settings-root`, `sources-list` | `renderSettings`, `renderSources`, `integrationRows`, `syncIntegration` | `/me/sources`; integrations Later | 2 |
| admin | `admin-root`, `cab-remind-card`, `cab-remind-btn` | `renderAdmin`, `memberAction`, `remindMember`, `refreshCabinetCards`, `subscriptionHtml` | `/firm/members`, `/firm/invitations`, `/firm/subscription` | 2 / 6 |

`bone-view` / `bindBoneCard` / `refreshBoneCard`: a dossier detail card for the demo dossier "Bône c/ SCI Alma". Generalise it to any dossier.

## Panels and modals

| Element | Functions | Real behaviour | Stage |
|---|---|---|---|
| AI panel `brain-panel`, `brain-fab`, `brain-feed`, `chat-form` | `openPanel`, `closePanel`, `sendChat`, `botReply`, `addBubble`, `addFeedLog`, `seedFeed`, `updateFeedMode` | Activity feed from audit log; templated insights first, LLM later only on non-sensitive aggregates | 2 / 5 |
| New dossier `nd-*` | `openNewDossierModal` | `POST /dossiers` | 1 |
| Budget `bud-*` | `openBudgetModal` | `PATCH /dossiers/:id` | 1 |
| Edit member `ed-*` | `openEditModal` | `PATCH /firm/members/:id` | 2 |
| Invite `inv-*` | `openInviteModal` | `POST /firm/invitations` | 2 |
| Companion download `dl-companion`, `comp-dl` | `openCompanionModal`, `startCompanionDownload`, `simulateCompanionDownload` | Signed installer URLs | 4 |
| Integrations `conn-*` | `openConnectModal` | Inert until Later | Later |
| Stripe `stripe-*` | `openStripeModal` | Stripe Customer Portal redirect | 6 |
| Voice `mic-btn` | — | Inert, Later | Later |
| Theme `theme-btn`, `icon-sun`, `icon-moon` | `applyTheme` | Same, persist per user | 1 |
| Profile menu `profile-btn`, `profile-menu` | `openProfileMenu`, `closeProfileMenu` | Same | 1 |
| Toast `toast` | `toast` | Same | 1 |

## Exports

| Function | Output | Stage |
|---|---|---|
| `exportValidatedCsv` | `Date;Dossier;Intitulé;Durée (min);Taux (€/h);Montant (€);Source` | 2 |
| `exportFacturX` | Factur-X XML stub | Later |
| `downloadSubInvoice` | Subscription invoice | 6 |

## Mock data → entities

| Prototype constant | Entity | Notes |
|---|---|---|
| `INITIAL_DOSSIERS`, `INITIAL_DOSSIER_CARDS` | `dossier` | `baseMin` = minutes used, `budget` = budget minutes, `status` progress / ready / archived |
| `INITIAL_TASKS` | `task` | `source` word / outlook / web; `range` becomes `started_at` / `ended_at`; `conf` 0–100; `why` see D-003 |
| `INITIAL_TEAM` | `member` | `min`, `val` are computed, not stored; `rate` in €/h → cents |
| `INVOICES` | `client_invoice` | Firm-to-client invoice drafts, ids `FA-YYYY-NNN` |
| `BASE`, `WEEK_BASE`, `CA_MONTHS` | computed | Derived from validated tasks |
| `sourcesOn` | `member_source_setting` | Per member |
| `INTEG_META` | — | Later |

These values are also the seed fixtures in `packages/contracts/src/fixtures.ts`, so the seeded demo reproduces the prototype exactly.
