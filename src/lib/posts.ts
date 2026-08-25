import fs from "fs";
import path from "path";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { getAllPublications, type Publication } from "./bibtex";

const POSTS_PATH = path.join(process.cwd(), "content/posts");

const CITATION_REGEX = /\[@([A-Za-z0-9:-]+(?:;\s*@[A-Za-z0-9:-]+)*)\]/g;

/**
 * Build a normalized, trailing-slash href for a blog post. GitHub Pages serves
 * out/blog/<slug>/index.html at /blog/<slug>/, so the trailing slash must
 * always be present or an internal link silently 404s.
 */
export function postHref(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return `/blog/${clean}/`;
}

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  slug: string;
}

export interface Post {
  content: React.ReactNode;
  frontmatter: PostFrontmatter;
  references: Publication[];
}

/**
 * Parse `[@key1; @key2]` citations in the MDX source and replace them with inline
 * `<sup>` elements carrying numeric labels. Unknown keys cause the build to fail
 * so that dead citations do not reach production.
 *
 * The returned `references` array is ordered by first appearance in the text,
 * matching the numeric labels rendered inline.
 */
function processCitations(
  source: string,
  slug: string
): { source: string; references: Publication[] } {
  const publications = getAllPublications();
  const pubById = new Map(publications.map((pub) => [pub.id, pub]));
  const references: Publication[] = [];

  function numberForKey(key: string): number {
    const existing = references.findIndex((p) => p.id === key);
    if (existing !== -1) return existing + 1;

    const pub = pubById.get(key);
    if (!pub) {
      throw new Error(
        `Citation key "${key}" not found in content/references.bib (post: ${slug})`
      );
    }

    references.push(pub);
    return references.length;
  }

  const processed = source.replace(CITATION_REGEX, (match, keyList: string) => {
    const keys = keyList
      .split(/;\s*/)
      .map((k: string) => k.replace(/^@/, "").trim())
      .filter(Boolean);

    if (keys.length === 0) {
      return match;
    }

    const numbers = keys.map(numberForKey);
    return `<sup className="text-accent font-medium text-xs ml-0.5">[${numbers.join(", ")}]</sup>`;
  });

  return { source: processed, references };
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const realSlug = slug.replace(/\.mdx$/, "");
  const filePath = path.join(POSTS_PATH, `${realSlug}.mdx`);
  const fileContent = fs.readFileSync(filePath, "utf8");

  const { source: processedContent, references } = processCitations(
    fileContent,
    realSlug
  );

  const { content, frontmatter } = await compileMDX<PostFrontmatter>({
    source: processedContent,
    components: mdxComponents,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return {
    content,
    frontmatter: {
      ...frontmatter,
      slug: realSlug,
    },
    references,
  };
}

export async function getAllPosts() {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_PATH);
  const posts = await Promise.all(
    files
      .filter((file) => file.endsWith(".mdx"))
      .map(async (file) => {
        const slug = file.replace(/\.mdx$/, "");
        const { frontmatter } = await getPostBySlug(slug);
        return frontmatter;
      })
  );

  return posts.sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
}
