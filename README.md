# Li Fuying Academic Website

This repository contains the source code for the static personal academic site published at:

https://spirlness.github.io/

The site is built with Next.js App Router and exported as static HTML for GitHub Pages. It includes a home page, publication list generated from BibTeX, and MDX-based blog posts with math support.

## Project Structure

- `src/app/` - Next.js routes and page layouts.
- `src/components/` - Shared UI components.
- `src/content/site.ts` - Central profile, navigation, contact links, homepage updates, and publication display settings.
- `content/references.bib` - Publication data source.
- `content/posts/` - Blog posts written as `.mdx`.
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
npm run build
```

`npm run build` creates the static export in `out/`.

## GitHub Pages Deployment

Repository setting required:

- `Settings` -> `Pages` -> `Build and deployment` -> `Source`: `GitHub Actions`

Deployment behavior:

- Pushes to `master` trigger `.github/workflows/deploy.yml`.
- The workflow installs dependencies with `npm ci`.
- It runs ESLint.
- It builds the static export with `next build`.
- It verifies that these required pages exist:
  - `out/index.html`
  - `out/blog/index.html`
  - `out/publications/index.html`
- It uploads `out/` as a GitHub Pages artifact and deploys it.

The site uses `output: "export"` and `trailingSlash: true` in `next.config.ts`, so routed pages are emitted as directory `index.html` files that work reliably on GitHub Pages.

## Updating Site Content

### Profile, Navigation, and Homepage

Edit `src/content/site.ts` to update:

- Display name and metadata.
- Navigation links.
- Contact links.
- Homepage research summary.
- Latest updates.
- Author names used for publication highlighting.
- Publications intro text.

Keep durable public links in this file. Avoid placeholder `#` links because they create dead links on the deployed site.

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

The filename becomes the URL slug. For example:

- `content/posts/my-note.mdx`
- `/blog/my-note/`

The blog supports MDX content and the local MDX components wired through `src/lib/posts.ts`.

## Notes for Static Hosting

Internal navigation uses full static page loads for reliability on GitHub Pages. If you change routing behavior, verify the exported site with a static server before pushing.
