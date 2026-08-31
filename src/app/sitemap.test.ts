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
});
