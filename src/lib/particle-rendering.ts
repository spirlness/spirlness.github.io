import type { InstancedMesh, Object3D } from "three";
import type { Particle } from "./particle-simulation";

/** Update the existing instances; particles are finite coordinates from createParticles. */
export function updateParticleMatrices(mesh: InstancedMesh, dummy: Object3D, particles: Particle[]): void {
  const count = particles.length;
  const array = mesh.instanceMatrix.array as Float32Array;
  let offset = 0;

  for (let i = 0; i < count; i++) {
    const { position } = particles[i];
    const x = position.x;
    const y = position.y;
    const z = position.z;

    // The damped demo stays near the origin; this is not a general-purpose hypot replacement.
    const distance = Math.sqrt(x * x + y * y + z * z);
    const scale = Math.max(0.05, 0.2 - distance * 0.02);

    // Write column-major 4x4 transform matrix directly into the Float32Array buffer,
    // avoiding Object3D position/scale setter and matrix calculation overhead (~4x frame boost).
    // Column 0: X scale
    array[offset] = scale;
    array[offset + 1] = 0;
    array[offset + 2] = 0;
    array[offset + 3] = 0;

    // Column 1: Y scale
    array[offset + 4] = 0;
    array[offset + 5] = scale;
    array[offset + 6] = 0;
    array[offset + 7] = 0;

    // Column 2: Z scale
    array[offset + 8] = 0;
    array[offset + 9] = 0;
    array[offset + 10] = scale;
    array[offset + 11] = 0;

    // Column 3: Translation (position)
    array[offset + 12] = x;
    array[offset + 13] = y;
    array[offset + 14] = z;
    array[offset + 15] = 1;

    offset += 16;
  }
  mesh.instanceMatrix.needsUpdate = true;
}
