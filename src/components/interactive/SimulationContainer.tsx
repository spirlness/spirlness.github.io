"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage } from '@react-three/drei';

interface SimulationContainerProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

/**
 * 一个能够容纳 Three.js Canvas 的容器
 * 支持懒加载 (通过 Suspense) 和尺寸自适应
 */
const SimulationContainer: React.FC<SimulationContainerProps> = ({ 
  children, 
  height = "400px",
  className = ""
}) => {
  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200 shadow-inner my-8 ${className}`}
      style={{ height }}
    >
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Simulation...</span>
          </div>
        </div>
      }>
        <Canvas
          shadows
          camera={{ position: [0, 0, 5], fov: 50 }}
          dpr={[1, 2]}
          className="cursor-move"
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stage environment="city" intensity={0.5} contactShadow={{ opacity: 0.4, blur: 2 }}>
            {children}
          </Stage>
          <OrbitControls makeDefault />
        </Canvas>
      </Suspense>
    </div>
  );
};

export default SimulationContainer;
