#!/usr/bin/env node
// Scaffolds a new blog post: npm run new-post -- <slug> [--title "..."]
import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const SLUG_REGEX = /^[A-Za-z0-9-]+$/;
const USAGE = `Usage: npm run new-post -- <slug> [--title "..."]

  <slug>       becomes the filename and the /blog/<slug>/ route. Spaces and
               underscores are converted to hyphens, the result lowercased;
               it must match ^[A-Za-z0-9-]+$.
  --title      optional display title; defaults to the slug in Title Case.
  -h, --help   show this help.`;

function normalizeSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function todayISO() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Escape a value for a double-quoted YAML string. */
function yamlQuote(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function renderTemplate(title, date) {
  return `---
title: "${yamlQuote(title)}"
date: "${date}"
excerpt: "One or two sentences summarizing this post."
tags: [] # e.g. [physics, deep-learning]; each tag must match ^[A-Za-z0-9-]+$
---

## First Section

Start writing here.

{/* Sections start at \`##\` — the page shell renders the only <h1>. Citations
   are \`[@<bibtexKey>]\` against content/references.bib; an unknown key fails
   the build. */}
`;
}

function parseArgs(argv) {
  const args = { slug: undefined, title: undefined, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      args.help = true;
    } else if (arg === "--title") {
      index += 1;
      if (argv[index] === undefined) {
        throw new Error("--title requires a value");
      }
      args.title = argv[index];
    } else if (arg.startsWith("--title=")) {
      args.title = arg.slice("--title=".length);
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else if (args.slug === undefined) {
      args.slug = arg;
    } else {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
  }
  return args;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error.message}\n\n${USAGE}`);
    return 1;
  }

  if (args.help) {
    console.log(USAGE);
    return 0;
  }
  if (args.slug === undefined) {
    console.error(USAGE);
    return 1;
  }

  const slug = normalizeSlug(args.slug);
  if (!SLUG_REGEX.test(slug)) {
    console.error(
      `Invalid slug "${args.slug}": slugs must match ^[A-Za-z0-9-]+$`
    );
    return 1;
  }
  if (slug !== args.slug) {
    console.log(`Normalized slug: "${args.slug}" -> "${slug}"`);
  }

  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (fs.existsSync(filePath)) {
    console.error(`Post already exists: ${filePath}`);
    return 1;
  }

  const title = args.title?.trim() ? args.title : titleFromSlug(slug);
  fs.writeFileSync(filePath, renderTemplate(title, todayISO()), "utf8");

  console.log(`Created ${path.relative(process.cwd(), filePath)}`);
  console.log(`
Next steps:
  1. Fill in the frontmatter and body.
  2. npm run content:check  — compiles every post, catches bad citations/links.
  3. npm run lint && npm test && npm run build  — the CI gates; run before pushing.

The homepage timeline is separate: add content/updates/<YYYY-MM>-<slug>.json
if this post should appear there.`);
  return 0;
}

process.exitCode = main();
