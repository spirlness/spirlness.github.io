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
    // Optimize hot loop: indexed for loop avoids allocating iterator objects and
    // temporary entry tuple arrays ([i, particle]) per particle per physics step,
    // eliminating garbage collection pressure in high-framerate animation loops.
    const particleCount = particles.length;
    for (let i = 0; i < particleCount; i++) {
      const particle = particles[i];
      const position = particle.position;
      const velocity = particle.velocity;
      velocity.x += -position.x * 0.0005 + Math.sin(state.time + i) * 0.0001;
      velocity.y += -position.y * 0.0005 + Math.cos(state.time * 0.5 + i) * 0.0001;
      velocity.z += -position.z * 0.0005;
      position.x += velocity.x;
      position.y += velocity.y;
      position.z += velocity.z;
      velocity.x *= 0.98;
      velocity.y *= 0.98;
      velocity.z *= 0.98;
    }
    state.accumulator = Math.max(0, state.accumulator - STEP);
  }
}
