---
name: AlgoNote
description: 面向中文算法学习者的双语言练习工作台
colors:
  workspace-white: "oklch(1 0 0)"
  panel-white: "oklch(0.995 0 0)"
  cool-surface: "oklch(0.975 0.004 260)"
  strong-surface: "oklch(0.94 0.007 260)"
  graphite-ink: "oklch(0.2 0.012 260)"
  strong-ink: "oklch(0.12 0.008 260)"
  muted-ink: "oklch(0.34 0.018 260)"
  divider: "oklch(0.88 0.008 260)"
  competition-amber: "oklch(0.56 0.14 76)"
  amber-pressed: "oklch(0.5 0.14 76)"
  amber-soft: "oklch(0.95 0.035 80)"
  verification-teal: "oklch(0.48 0.1 190)"
  success-green: "oklch(0.49 0.13 150)"
  error-red: "oklch(0.53 0.18 25)"
  editor-graphite: "oklch(0.15 0.006 260)"
  editor-text: "oklch(0.91 0.008 260)"
typography:
  display:
    fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "29px"
    fontWeight: 760
    lineHeight: 1.25
    letterSpacing: "0"
  headline:
    fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "0"
  title:
    fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0"
  body:
    fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  label:
    fontFamily: "Segoe UI, PingFang SC, Microsoft YaHei, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "0"
  code:
    fontFamily: "Cascadia Code, SFMono-Regular, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "7px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.competition-amber}"
    textColor: "{colors.workspace-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "7px 12px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "{colors.amber-pressed}"
    textColor: "{colors.workspace-white}"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "{colors.workspace-white}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "7px 12px"
    height: "34px"
  input-search:
    backgroundColor: "{colors.workspace-white}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 10px"
    height: "38px"
  panel-workspace:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.sm}"
---

# Design System: AlgoNote

## 1. Overview

**Creative North Star: "清晨的竞赛实验室"**

AlgoNote 像一张光线充足、工具各归其位的代码工作台。无色偏的内容表面负责可读性，竞赛琥珀只标记主要动作与进度，石墨编辑器承接长时间编码；整体保持成熟开发工具的密度与秩序。

练习工作流必须始终先于品牌表达。桌面端以题目、编辑器和运行结果构成稳定工作台，移动端把同一流程压缩为题目、代码、结果三段；任何装饰都不能延迟选题、编码或验证。

**Key Characteristics:**

- 高信息密度，依靠对齐、分隔线和稳定尺寸建立层级
- 白色阅读区与石墨代码区形成明确的任务分工
- 琥珀色只服务主要动作，青绿色独立承担链接与校验状态
- 桌面结构化分栏，移动端顺序标签切换
- 答案、提示与第三方来源均采用渐进揭示

## 2. Colors

这是限制性色彩系统：中性色覆盖绝大多数表面，琥珀用于动作，青绿用于验证与链接，语义状态各自保留独立色相。深色主题通过相同 CSS 令牌重映射，不创建第二套组件语法。

### Primary

- **竞赛琥珀** (`--color-primary`, `oklch(0.56 0.14 76)`): 只用于运行、问助教、当前进度与关键选中状态。
- **按压琥珀** (`--color-primary-hover`, `oklch(0.5 0.14 76)`): 主要动作的悬停和强调文字，不能作为大面积背景。
- **琥珀浅层** (`--color-primary-soft`, `oklch(0.95 0.035 80)`): 当前路径、用户消息与轻量选中态。

### Secondary

- **校验青绿** (`--color-accent`, `oklch(0.48 0.1 190)`): 链接、输入焦点和第三方参考代码标识。
- **完成绿** (`--color-success`, `oklch(0.49 0.13 150)`): 仅表示运行通过或练习完成。
- **错误红** (`--color-error`, `oklch(0.53 0.18 25)`): 仅表示失败、错误和困难难度。

### Neutral

- **工作台白** (`--color-bg`, `oklch(1 0 0)`): 页面与输入主背景。
- **冷静表面** (`--color-surface`, `oklch(0.975 0.004 260)`): 侧栏、工具栏和表头。
- **石墨墨色** (`--color-ink`, `oklch(0.2 0.012 260)`): 正文与控件文本。
- **细分隔线** (`--color-border`, `oklch(0.88 0.008 260)`): 面板、表格和工具栏边界。
- **编辑器石墨** (`--color-editor`, `oklch(0.15 0.006 260)`): Monaco 编辑器与代码块背景。

**The Ten Percent Rule.** 饱和色在任何一屏不超过约 10%；琥珀一旦不再稀缺，动作层级就失效。

**The Semantic Hue Rule.** 状态必须同时使用文字或图标，颜色只做增强，绝不能单独承担含义。

## 3. Typography

**Display Font:** Segoe UI（中文回退为 PingFang SC、Microsoft YaHei）
**Body Font:** Segoe UI（中文回退为 PingFang SC、Microsoft YaHei）
**Label/Mono Font:** Cascadia Code（回退为 SFMono-Regular、Consolas）

**Character:** 单一技术型系统无衬线覆盖产品界面，等宽字体仅用于代码、复杂度和运行输出。所有字距固定为 `0`，产品标题使用固定字号，不随视口连续缩放。

### Hierarchy

- **Display** (760, 29px, 1.25): 仅用于题库页主标题，移动端降到 23px。
- **Headline** (750, 22px, 1.3): 题目名称和空状态标题。
- **Title** (700, 16px, 1.4): 分组标题、助教标题和重点行。
- **Body** (400, 14px, 1.5): 题意摘要、说明与主要表格内容；长文限制在 65-75ch。
- **Label** (650, 12px, 1): 按钮、筛选、状态与元数据，不使用全大写或追踪字距。
- **Code** (400, 14px, 22px): 编辑器；控制台可降至 12px，但仍保持 1.6 左右行高。

**The Tool Type Rule.** 控件标签永远使用清晰的界面字号；展示型大字、负字距和杂志式字体禁止进入工作台。

## 4. Elevation

系统默认完全扁平，以相邻表面明度、1px 分隔线和 4px 间隙表达结构。静止面板没有阴影；唯一的结构性阴影属于从右侧覆盖内容的 AI 助教抽屉 (`-8px 0 16px oklch(0 0 0 / 0.18)`)。

### Shadow Vocabulary

- **抽屉侧向阴影** (`-8px 0 16px oklch(0 0 0 / 0.18)`): 只证明助教抽屉位于工作台之上，不可复用于卡片或按钮。

**The Flat-By-Default Rule.** 静止表面不悬浮；如果没有真实遮挡关系，就用色阶和分隔线，不用阴影。

## 5. Components

组件克制、紧凑、可预测。标准圆角为 4px，聊天消息可使用 7px；所有交互必须具有悬停、键盘焦点、按下、禁用、加载和错误状态。

### Buttons

- **Shape:** 紧凑矩形，默认 4px 圆角，最小高度 34px，内边距 7px 12px。
- **Primary:** 竞赛琥珀背景与高对比文字，仅用于一个局部区域内最重要的命令。
- **Hover / Focus:** 150ms 颜色过渡；悬停进入按压琥珀，键盘焦点使用 2px 校验青绿轮廓和 2px 偏移。
- **Secondary / Ghost:** 次按钮使用工作台白、1px 分隔线；纯图标按钮固定 34px 正方形并提供 tooltip/aria-label。

### Chips

- **Style:** 4px 圆角、11-12px 字号和语义浅色背景，用于难度、标签与代码覆盖。
- **State:** 选中筛选使用表面变化与字重，同时保留可读文字；不得只靠颜色区分。

### Cards / Containers

- **Corner Style:** 面板为 4px，聊天消息为 7px；页面章节不包成卡片。
- **Background:** 阅读面板使用工作台白或面板白，工具栏使用冷静表面，编辑器使用编辑器石墨。
- **Shadow Strategy:** 默认无阴影，遵守 Flat-By-Default Rule。
- **Border:** 表格、工具栏和相邻面板使用 1px 细分隔线。
- **Internal Padding:** 紧凑控件以 8-12px 为主，正文区域使用 22-34px。

### Inputs / Fields

- **Style:** 38px 高、4px 圆角、工作台白背景与 1px 细分隔线。
- **Focus:** 边框切换为校验青绿，并添加 2px 青绿浅层轮廓。
- **Error / Disabled:** 错误使用错误红及其浅层；禁用保持可辨文字并降低整体不透明度到 0.48。

### Navigation

- 顶栏固定 54px，当前导航通过文字加深和底部 2px 琥珀线表示；侧栏以 38px 行高密集浏览，移动端转为横向滚动路径条。工作台移动端使用固定三段标签，不创造手势隐藏功能。

### Workspace

- 桌面端题目面板跨两行，编辑器位于右上，190px 结果面板位于右下；面板间距固定为 5px。820px 以下切换为单面板标签流，任何动态文本都不得改变工具栏或标签尺寸。

## 6. Do's and Don'ts

### Do:

- **Do** 保留题目、代码、测试结果这一成熟且可预期的练习工作流。
- **Do** 使用结构性响应布局：桌面分栏，移动端题目、代码、结果三标签切换。
- **Do** 默认隐藏完整思路与答案，并通过提示、思路、实现逐层揭示。
- **Do** 让状态同时拥有颜色、图标或文字，并维持 WCAG 2.2 AA 对比度。
- **Do** 固定工具栏、图标按钮、编辑器和表格列的尺寸，防止状态变化导致布局跳动。

### Don't:

- **Don't** 使用营销落地页式的大标题和卡片堆叠。
- **Don't** 使用花哨渐变、玻璃拟态或无意义动效。
- **Don't** 复制 LeetCode 的品牌资产或制造官方从属关系。
- **Don't** 把完整受版权保护的题面作为自有内容批量转载。
- **Don't** 对 LeetCode 进行像素级仿制；只保留用户熟悉的练习流程。
- **Don't** 把页面章节做成浮动卡片，或在卡片内继续嵌套卡片。
- **Don't** 使用超过 7px 的常规面板圆角、装饰性宽阴影、渐变文字或彩色侧边条。
