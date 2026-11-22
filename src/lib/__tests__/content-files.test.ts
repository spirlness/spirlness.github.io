import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { readContentFile } from "../content-files";

const directories: string[] = [];

afterEach(() => {
  for (const directory of directories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe("readContentFile", () => {
  it("reads a regular content file", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-files-"));
    directories.push(root);
    const directory = path.join(root, "content");
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(directory, "entry.json"), "{}", "utf8");

    expect(readContentFile(directory, "entry.json")).toBe("{}");
  });

  it("rejects path traversal in filenames", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-files-"));
    directories.push(root);
    const directory = path.join(root, "content");
    fs.mkdirSync(directory);
    fs.writeFileSync(path.join(root, "outside.json"), "{}", "utf8");

    expect(() => readContentFile(directory, "../outside.json")).toThrow(/Invalid content filename/);
  });

  it("rejects symlinks instead of following them outside the content directory", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-files-"));
    directories.push(root);
    const directory = path.join(root, "content");
    fs.mkdirSync(directory);
    const outside = path.join(root, "outside.json");
    fs.writeFileSync(outside, "{}", "utf8");
    const link = path.join(directory, "entry.json");
    try {
      fs.symlinkSync(outside, link, "file");
    } catch (error) {
      if (process.platform !== "win32" || (error as NodeJS.ErrnoException).code !== "EPERM") throw error;
      // Windows junctions exercise the reparse-point check without symlink privileges.
      fs.mkdirSync(path.join(root, "outside-dir"));
      fs.symlinkSync(path.join(root, "outside-dir"), link, "junction");
    }

    expect(() => readContentFile(directory, "entry.json")).toThrow(/regular file/);
  });
});
