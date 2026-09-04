import { z } from "zod";
import { assertSafeContentSlug } from "./content-id";

const trimmedString = z.string().trim().min(1);

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isYearMonth(value: string): boolean {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  return Boolean(match && Number(match[2]) >= 1 && Number(match[2]) <= 12);
}

function isSafeHref(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const calendarDate = trimmedString.refine(isCalendarDate, {
  message: "must be a valid date in YYYY-MM-DD format",
});
const yearMonth = trimmedString.refine(isYearMonth, {
  message: "must be a valid date in YYYY-MM format",
});
const safeHref = trimmedString.refine(isSafeHref, {
  message: "must be a safe local path or HTTP(S) URL",
});
const httpUrl = z.url().refine((value) => /^https?:\/\//i.test(value), {
  message: "must be an HTTP(S) URL",
});
const slug = trimmedString.regex(/^[A-Za-z0-9-]+$/, {
  message: "must contain only A-Z, a-z, 0-9, or hyphens",
});

function uniqueTrimmedStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export const postFrontmatterSchema = z.object({
  title: trimmedString,
  date: calendarDate,
  excerpt: trimmedString,
  tags: z
    .preprocess(
      (value) => (typeof value === "string" ? value.split(",") : value ?? []),
      z.array(slug)
    )
    .transform(uniqueTrimmedStrings),
  lastUpdated: calendarDate.optional(),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema> & {
  slug: string;
};

export function parsePostFrontmatter(
  value: unknown,
  postSlug: string
): PostFrontmatter {
  const cleanSlug = assertSafeContentSlug(postSlug, "post slug");
  return { ...postFrontmatterSchema.parse(value), slug: cleanSlug };
}

export const projectSchema = z.object({
  id: slug,
  title: trimmedString,
  description: trimmedString,
  date: yearMonth,
  lastModified: calendarDate.optional(),
  thumbnail: safeHref,
  mediaType: z.enum(["image", "video"]).optional(),
  links: z
    .object({
      project: safeHref.optional(),
      code: safeHref.optional(),
      paper: safeHref.optional(),
      demo: safeHref.optional(),
    })
    .optional(),
  tags: z.array(trimmedString).transform(uniqueTrimmedStrings).optional(),
});

export type ProjectFrontmatter = z.infer<typeof projectSchema>;

export function parseProject(
  value: unknown,
  filenameId: string,
  file = `${filenameId}.json`
): ProjectFrontmatter {
  const cleanId = assertSafeContentSlug(filenameId, "project id");
  const project = projectSchema.parse(value);
  if (project.id !== cleanId) {
    throw new Error(
      `Project id "${project.id}" must equal filename "${cleanId}" (file: ${file})`
    );
  }
  return project;
}

export const updateIcons = [
  "award",
  "book",
  "graduation",
  "project",
  "publication",
  "blog",
] as const;

export const updateSchema = z.object({
  date: yearMonth,
  content: trimmedString,
  icon: z.enum(updateIcons, { error: "icon must be a supported update icon" }),
  link: safeHref.optional(),
});

export type UpdateFrontmatter = z.infer<typeof updateSchema>;
export type UpdateIcon = UpdateFrontmatter["icon"];

export function parseUpdate(value: unknown, file: string): UpdateFrontmatter {
  try {
    return updateSchema.parse(value);
  } catch (error) {
    throw new Error(`Invalid update "${file}": ${(error as Error).message}`);
  }
}

const profileLink = z.object({ label: trimmedString, href: httpUrl });
const navLink = z.object({ label: trimmedString, href: safeHref });

export const siteProfileSchema = z.object({
  name: trimmedString,
  navTitle: trimmedString,
  title: trimmedString,
  description: trimmedString,
  url: httpUrl,
  authorInitial: trimmedString,
  authorRole: trimmedString,
  heroTitle: z.tuple([trimmedString, trimmedString]),
  researchSummary: trimmedString,
  currentWork: trimmedString,
  contactIntro: trimmedString,
  links: z.array(profileLink),
  navLinks: z.array(navLink),
  publicationAuthorNames: z.array(trimmedString),
  publicationsIntro: trimmedString,
  focusAreas: z.array(
    z.object({ title: trimmedString, description: trimmedString })
  ),
});

export type SiteProfile = z.infer<typeof siteProfileSchema>;

export function parseSiteProfile(value: unknown): SiteProfile {
  return siteProfileSchema.parse(value);
}
