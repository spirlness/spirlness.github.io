import { describe, it, expect } from "vitest";
import { isSafeHref, isSafeHttpUrl } from "../links";
import { getAllUpdates } from "../updates";

describe("isSafeHttpUrl", () => {
  it("accepts only absolute HTTP(S) URLs", () => {
    expect(isSafeHttpUrl("https://example.com")).toBe(true);
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("/projects/")).toBe(false);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("isSafeHref", () => {
  it("allows local navigation and HTTP(S) URLs", () => {
    expect(isSafeHref("/projects/")).toBe(true);
    expect(isSafeHref("#references")).toBe(true);
    expect(isSafeHref("https://example.com")).toBe(true);
  });

  it("rejects unsafe or ambiguous schemes", () => {
    expect(isSafeHref("javascript:alert(1)")).toBe(false);
    expect(isSafeHref("data:text/html,example")).toBe(false);
    expect(isSafeHref("//example.com")).toBe(false);
  });
});

describe("getAllUpdates", () => {
  it("loads valid updates sorted by date descending", () => {
    const updates = getAllUpdates();
    expect(updates.length).toBeGreaterThan(0);
    for (let i = 0; i < updates.length - 1; i++) {
      expect(updates[i].date >= updates[i + 1].date).toBe(true);
    }
    for (const update of updates) {
      expect(update.content).toBeTruthy();
      expect(update.date).toMatch(/^\d{4}-\d{2}$/);
    }
  });
});
