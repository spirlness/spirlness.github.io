import React from 'react';
import type { MDXComponents } from 'mdx/types';
import { SideNote } from './SideNote';
import { MathBlock } from './MathBlock';
// 交互式组件经由 LazyInteractive 的客户端边界导入，本文件保持为服务端组件
import { SimulationContainer, PhysicsDemo } from '../interactive/LazyInteractive';

/**
 * Custom MDX components mapping for Distill-style layout.
 */
export const mdxComponents: MDXComponents = {
  // 基础组件
  SideNote,
  MathBlock,

  // 交互式组件
  SimulationContainer,
  PhysicsDemo,
  
  // HTML 元素覆盖
  // 页面外壳已渲染文章标题的唯一 <h1>，因此映射刻意不含 h1：若正文出现
  // `#`，preflight 会把它渲染成与正文相同的普通文本，而不是第二个样式化的
  // 页面级标题。正文章节一律从 h2 起。
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
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={`border-l-4 border-orange-200 pl-6 italic my-8 text-gray-600 bg-orange-50/20 py-2 rounded-r-lg [&_p]:text-gray-600 [&_p:last-child]:mb-0 ${className ?? ''}`}
      {...props}
    />
  ),
  // 围栏代码块内的 code 带 class="language-*"（行内 code 没有），据此区分形态；
  // className 先解构再与默认样式合并，避免 {...props} 展开覆盖掉默认样式
  code: ({ className, ...props }) => {
    const isBlock = /language-/.test(className ?? '');
    return isBlock ? (
      <code className={`${className} font-mono`} {...props} />
    ) : (
      <code
        className={`bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-pink-600 ${className ?? ''}`}
        {...props}
      />
    );
  },
  pre: ({ className, ...props }) => (
    <pre
      className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-8 font-mono text-sm ${className ?? ''}`}
      {...props}
    />
  ),
  hr: () => <hr className="my-12 border-gray-100" />,
};

export default mdxComponents;
