import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, expect, it, vi } from "vitest";

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true });
});

async function fixture(mode: "production" | "development" = "development") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", mode);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "post-ranking-"));
  roots.push(root);
  const directory = path.join(root, "content", "posts");
  fs.mkdirSync(directory, { recursive: true });
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const posts = await import("../posts");
  function add(slug: string, date: string, tags: string[]) {
    fs.writeFileSync(path.join(directory, `${slug}.mdx`), `---
title: ${slug}
date: '${date}'
excerpt: Ranking fixture
tags: ${JSON.stringify(tags)}
---
Post content.`);
  }
  return { ...posts, add };
}

it.each(["development", "production"] as const)(
  "ranks related posts by overlap before recency in %s",
  async (mode) => {
    const { add, getRelatedPosts } = await fixture(mode);
    add("current", "2026-10-22", ["alpha", "beta"]);
    add("most-related", "2020-01-01", ["alpha", "beta"]);
    add("newer", "2025-01-01", ["beta"]);
    add("older", "2024-01-01", ["alpha"]);
    add("unrelated", "2026-10-23", ["gamma"]);
    for (let read = 0; read < 2; read++) {
      expect(getRelatedPosts("current", 10).map((post) => post.slug))
        .toEqual(["most-related", "newer", "older"]);
      expect(getRelatedPosts("current").map((post) => post.slug))
        .toEqual(["most-related", "newer"]);
      expect(getRelatedPosts("current", 0)).toEqual([]);
    }
  }
);

it("normalizes duplicate tags and returns no matches for an empty tag list", async () => {
  const { add, getRelatedPosts } = await fixture();
  add("current", "2026-01-01", ["alpha", "alpha", "beta"]);
  add("duplicate", "2025-01-01", ["alpha", "alpha", "alpha"]);
  add("both", "2024-01-01", ["alpha", "beta"]);
  add("empty", "2026-01-01", []);
  expect(getRelatedPosts("current", 10).map((post) => post.slug)).toEqual(["both", "duplicate"]);
  expect(getRelatedPosts("empty")).toEqual([]);
});

it("sorts calendar boundaries and preserves input order for equal dates and scores", async () => {
  const { add, getAllPostFrontmatter, getRelatedPosts } = await fixture();
  add("current", "2026-01-01", ["alpha"]);
  add("ancient", "0100-01-01", ["alpha"]);
  add("before-epoch", "1969-12-31", ["alpha"]);
  add("leap-day", "2024-02-29", ["alpha"]);
  add("tie-b", "2024-03-01", ["alpha"]);
  add("tie-a", "2024-03-01", ["alpha"]);
  add("future", "9999-12-31", ["alpha"]);
  const order = ["future", "tie-b", "tie-a", "leap-day", "before-epoch", "ancient"];
  vi.spyOn(fs, "readdirSync").mockReturnValue(["current.mdx", ...order.map((slug) => `${slug}.mdx`)] as never);
  expect(getAllPostFrontmatter().map((post) => post.slug)).toEqual([
    "future", "current", ...order.slice(1),
  ]);
  expect(getRelatedPosts("current", 10).map((post) => post.slug)).toEqual(order);
});

it.each(["not-a-date", "2023-02-29", "2024-13-01"])(
  "rejects invalid content dates (%s) before sorting",
  async (date) => {
    const { add, getAllPostFrontmatter, getRelatedPosts } = await fixture();
    add("current", "2026-01-01", ["alpha"]);
    add("invalid", date, ["alpha"]);
    expect(() => getAllPostFrontmatter()).toThrow(/valid date/);
    expect(() => getRelatedPosts("current")).toThrow(/valid date/);
  }
);
