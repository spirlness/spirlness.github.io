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

async function fixture(mode: "production" | "development") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", mode);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "post-cache-"));
  roots.push(root);
  const directory = path.join(root, "content", "posts");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "example.mdx");
  const postContent = `---
title: Original
date: '2024-01-01'
excerpt: Example post
tags: ['test']
---
Post content.`;
  fs.writeFileSync(file, postContent);
  vi.spyOn(process, "cwd").mockReturnValue(root);
  return { file, ...(await import("../posts")) };
}

it("avoids repeated directory reads during production exports", async () => {
  const { getAllPostFrontmatter } = await fixture("production");
  const reads = vi.spyOn(fs, "readdirSync");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("shares the parsed post across metadata, index and body reads in production", async () => {
  const { file, getPostFrontmatter, getAllPostFrontmatter, getPostBySlug } = await fixture("production");
  const reads = vi.spyOn(fs, "readFileSync");
  const metadata = getPostFrontmatter("example");
  metadata.tags.push("metadata edit");
  expect(getAllPostFrontmatter()[0].tags).toEqual(["test"]);
  const detail = await getPostBySlug("example");
  detail.frontmatter.tags.push("detail edit");
  expect(getPostFrontmatter("example").tags).toEqual(["test"]);
  expect(reads.mock.calls.filter(([filename]) => filename === file)).toHaveLength(1);
});

it("picks up post edits and additions during development", async () => {
  const { file, getAllPostFrontmatter } = await fixture("development");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  const updatedContent = `---
title: Updated
date: '2024-01-01'
excerpt: Example post
tags: ['test']
---
Post content.`;
  fs.writeFileSync(file, updatedContent);
  const addedContent = `---
title: Added
date: '2024-02-01'
excerpt: Added post
tags: ['test']
---
Added content.`;
  fs.writeFileSync(path.join(path.dirname(file), "added.mdx"), addedContent);
  expect(getAllPostFrontmatter().map((item) => item.title).sort()).toEqual(["Added", "Updated"]);
});

it("isolates array, record and nested-tag edits on both cold and warm reads", async () => {
  const { getAllPostFrontmatter } = await fixture("production");
  for (let i = 0; i < 2; i++) {
    const posts = getAllPostFrontmatter();
    posts[0].title = "Caller edit";
    posts[0].tags.push("caller-tag");
    posts.splice(0, 1);
    expect(getAllPostFrontmatter()).toMatchObject([{ title: "Original", tags: ["test"] }]);
  }
});
