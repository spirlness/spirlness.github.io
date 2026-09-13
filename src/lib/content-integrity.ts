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
} from "./content-targets";
import { getAllUpdates } from "./updates";

const projectDirectory = path.join(process.cwd(), "content", "projects");
const postDirectory = path.join(process.cwd(), "content", "posts");
const publicDirectory = path.join(process.cwd(), "public");

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

  const knownPaths = new Set([
    "/",
    "/blog/",
    "/projects/",
    "/publications/",
    // Exported but not pages: no trailing slash, so list them verbatim.
    "/feed.xml",
    "/robots.txt",
    "/sitemap.xml",
    ...posts.map((post) => postHref(post.slug)),
    ...projects.map((project) => projectHref(project.id)),
    ...new Set(
      posts.flatMap((post) =>
        post.tags.map((tag) => `/blog/tag/${tag}/`)
      )
    ),
  ]);

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
  const assets: { url: string; origin: string }[] = [];

  for (const post of posts) {
    const origin = `post "${post.slug}"`;
    const body = matter(
      fs.readFileSync(path.join(postDirectory, `${post.slug}.mdx`), "utf8")
    ).content;
    const targets = extractLocalTargets(body, origin);
    links.push(...targets.links.map((href) => ({ href, origin })));
    assets.push(...targets.assets.map((url) => ({ url, origin })));
    await getPostBySlug(post.slug);
  }

  for (const project of projects) {
    const origin = `project "${project.id}"`;
    if (project.thumbnail.startsWith("/")) {
      assertAssetExists(project.thumbnail, `${origin} thumbnail`);
    }

    const mdxPath = path.join(projectDirectory, `${project.id}.mdx`);
    if (fs.existsSync(mdxPath)) {
      const targets = extractLocalTargets(
        matter(fs.readFileSync(mdxPath, "utf8")).content,
        origin
      );
      links.push(...targets.links.map((href) => ({ href, origin })));
      assets.push(...targets.assets.map((url) => ({ url, origin })));
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
    const target = localAbsolute(href);
    if (!target) continue;
    const pathname = pathnameOf(normalizeInternalHref(target));
    if (knownPaths.has(pathname)) continue;
    // Not a known route: if it names a file, it must be a real public/ asset.
    if (isAssetPath(pathname)) {
      assertAssetExists(target, origin);
      continue;
    }
    throw new Error(`Unknown internal link: ${href} (${origin})`);
  }

  for (const { url, origin } of assets) {
    const target = localAbsolute(url);
    if (target) assertAssetExists(target, origin);
  }

  return {
    posts: posts.length,
    projects: projects.length,
    updates: updates.length,
    publications: publications.length,
  };
}
