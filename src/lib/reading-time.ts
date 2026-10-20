import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMdx);

// Optimization: Hoist regular expressions to module scope to prevent re-compilation
// and re-instantiation of RegExp objects on every readingTime invocation.
const HAN_REGEX = /\p{Script=Han}/gu;
const WORD_REGEX = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

// Optimization: Bounded LRU cache for reading minutes by raw source string to bypass
// expensive unified AST parsing (~10-30ms) while capping memory footprint.
const MAX_CACHE_SIZE = 100;
const readingTimeCache = new Map<string, number>();

/** Approximate visible prose at 200 words or 400 Han characters per minute. */
export function readingTime(source: string): number {
  const cached = readingTimeCache.get(source);
  if (cached !== undefined) {
    // Refresh LRU order on hit
    readingTimeCache.delete(source);
    readingTimeCache.set(source, cached);
    return cached;
  }

  const fragments: string[] = [];
  visit(parser.parse(source), (node) => {
    if (node.type === "text" || node.type === "inlineCode") fragments.push(node.value);
  });
  // AST text excludes fenced code, link destinations and JSX attributes.
  const body = fragments.join(" ");
  const han = body.match(HAN_REGEX)?.length ?? 0;
  const words = body.replace(HAN_REGEX, " ")
    .match(WORD_REGEX)?.length ?? 0;
  const minutes = Math.max(1, Math.round(words / 200 + han / 400));

  if (readingTimeCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = readingTimeCache.keys().next().value;
    if (oldestKey !== undefined) {
      readingTimeCache.delete(oldestKey);
    }
  }
  readingTimeCache.set(source, minutes);
  return minutes;
}
