import { describe, expect, it } from "vitest";
import { extractLocalTargets } from "../content-targets";

describe("extractLocalTargets", () => {
  it("extracts plain local links", () => {
    expect(extractLocalTargets("see [my post](/blog/a/) here")).toEqual({
      links: ["/blog/a/"],
      assets: [],
    });
  });

  it("extracts links that carry a title segment", () => {
    expect(extractLocalTargets('see [my post](/blog/a/ "the title") here')).toEqual(
      {
        links: ["/blog/a/"],
        assets: [],
      }
    );
  });

  it("keeps images out of the link list", () => {
    expect(
      extractLocalTargets('![alt](/projects/pic.png "t") and [b](/blog/b/)')
    ).toEqual({
      links: ["/blog/b/"],
      assets: ["/projects/pic.png"],
    });
  });

  it("checks both sides of a nested image link", () => {
    expect(extractLocalTargets("[![plot](/projects/p.png)](/blog/a/)")).toEqual({
      links: ["/blog/a/"],
      assets: ["/projects/p.png"],
    });
  });

  it("treats any image destination as an asset, whatever its shape", () => {
    expect(extractLocalTargets("![oops](/blog/a/)")).toEqual({
      links: [],
      assets: ["/blog/a/"],
    });
  });

  it("ignores external, anchor, and relative destinations", () => {
    const source =
      "[ext](https://example.com) [top](#top) [rel](blog/a/) [proto](//cdn.example.com/x)";
    expect(extractLocalTargets(source)).toEqual({ links: [], assets: [] });
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
    expect(extractLocalTargets(source)).toEqual({ links: [], assets: [] });
  });

  it("resolves reference-style links through their definition", () => {
    const source = "[ref][label]\n\n[label]: /blog/ref-target/";
    expect(extractLocalTargets(source).links).toEqual(["/blog/ref-target/"]);
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
