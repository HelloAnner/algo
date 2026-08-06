---
name: algo-solution
description: LeetCode 算法题解的创建、完善与复习（单文件 HTML，论文版式 + GitHub 亮暗配色）。仅在用户明确提到算法相关需求时触发，关键词：算法、算法题、刷算法、复习算法、学算法、题解、LeetCode、algo（例如“我们来复习一下今天的算法”“讲一道算法题”“今天学什么算法”“这道算法题帮我完善”）。与算法无关的请求不要使用本 skill。
---

# Algo 题解工作流 · 总入口

## 目录约定（一切路径基于此）

| 什么 | 在哪 |
|---|---|
| 题解库 | `~/algo/leetcode/<topic>/<slug>/index.html`，每题一个自包含单文件 |
| 页面模板 | `~/algo/template/base.html` |
| 组件库 | `~/algo/template/<类别>/`，索引见 `~/algo/template/COMPONENTS.md` |
| 参考实现（审美基准） | `~/algo/leetcode/array/two-sum/index.html` |
| 数据（勿手改） | `~/.algo/db.json` —— 代码版本/笔记/划线/复习记录 |
| CLI | 全局 `algo`，命令详见 [cli.md](cli.md) |

## 任务路由：先判断用户要干什么，读对应文件再动手

| 任务 | 必读 |
|---|---|
| 创建新题解（"讲一下 LC xxx"） | [create.md](create.md) |
| 完善/修改已有题解（加解法、加可视化、改讲解） | [update.md](update.md) |
| 复习相关（"今天复习什么"、"这题复习完了"） | [review.md](review.md) |
| CLI 任何用法、数据结构 | [cli.md](cli.md) |

组装 HTML 内容前，**必读** `~/algo/template/COMPONENTS.md` + 用到的组件文件。

## 红线（所有任务通用）

1. 零外部依赖：无 CDN、无字体包、无高亮库，一切留在单文件内。
2. 颜色只用 CSS 变量；SVG 颜色只用 class（`cell`/`vc`/`edge` + `--active`/`--hit`/`--seen`/`--dim`），禁止硬编码色值。
3. 默认 Python，中文讲解。
4. 不改 `base.html` 的基础设施（编辑器/持久化/划线/主题）；确需改进时改 base.html 并同步 two-sum。
5. 亮暗主题自动跟随系统，不加手动开关。
6. 数据结构优先复用 `~/algo/template/` 现有组件；新展示形式先检查组件库有没有近似的。
