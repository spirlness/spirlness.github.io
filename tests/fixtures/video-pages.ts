import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import type { Page } from "@playwright/test";

const title = "Video fixture";
const source = "/__fixtures__/video.webm";

function loadProjectMedia() {
  // Playwright's JSX transform produces component-test descriptors. Compile the
  // real component with React's JSX runtime for this Node-rendered HTML fixture.
  const code = ts.transpileModule(readFileSync("src/components/projects/ProjectMedia.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  mkdirSync("test-results", { recursive: true });
  const directory = mkdtempSync(path.resolve("test-results/video-render-"));
  const file = path.join(directory, "ProjectMedia.cjs");
  const requireModule = createRequire(path.resolve("package.json"));
  try {
    writeFileSync(file, code);
    return (requireModule(file) as typeof import("../../src/components/projects/ProjectMedia")).ProjectMedia;
  } finally {
    delete requireModule.cache[file];
    rmSync(directory, { recursive: true, force: true });
  }
}

/** Test-only documents render the production media component; nothing enters out/. */
export async function installVideoFixture(page: Page) {
  const ProjectMedia = loadProjectMedia();
  const video = Buffer.from(readFileSync("tests/fixtures/video.webm.base64", "utf8"), "base64");
  await page.route("**/__fixtures__/video.webm", route => route.fulfill({ contentType: "video/webm", body: video }));
  for (const interactive of [false, true]) {
    const pathname = interactive ? "/__fixtures__/video-detail/" : "/__fixtures__/video-card/";
    const media = createElement(ProjectMedia, { title, src: source, mediaType: "video", interactive, sizes: "160px" });
    const content = interactive ? media : createElement("a", { href: "/__fixtures__/video-detail/" }, media, title);
    const html = `<!doctype html><html lang="en"><head><title>${title}</title></head><body><main>${renderToStaticMarkup(content)}</main></body></html>`;
    await page.route(`**${pathname}`, route => route.fulfill({ contentType: "text/html", body: html }));
  }
}
