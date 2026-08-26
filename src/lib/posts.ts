import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { getAllPublications, type Publication } from "./bibtex";
import { assertSafeContentSlug } from "./content-id";

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

function parsePostFrontmatter(source: string, slug: string): PostFrontmatter {
  const { data } = matter(source);

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error(`Post "${slug}" missing required frontmatter field: title`);
  }
  if (typeof data.date !== "string" || !data.date.trim()) {
    throw new Error(`Post "${slug}" missing required frontmatter field: date`);
  }
  if (typeof data.excerpt !== "string" || !data.excerpt.trim()) {
    throw new Error(`Post "${slug}" missing required frontmatter field: excerpt`);
  }

  return {
    title: data.title.trim(),
    date: data.date.trim(),
    excerpt: data.excerpt.trim(),
    slug,
  };
}

function compareDatesDescending(a: string, b: string): number {
  const aTime = new Date(a).getTime();
  const bTime = new Date(b).getTime();

  if (Number.isNaN(aTime)) return Number.isNaN(bTime) ? 0 : 1;
  if (Number.isNaN(bTime)) return -1;
  return bTime - aTime;
}

function readPostFile(slug: string): { realSlug: string; fileContent: string } {
  const realSlug = assertSafeContentSlug(slug.replace(/\.mdx$/, ""), "post slug");
  const filePath = path.join(POSTS_PATH, `${realSlug}.mdx`);
  const fileContent = fs.readFileSync(filePath, "utf8");
  return { realSlug, fileContent };
}

/**
 * Parse `[@key1; @key2]` citations in the MDX source and replace them with inline
 * numbered links that jump to the References block. Unknown keys cause the build
 * to fail so that dead citations do not reach production.
 *
 * The returned `references` array is ordered by first appearance in the text,
 * matching the numeric labels rendered inline.
 */
export function processCitations(
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
    const links = numbers
      .map(
        (n) =>
          `<a href="#ref-${n}" className="text-accent font-medium no-underline hover:underline">[${n}]</a>`
      )
      .join("");
    return `<sup className="text-xs ml-0.5">${links}</sup>`;
  });

  return { source: processed, references };
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const { fileContent, realSlug } = readPostFile(slug);
  const { content: mdxBody } = matter(fileContent);
  const frontmatter = parsePostFrontmatter(fileContent, realSlug);

  const { source: processedContent, references } = processCitations(
    mdxBody,
    realSlug
  );

  const { content } = await compileMDX({
    source: processedContent,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      },
    },
  });

  return {
    content,
    frontmatter,
    references,
  };
}

export function getPostFrontmatter(slug: string): PostFrontmatter {
  const { fileContent, realSlug } = readPostFile(slug);
  return parsePostFrontmatter(fileContent, realSlug);
}

export function getAllPostFrontmatter(): PostFrontmatter[] {
  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_PATH);
  const posts = files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      assertSafeContentSlug(slug, "post slug");
      return getPostFrontmatter(slug);
    });

  return posts.sort((a, b) => compareDatesDescending(a.date, b.date));
}

export async function getAllPosts() {
  return getAllPostFrontmatter();
}
