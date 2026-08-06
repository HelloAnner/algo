# 组件手册

`base.html` 提供：页面骨架、全套 CSS（GitHub Primer 亮/暗双主题）、右侧编辑器 + 笔记 + 划线 + 持久化。
你（agent）只需要组装 `{{CONTENT}}`（左栏讲解）和 `{{VIZ_JS}}`（可视化步骤机），并填好 `PROBLEM` 元数据。

## 铁律

1. **只用 CSS 变量，禁止硬编码颜色**。SVG 里也一样：用 class（`svg-label` / `svg-mono` / `cell` / `cell--active` / `cell--hit` / `map-row` / `map-row--hit`），颜色自动跟随亮暗主题。
2. 单文件、零外部依赖、默认 Python、中文讲解。
3. 白板内部是例外：固定四色记号笔 + 浅色白板底，亮暗模式不变（见第 5 节）；白板 SVG 不用任何滤镜。
3. 章节用 `01`–`07` 编号，推荐顺序：题目 → 思路演进 → 可视化 → 数据结构原理 → 代码实现 → 复杂度 → 边界与变体。可裁剪，顺序不乱。

## 1. 页头（CONTENT 开头）

```html
<div class="masthead">
  <span class="brand">ALGO · 数组</span>           <!-- 主题中文名 -->
  <span class="no">LEETCODE 1</span>
</div>
<h1>两数之和</h1>
<p class="subtitle">Two Sum — 一句话题眼</p>
<div class="meta">
  <span class="tag diff-easy">简单</span>          <!-- diff-easy 用绿色；中等/困难不加 class -->
  <span class="tag">数组</span><span class="tag">哈希表</span>
</div>
```

## 2. 题目卡片 + 示例

```html
<div class="problem-card">
  <p>题目描述，行内代码用 <code class="inline">nums</code>。</p>
  <div class="example"><span class="k">输入：</span>nums = [2, 7, 11, 15], target = 9
<span class="k">输出：</span>[0, 1]</div>
</div>
<div class="insight">
  <span class="label">核心洞察</span>
  一句话说透这道题的关键。
</div>
```

## 3. 代码 tabs（讲解区，多解法）

```html
<div class="tabs">
  <button data-tab="0">解法一 · 暴力</button>
  <button data-tab="1" class="active">解法二 · 最优 ★</button>
</div>
<div class="codeblock">
<pre data-tab="0">...</pre>
<pre data-tab="1" class="active">...</pre>
</div>
```

- 手写高亮 span：`.tok-k` 关键字、`.tok-f` 函数名、`.tok-s` 字符串、`.tok-c` 注释、`.tok-n` 数字、`.tok-b` 内建函数。
- `.tabs` 后面紧跟 `.codeblock` 即可自动绑定，页面可有多组。

## 4. 复杂度表（最优行加 tr.best）

```html
<table class="cx">
  <thead><tr><th>解法</th><th>时间</th><th>空间</th><th>说明</th></tr></thead>
  <tbody>
    <tr><td>暴力</td><td class="mono">O(n²)</td><td class="mono">O(1)</td><td>...</td></tr>
    <tr class="best"><td>哈希</td><td class="mono">O(n)</td><td class="mono">O(n)</td><td>...</td></tr>
  </tbody>
</table>
```

## 5. 白板图解（精确几何 SVG，一题一张）

见 `viz/whiteboard.html`（含骨架和完整规则）。要点：白底画板 + 右上角全屏（免接线）；**禁用 feTurbulence 手绘滤镜**（会甩歪文字）；四色记号笔语义（黑=结构 / 蓝=关键问题 / 红=步骤指针 / 绿=结论）；画布三段式布局（标题 y40 / 图形 y60-210 / 注解 y240+ 行距≥34），画完自查文字包围盒不重叠。

**位置**：放在「思路演进」之后、「步骤机可视化」之前——白板讲全貌，步骤机讲推演。

## 6. 步骤机可视化（{{VIZ_JS}}）

HTML（放进 CONTENT 的某个 section）：

```html
<div class="viz">
  <svg viewBox="0 0 720 260">
    <text x="60" y="40" class="svg-label">NUMS</text>
    <g id="arr"></g>
    <g id="map"></g>
  </svg>
  <div class="viz-msg" id="viz-msg"></div>
  <div class="viz-controls">
    <button id="btn-prev">← 上一步</button>
    <button id="btn-play" class="primary">▶ 播放</button>
    <button id="btn-next">下一步 →</button>
    <button id="btn-reset">重置</button>
  </div>
</div>
```

JS（写进 {{VIZ_JS}}）：**数据驱动步骤机** —— 定义 `STEPS` 数组（每步：指针位置、容器状态、高亮、一句话解说），一个 `render()` 按当前步重绘（只改 class，不改颜色），再接播放/上一步/下一步/重置四个按钮。状态切换动画已由 CSS transition 提供，JS 不需要写动画。
完整参考实现：`leetcode/array/two-sum/index.html` 的 script 第 1 节。

页面有多个可视化时，id 加前缀区分（如 `viz2-msg`）。

## 7. 页脚

```html
<div class="footnote">
  <span>ALGO · 数组专题</span>
  <span>选中任意文字可高亮 / 写评论</span>
</div>
```

## 8. PROBLEM 元数据（script 顶部）

```js
const PROBLEM = {
  slug: 'two-sum',
  versions: {   // 右侧练习编辑器的初始 tab，种子代码给函数签名
    '暴力解法': 'def twoSum(nums, target):\n    # 提示注释\n    pass\n',
    '最优解法': 'def twoSum(nums, target):\n    pass\n',
  }
};
```

- 版本 tab 对应讲解区的解法，方便对照默写；用户可自行 `+` 新版本。
- `code` / `notes` / `marks` 由页面自动读写，不用管。
