#!/usr/bin/env bash
# Fails if the client prototype has been modified.
set -euo pipefail
cd "$(dirname "$0")/.."
EXPECTED="0f22be47ed6315398d5865930331e546ab5ddff88be40a4465b008a7ad592172"
FILE="prototype/acte-dashboard-v16.html"
if command -v sha256sum >/dev/null 2>&1; then
  ACTUAL="$(sha256sum "$FILE" | cut -d' ' -f1)"
else
  ACTUAL="$(shasum -a 256 "$FILE" | cut -d' ' -f1)"
fi
if [ "$ACTUAL" != "$EXPECTED" ]; then
  echo "FAIL: $FILE has been modified. The prototype is read-only."
  echo "expected $EXPECTED"
  echo "actual   $ACTUAL"
  exit 1
fi
echo "OK: prototype unchanged"
