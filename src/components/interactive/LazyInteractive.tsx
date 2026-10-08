"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SimulationErrorBoundary } from "./SimulationErrorBoundary";

const Scene = dynamic(() => import("./SimulationContainer"), { ssr: false });
export const PhysicsDemo = dynamic(() => import("./PhysicsDemo"), { ssr: false });

function subscribeVisibility(onChange: () => void) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}
const getVisibility = () => document.visibilityState === "visible";
const getServerVisibility = () => true;

/** Download and mount the WebGL scene only after an explicit user action. */
export function SimulationContainer({ children, height = "400px", className = "" }: {
  children: ReactNode;
  height?: string;
  className?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const documentVisible = useSyncExternalStore(subscribeVisibility, getVisibility, getServerVisibility);
  const active = visible && documentVisible && !paused;
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function start() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2");
    if (!context) {
      setUnsupported(true);
      return;
    }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    setStarted(true);
  }

  async function retry() {
    // Environment loaders cache rejected requests; clear them before remounting.
    try {
      const scene = await import("./SimulationContainer");
      scene.clearSimulationResources();
    } catch {
      // Keep repeated failures inside the preview when remounting it.
    }
    setReady(false);
    setAttempt((value) => value + 1);
  }

  return (
    <div ref={container} className={`not-prose relative w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200 my-8 ${className}`} style={{ height }} aria-label="Interactive simulation">
      {unsupported ? (
        <p role="status" className="absolute inset-0 flex items-center justify-center p-6 text-center text-gray-700">Your browser does not support this interactive preview. You can continue reading the article.</p>
      ) : started ? (
        <SimulationErrorBoundary key={attempt} onRetry={retry}>
          <Scene active={active} onReady={onReady}>{children}</Scene>
          {!ready && <p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-700">Loading simulation…</p>}
          {ready && (
            <button type="button" aria-pressed={paused} onClick={() => setPaused((value) => !value)} className="absolute top-3 right-3 rounded-md bg-white px-3 py-2 text-sm text-gray-700 border border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              {paused ? "Resume simulation" : "Pause simulation"}
            </button>
          )}
        </SimulationErrorBoundary>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-gray-700">Explore the particle simulation. Drag to rotate the view.</p>
          <button type="button" onClick={start} className="rounded-md bg-accent px-4 py-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Start simulation</button>
        </div>
      )}
    </div>
  );
}
