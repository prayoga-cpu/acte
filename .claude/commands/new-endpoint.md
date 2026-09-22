Create the API endpoint "$ARGUMENTS".

1. Find it in docs/02-architecture/API_CONTRACT.md. If it is not there, stop and ask.
2. Write or update request and response schemas in packages/contracts.
3. Write tests first: happy path, unauthenticated, cross-firm access denied, invalid input.
4. Implement through the data-access layer with firm scoping. Encrypt sensitive fields.
5. Add an audit_log write if it changes state.
6. Confirm nothing logs the request body.
7. Tick STATUS.md, add a log line.
