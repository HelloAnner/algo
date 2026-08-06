# algo CLI 参考

全局命令 `algo`（bun + TypeScript，源码 `~/algo/cli/src/index.ts`）。
需要 `~/.bun/bin` 在 PATH；安装/重装：`cd ~/algo && make install`。

## 命令

| 命令 | 说明 |
|---|---|
| `algo new <slug> --topic <t> [--title T] [--number N]` | 从 `template/base.html` 生成 `leetcode/<t>/<slug>/index.html` 骨架，并在 db 注册（created/due=今天） |
| `algo open [slug]` | 打开题目到浏览器；无参 = 自动选最紧的一道待复习题；服务没起会自动后台起；记录 `opened` |
| `algo serve` | 前台起本地服务（端口 7717）：静态服务 `~/algo` + 进度 API |
| `algo list [--topic t]` | 按主题分组列出所有题，●=待复习 ○=未到期 |
| `algo today` | 待复习清单，逾期在前，带上次评分 |
| `algo done <slug> --rating <1-5>` | 记录一次复习，更新间隔和下次复习日（简化 SM-2） |
| `algo stats` | 总题数 / 复习次数 / 连续天数 / 待复习数 / 主题分布 |

## 主题（--topic 可选值）

array, linked-list, hash, string, two-pointers, sliding-window, stack, queue, tree, graph, dp, greedy, backtracking, binary-search, heap, bit, math, sort, interval, trie

不在表里的也能用（原样当标签），但优先用内置主题。

## 数据：`~/.algo/db.json`

首次任何操作自动初始化。结构：

```json
{
  "version": 1,
  "problems": {
    "<slug>": {
      "topic": "array", "title": "两数之和",
      "created": "2026-08-06", "due": "2026-08-08", "interval": 2,
      "reviews": [{ "date": "2026-08-06", "rating": 4 }],
      "opened": "…ISO…", "updated": "…ISO…",
      "code": { "暴力解法": "def …" },   // 页面编辑器自动写
      "order": ["暴力解法"],
      "notes": "…",                      // 页面笔记自动写
      "marks": [{ "id", "text", "prefix", "suffix", "comment" }]  // 划线评论自动写
    }
  }
}
```

- `code/order/notes/marks` 由 HTML 页面读写（serve 模式）；**不要手改 db.json**。
- `due/interval/reviews` 由 `algo done` 维护。
- 有效截止日 = `due` → `opened` → `updated` 的第一个（所以没走 `new` 创建的题也能进复习流）。

## HTTP API（serve 模式，端口 7717）

- `GET /api/state?slug=<slug>` → 该题的 code/notes/marks 等
- `PUT|POST /api/state?slug=<slug>` → 合并写入，自动盖 `updated`
- `GET /api/health` → `{ ok: true }`
- 其他路径 → 静态文件（`~/algo` 为根，目录自动补 `index.html`）

页面用 `file://` 直开时降级 localStorage（不经过此 API）。
