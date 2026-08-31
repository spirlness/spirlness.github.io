import { describe, it, expect } from "vitest";
import {
  getAllProjects,
  normalizeProjectLastModified,
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

describe("normalizeProjectLastModified", () => {
  it("accepts a complete calendar date and leaves an absent value undefined", () => {
    expect(normalizeProjectLastModified("2024-02-29", "test-project")).toBe("2024-02-29");
    expect(normalizeProjectLastModified(undefined, "test-project")).toBeUndefined();
  });

  it("rejects incomplete and impossible dates", () => {
    expect(() => normalizeProjectLastModified("2024-06", "test-project")).toThrow(/YYYY-MM-DD/);
    expect(() => normalizeProjectLastModified("2024-02-30", "test-project")).toThrow(/valid calendar date/);
    expect(() => normalizeProjectLastModified(20240601, "test-project")).toThrow(/YYYY-MM-DD/);
  });
});
