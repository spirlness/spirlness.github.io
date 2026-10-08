import { describe, expect, it } from "vitest";
import { extractLocalTargets } from "../content-targets";

describe("extractLocalTargets", () => {
  it("extracts plain local links", () => {
    expect(extractLocalTargets("see [my post](/blog/a/) here")).toEqual({
      links: ["/blog/a/"],
      assets: [],
      relative: [],
    });
  });

  it("extracts links that carry a title segment", () => {
    expect(extractLocalTargets('see [my post](/blog/a/ "the title") here')).toEqual(
      {
        links: ["/blog/a/"],
        assets: [],
        relative: [],
      }
    );
  });

  it("keeps images out of the link list", () => {
    expect(
      extractLocalTargets('![alt](/projects/pic.png "t") and [b](/blog/b/)')
    ).toEqual({
      links: ["/blog/b/"],
      assets: ["/projects/pic.png"],
      relative: [],
    });
  });

  it("checks both sides of a nested image link", () => {
    expect(extractLocalTargets("[![plot](/projects/p.png)](/blog/a/)")).toEqual({
      links: ["/blog/a/"],
      assets: ["/projects/p.png"],
      relative: [],
    });
  });

  it("treats any image destination as an asset, whatever its shape", () => {
    expect(extractLocalTargets("![oops](/blog/a/)")).toEqual({
      links: [],
      assets: ["/blog/a/"],
      relative: [],
    });
  });

  it("ignores external, anchor, and mail destinations", () => {
    const source =
      "[ext](https://example.com) [top](#top) [mail](mailto:x@example.com)";
    expect(extractLocalTargets(source)).toEqual({
      links: [],
      assets: [],
      relative: [],
    });
  });

  it("collects relative destinations for the integrity check", () => {
    const source = [
      "[rel](blog/a/)",
      "![img](figures/x.png)",
      "![dot](./x.png)",
      '<a href="docs/guide/">jsx link</a>',
      '<img src="images/hero.png" alt="x" />',
    ].join("\n\n");
    expect(extractLocalTargets(source)).toEqual({
      links: [],
      assets: [],
      relative: [
        "blog/a/",
        "figures/x.png",
        "./x.png",
        "docs/guide/",
        "images/hero.png",
      ],
    });
  });

  it("rejects URL schemes other than http(s) and mailto", () => {
    expect(() =>
      extractLocalTargets("![x](data:image/png;base64,AAAA)", "test.mdx")
    ).toThrow(/Unsupported URL scheme/);
    expect(() =>
      extractLocalTargets("[call](tel:+15551234)", "test.mdx")
    ).toThrow(/Unsupported URL scheme/);
  });

  it("keeps query strings for the caller to strip", () => {
    expect(extractLocalTargets("[q](/blog/a/?x=1)").links).toEqual([
      "/blog/a/?x=1",
    ]);
  });

  it("ignores links inside inline code and fenced code blocks", () => {
    const source = [
      "`[inline](/blog/nope/)` stays literal",
      "",
      "```text",
      '[fenced](/blog/nope/) and <a href="/blog/raw/">x</a>',
      "```",
    ].join("\n");
    expect(extractLocalTargets(source)).toEqual({
      links: [],
      assets: [],
      relative: [],
    });
  });

  it("resolves reference-style links through their definition", () => {
    const source = "[ref][label]\n\n[label]: /blog/ref-target/";
    expect(extractLocalTargets(source).links).toEqual(["/blog/ref-target/"]);
  });

  it("collects a relative reference-style definition", () => {
    const source = "[ref][label]\n\n[label]: figures/x.png";
    expect(extractLocalTargets(source).relative).toEqual(["figures/x.png"]);
  });

  it("reads literal hrefs and srcs off JSX elements", () => {
    const source = [
      '<a href="/blog/jsx/">jsx</a>',
      '<img src="/projects/jsx.png" alt="x" />',
      "<SideNote>note with [inner](/blog/c/)</SideNote>",
    ].join("\n");
    expect(extractLocalTargets(source)).toEqual({
      links: ["/blog/jsx/", "/blog/c/"],
      assets: ["/projects/jsx.png"],
      relative: [],
    });
  });

  it.each([
    '<a href={"/blog/expr/"}>expr</a>',
    '<img src={evilUrl} alt="x" />',
    "<video poster={evilPoster} />",
    '<source src={evilSrc} />',
  ])("rejects expression-valued URL attribute %j", (source) => {
    expect(() => extractLocalTargets(source, "test.mdx")).toThrow(
      /expression-valued/i
    );
  });

  it("rejects spread JSX attributes in content", () => {
    expect(() => extractLocalTargets("<a {...props}>x</a>", "test.mdx")).toThrow(
      /spread/i
    );
  });

  it("leaves a file-shaped link for the caller to resolve as an asset", () => {
    expect(extractLocalTargets("[file](/feed.xml)").links).toEqual([
      "/feed.xml",
    ]);
  });
});
