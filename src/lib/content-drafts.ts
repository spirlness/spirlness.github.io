/**
 * Draft visibility for posts and projects.
 *
 * `draft: true` marks an entry as work in progress. Drafts are ordinary,
 * fully validated content while authoring (`next dev`, tests, tooling), but a
 * production build must behave as if they did not exist: every reader filters
 * them, so pages, tags, RSS, the sitemap, adjacent/related lists and
 * `generateStaticParams` all inherit the exclusion from one rule.
 */

/** Drafts stay visible everywhere except a production build or serve. */
export function isDraftsVisible(
  env: string | undefined = process.env.NODE_ENV
): boolean {
  return env !== "production";
}

/** Shared reader option: override the environment-derived visibility. */
export interface ContentVisibilityOptions {
  /** When false, entries with `draft: true` are treated as absent. */
  includeDrafts?: boolean;
}

/** Resolve a reader's `includeDrafts` option against the current environment. */
export function resolveIncludeDrafts(
  options: ContentVisibilityOptions = {}
): boolean {
  return options.includeDrafts ?? isDraftsVisible();
}

/** True when an entry must be hidden given the caller's visibility choice. */
export function isDraftHidden(
  entry: { draft?: boolean },
  includeDrafts: boolean
): boolean {
  return entry.draft === true && !includeDrafts;
}
