import { describe, it, expect } from "vitest";
import {
  getAllPostFrontmatter,
  getPostFrontmatter,
  postHref,
  processCitations,
} from "../posts";

describe("postHref", () => {
  it("normalizes slashes and always trailing-slashes", () => {
    expect(postHref("my-post")).toBe("/blog/my-post/");
    expect(postHref("/my-post/")).toBe("/blog/my-post/");
    expect(postHref("//my-post//")).toBe("/blog/my-post/");
  });
});

describe("processCitations", () => {
  it("numbers citations by first appearance and links to refs", () => {
    const { source, references } = processCitations(
      "See [@li2024deep; @li2023neural] and again [@li2024deep].",
      "test-post"
    );
    expect(references.map((r) => r.id)).toEqual(["li2024deep", "li2023neural"]);
    expect(source).toContain('href="#ref-1"');
    expect(source).toContain('href="#ref-2"');
    expect(source).toContain("[1]");
    expect(source).toContain("[2]");
  });

  it("throws on unknown citation keys", () => {
    expect(() =>
      processCitations("Broken [@does-not-exist]", "test-post")
    ).toThrow(/does-not-exist/);
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
