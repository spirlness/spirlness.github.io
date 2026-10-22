import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProjectsPage from "@/app/projects/page";
import {
  getAllProjects,
  projectHref,
} from "../projects";

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

describe("ProjectsPage", () => {
  it("renders project cards with focus-visible ring styles for accessibility", async () => {
    const pageElement = await ProjectsPage();
    const html = renderToStaticMarkup(pageElement);
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-accent");
    expect(html).toContain("focus-visible:ring-offset-4");
  });
});
