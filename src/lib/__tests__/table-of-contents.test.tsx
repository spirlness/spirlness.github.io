import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TableOfContents } from "@/components/mdx/TableOfContents";

describe("TableOfContents component", () => {
  const sampleHeadings = [
    { id: "introduction", text: "Introduction", level: 2 },
    { id: "methodology", text: "Methodology", level: 2 },
    { id: "sub-step", text: "Sub Step", level: 3 },
  ];

  it("renders table of contents navigation landmark and heading links", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={sampleHeadings} />);
    expect(html).toContain('aria-label="Table of contents"');
    expect(html).toContain('href="#introduction"');
    expect(html).toContain('href="#methodology"');
    expect(html).toContain('href="#sub-step"');
    expect(html).toContain("Introduction");
    expect(html).toContain("Methodology");
    expect(html).toContain("Sub Step");
  });

  it("returns null when headings array is empty", () => {
    const html = renderToStaticMarkup(<TableOfContents headings={[]} />);
    expect(html).toBe("");
  });
});
