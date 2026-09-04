import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { assertSafeContentSlug } from "./content-id";
import {
  parsePostFrontmatter,
  type PostFrontmatter,
} from "./content-schemas";
import { compileContent, type TocHeading } from "./mdx";
import type { Publication } from "./bibtex";

export type { PostFrontmatter } from "./content-schemas";
export type { TocHeading } from "./mdx";

const POSTS_PATH = path.join(process.cwd(), "content/posts");

/**
 * Rough reading time in minutes: strip fenced code blocks and JSX tags, then
 * divide the word count by 200 wpm. The result is deliberately approximate.
 */
export function readingTime(source: string): number {
  const body = source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .trim();
  const words = body.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * Rehype plugin factory that records `h2`/`h3` headings from the compiled MDX
 * and assigns each a stable `id` so the floating ToC can anchor and scrollspy.
 * The plugin mutates the headings array passed in; compileMDX runs rehype
 * synchronously, so the array is populated when it resolves.
 */
/**
 * Build a normalized, trailing-slash href for a blog post. GitHub Pages serves
 * out/blog/<slug>/index.html at /blog/<slug>/, so the trailing slash must
 * always be present or an internal link silently 404s.
 */
export function postHref(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return `/blog/${clean}/`;
}

export interface Post {
  content: React.ReactNode;
  frontmatter: PostFrontmatter;
  references: Publication[];
  headings: TocHeading[];
  readingMinutes: number;
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

export async function getPostBySlug(slug: string): Promise<Post> {
  const { fileContent, realSlug } = readPostFile(slug);
  const { content: mdxBody, data } = matter(fileContent);
  const frontmatter = parsePostFrontmatter(data, realSlug);
  const { content, references, headings } = await compileContent({
    source: mdxBody,
    slug: realSlug,
    citations: true,
    tableOfContents: true,
  });

  return {
    content,
    frontmatter,
    references,
    headings,
    readingMinutes: readingTime(mdxBody),
  };
}

export function getPostFrontmatter(slug: string): PostFrontmatter {
  const { fileContent, realSlug } = readPostFile(slug);
  return parsePostFrontmatter(matter(fileContent).data, realSlug);
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

export interface TagCount {
  tag: string;
  count: number;
}

/** Unique tags across all posts, sorted by popularity then name. */
export function getAllTags(): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of getAllPostFrontmatter()) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

export function getPostsByTag(tag: string): PostFrontmatter[] {
  const clean = assertSafeContentSlug(tag, "post tag");
  return getAllPostFrontmatter().filter((post) => post.tags.includes(clean));
}

/**
 * Chronological neighbours of a post. `newer` points at the most recent post
 * before it (posts sort newest-first), `older` at the next one after.
 */
export function getAdjacentPosts(slug: string): {
  newer?: PostFrontmatter;
  older?: PostFrontmatter;
} {
  const posts = getAllPostFrontmatter();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return {
    newer: posts[index - 1],
    older: posts[index + 1],
  };
}

/** Posts sharing at least one tag, ranked by shared-tag count then recency. */
export function getRelatedPosts(slug: string, limit = 2): PostFrontmatter[] {
  const current = getPostFrontmatter(slug);
  return getAllPostFrontmatter()
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      shared: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        compareDatesDescending(a.post.date, b.post.date)
    )
    .slice(0, limit)
    .map(({ post }) => post);
}
