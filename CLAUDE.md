# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js is pinned to **16.3.2** with React 19 and Tailwind v4. Per `AGENTS.md`, check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs — several conventions here differ from older releases.

## Commands

```bash
npm ci            # install (lockfile-exact; what CI uses)
npm run dev       # dev server on http://localhost:3000
npm run lint      # eslint (flat config; bare `eslint` with no path args)
npm test          # vitest run (single pass); `npm run test:watch` to iterate
npm run build     # static export -> out/
npm run start     # serves out/ via `serve` — NOT a Next server
```

`npm run start` only works after `npm run build`. Because `output: "export"` produces no server, `serve out` is the only way to preview the real deployed artifact; use it to verify blog routes and internal links before pushing.

Tests are Vitest, living in `src/lib/__tests__/`. They cover the pure content-layer helpers (`bibtex`, `content-id`, `links`, `posts`) — not components, not rendering. There is no DOM environment configured (`vitest.config.ts` sets only an `@` alias and `include`), so a test that needs a browser API will fail; keep new tests on the `src/lib/` side or add an environment first.

The unit tests do not cover the exported artifact. That is CI's "Verify static export" step, which you can reproduce locally after a build:

```bash
for f in out/index.html out/blog/index.html out/projects/index.html out/publications/index.html; do test -f "$f" || echo "MISSING $f"; done
for f in content/posts/*.mdx; do s=$(basename "$f" .mdx); test -f "out/blog/$s/index.html" || echo "MISSING $s"; done
for f in content/projects/*.json; do id=$(node -p "require('./$f').id"); base=$(basename "$f" .json); test "$id" = "$base" || echo "ID MISMATCH $base -> $id"; test -f "out/projects/$id/index.html" || echo "MISSING $id"; done
```

## Static-export constraints

`next.config.ts` sets `output: "export"`, `trailingSlash: true`, `images.unoptimized`. Everything resolves at build time — no route handlers, middleware, ISR, server actions, or runtime data fetching. Consequences that bite:

- **Dynamic routes need `generateStaticParams`.** `src/app/blog/[slug]/page.tsx` derives it from `getAllPosts()`; `src/app/projects/[id]/page.tsx` from `getAllProjects()`. Both also set `export const dynamicParams = false`, so an unlisted slug 404s instead of attempting a dynamic render that `output: "export"` cannot serve.
- **Trailing slashes are load-bearing.** Pages emit as `out/<route>/index.html`; a link without the trailing slash 404s on GitHub Pages. Route URLs must go through `postHref()` in `src/lib/posts.ts` or `projectHref()` in `src/lib/projects.ts` rather than being hand-built.
- **Internal navigation uses plain `<a>`, not `next/link`** — a deliberate choice for static-hosting reliability. `src/components/layout/Navbar.tsx` and `src/app/projects/[id]/page.tsx` carry `/* eslint-disable @next/next/no-html-link-for-pages */` for this. Keep it unless you re-verify the exported site.
- **Blog slugs and project ids must match `^[A-Za-z0-9-]+$`** — `assertSafeContentSlug()` enforces it at build time and CI hard-fails on violations independently (`.github/workflows/deploy.yml`).

## Content architecture

Content lives outside `src/` and is read from disk at build time via `fs` + `process.cwd()`, so the readers are server-only by construction:

| Source | Reader | Consumer |
|---|---|---|
| `content/posts/*.mdx` | `src/lib/posts.ts` | `/blog`, `/blog/[slug]` |
| `content/projects/*.json` (+ optional same-name `.mdx`) | `src/lib/projects.ts` | `/projects`, `/projects/[id]` |
| `content/updates/*.json` | `src/lib/updates.ts` | `/` |
| `content/references.bib` | `src/lib/bibtex.ts` | `/publications`, post citations |
| `src/content/site.ts` | direct import | every page |

**`src/content/site.ts`** is the single `siteProfile as const` holding site copy, nav, contact links, and publication display settings. Prefer editing it over hardcoding text in components. Homepage updates are *not* here — they live in `content/updates/*.json`. One coupling point:

- `publicationAuthorNames` drives author bolding on `/publications`. Matching runs through `normalizeAuthor()` in that page, which strips BibTeX braces and rewrites `"Li, Fuying"` to `"Fuying Li"`, so list any spelling variant in whichever form is convenient.

**`content/updates/*.json`** feeds the homepage timeline, one file per entry. `date` is `"YYYY-MM"`; sorting splits it numerically rather than trusting engine `Date` parsing. `getAllUpdates()` deliberately **skips** malformed or invalid files with a console warning instead of throwing, so a broken entry vanishes from the homepage rather than failing the build — check the build log if one does not appear. Adding an icon name means editing three places: the `UpdateIcon` union *and* the `UPDATE_ICONS` runtime set in `src/lib/updates.ts`, plus the `updateIcons` JSX map in `src/app/page.tsx`. Current set: `award` | `book` | `graduation` | `project` | `publication` | `blog`.

**`content/projects/*.json`** each define one project; an optional same-name `.mdx` supplies the detail-page body, and its absence makes the page fall back to `description`. The route is keyed on the **`id` field inside the JSON**, and the `id` must equal the filename: `getProjectDetailById()` reads `content/projects/<id>.json`, so a mismatch does *not* fail the build — the route silently exports as a 404 page whose `index.html` still exists (verified empirically), which only an explicit id/filename comparison catches. `getAllProjects()` validates the *filename* only, so CI separately re-checks each `id` for URL-safety, for equality with its filename, and for its `out/projects/<id>/index.html`.

**MDX pipeline.** `getPostBySlug()` strips frontmatter with `gray-matter` first, then compiles the remaining body through `compileMDX` from `next-mdx-remote/rsc` with `remarkMath` + `rehypeKatex` and `parseFrontmatter: false` — false because the frontmatter is already gone by that point. Frontmatter must supply `title`, `date`, `excerpt`; the filename becomes the slug. KaTeX CSS is imported globally in `src/app/layout.tsx`. Three authoring conventions:

- **Post bodies start their sections at `##`** — the page shell already renders the title as the page's only `<h1>`, and the shared map deliberately leaves `h1` unmapped, so a stray body-level `#` degrades to plain preflight text (still a semantic `<h1>`, but never styled). Always use `##` for sections.
- **`<SideNote>` goes immediately *before* the block it annotates**, never after. See the Layout section for why.
- **Citations are `[@bibtexKey]`**, or `[@keyA; @keyB]` for several at once. `processCitations()` in `src/lib/posts.ts` rewrites them into numbered `<sup>` markers before compilation and returns the cited entries in first-appearance order for the `<References>` block. An unknown key **throws and fails the build**, so dead citations cannot reach production. Keys may only contain `[A-Za-z0-9:-]`. This runs for posts only — `getProjectDetailById()` does not call it, so a `[@key]` inside a project `.mdx` renders as literal text.

**MDX component wiring.** `getPostBySlug()` passes the shared map from `src/components/mdx/MDXComponents.tsx`, which supplies both the custom components (`SideNote`, `MathBlock`, `SimulationContainer`, `PhysicsDemo`) and the HTML element overrides (`h2`/`p`/`pre`/… — deliberately no `h1`, see above). Any component used in an `.mdx` file must be a key in that map — an unknown tag fails the build with ``Expected component `X` to be defined``. Two constraints keep this working:

- **Post typography lives in that map, not in `prose`.** `@tailwindcss/typography` is not installed and no `@plugin` is loaded, so `prose`/`prose-lg`/`prose-orange` emit **zero CSS**. Combined with preflight (`h1,…,h6{font-size:inherit;font-weight:inherit}` and `*{margin:0;padding:0}`), any element without an override renders as an undifferentiated wall of text. Style new elements by adding them to the map; do not reach for `prose`.
- **`ssr: false` must stay behind the client boundary.** `src/components/interactive/LazyInteractive.tsx` (`"use client"`) owns the `dynamic(..., { ssr: false })` calls for the Three.js components, and `MDXComponents.tsx` imports the results. Moving those calls back into `MDXComponents.tsx` fails the build with ``Error: `ssr: false` is not allowed with `next/dynamic` in Server Components`` — that module is reached from a Server Component through `posts.ts`. The indirection also keeps the ~880 KB three.js chunk out of every page's initial payload.

## Layout and styling

Tailwind v4, CSS-first — no `tailwind.config.js`, and **no plugins are loaded** (there is no `@plugin` directive). Tokens live in the `@theme` block of `src/app/globals.css`; the accent `#d86b4a` is exposed as `text-accent`/`border-accent`. The only custom classes that exist are `.distill-grid` and `.katex-display` — any other bespoke class name in the JSX is a no-op. Fonts are `next/font/google` handles in `src/lib/fonts.ts`, wired to `--font-inter` / `--font-serif` / `--font-display` on `<html>`.

The Distill layout is `.distill-grid`: `grid-template-columns: 1fr min(800px, 100%) 1fr`. Pages render an empty `<div />` in columns 1 and 3 and real content in column 2 — those empty divs are structural, not cruft.

`SideNote` needs two things understood before touching it:

- **It is a zero-height anchor.** On `min-[1400px]:` and up its wrapper's only visible child is an `absolute` aside, so the wrapper contributes no height to the flow, and the aside's `top-0` resolves against wherever that anchor lands. An anchor between two blocks ends up adjacent to the *following* one, which is why the note must be placed **before** the block it annotates — placing it after aligns it with the next heading instead. It also needs a `relative` ancestor and breaks if the centre column stops being 800px.
- **The aside is gated on `min-[1400px]:`, not `lg:` — the threshold is load-bearing.** The aside sits at `left-[calc(100%+2.5rem)]` with `w-[240px]`, so its right edge is `clientWidth / 2 + 680`, which fits only when `clientWidth >= 1360` (it used to switch on at `lg:`/1024px, clipping the note and forcing horizontal scroll on 1024-1359px viewports — 168px of overflow at 1024px). The gate is 1400 rather than 1360 because media queries match `innerWidth`, scrollbar included (~15px on Windows), while the layout width is `clientWidth`, scrollbar excluded. Below the gate the inline collapsible note renders instead; both branches must share the same breakpoint or the note vanishes entirely in between. If the gutter offset or note width changes, move the breakpoint to match: `clientWidth >= 2 x (offset + width) + 800`.

## Deployment

Pushing to `master` runs `.github/workflows/deploy.yml`: `npm ci` → lint → test → build → verify required pages plus every per-post and per-project export → upload `out/` as a Pages artifact → deploy. Lint *or* test failures block the deploy, so run `npm run lint && npm test && npm run build` before pushing. Pages source must stay set to "GitHub Actions" in repo settings.

`docs/superpowers/` holds the original (Chinese) design spec and refactor plan. Treat them as intent rather than as a description of the current code — but note that the projects gallery and inline `[@citation]` support they describe **have since been built**. Check anything else they mention against the tree instead of assuming it is still unbuilt.
