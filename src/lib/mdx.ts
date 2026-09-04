import type { Root as HastRoot, Element as HastElement } from "hast";
import type { Root as MdastRoot, Parent, Text, PhrasingContent } from "mdast";
import { toText } from "hast-util-to-text";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkMath from "remark-math";
import { visit } from "unist-util-visit";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { getAllPublications, type Publication } from "./bibtex";

const citationPattern = /\[@([A-Za-z0-9:-]+(?:;\s*@[A-Za-z0-9:-]+)*)\]/g;

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

interface CompileContentOptions {
  source: string;
  slug: string;
  citations?: boolean;
  tableOfContents?: boolean;
}

function citationPlugin(references: Publication[], slug: string) {
  const publications = new Map(
    getAllPublications().map((publication) => [publication.id, publication])
  );

  return (tree: MdastRoot) => {
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
          let referenceIndex = references.findIndex(
            (publication) => publication.id === key
          );
          if (referenceIndex === -1) {
            const publication = publications.get(key);
            if (!publication) {
              throw new Error(
                `Citation key "${key}" not found in content/references.bib (post: ${slug})`
              );
            }
            references.push(publication);
            referenceIndex = references.length - 1;
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
          remarkMath,
          ...(citations ? [[citationPlugin, references, slug] as never] : []),
        ],
        rehypePlugins: [
          rehypeKatex,
          [rehypePrettyCode, { theme: "github-dark", keepBackground: false }],
          ...(tableOfContents
            ? [rehypeSlug, [collectHeadingsPlugin, headings] as never]
            : []),
        ],
      },
    },
  });

  return { content, references, headings };
}
