# 完善 / 修改已有题解

触发："给 two-sum 加个 DFS 解法"、"这个可视化不对"、"补一段单调栈原理"、"加个变种"。

## 通用规则

1. 只动 `{{CONTENT}}` 区域、`{{VIZ_JS}}` 区域和 `PROBLEM.versions`。**不碰**骨架 CSS 和基础设施 JS（store/编辑器/划线/boot）。
2. 新元素风格先查 `~/algo/template/COMPONENTS.md` 有没有现成组件，没有再考虑手写。
3. 划线评论用 text-quote 锚点：小改文字安全，大段删除会让对应锚点静默失效——动大段前提醒用户一句。
4. 改完 `algo open <slug>` 让用户验收。

## 场景 A：加一个解法

1. `.tabs` 里加一个 `<button data-tab="N">解法N · xxx</button>`（N 顺延）。
2. `.codeblock` 里加 `<pre data-tab="N">...</pre>`，手写高亮 span。
3. ★ 标记检查：最优解才带 ★；新解法是新的最优就把旧 ★ 去掉、active 换过去。
4. 复杂度表加一行；讲解正文补一段"什么时候用这个"。
5. `PROBLEM.versions` 加同名种子（函数签名 + `pass`），方便用户对着默写。

## 场景 B：加一个可视化

1. 新 `<section>` 放在合适位置（通常在思路之后）。
2. 从 `template/viz/` 选最近似的骨架复制改造。
3. **所有 id 加唯一前缀**（如 `viz2-arr`、`viz2-msg`、`viz2-prev`/`viz2-play`/`viz2-next`/`viz2-reset`），JS 里同步。
4. `STEPS` 每步一句话解说，结尾步给结论。

## 场景 C：补数据结构原理

- 新 `<section>` 编号顺延，用 `example` 块写公式/结构示意，必要时 `box box--tip` 给记忆点、`box box--warn` 给坑。
- 保持在"代码实现"之前。

## 场景 D：修改讲解文字

- 直接改。注意 `code.inline` 包术语、`<strong>` 标关键判断，保持排版一致。

## 场景 E：修 bug（可视化不动/样式异常）

- 先对照 two-sum 参考实现的同位置代码找差异，九成是 id 对不上或 class 名打错。
- 基础设施问题（编辑器/保存/划线）才动骨架 JS——且必须同步改 `template/base.html` 和 two-sum。
