import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

type Entry = { collection: string; slug: string; data: { id: string } };
type Hook = { name: string; handler: (event: { entry: Entry }) => void };

describe("CMS filenames", () => {
  const hooks = new Map<string, Hook["handler"]>();
  const transformations = new Map<string, (value: string) => string>();
  const CMS = {
    registerPreviewTemplate() {},
    registerEventListener(hook: Hook) { hooks.set(hook.name, hook.handler); },
    registerStringTransformation(name: string, transform: (value: string) => string) {
      transformations.set(name, transform);
    },
  };
  runInNewContext(readFileSync("scripts/cms-admin/preview.js", "utf8"), { window: { CMS } });

  it.each([
    ["my-project", "my-project", true],
    ["Legacy-ID", "Legacy-ID", true],
    ["My-Project", "my-project", false],
    ["renamed-project", "original-project", false],
  ] as const)("checks project ID %s against saved slug %s", (id, slug, allowed) => {
    const save = () => hooks.get("preSave")!({ entry: { collection: "projects", slug, data: { id } } });
    if (allowed) expect(save).not.toThrow();
    else expect(save).toThrow(/项目 ID/);
  });

  it("normalizes ASCII punctuation before Sveltia generates the post filename", () => {
    const transform = transformations.get("site_slug")!;
    expect(transform("Model_v2~~概览")).toBe("Model-v2-概览");
  });

  it.each(["model_v2", "model~v2", ""])("blocks an invalid final post slug %j", (slug) => {
    const save = hooks.get("preSave")!;
    expect(() => save({ entry: { collection: "posts", slug, data: { id: "" } } })).toThrow(/文件名/);
    expect(() => save({ entry: { collection: "posts", slug: "model-v2", data: { id: "" } } })).not.toThrow();
  });
});
