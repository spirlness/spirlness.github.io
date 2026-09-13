import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes every generated tag page", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://spirlness.github.io/blog/tag/physics/");
    expect(urls).toContain("https://spirlness.github.io/blog/tag/deep-learning/");
    expect(urls).toContain("https://spirlness.github.io/blog/tag/resilience/");
  });

  it("omits project lastmod when content only provides a month", () => {
    const projectEntries = sitemap().filter((entry) =>
      entry.url.startsWith("https://spirlness.github.io/projects/") &&
      entry.url !== "https://spirlness.github.io/projects/"
    );

    expect(projectEntries).toHaveLength(2);
    expect(projectEntries.every((entry) => entry.lastModified === undefined)).toBe(true);
  });

  it("pins post lastmod to the frontmatter date", async () => {
    const { getAllPostFrontmatter } = await import("@/lib/posts");
    const posts = getAllPostFrontmatter();
    const entries = sitemap().filter(
      (entry) =>
        entry.url.startsWith("https://spirlness.github.io/blog/") &&
        !entry.url.includes("/tag/") &&
        entry.url !== "https://spirlness.github.io/blog/"
    );
    expect(entries).toHaveLength(posts.length);
    for (const post of posts) {
      const entry = entries.find(
        (e) => e.url === `https://spirlness.github.io/blog/${post.slug}/`
      );
      expect(entry?.lastModified).toBe(post.date);
    }
  });
});
