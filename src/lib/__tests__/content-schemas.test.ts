import { describe, expect, it } from "vitest";
import {
  parsePostFrontmatter,
  parseProject,
  parseSiteProfile,
  parseUpdate,
} from "../content-schemas";

describe("content schemas", () => {
  it("normalizes post tags and derives the slug from the filename", () => {
    expect(
      parsePostFrontmatter(
        {
          title: "  A post  ",
          date: "2026-02-28",
          excerpt: "  Summary  ",
          tags: ["physics", "physics", " ml "],
        },
        "my-post"
      )
    ).toEqual({
      title: "A post",
      date: "2026-02-28",
      excerpt: "Summary",
      slug: "my-post",
      tags: ["physics", "ml"],
    });
  });

  it("rejects impossible post dates", () => {
    expect(() =>
      parsePostFrontmatter(
        { title: "Post", date: "2026-02-30", excerpt: "Summary" },
        "post"
      )
    ).toThrow(/date/i);
  });

  it("requires a project id to match its filename", () => {
    expect(() =>
      parseProject(
        {
          id: "different-id",
          title: "Project",
          description: "Description",
          date: "2026-02",
          thumbnail: "/projects/project.svg",
        },
        "project",
        "project.json"
      )
    ).toThrow(/filename/i);
  });

  it("rejects unsafe project links", () => {
    expect(() =>
      parseProject(
        {
          id: "project",
          title: "Project",
          description: "Description",
          date: "2026-02",
          thumbnail: "/projects/project.svg",
          links: { code: "javascript:alert(1)" },
        },
        "project",
        "project.json"
      )
    ).toThrow(/link|url/i);
  });

  it("validates update icons and local links", () => {
    expect(
      parseUpdate(
        {
          date: "2026-09",
          content: "New result",
          icon: "publication",
          link: "/publications/",
        },
        "update.json"
      )
    ).toMatchObject({ icon: "publication", link: "/publications/" });

    expect(() =>
      parseUpdate(
        { date: "2026-09", content: "New result", icon: "unknown" },
        "update.json"
      )
    ).toThrow(/icon/i);
  });

  it("validates the central site profile", () => {
    expect(() =>
      parseSiteProfile({
        name: "Researcher",
        navTitle: "RESEARCHER",
        title: "Researcher",
        description: "Profile",
        url: "not-a-url",
        authorInitial: "R",
        authorRole: "Researcher",
        heroTitle: ["Hello", "World"],
        researchSummary: "Summary",
        currentWork: "Work",
        contactIntro: "Contact",
        links: [],
        navLinks: [],
        publicationAuthorNames: [],
        publicationsIntro: "Publications",
        focusAreas: [],
      })
    ).toThrow(/url/i);
  });
});
