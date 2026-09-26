"use client";

import { useSyncExternalStore } from 'react';

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * 惰性缓存的 MediaQueryList。
 *
 * 模块加载时不触碰 window（SSR 安全），仅在浏览器端调用时创建；
 * 缓存的目的是让 getSnapshot 每次都返回同一个对象，
 * 满足 useSyncExternalStore 对快照稳定性的要求。
 */
let mediaQueryList: MediaQueryList | null = null;

const getMediaQueryList = (): MediaQueryList => {
  if (!mediaQueryList) {
    mediaQueryList = window.matchMedia(QUERY);
  }
  return mediaQueryList;
};

/**
 * 订阅系统「减少动态效果」偏好的变化，返回取消订阅函数
 */
const subscribe = (onStoreChange: () => void): (() => void) => {
  const query = getMediaQueryList();
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
};

/**
 * 客户端快照：当前系统是否偏好减少动态效果
 */
const getSnapshot = (): boolean => getMediaQueryList().matches;

/**
 * 服务端快照：服务端无法感知该偏好，保守地按 false 处理
 */
const getServerSnapshot = (): boolean => false;

/**
 * 读取系统的「减少动态效果」偏好，并在用户切换系统设置时自动更新。
 *
 * 使用 useSyncExternalStore 订阅 matchMedia 的 change 事件，
 * 替代每次渲染时的临时读取，保证状态随系统设置即时同步。
 */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
