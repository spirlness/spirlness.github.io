"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage, useEnvironment } from "@react-three/drei";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const environment = { files: "/environments/potsdamer_platz_1k.hdr" };

export function clearSimulationResources() {
  useEnvironment.clear(environment);
}

function SceneReady({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    onReady();
  }, [invalidate, onReady]);
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
      dpr={[1, 1.5]}
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
