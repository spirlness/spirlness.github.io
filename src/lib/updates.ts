import fs from "fs";
import path from "path";

export type UpdateIcon =
  | "award"
  | "book"
  | "graduation"
  | "project"
  | "publication"
  | "blog";

export interface UpdateFrontmatter {
  date: string;
  content: string;
  icon: UpdateIcon;
  link?: string;
}

const UPDATES_PATH = path.join(process.cwd(), "content/updates");

export function getAllUpdates(): UpdateFrontmatter[] {
  if (!fs.existsSync(UPDATES_PATH)) {
    return [];
  }

  const files = fs.readdirSync(UPDATES_PATH);
  const updates: UpdateFrontmatter[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const jsonPath = path.join(UPDATES_PATH, file);
    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed: UpdateFrontmatter = JSON.parse(raw);
    updates.push(parsed);
  }

  return updates.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
