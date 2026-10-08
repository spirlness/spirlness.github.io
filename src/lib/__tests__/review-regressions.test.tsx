import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SmartLink } from "@/components/ui/SmartLink";
import { compileContent } from "../mdx";
import { extractLocalTargets } from "../content-targets";
import { assertTargetsResolvable, buildKnownPaths } from "../content-integrity";
import { formatBibtex, parsePublications } from "../bibtex";

const origin = "review regression";

describe("complete media target validation", () => {
  it("resolves image references as assets and links as routes, including a shared definition", () => {
    const targets = extractLocalTargets("[link][x] ![image][x]\n\n[x]: /blog/");
    expect(targets).toEqual({ links: ["/blog/"], assets: ["/blog/"], relative: [] });
    expect(() => assertTargetsResolvable(targets, origin, buildKnownPaths())).toThrow(/Missing asset/);
  });

  it.each([
    '<picture><source srcSet="/projects/project-1.svg 1x, /missing.png 2x" /><img src="/projects/project-1.svg" /></picture>',
    '<img src="/projects/project-1.svg" srcset="/missing.png 2x" />',
    '<object data="/missing.pdf" />',
  ])("rejects missing media declared by %s", (source) => {
    expect(() => assertTargetsResolvable(extractLocalTargets(source), origin, buildKnownPaths())).toThrow(/Missing asset/);
  });

  it.each([
    '<source srcSet={"/a.png 1x"} />',
    '<object data={"/a.pdf"} />',
  ])("rejects expression-valued media targets: %s", (source) => {
    expect(() => extractLocalTargets(source)).toThrow(/Expression-valued/);
  });

  it("validates every srcSet candidate while retaining commas inside URLs", () => {
    expect(extractLocalTargets('<source srcSet="https://cdn.example.com/w_800,q_auto/a.jpg 1x, /projects/project-1.svg 2x" />').assets).toEqual(["/projects/project-1.svg"]);
    expect(() => extractLocalTargets('<source srcSet="/projects/project-1.svg 1x, mailto:x@example.com 2x" />')).toThrow(/Unsupported/);
  });
});

describe("navigation and media use distinct URL policies", () => {
  it("keeps email links clickable without new-tab instructions", async () => {
    const html = renderToStaticMarkup(<SmartLink href="mailto:a@example.com?subject=Hello">Email</SmartLink>);
    expect(html).toBe('<a href="mailto:a@example.com?subject=Hello">Email</a>');
    const { content } = await compileContent({ source: "[Email](mailto:a@example.com)", slug: "email" });
    expect(renderToStaticMarkup(<>{content}</>)).toContain('href="mailto:a@example.com"');
    expect(extractLocalTargets("[Email](mailto:a@example.com)").relative).toEqual([]);
  });

  it.each(['![x](mailto:a@example.com)', '<img src="mailto:a@example.com" />']) ("rejects mail actions as media: %s", (source) => {
    expect(() => extractLocalTargets(source)).toThrow(/Unsupported/);
  });

  it("rejects protocol-relative URLs during content checking rather than silently dropping them", () => {
    expect(() => extractLocalTargets("[x](//example.com)")).toThrow(/Unsupported/);
  });
});

it("discloses unverified publication metadata in copied citations", () => {
  const [publication] = parsePublications('@article{example, title={Example}, author={Doe, Jane}, year={2024}, verification={unverified}}');
  expect(publication.verification).toBe("unverified");
  expect(formatBibtex(publication)).toContain("note = {Publication details have not been verified}");
});
