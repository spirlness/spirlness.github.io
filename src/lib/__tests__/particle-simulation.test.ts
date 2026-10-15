import { describe, expect, it } from "vitest";
import { advanceSimulation, createParticles } from "../particle-simulation";

describe("particle simulation", () => {
  it("creates specified count of particles with valid properties", () => {
    const count = 50;
    const particles = createParticles(count);
    expect(particles).toHaveLength(count);

    for (const particle of particles) {
      expect(Number.isFinite(particle.position.x)).toBe(true);
      expect(Number.isFinite(particle.position.y)).toBe(true);
      expect(Number.isFinite(particle.position.z)).toBe(true);

      expect(Number.isFinite(particle.velocity.x)).toBe(true);
      expect(Number.isFinite(particle.velocity.y)).toBe(true);
      expect(Number.isFinite(particle.velocity.z)).toBe(true);
    }
  });

  it("advances simulation state and particle positions/velocities", () => {
    const particles = createParticles(10);
    const initialPos = { ...particles[0].position };
    const state = { time: 0, accumulator: 0 };

    advanceSimulation(state, particles, 1 / 60);

    expect(state.time).toBeGreaterThan(0);
    expect(particles[0].position.x).not.toBe(initialPos.x);
  });

  it("handles non-positive or invalid delta gracefully", () => {
    const particles = createParticles(5);
    const state = { time: 0, accumulator: 0 };

    advanceSimulation(state, particles, 0);
    expect(state.time).toBe(0);

    advanceSimulation(state, particles, -1);
    expect(state.time).toBe(0);

    advanceSimulation(state, particles, NaN);
    expect(state.time).toBe(0);
  });
});
