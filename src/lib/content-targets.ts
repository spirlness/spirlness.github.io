import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

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
const URL_ATTRIBUTES = new Set(["href", "src", "poster"]);

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
  const tree = contentParser.parse(source) as Root;

  const add = (bucket: string[], url: string) => {
    const target = localAbsolute(url);
    if (target) bucket.push(target);
  };

  visit(tree, (node) => {
    if (node.type === "link" || node.type === "definition") {
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
          !URL_ATTRIBUTES.has(attribute.name)
        ) {
          continue;
        }
        if (typeof attribute.value !== "string") {
          throw new Error(
            `Expression-valued URL attribute is not allowed in content (${origin}): <${tagName} ${attribute.name}={...}> — use a literal string`
          );
        }
        add(attribute.name === "href" ? links : assets, attribute.value);
      }
    }
  });

  return { links, assets };
}
