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
  const postMdx = `---
title: Original
date: '2024-01-01'
excerpt: Example post excerpt
tags: [test]
---
`;
  fs.writeFileSync(file, postMdx);
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const { getAllPostFrontmatter } = await import("../posts");
  return { file, getAllPostFrontmatter };
}

it("avoids repeated directory reads during production exports", async () => {
  const { getAllPostFrontmatter } = await fixture("production");
  const reads = vi.spyOn(fs, "readdirSync");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("picks up post edits and additions during development", async () => {
  const { file, getAllPostFrontmatter } = await fixture("development");
  expect(getAllPostFrontmatter()[0].title).toBe("Original");
  const updatedMdx = `---
title: Updated
date: '2024-01-01'
excerpt: Example post excerpt
tags: [test]
---
`;
  const addedMdx = `---
title: Added
date: '2024-01-02'
excerpt: Added post excerpt
tags: [test]
---
`;
  fs.writeFileSync(file, updatedMdx);
  fs.writeFileSync(path.join(path.dirname(file), "added.mdx"), addedMdx);
  expect(getAllPostFrontmatter().map((item) => item.title).sort()).toEqual(["Added", "Updated"]);
});
