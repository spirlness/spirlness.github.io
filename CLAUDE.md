# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Next.js is pinned to **16.3.2** with React 19 and Tailwind v4. Per `AGENTS.md`, check `node_modules/next/dist/docs/` before relying on remembered Next.js APIs — several conventions here differ from older releases.

## Commands

```bash
npm ci            # install (lockfile-exact; what CI uses)
npm run dev       # dev server on http://localhost:3000
npm run lint      # eslint (flat config; bare `eslint` with no path args)
npm run build     # static export -> out/
npm run start     # serves out/ via `serve` — NOT a Next server
```

`npm run start` only works after `npm run build`. Because `output: "export"` produces no server, `serve out` is the only way to preview the real deployed artifact; use it to verify blog routes and internal links before pushing.

There is no test framework in this repo. The de-facto test is CI's "Verify static export" step, which you can reproduce locally after a build:

```bash
test -f out/index.html && test -f out/blog/index.html && test -f out/publications/index.html
for f in content/posts/*.mdx; do s=$(basename "$f" .mdx); test -f "out/blog/$s/index.html" || echo "MISSING $s"; done
```

## Static-export constraints

`next.config.ts` sets `output: "export"`, `trailingSlash: true`, `images.unoptimized`. Everything resolves at build time — no route handlers, middleware, ISR, server actions, or runtime data fetching. Consequences that bite:

- **Dynamic routes need `generateStaticParams`.** `src/app/blog/[slug]/page.tsx` derives it from `getAllPosts()`.
- **Trailing slashes are load-bearing.** Pages emit as `out/<route>/index.html`; a link without the trailing slash 404s on GitHub Pages. Post URLs must go through `postHref()` in `src/lib/posts.ts` rather than being hand-built.
- **Internal navigation uses plain `<a>`, not `next/link`** — a deliberate choice for static-hosting reliability. `src/components/layout/Navbar.tsx` carries `/* eslint-disable @next/next/no-html-link-for-pages */` for this. Keep it unless you re-verify the exported site.
- **Blog slugs must match `^[A-Za-z0-9-]+$`** — CI hard-fails on anything else (`.github/workflows/deploy.yml`).

## Content architecture

Content lives outside `src/` and is read from disk at build time via `fs` + `process.cwd()`, so the readers are server-only by construction:

| Source | Reader | Consumer |
|---|---|---|
| `content/posts/*.mdx` | `src/lib/posts.ts` | `/blog`, `/blog/[slug]` |
| `content/references.bib` | `src/lib/bibtex.ts` | `/publications` |
| `src/content/site.ts` | direct import | every page |

**`src/content/site.ts`** is the single `siteProfile as const` holding all site copy, nav, contact links, and homepage updates. Prefer editing it over hardcoding text in components. Two coupling points:

- `updates[].icon` values are keys into the `updateIcons` map in `src/app/page.tsx` (`award` | `book` | `graduation`); a new icon name requires editing both files.
- `publicationAuthorNames` drives author bolding on `/publications`. Matching runs through `normalizeAuthor()` in that page, which strips BibTeX braces and rewrites `"Li, Fuying"` to `"Fuying Li"`, so list any spelling variant in whichever form is convenient.

**MDX pipeline.** `getPostBySlug()` uses `compileMDX` from `next-mdx-remote/rsc` with `remarkMath` + `rehypeKatex` and `parseFrontmatter: true`. Frontmatter must supply `title`, `date`, `excerpt`; the filename becomes the slug. KaTeX CSS is imported globally in `src/app/layout.tsx`. Two authoring conventions:

- **Post bodies start their sections at `##`** — the page shell already renders the title as the page's only `<h1>`, and the shared map deliberately leaves `h1` unmapped, so a stray body-level `#` degrades to plain preflight text (still a semantic `<h1>`, but never styled). Always use `##` for sections.
- **`<SideNote>` goes immediately *before* the block it annotates**, never after. See the Layout section for why.

**MDX component wiring.** `getPostBySlug()` passes the shared map from `src/components/mdx/MDXComponents.tsx`, which supplies both the custom components (`SideNote`, `MathBlock`, `SimulationContainer`, `PhysicsDemo`) and the HTML element overrides (`h2`/`p`/`pre`/… — deliberately no `h1`, see above). Any component used in an `.mdx` file must be a key in that map — an unknown tag fails the build with ``Expected component `X` to be defined``. Two constraints keep this working:

- **Post typography lives in that map, not in `prose`.** `@tailwindcss/typography` is not installed and no `@plugin` is loaded, so `prose`/`prose-lg`/`prose-orange` emit **zero CSS**. Combined with preflight (`h1,…,h6{font-size:inherit;font-weight:inherit}` and `*{margin:0;padding:0}`), any element without an override renders as an undifferentiated wall of text. Style new elements by adding them to the map; do not reach for `prose`.
- **`ssr: false` must stay behind the client boundary.** `src/components/interactive/LazyInteractive.tsx` (`"use client"`) owns the `dynamic(..., { ssr: false })` calls for the Three.js components, and `MDXComponents.tsx` imports the results. Moving those calls back into `MDXComponents.tsx` fails the build with ``Error: `ssr: false` is not allowed with `next/dynamic` in Server Components`` — that module is reached from a Server Component through `posts.ts`. The indirection also keeps the ~880 KB three.js chunk out of every page's initial payload.

## Layout and styling

Tailwind v4, CSS-first — no `tailwind.config.js`, and **no plugins are loaded** (there is no `@plugin` directive). Tokens live in the `@theme` block of `src/app/globals.css`; the accent `#d86b4a` is exposed as `text-accent`/`border-accent`. The only custom classes that exist are `.distill-grid` and `.katex-display` — any other bespoke class name in the JSX is a no-op. Fonts are `next/font/google` handles in `src/lib/fonts.ts`, wired to `--font-inter` / `--font-serif` / `--font-display` on `<html>`.

The Distill layout is `.distill-grid`: `grid-template-columns: 1fr min(800px, 100%) 1fr`. Pages render an empty `<div />` in columns 1 and 3 and real content in column 2 — those empty divs are structural, not cruft.

`SideNote` needs two things understood before touching it:

- **It is a zero-height anchor.** On `lg:` and up its wrapper's only visible child is an `absolute` aside, so the wrapper contributes no height to the flow, and the aside's `top-0` resolves against wherever that anchor lands. An anchor between two blocks ends up adjacent to the *following* one, which is why the note must be placed **before** the block it annotates — placing it after aligns it with the next heading instead. It also needs a `relative` ancestor and breaks if the centre column stops being 800px.
- **It overflows the viewport below 1360px — known defect.** The aside sits at `left-[calc(100%+2.5rem)]` with `w-[240px]`, so its right edge is `(vw + 800) / 2 + 280`; that only fits when `vw >= 1360`. But it switches on at the `lg:` breakpoint (1024px), so between 1024px and 1359px the note is clipped *and* the document gains horizontal scroll. Measured: 168px of overflow at 1024px, 40px at 1280px, 1px at 1359px, 0 at 1360px. Fixing it means choosing a trade-off — gate the aside on a `min-[1360px]:` variant instead of `lg:`, narrow the note, or shrink the gutter offset.

## Deployment

Pushing to `master` runs `.github/workflows/deploy.yml`: `npm ci` → lint → build → verify required pages and per-post exports → upload `out/` as a Pages artifact → deploy. Lint failures block deploy, so run `npm run lint && npm run build` before pushing. Pages source must stay set to "GitHub Actions" in repo settings.

`docs/superpowers/` holds the original (Chinese) design spec and refactor plan. They describe the intended end state — including projects/gallery and inline `[@citation]` support that were never built — so treat them as intent, not as a description of the current code.
