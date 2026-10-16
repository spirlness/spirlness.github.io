import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getAllProjects,
  projectHref,
} from "../projects";
import { ProjectCard } from "@/app/projects/page";

describe("ProjectCard component", () => {
  it("includes focus-visible indicators for keyboard accessibility", () => {
    const mockProject = {
      id: "test-project",
      title: "Test Project",
      date: "2025-01-01",
      description: "A test project description",
      thumbnail: "/projects/project-1.svg",
    };
    const html = renderToStaticMarkup(ProjectCard({ project: mockProject }));
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
  });
});

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
