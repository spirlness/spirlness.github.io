import React from 'react';
import type { MDXComponents } from 'mdx/types';
import { SideNote } from './SideNote';
import { MathBlock } from './MathBlock';
// 交互式组件经由 LazyInteractive 的客户端边界导入，本文件保持为服务端组件
import { SimulationContainer, PhysicsDemo } from '../interactive/LazyInteractive';
import { isExternalHref, isSafeHref } from '@/lib/links';

/**
 * Container classes for rendered MDX article bodies. Element typography comes
 * from @tailwindcss/typography (`prose`); the prose-* modifiers below pin the
 * Distill look (orange blockquote, bordered h2, display font headings).
 * `max-w-none` disables prose's 65ch measure — the distill-grid centre column
 * already constrains width to 800px.
 */
export const articleProse = [
  'prose prose-lg max-w-none',
  'prose-headings:font-display prose-headings:text-gray-800',
  'prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100 prose-h2:text-2xl',
  'prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-xl',
  'prose-blockquote:border-orange-200 prose-blockquote:bg-orange-50/20 prose-blockquote:rounded-r-lg prose-blockquote:py-2 prose-blockquote:pl-6 prose-blockquote:text-gray-600',
  'prose-img:rounded-lg prose-img:my-8',
  'prose-hr:border-gray-100',
].join(' ');

/**
 * Custom MDX component mapping for Distill-style layout.
 *
 * Element typography (h2/p/ul/table/…) lives in `articleProse` via the
 * typography plugin, not in per-element overrides. Only the entries that carry
 * behavior or must coexist with rehype-pretty-code output stay here:
 * - `a` adds target=_blank + accent styling for external links;
 * - `pre`/`code` keep the dark block / pink inline look over shiki token spans
 *   (utilities on the element beat the plugin's `:where()` selectors).
 * There is deliberately no h1 mapping and prose h1 styling is reset in
 * globals.css: the page shell renders the article's only <h1>, so a stray
 * body-level `#` degrades to plain text. Post sections start at `##`.
 */
export const mdxComponents: MDXComponents = {
  // 基础组件
  SideNote,
  MathBlock,

  // 交互式组件
  SimulationContainer,
  PhysicsDemo,

  a: ({ className, href, children, ...props }) => {
    if (!isSafeHref(href)) {
      return <span className={className}>{children}</span>;
    }

    const external = isExternalHref(href);
    return (
      <a
        href={href}
        className={`text-accent font-medium underline underline-offset-2 decoration-orange-200 hover:decoration-accent ${className ?? ""}`}
        {...props}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  // 围栏代码块内的 code 带 class="language-*"（shiki 会再加 token 颜色类），
  // 行内 code 没有；className 先解构再与默认样式合并，避免 {...props} 展开覆盖默认样式
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
};

export default mdxComponents;
