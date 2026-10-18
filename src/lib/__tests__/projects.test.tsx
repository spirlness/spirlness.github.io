import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import {
  getAllProjects,
  projectHref,
} from "../projects";
import { ProjectCard } from "@/app/projects/page";

describe("projectHref", () => {
  it("normalizes slashes and always trailing-slashes", () => {
    expect(projectHref("my-project")).toBe("/projects/my-project/");
    expect(projectHref("/my-project/")).toBe("/projects/my-project/");
    expect(projectHref("//my-project//")).toBe("/projects/my-project/");
  });
});

describe("getAllProjects", () => {
  it("returns projects whose id matches the JSON filename", () => {
    const projects = getAllProjects();
    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project.id).toMatch(/^[A-Za-z0-9-]+$/);
      expect(project.title).toBeTruthy();
    }
  });
});

describe("ProjectCard", () => {
  it("renders with focus-visible ring styles and aria-hidden on calendar icon", () => {
    const sampleProject = {
      id: "test-project",
      title: "Test Project Title",
      description: "Test description for project.",
      date: "2025-01-01",
      thumbnail: "/projects/test-project/thumb.png",
      tags: ["physics", "simulation"],
    };
    const html = renderToStaticMarkup(<ProjectCard project={sampleProject} />);
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
    expect(html).toContain("group-focus-visible:text-accent");
    expect(html).toContain('aria-hidden="true"');
  });
});
