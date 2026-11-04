#!/bin/bash
# Make main's protection what the nightly publisher relies on (page-scoreboard D-047):
#   scripts/require_scope_check.sh [--dry-run]
# - required status checks: ci and auto-pr-scope (.github/workflows/, pinned to the
#   GitHub Actions app, app_id 15368, so no other app's status can satisfy them) and
#   Vercel (keeps the app it is already pinned to; if it is not required yet, GitHub
#   picks the app that last reported it). Checks already required stay, and so does
#   the strict (up to date) setting.
# - enforce_admins on, so an admin's token (the publisher's fine-grained PAT acts as
#   Andrew) cannot push to main or merge past a failed check.
# Prints main's protection JSON before and after. Changes nothing that is already in
# place. Run it with a gh login that is an admin of the repo, after each workflow has
# run at least once. --dry-run shows the requests without sending them. Needs gh and
# python3. main must already have branch protection with required status checks
# (Vercel today); otherwise it stops without changing anything.
set -euo pipefail
repo=${SITE_REPO:-andrewluxem/pageteardown}
branch=main
actions_app_id=15368
dry=0
[ "${1:-}" = --dry-run ] && dry=1
api="repos/$repo/branches/$branch/protection"

pretty() { python3 -I -m json.tool; }

echo "== $repo $branch protection, before"
before=$(gh api "$api")
printf '%s\n' "$before" | pretty

# the required_status_checks PATCH body, "present" when every check is already
# required, or "none" when the branch requires no status checks at all
body=$(BEFORE=$before APP=$actions_app_id python3 -I -c '
import json, os
p = json.loads(os.environ["BEFORE"])
rsc = p.get("required_status_checks")
if not rsc:
    print("none")
    raise SystemExit
checks = [{"context": c["context"], "app_id": c.get("app_id")} for c in rsc.get("checks") or []]
have = {c["context"] for c in checks}
want = [("ci", int(os.environ["APP"])), ("auto-pr-scope", int(os.environ["APP"])), ("Vercel", None)]
added = [(name, app) for name, app in want if name not in have]
if not added:
    print("present")
    raise SystemExit
for name, app in added:
    checks.append({"context": name} | ({"app_id": app} if app else {}))
print(json.dumps({"strict": rsc.get("strict", False), "checks": checks}))
')
admins=$(printf '%s' "$before" | python3 -I -c '
import json, sys
print("on" if (json.load(sys.stdin).get("enforce_admins") or {}).get("enabled") else "off")')

case "$body" in
  none) echo "$branch has no required status checks to add to; not changing anything" >&2
        exit 1 ;;
  present) echo "ci, auto-pr-scope and Vercel are already required" ;;
  *) echo "== PATCH $api/required_status_checks"
     printf '%s\n' "$body" | pretty ;;
esac
if [ "$admins" = on ]; then
  echo "enforce_admins is already on"
else
  echo "== POST $api/enforce_admins"
fi
if [ "$dry" = 1 ]; then
  echo "dry run: not sent"
  exit 0
fi
[ "$body" = present ] || printf '%s' "$body" | gh api -X PATCH "$api/required_status_checks" --input - >/dev/null
[ "$admins" = on ] || gh api -X POST "$api/enforce_admins" >/dev/null

echo "== $repo $branch protection, after"
gh api "$api" | pretty
