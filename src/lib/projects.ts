import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { assertSafeContentSlug } from "./content-id";
import {
  isDraftHidden,
  resolveIncludeDrafts,
  type ContentVisibilityOptions,
} from "./content-drafts";
import { readContentFile } from "./content-files";
import { parseProject, type ProjectFrontmatter } from "./content-schemas";
import { compileContent } from "./mdx";

export type { ProjectFrontmatter } from "./content-schemas";

const PROJECTS_PATH = path.join(process.cwd(), "content/projects");

// Production caches stay private; callers own deep snapshots, including tags/links.
let cachedProjects: ProjectFrontmatter[] | null = null;

/**
 * Build a normalized, trailing-slash href for a project. Matches the rule in
 * `postHref()` so that GitHub Pages links remain valid.
 */
export function projectHref(id: string): string {
  const clean = id.replace(/^\/+|\/+$/g, "");
  return `/projects/${clean}/`;
}

export function getAllProjects(
  options: ContentVisibilityOptions = {}
): ProjectFrontmatter[] {
  const includeDrafts = resolveIncludeDrafts(options);
  const cacheEnabled = process.env.NODE_ENV === "production";
  if (cacheEnabled && cachedProjects) {
    // The cache holds every parsed project; visibility is applied on each
    // return so an explicit `includeDrafts` override can never poison later reads.
    return structuredClone(cachedProjects).filter(
      (project) => !isDraftHidden(project, includeDrafts)
    );
  }

  if (!fs.existsSync(PROJECTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(PROJECTS_PATH);
  const projects: ProjectFrontmatter[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filenameId = assertSafeContentSlug(
      file.replace(/\.json$/, ""),
      "project id"
    );
    const raw = readContentFile(PROJECTS_PATH, file);
    projects.push(parseProject(JSON.parse(raw) as unknown, filenameId, file));
  }

  // parseProject validates YYYY-MM first; preserve zero and negative timestamps.
  const sortedProjects = projects.sort(
    (a, b) => Date.parse(b.date) - Date.parse(a.date)
  );

  if (cacheEnabled) cachedProjects = sortedProjects;
  return structuredClone(sortedProjects).filter(
    (project) => !isDraftHidden(project, includeDrafts)
  );
}

export function getProjectById(
  id: string,
  options: ContentVisibilityOptions = {}
): ProjectFrontmatter {
  const includeDrafts = resolveIncludeDrafts(options);
  const cleanId = assertSafeContentSlug(id, "project id");
  const jsonPath = path.join(PROJECTS_PATH, `${cleanId}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Project not found: ${id}`);
  }
  const raw = readContentFile(PROJECTS_PATH, `${cleanId}.json`);
  const project = parseProject(JSON.parse(raw) as unknown, cleanId, `${cleanId}.json`);
  // A hidden draft takes the same not-found path as a project without a file.
  if (isDraftHidden(project, includeDrafts)) {
    throw new Error(`Project not found: ${id}`);
  }
  return project;
}

export async function getProjectDetailById(
  id: string,
  options: ContentVisibilityOptions = {}
): Promise<{
  project: ProjectFrontmatter;
  content: React.ReactNode | null;
}> {
  const cleanId = assertSafeContentSlug(id, "project id");
  const project = getProjectById(cleanId, options);
  const mdxPath = path.join(PROJECTS_PATH, `${cleanId}.mdx`);

  if (!fs.existsSync(mdxPath)) {
    return { project, content: null };
  }

  // Strip optional YAML frontmatter (or a lone `---` fence) the same way posts
  // do — otherwise markdown treats the opening `---` as a thematic break <hr>.
  const fileContent = readContentFile(PROJECTS_PATH, `${cleanId}.mdx`);
  const { content: mdxBody } = matter(fileContent);
  const { content } = await compileContent({
    source: mdxBody,
    slug: cleanId,
  });

  return { project, content };
}
