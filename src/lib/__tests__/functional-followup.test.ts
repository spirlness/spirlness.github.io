import { describe, expect, it } from "vitest";
import { readingTime } from "../reading-time";
import { advanceSimulation, createParticles } from "../particle-simulation";
import { compileContent } from "../mdx";

describe("reading time measures prose across languages", () => {
  it("counts unspaced Chinese and mixed Chinese/English text", () => {
    expect(readingTime("中".repeat(1200))).toBe(3);
    expect(readingTime("中".repeat(400) + "word ".repeat(200))).toBe(2);
  });

  it("excludes tilde/backtick fences, destinations and JSX attributes", () => {
    const noise = "word ".repeat(2000);
    expect(readingTime(`~~~text\n${noise}\n~~~\n\n\`\`\`text\n${noise}\n\`\`\`\n\n[Read](https://example.com/${"long/".repeat(1000)})\n\n<SideNote label="${noise}">Brief note</SideNote>`)).toBe(1);
  });
});

describe("fixed-step particle motion", () => {
  const simulate = (fps: number) => {
    const particles = createParticles(4);
    const state = { time: 0, accumulator: 0 };
    for (let i = 0; i < fps * 2; i++) advanceSimulation(state, particles, 1 / fps);
    return { particles, state };
  };

  it("produces the same trajectory at 30, 60 and 120 FPS", () => {
    const reference = simulate(60);
    for (const fps of [30, 120]) {
      const result = simulate(fps);
      expect(result.particles).toEqual(reference.particles);
      expect(result.state.time).toBeCloseTo(2, 10);
    }
  });

  it("bounds catch-up after a long stall and ignores invalid deltas", () => {
    const particles = createParticles(1);
    const state = { time: 0, accumulator: 0 };
    advanceSimulation(state, particles, 10);
    expect(state.time).toBeCloseTo(0.1, 10);
    const snapshot = structuredClone({ state, particles });
    for (const delta of [NaN, Infinity, -1, 0]) advanceSimulation(state, particles, delta);
    expect({ state, particles }).toEqual(snapshot);
  });
});

describe("the page owns the only h1", () => {
  it.each(["# Extra title", "<h1>Extra title</h1>"])("rejects body title %s", async source => {
    await expect(compileContent({ source, slug: "extra-title" })).rejects.toThrow(/Body headings must start at ##/);
  });

  it("preserves section headings while allowing h1 syntax in fenced code", async () => {
    const result = await compileContent({ source: "## Section\n\n```md\n# Example\n```", slug: "valid-sections", tableOfContents: true });
    expect(result.headings).toEqual([{ id: "section", text: "Section", level: 2 }]);
  });
});
