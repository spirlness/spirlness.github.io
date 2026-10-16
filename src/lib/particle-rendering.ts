import type { InstancedMesh, Object3D } from "three";
import type { Particle } from "./particle-simulation";

/** Update the existing instances; particles are finite coordinates from createParticles. */
export function updateParticleMatrices(mesh: InstancedMesh, dummy: Object3D, particles: Particle[]): void {
  const count = particles.length;
  for (let i = 0; i < count; i++) {
    const { position } = particles[i];
    dummy.position.set(position.x, position.y, position.z);
    // The damped demo stays near the origin; this is not a general-purpose hypot replacement.
    const distance = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    dummy.scale.setScalar(Math.max(0.05, 0.2 - distance * 0.02));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
