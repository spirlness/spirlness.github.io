import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "@/components/mdx/TableOfContents";
import type { TocHeading } from "@/lib/posts";

describe("TableOfContents accessibility and markup", () => {
  const headings: TocHeading[] = [
    { id: "intro", text: "Introduction", level: 2 },
    { id: "methods", text: "Methods", level: 2 },
    { id: "results", text: "Results", level: 3 },
  ];

  it("returns null when headings array is empty", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={[]} />);
    expect(html).toBe("");
  });

  it("renders mobile disclosure button with aria-expanded and aria-label", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={headings} />);
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Expand table of contents"');
    expect(html).toContain('aria-controls=');
    expect(html).toContain("<span>Contents</span>");
  });

  it("renders heading links with correct href and attributes", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={headings} />);
    expect(html).toContain('href="#intro"');
    expect(html).toContain('href="#methods"');
    expect(html).toContain('href="#results"');
    expect(html).toContain('Introduction');
    expect(html).toContain('Methods');
    expect(html).toContain('Results');
  });
});
