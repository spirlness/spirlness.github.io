# 物理与深度学习个人学术主页重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底移除旧项目，并使用 Next.js + MDX + Three.js 构建一个 Distill 风格的高性能个人学术主页。

**Architecture:** 采用静态生成 (SSG) 架构，通过 MDX 实现交互式内容，自定义解析器处理 BibTeX 论文管理。

**Tech Stack:** Next.js 14, Tailwind CSS, TypeScript, MDX, KaTeX, Three.js (React Three Fiber).

---

### Task 1: 工作区清理与环境初始化

**Files:**
- Modify: `.` (Delete existing legacy files)
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`

- [ ] **Step 1: 删除旧项目文件**
保留 `.git` 和 `docs/`。
运行: `ls -Exclude .git,docs | Remove-Item -Recurse -Force`

- [ ] **Step 2: 初始化 Next.js 项目**
运行: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir false --import-alias "@/*" --use-npm --yes`

- [ ] **Step 3: 安装核心科研相关依赖**
安装 KaTeX, Three.js 相关库。
运行: `npm install lucide-react next-mdx-remote remark-math rehype-katex katex bibtex-parse-js three @react-three/fiber @react-three/drei`

- [ ] **Step 4: 提交初始化状态**
```bash
git add .
git commit -m "chore: cleanup legacy files and init next.js project"
```

### Task 2: 建立排版系统与全局样式

**Files:**
- Modify: `app/globals.css`
- Create: `lib/fonts.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 配置学术字体**
```typescript
// lib/fonts.ts
import { Inter, Source_Serif_4, DM_Serif_Display } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif' });
export const display = DM_Serif_Display({ weight: '400', subsets: ['latin'], variable: '--font-display' });
```

- [ ] **Step 2: 配置 Tailwind 全局样式**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #fdfdfd;
  --accent: #d86b4a;
}

body {
  @apply bg-[#fdfdfd] text-gray-900;
  font-feature-settings: "kern" 1, "liga" 1;
}

.distill-grid {
  display: grid;
  grid-template-columns: 1fr min(800px, 100%) 1fr;
}
```

- [ ] **Step 3: 应用到根布局并验证**
运行: `npm run dev` 确保页面能正常渲染。

### Task 3: 核心 MDX 组件实现 (SideNote & Math)

**Files:**
- Create: `components/mdx/SideNote.tsx`
- Create: `components/mdx/MathBlock.tsx`

- [ ] **Step 1: 实现侧边注组件**
```tsx
// components/mdx/SideNote.tsx
export const SideNote = ({ children }: { children: React.ReactNode }) => (
  <aside className="hidden lg:block absolute left-[105%] w-[240px] text-sm text-gray-500 italic border-l-2 border-orange-100 pl-4">
    {children}
  </aside>
);
```

- [ ] **Step 2: 实现数学块组件**
集成 KaTeX。

- [ ] **Step 3: 提交组件代码**
```bash
git add components/mdx/
git commit -m "feat: add basic MDX components for Distill layout"
```

### Task 4: BibTeX 论文引擎与页面实现

**Files:**
- Create: `lib/bibtex.ts`
- Create: `content/references.bib`
- Create: `app/publications/page.tsx`

- [ ] **Step 1: 编写 BibTeX 解析逻辑**
- [ ] **Step 2: 创建 Publication 列表页面**
支持按年份排序。

### Task 5: 交互式仿真容器 (Three.js)

**Files:**
- Create: `components/interactive/SimulationContainer.tsx`
- Create: `components/interactive/PhysicsDemo.tsx`

- [ ] **Step 1: 封装 Three.js 渲染容器**
- [ ] **Step 2: 编写一个简单的物理演示（如粒子运动）**

### Task 6: 首页与博客流集成

- [ ] **Step 1: 编写首页学术简介**
- [ ] **Step 2: 配置 MDX 路由处理程序**
- [ ] **Step 3: 最终集成测试与部署配置**
