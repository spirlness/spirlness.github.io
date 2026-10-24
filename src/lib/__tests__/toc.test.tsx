import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "@/components/mdx/TableOfContents";

describe("TableOfContents navigation", () => {
  it("renders heading links for navigation", () => {
    const headings = [
      { id: "intro", level: 2 as const, text: "Introduction" },
      { id: "details", level: 3 as const, text: "Detailed Analysis" },
    ];
    const html = renderToStaticMarkup(<TableOfContents headings={headings} />);
    expect(html).toContain('href="#intro"');
    expect(html).toContain('href="#details"');
    expect(html).toContain('aria-label="Table of contents"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("returns null when no headings are provided", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={[]} />);
    expect(html).toBe("");
  });
});
