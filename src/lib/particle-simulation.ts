interface Vector { x: number; y: number; z: number }
export interface Particle { position: Vector; velocity: Vector }
export interface SimulationState { time: number; accumulator: number }

const STEP = 1 / 60;
const MAX_DELTA = 0.1;
const seededRandom = (seed: number) => {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
};

export function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    position: { x: (seededRandom(i + 0.1) - 0.5) * 6, y: (seededRandom(i + 0.2) - 0.5) * 6, z: (seededRandom(i + 0.3) - 0.5) * 6 },
    velocity: { x: (seededRandom(i + 0.4) - 0.5) * 0.05, y: (seededRandom(i + 0.5) - 0.5) * 0.05, z: (seededRandom(i + 0.6) - 0.5) * 0.05 },
  }));
}

/** Fixed steps preserve the same trajectory at 30/60/120 FPS; cap stall recovery. */
export function advanceSimulation(state: SimulationState, particles: Particle[], delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  state.accumulator += Math.min(delta, MAX_DELTA);
  while (state.accumulator + 1e-9 >= STEP) {
    state.time += STEP;
    // Bolt: Use indexed loop and local references instead of entries() iterator + destructuring
    // to eliminate iterator/tuple allocation and property lookup overhead in animation loop (60 FPS).
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p = particles[i];
      const pos = p.position;
      const vel = p.velocity;
      vel.x += -pos.x * 0.0005 + Math.sin(state.time + i) * 0.0001;
      vel.y += -pos.y * 0.0005 + Math.cos(state.time * 0.5 + i) * 0.0001;
      vel.z += -pos.z * 0.0005;
      pos.x += vel.x;
      pos.y += vel.y;
      pos.z += vel.z;
      vel.x *= 0.98;
      vel.y *= 0.98;
      vel.z *= 0.98;
    }
    state.accumulator = Math.max(0, state.accumulator - STEP);
  }
}
