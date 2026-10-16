import { describe, expect, it } from "vitest";
import { InstancedMesh, Object3D } from "three";
import { advanceSimulation, createParticles } from "../particle-simulation";
import { updateParticleMatrices } from "../particle-rendering";
import { advanceReference, updateReference } from "../../../tests/fixtures/particle-reference";

describe("particle optimization against the pre-optimization implementation", () => {
  it.each([30, 60, 120])("preserves every state value at %i FPS, including stalls and invalid deltas", fps => {
    const particles = createParticles(120);
    const reference = structuredClone(particles);
    const state = { time: 0, accumulator: 0 };
    const referenceState = { ...state };
    const deltas = [0, -1, NaN, Infinity, 10, 0.001, ...Array<number>(fps * 10).fill(1 / fps)];
    for (const delta of deltas) {
      advanceSimulation(state, particles, delta);
      advanceReference(referenceState, reference, delta);
      expect(state).toEqual(referenceState);
      expect(particles).toEqual(reference);
    }
  });

  it("preserves GPU instance matrices at initial, animated and settled states", () => {
    const particles = createParticles(120);
    const state = { time: 0, accumulator: 0 };
    const mesh = new InstancedMesh(undefined, undefined, particles.length);
    const reference = new InstancedMesh(undefined, undefined, particles.length);
    const dummy = new Object3D();
    const referenceDummy = new Object3D();
    for (let frame = 0; frame <= 3600; frame++) {
      if (frame > 0) advanceSimulation(state, particles, 1 / 60);
      if (![0, 1, 60, 600, 3600].includes(frame)) continue;
      const snapshot = structuredClone(particles);
      const version = mesh.instanceMatrix.version;
      updateParticleMatrices(mesh, dummy, particles);
      updateReference(reference, referenceDummy, particles);
      expect(mesh.instanceMatrix.array).toEqual(reference.instanceMatrix.array);
      expect(mesh.instanceMatrix.version).toBe(version + 1);
      expect(particles).toEqual(snapshot);
    }
    mesh.dispose();
    reference.dispose();
  });

  it("keeps finite transforms at the origin and around the minimum-scale boundary", () => {
    const particles = [0, 1e-200, 7.5 - 1e-10, 7.5, 7.5 + 1e-10, 1e200].map(x => ({
      position: { x, y: 0, z: 0 }, velocity: { x: 0, y: 0, z: 0 },
    }));
    const mesh = new InstancedMesh(undefined, undefined, particles.length);
    const reference = new InstancedMesh(undefined, undefined, particles.length);
    updateParticleMatrices(mesh, new Object3D(), particles);
    updateReference(reference, new Object3D(), particles);
    // Only compare scale: the deliberately enormous translation exceeds Float32 range.
    for (let i = 0; i < particles.length; i++) {
      const scale = mesh.instanceMatrix.array[i * 16];
      expect(Number.isFinite(scale)).toBe(true);
      expect(scale).toBe(reference.instanceMatrix.array[i * 16]);
    }
    mesh.dispose();
    reference.dispose();
  });
});
