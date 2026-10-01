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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "publication-cache-"));
  roots.push(root);
  fs.mkdirSync(path.join(root, "content"));
  const file = path.join(root, "content", "references.bib");
  fs.writeFileSync(file, "@article{example, title={Original}, year={2024}, author={Doe, Jane}}");
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const { getAllPublications } = await import("../bibtex");
  return { file, getAllPublications };
}

it("avoids repeated BibTeX reads during production exports", async () => {
  const { getAllPublications } = await fixture("production");
  const reads = vi.spyOn(fs, "readFileSync");
  expect(getAllPublications()[0].title).toBe("Original");
  expect(getAllPublications()[0].title).toBe("Original");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("picks up BibTeX edits during development", async () => {
  const { file, getAllPublications } = await fixture("development");
  expect(getAllPublications()[0].title).toBe("Original");
  fs.writeFileSync(file, "@article{example, title={Updated}, year={2024}, author={Doe, Jane}}");
  expect(getAllPublications()[0].title).toBe("Updated");
});
