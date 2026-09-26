import { describe, expect, it } from "vitest";
import { getAllPostFrontmatter, getPostEffectiveDate } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import sitemap from "./sitemap";

describe("sitemap", () => {
  it("includes every generated tag page", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://spirlness.github.io/blog/tag/physics/");
    expect(urls).toContain("https://spirlness.github.io/blog/tag/deep-learning/");
    expect(urls).toContain("https://spirlness.github.io/blog/tag/resilience/");
  });

  it("derives project lastmod from project frontmatter", () => {
    const projects = getAllProjects();
    const projectEntries = sitemap().filter(
      (entry) =>
        entry.url.startsWith("https://spirlness.github.io/projects/") &&
        entry.url !== "https://spirlness.github.io/projects/"
    );

    expect(projectEntries).toHaveLength(projects.length);
    for (const project of projects) {
      const entry = projectEntries.find(
        (e) => e.url === `https://spirlness.github.io/projects/${project.id}/`
      );
      expect(entry?.lastModified).toBe(project.lastModified);
    }
  });

  it("uses the effective post date for post lastmod", () => {
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
      expect(entry?.lastModified).toBe(getPostEffectiveDate(post));
    }
  });
});
