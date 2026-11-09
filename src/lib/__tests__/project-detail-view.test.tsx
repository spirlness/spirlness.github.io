import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import type { ProjectFrontmatter } from "@/lib/projects";

describe("ProjectDetailView accessibility", () => {
  const project: ProjectFrontmatter = {
    id: "test-project",
    title: "Test Project Title",
    description: "A test project description",
    date: "2025-05",
    thumbnail: "/projects/test.png",
    tags: ["physics", "ai"],
    links: {
      project: "https://example.com/project",
    },
  };

  it("renders back-link with aria-hidden icon and focus classes", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectDetailView, { project, content: null })
    );

    // Verify back-link to all projects
    expect(html).toContain('href="/projects"');
    expect(html).toContain("All Projects");
    expect(html).toContain("focus-visible:ring-accent");

    // Verify ArrowLeft icon has aria-hidden="true"
    const backLinkMatch = html.match(/<a\b[^>]*href="\/projects"[^>]*>[\s\S]*?<\/a>/);
    expect(backLinkMatch).toBeDefined();
    expect(backLinkMatch![0]).toContain('aria-hidden="true"');
  });

  it("renders project date inside semantic <time> element with aria-hidden calendar icon", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectDetailView, { project, content: null })
    );

    // Verify semantic <time> element with dateTime attribute
    expect(html).toContain('<time dateTime="2025-05" class="whitespace-nowrap">2025-05</time>');

    // Verify Calendar icon has aria-hidden="true"
    expect(html).toMatch(/<svg[^>]*lucide-calendar[^>]*aria-hidden="true"/);
  });
});
