import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { siteProfile } from "@/content/site";
import { getAllPublications } from "./bibtex";
import { normalizeInternalHref } from "./links";
import { getAllPostFrontmatter, getPostBySlug, postHref } from "./posts";
import {
  getAllProjects,
  getProjectDetailById,
  projectHref,
} from "./projects";
import {
  extractLocalTargets,
  isAssetPath,
  localAbsolute,
  pathnameOf,
  type LocalTargets,
} from "./content-targets";
import { getAllUpdates } from "./updates";

const projectDirectory = path.join(process.cwd(), "content", "projects");
const postDirectory = path.join(process.cwd(), "content", "posts");
const publicDirectory = path.join(process.cwd(), "public");

/**
 * Files the export emits at the site root that are not pages: no trailing
 * slash (they are files), and not under `public/` either, so
 * `assertAssetExists()` cannot vouch for them. `/feed.xml` and friends come
 * from route handlers; the OG card and favicon are Next file conventions in
 * `src/app/` (CI asserts the OG export in `.github/workflows/deploy.yml`).
 */
const exportedRootFiles = new Set([
  "/feed.xml",
  "/robots.txt",
  "/sitemap.xml",
  "/opengraph-image.png",
  "/favicon.ico",
]);

/**
 * Resolve a site-absolute href to the file it names under `public/`, or
 * `undefined` when it would escape that directory. Traversal is rejected here
 * rather than by trusting the href, so `![x](/../package.json)` cannot pass the
 * existence check by pointing at a real file outside `public/`.
 */
function resolvePublicFile(url: string): string | undefined {
  let pathname: string;
  try {
    pathname = decodeURIComponent(pathnameOf(url));
  } catch {
    pathname = pathnameOf(url); // malformed escape: let the existence check fail
  }
  const resolved = path.resolve(publicDirectory, pathname.replace(/^\/+/, ""));
  return resolved.startsWith(publicDirectory + path.sep) ? resolved : undefined;
}

function assertAssetExists(url: string, origin: string): void {
  const resolved = resolvePublicFile(url);
  if (!resolved || !fs.existsSync(resolved)) {
    throw new Error(`Missing asset under public/: ${url} (${origin})`);
  }
}

/** True for a real file the export emits at the site root outside `public/`. */
function isExportedRootFile(url: string): boolean {
  return exportedRootFiles.has(pathnameOf(url));
}

/** An image target must be a real exported file, whether from `public/` or the app itself. */
export function assertAssetResolves(url: string, origin: string): void {
  if (!isExportedRootFile(url)) assertAssetExists(url, origin);
}

/**
 * Every path the export emits that is not a `public/` asset: the pages, the
 * generated root files, and each post, project, and tag route. `posts` and
 * `projects` default to the repository content so callers (and tests) build
 * the same set the integrity check validates against.
 */
export function buildKnownPaths(
  posts: ReturnType<typeof getAllPostFrontmatter> = getAllPostFrontmatter(),
  projects: ReturnType<typeof getAllProjects> = getAllProjects()
): Set<string> {
  return new Set([
    "/",
    "/blog/",
    "/projects/",
    "/publications/",
    ...exportedRootFiles,
    ...posts.map((post) => postHref(post.slug)),
    ...projects.map((project) => projectHref(project.id)),
    ...new Set(
      posts.flatMap((post) => post.tags.map((tag) => `/blog/tag/${tag}/`))
    ),
  ]);
}

/** Resolve one content link: a known route, or a real asset when it names a file. */
function assertLinkResolves(
  href: string,
  origin: string,
  knownPaths: ReadonlySet<string>
): void {
  const target = localAbsolute(href);
  if (!target) return;
  const pathname = pathnameOf(normalizeInternalHref(target));
  if (knownPaths.has(pathname)) return;
  // Not a known route: if it names a file, it must be a real exported asset.
  if (isAssetPath(pathname)) {
    assertAssetExists(target, origin);
    return;
  }
  throw new Error(`Unknown internal link: ${href} (${origin})`);
}

/**
 * Check every destination an MDX body declares. Relative paths come first
 * because they are the silent failure this check exists to prevent:
 * `localAbsolute()` ignores them and the media override renders null, so the
 * export would ship without the image while the build stayed green.
 */
export function assertTargetsResolvable(
  targets: LocalTargets,
  origin: string,
  knownPaths: ReadonlySet<string>
): void {
  for (const url of targets.relative) {
    throw new Error(
      `Relative asset path "${url}" is not supported — use a site-absolute path such as "/${url}" (${origin})`
    );
  }
  for (const href of targets.links) {
    assertLinkResolves(href, origin, knownPaths);
  }
  for (const url of targets.assets) {
    const target = localAbsolute(url);
    if (target) assertAssetResolves(target, origin);
  }
}

export async function checkContentIntegrity(): Promise<{
  posts: number;
  projects: number;
  updates: number;
  publications: number;
}> {
  const posts = getAllPostFrontmatter();
  const projects = getAllProjects();
  const updates = getAllUpdates();
  const publications = getAllPublications();

  const knownPaths = buildKnownPaths(posts, projects);

  const links: { href: string; origin: string }[] = [
    ...siteProfile.navLinks.map((link) => ({
      href: link.href,
      origin: "src/content/site.ts navLinks",
    })),
    ...updates.flatMap((update) =>
      update.link
        ? [{ href: update.link, origin: `update "${update.date}"` }]
        : []
    ),
    ...projects.flatMap((project) =>
      Object.values(project.links ?? {}).map((href) => ({
        href,
        origin: `project "${project.id}" links`,
      }))
    ),
  ];

  for (const post of posts) {
    const origin = `post "${post.slug}"`;
    const body = matter(
      fs.readFileSync(path.join(postDirectory, `${post.slug}.mdx`), "utf8")
    ).content;
    assertTargetsResolvable(extractLocalTargets(body, origin), origin, knownPaths);
    await getPostBySlug(post.slug);
  }

  for (const project of projects) {
    const origin = `project "${project.id}"`;
    if (project.thumbnail.startsWith("/")) {
      assertAssetResolves(project.thumbnail, `${origin} thumbnail`);
    }

    const mdxPath = path.join(projectDirectory, `${project.id}.mdx`);
    if (fs.existsSync(mdxPath)) {
      const body = matter(fs.readFileSync(mdxPath, "utf8")).content;
      assertTargetsResolvable(
        extractLocalTargets(body, origin),
        origin,
        knownPaths
      );
    }

    await getProjectDetailById(project.id);
  }

  const projectIds = new Set(projects.map((project) => project.id));
  for (const file of fs.readdirSync(projectDirectory)) {
    if (file.endsWith(".mdx") && !projectIds.has(file.replace(/\.mdx$/, ""))) {
      throw new Error(`Orphan project MDX has no matching JSON file: ${file}`);
    }
  }

  const publicationIds = new Set<string>();
  for (const publication of publications) {
    if (publicationIds.has(publication.id)) {
      throw new Error(`Duplicate BibTeX key: ${publication.id}`);
    }
    publicationIds.add(publication.id);
  }

  for (const { href, origin } of links) {
    assertLinkResolves(href, origin, knownPaths);
  }

  return {
    posts: posts.length,
    projects: projects.length,
    updates: updates.length,
    publications: publications.length,
  };
}
