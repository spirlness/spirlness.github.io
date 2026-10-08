# Repository guidance

@AGENTS.md

Read the installed Next.js guides in `node_modules/next/dist/docs/` before changing framework code. Next.js is pinned to 16.3.4; this project uses React 19 and Tailwind v4.

[README.md](README.md) is the source for commands, content authoring and quality checks. Keep behavior documented there instead of repeating it here. [docs/performance.md](docs/performance.md) records dated measurements, and [docs/publication-verification.md](docs/publication-verification.md) records publication evidence.

## Implementation constraints

- This is a GitHub Pages static export: `output: "export"`, `trailingSlash: true`, `images.unoptimized`. Preview the deployed artifact with `serve out`, not a Next server. Dynamic pages require `generateStaticParams` and `dynamicParams = false`; metadata routes remain `force-static`. No server actions, request-dependent rendering or ISR.
- Use `SmartLink` for navigation. Safe internal links use Next Link with prefetch disabled, anchors/mail actions use ordinary anchors, and external links announce the new tab. Keep exported-site click-through regressions. `postHref`, `projectHref` and `normalizeInternalHref` preserve trailing slashes.
- Content readers use the working directory and filesystem at build time. Keep validation and parsing outside client module graphs. Collection readers and compiled reference/heading metadata return owned deep snapshots. Production compilation caches are per worker; development reads edits and recompiles.
- Profile/navigation/origin settings live in `src/content/site.ts`. Homepage updates are separate files. Project IDs must match their JSON filenames; slugs and tags are validated by `content-id.ts`.
- Preserve BibTeX title casing and raw author strings (`sentenceCase: false`, `verbatimFields: ["author"]`). Unknown citation keys fail compilation; unverified records have no misleading destinations or scholarly metadata. Publications and References share `getPublicationLinks` while retaining their own layout and ordering.
- Metadata readers must not compile MDX bodies. Posts enable citations and heading collection; projects use the same compiler without citations. KaTeX CSS belongs to detail routes. Shiki uses `github-dark-high-contrast` with `keepBackground: false`.
- The page supplies its only h1. Body Markdown/JSX h1 is rejected during compilation; sections begin at `##`. Keep the heading and math safety guards, media URL/srcSet checks, and explicit media remapping in the shared compiler/component map.
- `articleProse` in `MDXComponents.tsx` supplies body typography. `References` uses `not-prose`. Keep the code/pre overrides compatible with Shiki token spans and the accessible clipboard hook.
- Keep `ssr: false` behind the client boundary in `LazyInteractive.tsx`. Simulation resources load after explicit start; visibility, pause, reduced motion and error/retry behavior have browser regressions.
- BibTeX dialogs load on demand. Keep modal focus trapping, Escape/close focus restoration and stale clipboard completion cleanup.

## Layout

`.distill-grid` has an 800px centre column and structural empty gutter divs. Source Serif 4 and DM Serif Display are the active fonts; the text accent is `#a84227`.

Place a `SideNote` immediately **before** its annotated block. At 1400px and above it anchors an absolute 240px aside 40px beyond the column; below that it uses native `details`/`summary`. Both branches must keep the same breakpoint. If dimensions change, recompute the fit as `clientWidth >= 800 + 2 * (offset + width)` and allow for scrollbar width.

The table of contents floats in the left gutter on wide screens and expands above the article on narrower screens. Its scroll tracking uses cached heading elements and requestAnimationFrame; preserve keyboard access and sticky-header fragment clearance.

## Validation and delivery

Unit and server-rendering tests are `src/**/*.test.{ts,tsx}` in a Node environment. Browser interactions and accessibility run in Playwright against the production export. Coverage reports include all production TS/TSX; the enforced thresholds apply to `src/lib/**`. The complete content-integrity check runs in that suite, so deployment need not run it again separately.

Content integrity checks schemas, citations, MDX, local assets/links, duplicate BibTeX keys and orphan project bodies. `extractLocalTargets` parses an AST rather than matching source text; preserve reference-image classification, JSX literal URL checks, srcSet candidates and object data targets.

PR CI runs lint, coverage and browser checks. Deployment additionally verifies required pages and metadata exports before uploading `out/`. Keep the deployment's exact Next.js cache key and no fallback restore: stale cache restoration previously paired fresh HTML with old CSS. Merge only when explicitly requested.

## Claude Code automation

`.claude/` contains the on-edit hook, `/ship`, `/verify-export` and `content-reviewer`. The hook can auto-fix touched files; reread them before further edits and resolve remaining failures. See those files for their current implementation rather than duplicating their workflow here.
