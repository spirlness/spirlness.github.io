---
name: ship
description: Full release pipeline for this repo — run the local gate (lint, test, build), branch/commit/push, open a PR, then on explicit instruction merge it, watch the GitHub Actions deploy run to completion, and verify the production site. Use when asked to ship, release, merge and watch deploy, or land a change.
disable-model-invocation: true
---

# /ship — the release pipeline

This is the repo's fixed release ritual (see CLAUDE.md "Deployment"). Execute the phases in order; a failure in any gate stops the pipeline and gets fixed before continuing. Never merge a PR without the user's explicit instruction in this conversation — presenting the PR URL is the natural stopping point unless the user already said to merge.

## Phase 1 — local gate (must be green before anything is committed)

```bash
npm run lint
npm test
npm run build
```

- Fix any failure before proceeding; report honestly if something cannot be fixed.
- If the change touches content or routes, also run `/verify-export` (or its steps inline) after the build.

## Phase 2 — branch, commit, push

- If on `master`, create a kebab-case branch first: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `test/…` matching the change.
- Commit with a conventional message (`type: summary`) and a body explaining what and why. Include the Claude attribution trailer unless the user said otherwise.
- Push with `-u origin <branch>`.

## Phase 3 — pull request

- `gh pr create --base master --head <branch>` with a title that summarizes the change and a body covering: what changed, why, verification already done, and anything a reviewer should know.
- If a PR already exists for the branch, push the new commits and report the existing URL instead of duplicating.
- Report the PR URL wrapped in a `<pr-created>` tag on its own line. Then stop and wait for the user, unless they already instructed the merge.

## Phase 4 — merge (only on explicit user instruction)

```bash
gh pr merge <number> --merge --delete-branch
git checkout master && git fetch origin --prune && git pull --ff-only
```

If the merge reports a conflict (a parallel PR landed on the same files), merge `origin/master` into the feature branch — never rebase or force-push — resolve each conflict keeping the intent of both sides, re-run Phase 1, commit the merge, push, and retry the PR merge.

## Phase 5 — watch the deploy

- Find the run: `gh run list --branch master --workflow deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId'`
- Watch it in the background so the user can keep working: `gh run watch <id> --repo spirlness/spirlness.github.io --exit-status --interval 20` (background task). When it completes, verify:
  - both jobs (`build`, `deploy`) are ✓ and the run conclusion is `success`;
  - there are **no annotations** (lint warnings, node deprecations, anything) — scan the watcher output; treat any annotation as a follow-up item;
  - production sanity: `curl -s -o /dev/null -w "%{http_code}"` on `/`, `/blog/`, `/projects/`, `/publications/` (all must be 200; retry once on a transient `000`).

## Phase 6 — report

Summarize: PR number and merge commit, run ID and URL, job timings, annotation scan result, production status codes. Flag any leftover follow-up (e.g. a lint warning introduced elsewhere) as a suggested next task.
