import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

// Precompiled module-level regex patterns.
const HAN_PATTERN = /\p{Script=Han}/gu;
const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

/**
 * Count regex matches without allocating an array of matched strings or
 * instantiating new RegExp objects per invocation.
 */
function countMatches(pattern: RegExp, str: string): number {
  pattern.lastIndex = 0;
  let count = 0;
  while (pattern.test(str)) count++;
  return count;
}

/** Approximate visible prose at 200 words or 400 Han characters per minute. */
export function readingTime(source: string): number {
  const fragments: string[] = [];
  visit(parser.parse(source), (node) => {
    if (node.type === "text" || node.type === "inlineCode") fragments.push(node.value);
  });
  // AST text excludes fenced code, link destinations and JSX attributes.
  const body = fragments.join(" ");
  const han = countMatches(HAN_PATTERN, body);
  // Replace Han characters with spaces so non-spaced CJK characters do not
  // merge into pseudo-words for WORD_PATTERN.
  const cleanBody = body.replace(HAN_PATTERN, " ");
  const words = countMatches(WORD_PATTERN, cleanBody);
  return Math.max(1, Math.round(words / 200 + han / 400));
}
