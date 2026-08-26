import { describe, it, expect } from "vitest";
import { getAllUpdates } from "../updates";

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
