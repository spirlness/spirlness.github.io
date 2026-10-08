import React from 'react';
import type { MDXComponents } from 'mdx/types';
import { SideNote } from './SideNote';
import { MathBlock } from './MathBlock';
import { CodeBlock } from './CodeBlock';
// 交互式组件经由 LazyInteractive 的客户端边界导入，本文件保持为服务端组件
import { SimulationContainer, PhysicsDemo } from '../interactive/LazyInteractive';
import { isSafeHref } from '@/lib/links';
import { isSafeSrcSet, isSafeMediaUrl } from '@/lib/media-srcset';
import { SmartLink } from '@/components/ui/SmartLink';

/**
 * Container classes for rendered MDX article bodies. Element typography comes
 * from @tailwindcss/typography (`prose`); the prose-* modifiers below pin the
 * Distill look (orange blockquote, bordered h2, display font headings).
 * `max-w-none` disables prose's 65ch measure — the distill-grid centre column
 * already constrains width to 800px.
 */
export const articleProse = [
  // Base typography layout
  'prose',
  'prose-lg',
  'max-w-none',
  'min-w-0',

  // Headings
  'prose-headings:font-display',
  'prose-headings:text-gray-800',

  // H2 headings
  'prose-h2:mt-12',
  'prose-h2:mb-6',
  'prose-h2:pb-2',
  'prose-h2:border-b',
  'prose-h2:border-gray-100',
  'prose-h2:text-2xl',

  // H3 headings
  'prose-h3:mt-8',
  'prose-h3:mb-4',
  'prose-h3:text-xl',

  // Blockquotes
  'prose-blockquote:border-orange-200',
  'prose-blockquote:bg-orange-50/20',
  'prose-blockquote:rounded-r-lg',
  'prose-blockquote:py-2',
  'prose-blockquote:pl-6',
  'prose-blockquote:text-gray-600',

  // Images & HR
  'prose-img:rounded-lg',
  'prose-img:my-8',
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

    return (
      <SmartLink
        href={href}
        className={`text-accent font-medium underline underline-offset-2 decoration-orange-200 hover:decoration-accent ${className ?? ""}`}
        {...props}
      >
        {children}
      </SmartLink>
    );
  },
  // 媒体目标走同一 allowlist：无 img/video/source 覆盖时，表达式 src/poster
  // 会同时绕过 content:check 与 isSafeHref，因此这里逐属性设门。
  // srcSet 同样是可指定加载目标的 URL 列表，只校验首项等于给浏览器留下选择
  // 未校验候选的机会；所以每个候选都必须过校验，任一失败即整条属性不渲染。
  img: ({ src, srcSet, srcset, alt, ...props }) => {
    // MDX 保留属性大小写，小写 srcset 是 HTML 写法但同样会到达 DOM，必须一起校验，
    // 否则它会绕过上面的门从 {...props} 原样透出。
    const declaredSrcSets = [srcSet, srcset].filter((value) => value !== undefined);
    if (
      typeof src !== "string" ||
      !isSafeMediaUrl(src) ||
      declaredSrcSets.some((value) => !isSafeSrcSet(value))
    ) {
      return null;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} srcSet={srcSet ?? srcset} alt={alt ?? ""} {...props} />
    );
  },
  video: ({ src, poster, children, ...props }) => {
    if (
      (src !== undefined && (typeof src !== "string" || !isSafeMediaUrl(src))) ||
      (poster !== undefined &&
        (typeof poster !== "string" || !isSafeMediaUrl(poster)))
    ) {
      return null;
    }
    return (
      <video src={src} poster={poster} {...props}>
        {children}
      </video>
    );
  },
  // <picture> 的标准写法只在 <source> 上给 srcSet 而不给 src，不能沿用
  // “src 必须是安全字符串”的单条件；src 与 srcSet 一旦声明就必须全部通过
  // 校验，只放行其中安全的一项仍会让未校验的候选被浏览器采用，因此任一失败
  // 即整条不渲染（失败关闭）。两者都未声明则没有可加载目标，同样不渲染。
  source: ({ src, srcSet, srcset, ...props }) => {
    const declaredSrcSets = [srcSet, srcset].filter((value) => value !== undefined);
    const srcIsSafe = typeof src === "string" && isSafeMediaUrl(src);
    const srcSetIsSafe =
      declaredSrcSets.length > 0 &&
      declaredSrcSets.every((value) => isSafeSrcSet(value));
    if (
      (src !== undefined && !srcIsSafe) ||
      declaredSrcSets.some((value) => !isSafeSrcSet(value)) ||
      (!srcIsSafe && !srcSetIsSafe)
    ) {
      return null;
    }
    return (
      <source
        src={srcIsSafe ? src : undefined}
        srcSet={srcSetIsSafe ? srcSet ?? srcset : undefined}
        {...props}
      />
    );
  },
  // iframe/object/embed/audio 同样以 URL 属性指定加载目标，且 React 19 只中和
  // javascript:，不拦 iframe 的 data:text/html 或 srcdoc，因此这四个标签也逐属性
  // 设门：目标缺失或未过 isSafeHref 一律不渲染（失败关闭）。
  iframe: ({ src, srcdoc, srcDoc, children, ...props }) => {
    // srcdoc 是整段 HTML 文档注入面，无法用 URL allowlist 表达；HTML 写法
    // srcdoc 与 JSX 写法 srcDoc 都会到达 DOM，任一出现即拒绝。
    if (srcdoc !== undefined || srcDoc !== undefined) {
      return null;
    }
    if (typeof src !== "string" || !isSafeMediaUrl(src)) {
      return null;
    }
    return (
      <iframe src={src} {...props}>
        {children}
      </iframe>
    );
  },
  // object 的加载目标在 data 属性（不是 src）上，同样只放行安全目标。
  object: ({ data, children, ...props }) => {
    if (typeof data !== "string" || !isSafeMediaUrl(data)) {
      return null;
    }
    return (
      <object data={data} {...props}>
        {children}
      </object>
    );
  },
  embed: ({ src, ...props }) => {
    if (typeof src !== "string" || !isSafeMediaUrl(src)) {
      return null;
    }
    return <embed src={src} {...props} />;
  },
  // audio 可以从自身 src 或直接子级 <source src> 加载；已声明的不安全 src
  // 仍须拒绝，且仅有无效子级不能形成可用的播放器。
  audio: ({ src, children, ...props }) => {
    const hasSafeChildSource = React.Children.toArray(children).some(
      (child) =>
        React.isValidElement<{ src?: unknown; srcSet?: unknown; srcset?: unknown }>(child) &&
        child.type === mdxComponents.source &&
        typeof child.props.src === "string" &&
        isSafeMediaUrl(child.props.src) &&
        [child.props.srcSet, child.props.srcset].every(
          (value) => value === undefined || isSafeSrcSet(value)
        )
    );
    if (
      (src !== undefined && (typeof src !== "string" || !isSafeMediaUrl(src))) ||
      (src === undefined && !hasSafeChildSource)
    ) {
      return null;
    }
    return (
      <audio src={src} {...props}>
        {children}
      </audio>
    );
  },
  // 显式小写媒体 JSX 被 MDX 视为原生标签；编译时改名到这些映射。
  get MdxImage() { return mdxComponents.img; },
  get MdxVideo() { return mdxComponents.video; },
  get MdxSource() { return mdxComponents.source; },
  get MdxIframe() { return mdxComponents.iframe; },
  get MdxObject() { return mdxComponents.object; },
  get MdxEmbed() { return mdxComponents.embed; },
  get MdxAudio() { return mdxComponents.audio; },
  // rehype-pretty-code 标记块级代码时使用 data-language，而不一定有 language-* 类。
  // 保留行内代码样式；块级代码按内容宽度展开，由外层 pre 提供横向滚动。
  code: ({ className, ...props }) => {
    const isBlock = /language-/.test(className ?? '') || 'data-language' in props;
    return isBlock ? (
      <code className={`block w-max min-w-full bg-transparent p-0 font-mono text-inherit ${className ?? ''}`} {...props} />
    ) : (
      <code
        className={`bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono text-pink-700 wrap-anywhere ${className ?? ''}`}
        {...props}
      />
    );
  },
  pre: ({ className, ...props }) => (
    <CodeBlock
      className={`min-w-0 max-w-full bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-8 font-mono text-sm ${className ?? ''}`}
      {...props}
    />
  ),
};

export default mdxComponents;
