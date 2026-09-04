import { describe, it, expect } from "vitest";
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
