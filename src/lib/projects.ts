import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { assertSafeContentSlug } from "./content-id";

const PROJECTS_PATH = path.join(process.cwd(), "content/projects");

export interface ProjectFrontmatter {
  id: string;
  title: string;
  description: string;
  date: string;
  thumbnail: string;
  mediaType?: "image" | "video";
  links?: {
    project?: string;
    code?: string;
    paper?: string;
    demo?: string;
  };
  tags?: string[];
}

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
    const parsed: ProjectFrontmatter = JSON.parse(raw);

    if (typeof parsed.id !== "string" || parsed.id !== filenameId) {
      throw new Error(
        `Project id "${String(parsed.id)}" must equal filename "${filenameId}" (file: ${file}). ` +
          `getProjectDetailById reads content/projects/<id>.json; a mismatch exports a silent 404.`
      );
    }

    projects.push(parsed);
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
  const parsed: ProjectFrontmatter = JSON.parse(raw);
  if (parsed.id !== cleanId) {
    throw new Error(
      `Project id "${parsed.id}" must equal filename "${cleanId}"`
    );
  }
  return parsed;
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
  const { content } = await compileMDX({
    source: mdxBody,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return { project, content };
}
