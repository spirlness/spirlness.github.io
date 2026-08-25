import { describe, it, expect } from "vitest";
import { isUsableHref } from "../links";

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
