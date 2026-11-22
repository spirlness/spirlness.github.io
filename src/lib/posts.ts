import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { assertSafeContentSlug } from "./content-id";
import {
  parsePostFrontmatter,
  type PostFrontmatter,
} from "./content-schemas";
import {
  isDraftHidden,
  resolveIncludeDrafts,
  type ContentVisibilityOptions,
} from "./content-drafts";
import type { TocHeading } from "./mdx";
import type { Publication } from "./bibtex";
import { readingTime } from "./reading-time";

export type { PostFrontmatter } from "./content-schemas";
export type { TocHeading } from "./mdx";
export { readingTime } from "./reading-time";

const POSTS_PATH = path.join(process.cwd(), "content/posts");

// Production caches stay private; callers own deep snapshots, including tags.
let cachedPosts: PostFrontmatter[] | null = null;
const cachedPostSources = new Map<string, { frontmatter: PostFrontmatter; body: string }>();

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

function readPostSource(slug: string) {
  const realSlug = assertSafeContentSlug(slug.replace(/\.mdx$/, ""), "post slug");
  const cache = process.env.NODE_ENV === "production" ? cachedPostSources : undefined;
  const cached = cache?.get(realSlug);
  if (cached) return cached;

  const filePath = path.join(POSTS_PATH, `${realSlug}.mdx`);
  const { data, content: body } = matter(fs.readFileSync(filePath, "utf8"));
  const source = { frontmatter: parsePostFrontmatter(data, realSlug), body };
  cache?.set(realSlug, source);
  return source;
}

/**
 * A hidden draft must be indistinguishable from a missing post: callers
 * already map any read error to `notFound()`, so the rejection happens at the
 * same boundary as a slug that has no file.
 */
function assertPostVisible(
  frontmatter: PostFrontmatter,
  includeDrafts: boolean
): void {
  if (isDraftHidden(frontmatter, includeDrafts)) {
    throw new Error(`Post not found: ${frontmatter.slug}`);
  }
}

export async function getPostBySlug(
  slug: string,
  options: ContentVisibilityOptions = {}
): Promise<Post> {
  const includeDrafts = resolveIncludeDrafts(options);
  const { frontmatter, body } = readPostSource(slug);
  assertPostVisible(frontmatter, includeDrafts);
  const { compileContent } = await import("./mdx");
  const { content, references, headings } = await compileContent({
    source: body,
    slug: frontmatter.slug,
    citations: true,
    tableOfContents: true,
  });

  return {
    content,
    frontmatter: structuredClone(frontmatter),
    references,
    headings,
    readingMinutes: readingTime(body),
  };
}

export function getPostFrontmatter(
  slug: string,
  options: ContentVisibilityOptions = {}
): PostFrontmatter {
  const includeDrafts = resolveIncludeDrafts(options);
  const { frontmatter } = readPostSource(slug);
  assertPostVisible(frontmatter, includeDrafts);
  return structuredClone(frontmatter);
}

export function getAllPostFrontmatter(
  options: ContentVisibilityOptions = {}
): PostFrontmatter[] {
  const includeDrafts = resolveIncludeDrafts(options);
  const cacheEnabled = process.env.NODE_ENV === "production";
  if (cacheEnabled && cachedPosts) {
    // The cache holds every parsed post; visibility is applied on each return
    // so an explicit `includeDrafts` override can never poison later reads.
    return structuredClone(cachedPosts.filter((post) => !isDraftHidden(post, includeDrafts)));
  }

  if (!fs.existsSync(POSTS_PATH)) {
    return [];
  }

  const files = fs.readdirSync(POSTS_PATH);
  const posts = files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => readPostSource(file.slice(0, -4)).frontmatter);

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

  return structuredClone(sortedPosts.filter((post) => !isDraftHidden(post, includeDrafts)));
}

export interface TagCount {
  tag: string;
  count: number;
}

/**
 * Unique tags across all posts, sorted by popularity then name.
 * Optimization: Accepts an optional `posts` array to avoid re-invoking
 * `getAllPostFrontmatter()` and redundant `structuredClone` deep copies.
 */
export function getAllTags(
  posts: PostFrontmatter[] = getAllPostFrontmatter()
): TagCount[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag, count]) => ({ tag, count }));
}

/**
 * Posts matching a given tag.
 * Optimization: Accepts an optional `posts` array to avoid duplicate reads.
 */
export function getPostsByTag(
  tag: string,
  posts: PostFrontmatter[] = getAllPostFrontmatter()
): PostFrontmatter[] {
  const clean = assertSafeContentSlug(tag, "post tag");
  return posts.filter((post) => post.tags.includes(clean));
}

/**
 * Chronological neighbours of a post. `newer` points at the most recent post
 * before it (posts sort newest-first), `older` at the next one after.
 * Optimization: Accepts an optional `posts` array to avoid re-invoking
 * `getAllPostFrontmatter()` and redundant `structuredClone` deep copies.
 */
export function getAdjacentPosts(
  slug: string,
  posts: PostFrontmatter[] = getAllPostFrontmatter()
): {
  newer?: PostFrontmatter;
  older?: PostFrontmatter;
} {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return {};
  return {
    newer: posts[index - 1],
    older: posts[index + 1],
  };
}

/**
 * Posts sharing at least one tag, ranked by shared-tag count then recency.
 * Optimization: Accepts an optional `posts` array to avoid re-invoking
 * `getAllPostFrontmatter()` and redundant `structuredClone` deep copies.
 */
export function getRelatedPosts(
  slug: string,
  limit = 2,
  posts: PostFrontmatter[] = getAllPostFrontmatter()
): PostFrontmatter[] {
  if (limit <= 0) return [];

  const current = posts.find((p) => p.slug === slug) ?? getPostFrontmatter(slug);
  if (current.tags.length === 0) return [];

  // Set lookup keeps tag matching O(1) per tag.
  const currentTagSet = new Set(current.tags);

  // Single pass: score once, and only parse dates and allocate candidates for
  // posts that actually share a tag.
  const candidates: { post: PostFrontmatter; shared: number; time: number }[] = [];
  for (const post of posts) {
    if (post.slug === slug) continue;
    let shared = 0;
    for (const tag of post.tags) {
      if (currentTagSet.has(tag)) shared++;
    }
    if (shared > 0) {
      candidates.push({ post, shared, time: parseDateTimestamp(post.date) });
    }
  }

  candidates.sort((a, b) => b.shared - a.shared || b.time - a.time);

  return candidates.slice(0, limit).map(({ post }) => post);
}
