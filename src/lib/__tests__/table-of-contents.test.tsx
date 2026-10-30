import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "@/components/mdx/TableOfContents";
import type { TocHeading } from "@/lib/posts";

describe("TableOfContents", () => {
  const headings: TocHeading[] = [
    { id: "introduction", text: "Introduction", level: 2 },
    { id: "background", text: "Background", level: 2 },
    { id: "sub-topic", text: "Sub topic", level: 3 },
  ];

  it("returns null when headings array is empty", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={[]} />);
    expect(html).toBe("");
  });

  it("renders disclosure button and nav landmark with proper ARIA attributes", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={headings} />);
    expect(html).toContain('aria-label="Table of contents"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls=');
    expect(html).toContain("Contents");
    expect(html).toContain('href="#introduction"');
    expect(html).toContain('href="#background"');
    expect(html).toContain('href="#sub-topic"');
  });

  it("applies extra indent padding for level 3 headings", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={headings} />);
    expect(html).toContain("pl-6");
  });
});
