import { isSafeHref } from "./links";

/**
 * Descriptor tokens allowed after a candidate URL: density (`2x`) or
 * width/height (`640w`, `480h`). Restricting them keeps arbitrary text —
 * including something shaped like another URL — from riding along after a
 * checked URL.
 */
const DESCRIPTOR_PATTERN = /^\d+(?:\.\d+)?[wxh]$/;

function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    /^127(?:\.\d{1,3}){3}$/.test(host)
  );
}

/**
 * Media targets are stricter than navigation targets in `links.ts`: only
 * site-absolute paths and absolute http(s) URLs can actually fetch a file.
 * `#fragment` candidates are meaningless for media, and http(s) loopback hosts
 * (localhost / 127.0.0.0/8 / [::1]) are rejected because a static export can
 * only ever point a visitor back at their own machine.
 */
function isSafeMediaUrl(value: string): boolean {
  if (!isSafeHref(value)) return false;
  if (value.startsWith("#")) return false;
  if (value.startsWith("/")) return true;
  try {
    return !isLoopbackHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}

/**
 * Parse a `srcSet` attribute into its candidate URLs.
 *
 * A comma inside a URL token is part of that URL; only a trailing comma or a
 * comma after a descriptor separates candidates. Empty segments are ignored.
 * Returns `null` when no valid candidate can be extracted.
 */
export function parseSrcSet(value: string): string[] | null {
  const urls: string[] = [];
  let index = 0;

  while (index < value.length) {
    while (index < value.length && /[\t\n\f\r ,]/.test(value[index])) index++;
    if (index === value.length) break;

    const start = index;
    while (index < value.length && !/[\t\n\f\r ]/.test(value[index])) index++;
    const token = value.slice(start, index);
    const url = token.replace(/,+$/, "");
    if (!url) return null;
    urls.push(url);
    if (url.length !== token.length) continue;

    while (index < value.length) {
      while (index < value.length && /[\t\n\f\r ]/.test(value[index])) index++;
      if (index === value.length) break;
      if (value[index] === ",") {
        index++;
        break;
      }
      const descriptorStart = index;
      while (index < value.length && !/[\t\n\f\r ,]/.test(value[index])) index++;
      if (!DESCRIPTOR_PATTERN.test(value.slice(descriptorStart, index))) return null;
    }
  }

  return urls.length > 0 ? urls : null;
}

/**
 * Fail-closed gate for an MDX `srcSet` attribute: every candidate URL must pass
 * the same allowlist as `src` (plus the stricter media-target rule above).
 * Checking only the first candidate would let the browser pick an unchecked
 * one, so any unsafe candidate rejects the whole attribute.
 */
export function isSafeSrcSet(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const urls = parseSrcSet(value);
  return urls !== null && urls.every((url) => isSafeMediaUrl(url));
}
