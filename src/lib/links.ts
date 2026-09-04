export function isUsableHref(
  href: string | null | undefined
): href is string {
  return Boolean(href && href.trim() && !href.trim().startsWith("#"));
}

/** Keep internal page links compatible with trailing-slash static exports. */
export function normalizeInternalHref(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const match = /^([^?#]*)(.*)$/.exec(href);
  const pathname = match?.[1] ?? href;
  const suffix = match?.[2] ?? "";
  if (pathname === "/" || pathname.endsWith("/") || /\/[^/]+\.[^/]+$/.test(pathname)) {
    return href;
  }
  return `${pathname}/${suffix}`;
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
