import type { TrustContext } from "katex";
import { isSafeHttpUrl } from "./links";

/**
 * Schemes that must never become a clickable link out of KaTeX output.
 * The check normalises case and strips ASCII whitespace/control characters
 * so `JaVaScRiPt:` / `java\tscript:` style obfuscation does not slip through.
 */
const UNSAFE_MATH_SCHEME_RE = /^(javascript|data|vbscript|file|blob)\s*:/i;

function normaliseSchemePrefix(url: string): string {
  return url
    .replace(/[\u0000-\u0020]+/g, "")
    .toLowerCase();
}

/** True when a raw TeX URL candidate uses a dangerous scheme. */
export function isUnsafeMathUrl(url: string): boolean {
  return UNSAFE_MATH_SCHEME_RE.test(normaliseSchemePrefix(url.trim()));
}

/**
 * KaTeX `trust` callback (least privilege): allow only http(s) URLs for
 * `\href` / `\url` / `\includegraphics`. Everything else — dangerous
 * schemes, relative URLs, and the `\html*` extension commands — renders as
 * inert error text instead of a link. Wired into both `rehype-katex` options
 * (`src/lib/mdx.ts`) and `MathBlock` (`src/components/mdx/MathBlock.tsx`).
 */
export function isTrustedMathUrl(context: TrustContext): boolean {
  switch (context.command) {
    case "\\href":
    case "\\url":
    case "\\includegraphics":
      return isSafeHttpUrl(context.url);
    default:
      return false;
  }
}

const MATH_LINK_RE = /\\(href|url)\s*\{([^}]*)\}/gi;

/**
 * Fail-closed pre-check for TeX sources: throws when a `\href{}` / `\url{}`
 * destination uses a dangerous scheme. Runs on mdast `inlineMath` / `math`
 * node values (remark plugin in `src/lib/mdx.ts`) and on the `equation` prop
 * (`MathBlock`, which bypasses the mdast math pipeline entirely).
 *
 * This is intentionally conservative — anything it cannot parse falls through
 * to the `isTrustedMathUrl` backstop, which is authoritative because KaTeX
 * itself parses the URL.
 */
export function assertSafeMathUrls(tex: string, origin: string): void {
  MATH_LINK_RE.lastIndex = 0;
  for (const match of tex.matchAll(MATH_LINK_RE)) {
    const url = match[2].trim();
    if (url !== "" && isUnsafeMathUrl(url)) {
      throw new Error(
        `Unsafe math link scheme in ${origin}: "\\${match[1]}{${url}}"`
      );
    }
  }
  MATH_LINK_RE.lastIndex = 0;
}
