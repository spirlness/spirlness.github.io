export const CONTENT_SLUG_REGEX = /^[A-Za-z0-9-]+$/;

/**
 * Character set a BibTeX citation key may use. The `[@key]` citation syntax in
 * `src/lib/mdx.ts` is built from this same class, so a key that fails this test
 * can never be cited — and is rejected at parse time rather than silently
 * rendering as literal text in a post.
 */
export const CITATION_KEY_CHARS = "A-Za-z0-9:-";
export const CITATION_KEY_REGEX = new RegExp(`^[${CITATION_KEY_CHARS}]+$`);

/**
 * Normalizes a content slug and rejects anything that could escape the
 * content directory when joined to a filesystem path.
 */
export function assertSafeContentSlug(value: string, label: string): string {
  const clean = value.replace(/\.mdx$/, "").trim();

  if (!CONTENT_SLUG_REGEX.test(clean)) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }

  return clean;
}
