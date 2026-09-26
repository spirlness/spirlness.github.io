import { describe, expect, it } from "vitest";
import { extractLocalTargets } from "../content-targets";
import {
  assertAssetResolves,
  assertTargetsResolvable,
  buildKnownPaths,
  checkContentIntegrity,
} from "../content-integrity";

describe("checkContentIntegrity", () => {
  it("validates and compiles every repository content item", async () => {
    const summary = await checkContentIntegrity();

    expect(summary.posts).toBeGreaterThan(0);
    expect(summary.projects).toBeGreaterThan(0);
    expect(summary.updates).toBeGreaterThan(0);
    expect(summary.publications).toBeGreaterThan(0);
  });

  it("knows the exported metadata files that do not live under public/", () => {
    const knownPaths = buildKnownPaths();

    expect(knownPaths.has("/opengraph-image.png")).toBe(true);
    expect(knownPaths.has("/favicon.ico")).toBe(true);
  });
});

describe("assertTargetsResolvable", () => {
  const origin = 'post "validation-fixture"';

  it("rejects a relative image destination with the fix spelled out", () => {
    const targets = extractLocalTargets("![x](figures/x.png)", origin);

    expect(targets.relative).toEqual(["figures/x.png"]);
    expect(() =>
      assertTargetsResolvable(targets, origin, buildKnownPaths())
    ).toThrow(
      'Relative asset path "figures/x.png" is not supported — use a site-absolute path such as "/figures/x.png" (post "validation-fixture")'
    );
  });

  it("rejects a relative link destination too", () => {
    const targets = extractLocalTargets("[rel](blog/a/)", origin);

    expect(() =>
      assertTargetsResolvable(targets, origin, buildKnownPaths())
    ).toThrow(/Relative asset path "blog\/a\/" is not supported/);
  });

  it("still resolves a site-absolute image that exists under public/", () => {
    const targets = extractLocalTargets(
      "![diagram](/projects/project-1.svg)",
      origin
    );

    expect(targets).toEqual({
      links: [],
      assets: ["/projects/project-1.svg"],
      relative: [],
    });
    expect(() =>
      assertTargetsResolvable(targets, origin, buildKnownPaths())
    ).not.toThrow();
  });

  it("passes external images and anchor links", () => {
    const targets = extractLocalTargets(
      "![remote](https://example.com/pic.png) [top](#section)",
      origin
    );

    expect(targets.relative).toEqual([]);
    expect(() =>
      assertTargetsResolvable(targets, origin, buildKnownPaths())
    ).not.toThrow();
  });

  it("passes links and image thumbnails pointing at exported metadata files", () => {
    const targets = extractLocalTargets(
      [
        "[og](/opengraph-image.png) [icon](/favicon.ico)",
        "![og card](/opengraph-image.png)",
        "![favicon](/favicon.ico)",
      ].join("\n\n"),
      origin
    );

    expect(targets.relative).toEqual([]);
    expect(() =>
      assertTargetsResolvable(targets, origin, buildKnownPaths())
    ).not.toThrow();
  });
});

describe("assertAssetResolves", () => {
  it("accepts an exported metadata file as a thumbnail target", () => {
    expect(() =>
      assertAssetResolves("/opengraph-image.png", "test thumbnail")
    ).not.toThrow();
    expect(() =>
      assertAssetResolves("/favicon.ico", "test thumbnail")
    ).not.toThrow();
  });

  it("still rejects an image the export does not emit", () => {
    expect(() =>
      assertAssetResolves("/nope/missing.png", "test thumbnail")
    ).toThrow(/Missing asset under public\//);
  });
});
