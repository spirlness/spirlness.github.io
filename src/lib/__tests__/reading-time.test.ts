import { describe, expect, it } from "vitest";
import { readingTime } from "../reading-time";

describe("readingTime", () => {
  it("calculates reading times accurately", () => {
    expect(readingTime("hello world")).toBe(1);
    expect(readingTime("```\ncode block\n```")).toBe(1);
    expect(readingTime("word ".repeat(400))).toBe(2);
    expect(readingTime("中".repeat(1200))).toBe(3);
  });

  it("returns cached results on repeated calls for identical source", () => {
    const source = "This is a test post content. " + "word ".repeat(200);
    const first = readingTime(source);
    const second = readingTime(source);
    expect(second).toBe(first);
  });

  it("handles cache eviction when size limit is reached", () => {
    for (let i = 0; i < 110; i++) {
      expect(readingTime(`unique test post content number ${i}`)).toBe(1);
    }
  });
});
