import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "../metadata";

describe("buildPageMetadata", () => {
  it("creates page-specific social metadata for an index page", () => {
    const metadata = buildPageMetadata({
      title: "Blog",
      description: "Notes from the research blog.",
      path: "/blog/",
    });

    expect(metadata.openGraph).toMatchObject({
      type: "website",
      title: "Blog",
      description: "Notes from the research blog.",
      url: "https://spirlness.github.io/blog/",
      images: ["https://spirlness.github.io/opengraph-image.png"],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Blog",
      description: "Notes from the research blog.",
      images: ["https://spirlness.github.io/opengraph-image.png"],
    });
  });

  it("marks articles and preserves their published time", () => {
    const metadata = buildPageMetadata({
      title: "A post",
      description: "An article description.",
      path: "/blog/a-post/",
      type: "article",
      publishedTime: "2024-04-26",
      authors: ["Li Fuying"],
    });

    expect(metadata.openGraph).toMatchObject({
      type: "article",
      url: "https://spirlness.github.io/blog/a-post/",
      publishedTime: "2024-04-26",
      authors: ["Li Fuying"],
    });
  });

  it("uses an absolute home-page title and rejects non-site paths", () => {
    const metadata = buildPageMetadata({
      title: "Li Fuying",
      description: "Personal academic website for Li Fuying",
      path: "/",
    });

    expect(metadata.title).toEqual({ absolute: "Li Fuying" });
    expect(() =>
      buildPageMetadata({
        title: "Bad",
        description: "Bad path",
        path: "blog/",
      })
    ).toThrow(/absolute site path/);
  });
});
