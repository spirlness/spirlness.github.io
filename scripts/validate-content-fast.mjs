#!/usr/bin/env node
/**
 * Fast, best-effort content validation for the local CMS authoring loop.
 *
 * One-shot:
 *   tsx scripts/validate-content-fast.mjs              # all content
 *   tsx scripts/validate-content-fast.mjs --changed    # only files git reports
 *   tsx scripts/validate-content-fast.mjs --watch      # revalidate on save
 *
 * Checks (deliberately a subset of `npm run content:check`, which remains the
 * full gate):
 *   - posts: gray-matter frontmatter + zod schema (drafts included)
 *   - projects: JSON + zod schema, id/filename match, orphan body detection
 *   - updates: JSON + zod schema
 *   - citations: every [@key] in post text exists in content/references.bib
 *   - no body h1 outside fenced code (posts and project bodies)
 *   - site-absolute media/link targets resolve under public/ or to a known
 *     exported route
 *
 * Prints concise `[cms:validate]` lines. One-shot mode exits non-zero on
 * errors; watch mode keeps running.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parse as parseBibtex } from "@retorquere/bibtex-parser";
import {
  parsePostFrontmatter,
  parseProject,
  parseUpdate,
} from "../src/lib/content-schemas.ts";
import { CITATION_KEY_CHARS } from "../src/lib/content-id.ts";
import {
  extractLocalTargets,
  isAssetPath,
  localAbsolute,
  pathnameOf,
} from "../src/lib/content-targets.ts";
import { normalizeInternalHref } from "../src/lib/links.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = path.join(repoRoot, "content");
const postsDir = path.join(contentDir, "posts");
const projectsDir = path.join(contentDir, "projects");
const updatesDir = path.join(contentDir, "updates");
const publicDir = path.join(repoRoot, "public");
const bibPath = path.join(contentDir, "references.bib");

/** Root files the export emits outside public/; mirrors content-integrity. */
const EXPORTED_ROOT_FILES = new Set([
  "/feed.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image.png",
  "/favicon.ico",
]);

const citationPattern = new RegExp(
  `\\[@([${CITATION_KEY_CHARS}]+(?:;\\s*@[${CITATION_KEY_CHARS}]+)*)\\]`,
  "g"
);

const bodyParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkMdx);

function log(level, message) {
  console.log(`[cms:validate] ${level} ${message}`);
}

function formatIssues(error) {
  if (Array.isArray(error?.issues) && error.issues.length > 0) {
    return error.issues
      .slice(0, 5)
      .map((issue) => {
        const where = Array.isArray(issue.path) && issue.path.length > 0
          ? `${issue.path.join(".")}: `
          : "";
        return `${where}${issue.message}`;
      })
      .join("; ");
  }
  return error instanceof Error ? error.message : String(error);
}

function listFiles(directory, extension) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(extension))
    .sort()
    .map((name) => path.join(directory, name));
}

function relative(file) {
  return path.relative(repoRoot, file).replaceAll("\\", "/");
}

/** Resolve a site-absolute URL to a file under public/, rejecting traversal. */
function resolvePublicFile(url) {
  let pathname;
  try {
    pathname = decodeURIComponent(pathnameOf(url));
  } catch {
    pathname = pathnameOf(url);
  }
  const resolved = path.resolve(publicDir, pathname.replace(/^\/+/, ""));
  return resolved.startsWith(publicDir + path.sep) ? resolved : undefined;
}

function assetExists(url) {
  if (EXPORTED_ROOT_FILES.has(pathnameOf(url))) return true;
  const resolved = resolvePublicFile(url);
  return Boolean(resolved && fs.existsSync(resolved));
}

/** Parse the MDX body once and check h1 + collect citation keys from text. */
function inspectBody(body) {
  const problems = [];
  const citations = [];
  let tree;
  try {
    tree = bodyParser.parse(body);
  } catch (error) {
    problems.push(`MDX parse error: ${formatIssues(error)}`);
    return { problems, citations };
  }

  visit(tree, (node) => {
    if (node.type === "heading" && node.depth === 1) {
      problems.push("body heading is h1; start sections at ## (the page owns the title)");
    } else if (
      (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") &&
      node.name === "h1"
    ) {
      problems.push("body contains a JSX <h1>; start sections at ##");
    } else if (node.type === "text") {
      for (const match of node.value.matchAll(citationPattern)) {
        for (const part of match[1].split(";")) {
          const key = part.trim().replace(/^@/, "");
          if (key) citations.push(key);
        }
      }
    }
  });

  return { problems, citations };
}

function checkTargets(body, label, knownPaths) {
  const problems = [];
  let targets;
  try {
    targets = extractLocalTargets(body, label);
  } catch (error) {
    return [formatIssues(error)];
  }

  for (const url of targets.relative) {
    problems.push(
      `relative target "${url}" is not supported; use a site-absolute path such as "/${url}"`
    );
  }
  for (const url of targets.assets) {
    if (!assetExists(url)) problems.push(`missing asset under public/: ${url}`);
  }
  for (const href of targets.links) {
    const target = localAbsolute(href);
    if (!target) continue;
    const pathname = pathnameOf(normalizeInternalHref(target));
    if (knownPaths.has(pathname)) continue;
    if (isAssetPath(pathname)) {
      if (!assetExists(target)) problems.push(`missing asset under public/: ${href}`);
      continue;
    }
    problems.push(`unknown internal link: ${href}`);
  }
  return problems;
}

function checkFieldLink(href, label, knownPaths) {
  if (!localAbsolute(href)) return [];
  const pathname = pathnameOf(normalizeInternalHref(href));
  if (knownPaths.has(pathname)) return [];
  if (isAssetPath(pathname)) {
    return assetExists(href) ? [] : [`${label}: missing asset under public/: ${href}`];
  }
  return [`${label}: unknown internal link: ${href}`];
}

function loadEntries(targets) {
  const errors = [];
  const posts = [];
  const projects = [];
  const updates = [];

  for (const file of listFiles(postsDir, ".mdx")) {
    if (targets && !targets.has(file)) continue;
    const label = relative(file);
    try {
      const source = fs.readFileSync(file, "utf8");
      const parsed = matter(source);
      const slug = path.basename(file, ".mdx");
      posts.push({
        file,
        label,
        slug,
        body: parsed.content,
        data: parsePostFrontmatter(parsed.data, slug),
      });
    } catch (error) {
      errors.push(`${label}: ${formatIssues(error)}`);
    }
  }

  for (const file of listFiles(projectsDir, ".json")) {
    if (targets && !targets.has(file)) continue;
    const label = relative(file);
    try {
      const raw = fs.readFileSync(file, "utf8");
      const value = JSON.parse(raw);
      const id = path.basename(file, ".json");
      projects.push({ file, label, id, data: parseProject(value, id, label) });
    } catch (error) {
      errors.push(`${label}: ${formatIssues(error)}`);
    }
  }

  for (const file of listFiles(updatesDir, ".json")) {
    if (targets && !targets.has(file)) continue;
    const label = relative(file);
    try {
      const raw = fs.readFileSync(file, "utf8");
      updates.push({ file, label, data: parseUpdate(JSON.parse(raw), label) });
    } catch (error) {
      errors.push(`${label}: ${formatIssues(error)}`);
    }
  }

  return { errors, posts, projects, updates };
}

/** All post/project content files, used to build the route set. */
function allContentFiles() {
  return {
    posts: listFiles(postsDir, ".mdx"),
    projects: listFiles(projectsDir, ".json"),
    updates: listFiles(updatesDir, ".json"),
  };
}

function buildKnownPaths(posts, projects) {
  const tags = new Set();
  for (const post of posts) {
    for (const tag of post.data.tags ?? []) tags.add(tag);
  }
  return new Set([
    "/",
    "/blog/",
    "/projects/",
    "/publications/",
    ...EXPORTED_ROOT_FILES,
    ...posts.map((post) => `/blog/${post.slug}/`),
    ...projects.map((project) => `/projects/${project.id}/`),
    ...[...tags].map((tag) => `/blog/tag/${tag}/`),
  ]);
}

function loadCitationKeys() {
  if (!fs.existsSync(bibPath)) {
    return { keys: new Set(), error: `missing ${relative(bibPath)}` };
  }
  try {
    const parsed = parseBibtex(fs.readFileSync(bibPath, "utf8"), {
      sentenceCase: false,
      verbatimFields: ["author"],
    });
    if (parsed.errors.length > 0) {
      return {
        keys: new Set(),
        error: `${relative(bibPath)}: ${parsed.errors[0].error}`,
      };
    }
    return {
      keys: new Set(parsed.entries.map((entry) => entry.key).filter(Boolean)),
      error: null,
    };
  } catch (error) {
    return { keys: new Set(), error: `${relative(bibPath)}: ${formatIssues(error)}` };
  }
}

function changedContentFiles() {
  const files = new Set();
  const run = (args) => spawnSync("git", args, { cwd: repoRoot, encoding: "utf8" });
  const tracked = run(["diff", "--name-only", "HEAD", "--", "content"]);
  if (tracked.status !== 0) return null;
  const untracked = run([
    "ls-files",
    "--others",
    "--exclude-standard",
    "--",
    "content",
  ]);
  if (untracked.status !== 0) return null;
  for (const line of `${tracked.stdout}\n${untracked.stdout}`
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)) {
    files.add(path.resolve(repoRoot, line));
  }
  return files;
}

function validate({ changedOnly = false, verbose = true } = {}) {
  const startedAt = Date.now();
  const errors = [];
  const { posts: postFiles, projects: projectFiles } =
    allContentFiles();

  let targets = null;
  if (changedOnly) {
    targets = changedContentFiles();
    if (!targets) {
      log("warn", "git is unavailable; validating all content instead.");
    }
  }

  const loaded = loadEntries(targets);
  errors.push(...loaded.errors);

  // Build the route set from *all* parsable entries, not only changed ones, so
  // a link to an untouched post still resolves during a partial validation.
  const allPosts = loaded.posts.concat(loadAllParsedPosts(postFiles, loaded.posts));
  const allProjects = loaded.projects.concat(
    loadAllParsedProjects(projectFiles, loaded.projects)
  );
  const knownPaths = buildKnownPaths(allPosts, allProjects);
  // Published entries must not link at draft routes: production omits them.
  const publishedPaths = buildKnownPaths(
    allPosts.filter((post) => post.data.draft !== true),
    allProjects.filter((project) => project.data.draft !== true)
  );

  const { keys: citationKeys, error: bibliographyError } = loadCitationKeys();
  if (bibliographyError) errors.push(bibliographyError);

  for (const post of loaded.posts) {
    const inspected = inspectBody(post.body);
    for (const problem of inspected.problems) errors.push(`${post.label}: ${problem}`);
    for (const key of inspected.citations) {
      if (!citationKeys.has(key)) {
        errors.push(`${post.label}: citation key not in content/references.bib: @${key}`);
      }
    }
    const postPaths = post.data.draft === true ? knownPaths : publishedPaths;
    for (const problem of checkTargets(post.body, post.label, postPaths)) {
      errors.push(`${post.label}: ${problem}`);
    }
  }

  for (const project of loaded.projects) {
    const projectPaths =
      project.data.draft === true ? knownPaths : publishedPaths;
    const mdxPath = path.join(projectsDir, `${project.id}.mdx`);
    if (fs.existsSync(mdxPath)) {
      const label = relative(mdxPath);
      const body = matter(fs.readFileSync(mdxPath, "utf8")).content;
      const inspected = inspectBody(body);
      for (const problem of inspected.problems) errors.push(`${label}: ${problem}`);
      for (const problem of checkTargets(body, label, projectPaths)) {
        errors.push(`${label}: ${problem}`);
      }
    }
    if (localAbsolute(project.data.thumbnail)) {
      for (const problem of checkFieldLink(
        project.data.thumbnail,
        `${project.label} thumbnail`,
        projectPaths
      )) {
        errors.push(problem);
      }
    }
    for (const [name, href] of Object.entries(project.data.links ?? {})) {
      if (!href) continue;
      for (const problem of checkFieldLink(href, `${project.label} links.${name}`, projectPaths)) {
        errors.push(problem);
      }
    }
  }

  // Orphan project bodies are a full-gate error; catch them here too.
  for (const file of listFiles(projectsDir, ".mdx")) {
    const id = path.basename(file, ".mdx");
    if (!projectFiles.some((json) => path.basename(json, ".json") === id)) {
      errors.push(`${relative(file)}: orphan project body (no matching JSON)`);
    }
  }

  for (const update of loaded.updates) {
    if (!update.data.link) continue;
    for (const problem of checkFieldLink(
      update.data.link,
      `${update.label} link`,
      publishedPaths
    )) {
      errors.push(problem);
    }
  }

  const duration = Date.now() - startedAt;
  if (errors.length > 0) {
    for (const error of errors) log("ERROR", error);
    log(
      "fail",
      `${errors.length} problem(s) in ${duration} ms. ` +
        "Full gate: npm run content:check."
    );
  } else if (verbose) {
    log(
      "ok",
      `${loaded.posts.length} post(s), ${loaded.projects.length} project(s), ` +
        `${loaded.updates.length} update(s) in ${duration} ms.`
    );
  }

  return errors.length;
}

/** Parse untouched posts only to widen the route set; failures are ignored. */
function loadAllParsedPosts(files, alreadyLoaded) {
  const loadedFiles = new Set(alreadyLoaded.map((post) => post.file));
  const posts = [];
  for (const file of files) {
    if (loadedFiles.has(file)) continue;
    try {
      const parsed = matter(fs.readFileSync(file, "utf8"));
      const slug = path.basename(file, ".mdx");
      posts.push({ file, slug, data: parsePostFrontmatter(parsed.data, slug) });
    } catch {
      // Invalid files are reported by their own validation pass.
    }
  }
  return posts;
}

function loadAllParsedProjects(files, alreadyLoaded) {
  const loadedFiles = new Set(alreadyLoaded.map((project) => project.file));
  const projects = [];
  for (const file of files) {
    if (loadedFiles.has(file)) continue;
    try {
      const id = path.basename(file, ".json");
      const value = JSON.parse(fs.readFileSync(file, "utf8"));
      projects.push({ file, id, data: parseProject(value, id) });
    } catch {
      // Invalid files are reported by their own validation pass.
    }
  }
  return projects;
}

function watch() {
  let timer = null;
  let running = false;
  let queued = false;

  const run = (verbose) => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      validate({ verbose });
    } catch (error) {
      log("ERROR", `validation crashed: ${formatIssues(error)}`);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        run(true);
      }
    }
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      run(true);
    }, 300);
  };

  const watchers = [];
  for (const dir of [contentDir, path.join(publicDir, "posts"), path.join(publicDir, "projects")]) {
    if (!fs.existsSync(dir)) continue;
    try {
      const watcher = fs.watch(dir, { recursive: true }, schedule);
      watcher.on("error", (error) => log("warn", `watch error on ${dir}: ${error.message}`));
      watchers.push(watcher);
    } catch (error) {
      log("warn", `cannot watch ${dir}: ${formatIssues(error)}; restart to pick up edits.`);
    }
  }

  const shutdown = () => {
    for (const watcher of watchers) watcher.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  if (process.platform === "win32") process.on("SIGBREAK", shutdown);

  log("watch", `watching content/ (Ctrl-C to stop). Full gate: npm run content:check.`);
  run(true);
}

function main() {
  const args = process.argv.slice(2);
  const unknown = args.filter(
    (arg) => !["--watch", "-w", "--changed", "--help", "-h"].includes(arg)
  );
  if (unknown.length > 0) {
    console.error(`[cms:validate] unknown argument(s): ${unknown.join(", ")}`);
    process.exit(2);
  }
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: tsx scripts/validate-content-fast.mjs [--changed] [--watch]",
        "",
        "  (no flags)  validate all content once; non-zero exit on errors",
        "  --changed   validate only files reported by git (content/)",
        "  --watch     revalidate on content/media changes until Ctrl-C",
      ].join("\n")
    );
    return;
  }
  if (args.includes("--watch") || args.includes("-w")) {
    watch();
    return;
  }
  process.exitCode = validate({ changedOnly: args.includes("--changed") }) > 0 ? 1 : 0;
}

main();
