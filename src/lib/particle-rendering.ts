import type { InstancedMesh } from "three";
import type { Particle } from "./particle-simulation";

/** Write local translation + uniform scale, with no per-particle rotation or pivot.
 * Particles must have finite demo coordinates and exactly match the active instance count.
 * Reject invalid counts before writing; unused capacity is allowed.
 */
export function updateParticleMatrices(mesh: InstancedMesh, particles: Particle[]): void {
  const count = particles.length;
  const attribute = mesh.instanceMatrix;
  const array = attribute.array;
  if (count !== mesh.count || count > attribute.count || array.length < count * 16) {
    throw new RangeError("Particle count must match mesh.count and fit the instance matrix capacity");
  }
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
    // avoiding the general Object3D transform composition for this restricted transform.
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
