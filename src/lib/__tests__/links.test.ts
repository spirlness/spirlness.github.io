import { describe, it, expect } from "vitest";
import {
  isExternalHref,
  isSafeHttpUrl,
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
  });
});
