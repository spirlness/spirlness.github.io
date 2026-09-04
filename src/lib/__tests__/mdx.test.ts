import { describe, expect, it } from "vitest";
import { compileContent } from "../mdx";

describe("compileContent", () => {
  it("creates stable unique ids and a table of contents", async () => {
    const result = await compileContent({
      source: "## Same heading\n\nText\n\n## Same heading\n\n### Child",
      slug: "headings",
      tableOfContents: true,
    });

    expect(result.headings).toEqual([
      { id: "same-heading", text: "Same heading", level: 2 },
      { id: "same-heading-1", text: "Same heading", level: 2 },
      { id: "child", text: "Child", level: 3 },
    ]);
  });

  it("resolves citations in first-use order", async () => {
    const result = await compileContent({
      source: "First [@li2024deep], then [@li2023neural; @li2024deep].",
      slug: "citations",
      citations: true,
    });

    expect(result.references.map((reference) => reference.id)).toEqual([
      "li2024deep",
      "li2023neural",
    ]);
  });

  it("fails compilation for an unknown citation", async () => {
    await expect(
      compileContent({
        source: "Missing [@does-not-exist].",
        slug: "citations",
        citations: true,
      })
    ).rejects.toThrow(/does-not-exist/);
  });

  it("does not enable article citations for project content", async () => {
    const result = await compileContent({
      source: "Project text [@does-not-exist].",
      slug: "project",
    });

    expect(result.references).toEqual([]);
  });
});
