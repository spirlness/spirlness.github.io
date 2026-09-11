import { describe, expect, it } from "vitest";
import { checkContentIntegrity, markdownLocalLinks } from "../content-integrity";

describe("markdownLocalLinks", () => {
  it("extracts plain local links", () => {
    expect(markdownLocalLinks("see [my post](/blog/a/) here")).toEqual([
      "/blog/a/",
    ]);
  });

  it("extracts links that carry a title segment", () => {
    expect(
      markdownLocalLinks('see [my post](/blog/a/ "the title") here')
    ).toEqual(["/blog/a/"]);
  });

  it("skips image syntax", () => {
    expect(markdownLocalLinks("![alt](/img/pic.png)")).toEqual([]);
    expect(
      markdownLocalLinks('![alt](/img/pic.png "t") and [b](/blog/b/)')
    ).toEqual(["/blog/b/"]);
  });

  it("skips external and anchor links", () => {
    const source = "[ext](https://example.com) [top](#top) [q](/blog/a/?x=1)";
    expect(markdownLocalLinks(source)).toEqual(["/blog/a/?x=1"]);
  });
});

describe("checkContentIntegrity", () => {
  it("validates and compiles every repository content item", async () => {
    const summary = await checkContentIntegrity();

    expect(summary.posts).toBeGreaterThan(0);
    expect(summary.projects).toBeGreaterThan(0);
    expect(summary.updates).toBeGreaterThan(0);
    expect(summary.publications).toBeGreaterThan(0);
  });
});
