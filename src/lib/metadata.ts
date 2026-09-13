import type { Metadata } from "next";
import { siteProfile } from "@/content/site";

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  /** ISO locale of the page content; drives `og:locale` (default `en_US`). */
  locale?: string;
}

function absoluteSiteUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error(`Expected an absolute site path, received "${path}"`);
  }
  return `${siteProfile.url}${path}`;
}

/** Build consistent, page-specific metadata for every public static route. */
export function buildPageMetadata({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  modifiedTime,
  authors,
  locale = "en_US",
}: PageMetadataOptions): Metadata {
  const url = absoluteSiteUrl(path);
  const image = `${siteProfile.url}/opengraph-image.png`;
  const commonOpenGraph = {
    url,
    title,
    description,
    locale,
    siteName: siteProfile.title,
    images: [image],
  };
  const openGraph =
    type === "article"
      ? {
          ...commonOpenGraph,
          type: "article" as const,
          ...(publishedTime ? { publishedTime } : {}),
          ...(modifiedTime ? { modifiedTime } : {}),
          ...(authors?.length ? { authors } : {}),
        }
      : { ...commonOpenGraph, type: "website" as const };

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    // Without a canonical, crawlers treat UTM-tagged URLs as separate pages.
    alternates: { canonical: url },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
