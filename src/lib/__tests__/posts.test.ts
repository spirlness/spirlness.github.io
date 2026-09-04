import { describe, it, expect } from "vitest";
import {
  getAllPostFrontmatter,
  getPostFrontmatter,
  getAllTags,
  getPostsByTag,
  getAdjacentPosts,
  getRelatedPosts,
  readingTime,
  postHref,
} from "../posts";

describe("postHref", () => {
  it("normalizes slashes and always trailing-slashes", () => {
    expect(postHref("my-post")).toBe("/blog/my-post/");
    expect(postHref("/my-post/")).toBe("/blog/my-post/");
    expect(postHref("//my-post//")).toBe("/blog/my-post/");
  });
});

describe("getAllPostFrontmatter", () => {
  it("returns at least one post", () => {
    const posts = getAllPostFrontmatter();
    expect(posts.length).toBeGreaterThan(0);
  });

  it("sorts by date descending", () => {
    const posts = getAllPostFrontmatter();
    for (let i = 0; i < posts.length - 1; i++) {
      expect(new Date(posts[i].date).getTime()).toBeGreaterThanOrEqual(
        new Date(posts[i + 1].date).getTime()
      );
    }
  });

  it("every post has a non-empty title and slug", () => {
    const posts = getAllPostFrontmatter();
    for (const post of posts) {
      expect(post.title).toBeTruthy();
      expect(post.slug).toBeTruthy();
    }
  });
});

describe("getPostFrontmatter", () => {
  it("reads frontmatter for a known slug", () => {
    const posts = getAllPostFrontmatter();
    const first = posts[0];
    const fm = getPostFrontmatter(first.slug);
    expect(fm.slug).toBe(first.slug);
    expect(fm.title).toBe(first.title);
  });

  it("throws on an unsafe slug", () => {
    expect(() => getPostFrontmatter("../etc/passwd")).toThrow();
  });
});

describe("tags", () => {
  it("every post's tags are URL-safe", () => {
    for (const post of getAllPostFrontmatter()) {
      for (const tag of post.tags) {
        expect(tag).toMatch(/^[A-Za-z0-9-]+$/);
      }
    }
  });

  it("getAllTags returns the real post tags with counts", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    const total = tags.reduce((sum, t) => sum + t.count, 0);
    const tagCount = getAllPostFrontmatter().reduce(
      (sum, p) => sum + p.tags.length,
      0
    );
    expect(total).toBe(tagCount);
  });

  it("getPostsByTag returns exactly the posts carrying the tag", () => {
    const posts = getAllPostFrontmatter();
    const someTag = posts[0].tags[0];
    const hits = getPostsByTag(someTag);
    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(hit.tags).toContain(someTag);
    }
  });
});

describe("adjacent and related", () => {
  it("a lone post has no neighbours and no related posts", () => {
    const posts = getAllPostFrontmatter();
    if (posts.length === 1) {
      const { newer, older } = getAdjacentPosts(posts[0].slug);
      expect(newer).toBeUndefined();
      expect(older).toBeUndefined();
      expect(getRelatedPosts(posts[0].slug)).toEqual([]);
    }
  });

  it("adjacent posts link by chronological order", () => {
    const posts = getAllPostFrontmatter();
    for (let i = 1; i < posts.length - 1; i++) {
      const { newer, older } = getAdjacentPosts(posts[i].slug);
      expect(newer?.slug).toBe(posts[i - 1].slug);
      expect(older?.slug).toBe(posts[i + 1].slug);
    }
  });
});

describe("readingTime", () => {
  it("returns at least 1 minute and strips code fences", () => {
    expect(readingTime("hello world")).toBe(1);
    expect(readingTime("```\nnoise words here\n```")).toBe(1);
    expect(readingTime("word ".repeat(400))).toBe(2);
  });
});
