# micro 终端编辑器 · 插件与配置详解

> 面向「C++ / ACM 模式刷面试算法」的场景。
> 本文说明 `algo setup` 到底往 `~/.config/micro/` 写了什么、为什么这么配、以及怎么微调和还原。
>
> 本机环境：macOS 15 · micro 2.0.15（Homebrew）· 配置目录 `~/.config/micro`

---

## 0. TL;DR

| 你想干的事 | 命令 |
|---|---|
| 安装 / 合并这套 C++ 刷题配置 | `algo setup`（或 `make -C cli setup`） |
| 只看改什么、不落盘 | `algo setup --dry-run` |
| 额外生成 `init.lua`（Alt-r 一键 make run） | `algo setup --init`（已存在则绝不覆盖） |
| 看当前生效状态 | `algo doctor` |
| 编辑器里重载配置 | `Ctrl+E` 然后执行 `reload` |
| 看所有选项（含默认值） | 终端 `micro -options` ，或编辑器内 `> help options` |
| 看当前按键绑定 | 编辑器内按 `Alt-g` |

这套配置的目标只有一句话：**保留语法高亮和括号/引号自动补全，但不要任何波浪线/下划线式的报错提示。**

---

## 1. 为什么是 micro

- **单文件二进制**，`brew install micro` 即用，无 node/python 运行时依赖；
- **自带插件管理器**（`micro -plugin install/list/search/update`）和 Lua 插件系统，不用自己配 LSP 才能补全；
- **终端里支持真彩色、鼠标、多标签/分屏、系统剪贴板**，观感接近 GUI 编辑器；
- 相比 vim/neovim：**开箱即可写代码**，不需要为了「括号自动补全 + 语法高亮」折腾配置。

安装（本机已装）：

```bash
brew install micro
micro --version        # 2.0.15
```

其它平台见 <https://github.com/micro-editor/micro#installation>。

---

## 2. 配置目录与加载顺序

### 2.1 目录结构

micro 的配置目录默认是 `~/.config/micro`（macOS 与 Linux 相同）。可用 `MICRO_CONFIG_DIR` 环境变量或 `micro -config-dir /path` 覆盖。

| 路径 | 作用 |
|---|---|
| `settings.json` | 全局选项（**`algo setup` 合并的就是这个文件**） |
| `bindings.json` | 按键绑定 |
| `init.lua` | 用户自己的 Lua 插件（`algo setup --init` 可选生成） |
| `plug/<名字>/` | 通过插件管理器安装的第三方插件 |
| `syntax/*.yaml` | 自定义语法文件（C++ 是 `cpp.yaml`） |
| `colorschemes/*.micro` | 自定义配色 |
| `snippets/*.snippets` | snippets 插件的代码片段（本机有 cpp/go/java/js/python） |
| `buffers/`、`recent_files`、`backups/` | 会话记忆、最近文件、崩溃备份 |

### 2.2 启动顺序（很重要）

micro 启动时依次执行：

```
InitRuntimeFiles(true)      # 扫描 runtime 与 config 目录的资源文件
InitPlugins()               # 收集插件（init.lua 被当作名为 initlua 的插件，排在最前）
LoadAllPlugins()            # 加载并执行每个插件 Lua 的顶层代码
action.InitCommands()       # ★ 此时才创建内置命令表 commands
RunPluginFn("preinit")      # 插件的 preinit()
RunPluginFn("init")         # 插件的 init()
RunPluginFn("postinit")
```

**结论：在 `init.lua` 顶层直接调用 `config.MakeCommand` 会崩。** 因为顶层代码在第 3 步执行，而命令表在第 4 步才创建。实测报错：

```
assignment to entry in nil map
stack traceback:
        [G]: in function 'MakeCommand'
        init:12: in main chunk
```

正确写法是放进 `init()`（或 `preinit()`）：

```lua
local config = import("micro/config")

function myThing(bp) end

function init()
    config.MakeCommand("my-thing", myThing, config.NoComplete)
    config.TryBindKey("Alt-r", "command:my-thing", true)
end
```

`algo setup --init` 生成的 `init.lua` 已经遵守这条规则（并在注释里写明了原因）。

### 2.3 改完怎么生效

- 编辑器内 `Ctrl+E`（打开命令提示符）→ 输入 `reload` → 回车；
- 或者直接重开 micro；
- `settings.json` 写坏了会导致启动报错，注意 JSON 语法（**不能有注释、末尾不能有多余逗号**）。

---

## 3. `algo setup` 做了什么

它只做一件事：**把下面这些键 merge 进 `~/.config/micro/settings.json`**。

- 其它键（你自己配的）原样保留；
- 只有内容真的发生变化时才写入，写之前先备份成 `settings.json.bak-YYYYMMDD-HHMMSS`；
- 幂等：重复执行第二次会输出「已是最新，无需改动」。

### 3.1 逐项解释

| 键 | 值 | 作用 | 分组 |
|---|---|---|---|
| `autoclose` | `true` | **保留括号/引号自动补全**（内置 autoclose 插件开关） | 编辑手感 |
| `linter` | `false` | **关掉保存时的 g++ 语法检查**，这是终端里「波浪线」的唯一来源 | 关掉报错 |
| `hltaberrors` | `false` | 不因为 tab/空格混用而高亮告警 | 关掉报错 |
| `hltrailingws` | `false` | 不高亮行尾空格（交给自动删除） | 关掉报错 |
| `syntax` | `true` | 保留语法高亮（LeetCode 也有高亮，这不是「臃肿」） | 观感 |
| `matchbrace` | `true` | 光标停在括号上时高亮匹配的另一半 | 观感 |
| `matchbracestyle` | `"underline"` | 匹配括号用下划线样式，而不是反色块 | 观感 |
| `autoindent` | `true` | 新行沿用上一行缩进 | 缩进 |
| `tabstospaces` | `true` | 用空格而不是 tab（ACM/C++ 通行走 4 空格） | 缩进 |
| `tabsize` | `4` | 缩进宽度 | 缩进 |
| `smartpaste` | `true` | 粘贴多行时自动补前导缩进 | 缩进 |
| `eofnewline` | `true` | 保存时文件末尾补换行 | 缩进 |
| `rmtrailingws` | `true` | 保存时自动删行尾空格 | 缩进 |
| `cursorline` | `true` | 高亮当前行 | 界面 |
| `statusline` | `true` | 显示底部状态栏 | 界面 |
| `scrollbar` | `true` | 右侧滚动条 | 界面 |
| `truecolor` | `"on"` | 24-bit 真彩色（终端支持时配色更准） | 界面 |
| `mouse` | `true` | 支持鼠标点选/滚动 | 界面 |
| `savecursor` | `true` | 记住上次光标位置 | 会话 |
| `saveundo` | `true` | 重启后仍能撤销 | 会话 |

> 默认值对比（来自 `micro -options`）：`tabstospaces` 默认 `false`、`trucolor` 默认 `auto`、`rmtrailingws` 默认 `false`、`savecursor`/`saveundo`/`scrollbar` 默认都是 `false`。也就是说 `algo setup` 主要是把这些「更顺手」的开关打开，并且**关掉 linter**。

### 3.2 合并策略与还原

- 备份文件：`~/.config/micro/settings.json.bak-<时间戳>`；直接把它拷回 `settings.json` 就完全还原。
- 只想撤销某一项：把该键删掉即可（比如把 `"linter": true` 改回去，报错下划线就回来了）。
- `algo setup --dry-run` 只打印 `+ 新增` / `~ 修改`，不写文件。

---

## 4. 为什么没有波浪线（Squiggly lines）

micro 的「错误提示」只有两个可能的来源，都查过了：

### 来源一：内置 `linter` 插件（★ 本机默认会触发，已关掉）

micro 2.0.15 自带 7 个插件，其中 `linter` 插件在**保存时**对 C++ 执行：

```
g++ -fsyntax-only -Wall -Wextra <当前文件>
```

然后把 g++ 的输出解析成 buffer message。这些 message 在渲染时会：

1. 在代码的对应区间加 **下划线**（`internal/display/bufwindow.go` 里 `style.Underline(true)`）——这就是终端版「波浪线」；
2. 在左侧 gutter 画一个标记，状态栏也会显示错误数。

**实测证据**（用一个假的 g++ 包装脚本记录调用）：

```bash
# /tmp/fakebin/g++ ：记录再转交真实 g++
#!/bin/sh
echo "g++ invoked: $*" >> /tmp/gxx-calls.log
exec /usr/bin/g++ "$@"

# settings.json = { "linter": true  } → 在 micro 里按 Ctrl+S 保存后：
g++ invoked: -fsyntax-only -Wall -Wextra bad.cpp

# settings.json = { "linter": false } → 保存后：没有任何调用
```

关掉之后，保存不再调用编译器，也就不可能有下划线报错。

### 来源二：可选插件 `lsp`（本机没装）

micro 的 LSP（clangd 补全/hover/诊断）**不是内置的**，而是官方插件频道里的可选插件 `lsp`：

```bash
micro -plugin list        # 本机：autoclose/comment/diff/ftoptions/linter/literate/status + 自己装的 3 个，没有 lsp
micro -plugin install lsp # 装了才会有 clangd 的实时诊断（＝真正意义的下划线波浪线）
```

只要不装它，就不会有 clangd 诊断；装了又想安静，就把 `lsp.server` 里的 c++ 项去掉，或者干脆 `micro -plugin remove lsp`。

### 为什么 `"linter": false` 能关掉整个插件

micro 的插件总开关就是 **settings.json 里的同名布尔键**。源码里：

```go
// internal/config/plugin.go
func (p *Plugin) Load() error {
    if v, ok := GlobalSettings[p.Name]; ok && !v.(bool) { return nil }  // 直接不加载
    ...
}
func (p *Plugin) IsLoaded() bool {
    if v, ok := GlobalSettings[p.Name]; ok { return v.(bool) && p.Loaded }
    return true
}
```

所以 `"linter": false`、`"autoclose": false` 这类写法是**插件级开关**，而不是某个子选项。想恢复报错就写 `"linter": true`。

### 保留下来的能力

| 能力 | 状态 | 说明 |
|---|---|---|
| 语法高亮 | ✅ | `syntax: true`，C++ 用内置 `cpp.yaml` |
| 匹配括号高亮 | ✅ | `matchbrace + matchbracestyle: underline` |
| 括号/引号自动补全 | ✅ | 内置 `autoclose` 插件 |
| 错误下划线 / 诊断 | ❌ 已关 | `linter: false`，且没装 `lsp` |
| 自动补全提示弹窗 | ❌ | micro 没有 LSP；不装插件就没有弹窗（这正是「清爽」的来源） |

**autoclose 实测**（在 micro 里输入 `(` 和 `[`，然后 Ctrl+S 保存，再看文件内容）：

```
autoclose: true   → 文件内容: ([])
autoclose: false  → 文件内容: ([
```

即：输入左括号自动补右括号，光标停在中间；再输入右括号会自动「跳过」而不是重复插入。

---

## 5. 插件清单

### 5.1 内置插件（micro 2.0.15）

| 插件 | 作用 | 本机状态 |
|---|---|---|
| `autoclose` | 自动补全 `" ' \` ( ) [ ] { }`，回车自动缩进，智能退格 | ✅ 开启（`algo setup` 显式设为 `true`） |
| `comment` | `Ctrl+/` 按语言注释/取消注释 | ✅ 开启 |
| `ftoptions` | 按文件类型调整选项（只涉及 go/makefile/fish/python/yaml/nim 的 tab 设置） | ✅ 开启 |
| `linter` | 保存时跑各语言 linter（C++ 用 `g++ -fsyntax-only`），错误显示为下划线 | ❌ **已关**（`"linter": false`） |
| `literate` | Literate 工具的语法高亮 | ✅ 开启（对 C++ 无影响） |
| `status` | 状态栏扩展（Git 集成等） | ✅ 开启 |
| `diff` | 与 Git 提交对比的 diff gutter | ✅ 开启 |

各插件的帮助：编辑器内 `> help linter`、`> help comment`、`> help status`；插件开发文档 `> help plugins`。

### 5.2 本机安装的第三方插件

| 插件 | 注册的命令 | 说明 |
|---|---|---|
| `fzfinder` | `fzfinder` | 调 `fzf` 模糊找文件，`bat` 预览。README 推荐自己绑 `"Alt-Tab": "command:fzfinder"` |
| `recentfiles` | `recentfiles` | 从 `~/.config/micro/recent_files` 里模糊召回最近打开的文件 |
| `snippets` | `Alt-s` 插入 / `Alt-w` 下一占位符 / `Alt-a` 接受 / `Alt-d` 取消 | 代码片段，本机有 `cpp.snippets` 等 5 个语言 |

> ⚠️ 冲突提醒：snippets 用 `TryBindKey(..., overwrite=false)` 注册 `Alt-d`，而你的 `bindings.json` 里把 `Alt-d` 绑成了 `DuplicateLine`。**你的绑定优先**，所以 `Alt-d` 是复制行，片段取消不可用（`Alt-a` / `Alt-s` / `Alt-w` 正常）。
>
> 另外 `fzfinder` / `recentfiles` 只注册了命令、**没有自动绑键**。想用快捷键就在 `bindings.json` 里加上，例如：
>
> ```json
> { "Alt-Tab": "command:fzfinder", "Alt-o": "command:recentfiles" }
> ```
>
> （`MICRO_FUZZY_MEMORY.md` 里写的「Ctrl+P = 模糊打开」是**旧记录**：现在的 `bindings.json` 把 `Ctrl+P` 绑成了 `CommandMode`，且没有 `Ctrl-Shift-P`。）

### 5.3 插件管理

```bash
micro -plugin list              # 已安装
micro -plugin available         # 频道里可安装的
micro -plugin search <关键字>   # 搜索
micro -plugin install <名字>    # 安装
micro -plugin update [名字]     # 更新（不带参数=全部）
micro -plugin remove <名字>     # 卸载
```

插件来自「插件频道」（默认是官方 `micro-editor/plugin-channel`），可用 `pluginchannels` 加私有频道、`pluginrepos` 直接指定第三方 `repo.json`。插件安装后落在 `~/.config/micro/plug/<名字>/`。

**启用/禁用任意插件**（内置和第三方都一样）：

```json
{
    "linter": false,
    "fzfinder": false
}
```

### 5.4 你当前的 bindings.json（自定义部分）

| 按键 | 功能 |
|---|---|
| `Ctrl-P` | 命令模式（默认是 `Ctrl-E`，你改过） |
| `Ctrl-B` / `Ctrl-L` | 垂直 / 水平分屏 |
| `Ctrl-K` / `Ctrl-X` | 剪切当前行 |
| `Ctrl-D` / `Alt-d` | 复制当前行 |
| `Alt-↑` / `Alt-↓` | 上下移动当前行 |
| `Alt-n` | 新建文件（`command-edit:touch `） |
| `Ctrl-/` | 注释（comment 插件） |
| `F2`/`Ctrl-S` / `F4`/`Ctrl-Q` | 保存 / 退出 |
| `F12`/`Ctrl-W` | 切换分屏 |

micro 默认按键大全：编辑器内 `> help defaultkeys`；当前实际绑定：**`Alt-g`**。

---

## 6. C++ 编辑体验细节

- **文件类型识别**：`.cpp/.cc/.cxx/.h/.hpp` → `ft:c++`（状态栏可见）。语法文件是内置的 `runtime/syntax/cpp.yaml`，可以拷到 `~/.config/micro/syntax/cpp.yaml` 覆盖。
- **缩进**：`tabstospaces: true` + `tabsize: 4` + `indentchar: " "`（默认空格）。`ftoptions` 不会覆盖 C++ 的设置，所以全局值直接生效。
- **括号**：`autoclose` 负责补全，`matchbrace` 负责高亮匹配。二者互不冲突：前者管输入，后者管显示。
- **注释**：`Ctrl+/`（comment 插件）会按 C++ 用 `//`。
- **换行缩进**：在一行末尾输入 `{` 后回车，会自动多缩进一级并把 `}` 顶格（这是 autoclose 的 `preInsertNewline` 行为）。

### 与刷题工作流的配合

```bash
algo two-sum            # 生成 ./two-sum/（problem.md 题面 + solution.md 解法 + whiteboard.excalidraw 白板 + 代码 + Makefile）
algo add two-sum --problem-file p.md --solution-file s.md   # 或一次性把内容灌进去
cd two-sum && micro .    # 开始写
# 写完：Alt-r（需 algo setup --init）或开个终端 make run / make check
```

- `make run` 用 `in.txt` 当标准输入；
- `make check` 和 `out.txt` 对拍，输出 `✅ AC` / `❌ WA`；
- `make debug` 带 AddressSanitizer + UBSan，专门抓越界和未定义行为。
- 以上目标跑完都会**自动删掉二进制**（只有 `make build` 会保留），目录里不留编译产物。

在 micro 里想开个终端跑命令：`> term`（分屏终端）；或直接 `Ctrl+B` 跑一次 shell 命令（默认绑定）。

---

## 7. 进阶：`init.lua`

```bash
algo setup --init      # 只在 ~/.config/micro/init.lua 不存在时创建
```

生成的内容给你绑了一个 `Alt-r`：**保存当前文件并执行 `make run`**（把 micro 暂时收起来跑命令，回车返回）：

```lua
local config = import("micro/config")
local shell = import("micro/shell")

function algoRun(bp)
    bp:Save()
    shell.RunInteractiveShell("make run", true, false)
end

function init()   -- 必须在 init() 里注册，见 §2.2
    config.MakeCommand("algo-run", algoRun, config.NoComplete)
    config.TryBindKey("Alt-r", "command:algo-run", true)
end
```

更多的常用写法：

```lua
-- 1) 打开同目录的 in.txt / out.txt
function openInput(bp)
    bp:Open(`${Filepath.Dir(bp.Buf.Path)}/in.txt`)   -- 需要 local Filepath = import("path/filepath")
end

-- 2) 只编译不运行
function algoBuild(bp)
    bp:Save()
    shell.RunInteractiveShell("make", true, false)
end

-- 3) 每次保存后自动格式化（不推荐：会引入外部依赖，破坏“清爽”）
```

插件 API 全表：`> help plugins`。要点：`config.MakeCommand(name, fn, completer)`、`config.TryBindKey(key, action, overwrite)`、`shell.RunInteractiveShell(cmd, wait, getOutput)`。

---

## 8. 故障排查

| 现象 | 原因 | 解决 |
|---|---|---|
| 又出现下划线报错 | `"linter"` 被改回 `true`，或装了 `lsp`/其它 diagnostic 插件 | 设 `"linter": false`；`micro -plugin list` 检查有无 `lsp` |
| 左括号不自动补全 | `"autoclose": false` | 设为 `true`（或删掉该键，默认开启） |
| 改了 settings.json 没生效 | 没重载；或写到了别的 config dir | `Ctrl+E` → `reload`；确认没有设置 `MICRO_CONFIG_DIR` |
| micro 启动报 JSON 错误 | settings.json 语法错（注释/多余逗号） | 用 `algo setup` 重写，或从 `.bak-` 备份恢复 |
| 出现 `assignment to entry in nil map` | `init.lua` 顶层调用了 `MakeCommand` | 挪进 `init()` / `preinit()` |
| 颜色发灰、无真彩色 | 终端不认识 `truecolor` | 确认终端支持 24-bit（如 Ghostty/iTerm2），或把 `truecolor` 设 `auto` |
| 中文/emoji 错位 | 终端宽度计算 | 属于终端层面，micro 无解；可关 `softwrap` |
| `fatal error: 'bits/stdc++.h' file not found` | **与 micro 无关**：这是 GCC 专有头，Apple clang/libc++ 没有 | 用显式 include（脚手架默认就是），或 `brew install gcc` 后用 `make CXX=g++-14` |
| 插件装了没反应 | 被 `settings.json` 里同名键设成了 `false` | 改成 `true` 或删掉该键 |

---

## 9. 还原 / 卸载

- **恢复配置**：`cp ~/.config/micro/settings.json.bak-<时间戳> ~/.config/micro/settings.json`；
- **只撤掉某项**：编辑 `settings.json` 删键（例如删掉 `"linter": false` 就会恢复保存时检查）；
- **撤掉 init.lua**：`rm ~/.config/micro/init.lua`（如果里面还有你自己的东西，只删 `algoRun`/`init` 相关片段）；
- **卸载 CLI**：`make -C cli uninstall`（只删 `~/.local/bin/algo`，不动 micro 配置）。

---

## 10. 参考

- micro 官网 / 仓库：<https://github.com/micro-editor/micro>
- 插件频道：<https://github.com/micro-editor/plugin-channel>
- 社区插件集合：<https://github.com/micro-editor/updated-plugins>
- 官方帮助主题：`> help options`、`> help defaultkeys`、`> help keybindings`、`> help plugins`、`> help commands`、`> help linter`、`> help comment`、`> help status`
- 本项目脚手架说明：[`README.md`](./README.md)
