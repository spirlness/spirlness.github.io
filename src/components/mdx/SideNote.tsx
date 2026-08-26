"use client";

import React, { useState } from 'react';

interface SideNoteProps {
  children: React.ReactNode;
  label?: string;
}

/**
 * Distill 式侧边注。
 *
 * 桌面端的 aside 绝对定位到正文右侧留白，锚点是组件自身在文档流中的位置。
 * 因此要把 <SideNote> 放在被注释块的**前面**：放在后面会落进下一个块的
 * 外边距区，看起来像在注释下一节标题。
 *
 * 断点是 1400px 而不是 lg(1024px)。侧注右边缘落在
 *   (cw - 800)/2 + 800 + 40 + 240 = cw/2 + 680
 * 其中 cw 是 documentElement.clientWidth，即**扣掉滚动条后**的排版宽度，
 * 所以不越界的条件是 cw >= 1360。但媒体查询匹配的是含滚动条的 innerWidth，
 * 两者相差一个滚动条宽度（Windows 上实测 15px，覆盖式滚动条为 0），因此
 * 断点必须比 1360 更高；取 1400 留出余量，避免滚动条宽度和亚像素取整把
 * 文档重新推出横向滚动。
 *
 * 1024px 时右侧留白仅 112px，放不下 240px 的侧注，所以没有"缩窄一点"的
 * 中间方案。下面两个分支必须用同一个断点，否则中间区段会两者都隐藏、
 * 侧注整体消失。
 */
export const SideNote: React.FC<SideNoteProps> = ({ children, label = "Note" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Narrow view (incl. most laptops): collapsible inline note */}
      <div className="min-[1400px]:hidden my-4 border-l-4 border-orange-200 bg-orange-50/30 p-4 rounded-r-md">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-sm font-medium text-orange-800"
        >
          <span>{label}</span>
          <span className="text-lg leading-none">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div className="mt-2 text-sm text-gray-700 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-3">
            {children}
          </div>
        )}
      </div>

      {/* Wide view: true margin note，对齐紧随其后的块的顶部。
          共享映射的 p 覆盖规则（text-lg/gray-700/mb-6）会渗入侧注，用任意
          变体把侧注内段落拉回 text-sm 小字号。 */}
      <aside className="hidden min-[1400px]:block absolute left-[calc(100%+2.5rem)] top-0 w-[240px] text-sm text-gray-500 italic border-l-2 border-orange-100 pl-4 leading-relaxed [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-gray-500 [&_p]:mb-2">
        {children}
      </aside>
    </div>
  );
};

export default SideNote;
