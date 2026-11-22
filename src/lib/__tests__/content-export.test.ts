import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";

it("removes draft uploads while keeping assets used by exported pages", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "draft-export-"));
  function write(file: string, data = "") {
    const target = path.join(fixture, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, data);
  }
  function check(...args: string[]) {
    return spawnSync(process.execPath, [
      path.resolve("node_modules/tsx/dist/cli.mjs"),
      "--tsconfig", path.resolve("tsconfig.json"),
      path.resolve("scripts/content-export.mjs"), ...args,
    ], { cwd: fixture, encoding: "utf8" });
  }

  try {
    write("content/posts/wip.mdx", '---\n"draft": true\ntitle: WIP\nexcerpt: Draft\ndate: "2026-03-14"\n---\n');
    write("content/projects/wip.json", JSON.stringify({
      id: "wip", title: "Draft", date: "2026-03", description: "Draft", thumbnail: "/figure.svg", draft: true,
    }));
    write("out/index.html", '<img srcset="/posts/wip/shared%20file.webp 640w"><a href="/projects/wip/figure.svg?v=1">Figure</a>');
    for (const page of ["blog", "projects", "publications"]) write(`out/${page}/index.html`);
    for (const file of ["posts/wip/private.svg", "posts/wip/shared file.webp", "projects/wip/figure.svg"]) {
      write("out/" + file);
    }

    expect(check().stderr).toContain("Draft attachment found");
    write("out/blog/__empty__/index.html");
    write("out/blog/__empty__/__next._tree.txt");
    const cleanup = check("--clean");
    expect(cleanup.status, cleanup.stderr).toBe(0);
    expect(fs.existsSync(path.join(fixture, "out/posts/wip/private.svg"))).toBe(false);
    expect(fs.existsSync(path.join(fixture, "out/posts/wip/shared file.webp"))).toBe(true);
    expect(fs.existsSync(path.join(fixture, "out/projects/wip/figure.svg"))).toBe(true);
    expect(fs.existsSync(path.join(fixture, "out/blog/__empty__"))).toBe(false);
    const verify = check();
    expect(verify.status, verify.stderr).toBe(0);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
