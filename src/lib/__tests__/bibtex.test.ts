import { describe, it, expect } from "vitest";
import { getAllPublications, groupPublicationsByYear } from "../bibtex";

describe("getAllPublications", () => {
  it("returns publications sorted by year descending", () => {
    const pubs = getAllPublications();
    expect(pubs.length).toBeGreaterThan(0);

    for (let i = 0; i < pubs.length - 1; i++) {
      const a = parseInt(pubs[i].year, 10) || Number.MIN_SAFE_INTEGER;
      const b = parseInt(pubs[i + 1].year, 10) || Number.MIN_SAFE_INTEGER;
      expect(a).toBeGreaterThanOrEqual(b);
    }
  });

  it("strips braces from fields", () => {
    const pubs = getAllPublications();
    for (const pub of pubs) {
      expect(pub.title).not.toContain("{");
      expect(pub.title).not.toContain("}");
      expect(pub.authors).not.toContain("{");
      expect(pub.authors).not.toContain("}");
    }
  });

  it("provides fallback values for missing fields", () => {
    const pubs = getAllPublications();
    for (const pub of pubs) {
      expect(pub.id).toBeTruthy();
      expect(pub.title).toBeTruthy();
      expect(pub.authors).toBeTruthy();
    }
  });
});

describe("groupPublicationsByYear", () => {
  it("groups publications into year buckets", () => {
    const pubs = getAllPublications();
    const groups = groupPublicationsByYear(pubs);

    const totalGrouped = Object.values(groups).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    expect(totalGrouped).toBe(pubs.length);
  });
});
