# AGENTS.md

给 AI coding agent 的项目上下文。改动本仓库前先读这份文件。

## 项目是什么

一个用于**面试算法练习**的本地仓库：在终端里写 C++（ACM 模式），编辑体验尽量接近 LeetCode 网页编辑器——轻量、清爽。

初衷是把刷题变成可沉淀的闭环：题目、代码、笔记、复盘全部落在文件系统里，用 git 追踪，而不是散落在网页收藏夹里。

改代码时**不要破坏**的三件事：

1. **一条命令建题**：`algo two-sum` 直接得到一个可编译、可对拍的最小目录。
2. **编辑体验清爽**：micro 保留语法高亮和括号/引号自动补全，但**不要任何波浪线式报错**（详见 `cli/micro.md`，那里解释了原理与还原方法）。
3. **零运行时依赖**：CLI 只用 Bun + Node 内置模块，不引入第三方 npm 包。

## 目录结构

```
algo/
├── Makefile            # 根入口：原样转发到 cli/Makefile
└── cli/                # 全部实现
    ├── src/            # index(分发) / scaffold(建题) / list / run / micro / doctor / util
    ├── assets/         # 脚手架模板：solution.cpp / make.tmpl / README.tmpl / init.lua
    ├── scripts/        # smoke-test.sh
    ├── micro.md        # micro 编辑器插件与配置详解 —— micro 相关改动的唯一依据
    └── README.md       # 安装与用法
```

`algo <名字>` 在**当前目录**生成：

```
<slug>/
├── solution.cpp   # ACM 模板：读 stdin、写 stdout
├── in.txt         # 样例输入
├── out.txt        # 期望输出
├── Makefile       # run / raw / check / debug / clean
├── README.md      # 思路 / 边界 / 复杂度 / 复盘
└── .gitignore     # 忽略编译产物
```

安装方式是 `make install`：`bun build` 出 `cli/dist/algo.js`，在 `~/.local/bin/algo` 放一个 `exec bun ...` 的轻量启动器，然后合并 micro 配置。源码改动**即刻生效**，无需重新安装（除非改的是启动器本身）。

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

## 约定

- **提交**：每个大功能完成后及时 `git commit` + `git push`，不要攒批；提交信息说明功能点，中英文皆可。
- **micro 配置**：只做 **merge**，绝不覆盖用户已有的键；写之前备份成 `settings.json.bak-<时间戳>`；`init.lua` 已存在则不动。逻辑在 `cli/src/micro.ts`，但**行为说明以 `cli/micro.md` 为准**，两边必须同步。
- **不要给 micro 装 LSP，也不要把 `linter` 打开**——「没有波浪线」是刻意设计，不是待修的缺陷。要加诊断能力，先在 `cli/micro.md` 里写清取舍。
- **依赖**：CLI 不引入第三方运行时依赖；`assets/` 里的模板保持自包含（不依赖仓库外的文件）。
- **文档**：改动架构或命令后，同步更新本文件、`cli/README.md`、`cli/micro.md` 中受影响的部分。

## 环境事实（本机，会踩的坑）

- **macOS + Apple clang + libc++，没有 `<bits/stdc++.h>`**（那是 GCC 专有头），所以模板用显式 include。想要万能头得 `brew install gcc` 然后 `make CXX=g++-14`。这不是 bug。
- micro **2.0.15**（Homebrew），配置目录 `~/.config/micro`（macOS 与 Linux 相同，可用 `MICRO_CONFIG_DIR` 覆盖）。
- micro 内置插件只有 7 个（autoclose / comment / diff / ftoptions / linter / literate / status），**LSP 不在其中**，它是官方插件频道里的可选插件 `lsp`。
- micro 启动顺序：`LoadAllPlugins()` → `action.InitCommands()` → `preinit()` → `init()`。因此 `init.lua` 里调用 `config.MakeCommand` **必须写在 `init()` 内**，写在顶层会报 `assignment to entry in nil map`。
- 验证 micro 行为可以用 `script -q /dev/null micro ...` 开一个 pty（本机没有 `timeout` 命令）；用假的 `g++` 包装脚本记录调用，是确认 linter 开关生效最直接的办法。
- `bun` 和 `~/.local/bin` 都已在该用户 PATH 中。
