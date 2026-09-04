import fs from "fs";
import path from "path";
import { siteProfile } from "@/content/site";
import { getAllPublications } from "./bibtex";
import { getAllPostFrontmatter, getPostBySlug, postHref } from "./posts";
import {
  getAllProjects,
  getProjectDetailById,
  projectHref,
} from "./projects";
import { getAllUpdates } from "./updates";

const projectDirectory = path.join(process.cwd(), "content", "projects");
const postDirectory = path.join(process.cwd(), "content", "posts");

function localPathFromHref(href: string): string | undefined {
  if (!href.startsWith("/") || href.startsWith("//")) return undefined;
  const pathname = href.split(/[?#]/, 1)[0];
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function markdownLocalLinks(source: string): string[] {
  const links: string[] = [];
  const patterns = [
    /\]\((\/[^\s)]+)\)/g,
    /\bhref=["'](\/[^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) links.push(match[1]);
  }
  return links;
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
    ...posts.map((post) => postHref(post.slug)),
    ...projects.map((project) => projectHref(project.id)),
    ...new Set(
      posts.flatMap((post) =>
        post.tags.map((tag) => `/blog/tag/${tag}/`)
      )
    ),
  ]);

  const localLinks = [
    ...siteProfile.navLinks.map((link) => link.href),
    ...updates.flatMap((update) => (update.link ? [update.link] : [])),
    ...projects.flatMap((project) => Object.values(project.links ?? {})),
  ];

  for (const post of posts) {
    const source = fs.readFileSync(
      path.join(postDirectory, `${post.slug}.mdx`),
      "utf8"
    );
    localLinks.push(...markdownLocalLinks(source));
    await getPostBySlug(post.slug);
  }

  for (const project of projects) {
    if (project.thumbnail.startsWith("/")) {
      const assetPath = path.join(
        process.cwd(),
        "public",
        project.thumbnail.replace(/^\/+/, "")
      );
      if (!fs.existsSync(assetPath)) {
        throw new Error(
          `Project "${project.id}" thumbnail does not exist: ${project.thumbnail}`
        );
      }
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

  for (const href of localLinks) {
    const pathname = localPathFromHref(href);
    if (pathname && !knownPaths.has(pathname)) {
      throw new Error(`Unknown internal content link: ${href}`);
    }
  }

  return {
    posts: posts.length,
    projects: projects.length,
    updates: updates.length,
    publications: publications.length,
  };
}
