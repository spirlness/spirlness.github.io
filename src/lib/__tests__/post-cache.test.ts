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
title: Original Post
date: '2024-01-01'
excerpt: Example post excerpt
tags: ['test']
---
Post body text.
`;
  fs.writeFileSync(file, postContent);
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const { getAllPostFrontmatter } = await import("../posts");
  return { file, directory, getAllPostFrontmatter };
}

it("avoids repeated directory reads during production exports", async () => {
  const { getAllPostFrontmatter } = await fixture("production");
  const reads = vi.spyOn(fs, "readdirSync");
  expect(getAllPostFrontmatter()[0].title).toBe("Original Post");
  expect(getAllPostFrontmatter()[0].title).toBe("Original Post");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("picks up post edits and additions during development", async () => {
  const { file, directory, getAllPostFrontmatter } = await fixture("development");
  expect(getAllPostFrontmatter()[0].title).toBe("Original Post");
  const updatedContent = `---
title: Updated Post
date: '2024-01-01'
excerpt: Example post excerpt
tags: ['test']
---
Post body text.
`;
  fs.writeFileSync(file, updatedContent);
  const addedContent = `---
title: Added Post
date: '2024-02-01'
excerpt: Another post excerpt
tags: ['test']
---
Another body text.
`;
  fs.writeFileSync(path.join(directory, "added.mdx"), addedContent);
  expect(getAllPostFrontmatter().map((item) => item.title).sort()).toEqual(["Added Post", "Updated Post"]);
});
