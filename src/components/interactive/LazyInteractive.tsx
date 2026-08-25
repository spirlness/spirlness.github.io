"use client";

import dynamic from 'next/dynamic';

/**
 * 客户端边界层。
 *
 * `ssr: false` 只允许出现在客户端组件中，而 MDXComponents 是服务端组件，
 * 因此把动态导入集中放在这里，由服务端组件表引用导出的结果即可。
 * 保留 ssr: false 有两个原因：Three.js 场景依赖 DOM 无法预渲染，
 * 且懒加载可避免交互式 Demo 拖慢首屏。
 */
export const SimulationContainer = dynamic(
  () => import('./SimulationContainer'),
  { ssr: false }
);

export const PhysicsDemo = dynamic(() => import('./PhysicsDemo'), {
  ssr: false,
});
