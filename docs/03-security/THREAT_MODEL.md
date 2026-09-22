# Threat model (initial)

| Threat | Asset | Mitigation | Stage |
|---|---|---|---|
| Stolen laptop | Local queue | SQLCipher, key in OS keychain | 4 |
| Leaked activation key | Account link | Hashed at rest, revocable, device list shows new links | 2 / 4 |
| Database dump | Dossier and client names | Field-level encryption, per-firm keys | 1 |
| Cross-firm access | All firm data | `firm_id` scoping enforced in a single data-access layer, tests per route | 1 |
| Admin over-reach | Member activity | Role gating (D-004), aggregates only | 2 |
| Secrets in repo | Credentials | `.gitignore`, secret scanning in CI, Secret Manager | 0 |
| Malicious update | Companion | Signed update manifests | 4 |
| Log leakage | P0/P1 data | No body logging, Sentry scrubbing, privacy tests | 1 / 4 |
| Agent-introduced leak | Anything | CLAUDE.md rules, human review on auth / crypto / ingest | all |
