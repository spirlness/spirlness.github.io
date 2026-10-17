import { describe, expect, it } from "vitest";
import { InstancedMesh, Object3D } from "three";
import { advanceSimulation, createParticles } from "../particle-simulation";
import { updateParticleMatrices } from "../particle-rendering";
import { advanceReference, updateReference } from "../../../tests/fixtures/particle-reference";

import { updateParentMatrices } from "../../../tests/fixtures/particle-matrix-parent";

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
    const referenceDummy = new Object3D();
    for (let frame = 0; frame <= 3600; frame++) {
      if (frame > 0) advanceSimulation(state, particles, 1 / 60);
      if (![0, 1, 60, 600, 3600].includes(frame)) continue;
      const snapshot = structuredClone(particles);
      const version = mesh.instanceMatrix.version;
      updateParticleMatrices(mesh, particles);
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
    updateParticleMatrices(mesh, particles);
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


describe("direct matrix buffer contract", () => {
  it("matches the immediate parent for asymmetric coordinates and scale boundaries", () => {
    const particles = [
      { x: 0, y: 0, z: 0 }, { x: -1.25, y: 2.5, z: -3.75 },
      ...[7.5 - 1e-10, 7.5, 7.5 + 1e-10].map(x => ({ x, y: 0, z: 0 })),
      ...Array.from({ length: 1000 }, (_, i) => ({ x: Math.sin(i) * 6, y: Math.cos(i * 2) * 4, z: Math.sin(i * 3) * 2 })),
    ].map(position => ({ position, velocity: { x: 0, y: 0, z: 0 } }));
    const mesh = new InstancedMesh(undefined, undefined, particles.length);
    const parent = new InstancedMesh(undefined, undefined, particles.length);
    updateParticleMatrices(mesh, particles);
    updateParentMatrices(parent, new Object3D(), particles);
    expect(mesh.instanceMatrix.array).toEqual(parent.instanceMatrix.array);
    mesh.dispose(); parent.dispose();
  });

  it("accepts zero active particles and leaves inactive capacity untouched", () => {
    const mesh = new InstancedMesh(undefined, undefined, 2);
    mesh.count = 0;
    const before = mesh.instanceMatrix.array.slice();
    updateParticleMatrices(mesh, []);
    expect(mesh.instanceMatrix.array).toEqual(before);
    mesh.dispose();
  });

  it.each([
    { capacity: 1, active: 2, particles: 2 },
    { capacity: 2, active: 2, particles: 1 },
    { capacity: 2, active: 1, particles: 2 },
    { capacity: 2, active: 2, particles: 0 },
  ])("rejects mismatched counts before writing: %j", ({ capacity, active, particles }) => {
    const mesh = new InstancedMesh(undefined, undefined, capacity);
    mesh.count = active;
    const before = mesh.instanceMatrix.array.slice();
    const version = mesh.instanceMatrix.version;
    expect(() => updateParticleMatrices(mesh, createParticles(particles))).toThrow(RangeError);
    expect(mesh.instanceMatrix.array).toEqual(before);
    expect(mesh.instanceMatrix.version).toBe(version);
    mesh.dispose();
  });

  it("allows spare capacity with a matching active count", () => {
    const mesh = new InstancedMesh(undefined, undefined, 3);
    mesh.count = 1;
    const tail = mesh.instanceMatrix.array.slice(16);
    updateParticleMatrices(mesh, createParticles(1));
    expect(mesh.instanceMatrix.array.slice(16)).toEqual(tail);
    mesh.dispose();
  });
});
