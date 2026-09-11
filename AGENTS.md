# AGENTS.md

给 AI coding agent 的项目上下文。改动本仓库前先读这份文件。

## 项目是什么

一个用于**面试算法练习**的本地仓库：在终端里写 C++（ACM 模式），编辑体验尽量接近 LeetCode 网页编辑器——轻量、清爽。

初衷是把刷题变成可沉淀的闭环：题目、代码、笔记、复盘全部落在文件系统里，用 git 追踪，而不是散落在网页收藏夹里。

改代码时**不要破坏**的三件事：

1. **一条命令建题**：`algo two-sum` 直接得到一个可编译、可对拍的最小目录。
2. **编辑体验清爽**：micro 保留语法高亮、括号/引号自动补全和 Tab 同类词补全（写到一半补成前面写过的词），但**不要任何波浪线式报错**（详见 `cli/micro.md`，那里解释了原理与还原方法）。
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
   还要特别看一眼**有没有误入的练习题目录**（仓库根出现含 `solution.cpp` 的目录就说明 `algo new` 跑错地方了）——这个坑踩过两次，务必在 `git add -A` 前用 `git status --short` 扫一遍。
   题库统一放 `leetcode/`（已入库，属于正常内容）；只有仓库根、`cli/` 里出现题目目录才是跑错了。
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
├── leetcode/           # 题库（已入库）：一道题一个目录，用 `algo <slug>` / `algo add` 生成
│                       # 目前是《手撕字节跳动面试时出现过的算法题》里的 63 道，见 `algo list`
└── cli/                # 全部实现
    ├── src/            # index(分发) / flags / add / scaffold / list / run / check / cpp / targets / open / shell / micro / doctor / util
    ├── assets/         # 模板：solution.cpp / make.tmpl / problem.txt.tmpl / solution.txt.tmpl / whiteboard.excalidraw.tmpl / init.lua
    │                   #       + plug/autocopy/（自带 micro 插件：鼠标划词松手即复制到系统剪贴板）
    ├── scripts/        # smoke-test.sh（含 pty 端到端跑真 micro）+ micro-autocopy-test.py
    ├── micro.md        # micro 编辑器插件与配置详解 —— micro 相关改动的唯一依据
    └── README.md       # 安装与用法
```

`algo <名字>` 在**当前目录**生成：

```
<slug>/
├── problem.txt    # 题面（纯文本：头部 题目/链接/难度，章节用 [题目描述] 标记，图用 ASCII）
├── solution.txt   # 解法 / 答案：[思路] / [复杂度] / [关键点] / [C++ 代码]
├── solution.cpp   # **空模板**（include + main + TODO），等用户自己写
├── in.txt         # 样例输入
├── out.txt        # 期望输出
├── Makefile       # run(r) / raw / check(c) / debug / build / e / p / s / w / help / clean
│                  # （run 等跑完自动删二进制；p / s 是 micro 看题面 / 解法）
├── whiteboard.excalidraw  # 白板（空白 Excalidraw 场景，打开就能画）
└── .gitignore     # 忽略编译产物

**题目目录里没有任何 Markdown**（没有 README.md / problem.md / solution.md）：
题面 = problem.txt，解法与参考代码 = solution.txt，用户要自己写的是 solution.cpp。
```

安装方式是 `make install`：`bun build` 出 `cli/dist/algo.js`，在 `~/.local/bin/algo` 放一个 `exec bun ...` 的轻量启动器，然后合并 micro 配置并装 shell 集成。源码改动**即刻生效**，无需重新安装（除非改的是启动器本身）。

---

## 添加题目（`algo add`，AI 常用）

题面和解法各占一个独立 txt：`problem.txt`（题面）与 `solution.txt`（解法 + 参考代码）。
每个题目目录还会带一个 `whiteboard.excalidraw`——**空白**的合法 Excalidraw 场景（不要往里塞预置内容），用 VS Code 的 Excalidraw 插件或 Obsidian 打开就能画。
两个模板里都埋了 `algo:todo` 标记（纯文本，不是 HTML 注释），`algo list` 靠它判断写没写，写完删掉即可。

给 AI 用最顺手的是 **JSON 一次性投喂**：

```bash
cat > /tmp/spec.json <<'EOF'
{
  "name": "two-sum",
  "title": "两数之和",
  "link": "https://leetcode.cn/problems/two-sum/",
  "difficulty": "简单",
  "problem": "[题目描述]\n...",
  "solution": "[思路]\n...\n\n[C++ 代码]\n// 参考实现\n",
  "in": "4 9\n2 7 11 15\n",
  "out": "0 1\n"
}
EOF
algo add --json /tmp/spec.json     # 或 --json - 从 stdin 读
```

也可以走命令行（长文本用 `--xxx-file`，别在 argv 里硬塞大段文本）：

```bash
algo add two-sum --title "两数之和" --difficulty 简单 \
  --problem-file 题面.txt --solution-file 解法.txt
```

规则：

- 目录不存在 → 建全套；**目录已存在 → 只更新显式给出的文件**（`problem.txt` / `solution.txt` / `in.txt` / `out.txt`），**绝不动 `solution.cpp`**。要整套重来用 `--force`。
- 只给 `--title` / `--link` / `--difficulty` 时，只改 `problem.txt` 头部那三行，题面正文不动。
- `--problem-file -` / `--solution-file -` 表示从 stdin 读；两个都用 `-` 会报错，这种情况改用 `--json -`。
- `name` 命令行优先于 JSON；`--title` / `--link` / `--difficulty` 同理。
- `--in` / `--out`（或 JSON 的 `in` / `out`）把样例输入、期望输出直接写进 `in.txt` / `out.txt`。
- **新建目录时完全静默**：`algo new` / `algo add --json` 建出来的新题目不打印任何内容（这样 shell 集成 cd 过去之后终端是干净的）。
  要文件清单与下一步提示加 `--verbose`；更新已有题目仍会打印一行「已更新 …」。别指望从 stdout 里读建题结果，用退出码 + 文件是否存在判断。

看 / 改单个文件：`algo edit [目录] [目标]`（目标：`code`=solution.cpp（空模板）、`solution`/`answer`=solution.txt（答案）、`problem`、`in`、`out`、`board`，或直接写文件名）、
`algo in` / `algo out` / `algo board`，以及只打印路径的 `algo path [目录] [目标]`。

`algo new` 之后自动 cd 进新目录，靠 `algo setup --shell` 写进 `~/.zshrc` 的 `algo` shell 函数；
CLI 侧配合的接口是 `--print-dir`（人看的输出走 stderr，stdout 只留新建目录路径，且只在**真的新建**时输出）。
改这两边时注意保持配套，别让 stdout 混进别的东西。

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

- **micro 配置**：只做 **merge**，绝不覆盖用户已有的键；写之前备份成 `<文件>.bak-<时间戳>`；`init.lua` 已存在则不动。逻辑在 `cli/src/micro.ts`（`PROFILE` 管 settings.json、`BINDINGS` 管 bindings.json），但**行为说明以 `cli/micro.md` 为准**，两边必须同步。
  注意 micro 的 `autosave` 是**秒数**不是布尔（写 `true` 会被它当成 8 秒），profile 里显式写成 `autosave: 2`；自动保存本身不弹提示，是刻意保持静默的。
  `Tab` / `Shift-Tab` 的同类词补全（`Autocomplete|IndentSelection|InsertTab`）是 micro **内核默认**、不是插件，`BINDINGS` 里**故意不写**（写了会钉死用户自己的 `Tab`）；`algo doctor` 会检查它没被覆盖，说明见 `cli/micro.md` §6。
  `bindings.json` 只写「micro 默认不是这样」的 6 个键（Ctrl-P 命令模式、Ctrl-B/L 分屏、F12 切分屏、Alt-n 新建文件、Alt-d 复制行），其余保持 micro 默认；`init.lua`（`algo setup --init`）提供 Alt-r 跑样例 / Alt-t 对拍 / Alt-i·Alt-o 开样例，命令必须写在 `init()` 里。
  `algo setup` 还把自带插件 `cli/assets/plug/autocopy/` 装到 `~/.config/micro/plug/autocopy/`（`PLUGIN_FILES`）：鼠标划词松手 → 写系统剪贴板。它存在的理由：micro 内置的 `MouseRelease` 只写 primary register，macOS 没有 primary，等于没复制；插件改调 `bp:Copy()`（和 Ctrl-C 同一条通道）。插件文件归 algo 管——内容一致就跳过，被改过先备份成 `.bak-<时间戳>` 再覆盖；用户想关掉就在 settings.json 写 `"autocopy": false`。
- **不要给 micro 装 LSP，也不要把 `linter` 打开**——「没有波浪线」是刻意设计，不是待修的缺陷。要加诊断能力，先在 `cli/micro.md` 里写清取舍。
- **run / check 由 CLI 实现，分工是刻意的**：`cli/src/cpp.ts` 负责编译与运行（临时二进制 `.algo_bin`，任何路径下都必删）。
  `algo run`（`make r`）= 编译 + 跑 `in.txt` + 和 `out.txt` 对拍，正常只打印一行 `AC`，WA / 超时非 0 退出；
  `algo check`（`make c`）= 编译 + 静态警告 + 写法坑，**不跑样例**（用户明确要 `make c` 只编译检查、`make r` 才跑 case）。
  题目 Makefile 里的 `run` / `check` 只是转发到 `algo run` / `algo check`；Makefile 的 `CXXFLAGS` 与 `cpp.ts` 的 `BUILD_FLAGS` 必须保持一致。
  两者的「没问题就不输出」是刻意设计（静默即通过），别加成功提示。
- **依赖**：CLI 不引入第三方运行时依赖；`assets/` 里的模板保持自包含（不依赖仓库外的文件）。
- **题面 / 解法都是纯文本**：`problem.txt`（头部 `题目：` / `链接：` / `难度：`，章节用 `[题目描述]` 这种标记，**图一律用 ASCII 画**）、`solution.txt`（`[思路]` / `[复杂度]` / `[关键点]` / `[C++ 代码]`）。**不要往题目目录里加 Markdown 文件**（用户明确要 `cat txt`）。
- **`solution.cpp` 永远是空模板**：顶层就一行 `#include <bits/stdc++.h>`（靠兼容头 + `-I` 生效）+ `using namespace std;` + `main` + `// TODO: 读入 -> 计算 -> 输出`，实现留给用户自己写；参考代码放在 `solution.txt` 的 `[C++ 代码]` 里。不要用参考实现覆盖 `solution.cpp`，也不要往模板里堆一长串显式 include。
- **改了 `cli/assets/make.tmpl` 要刷老题目**：题目目录里的 `Makefile` 是生成物，模板升级**不会自动同步**（曾经因此让 63 个目录的 `make p` 还指向已删掉的 `problem.md`）。改完模板先 `make test`，再用 `algo remake <题库目录>` 把老目录刷一遍。
- **脚手架模板**：生成的 `Makefile` 必须自清理——`run` / `raw` / `check` / `debug` 跑完都要删掉二进制和临时文件（`trap ... EXIT INT TERM` 兜底），只有 `build` 保留二进制。另外提供 `make e` / `make p` / `make s`（micro 打开代码 / 题面 / 解法）、`make r` / `make c`（`run` / `check` 的简写）、`make w`（系统默认程序打开白板）和 `make help`。改 `cli/assets/make.tmpl` 后必须跑 `make test`，冒烟脚本会断言目录里没有残留。
- **文档**：改动架构或命令后，同步更新本文件、`cli/README.md`、`cli/micro.md` 中受影响的部分。

---

## 环境事实（本机，会踩的坑）

- **macOS + Apple clang + libc++，系统里没有 `<bits/stdc++.h>`**（GCC 专有头）。为了让模板顶层只留一行 include，`cli/assets/include/bits/stdc++.h` 放了一份**兼容头**：`make -C cli install` 会把它装到 `~/.local/include/bits/stdc++.h`，题目的 `CXXFLAGS` 与 `cli/src/cpp.ts` 的 `BUILD_FLAGS` 都带 `-I$(HOME)/.local/include`（两边必须保持一致）。没装兼容头时编译会报 `'bits/stdc++.h' file not found`。想用真 GCC 就 `brew install gcc` 再 `make CXX=g++-14`。
- micro **2.0.15**（Homebrew），配置目录 `~/.config/micro`（macOS 与 Linux 相同）。**micro 自己认 `MICRO_CONFIG_HOME`（其次 `XDG_CONFIG_HOME`）和 `micro -config-dir`；`MICRO_CONFIG_DIR` 只是 algo CLI 的约定，micro 不读**（实测过：只设它，micro 仍读 `~/.config/micro`）。`microConfigDir()` 两者都认，顺序是 `MICRO_CONFIG_DIR` → `MICRO_CONFIG_HOME` → `XDG_CONFIG_HOME/micro` → `~/.config/micro`。
- micro 内置插件只有 7 个（autoclose / comment / diff / ftoptions / linter / literate / status），**LSP 不在其中**，它是官方插件频道里的可选插件 `lsp`。
- micro 启动顺序：`LoadAllPlugins()` → `action.InitCommands()` → `preinit()` → `init()`。因此 `init.lua` 里调用 `config.MakeCommand` **必须写在 `init()` 内**，写在顶层会报 `assignment to entry in nil map`。
- 验证 micro 行为可以用 `script -q /dev/null micro ...` 开一个 pty（本机没有 `timeout` 命令）；用假的 `g++` 包装脚本记录调用，是确认 linter 开关生效最直接的办法。
  更彻底的办法是用 Python 的 `pty.fork()` 驱动真 micro（发 `\x1br` 这类按键），只看「效果」（文件内容、是否退出），别去 grep 屏幕输出——micro 是增量重绘，原始流里的文本是残缺的。
  现成例子：`cli/scripts/micro-autocopy-test.py`（`make -C cli test` 会跑）用 SGR 鼠标序列做拖选/双击，直接断言系统剪贴板（`pbpaste`）里出现了选中的文本。
- **Bun 的 `process.exit()` 不会执行 `finally`**，所以「跑完删 `.algo_bin`」不能只靠 `try/finally`（`run` 成功时就是这么退出的，曾经因此漏删）。`cli/src/cpp.ts` 里额外挂了 `process.on("exit")` 兜底。
- PATH 上有**另一个同名 `algo`**（`~/.bun/bin/algo`，另一个 LeetCode 复习项目，编译好的二进制），排在 `~/.local/bin/algo` 前面 —— 这条真实踩过：题目里 `make r` 打出的是那个工具的帮助。现在三处兜住了：
  1. 题目 Makefile：`ALGO ?= $(shell [ -x "$$HOME/.local/bin/algo" ] && echo ... || command -v algo)`，即**优先本仓库装的绝对路径**（`make ALGO=... r` 可覆盖，`make help` 最后一行会打印实际用的是哪个）；
  2. shell 集成里的 `algo()` 函数：同样优先 `~/.local/bin/algo`，回退才用 `command algo`（注意别写成 `command -v`，函数也叫 algo，zsh 里会返回函数名）；
  3. `algo doctor` 会报「PATH 上的 algo 不是这个仓库装的」。
  改这几处时保持一致的判断口径。
