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

/**
 * Allow safe local navigation plus absolute HTTP(S) links.
 * Protocol-relative URLs are deliberately rejected because their destination
 * changes with the current scheme and they bypass the local-path check.
 */
export function isSafeHref(
  href: string | null | undefined
): href is string {
  if (!href || !href.trim()) return false;

  const value = href.trim();
  if (value.startsWith("#")) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  return isSafeHttpUrl(value);
}
