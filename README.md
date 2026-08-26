# Li Fuying Academic Website

This repository contains the source code for the static personal academic site published at:

https://spirlness.github.io/

The site is built with Next.js App Router and exported as static HTML for GitHub Pages. It includes a home page with an updates timeline, a projects gallery, a publication list generated from BibTeX, and MDX-based blog posts with math support and inline citations.

## Project Structure

- `src/app/` - Next.js routes and page layouts.
- `src/components/` - Shared UI components.
- `src/lib/` - Build-time content readers, with unit tests in `src/lib/__tests__/`.
- `src/content/site.ts` - Central profile, navigation, contact links, and publication display settings.
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
npm test
npm run build
```

`npm test` runs the Vitest suite once (`npm run test:watch` to iterate). It covers the content readers in `src/lib/`, not rendered pages.

`npm run build` creates the static export in `out/`.

Preview the built static site locally (the `output: "export"` app has no server, so use `serve`):

```bash
npm run start
```

This serves `out/` with `serve` (see the `start` script in `package.json`). Use it to verify the exported site, including blog article routes, before pushing.

## GitHub Pages Deployment

Repository setting required:

- `Settings` -> `Pages` -> `Build and deployment` -> `Source`: `GitHub Actions`

Deployment behavior:

- Pushes to `master` trigger `.github/workflows/deploy.yml`.
- The workflow installs dependencies with `npm ci`.
- It runs ESLint.
- It runs the Vitest suite with `npm test`.
- It builds the static export with `next build`.
- It verifies that these required pages exist:
  - `out/index.html`
  - `out/blog/index.html`
  - `out/projects/index.html`
  - `out/publications/index.html`
- It verifies that every blog post and every project exported its own page, and that each slug and project `id` is URL-safe.
- It uploads `out/` as a GitHub Pages artifact and deploys it.

A lint failure or a failing test stops the deploy before anything is published.

The site uses `output: "export"` and `trailingSlash: true` in `next.config.ts`, so routed pages are emitted as directory `index.html` files that work reliably on GitHub Pages.

## Updating Site Content

### Profile, Navigation, and Homepage

Edit `src/content/site.ts` to update:

- Display name and metadata.
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

`date` must be `"YYYY-MM"`. `link` is optional. `icon` must be one of `award`, `book`, `graduation`, `project`, `publication`, `blog` — a new name also has to be added to `src/lib/updates.ts` and to the `updateIcons` map in `src/app/page.tsx`.

An entry with a missing field or an unknown icon is skipped with a warning rather than failing the build, so check the build log if something does not show up on the homepage.

### Projects

Add one JSON file per project under `content/projects/`:

```json
{
  "id": "my-project",
  "title": "My Project",
  "description": "One-paragraph summary shown on the card and as the fallback body.",
  "date": "2024-06",
  "thumbnail": "/projects/my-project.svg",
  "mediaType": "image",
  "links": { "code": "https://github.com/...", "paper": "https://..." },
  "tags": ["Tag A", "Tag B"]
}
```

The `id` becomes the URL (`/projects/my-project/`) and must match `^[A-Za-z0-9-]+$`. Keep it identical to the filename: the detail route reads `content/projects/<id>.json`, so a mismatch does not fail the build — the page silently exports as a 404. CI therefore rejects any id that differs from its filename.

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

### Blog Posts

Create a new `.mdx` file under `content/posts/`.

Each post needs frontmatter:

```mdx
---
title: "Post Title"
date: "2026-04-26"
excerpt: "Short summary shown on the blog index."
---
```

The filename becomes the URL slug and must match `^[A-Za-z0-9-]+$`. For example:

- `content/posts/my-note.mdx`
- `/blog/my-note/`

The blog supports MDX content and the local MDX components wired through `src/lib/posts.ts`.

To cite a publication inline, use its BibTeX key: `[@li2024deep]`, or `[@li2024deep; @li2023neural]` for several. These render as numbered superscripts with a reference list at the end of the post. A key that is not in `content/references.bib` fails the build, so citations cannot go dead silently. Citations work in blog posts only, not in project `.mdx` files.

## Notes for Static Hosting

Internal navigation uses full static page loads for reliability on GitHub Pages. If you change routing behavior, verify the exported site with a static server before pushing.
