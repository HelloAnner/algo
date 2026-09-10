# algo — 面试算法练习脚手架

C++ / ACM 模式的本地刷题工作流：一条命令建好题目目录（题面 + 解法 + 代码 + 对拍），
micro 里写完 `make run` / `make check` 验证。

## 安装

```bash
cd ~/algo
make install          # 打包 CLI + 装到 ~/.local/bin + 合并 micro 配置
```

`make install` 做的事：

1. `bun build` 把 TS 打成 `cli/dist/algo.js`
2. 写一个轻量启动器 `~/.local/bin/algo`（`exec bun .../dist/algo.js`）
3. 运行 `algo setup`，把 C++ 刷题 profile 合并进 `~/.config/micro/settings.json` 和 `bindings.json`（先备份再合并）
4. 运行 `algo setup --shell`，把「建完题自动 cd」的函数写进 `~/.zshrc`（先备份再追加）

其它目标：

| 目标 | 作用 |
|------|------|
| `make install-bin` | 装独立二进制（约 61MB，无 bun 也能跑） |
| `make install-cli` | 只装 CLI，不碰 micro 配置 |
| `make setup` / `make init` | 只合并 micro 配置 / 额外写 `init.lua`（存在则不动） |
| `make shell` | 只装 shell 集成（`algo new` 之后自动 cd） |
| `make doctor` | 环境自检 |
| `make typecheck` | `tsc --noEmit` |
| `make test` | 冒烟测试：建题 → 编译 → 对拍 → 清理校验 → add → 列表 |
| `make uninstall` | 删掉 `~/.local/bin/algo` |

`PREFIX` 可覆盖安装位置：`make install PREFIX=/usr/local`。

## 用法

```bash
mkdir -p ~/algo/leetcode && cd ~/algo/leetcode

algo two-sum          # 静默建 ./two-sum/（9 个文件），配合 shell 集成直接落在里面
cd two-sum && micro . # 先看 problem.md，再写 solution.cpp
algo in               # 改样例输入 in.txt
algo out              # 改期望输出 out.txt
algo board            # 打开白板 whiteboard.excalidraw

make run              # 编译 + 跑 in.txt；对了只打印一行 AC（简写 make r）
make check            # 编译 + 静态检查 + 写法检查 + 对拍；没问题什么都不输出（简写 make c）
make debug            # ASan + UBSan（跑完清理）
make build            # 想保留二进制时用这个（之后 make clean）
make p / make s       # micro 打开题面 problem.md / 解法 solution.md
make e                # micro 打开 solution.cpp
make w                # 打开白板 whiteboard.excalidraw
make help             # 列出全部目标

# micro 里：Alt-r 跑样例 · Alt-t 对拍 · Alt-i / Alt-o 开 in.txt / out.txt（algo setup --init）
```

## 加一道题（题面 / 解法各一个 md）

题面和解法**分成两个独立的 md**：`problem.md`（题面）和 `solution.md`（解法思路）。

```bash
# 1) 只建目录，题面和解法以后再补（模板里带 algo:todo 标记）
algo two-sum

# 2) 建目录的同时把内容灌进去（长文本建议用文件，避免 shell 转义）
algo add two-sum --title "两数之和" --difficulty 简单 --tags 数组,哈希表 \
  --problem-file problem.md --solution-file solution.md

# 3) 目录已存在时，只更新显式给出的那个 md（不碰代码、样例和 README）
algo add two-sum --solution-file 思路.md

# 4) 给 AI 用：一个 JSON 一次性投喂（--json - 从 stdin 读）
algo add --json spec.json
```

`spec.json` 的字段：

```json
{
  "name": "two-sum",
  "title": "两数之和",
  "link": "https://leetcode.cn/problems/two-sum/",
  "difficulty": "简单",
  "tags": ["数组", "哈希表"],
  "problem": "## 题目描述\n...",
  "solution": "## 思路\n...",
  "in": "4 9\n2 7 11 15\n",
  "out": "0 1\n",
  "problem_file": "可选，改成从文件读题面",
  "solution_file": "可选，改成从文件读解法"
}
```

- `name` 可以由命令行给出（`algo add two-sum --json spec.json`），命令行优先。
- 目录已存在时，`--force` 才会整套重来；否则**只覆盖显式给出的文件**（problem.md / solution.md / in.txt / out.txt），不动 solution.cpp，也不碰 README.md。
- `--problem-file -` / `--solution-file -` 表示从 stdin 读；两个都用 `-` 会报错，请改用 `--json -`。

## `algo new` 之后自动 cd

子进程改不了父 shell 的目录，所以这一条靠一层 shell 函数实现（`algo setup --shell` 写入）：

- CLI 侧：`algo new xxx --print-dir` 把**新建目录的路径**打到 stdout，人看的输出全部走 stderr
- shell 侧：一个 `algo()` 函数包住真命令，拿到路径后自己 `cd` 过去

```bash
algo new two-sum                  # 建完直接站在 two-sum/ 里
algo add two-sum --in "1 2"       # 只更新已有目录 → 不 cd
algo new three-sum --print-dir    # 只想要路径
```

细节：

- `algo new` / `algo two-sum` 建新目录时**完全静默**（一个字都不打印），所以 `cd` 过去之后终端是干净的；
  想看文件清单与下一步提示就加 `--verbose`
- 只有**真的新建了目录**才会 cd；`algo add` 更新已有题目不会把你拽走
- `algo list` / `run` / `in` / `board` 等子命令原样直通，不受影响
- `-e` / `--edit` 会启动 micro（全屏 TUI），函数会跳过自动 cd 直接执行
- 装完**必须新开终端**（或 `source ~/.zshrc`）才生效；不确定当前终端加载了没：`algo doctor` 会分开报「配置里已写入」和「当前终端已加载」
- 不要了：删掉 `~/.zshrc` 里 `# >>> algo shell integration >>>` 到 `# <<< algo shell integration <<<` 之间那段

## 命令一览

```
algo <名字>                新建题目目录（等价于 algo add <名字>），静默
algo new <名字> --verbose  新建时打印文件清单与下一步
algo add <名字> [选项]      新建并写入题面/解法/元信息
    --title --link --difficulty --tags
    --problem / --problem-file <文件|->
    --solution / --solution-file <文件|->
    --in / --in-file <文件|->       样例输入 -> in.txt
    --out / --out-file <文件|->     期望输出 -> out.txt
    --json <文件|->         一次读入全部字段（AI 推荐）
algo list                  列出题目，显示「题面✓思路✓板✓」进度
algo edit [目录] [目标]    用 micro 打开，默认 solution.cpp
algo in / algo out [目录]  打开 in.txt / out.txt
algo board [目录]          用系统默认程序打开 whiteboard.excalidraw
algo run [目录]            编译 + 跑 in.txt，和 out.txt 一致就打印一行 AC
algo check [目录]          编译 + 静态检查 + 写法检查 + 对拍；没问题不输出
    --timeout <秒>         跑样例的超时（默认 5 秒，防死循环）
algo raw|debug|build|clean [目录]
algo path [目录] [目标]    只打印路径；目标：code/cpp · in · out ·
                           problem · board · readme · makefile
                           （也可以直接写文件名，自动补 .cpp/.md/.txt/.excalidraw）
algo setup [--dry-run]     合并 micro 配置（settings.json + bindings.json）
algo setup --shell         装 shell 集成（algo new 之后自动 cd）
algo setup --init          额外生成 ~/.config/micro/init.lua
                           （Alt-r 跑样例 / Alt-t 对拍 / Alt-i·Alt-o 开样例；存在则不覆盖）
algo doctor                自检
```

## `algo check` 检查什么

`algo check`（以及 `make check`）做四件事：

1. **编译**：不通就把编译器错误原样打出来（含语法错误），退出码 1
2. **静态检查**：用比日常编译更严的警告集（`-Wshadow -Wsign-compare -Wuninitialized -Wvla
   -Wparentheses -Wreturn-type -Wunused -Wswitch -Wfloat-equal`）再过一遍 `-fsyntax-only`
3. **写法检查**（ACM 常见坑）：`<bits/stdc++.h>`、`endl`、`cin.eof()` 当循环条件、
   `fflush(stdin)`、`scanf/printf` 与 `cin/cout` 混用、用了 iostream 却没关同步
4. **样例对拍**：用 `in.txt` 当标准输入跑一遍（默认 5 秒超时，防死循环），和 `out.txt` 逐行比

**静默是设计目标**：一切正常时一个字符都不打印，只看退出码（0 = 通过）。
有警告或对拍不过才输出，例如：

```console
$ make check
⚠ 写法检查 1 条
  solution.cpp:13 endl 会强制 flush，数据量大时明显变慢，换成 '\\n'
```

写法提示只提醒、不影响退出码；编译失败 / WA / 超时才会以非 0 退出。

## 题目目录结构

```
two-sum/
├── problem.md       # 题面描述（独立 md）
├── solution.md      # 解法思路（独立 md）
├── whiteboard.excalidraw  # 白板：空白场景，打开就能画
├── solution.cpp     # ACM 模式：读 stdin 写 stdout
├── in.txt           # 样例输入
├── out.txt          # 期望输出
├── Makefile         # run(r) / raw / check(c) / debug / build / e / p / s / w / help / clean
├── README.md        # 卡片：链接 / 难度 / 标签 / 状态 / 复盘记录
└── .gitignore       # 忽略编译产物
```

> `make run` / `raw` / `check` / `debug` 都是「编译 → 运行 → 删掉二进制」：
> 用 `trap ... EXIT INT TERM` 兜底，正常结束、编译报错、程序崩溃、Ctrl-C 都会清理，
> 所以题目目录里不会攒下 `solution` 这类编译产物。只有 `make build` 会保留它。
>
> 本机是 Apple clang + libc++，**没有 `<bits/stdc++.h>`**（GCC 专有头），
> 所以模板用的是显式 include。想用万能头就 `brew install gcc`，再 `make CXX=g++-14`。

## 源码结构

```
cli/
├── src/
│   ├── index.ts      # 命令分发
│   ├── flags.ts      # 迷你参数解析（--key value / --key=value / -e）
│   ├── add.ts        # algo add：JSON 规格 + 各种文本来源
│   ├── scaffold.ts   # 生成题目目录
│   ├── list.ts       # algo list + 进度标记
│   ├── run.ts        # algo run（AC 一行）/ make 转发
│   ├── check.ts      # algo check：静态检查 + 写法坑 + 对拍（静默）
│   ├── cpp.ts        # 编译 / 运行 / 比对（临时二进制 .algo_bin，跑完必删）
│   ├── micro.ts      # micro profile 定义与合并
│   ├── doctor.ts     # 环境自检
│   └── util.ts       # 颜色 / 文件 / 进程小工具
├── scripts/          # smoke-test.sh
└── assets/           # 模板：solution.cpp / make.tmpl / problem.md.tmpl / solution.md.tmpl / whiteboard.excalidraw.tmpl / README.tmpl / init.lua
```

micro 编辑器（插件清单、配置逐项解释、为什么关掉下划线报错、如何还原）见 **[micro.md](./micro.md)**。
