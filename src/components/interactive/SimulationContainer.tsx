"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stage, useEnvironment } from "@react-three/drei";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const environment = { files: "/environments/potsdamer_platz_1k.hdr" };

export function clearSimulationResources() {
  useEnvironment.clear(environment);
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((state) => state.invalidate);
  const rendered = useRef(false);
  const completion = useRef<number | null>(null);
  useFrame(() => {
    if (rendered.current) return;
    rendered.current = true;
    // Expose controls after the first render, including shader preparation.
    completion.current = requestAnimationFrame(() => {
      completion.current = null;
      onReady();
    });
  });
  useEffect(() => {
    invalidate();
    return () => {
      if (completion.current !== null) cancelAnimationFrame(completion.current);
    };
  }, [invalidate]);
  return null;
}

export default function SimulationContainer({ children, active, onReady }: {
  children: ReactNode;
  active: boolean;
  onReady: () => void;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 50 }}
      dpr={1}
      className="cursor-move"
      frameloop={active ? (prefersReducedMotion ? "demand" : "always") : "never"}
      fallback={<p role="status" className="p-6 text-gray-700">Your browser does not support this interactive preview. You can continue reading the article.</p>}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Suspense fallback={null}>
        <Stage environment={environment} intensity={0.5} shadows={false}>{children}</Stage>
        <SceneReady onReady={onReady} />
      </Suspense>
      <OrbitControls makeDefault enabled={active} />
    </Canvas>
  );
}
