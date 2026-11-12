import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";
import type { ProjectFrontmatter } from "@/lib/projects";

function svgTags(html: string): string[] {
  return html.match(/<svg\b[^>]*>/g) ?? [];
}

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

  function render() {
    return renderToStaticMarkup(
      createElement(ProjectDetailView, { project, content: null })
    );
  }

  it("renders a text-named back link whose arrow icon is decorative", () => {
    const html = render();
    const backLink = html.match(/<a\b[^>]*href="\/projects\/?"[^>]*>[\s\S]*?<\/a>/);

    expect(backLink).not.toBeNull();
    expect(backLink![0]).toContain("All Projects");
    expect(backLink![0]).toContain("focus-visible:ring-accent");

    const arrow = svgTags(backLink![0]).find((tag) => tag.includes("lucide-arrow-left"));
    expect(arrow).toBeDefined();
    expect(arrow).toContain('aria-hidden="true"');
  });

  it("renders the project date as a time element with a machine-readable value", () => {
    const html = render();
    const time = html.match(/<time\b[^>]*\bdatetime="2025-05"[^>]*>2025-05<\/time>/i);

    expect(time).not.toBeNull();

    const calendar = svgTags(html).find((tag) => tag.includes("lucide-calendar"));
    expect(calendar).toBeDefined();
    expect(calendar).toContain('aria-hidden="true"');
  });
});
