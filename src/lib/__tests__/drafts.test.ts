import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDraftsVisible } from "../content-drafts";

const roots: string[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

type Mode = "production" | "development" | "test";

interface PostOptions {
  date?: string;
  tags?: string[];
  draft?: boolean;
  body?: string;
}

interface ProjectOptions {
  date?: string;
  draft?: boolean;
}

/**
 * Build a fresh content tree and import fresh reader modules, following the
 * established fixture pattern in post-ranking.test.ts / project-cache.test.ts.
 * Every module-level path and cache is captured after `process.cwd` is mocked.
 */
async function fixture(mode: Mode) {
  vi.resetModules();
  vi.stubEnv("NODE_ENV", mode);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-drafts-"));
  roots.push(root);
  const postsDir = path.join(root, "content", "posts");
  const projectsDir = path.join(root, "content", "projects");
  const publicDir = path.join(root, "public", "projects");
  fs.mkdirSync(postsDir, { recursive: true });
  fs.mkdirSync(projectsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(
    path.join(publicDir, "fixture.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" />'
  );
  // The integrity check parses the bibliography before compiling citations.
  fs.writeFileSync(
    path.join(root, "content", "references.bib"),
    [
      "@article{known-key,",
      "  title = {Known Work},",
      "  author = {Doe, Jane},",
      "  year = {2024}",
      "}",
      "",
    ].join("\n")
  );
  vi.spyOn(process, "cwd").mockReturnValue(root);

  const posts = await import("../posts");
  const projects = await import("../projects");
  const { checkContentIntegrity } = await import("../content-integrity");

  function addPost(slug: string, options: PostOptions = {}) {
    const {
      date = "2026-01-01",
      tags = [],
      draft,
      body = "Post content.",
    } = options;
    const lines = [
      "---",
      `title: ${slug}`,
      `date: '${date}'`,
      `excerpt: Draft fixture ${slug}`,
      `tags: ${JSON.stringify(tags)}`,
      ...(draft === undefined ? [] : [`draft: ${draft}`]),
      "---",
      "",
      body,
      "",
    ];
    fs.writeFileSync(path.join(postsDir, `${slug}.mdx`), lines.join("\n"));
  }

  function addProject(id: string, options: ProjectOptions = {}) {
    const project = {
      id,
      title: id,
      description: `Draft fixture ${id}`,
      date: options.date ?? "2026-01",
      thumbnail: "/projects/fixture.svg",
      ...(options.draft === undefined ? {} : { draft: options.draft }),
    };
    fs.writeFileSync(
      path.join(projectsDir, `${id}.json`),
      JSON.stringify(project)
    );
  }

  return { ...posts, ...projects, checkContentIntegrity, addPost, addProject };
}

describe("isDraftsVisible", () => {
  it("hides drafts only in production", () => {
    expect(isDraftsVisible("production")).toBe(false);
    expect(isDraftsVisible("development")).toBe(true);
    expect(isDraftsVisible("test")).toBe(true);
  });
});

describe("post readers", () => {
  it.each(["development", "test"] as const)(
    "include drafts by default in %s",
    async (mode) => {
      const {
        addPost,
        getAllPostFrontmatter,
        getPostFrontmatter,
        getPostBySlug,
      } = await fixture(mode);
      addPost("published", { date: "2026-02-01" });
      addPost("work-in-progress", { date: "2026-01-01", draft: true });

      expect(getAllPostFrontmatter().map((post) => post.slug)).toEqual([
        "published",
        "work-in-progress",
      ]);
      expect(getPostFrontmatter("work-in-progress").draft).toBe(true);
      await expect(getPostBySlug("work-in-progress")).resolves.toMatchObject({
        frontmatter: { slug: "work-in-progress", draft: true },
      });
    }
  );

  it("exclude drafts from every read when includeDrafts is false", async () => {
    const {
      addPost,
      getAllPostFrontmatter,
      getPostFrontmatter,
      getPostBySlug,
    } = await fixture("development");
    addPost("published", { date: "2026-02-01" });
    addPost("work-in-progress", { date: "2026-01-01", draft: true });

    expect(
      getAllPostFrontmatter({ includeDrafts: false }).map((post) => post.slug)
    ).toEqual(["published"]);
    expect(() =>
      getPostFrontmatter("work-in-progress", { includeDrafts: false })
    ).toThrow(/Post not found: work-in-progress/);
    await expect(
      getPostBySlug("work-in-progress", { includeDrafts: false })
    ).rejects.toThrow(/Post not found: work-in-progress/);
  });

  it("hide drafts in production and still honour an explicit includeDrafts", async () => {
    const {
      addPost,
      getAllPostFrontmatter,
      getPostFrontmatter,
      getPostBySlug,
    } = await fixture("production");
    addPost("published", { date: "2026-02-01" });
    addPost("work-in-progress", { date: "2026-01-01", draft: true });

    expect(getAllPostFrontmatter().map((post) => post.slug)).toEqual([
      "published",
    ]);
    // The production cache holds every parsed post; visibility is per read.
    expect(
      getAllPostFrontmatter({ includeDrafts: true }).map((post) => post.slug)
    ).toEqual(["published", "work-in-progress"]);
    expect(getAllPostFrontmatter().map((post) => post.slug)).toEqual([
      "published",
    ]);

    expect(() => getPostFrontmatter("work-in-progress")).toThrow(
      /Post not found/
    );
    await expect(getPostBySlug("work-in-progress")).rejects.toThrow(
      /Post not found/
    );
    expect(
      getPostFrontmatter("work-in-progress", { includeDrafts: true }).draft
    ).toBe(true);
  });
});

describe("project readers", () => {
  it.each(["development", "test"] as const)(
    "include drafts by default in %s",
    async (mode) => {
      const {
        addProject,
        getAllProjects,
        getProjectById,
        getProjectDetailById,
      } = await fixture(mode);
      addProject("published", { date: "2026-02" });
      addProject("work-in-progress", { date: "2026-01", draft: true });

      expect(getAllProjects().map((project) => project.id)).toEqual([
        "published",
        "work-in-progress",
      ]);
      expect(getProjectById("work-in-progress").draft).toBe(true);
      await expect(
        getProjectDetailById("work-in-progress")
      ).resolves.toMatchObject({ project: { draft: true } });
    }
  );

  it("exclude drafts from every read when includeDrafts is false", async () => {
    const {
      addProject,
      getAllProjects,
      getProjectById,
      getProjectDetailById,
    } = await fixture("development");
    addProject("published", { date: "2026-02" });
    addProject("work-in-progress", { date: "2026-01", draft: true });

    expect(
      getAllProjects({ includeDrafts: false }).map((project) => project.id)
    ).toEqual(["published"]);
    expect(() =>
      getProjectById("work-in-progress", { includeDrafts: false })
    ).toThrow(/Project not found: work-in-progress/);
    await expect(
      getProjectDetailById("work-in-progress", { includeDrafts: false })
    ).rejects.toThrow(/Project not found: work-in-progress/);
  });

  it("hide drafts in production and still honour an explicit includeDrafts", async () => {
    const {
      addProject,
      getAllProjects,
      getProjectById,
      getProjectDetailById,
    } = await fixture("production");
    addProject("published", { date: "2026-02" });
    addProject("work-in-progress", { date: "2026-01", draft: true });

    expect(getAllProjects().map((project) => project.id)).toEqual([
      "published",
    ]);
    expect(
      getAllProjects({ includeDrafts: true }).map((project) => project.id)
    ).toEqual(["published", "work-in-progress"]);
    expect(getAllProjects().map((project) => project.id)).toEqual([
      "published",
    ]);

    expect(() => getProjectById("work-in-progress")).toThrow(
      /Project not found: work-in-progress/
    );
    await expect(getProjectDetailById("work-in-progress")).rejects.toThrow(
      /Project not found/
    );
    expect(
      getProjectById("work-in-progress", { includeDrafts: true }).draft
    ).toBe(true);
  });
});

describe("derived post helpers", () => {
  it("see only visible posts when given the default list", async () => {
    const {
      addPost,
      getAllTags,
      getPostsByTag,
      getAdjacentPosts,
      getRelatedPosts,
    } = await fixture("production");
    addPost("newest", { date: "2026-03-01", tags: ["shared"] });
    addPost("hidden-draft", {
      date: "2026-02-01",
      tags: ["shared", "draft-only"],
      draft: true,
    });
    addPost("oldest", { date: "2026-01-01", tags: ["shared"] });

    expect(getAllTags()).toEqual([{ tag: "shared", count: 2 }]);
    expect(getPostsByTag("shared").map((post) => post.slug)).toEqual([
      "newest",
      "oldest",
    ]);
    expect(getPostsByTag("draft-only")).toEqual([]);

    expect(getAdjacentPosts("newest").newer).toBeUndefined();
    expect(getAdjacentPosts("newest").older?.slug).toBe("oldest");
    expect(getAdjacentPosts("hidden-draft")).toEqual({});

    expect(getRelatedPosts("newest").map((post) => post.slug)).toEqual([
      "oldest",
    ]);
  });
});

describe("content integrity", () => {
  it("validates a draft's schema even when a production read would hide it", async () => {
    const { addPost, getAllPostFrontmatter } = await fixture("production");
    addPost("bad-draft", { date: "2026-02-30", draft: true });

    expect(() => getAllPostFrontmatter()).toThrow(/valid date/);
  });

  it("accepts a fully valid draft with citations and media", async () => {
    const { addPost, addProject, checkContentIntegrity } = await fixture(
      "test"
    );
    addPost("draft-post", {
      draft: true,
      body: "Cite [@known-key].\n\n![fixture](/projects/fixture.svg)",
    });
    addProject("draft-project", { draft: true });

    const summary = await checkContentIntegrity();
    expect(summary.posts).toBe(1);
    expect(summary.projects).toBe(1);
  });

  it.each([
    [
      "an unknown citation",
      "See [@missing-key].",
      /Citation key "missing-key" not found/,
    ],
    [
      "missing media",
      "![plot](/posts/draft-plot.png)",
      /Missing asset under public\//,
    ],
  ])("still fails integrity for a draft with %s", async (_label, body, message) => {
    const { addPost, checkContentIntegrity } = await fixture("test");
    addPost("draft-post", { draft: true, body });

    await expect(checkContentIntegrity()).rejects.toThrow(message);
  });

  it("rejects a published post linking to a draft route", async () => {
    const { addPost, checkContentIntegrity } = await fixture("test");
    addPost("hidden", { date: "2026-01-01", draft: true });
    addPost("published", {
      date: "2026-02-01",
      body: "See [the draft](/blog/hidden/).",
    });

    await expect(checkContentIntegrity()).rejects.toThrow(
      /Unknown internal link: \/blog\/hidden\//
    );
  });

  it("allows a draft to link to another draft's route", async () => {
    const { addPost, checkContentIntegrity } = await fixture("test");
    addPost("hidden", { date: "2026-01-01", draft: true });
    addPost("hidden-two", {
      date: "2026-01-02",
      draft: true,
      body: "See [the other draft](/blog/hidden/).",
    });

    await expect(checkContentIntegrity()).resolves.toMatchObject({ posts: 2 });
  });
});
