import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import ProjectsPage from "../../app/projects/page";
import { ProjectDetailView } from "@/components/projects/ProjectDetailView";

const { project } = vi.hoisted(() => ({ project: {
  id: "video-fixture", title: "Video fixture", description: "Synthetic video", date: "2024-01",
  thumbnail: "/__fixtures__/video.webm", mediaType: "video" as const, tags: [], links: {},
} }));

vi.mock("../projects", async importOriginal => ({
  ...await importOriginal<typeof import("../projects")>(),
  getAllProjects: () => [project],
}));

it("the actual project card omits controls while the detail page enables them", async () => {
  const card = renderToStaticMarkup(await ProjectsPage());
  const detail = renderToStaticMarkup(createElement(ProjectDetailView, { project, content: null }));
  const cardVideo = card.match(/<video\b[^>]*>/)?.[0];
  const detailVideo = detail.match(/<video\b[^>]*>/)?.[0];
  expect(cardVideo).toBeDefined();
  expect(detailVideo).toBeDefined();
  expect(cardVideo).not.toContain("controls");
  expect(detailVideo).toContain('controls=""');
  expect(cardVideo + detailVideo!).not.toMatch(/autoplay/i);
  expect(card).toMatch(/<a\b[^>]*href="\/projects\/video-fixture\/?"[^>]*>[\s\S]*?<video/);
});
