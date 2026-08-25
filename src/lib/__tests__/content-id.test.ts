import { describe, it, expect } from "vitest";
import { assertSafeContentSlug } from "../content-id";

describe("assertSafeContentSlug", () => {
  it("accepts slugs with letters, digits, and hyphens", () => {
    expect(assertSafeContentSlug("my-post-123", "post slug")).toBe("my-post-123");
    expect(assertSafeContentSlug("ABC-xyz", "post slug")).toBe("ABC-xyz");
  });

  it("strips a trailing .mdx extension", () => {
    expect(assertSafeContentSlug("hello.mdx", "post slug")).toBe("hello");
  });

  it("rejects path traversal attempts", () => {
    expect(() => assertSafeContentSlug("../etc/passwd", "post slug")).toThrow();
    expect(() => assertSafeContentSlug("..\\etc\\passwd", "post slug")).toThrow();
  });

  it("rejects slashes and dots in the middle", () => {
    expect(() => assertSafeContentSlug("foo/bar", "post slug")).toThrow();
    expect(() => assertSafeContentSlug("foo.bar", "post slug")).toThrow();
  });

  it("rejects empty or whitespace-only slugs", () => {
    expect(() => assertSafeContentSlug("", "post slug")).toThrow();
    expect(() => assertSafeContentSlug("   ", "post slug")).toThrow();
  });
});
