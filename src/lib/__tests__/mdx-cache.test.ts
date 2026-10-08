import { afterEach, expect, it, vi } from "vitest";
import { compileMDX } from "next-mdx-remote/rsc";

vi.mock("next-mdx-remote/rsc", async importOriginal => {
  const original = await importOriginal<typeof import("next-mdx-remote/rsc")>();
  return { ...original, compileMDX: vi.fn(original.compileMDX) };
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(compileMDX).mockClear();
});

async function compiler(mode: "production" | "development") {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", mode);
  return (await import("../mdx")).compileContent;
}

it("compiles simultaneous and subsequent production reads once", async () => {
  const compile = await compiler("production");
  const options = { source: "## Heading", slug: "example", tableOfContents: true };
  const results = await Promise.all([compile(options), compile({ ...options }), compile(options)]);
  await compile(options);
  expect(compileMDX).toHaveBeenCalledTimes(1);
  expect(results.map(result => result.headings)).toEqual(Array(3).fill([{ id: "heading", text: "Heading", level: 2 }]));
});

it("separates sources, slugs and compiler options", async () => {
  const compile = await compiler("production");
  const options = { source: "## Original", slug: "example" };
  await compile(options);
  const revised = await compile({ ...options, source: "## Revised", tableOfContents: true });
  const plain = await compile({ ...options, source: "## Revised" });
  await compile({ ...options, slug: "project" });
  const cited = await compile({ ...options, source: "[@li2024deep]", citations: true });
  expect(compileMDX).toHaveBeenCalledTimes(5);
  expect(revised.headings[0].text).toBe("Revised");
  expect(plain.headings).toEqual([]);
  expect(cited.references[0].id).toBe("li2024deep");
});

it("keeps cached headings and publications isolated from callers", async () => {
  const compile = await compiler("production");
  const options = { source: "## Heading\n\n[@li2024deep]", slug: "example", citations: true, tableOfContents: true };
  for (let i = 0; i < 2; i++) {
    const result = await compile(options);
    result.headings[0].text = "Caller edit";
    result.headings.pop();
    result.references[0].title = "Caller edit";
    result.references.length = 0;
    const fresh = await compile(options);
    expect(fresh.headings[0].text).toBe("Heading");
    expect(fresh.references[0].title).toBe("Deep Learning for Physics Simulation");
  }
  expect(compileMDX).toHaveBeenCalledTimes(1);
});

it("retries a rejected compilation instead of caching its failure", async () => {
  const compile = await compiler("production");
  const options = { source: "## Heading", slug: "example" };
  vi.mocked(compileMDX).mockRejectedValueOnce(new Error("Transient compiler failure"));
  await expect(compile(options)).rejects.toThrow("Transient compiler failure");
  await expect(compile(options)).resolves.toHaveProperty("content");
  expect(compileMDX).toHaveBeenCalledTimes(2);
});

it("bypasses the compilation cache in development", async () => {
  const compile = await compiler("development");
  const options = { source: "## Original", slug: "example", tableOfContents: true };
  await compile(options);
  await compile(options);
  const updated = await compile({ ...options, source: "## Updated" });
  expect(updated.headings[0].text).toBe("Updated");
  expect(compileMDX).toHaveBeenCalledTimes(3);
});
