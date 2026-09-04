import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { assertSafeContentSlug } from "./content-id";
import { parseProject, type ProjectFrontmatter } from "./content-schemas";
import { compileContent } from "./mdx";

export type { ProjectFrontmatter } from "./content-schemas";

const PROJECTS_PATH = path.join(process.cwd(), "content/projects");

/**
 * Build a normalized, trailing-slash href for a project. Matches the rule in
 * `postHref()` so that GitHub Pages links remain valid.
 */
export function projectHref(id: string): string {
  const clean = id.replace(/^\/+|\/+$/g, "");
  return `/projects/${clean}/`;
}

export function getAllProjects(): ProjectFrontmatter[] {
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
    const jsonPath = path.join(PROJECTS_PATH, file);
    const raw = fs.readFileSync(jsonPath, "utf8");
    projects.push(parseProject(JSON.parse(raw) as unknown, filenameId, file));
  }

  return projects.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getProjectById(id: string): ProjectFrontmatter {
  const cleanId = assertSafeContentSlug(id, "project id");
  const jsonPath = path.join(PROJECTS_PATH, `${cleanId}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Project not found: ${id}`);
  }
  const raw = fs.readFileSync(jsonPath, "utf8");
  return parseProject(JSON.parse(raw) as unknown, cleanId, `${cleanId}.json`);
}

export async function getProjectDetailById(id: string): Promise<{
  project: ProjectFrontmatter;
  content: React.ReactNode | null;
}> {
  const cleanId = assertSafeContentSlug(id, "project id");
  const project = getProjectById(cleanId);
  const mdxPath = path.join(PROJECTS_PATH, `${cleanId}.mdx`);

  if (!fs.existsSync(mdxPath)) {
    return { project, content: null };
  }

  // Strip optional YAML frontmatter (or a lone `---` fence) the same way posts
  // do — otherwise markdown treats the opening `---` as a thematic break <hr>.
  const fileContent = fs.readFileSync(mdxPath, "utf8");
  const { content: mdxBody } = matter(fileContent);
  const { content } = await compileContent({
    source: mdxBody,
    slug: cleanId,
  });

  return { project, content };
}
