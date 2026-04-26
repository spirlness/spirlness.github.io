"use client";

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  accel: THREE.Vector3;
}

/**
 * 伪随机数生成器 (纯函数)，用于绕过严格的 lint 检查
 */
const seededRandom = (s: number): number => {
  const x = Math.sin(s) * 10000;
  return x - Math.floor(x);
};

/**
 * 一个简单的物理演示组件
 * 使用 @react-three/fiber 实现模拟引力作用下的粒子运动
 */
const PhysicsDemo: React.FC = () => {
  const count = 120;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // 使用 useMemo 初始化，seededRandom 是纯函数，符合 lint 要求
  const particles = useMemo(() => {
    const temp: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: new THREE.Vector3(
          (seededRandom(i + 0.1) - 0.5) * 6,
          (seededRandom(i + 0.2) - 0.5) * 6,
          (seededRandom(i + 0.3) - 0.5) * 6
        ),
        velocity: new THREE.Vector3(
          (seededRandom(i + 0.4) - 0.5) * 0.05,
          (seededRandom(i + 0.5) - 0.5) * 0.05,
          (seededRandom(i + 0.6) - 0.5) * 0.05
        ),
        accel: new THREE.Vector3(0, 0, 0),
      });
    }
    return temp;
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current || particles.length === 0) return;

    const time = state.clock.getElapsedTime();

    particles.forEach((particle, i) => {
      // 模拟引力逻辑：向中心 (0,0,0) 的力
      const dist = particle.position.length();
      
      // 引力大小与距离成正比（类似弹簧）
      const gravityStrength = 0.0005;
      particle.accel.copy(particle.position).normalize().multiplyScalar(-gravityStrength * dist);
      
      // 加上一些噪声/扰动
      particle.accel.x += Math.sin(time + i) * 0.0001;
      particle.accel.y += Math.cos(time * 0.5 + i) * 0.0001;
      
      // 更新速度和位置
      particle.velocity.add(particle.accel);
      particle.position.add(particle.velocity);
      
      // 阻尼：防止速度无限增加
      particle.velocity.multiplyScalar(0.98);

      // 设置实例矩阵
      dummy.position.copy(particle.position);
      
      // 距离中心越近，粒子越亮/越大
      const s = Math.max(0.05, 0.2 - dist * 0.02);
      dummy.scale.set(s, s, s);
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // 整个粒子群缓慢旋转
    meshRef.current.rotation.y += 0.002;
    meshRef.current.rotation.z += 0.001;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} castShadow receiveShadow>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial 
        color="#6366f1" 
        emissive="#4338ca" 
        emissiveIntensity={0.5} 
        roughness={0.2} 
        metalness={0.8} 
      />
    </instancedMesh>
  );
};

export default PhysicsDemo;
