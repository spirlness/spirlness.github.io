#!/usr/bin/env bash
set -euo pipefail

playwright_version=$(node -p "require('./package-lock.json').packages['node_modules/@playwright/test']?.version ?? ''")
if [[ -z "$playwright_version" ]]; then
  echo "Cannot resolve @playwright/test from package-lock.json" >&2
  exit 1
fi

log_dir=$(mktemp -d "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/spirl-build.XXXXXX")
: > "$log_dir/build.log"

# Use the locked Playwright version without waiting for project dependencies.
npm ci --prefer-offline --no-audit --no-fund > "$log_dir/npm-ci.log" 2>&1 &
ci_pid=$!
npx --yes "playwright@$playwright_version" install --with-deps chromium webkit > "$log_dir/playwright-install.log" 2>&1 &
browser_pid=$!

ci_status=0
wait "$ci_pid" || ci_status=$?
if (( ci_status == 0 )); then
  npm run build > "$log_dir/build.log" 2>&1 &
  build_pid=$!
fi

browser_status=0
wait "$browser_pid" || browser_status=$?
build_status=0
if [[ -n "${build_pid:-}" ]]; then
  wait "$build_pid" || build_status=$?
fi

for log in npm-ci playwright-install build; do
  echo "::group::$log"
  cat "$log_dir/$log.log"
  echo "::endgroup::"
done

for status in "$ci_status" "$browser_status" "$build_status"; do
  if (( status != 0 )); then
    exit "$status"
  fi
done
