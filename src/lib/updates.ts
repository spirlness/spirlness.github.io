import fs from "fs";
import path from "path";

export type UpdateIcon =
  | "award"
  | "book"
  | "graduation"
  | "project"
  | "publication"
  | "blog";

/** Single source of truth for runtime validation; mirrors the UpdateIcon union. */
const UPDATE_ICONS: ReadonlySet<string> = new Set<UpdateIcon>([
  "award",
  "book",
  "graduation",
  "project",
  "publication",
  "blog",
]);

export interface UpdateFrontmatter {
  date: string;
  content: string;
  icon: UpdateIcon;
  link?: string;
}

const UPDATES_PATH = path.join(process.cwd(), "content/updates");

/** Explicitly split "YYYY-MM" into numbers so ordering never depends on engine date parsing. */
function parseDate(date: string): { year: number; month: number } {
  const match = /^(\d{4})-(\d{2})$/.exec(date);
  if (!match) return { year: NaN, month: NaN };
  return { year: Number(match[1]), month: Number(match[2]) };
}

export function getAllUpdates(): UpdateFrontmatter[] {
  if (!fs.existsSync(UPDATES_PATH)) {
    return [];
  }

  const files = fs.readdirSync(UPDATES_PATH);
  const updates: UpdateFrontmatter[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const jsonPath = path.join(UPDATES_PATH, file);
    let parsed: UpdateFrontmatter | null = null;
    try {
      const raw = fs.readFileSync(jsonPath, "utf8");
      parsed = JSON.parse(raw) as UpdateFrontmatter;
    } catch (err) {
      // A malformed file must not take down the whole static build; skip it and say which one.
      console.error(`Failed to read update "${file}" — ${(err as Error).message}`);
      continue;
    }
    if (
      !parsed ||
      typeof parsed.content !== "string" ||
      typeof parsed.date !== "string" ||
      !UPDATE_ICONS.has(parsed.icon)
    ) {
      console.warn(`Ignoring update "${file}": missing or invalid content, date, or icon`);
      continue;
    }
    updates.push(parsed);
  }

  return updates.sort((a, b) => {
    const pa = parseDate(a.date);
    const pb = parseDate(b.date);
    return pb.year - pa.year || pb.month - pa.month;
  });
}