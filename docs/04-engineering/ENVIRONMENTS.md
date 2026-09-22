# Environments

| Env | Where | Data | Who |
|---|---|---|---|
| local | Docker Compose | Seed fixtures | Engineers, agents |
| staging | Scaleway Paris, client account | Synthetic only | Engineers, Yann |
| production | Scaleway Paris, client account | Real firms | Named founders hold keys |

- Secrets: `.env` locally (never committed), Scaleway Secret Manager in staging and production.
- Production access: named accounts, MFA, per-task grant, logged.
- Staging is wiped and reseeded on demand; never restored from production.
