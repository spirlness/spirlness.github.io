// Frozen reference from dd63887; keep separate from production code to catch regressions.
interface Vector { x: number; y: number; z: number }
export interface Particle { position: Vector; velocity: Vector }
export interface SimulationState { time: number; accumulator: number }

const STEP = 1 / 60;
const MAX_DELTA = 0.1;
/** Fixed steps preserve the same trajectory at 30/60/120 FPS; cap stall recovery. */
export function advanceReference(state: SimulationState, particles: Particle[], delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  state.accumulator += Math.min(delta, MAX_DELTA);
  while (state.accumulator + 1e-9 >= STEP) {
    state.time += STEP;
    for (const [i, { position, velocity }] of particles.entries()) {
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

import type { InstancedMesh, Object3D } from "three";

export function updateReference(mesh: InstancedMesh, dummy: Object3D, particles: Particle[]): void {
  for (const [i, { position }] of particles.entries()) {
    dummy.position.set(position.x, position.y, position.z);
    const scale = Math.max(0.05, 0.2 - Math.hypot(position.x, position.y, position.z) * 0.02);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
