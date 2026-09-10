# algo — 面试算法练习脚手架

C++ / ACM 模式的本地刷题工作流：一条命令建好题目目录，micro 里写完 `make run` / `make check` 验证。

## 安装

```bash
cd ~/algo
make install          # 打包 CLI + 装到 ~/.local/bin + 合并 micro 配置
```

`make install` 做的事：

1. `bun build` 把 TS 打成 `cli/dist/algo.js`
2. 写一个轻量启动器 `~/.local/bin/algo`（`exec bun .../dist/algo.js`）
3. 运行 `algo setup`，把 C++ 刷题 profile 合并进 `~/.config/micro/settings.json`（先备份再合并）

其它目标：

| 目标 | 作用 |
|------|------|
| `make install-bin` | 装独立二进制（约 61MB，无 bun 也能跑） |
| `make install-cli` | 只装 CLI，不碰 micro 配置 |
| `make setup` / `make init` | 只合并 micro 配置 / 额外写 `init.lua`（存在则不动） |
| `make doctor` | 环境自检 |
| `make test` | 冒烟测试：建题 → 编译 → 对拍 |
| `make uninstall` | 删掉 `~/.local/bin/algo` |

`PREFIX` 可覆盖安装位置：`make install PREFIX=/usr/local`。

## 用法

```bash
mkdir -p ~/algo/leetcode && cd ~/algo/leetcode

algo two-sum          # 建 ./two-sum/：solution.cpp / in.txt / out.txt / Makefile / README.md
cd two-sum && micro . # 开写

make run              # 用 in.txt 跑
make check            # 和 out.txt 比对，✅ AC / ❌ WA
make debug            # ASan + UBSan
```

CLI 侧快捷命令：`algo list`、`algo run`、`algo check`、`algo edit`、`algo doctor`、`algo setup`。

```
algo <名字>              新建题目目录
algo new <名字>          同上（名字和子命令撞车时用）
algo list                列出当前目录的题目
algo edit [目录]         用 micro 打开 solution.cpp
algo run|raw|check|debug|clean [目录]
algo path [目录]         打印题目目录绝对路径
algo setup [--dry-run]   安装 / 合并 micro 配置
algo setup --init        额外生成 ~/.config/micro/init.lua（存在则不覆盖）
algo doctor              自检
```

## 题目目录结构

```
two-sum/
├── solution.cpp     # ACM 模式：读 stdin 写 stdout
├── in.txt           # 样例输入
├── out.txt          # 期望输出
├── Makefile         # run / raw / check / debug / clean
├── README.md        # 思路、边界、复杂度、复盘
└── .gitignore       # 忽略编译产物
```

> 本机是 Apple clang + libc++，**没有 `<bits/stdc++.h>`**（GCC 专有头），
> 所以模板用的是显式 include。想用万能头就 `brew install gcc`，再 `make CXX=g++-14`。

## 源码结构

```
cli/
├── src/
│   ├── index.ts      # 参数解析 + 命令分发
│   ├── scaffold.ts   # algo <名字> 建目录
│   ├── list.ts       # algo list
│   ├── run.ts        # algo run/check/... → make
│   ├── micro.ts      # micro profile 定义与合并
│   ├── doctor.ts     # 环境自检
│   └── util.ts       # 颜色 / 文件 / 进程小工具
└── assets/           # 脚手架模板（solution.cpp / Makefile / README / ...）
```

micro 编辑器（插件清单、配置逐项解释、为什么关掉下划线报错、如何还原）见 **[micro.md](./micro.md)**。
