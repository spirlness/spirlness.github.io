import { describe, it, expect } from "vitest";
import {
  isExternalHref,
  isSafeHref,
  isSafeHttpUrl,
  isSafeLocalHref,
  isUsableHref,
  normalizeInternalHref,
} from "../links";

describe("normalizeInternalHref", () => {
  it("adds a trailing slash to page routes without changing files or anchors", () => {
    expect(normalizeInternalHref("/projects")).toBe("/projects/");
    expect(normalizeInternalHref("/projects?view=all")).toBe("/projects/?view=all");
    expect(normalizeInternalHref("/feed.xml")).toBe("/feed.xml");
    expect(normalizeInternalHref("#references")).toBe("#references");
    expect(normalizeInternalHref("https://example.com/path")).toBe(
      "https://example.com/path"
    );
  });
});

describe("isUsableHref", () => {
  it("accepts real URLs", () => {
    expect(isUsableHref("https://example.com")).toBe(true);
    expect(isUsableHref("/projects/foo/")).toBe(true);
  });

  it("rejects dead # links", () => {
    expect(isUsableHref("#")).toBe(false);
    expect(isUsableHref("#section")).toBe(false);
  });

  it("rejects empty, null, and undefined", () => {
    expect(isUsableHref("")).toBe(false);
    expect(isUsableHref("   ")).toBe(false);
    expect(isUsableHref(null)).toBe(false);
    expect(isUsableHref(undefined)).toBe(false);
  });
});

describe("isExternalHref", () => {
  it("detects absolute and protocol-relative URLs", () => {
    expect(isExternalHref("https://example.com")).toBe(true);
    expect(isExternalHref("http://example.com")).toBe(true);
    expect(isExternalHref("//cdn.example.com/x")).toBe(true);
  });

  it("treats site paths as internal", () => {
    expect(isExternalHref("/blog/foo/")).toBe(false);
    expect(isExternalHref("blog/foo")).toBe(false);
  });
});

describe("isSafeHttpUrl", () => {
  it("accepts http(s) URLs", () => {
    expect(isSafeHttpUrl("https://example.com/a")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
  });

  it("rejects non-http schemes and placeholders", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("data:text/html,hi")).toBe(false);
    expect(isSafeHttpUrl("#")).toBe(false);
    expect(isSafeHttpUrl("/relative")).toBe(false);
    expect(isSafeHttpUrl("http:\\attacker.example")).toBe(false);
  });
});

describe("isSafeLocalHref", () => {
  it("accepts site-relative paths, including backslashes after ? or #", () => {
    expect(isSafeLocalHref("/")).toBe(true);
    expect(isSafeLocalHref("/projects/foo/")).toBe(true);
    expect(isSafeLocalHref("/search?q=C:\\temp")).toBe(true);
    expect(isSafeLocalHref("/docs/#C:\\API")).toBe(true);
  });

  it("rejects a backslash in the path portion", () => {
    expect(isSafeLocalHref("/foo\\bar")).toBe(false);
    expect(isSafeLocalHref("/foo\\bar?q=1")).toBe(false);
    expect(isSafeLocalHref("/foo?q=1#\\bar")).toBe(true);
  });

  it("rejects protocol-relative, leading-backslash, and leading-whitespace forms", () => {
    for (const href of ["//evil", "/\\evil", "/\t/evil", "/\n/evil", "/\r/evil"]) {
      expect(isSafeLocalHref(href)).toBe(false);
    }
  });

  it("rejects values without a leading slash", () => {
    expect(isSafeLocalHref("\\evil")).toBe(false);
    expect(isSafeLocalHref("\\\\evil")).toBe(false);
    expect(isSafeLocalHref("search?q=C:\\temp")).toBe(false);
    expect(isSafeLocalHref("https://example.com")).toBe(false);
    expect(isSafeLocalHref("")).toBe(false);
  });
});

describe("isSafeHref", () => {
  it("accepts ordinary local paths, anchors, and HTTP(S) URLs", () => {
    expect(isSafeHref("/")).toBe(true);
    expect(isSafeHref("/projects?view=all#top")).toBe(true);
    expect(isSafeHref("/#section")).toBe(true);
    expect(isSafeHref("https://example.com")).toBe(true);
    expect(isSafeHref("/%5Cevil.example")).toBe(true);
    expect(isSafeHref("/%2F%2Fevil.example")).toBe(true);
    expect(isSafeHref("/search?q=C:\\temp")).toBe(true);
    expect(isSafeHref("/docs/#C:\\API")).toBe(true);
  });

  it("rejects local paths that browser URL parsing can reinterpret as an origin", () => {
    for (const href of [
      "//attacker.example",
      "/\\attacker.example",
      "/\\/attacker.example",
      "/\t/attacker.example",
      "/\n/attacker.example",
      "/\r/attacker.example",
      "  /\\attacker.example",
      "/foo\\bar",
      "\\\\attacker.example",
    ]) {
      expect(isSafeHref(href)).toBe(false);
    }
  });
});
