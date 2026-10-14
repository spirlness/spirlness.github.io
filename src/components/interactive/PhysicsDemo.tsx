"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { advanceSimulation, createParticles } from "@/lib/particle-simulation";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const COUNT = 120;

export default function PhysicsDemo() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => createParticles(COUNT), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const simulation = useRef({ time: 0, accumulator: 0 });
  const rendered = useRef(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useFrame((_, delta) => {
    if (!meshRef.current || (prefersReducedMotion && rendered.current)) return;
    if (!prefersReducedMotion) advanceSimulation(simulation.current, particles, delta);

    // Bolt ⚡ Optimization:
    // 1. Use indexed loop instead of particles.entries() to avoid per-frame iterator & tuple allocations (~120/frame = 7.2k/s at 60 FPS).
    // 2. Use Math.sqrt instead of Math.hypot to avoid slow variadic hypot overhead in hot animation frames.
    const count = particles.length;
    for (let i = 0; i < count; i++) {
      const pos = particles[i].position;
      dummy.position.set(pos.x, pos.y, pos.z);
      const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
      const scale = Math.max(0.05, 0.2 - dist * 0.02);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.rotation.y = simulation.current.time * 0.12;
    meshRef.current.rotation.z = simulation.current.time * 0.06;
    rendered.current = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial color="#6366f1" emissive="#4338ca" emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
    </instancedMesh>
  );
}
