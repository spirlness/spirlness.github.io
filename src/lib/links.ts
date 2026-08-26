export function isUsableHref(
  href: string | null | undefined
): href is string {
  return Boolean(href && href.trim() && !href.trim().startsWith("#"));
}

/** True for absolute http(s) URLs (and protocol-relative `//…`). */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href.trim());
}

/**
 * Allow only http(s) absolute URLs for BibTeX / author-supplied outbound links.
 * Rejects javascript:, data:, and other schemes that would be unsafe if committed.
 */
export function isSafeHttpUrl(
  href: string | null | undefined
): href is string {
  if (!isUsableHref(href)) return false;
  try {
    const url = new URL(href.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
