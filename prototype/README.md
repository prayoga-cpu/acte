# Prototype — READ-ONLY

`acte-dashboard-v16.html` is Yann's working front-end prototype (8 July 2026 build). It is the **design source of truth** for ACTE.

- Do not edit, reformat, lint, or "fix" this file.
- Open it directly in a browser to see the intended design and behaviour.
- `scripts/verify-prototype.sh` checks its SHA-256 on every CI run:
  `0f22be47ed6315398d5865930331e546ab5ddff88be40a4465b008a7ad592172`
- If Yann sends a new version, add it as a new file (`acte-dashboard-v17.html`), update the hash script and `docs/01-product/PROTOTYPE_MAP.md`, and log it in `DECISIONS.md`. Never overwrite v16.
