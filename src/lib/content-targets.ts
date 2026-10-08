import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { isSafeHref } from "./links";
import { isSafeMediaUrl, parseSrcSet } from "./media-srcset";

/**
 * Local destinations declared by an MDX body, split by what they must resolve
 * to. Parsing rather than text-matching is what keeps this honest: fenced and
 * inline code produce no targets, `![img]()` is never mistaken for `[link]()`,
 * and nested and reference-style links resolve the way the export renders them.
 *
 * The parser stack mirrors the one the site compiles posts with (`src/lib/mdx.ts`),
 * so a link found here is a link the export will render.
 */
const contentParser = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkMdx);

/** JSX attributes carrying a destination the browser will follow or fetch. */
const URL_ATTRIBUTES = new Set(["href", "src", "poster", "srcSet", "srcset"]);

/** A `scheme:` prefix, e.g. `https:`, `mailto:`, `data:`. */
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:/i;

export interface LocalTargets {
  /**
   * Site-absolute destinations reached as links. Each must resolve to a known
   * route, or — when it names a file — to a file under `public/`. The caller
   * tests routes first because `/feed.xml` and friends are generated at build
   * time and exist in the export but not in `public/`.
   */
  links: string[];
  /** Site-absolute destinations named by an image or JSX `src`/`poster`. */
  assets: string[];
  /**
   * Destinations the export cannot resolve: paths relative to the current
   * page (`figures/x.png`, `./x.png`, `blog/a/`). `localAbsolute()` drops
   * them and the media override renders null, so the caller must reject them
   * instead of letting a post ship with a missing image.
   */
  relative: string[];
}

/** Site-absolute only: `//host/x` is external, `#anchor` and relative are out of scope. */
export function localAbsolute(url: string): string | undefined {
  return url.startsWith("/") && !url.startsWith("//") ? url : undefined;
}

export function pathnameOf(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

/** Matches the "looks like a file, not a page" rule `normalizeInternalHref()` uses. */
export function isAssetPath(pathname: string): boolean {
  return /\/[^/]+\.[^/]+$/.test(pathname);
}

/** Collect every local target an MDX body declares. */
export function extractLocalTargets(
  source: string,
  origin = "mdx"
): LocalTargets {
  const links: string[] = [];
  const assets: string[] = [];
  const relative: string[] = [];
  const tree = contentParser.parse(source) as Root;

  const add = (bucket: string[], url: string) => {
    url = url.trim();
    const safe = bucket === links ? isSafeHref(url) : isSafeMediaUrl(url);
    if (!safe && (URL_SCHEME.test(url) || url.startsWith("//") || url.startsWith("#"))) {
      throw new Error(`Unsupported URL scheme or target in content (${origin}): "${url}"`);
    }
    const target = localAbsolute(url);
    if (target) {
      bucket.push(target);
      return;
    }
    if (!url || safe) return;
    relative.push(url);
  };

  const definitions = new Map<string, string>();
  visit(tree, "definition", (node) => {
    const key = node.identifier.toUpperCase();
    if (!definitions.has(key)) definitions.set(key, node.url);
  });

  visit(tree, (node) => {
    if (node.type === "definition") return;
    if (node.type === "linkReference" || node.type === "imageReference") {
      const url = definitions.get(node.identifier.toUpperCase());
      if (url) add(node.type === "imageReference" ? assets : links, url);
      return;
    }
    if (node.type === "link") {
      add(links, node.url);
      return;
    }
    if (node.type === "image") {
      // An image is an asset whatever its path looks like — `![x](/blog/a/)`
      // is a broken image, not a link to that post.
      add(assets, node.url);
      return;
    }
    if (
      node.type === "mdxJsxFlowElement" ||
      node.type === "mdxJsxTextElement"
    ) {
      const tagName =
        typeof node.name === "string" ? node.name : "JSX element";
      for (const attribute of node.attributes ?? []) {
        if (attribute.type === "mdxJsxExpressionAttribute") {
          throw new Error(
            `Spread JSX attribute is not allowed in content (${origin}): <${tagName} {...}>`
          );
        }
        if (
          attribute.type !== "mdxJsxAttribute" ||
          !(URL_ATTRIBUTES.has(attribute.name) || (tagName === "object" && attribute.name === "data"))
        ) {
          continue;
        }
        if (typeof attribute.value !== "string") {
          throw new Error(
            `Expression-valued URL attribute is not allowed in content (${origin}): <${tagName} ${attribute.name}={...}> — use a literal string`
          );
        }
        if (attribute.name === "srcSet" || attribute.name === "srcset") {
          const urls = parseSrcSet(attribute.value);
          if (!urls) throw new Error(`Invalid srcSet in content (${origin}): "${attribute.value}"`);
          for (const url of urls) add(assets, url);
        } else {
          add(attribute.name === "href" ? links : assets, attribute.value);
        }
      }
    }
  });

  return { links, assets, relative };
}
