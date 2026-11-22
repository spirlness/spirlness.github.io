import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

type Entry = { collection: string; slug: string; data: { id: string } };
type Hook = { name: string; handler: (event: { entry: Entry }) => void };

describe("CMS project saves", () => {
  const hooks = new Map<string, Hook["handler"]>();
  const CMS = {
    registerPreviewTemplate() {},
    registerEventListener(hook: Hook) { hooks.set(hook.name, hook.handler); },
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
});
