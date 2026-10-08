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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "project-cache-"));
  roots.push(root);
  const directory = path.join(root, "content", "projects");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "example.json");
  const project = { id: "example", title: "Original", description: "Example", date: "2024-01", thumbnail: "/projects/example.svg", tags: [], links: {} };
  fs.writeFileSync(file, JSON.stringify(project));
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const { getAllProjects } = await import("../projects");
  return { file, project, getAllProjects };
}

it("avoids repeated directory reads during production exports", async () => {
  const { getAllProjects } = await fixture("production");
  const reads = vi.spyOn(fs, "readdirSync");
  expect(getAllProjects()[0].title).toBe("Original");
  expect(getAllProjects()[0].title).toBe("Original");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("picks up project edits and additions during development", async () => {
  const { file, project, getAllProjects } = await fixture("development");
  expect(getAllProjects()[0].title).toBe("Original");
  fs.writeFileSync(file, JSON.stringify({ ...project, title: "Updated" }));
  fs.writeFileSync(path.join(path.dirname(file), "added.json"), JSON.stringify({ ...project, id: "added", title: "Added" }));
  expect(getAllProjects().map((item) => item.title).sort()).toEqual(["Added", "Updated"]);
});

it("isolates array, record, tag and link edits on both cold and warm reads", async () => {
  const { getAllProjects, project } = await fixture("production");
  for (let i = 0; i < 2; i++) {
    const projects = getAllProjects();
    projects[0].title = "Caller edit";
    projects[0].tags?.push("caller-tag");
    projects[0].links!.code = "https://example.com/caller";
    projects.pop();
    expect(getAllProjects()).toEqual([project]);
  }
});
