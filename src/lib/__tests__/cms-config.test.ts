import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import {
  MONTH_PATTERN,
  POST_DATE_PATTERN,
  assertSchemaAlignment,
  buildConfig,
  generateConfigYaml,
} from "../../../scripts/generate-sveltia-config.mjs";
import { CONTENT_SLUG_REGEX } from "../content-id";
import { postLanguages, updateIcons } from "../content-schemas";

/* eslint-disable @typescript-eslint/no-explicit-any */

function collection(config: any, name: string): any {
  const found = (config.collections as any[]).find((entry) => entry.name === name);
  expect(found, `collection ${name}`).toBeTruthy();
  return found;
}

function field(config: any, collectionName: string, fieldName: string): any {
  const found = (collection(config, collectionName).fields as any[]).find(
    (entry) => entry.name === fieldName
  );
  expect(found, `${collectionName}.${fieldName}`).toBeTruthy();
  return found;
}

/** The YAML the generator would write, parsed back into a plain object. */
function parsedConfig(): any {
  return parseYaml(generateConfigYaml());
}

describe("generated Sveltia config", () => {
  it("emits the smoke-validated output options", () => {
    const yaml = generateConfigYaml();
    expect(yaml).toContain("omit_empty_optional_fields: true");
    expect(yaml).toContain("quote: double");

    const config = parsedConfig();
    expect(config.output).toEqual({
      omit_empty_optional_fields: true,
      yaml: { quote: "double" },
    });
  });

  it("keeps media settings site-root-relative", () => {
    const config = parsedConfig();
    expect(config.media_folder).toBe("public");
    expect(config.public_folder).toBe("/");
    expect(collection(config, "posts").media_folder).toBe("/public/posts/{{slug}}");
    expect(collection(config, "posts").public_folder).toBe("/posts/{{slug}}");
    expect(collection(config, "projects").media_folder).toBe(
      "/public/projects/{{slug}}"
    );
    expect(collection(config, "projects").public_folder).toBe(
      "/projects/{{slug}}"
    );
  });

  it("writes post dates as string widgets with the YYYY-MM-DD pattern", () => {
    const config = parsedConfig();
    const date = field(config, "posts", "date");
    expect(date.widget).toBe("string");
    expect(date.pattern[0]).toBe(POST_DATE_PATTERN);
    expect(new RegExp(POST_DATE_PATTERN).test("2026-04-26")).toBe(true);
    expect(new RegExp(POST_DATE_PATTERN).test("2026-4-6")).toBe(false);

    const lastUpdated = field(config, "posts", "lastUpdated");
    expect(lastUpdated.widget).toBe("string");
    expect(lastUpdated.pattern[0]).toBe(POST_DATE_PATTERN);
  });

  it("uses YYYY-MM string dates for updates and projects", () => {
    const config = parsedConfig();
    for (const [collectionName, fieldName] of [
      ["updates", "date"],
      ["projects", "date"],
    ] as const) {
      const date = field(config, collectionName, fieldName);
      expect(date.widget).toBe("string");
      expect(date.pattern[0]).toBe(MONTH_PATTERN);
    }
    const lastModified = field(config, "projects", "lastModified");
    expect(lastModified.widget).toBe("string");
    expect(lastModified.pattern[0]).toBe(POST_DATE_PATTERN);
  });

  it("marks drafts as optional booleans defaulting to false on posts and projects", () => {
    const config = parsedConfig();
    for (const collectionName of ["posts", "projects"]) {
      expect(field(config, collectionName, "draft")).toMatchObject({
        widget: "boolean",
        required: false,
        default: false,
      });
    }
    expect(
      (collection(config, "updates").fields as any[]).some(
        (entry) => entry.name === "draft"
      )
    ).toBe(false);
  });

  it("imports the update icon options from updateIcons", () => {
    const config = parsedConfig();
    const options = field(config, "updates", "icon").options.map((option: any) =>
      typeof option === "string" ? option : option.value
    );
    expect(options).toEqual([...updateIcons]);
  });

  it("derives the post tags pattern from CONTENT_SLUG_REGEX", () => {
    const config = parsedConfig();
    expect(field(config, "posts", "tags").field.pattern[0]).toBe(
      CONTENT_SLUG_REGEX.source
    );
    expect(field(config, "projects", "id").pattern[0]).toBe(
      CONTENT_SLUG_REGEX.source
    );
  });

  it("derives the language options from postLanguages", () => {
    const config = parsedConfig();
    const options = field(config, "posts", "lang").options.map(
      (option: any) => option.value
    );
    expect(options).toEqual([...postLanguages]);
  });

  it("keeps the post body as raw MDX", () => {
    const config = parsedConfig();
    expect(field(config, "posts", "body")).toMatchObject({
      widget: "richtext",
      modes: ["raw"],
    });
  });

  it("aligns with the zod schemas and detects drift", () => {
    expect(() => assertSchemaAlignment()).not.toThrow();
    expect(() => buildConfig()).not.toThrow();

    const missingField: any = buildConfig();
    const posts = missingField.collections.find((entry: any) => entry.name === "posts");
    posts.fields = posts.fields.filter((entry: any) => entry.name !== "excerpt");
    expect(() => assertSchemaAlignment(missingField)).toThrow(/missing field\(s\) excerpt/);

    const wrongIcons: any = buildConfig();
    const updates = wrongIcons.collections.find((entry: any) => entry.name === "updates");
    const icon = updates.fields.find((entry: any) => entry.name === "icon");
    icon.options = ["award"];
    expect(() => assertSchemaAlignment(wrongIcons)).toThrow(/updateIcons/);
  });
});
