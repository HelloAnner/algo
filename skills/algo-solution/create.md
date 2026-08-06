# 创建新题解

触发："讲一下 LC 146"、"创建 LRU Cache 题解"、"来一道动态规划"。

## 流程

### 1. 确认四要素

- **topic**：19 个内置主题之一（array / linked-list / hash / string / two-pointers / sliding-window / stack / queue / tree / graph / dp / greedy / backtracking / binary-search / heap / bit / math / sort / interval / trie）。拿不准选最贴切的，不要新建主题。
- **slug**：小写连字符，用英文题名（`lru-cache`、`merge-intervals`）。
- **title / number**：中文标题 + LC 题号。
- 用户没给题号不影响创建，title 缺省用 slug。

### 2. 生成骨架

```bash
algo new <slug> --topic <topic> --title <标题> --number <题号>
```

### 3. 读规范

按顺序读：
1. `~/algo/template/COMPONENTS.md` —— 组件索引 + 铁律
2. 本题要用的组件文件（`~/algo/template/cards/`、`viz/` 等）
3. 拿不准可视化怎么写 → 读 `~/algo/leetcode/array/two-sum/index.html` 的 script 第 1 节

### 4. 填充内容（编辑生成的 index.html）

替换骨架 TODO，按以下章节顺序组装（可裁剪，顺序不乱）：

| 章节 | 内容要求 |
|---|---|
| 页头 | 中文标题、副标题一句话题眼、难度 tag（简单用 `diff-easy`）、主题 tag |
| 01 题目 | `problem-card`：描述 + `example` 输入输出块；紧跟一个 `insight` 核心洞察 |
| 02 思路演进 | 暴力 → 瓶颈 → 优化方向，面试叙事线，三段式 |
| 03 可视化 | 至少一个：SVG 步骤机（见第 5 步） |
| 04 数据结构原理 | 涉及哈希/堆/并查集/单调栈/平衡树等必须讲原理；纯技巧题可省 |
| 05 代码实现 | `tabs` 多解法（暴力 + 最优，有变种再加），最优解 tab 名带 ★ 且默认 active；手写高亮 span（`tok-k/f/s/c/n/b`） |
| 06 复杂度 | `cx` 表全解法对比，最优行 `tr.best` |
| 07 边界与变体 | 边界 case 列表 + 变体题（带 LC 题号 + 一句为什么不同） |
| 页脚 | `ALGO · <主题>专题` |

### 5. 可视化（{{VIZ_JS}} 区域）

- 模式：**数据驱动步骤机**。`STEPS` 数组（每步 = 指针/容器状态/高亮/一句解说）+ `render()` 重绘（只切 class，动画交给 CSS transition）+ 播放/上一步/下一步/重置四按钮。
- 数组/链表/树/图/网格/DP 表/栈队列分别用 `template/viz/` 下对应骨架改，不要从零造。
- SVG 颜色只用 class：`cell`（方块）/`vc`（圆点）/`edge`（连线），状态修饰 `--active`/`--hit`/`--seen`/`--dim`；文字 `svg-label`/`svg-mono`/`viz-note`。
- 多个可视化时 id 加前缀（`viz2-msg`、`viz2-prev`…）。

### 6. PROBLEM.versions（右侧练习编辑器种子）

- 版本名对应讲解区解法（"暴力解法"/"最优解法"），种子给函数签名 + 一行提示注释 + `pass`。
- 用户会对着讲解默写，种子不要给完整答案。

### 7. 自检清单（交付前逐项过）

- [ ] 全文无硬编码十六进制颜色（`grep -n '#[0-9a-fA-F]\{3,6\}'`，只允许出现在 `:root` 变量定义里——本题 HTML 里应一个都没有）
- [ ] 没有 `<script src=` / `<link` 外部引用
- [ ] `.tabs` 后紧跟 `.codeblock`，`data-tab` 一一对应，active 只有一个
- [ ] 可视化按钮全部可点（id 与 JS 对得上）
- [ ] `PROBLEM.slug` 与目录名一致
- [ ] 暗色模式下 SVG 文字/形状可读（因为全走 class，理论自动成立）

### 8. 交付

```bash
algo open <slug>
```

告诉用户：讲解在左侧、右侧可以默写练习、选中文字可划线评论。
