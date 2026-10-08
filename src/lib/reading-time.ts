import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

/** Approximate visible prose at 200 words or 400 Han characters per minute. */
export function readingTime(source: string): number {
  const fragments: string[] = [];
  visit(parser.parse(source), (node) => {
    if (node.type === "text" || node.type === "inlineCode") fragments.push(node.value);
  });
  // AST text excludes fenced code, link destinations and JSX attributes.
  const body = fragments.join(" ");
  const han = body.match(/\p{Script=Han}/gu)?.length ?? 0;
  const words = body.replace(/\p{Script=Han}/gu, " ")
    .match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.round(words / 200 + han / 400));
}
