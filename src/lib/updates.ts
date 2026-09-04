import fs from "fs";
import path from "path";
import { parseUpdate, type UpdateFrontmatter } from "./content-schemas";

export type { UpdateFrontmatter, UpdateIcon } from "./content-schemas";

const UPDATES_PATH = path.join(process.cwd(), "content/updates");

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
  if (!fs.existsSync(UPDATES_PATH)) {
    return [];
  }

  const files = fs.readdirSync(UPDATES_PATH);
  const updates: UpdateFrontmatter[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const jsonPath = path.join(UPDATES_PATH, file);
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (err) {
      throw new Error(
        `Failed to parse update "${file}": ${(err as Error).message}`
      );
    }
    updates.push(parseUpdate(parsed, file));
  }

  return updates.sort((a, b) => {
    const pa = parseDate(a.date);
    const pb = parseDate(b.date);
    return pb.year - pa.year || pb.month - pa.month;
  });
}
