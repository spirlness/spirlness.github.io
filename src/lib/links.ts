export function isUsableHref(
  href: string | null | undefined
): href is string {
  return Boolean(href && href.trim() && !href.trim().startsWith("#"));
}
