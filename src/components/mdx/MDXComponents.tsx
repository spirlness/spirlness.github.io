import React from 'react';
import { SideNote } from './SideNote';
import { MathBlock } from './MathBlock';
import dynamic from 'next/dynamic';

// 动态导入客户端组件，保持 MDXComponents 本身为服务端组件
const SimulationContainer = dynamic(() => import('../interactive/SimulationContainer'), { ssr: false });
const PhysicsDemo = dynamic(() => import('../interactive/PhysicsDemo'), { ssr: false });

/**
 * Custom MDX components mapping for Distill-style layout.
 */
export const mdxComponents = {
  // 基础组件
  SideNote,
  MathBlock,
  
  // 交互式组件
  SimulationContainer,
  PhysicsDemo,
  
  // HTML 元素覆盖
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="text-4xl font-bold mt-16 mb-8 font-display text-gray-900" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="text-2xl font-bold mt-12 mb-6 font-display text-gray-800 border-b border-gray-100 pb-2" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="text-xl font-semibold mt-8 mb-4 font-display text-gray-800" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-relaxed mb-6 text-gray-700 text-lg" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-disc list-outside ml-6 mb-6 text-gray-700 space-y-2" {...props} />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className="list-decimal list-outside ml-6 mb-6 text-gray-700 space-y-2" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props} />
  ),
  blockquote: (props: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-4 border-orange-200 pl-6 italic my-8 text-gray-600 bg-orange-50/20 py-2 rounded-r-lg" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-pink-600" {...props} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-8 font-mono text-sm" {...props} />
  ),
  hr: () => <hr className="my-12 border-gray-100" />,
};

export default mdxComponents;
