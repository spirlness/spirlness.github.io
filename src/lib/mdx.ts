import type { Root as HastRoot, Element as HastElement } from "hast";
import type { Root as MdastRoot, Parent, Text, PhrasingContent } from "mdast";
import { toText } from "hast-util-to-text";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { getAllPublications, type Publication } from "./bibtex";
import { CITATION_KEY_CHARS } from "./content-id";
import { assertSafeMathUrls, isTrustedMathUrl } from "./math-safety";

const citationPattern = new RegExp(
  `\\[@([${CITATION_KEY_CHARS}]+(?:;\\s*@[${CITATION_KEY_CHARS}]+)*)\\]`,
  "g"
);

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

const MEDIA_COMPONENT_NAMES = new Map([
  ["img", "MdxImage"],
  ["video", "MdxVideo"],
  ["source", "MdxSource"],
  ["iframe", "MdxIframe"],
  ["object", "MdxObject"],
  ["embed", "MdxEmbed"],
  ["audio", "MdxAudio"],
]);

function mapExplicitMediaPlugin() {
  return (tree: MdastRoot) => {
    visit(tree, (node) => {
      if (node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") {
        node.name = MEDIA_COMPONENT_NAMES.get(node.name ?? "") ?? node.name;
      }
    });
  };
}

interface CompileContentOptions {
  source: string;
  slug: string;
  citations?: boolean;
  tableOfContents?: boolean;
}

/** The page owns h1; reject accidental extra titles instead of only restyling them. */
function bodyHeadingGuardPlugin(slug: string) {
  return (tree: MdastRoot) => {
    visit(tree, (node) => {
      if ((node.type === "heading" && node.depth === 1) ||
          ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && node.name === "h1")) {
        throw new Error(`Body headings must start at ##, not h1 (content: ${slug}); the page provides its title.`);
      }
    });
  };
}

function citationPlugin(references: Publication[], slug: string) {
  const publications = new Map(
    getAllPublications().map((publication) => [publication.id, publication])
  );

  return (tree: MdastRoot) => {
    // Map existing references to an index lookup for O(1) key lookups instead of O(N) array scans
    const refIndexMap = new Map<string, number>();
    references.forEach((pub, idx) => refIndexMap.set(pub.id, idx));

    visit(tree, "text", (node: Text, index, parent: Parent | undefined) => {
      if (index === undefined || !parent || !citationPattern.test(node.value)) {
        citationPattern.lastIndex = 0;
        return;
      }

      citationPattern.lastIndex = 0;
      const children: PhrasingContent[] = [];
      let cursor = 0;

      for (const match of node.value.matchAll(citationPattern)) {
        const matchIndex = match.index ?? 0;
        if (matchIndex > cursor) {
          children.push({ type: "text", value: node.value.slice(cursor, matchIndex) });
        }

        const keys = match[1]
          .split(/;\s*/)
          .map((key) => key.replace(/^@/, "").trim());

        for (const key of keys) {
          // O(1) hash lookup instead of Array.prototype.findIndex (O(N) search per key)
          let referenceIndex = refIndexMap.get(key);
          if (referenceIndex === undefined) {
            const publication = publications.get(key);
            if (!publication) {
              throw new Error(
                `Citation key "${key}" not found in content/references.bib (post: ${slug})`
              );
            }
            references.push(publication);
            referenceIndex = references.length - 1;
            refIndexMap.set(key, referenceIndex);
          }

          const number = referenceIndex + 1;
          children.push({
            type: "link",
            url: `#ref-${number}`,
            children: [{ type: "text", value: `[${number}]` }],
            data: {
              hProperties: {
                className: [
                  "text-accent",
                  "text-xs",
                  "align-super",
                  "font-medium",
                  "no-underline",
                  "hover:underline",
                ],
              },
            },
          });
        }
        cursor = matchIndex + match[0].length;
      }

      if (cursor < node.value.length) {
        children.push({ type: "text", value: node.value.slice(cursor) });
      }
      parent.children.splice(index, 1, ...children);
      return index + children.length;
    });
  };
}

function mathHrefGuardPlugin(slug: string) {
  const guard = (node: { value?: unknown }) => {
    if (typeof node.value === "string") {
      assertSafeMathUrls(node.value, `post "${slug}"`);
    }
  };
  return (tree: MdastRoot) => {
    visit(tree, "inlineMath", guard as never);
    visit(tree, "math", guard as never);
  };
}

/**
 * Rehype plugin factory that records `h2`/`h3` headings from the compiled MDX
 * onto the headings array passed in. The stable `id` is assigned by
 * `rehype-slug`, which runs first; this plugin only records that existing `id`
 * (plus level and text) so the floating ToC can anchor and scrollspy. The
 * plugin mutates the array in place; compileMDX runs rehype synchronously, so
 * the array is populated when it resolves.
 */
function collectHeadingsPlugin(headings: TocHeading[]) {
  return (tree: HastRoot) => {
    visit(tree, "element", (node: HastElement) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = typeof node.properties.id === "string" ? node.properties.id : "";
      headings.push({
        id,
        text: toText(node).trim(),
        level: node.tagName === "h2" ? 2 : 3,
      });
    });
  };
}

export async function compileContent({
  source,
  slug,
  citations = false,
  tableOfContents = false,
}: CompileContentOptions): Promise<{
  content: React.ReactNode;
  references: Publication[];
  headings: TocHeading[];
}> {
  const references: Publication[] = [];
  const headings: TocHeading[] = [];

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [
          [bodyHeadingGuardPlugin, slug] as never,
          mapExplicitMediaPlugin,
          remarkMath,
          // GFM (tables, strikethrough, autolinks) — without this, markdown
          // tables in posts render as literal pipe-text paragraphs.
          remarkGfm,
          // Fail closed on dangerous \href{}/\url{} schemes before KaTeX
          // ever sees them. Must run after remarkMath so the
          // inlineMath/math nodes exist.
          [mathHrefGuardPlugin, slug] as never,
          ...(citations ? [[citationPlugin, references, slug] as never] : []),
        ],
        rehypePlugins: [
          // Least-privilege trust: only http(s) math links render as <a>;
          // anything else degrades to inert error text (backstop for the
          // remark guard above, which throws first).
          [rehypeKatex, { trust: isTrustedMathUrl }],
          [rehypePrettyCode, { theme: "github-dark-high-contrast", keepBackground: false }],
          ...(tableOfContents
            ? [rehypeSlug, [collectHeadingsPlugin, headings] as never]
            : []),
        ],
      },
    },
  });

  return { content, references, headings };
}
