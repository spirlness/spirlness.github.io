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

function assertValidUpdate(
  parsed: unknown,
  file: string
): UpdateFrontmatter {
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid update "${file}": expected a JSON object`);
  }

  const data = parsed as Record<string, unknown>;

  if (typeof data.content !== "string" || !data.content.trim()) {
    throw new Error(`Invalid update "${file}": missing or empty content`);
  }
  if (typeof data.date !== "string" || !/^(\d{4})-(\d{2})$/.test(data.date)) {
    throw new Error(
      `Invalid update "${file}": date must be YYYY-MM (got ${JSON.stringify(data.date)})`
    );
  }
  const { month } = parseDate(data.date);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid update "${file}": month out of range in ${data.date}`);
  }
  if (typeof data.icon !== "string" || !UPDATE_ICONS.has(data.icon)) {
    throw new Error(
      `Invalid update "${file}": icon must be one of ${[...UPDATE_ICONS].join(", ")}`
    );
  }
  if (
    data.link !== undefined &&
    (typeof data.link !== "string" || !data.link.trim())
  ) {
    throw new Error(`Invalid update "${file}": link must be a non-empty string when set`);
  }

  return {
    date: data.date,
    content: data.content,
    icon: data.icon as UpdateIcon,
    ...(typeof data.link === "string" ? { link: data.link } : {}),
  };
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
    updates.push(assertValidUpdate(parsed, file));
  }

  return updates.sort((a, b) => {
    const pa = parseDate(a.date);
    const pb = parseDate(b.date);
    return pb.year - pa.year || pb.month - pa.month;
  });
}
