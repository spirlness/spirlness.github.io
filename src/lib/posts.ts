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
import { readingTime } from "./reading-time";

export type { PostFrontmatter } from "./content-schemas";
export type { TocHeading } from "./mdx";
export { readingTime } from "./reading-time";

const POSTS_PATH = path.join(process.cwd(), "content/posts");

// Production caches stay private; callers own deep snapshots, including tags.
let cachedPosts: PostFrontmatter[] | null = null;

/**
 * Build a normalized, trailing-slash href for a blog post. GitHub Pages serves
 * out/blog/<slug>/index.html at /blog/<slug>/, so the trailing slash must
 * always be present or an internal link silently 404s.
 */
export function postHref(slug: string): string {
  const clean = slug.replace(/^\/+|\/+$/g, "");
  return `/blog/${clean}/`;
}

export function getPostEffectiveDate(
  post: Pick<PostFrontmatter, "date" | "lastUpdated">
): string {
  return post.lastUpdated ?? post.date;
}

export interface Post {
  content: React.ReactNode;
  frontmatter: PostFrontmatter;
  references: Publication[];
  headings: TocHeading[];
  readingMinutes: number;
}

/** Pre-parse date string into epoch timestamp, handling NaN gracefully. */
function parseDateTimestamp(date: string): number {
  const time = new Date(date).getTime();
  return Number.isNaN(time) ? Number.MIN_SAFE_INTEGER : time;
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
  const cacheEnabled = process.env.NODE_ENV === "production";
  if (cacheEnabled && cachedPosts) {
    return structuredClone(cachedPosts);
  }

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

  // Optimization: Schwartzian transform precomputes date timestamps once per post
  // to avoid repeated Date object allocations inside Array.prototype.sort().
  const decorated = posts.map((post) => ({
    post,
    time: parseDateTimestamp(post.date),
  }));
  decorated.sort((a, b) => b.time - a.time);
  const sortedPosts = decorated.map((d) => d.post);

  if (cacheEnabled) {
    cachedPosts = sortedPosts;
  }

  return structuredClone(sortedPosts);
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
  // Optimization: Set lookup converts O(T) array search per tag to O(1) set lookup.
  const currentTagSet = new Set(current.tags);

  // Optimization: Schwartzian transform precomputes shared tag count and date timestamp
  // once per candidate post, eliminating repeated Date allocations inside sort comparator.
  const decorated = getAllPostFrontmatter()
    .filter((post) => post.slug !== slug)
    .map((post) => {
      let shared = 0;
      for (const tag of post.tags) {
        if (currentTagSet.has(tag)) shared++;
      }
      return { post, shared, time: parseDateTimestamp(post.date) };
    })
    .filter(({ shared }) => shared > 0);

  decorated.sort((a, b) => b.shared - a.shared || b.time - a.time);

  return decorated.slice(0, limit).map(({ post }) => post);
}
