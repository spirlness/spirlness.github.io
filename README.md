# Li Fuying Academic Website

This repository contains the source code for the static personal academic site published at:

https://spirlness.github.io/

The site is built with Next.js App Router and exported as static HTML for GitHub Pages. It includes a home page with an updates timeline, a projects gallery, a publication list generated from BibTeX, and MDX-based blog posts with math support, inline citations, tags, and a floating table of contents. The build also emits an RSS feed (`/feed.xml`), `sitemap.xml` / `robots.txt`, JSON-LD structured data, and Open Graph / Twitter share cards.

## Project Structure

- `src/app/` - Next.js routes: `/`, `/blog` (with `/blog/[slug]` and `/blog/tag/[tag]`), `/projects` (with `/projects/[id]`), `/publications`, plus build-time `sitemap.ts`, `robots.ts`, `feed.xml/route.ts`, and the `opengraph-image.png` share card.
- `src/components/` - Shared UI components, grouped by concern: `layout/` (Navbar), `mdx/` (SideNote, MathBlock, TableOfContents, CodeBlock, References, the component map), `interactive/` (lazy-loaded Three.js demos), `publications/` (BibTeXButton), `meta/` (JSON-LD).
- `src/lib/` - Build-time content readers, with unit tests in `src/lib/__tests__/`.
- `src/content/site.ts` - Central profile, navigation, contact links, absolute site origin, and publication display settings.
- `content/references.bib` - Publication data source.
- `content/posts/` - Blog posts written as `.mdx`.
- `content/projects/` - One `.json` per project, plus an optional same-name `.mdx` detail body.
- `content/updates/` - One `.json` per homepage timeline entry.
- `.github/workflows/deploy.yml` - GitHub Pages build and deployment workflow.

## Local Development

Install dependencies:

```bash
npm ci
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Run quality checks before committing:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run test:e2e
```

The coverage suite includes the complete content-integrity check: schemas, local links, assets, citations and MDX compilation. `npm run content:check` runs that check alone; `npm test` runs unit tests without coverage (`npm run test:watch` to iterate). The browser command builds and serves the production export automatically. CI builds the export in an explicit step that overlaps the Playwright browser install, then runs the suite with `PW_SKIP_BUILD=1` so the web server only serves `out/`.

`npm run test:coverage` reports all production TS/TSX files under `src/`, excluding tests and type declarations. Core logic under `src/lib/` must reach 80% statements, lines and functions, plus 75% branches. UI interactions are checked by Playwright; its browser execution is not included in the Vitest percentages. CI and deployment run the coverage check and retain its report for 14 days.

The post, project and publication collection readers return owned deep snapshots on every read. Callers may reorder arrays or edit records, tags and links without changing cached data. Production retains parsed content internally; development continues to read edits from disk. MDX compilation is also deduplicated within each production worker for matching source, slug and compiler options, including simultaneous reads. Changed sources replace the previous entry and failed compilations are discarded. References and headings are returned as independent snapshots; React elements are treated as immutable. Development bypasses the compilation cache. Separate test/build processes do not share these caches.

`npm run build` creates the static export in `out/` and uses `tsconfig.build.json` to check the application and generated Next.js types. `npm run typecheck` generates route types and checks the full TypeScript project, including tests and tooling. Both CI workflows run it.

Page-level browser tests run against the production static export. Install Chromium and WebKit once after `npm ci`, then run:

```bash
npx playwright install chromium webkit
npm run test:e2e
```

`npm run test:e2e` builds `out/` and serves it locally. Desktop Chromium runs the general suite, including exported HTTP metadata. Mobile Chromium covers touch, narrow layouts and accessibility on representative routes. WebKit covers selected table-of-contents breakpoints, code blocks and WebGL behavior. CI runs four workers; the long WebGL and physics tests are the tail, and the suite is watched for retries at that width.

Tests tagged `@mobile` also run in mobile Chromium. Use `@mobile-only` for mobile-specific scenarios and `@webkit` for cross-engine coverage. Tags can be combined. Run a single project with `npm run test:e2e -- --project chromium-mobile` or inspect the selection with `npm run test:e2e -- --list`. Failures save screenshots and retry traces in `playwright-report/` and `test-results/`.

Video checks use a small synthetic fixture from `tests/fixtures/`, rendered with the production media component and served through Playwright routes. They check card navigation and detail playback without adding sample projects or assets to the deployment. Unit tests also verify the actual project pages pass the correct media-control options.

Preview the built static site locally (the `output: "export"` app has no server, so use `serve`):

```bash
npm run start
```

This serves `out/` with `serve` (see the `start` script in `package.json`). Use it to verify the exported site, including blog article routes, before pushing.

## Local CMS

`npm run cms` starts a local authoring stack: it regenerates `public/admin/config.yml` from the zod schemas, vendors the Sveltia CMS bundle into `public/admin/`, starts the sharp media watcher and the fast content validator, and runs `next dev`. Open `http://localhost:3000/admin/index.html` (override the port with `npm run cms -- --port 3100`).

First run:

1. `npm ci`
2. `npm run cms`
3. In Chrome or Edge, open `/admin/index.html` and click **Work with Local Repository**.
4. Pick the repository root (the folder containing `package.json`, `content/` and `public/`) and allow edits.

The CMS writes straight to the working tree on Save — nothing is committed automatically, there is no editorial workflow, and undo is git's job, so review changes with `git status` / `git diff` before committing. The editor's Preview pane embeds the real dev-server page for the current entry and reloads it after each save. `public/admin/` is generated and gitignored; the admin is Chromium-only because local mode uses the File System Access API.

Drafts:

- Posts set `draft: true` in the frontmatter; projects set `"draft": true` in their JSON. Both default to visible, non-draft entries.
- Drafts are ordinary, fully validated content while authoring (`npm run dev`, tests, tooling), but a production build behaves as if they did not exist: lists, tags, the RSS feed, sitemap, adjacent/related links, homepage slices, `generateStaticParams` and the deployment's export verification all skip them. Never point a published page at a draft link. The export removes files in a draft’s CMS upload folder, except files directly linked or embedded by a published page. Place resources shared indirectly (for example through CSS or scripts) in a shared folder under `public/`.

Media:

- Uploads through the CMS land in `public/posts/<slug>/` for posts and `public/projects/<id>/` for projects; reference them with site-absolute paths such as `/posts/<slug>/figure.png`.
- Sharp writes `-640.webp`, `-1280.webp` and `-1920.webp` variants (quality 80, no upscaling) next to each jpg/jpeg/png/webp source; SVG and HDR files are skipped. The variants are committed artifacts. Give raster sources in the same folder distinct basenames. The generator reports conflicting filenames before writing variants in that folder.
- `npm run cms` watches both media folders; `npm run media:variants` runs the same idempotent pass once (and `prebuild` runs it automatically before `npm run build`).

Validation and production hygiene:

- `npm run validate:fast` (or `--watch`) checks schemas, citation keys, body h1 headings and site-absolute media links for fast feedback. `npm run content:check` remains the full gate and runs in the coverage suite.
- `npm run cms:config` regenerates the CMS config; `npm run cms:config -- --check` fails if the generated file is stale. The generator fails loudly if its field mapping drifts from `src/lib/content-schemas.ts`.
- The `postbuild` hook removes the generated CMS, draft-only uploads and empty-route placeholders from `out/`, then verifies the export. `npm run cms:strip` is available to remove the CMS by hand.

## GitHub Pages Deployment

Repository setting required:

- `Settings` -> `Pages` -> `Build and deployment` -> `Source`: `GitHub Actions`

Deployment behavior:

- Pushes to `master` trigger `.github/workflows/deploy.yml`.
- Two jobs run in parallel. `quality` installs dependencies and runs ESLint, the full TypeScript check and the Vitest suite with the core-logic coverage gate. `e2e` installs dependencies and Chromium/WebKit concurrently, builds the static export while the browser install finishes, verifies the export, then runs the Playwright page suite against it.
- The Playwright web server only serves the already-built `out/` in CI (`PW_SKIP_BUILD=1`); locally `npm run test:e2e` still builds first.
- `e2e` verifies that these required pages and files exist:
  - `out/index.html`
  - `out/blog/index.html`
  - `out/projects/index.html`
  - `out/publications/index.html`
  - `out/sitemap.xml`
  - `out/robots.txt`
  - `out/feed.xml`
  - `out/opengraph-image.png`
- The same read-only check runs locally with `npm run export:check` after building. It also verifies published posts, projects and tag routes, and checks that draft pages, draft-only uploads, empty-route placeholders, the CMS admin and Sveltia-named assets are absent.
- It uploads `out/` as a GitHub Pages artifact, and the `deploy` job publishes it.
- A newer push cancels superseded build jobs, but never an in-progress Pages deployment.

A lint failure or a failing test stops the deploy before anything is published.

The site uses `output: "export"` and `trailingSlash: true` in `next.config.ts`, so routed pages are emitted as directory `index.html` files that work reliably on GitHub Pages.

## Updating Site Content

### Profile, Navigation, and Homepage

Edit `src/content/site.ts` to update:

- Display name and metadata.
- The absolute site origin (`url`), used for metadata, the sitemap, the RSS feed, and JSON-LD.
- Navigation links.
- Contact links.
- Homepage research summary.
- Author names used for publication highlighting.
- Publications intro text.

Keep durable public links in this file. Avoid placeholder `#` links because they create dead links on the deployed site.

### Homepage Updates

The homepage timeline is **not** in `site.ts`. Add one JSON file per entry under `content/updates/`:

```json
{
  "date": "2024-04",
  "content": "Paper 'Algorithmic Resilience' accepted at ICLR 2024.",
  "icon": "award",
  "link": "/publications/"
}
```

`date` must be `"YYYY-MM"`. `link` is optional. `icon` must be one of `award`, `book`, `graduation`, `project`, `publication`, `blog` — a new name also has to be added to the `updateIcons` array in `src/lib/content-schemas.ts` (which feeds the zod enum) and to both `Record<UpdateIcon, …>` maps in `src/lib/update-icons.ts` (`updateIconComponents` and `updateIconClassName`; `src/lib/__tests__/update-icons.test.ts` fails if the maps and the enum drift apart). Adding it to `src/lib/updates.ts` alone does nothing: that file only re-exports the types.

Malformed or invalid update JSON—including missing fields, invalid dates, unknown icons, or invalid links—fails the build with an error, so fix the reported file before deploying.

### Projects

Add one JSON file per project under `content/projects/`:

```json
{
  "id": "my-project",
  "title": "My Project",
  "description": "One-paragraph summary shown on the card and as the fallback body.",
  "date": "2024-06",
  "lastModified": "2024-06-15",
  "thumbnail": "/projects/my-project.svg",
  "mediaType": "image",
  "links": { "code": "https://github.com/...", "paper": "https://..." },
  "tags": ["Tag A", "Tag B"]
}
```

The `id` becomes the URL (`/projects/my-project/`) and must match `^[A-Za-z0-9-]+$`. Keep it identical to the filename: the detail route reads `content/projects/<id>.json`. `parseProject()` rejects any id that differs from its filename at build time, so the mismatch fails the build instead of exporting a 404 page. CI re-checks the same rule against the exported artifact.

`lastModified` is optional. When present, it must be a real `YYYY-MM-DD` date and is emitted as the project's sitemap `lastmod`; leave it out when only the display month is known.

For a longer write-up, add `content/projects/<id>.mdx` with the same base name; without it the detail page just shows `description`.

### Publications

Add or edit entries in `content/references.bib`.

Supported fields include:

- `title`
- `author`
- `year`
- `journal`
- `booktitle`
- `url`
- `pdf`
- `code`
- `arxiv`

Author highlighting is controlled by `publicationAuthorNames` in `src/content/site.ts`.

Publication lists and article references share destination validation and arXiv identifier expansion in `src/lib/publication-links.ts`, while retaining their own layout and link order.

The current three records are marked `verification={unverified}` after source
checks could not confirm their title, authors, year and venue. Their incorrect
links have been removed. The UI and copied citations disclose their status;
unverified entries are excluded from scholarly structured data. See
[publication source checks](docs/publication-verification.md) before replacing
metadata or adding links.

Interactive simulations load only after selecting **Start simulation**. They
pause outside the viewport, in background tabs, or when paused by the reader.
Unsupported WebGL and failed resources display a local fallback so the article
remains readable.

### Blog Posts

Create a new `.mdx` file under `content/posts/`.

Each post needs frontmatter:

```mdx
---
title: "Post Title"
date: "2026-04-26"
excerpt: "Short summary shown on the blog index."
tags: [physics, deep-learning]
lastUpdated: "2026-08-01"
---
```

The filename becomes the URL slug and must match `^[A-Za-z0-9-]+$`. For example:

- `content/posts/my-note.mdx`
- `/blog/my-note/`

Optional fields:

- `tags` — array (or comma-separated string). Each tag becomes a filterable `/blog/tag/<tag>/` page and must match `^[A-Za-z0-9-]+$`; an unsafe tag fails the build.
- `lastUpdated` — shown as "Updated ..." beside the date.

The blog supports MDX content and the local MDX components wired through `src/lib/posts.ts`.

To cite a publication inline, use its BibTeX key: `[@li2024deep]`, or `[@li2024deep; @li2023neural]` for several. These render as numbered superscripts with a reference list at the end of the post. A key that is not in `content/references.bib` fails the build, so citations cannot go dead silently. Citations work in blog posts only, not in project `.mdx` files.

Several post features are automatic:

- Start sections at `##`; body-level Markdown and JSX h1 headings fail the build because the page owns the title. The table of contents floats in the left margin at 1400px and wider and expands above the article on narrower screens, with scrollspy highlighting.
- Reading time estimates 200 words or 400 Chinese characters per minute, excluding fenced code, JSX attributes and link destinations.
- Fenced code blocks use build-time Shiki highlighting with a language toolbar, an always-visible copy action, and an independently scrollable code area. Copying preserves the complete source without toolbar text. Copy success and failure are announced; failed writes offer manual selection or retry. BibTeX dialogs and their Radix dependency load when a reader opens a citation; closing restores focus and clears copy feedback.
- Previous/next links (by date) and related posts (shared tags) are appended automatically as the blog grows.

## Notes for Static Hosting

Internal navigation uses Next Link with prefetch disabled. The static export includes the payloads needed for client navigation; verify routing against the exported site before pushing.
