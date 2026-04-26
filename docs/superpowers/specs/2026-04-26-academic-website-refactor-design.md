# 设计规格说明书: 物理与深度学习个人学术主页 (Distill 风格)

## 1. 项目愿景
构建一个现代、高性能且具有极高学术审美的个人主页。该主页不仅是个人简历，更是一个能够展示“交互式研究”的实验场，特别针对物理模拟和深度学习模型的可视化进行优化。

## 2. 目标受众
- 学术同行与招聘委员会
- 潜在的研究合作伙伴
- 关注深度学习与物理交叉学科的开发者与学生

## 3. 技术栈
- **核心框架**: Next.js 14+ (App Router)
- **编程语言**: TypeScript (类型安全对物理计算至关重要)
- **样式方案**: Tailwind CSS (支持高度定制的 Distill 布局)
- **内容引擎**: MDX (next-mdx-remote 或 Contentlayer)
- **可视化**: 
    - **物理/3D**: Three.js + React Three Fiber
    - **图表/数据**: Recharts / D3.js
- **数学引擎**: KaTeX (SSR 渲染，无闪烁)
- **部署**: GitHub Pages (静态生成 SSG)

## 4. 核心页面设计
### 4.1 首页 (Home)
- **Hero**: 简洁的文字介绍 + 动态科研兴趣标签。
- **News/Timeline**: 垂直时间轴展示近期学术动态。
- **Focus Area**: 三个核心研究方向的卡片化展示。

### 4.2 论文页 (Publications)
- **自动管理**: 监听根目录下的 `references.bib`。
- **智能列表**: 自动按年份分组，高亮显示本人姓名。
- **互动标签**: 每个条目包含 PDF, Code, arXiv, BibTeX (弹窗) 按钮。

### 4.3 博客系统 (Research Blog)
- **Distill 布局**: 
    - 宽版心 (800px) 用于正文。
    - 右侧边缘 (250px) 用于 `<SideNote>`。
- **行内引用**: `[@li2024algorithmic]` 形式的引用，点击跳转文末参考文献。
- **交互组件**: 预留 `<SimulationContainer />` 接口，支持嵌入交互式物理场模拟。

### 4.4 项目画廊 (Projects)
- 响应式网格布局，展示独立研究项目。
- 支持预览 GIF 或 MP4 视频。

## 5. 视觉规范
- **字体**:
    - 标题: `DM Serif Display`
    - 正文: `Source Serif Pro`
    - 代码/公式: `Fira Code` / `Latin Modern` (KaTeX)
- **色彩**:
    - 背景: Academic White (#FDFDFD)
    - 强调色: Research Orange (#D86B4A) / Physics Blue (#1A365D)
- **动效**: 极致平滑的淡入淡出，交互式 Demo 采用懒加载策略以保证首屏性能。

## 6. 数据结构 (Content Structure)
- `/content/posts/*.mdx`: 博客文章。
- `/content/projects/*.json`: 项目元数据。
- `/content/references.bib`: 论文源数据。
- `/components/interactive/*`: 存放自定义的物理模拟 React 组件。

---
**版本**: 1.0  
**状态**: 待评审
