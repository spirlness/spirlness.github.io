import fs from "fs";
import path from "path";
import { readContentFile } from "./content-files";
import { parseUpdate, type UpdateFrontmatter } from "./content-schemas";

export type { UpdateFrontmatter, UpdateIcon } from "./content-schemas";

const UPDATES_PATH = path.join(process.cwd(), "content/updates");

// Optimization: Cache updates in production to avoid repeated directory scans,
// file reads, JSON parsing, and schema validations across page renders during static build.
let cachedUpdates: UpdateFrontmatter[] | null = null;

/** Explicitly split "YYYY-MM" into numbers so ordering never depends on engine date parsing. */
function parseDate(date: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(date);
  if (!match) return { year: NaN, month: NaN };
  return { year: Number(match[1]), month: Number(match[2]) };
}

/**
 * Load homepage timeline entries. Malformed or invalid files **fail the build**
 * so authoring errors cannot silently vanish from the homepage.
 */
export function getAllUpdates(): UpdateFrontmatter[] {
  const cacheEnabled = process.env.NODE_ENV === "production";
  if (cacheEnabled && cachedUpdates) {
    return structuredClone(cachedUpdates);
  }

  if (!fs.existsSync(UPDATES_PATH)) {
    return [];
  }

  const files = fs.readdirSync(UPDATES_PATH);
  const updates: UpdateFrontmatter[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(readContentFile(UPDATES_PATH, file));
    } catch (err) {
      throw new Error(
        `Failed to parse update "${file}": ${(err as Error).message}`
      );
    }
    updates.push(parseUpdate(parsed, file));
  }

  // Optimization: Schwartzian transform precomputes date components once per update
  // to avoid repeated regex matching and number parsing inside Array.prototype.sort().
  const decorated = updates.map((update) => ({
    update,
    parsed: parseDate(update.date),
  }));
  decorated.sort(
    (a, b) => b.parsed.year - a.parsed.year || b.parsed.month - a.parsed.month
  );
  const sortedUpdates = decorated.map((d) => d.update);

  if (cacheEnabled) {
    cachedUpdates = sortedUpdates;
  }

  return structuredClone(sortedUpdates);
}
