import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { getAllPublications, type Publication } from "./bibtex";
import { assertSafeContentSlug } from "./content-id";

const POSTS_PATH = path.join(process.cwd(), "content/posts");

const CITATION_REGEX = /\[@([A-Za-z0-9:-]+(?:;\s*@[A-Za-z0-9:-]+)*)\]/g;

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
export function collectHeadingsPlugin(headings: TocHeading[]) {
  return (tree: {
    type: string;
    tagName?: string;
    properties?: Record<string, unknown>;
    children?: unknown[];
  }) => {
    const seen = new Set<string>();

    function slugify(text: string): string {
      const base =
        text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "section";
      let id = base;
      let n = 2;
      while (seen.has(id)) {
        id = `${base}-${n++}`;
      }
      seen.add(id);
      return id;
    }

    function textOf(
      node: { type: string; value?: string; tagName?: string; children?: unknown[] } | null
    ): string {
      if (!node) return "";
      if (node.type === "text") return node.value ?? "";
      if (node.type === "element") {
        return (node.children ?? []).map((c) => textOf(c as never)).join("");
      }
      return "";
    }

    function walk(node: unknown) {
      if (!node || typeof node !== "object") return;
      const el = node as {
        type: string;
        tagName?: string;
        properties?: Record<string, unknown>;
        children?: unknown[];
      };
      if (el.type === "element" && (el.tagName === "h2" || el.tagName === "h3")) {
        const text = textOf(el as never).trim();
        const id = typeof el.properties?.id === "string" ? el.properties.id : slugify(text);
        if (el.properties) el.properties.id = id;
        headings.push({ id, text, level: el.tagName === "h2" ? 2 : 3 });
        return;
      }
      (el.children ?? []).forEach(walk);
    }

    walk(tree);
  };
}

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
  tags: string[];
  lastUpdated?: string;
}

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface Post {
  content: React.ReactNode;
  frontmatter: PostFrontmatter;
  references: Publication[];
  headings: TocHeading[];
  readingMinutes: number;
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

  const tags = normalizePostTags(data.tags, slug);

  const lastUpdated =
    typeof data.lastUpdated === "string" && data.lastUpdated.trim()
      ? data.lastUpdated.trim()
      : undefined;

  return {
    title: data.title.trim(),
    date: data.date.trim(),
    excerpt: data.excerpt.trim(),
    slug,
    tags,
    lastUpdated,
  };
}

/** Normalize author-supplied tags while preserving first-seen order. */
export function normalizePostTags(value: unknown, slug: string): string[] {
  const rawTags =
    typeof value === "string"
      ? value.split(",")
      : Array.isArray(value)
        ? value
        : [];
  const tags: string[] = [];
  const seen = new Set<string>();

  for (const rawTag of rawTags) {
    if (typeof rawTag !== "string") continue;
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) continue;
    if (!/^[A-Za-z0-9-]+$/.test(tag)) {
      throw new Error(
        `Post "${slug}" has unsafe tag "${tag}"; use only [A-Za-z0-9-] (it becomes /blog/tag/<tag>/)`
      );
    }
    seen.add(tag);
    tags.push(tag);
  }

  return tags;
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

  const headings: TocHeading[] = [];

  const { content } = await compileMDX({
    source: processedContent,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkMath],
        rehypePlugins: [
          rehypeKatex,
          // keepBackground:false lets the `pre` override keep its own bg-gray-900
          [rehypePrettyCode, { theme: "github-dark", keepBackground: false }],
          // Pair form: unified calls collectHeadingsPlugin(headings) and runs
          // the returned transformer on the tree.
          [collectHeadingsPlugin, headings],
        ],
      },
    },
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
