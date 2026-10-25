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

it("sorts valid months descending across the Unix epoch on cold and cached reads", async () => {
  const { file, project, getAllProjects } = await fixture("production");
  const directory = path.dirname(file);
  fs.rmSync(file);
  for (const [id, date] of [["before", "1969-12"], ["epoch", "1970-01"], ["after", "1970-02"]]) {
    fs.writeFileSync(path.join(directory, `${id}.json`), JSON.stringify({ ...project, id, date }));
  }
  for (let read = 0; read < 2; read++) {
    expect(getAllProjects().map(item => item.id)).toEqual(["after", "epoch", "before"]);
  }
});

it("preserves input order for projects with the same month", async () => {
  const { file, project, getAllProjects } = await fixture("development");
  const directory = path.dirname(file);
  fs.writeFileSync(path.join(directory, "another.json"), JSON.stringify({ ...project, id: "another" }));
  const inputOrder = fs.readdirSync(directory).filter(name => name.endsWith(".json")).map(name => name.slice(0, -5));
  expect(getAllProjects().map(item => item.id)).toEqual(inputOrder);
});

it("rejects invalid months instead of silently moving malformed content to the end", async () => {
  const { file, project, getAllProjects } = await fixture("development");
  fs.writeFileSync(file, JSON.stringify({ ...project, date: "2024-13" }));
  expect(() => getAllProjects()).toThrow(/YYYY-MM/);
});
