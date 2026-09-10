# AGENTS.md

给 AI coding agent 的项目上下文。改动本仓库前先读这份文件。

## 项目是什么

一个用于**面试算法练习**的本地仓库：在终端里写 C++（ACM 模式），编辑体验尽量接近 LeetCode 网页编辑器——轻量、清爽。

初衷是把刷题变成可沉淀的闭环：题目、代码、笔记、复盘全部落在文件系统里，用 git 追踪，而不是散落在网页收藏夹里。

改代码时**不要破坏**的三件事：

1. **一条命令建题**：`algo two-sum` 直接得到一个可编译、可对拍的最小目录。
2. **编辑体验清爽**：micro 保留语法高亮和括号/引号自动补全，但**不要任何波浪线式报错**（详见 `cli/micro.md`，那里解释了原理与还原方法）。
3. **零运行时依赖**：CLI 只用 Bun + Node 内置模块，不引入第三方 npm 包。

---

## 提交与推送（硬性约定）

**每完成一个自洽的改动，就在同一轮里 commit + push。** 不要攒批，不要在回答结束时留下一堆未提交的改动。

标准流程：

```bash
cd /Users/anner/algo
make -C cli typecheck        # 改了 TS 就跑
make -C cli test             # 改了模板 / CLI 行为就跑
git add -A
git commit -F /tmp/msg.txt    # 提交信息见下方格式
git push origin main
git log --oneline -2         # 确认提交
git status --short           # 确认干净（应无输出）
```

规则：

1. **粒度**：一个功能 / 一次修复 = 一个 commit。不要把两件不相干的事混在一起（同一件事的代码 + 文档 + 测试除外）。
2. **信息格式**：首行 `<type>: <一句话说清做了什么>`，type 取 `feat` / `fix` / `docs` / `refactor` / `chore` / `test`；首行尽量不超过 72 字符。需要解释时空一行后用 `- ` 列要点。中英文皆可，与仓库历史保持一致（目前是中文）。
3. **必须 push**：`git commit` 之后紧跟 `git push origin main`，并确认输出里出现 `main -> main`。**提交但不推送 = 没提交。**
4. **提交前自检**：确认 `git status --short` 里没有被暂存的 `node_modules/`、`dist/`、`.env`、`*.bak-*` 等不该进仓库的东西（`.gitignore` 已覆盖前者，仍要扫一眼）。
5. **结束时**：工作区必须干净（`git status --short` 无输出）。若确有文件不该提交，在回答里说明是哪个、为什么。
6. **删除也算改动**：移除文件、目录、废弃文档要一并进 commit，不要留在工作区。
7. **别问要不要提交**，直接做；只有遇到「无法判断该不该入库」或「push 被拒绝」才停下来问。

提交信息示例：

```
feat: 支持随机数据对拍（algo gen + make stress）

- gen.cpp 生成随机数据，stress.sh 循环比对 solution 与 brute
- 新增 algo gen [目录] 命令
- cli/README.md 补一段对拍用法
```

---

## 目录结构

```
algo/
├── Makefile            # 根入口：原样转发到 cli/Makefile
└── cli/                # 全部实现
    ├── src/            # index(分发) / flags(参数) / add(题面解法) / scaffold / list / run / micro / doctor / util
    ├── assets/         # 模板：solution.cpp / make.tmpl / problem.md.tmpl / solution.md.tmpl / README.tmpl / init.lua
    ├── scripts/        # smoke-test.sh
    ├── micro.md        # micro 编辑器插件与配置详解 —— micro 相关改动的唯一依据
    └── README.md       # 安装与用法
```

`algo <名字>` 在**当前目录**生成：

```
<slug>/
├── problem.md     # 题面描述（独立 md）
├── solution.md    # 解法思路（独立 md）
├── solution.cpp   # ACM 实现：读 stdin、写 stdout
├── in.txt         # 样例输入
├── out.txt        # 期望输出
├── Makefile       # run / raw / check / debug / build / clean（run 等跑完自动删二进制）
├── README.md      # 卡片：链接 / 难度 / 标签 / 状态 / 复盘记录
└── .gitignore     # 忽略编译产物
```

安装方式是 `make install`：`bun build` 出 `cli/dist/algo.js`，在 `~/.local/bin/algo` 放一个 `exec bun ...` 的轻量启动器，然后合并 micro 配置。源码改动**即刻生效**，无需重新安装（除非改的是启动器本身）。

---

## 添加题目（`algo add`，AI 常用）

题面和解法各占一个独立 md：`problem.md`（题面）与 `solution.md`（解法思路）。
两个模板里都埋了 `<!-- algo:todo ... -->` 标记，`algo list` 靠它判断写没写，写完删掉即可。

给 AI 用最顺手的是 **JSON 一次性投喂**：

```bash
cat > /tmp/spec.json <<'EOF'
{
  "name": "two-sum",
  "title": "两数之和",
  "link": "https://leetcode.cn/problems/two-sum/",
  "difficulty": "简单",
  "tags": ["数组", "哈希表"],
  "problem": "## 题目描述\\n...",
  "solution": "## 思路\\n..."
}
EOF
algo add --json /tmp/spec.json     # 或 --json - 从 stdin 读
```

也可以走命令行（长文本用 `--xxx-file`，别在 argv 里硬塞 markdown）：

```bash
algo add two-sum --title "两数之和" --difficulty 简单 --tags 数组,哈希表 \
  --problem-file p.md --solution-file s.md
```

规则：

- 目录不存在 → 建全套；**目录已存在 → 只更新显式给出的那个 md**，绝不动 `solution.cpp` / `in.txt` / `out.txt`，也**不覆盖 `README.md`**（免得冲掉复盘记录）。要整套重来用 `--force`。
- `--problem-file -` / `--solution-file -` 表示从 stdin 读；两个都用 `-` 会报错，这种情况改用 `--json -`。
- `name` 命令行优先于 JSON；`--title` / `--link` / `--difficulty` / `--tags` 同理。

---

## 怎么开发 / 验证

```bash
cd cli
bun run src/index.ts <args>   # 直接跑源码，迭代最快
make typecheck                # tsc --noEmit
make test                     # 冒烟测试：建题 → 真编译 → 对拍 → list → setup --dry-run
make install                  # 打包 → ~/.local/bin/algo → 合并 micro 配置
make doctor                   # 环境自检
```

改了 `cli/assets/**` 里的模板后**必须**跑 `make test`：它会真的调 `clang++` 编译并对拍，模板里的 tab 缩进、文件名、依赖项写错都会被它抓到。

---

## 实现约定

- **micro 配置**：只做 **merge**，绝不覆盖用户已有的键；写之前备份成 `settings.json.bak-<时间戳>`；`init.lua` 已存在则不动。逻辑在 `cli/src/micro.ts`，但**行为说明以 `cli/micro.md` 为准**，两边必须同步。
- **不要给 micro 装 LSP，也不要把 `linter` 打开**——「没有波浪线」是刻意设计，不是待修的缺陷。要加诊断能力，先在 `cli/micro.md` 里写清取舍。
- **依赖**：CLI 不引入第三方运行时依赖；`assets/` 里的模板保持自包含（不依赖仓库外的文件）。
- **脚手架模板**：生成的 `Makefile` 必须自清理——`run` / `raw` / `check` / `debug` 跑完都要删掉二进制和临时文件（`trap ... EXIT INT TERM` 兜底），只有 `build` 保留二进制。改 `cli/assets/make.tmpl` 后必须跑 `make test`，冒烟脚本会断言目录里没有残留。
- **文档**：改动架构或命令后，同步更新本文件、`cli/README.md`、`cli/micro.md` 中受影响的部分。

---

## 环境事实（本机，会踩的坑）

- **macOS + Apple clang + libc++，没有 `<bits/stdc++.h>`**（那是 GCC 专有头），所以模板用显式 include。想要万能头得 `brew install gcc` 然后 `make CXX=g++-14`。这不是 bug。
- micro **2.0.15**（Homebrew），配置目录 `~/.config/micro`（macOS 与 Linux 相同，可用 `MICRO_CONFIG_DIR` 覆盖）。
- micro 内置插件只有 7 个（autoclose / comment / diff / ftoptions / linter / literate / status），**LSP 不在其中**，它是官方插件频道里的可选插件 `lsp`。
- micro 启动顺序：`LoadAllPlugins()` → `action.InitCommands()` → `preinit()` → `init()`。因此 `init.lua` 里调用 `config.MakeCommand` **必须写在 `init()` 内**，写在顶层会报 `assignment to entry in nil map`。
- 验证 micro 行为可以用 `script -q /dev/null micro ...` 开一个 pty（本机没有 `timeout` 命令）；用假的 `g++` 包装脚本记录调用，是确认 linter 开关生效最直接的办法。
- `bun` 和 `~/.local/bin` 都已在该用户 PATH 中。
