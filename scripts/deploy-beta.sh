#!/usr/bin/env bash
# Deploys the Vercel beta (D-013, D-016) in the only safe order:
#   1. the committed API bundle matches the source (Vercel serves apps/api/api/index.js as committed)
#   2. Neon migrations run BEFORE the new code (new code on an old schema fails every sign-in)
#   3. API, then web
#   4. smoke test
# Locally it uses your logged-in `vercel` CLI; in GitHub Actions, VERCEL_TOKEN (it reads the database URL from Vercel).
set -euo pipefail

TEAM=team_eRmgtIyZ0SuLuZHzkmgkzZMl
BACKEND_PROJECT=prj_p9POsf9F7k1PAYc9zUDOheqSyHHi
FRONTEND_PROJECT=prj_boXAgGXXcWjBPUHKNTdHz2tjhYOb
API_URL=https://acte-api.vercel.app
WEB_URL=https://acte-web.vercel.app
VERCEL=(vercel)
[ -n "${VERCEL_TOKEN:-}" ] && VERCEL+=(--token "$VERCEL_TOKEN")

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain)" ]; then
  echo "✗ Working tree not clean: Vercel would deploy uncommitted files. Commit or stash first." >&2
  exit 1
fi

echo "→ 1/4 Checking the committed API bundle is up to date"
(cd apps/api && node scripts/build-vercel.mjs >/dev/null 2>&1)
if ! git diff --quiet -- apps/api/api/index.js; then
  git checkout -- apps/api/api/index.js
  echo "✗ apps/api/api/index.js is stale. Run 'node scripts/build-vercel.mjs' in apps/api and commit it." >&2
  exit 1
fi

echo "→ 2/4 Running database migrations on the beta (Neon)"
if [ -n "${DATABASE_URL:-}" ]; then
  (cd apps/api && node --import tsx src/db/migrate.ts)
else
  env_file=$(mktemp)
  trap 'rm -f "$env_file"' EXIT
  VERCEL_ORG_ID=$TEAM VERCEL_PROJECT_ID=$BACKEND_PROJECT "${VERCEL[@]}" env pull "$env_file" --environment=production -y >/dev/null
  (cd apps/api && node --env-file="$env_file" --import tsx src/db/migrate.ts)
  rm -f "$env_file"
fi

# Both projects have their Root Directory set (apps/api, apps/web), so deploys run from the repo root.
echo "→ 3/4 Deploying the API, then the web app"
VERCEL_ORG_ID=$TEAM VERCEL_PROJECT_ID=$BACKEND_PROJECT "${VERCEL[@]}" deploy --prod --yes >/dev/null
VERCEL_ORG_ID=$TEAM VERCEL_PROJECT_ID=$FRONTEND_PROJECT "${VERCEL[@]}" deploy --prod --yes >/dev/null

echo "→ 4/4 Smoke test"
check() {
  local got
  got=$(curl -s -o /dev/null -w "%{http_code}" "${@:3}" "$2")
  [ "$got" = "$1" ] && echo "  ✓ $got $2" || { echo "  ✗ expected $1, got $got: $2" >&2; exit 1; }
}
check 401 "$API_URL/v1/me/profile"
check 200 "$WEB_URL/login"
# A wrong password must be refused cleanly (401): the API is up and reaches the database.
# (Schema drift is prevented by step 2, not detected here: it only breaks a *successful* sign-in.)
check 401 "$WEB_URL/v1/auth/sign-in/email" -H "content-type: application/json" -H "origin: $WEB_URL" \
  -d '{"email":"deploy-smoke-test@example.invalid","password":"not-a-real-password"}'
echo "✓ Beta deployed: $WEB_URL"
