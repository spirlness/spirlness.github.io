import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { afterEach, expect, it } from "vitest";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "spirl-media-"));
  directories.push(directory);
  return {
    file: (name: string) => path.join(directory, name),
    generate: (...args: string[]) =>
      spawnSync(process.execPath, ["scripts/media-variants.mjs", directory, ...args], { encoding: "utf8" }),
  };
}

function image(width: number) {
  return sharp({ create: { width, height: 20, channels: 3, background: "red" } });
}

it("refuses to replace unmarked WebP originals, even with --force", async () => {
  const { file, generate } = fixture();
  const original = await image(20).webp().toBuffer();
  fs.writeFileSync(file("diagram-640.webp"), original);
  fs.utimesSync(file("diagram-640.webp"), 1, 1);
  fs.writeFileSync(file("diagram.png"), await image(100).png().toBuffer());
  const result = generate("--force");
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Variant filename collision:");
  expect(fs.readFileSync(file("diagram-640.webp"))).toEqual(original);
  expect(fs.existsSync(file("diagram-1280.webp"))).toBe(false);
});

it("refreshes only its own variants and accepts originals with width suffixes", async () => {
  const { file, generate } = fixture();
  fs.writeFileSync(file("figure-640.webp"), await image(30).webp().toBuffer());
  let result = generate();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("3 variant(s) written");
  result = generate();
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain("1 source(s), 0 variant(s) written, 3 up to date");

  fs.writeFileSync(file("figure-640.webp"), await image(90).webp().toBuffer());
  result = generate("--force");
  expect(result.status, result.stderr).toBe(0);
  const variant = await sharp(fs.readFileSync(file("figure-640-640.webp"))).metadata();
  expect(variant.width).toBe(90);
});
