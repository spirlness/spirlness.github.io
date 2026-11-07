import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TagPage from "@/app/blog/tag/[tag]/page";

describe("TagPage navigation and accessibility", () => {
  it("renders 'All Posts' back-link and post card affordances", async () => {
    const pageJsx = await TagPage({
      params: Promise.resolve({ tag: "physics" }),
    });
    const html = renderToStaticMarkup(pageJsx);

    // Verify back-link to all posts
    expect(html).toContain('href="/blog"');
    expect(html).toContain("All Posts");
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("focus-visible:ring-accent");

    // Verify post card tags and read more
    expect(html).toContain("READ MORE");
    expect(html).toContain("#physics");
  });
});
