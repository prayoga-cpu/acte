# apps/api rules

- Every handler validates input and output with a schema from `@acte/contracts`.
- All queries go through one data-access layer that enforces `firm_id` scoping. No raw queries in controllers.
- Sensitive columns (marked 🔒 in DATA_MODEL) are encrypted and decrypted only in that layer.
- No request body logging, anywhere. Especially `/v1/ingest/*`.
- Every admin action and every validation writes to `audit_log`.
- Tests before implementation for auth, encryption, keys, payments.
