import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { PostCard } from "@/components/blog/PostCard";

describe("PostCard keyboard focus styles", () => {
  it("renders title with group-focus-visible:text-accent class", () => {
    const html = renderToStaticMarkup(
      createElement(PostCard, {
        post: {
          slug: "test-post",
          title: "Test Post Title",
          date: "2025-01-01",
          excerpt: "A test excerpt.",
          tags: ["test"],
        },
        href: "/blog/test-post/",
      })
    );
    expect(html).toContain("group-focus-visible:text-accent");
  });

  it("renders read more indicator with group-focus-visible:opacity-100 class when showReadMore is true", () => {
    const html = renderToStaticMarkup(
      createElement(PostCard, {
        post: {
          slug: "test-post",
          title: "Test Post Title",
          date: "2025-01-01",
          excerpt: "A test excerpt.",
          tags: ["test"],
        },
        href: "/blog/test-post/",
        showReadMore: true,
      })
    );
    expect(html).toContain("group-focus-visible:opacity-100");
  });
});
