import { beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createParticles } from "@/lib/particle-simulation";
import { advanceSimulation as referenceStep } from "../../../tests/fixtures/particle-reference";

// Isolate React/R3F scheduling; execute the real frame callback with real Three matrices.
const harness = vi.hoisted(() => ({
  frame: undefined as undefined | ((context: unknown, delta: number) => void),
  reduced: false,
  mesh: null as unknown,
}));
vi.mock("react", () => ({
  useMemo: (factory: () => unknown) => factory(),
  useRef: (value: unknown) => ({ current: value === null ? harness.mesh : value }),
}));
vi.mock("@react-three/fiber", () => ({
  useFrame: (frame: (context: unknown, delta: number) => void) => { harness.frame = frame; },
}));
vi.mock("./usePrefersReducedMotion", () => ({ usePrefersReducedMotion: () => harness.reduced }));
import PhysicsDemo from "./PhysicsDemo";

function makeMesh() {
  const matrices = new Float32Array(120 * 16);
  return {
    matrices,
    instanceMatrix: { needsUpdate: false },
    rotation: { y: 0, z: 0 },
    setMatrixAt: vi.fn((index: number, matrix: THREE.Matrix4) => matrix.toArray(matrices, index * 16)),
  };
}

beforeEach(() => {
  harness.frame = undefined;
  harness.reduced = false;
  harness.mesh = makeMesh();
});

describe("physics frame preserves the original instance output", () => {
  it("matches every matrix and rotation through substeps, stalls and invalid deltas", () => {
    const mesh = harness.mesh as ReturnType<typeof makeMesh>;
    const particles = createParticles(120);
    const state = { time: 0, accumulator: 0 };
    const dummy = new THREE.Object3D();
    const expected = new Float32Array(120 * 16);
    PhysicsDemo();
    for (const delta of [1 / 120, 1 / 120, 1 / 30, 0.001, 10, NaN, Infinity, -1, 0]) {
      referenceStep(state, particles, delta);
      for (const [i, { position }] of particles.entries()) {
        dummy.position.set(position.x, position.y, position.z);
        dummy.scale.setScalar(Math.max(0.05, 0.2 - Math.hypot(position.x, position.y, position.z) * 0.02));
        dummy.updateMatrix();
        dummy.matrix.toArray(expected, i * 16);
      }
      mesh.setMatrixAt.mockClear();
      mesh.instanceMatrix.needsUpdate = false;
      harness.frame!(null, delta);
      expect(mesh.matrices).toEqual(expected);
      expect(mesh.rotation).toEqual({ y: state.time * 0.12, z: state.time * 0.06 });
      expect(mesh.setMatrixAt.mock.calls.map(([index]) => index)).toEqual(Array.from({ length: 120 }, (_, i) => i));
      expect(mesh.instanceMatrix.needsUpdate).toBe(true);
    }
  });

  it("renders a single unchanged initial frame with reduced motion", () => {
    harness.reduced = true;
    const mesh = harness.mesh as ReturnType<typeof makeMesh>;
    PhysicsDemo();
    harness.frame!(null, 10);
    const first = mesh.matrices.slice();
    const expected = new Float32Array(120 * 16);
    const dummy = new THREE.Object3D();
    for (const [i, { position }] of createParticles(120).entries()) {
      dummy.position.set(position.x, position.y, position.z);
      dummy.scale.setScalar(Math.max(0.05, 0.2 - Math.hypot(position.x, position.y, position.z) * 0.02));
      dummy.updateMatrix();
      dummy.matrix.toArray(expected, i * 16);
    }
    expect(first).toEqual(expected);
    expect(mesh.rotation).toEqual({ y: 0, z: 0 });
    mesh.setMatrixAt.mockClear();
    mesh.instanceMatrix.needsUpdate = false;
    harness.frame!(null, 1 / 60);
    expect(mesh.matrices).toEqual(first);
    expect(mesh.setMatrixAt).not.toHaveBeenCalled();
    expect(mesh.instanceMatrix.needsUpdate).toBe(false);
  });

  it("does no work before the mesh is attached", () => {
    harness.mesh = null;
    PhysicsDemo();
    expect(() => harness.frame!(null, 1 / 60)).not.toThrow();
  });
});
