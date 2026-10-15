import { describe, expect, it } from "vitest";
import { advanceSimulation, createParticles } from "../particle-simulation";
import { advanceSimulation as referenceStep } from "../../../tests/fixtures/particle-reference";

describe("indexed simulation matches the pre-optimization implementation", () => {
  it.each([0, 1, 120])("preserves every state update for %i particles", count => {
    const actual = createParticles(count);
    const expected = structuredClone(actual);
    const state = { time: 0, accumulator: 0 };
    const reference = { ...state };
    const deltas = [1 / 30, 1 / 60, 1 / 120, 0.001, 0.1, 10, NaN, Infinity, -1, 0];
    for (let frame = 0; frame < 600; frame++) {
      const delta = deltas[frame % deltas.length];
      advanceSimulation(state, actual, delta);
      referenceStep(reference, expected, delta);
      expect(state).toEqual(reference);
      expect(actual).toEqual(expected);
    }
  });
});
