import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostFooter } from "@/components/blog/PostFooter";

describe("PostFooter accessibility and navigation", () => {
  it("renders older and newer post links with proper aria-labels, directional arrows, and focus classes", () => {
    const html = renderToStaticMarkup(
      <PostFooter
        older={{ href: "/blog/first-post/", title: "First Post Title" }}
        newer={{ href: "/blog/third-post/", title: "Third Post Title" }}
        related={[]}
      />
    );

    expect(html).toContain('aria-label="Older post: First Post Title"');
    expect(html).toContain('aria-label="Newer post: Third Post Title"');
    expect(html).toContain("← Older");
    expect(html).toContain("Newer →");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
  });

  it("renders related posts with focus classes", () => {
    const html = renderToStaticMarkup(
      <PostFooter
        related={[
          { href: "/blog/related-post/", title: "Related Post Title", date: "2025-01-01" },
        ]}
      />
    );

    expect(html).toContain("Related Post Title");
    expect(html).toContain("2025-01-01");
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
  });
});
