export const CONTENT_SLUG_REGEX = /^[A-Za-z0-9-]+$/;

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
