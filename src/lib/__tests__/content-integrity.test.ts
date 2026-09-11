import { describe, expect, it } from "vitest";
import { checkContentIntegrity } from "../content-integrity";

describe("checkContentIntegrity", () => {
  it("validates and compiles every repository content item", async () => {
    const summary = await checkContentIntegrity();

    expect(summary.posts).toBeGreaterThan(0);
    expect(summary.projects).toBeGreaterThan(0);
    expect(summary.updates).toBeGreaterThan(0);
    expect(summary.publications).toBeGreaterThan(0);
  });
});
