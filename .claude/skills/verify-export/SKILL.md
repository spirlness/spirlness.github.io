---
name: verify-export
description: Build the static export and verify it locally — every required page and metadata file, every per-post and per-project export with the id/filename check, then serve out/ and spot-check routes in the browser. Use when asked to verify the export, check the build output, or validate out/ without shipping.
disable-model-invocation: true
---

# /verify-export — validate the static artifact

This reproduces CI's "Verify static export" step locally (CLAUDE.md "Commands"), then goes one step further by loading the served site in the browser. Nothing here pushes or merges anything.

## Step 1 — build

```bash
npm run build
```

The export lands in `out/`. Fix and rebuild on failure.

## Step 2 — artifact checks (the CI script)

```bash
for f in out/index.html out/blog/index.html out/projects/index.html out/publications/index.html out/sitemap.xml out/robots.txt out/feed.xml out/opengraph-image.png; do test -f "$f" || echo "MISSING $f"; done
for f in content/posts/*.mdx; do s=$(basename "$f" .mdx); test -f "out/blog/$s/index.html" || echo "MISSING $s"; done
for f in content/projects/*.json; do id=$(node -p "require('./$f').id"); base=$(basename "$f" .json); test "$id" = "$base" || echo "ID MISMATCH $base -> $id"; test -f "out/projects/$id/index.html" || echo "MISSING $id"; done
```

Any `MISSING` or `ID MISMATCH` line is a failure — diagnose before continuing (a mismatch means the route exported as a silent 404).

## Step 3 — XML sanity

- `out/feed.xml`, `out/sitemap.xml`, `out/robots.txt` parse (`node -e` with a quick well-formedness check or xmllint if available) and contain absolute `https://spirlness.github.io/...` URLs.
- `out/feed.xml` has one `<item>` per post.

## Step 4 — serve and spot-check in the browser

- Start the preview server from `.claude/launch.json` (`static-export` — `npx serve out -l 3000`).
- Check `/`, `/blog/`, `/publications/`, `/projects/`, one post page, one tag page (`/blog/tag/<tag>/` from the post's tags), and one project detail page.
- Verify no console errors on those pages, and on a post page confirm the head has og:image / JSON-LD and the ToC renders at ≥1400px.
- Stop the server when done.

## Step 5 — report

A compact table: each check and its result (pass/fail + detail). If everything passes, say so plainly; if anything failed, include the failure output and the likely cause per CLAUDE.md.
