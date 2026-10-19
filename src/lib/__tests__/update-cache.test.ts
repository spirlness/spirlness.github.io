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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "update-cache-"));
  roots.push(root);
  const directory = path.join(root, "content", "updates");
  fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "example.json");
  const update = {
    date: "2024-01",
    content: "Original update content",
    icon: "publication" as const,
  };
  fs.writeFileSync(file, JSON.stringify(update));
  vi.spyOn(process, "cwd").mockReturnValue(root);
  const { getAllUpdates } = await import("../updates");
  return { file, update, getAllUpdates };
}

it("avoids repeated directory reads during production exports", async () => {
  const { getAllUpdates } = await fixture("production");
  const reads = vi.spyOn(fs, "readdirSync");
  expect(getAllUpdates()[0].content).toBe("Original update content");
  expect(getAllUpdates()[0].content).toBe("Original update content");
  expect(reads).toHaveBeenCalledTimes(1);
});

it("picks up update edits and additions during development", async () => {
  const { file, update, getAllUpdates } = await fixture("development");
  expect(getAllUpdates()[0].content).toBe("Original update content");
  fs.writeFileSync(file, JSON.stringify({ ...update, content: "Updated update content" }));
  fs.writeFileSync(
    path.join(path.dirname(file), "added.json"),
    JSON.stringify({ ...update, content: "Added update content", date: "2024-02" })
  );
  expect(getAllUpdates().map((item) => item.content).sort()).toEqual([
    "Added update content",
    "Updated update content",
  ]);
});

it("isolates array and object edits on both cold and warm reads", async () => {
  const { getAllUpdates, update } = await fixture("production");
  for (let i = 0; i < 2; i++) {
    const updates = getAllUpdates();
    updates[0].content = "Caller content edit";
    updates.pop();
    expect(getAllUpdates()).toEqual([update]);
  }
});
