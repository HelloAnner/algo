# micro 终端编辑器 · 插件与配置详解

> 面向「C++ / ACM 模式刷面试算法」的场景。
> 本文说明 `algo setup` 到底往 `~/.config/micro/` 写了什么、为什么这么配、以及怎么微调和还原。
>
> 本机环境：macOS 15 · micro 2.0.15（Homebrew）· 配置目录 `~/.config/micro`

---

## 0. TL;DR

| 你想干的事 | 命令 |
|---|---|
| 安装 / 合并这套 C++ 刷题配置 | `algo setup`（或 `make -C cli setup`）：settings.json + bindings.json |
| 只看改什么、不落盘 | `algo setup --dry-run` |
| 再加上 `init.lua`（Alt-r 跑样例、Alt-t 对拍、Alt-i/Alt-o 开样例） | `algo setup --init`（已存在则绝不覆盖） |
| 题目目录里看题面 / 解法 / 跑样例 / 对拍 | `make p` / `make s` / `make r` / `make c` |
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

micro 的配置目录默认是 `~/.config/micro`（macOS 与 Linux 相同）。

micro 自己认的覆盖方式是 **`MICRO_CONFIG_HOME` 环境变量**（其次 `XDG_CONFIG_HOME`，都见 `internal/config/config.go` 的 `InitConfigDir`）和 **`micro -config-dir /path`** 启动参数（目录必须已存在）。

> ⚠️ `MICRO_CONFIG_DIR` 是 **algo CLI 自己的约定**（`algo setup` 用它定位要写哪个配置目录，也给测试用），**micro 二进制不读它**。
> 实测：把 `MICRO_CONFIG_DIR` 指到别处，micro 照样读 `~/.config/micro`；换成 `-config-dir` 渲染结果立刻不同。
> 所以只想改 algo 写哪儿就设 `MICRO_CONFIG_DIR`，想让 micro 也读别处就设 `MICRO_CONFIG_HOME`（或 `-config-dir`）。

| 路径 | 作用 |
|---|---|
| `settings.json` | 全局选项（**`algo setup` 合并这个文件**，见 §3.1） |
| `bindings.json` | 按键绑定（**`algo setup` 也合并这个文件**，见 §3.3） |
| `init.lua` | 用户自己的 Lua 插件（`algo setup --init` 生成，提供 Alt-r/t/i/o，见 §7） |
| `plug/<名字>/` | 通过插件管理器安装的第三方插件 |
| `syntax/*.yaml` | 自定义语法文件（C++ 是 `cpp.yaml`） |
| `colorschemes/*.micro` | 自定义配色 |
| `snippets/*.snippets` | 自定义代码片段——⚠️ snippets 插件**不读这个目录**（只读 `plug/snippets/snippets/`，见 §5.2） |
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

它做两件事：**把下面这些键 merge 进 `~/.config/micro/settings.json`，再把 §3.3 那几个键 merge 进 `~/.config/micro/bindings.json`**。

- 其它键（你自己配的）原样保留；
- 只有内容真的发生变化时才写入，写之前先备份成 `<文件名>.bak-YYYYMMDD-HHMMSS`；
- 幂等：重复执行第二次会输出「已是最新，无需改动」；
- 分工：`settings.json` 管「怎么编辑」，`bindings.json` 管「按哪个键」，`init.lua`（`algo setup --init`）提供 Alt-r / Alt-t / Alt-i / Alt-o 四个命令，见 §7。

### 3.1 逐项解释

| 键 | 值 | 作用 | 分组 |
|---|---|---|---|
| `autosave` | `2` | **每 2 秒静默自动保存**（不是布尔，单位是秒，见 §3.2） | 自动保存 |
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
| `softwrap` | `true` | **按终端宽度自动换行**（超宽的行折到下一屏行，不再横向滚出去） | 观感 |
| `wordwrap` | `true` | 折行时**在空格处断**，不把标识符/数字劈成两半（只在 `softwrap` 开着时有效） | 观感 |
| `cursorline` | `true` | 高亮当前行 | 界面 |
| `statusline` | `true` | 显示底部状态栏 | 界面 |
| `scrollbar` | `true` | 右侧滚动条 | 界面 |
| `truecolor` | `"on"` | 24-bit 真彩色（终端支持时配色更准） | 界面 |
| `mouse` | `true` | 支持鼠标点选/滚动 | 界面 |
| `savecursor` | `true` | 记住上次光标位置 | 会话 |
| `saveundo` | `true` | 重启后仍能撤销 | 会话 |

> 默认值对比（来自 `micro -options`）：`tabstospaces` 默认 `false`、`trucolor` 默认 `auto`、`rmtrailingws` 默认 `false`、`softwrap`/`wordwrap` 默认都是 `false`（**micro 默认不折行**，长行只能横向滚）、`savecursor`/`saveundo`/`scrollbar` 默认都是 `false`。也就是说 `algo setup` 主要是把这些「更顺手」的开关打开，并且**关掉 linter**。

### 3.2 自动保存（autosave，静默）

micro 的 `autosave` **不是布尔开关，而是「秒数」**：值 `N > 0` 表示每 N 秒检查一次，有改动就落盘，没改动就不写；`0` 表示关闭。

- 写 `true` 也能用，但会被 micro 兼容转换成 **8 秒**（见 `internal/config/settings.go` 里把 bool 转成 float 的那段）；你原来的配置就是 `"autosave": true`，也就是 8 秒才存一次。
- 现在 `algo setup` 设成 **`2`**：手速再快也不会丢东西，正常节奏下每 2 秒静默存一次。

**为什么说是「静默」**：micro 的自动保存路径是 `Buffer.AutoSave()` → `saveToFile(path, false, true)`，全程不调用任何提示接口，**屏幕上不会出现任何消息**。唯一的可见变化是状态栏里的 `$(modified)` 标记（`*`）消失。

实测（2 秒配置，pty 里输入 `abc` 后等待，再退出）：

```
文件内容: abc                       ← 2 秒内已经落盘
屏幕提示: （没有 autosaved / saved / 任何弹窗）
退出提示: （没有 unsaved changes）
```

两个副作用值得知道：

1. 自动保存路径**会跳过 `rmtrailingws`**（micro 的 `saveToFile` 里 `!autoSave && rmtrailingws` 才清理行尾空格）。也就是说行尾空格只在手动 `Ctrl+S` 时才会被删。
2. 开了 autosave 之后，**退出时有未保存改动会直接保存再退出**，不再询问（`internal/action/actions.go`）。

想调频率：直接改 `settings.json` 里的数字（`0` 关闭），比如 `"autosave": 1`。

### 3.3 按键绑定（merge 进 bindings.json）

只写这 6 个「micro 默认不是这样、但刷题更顺手」的键，其余保持 micro 默认（§5.4）：

| 按键 | 值 | 作用 |
|---|---|---|
| `Ctrl-P` | `CommandMode` | 命令模式（micro 默认在 `Ctrl-E`，这里额外加一个） |
| `Ctrl-B` | `command:vsplit` | 左右分屏（默认是 `ShellMode`） |
| `Ctrl-L` | `command:hsplit` | 上下分屏（默认是 `command-edit:goto `，即跳行） |
| `F12` | `NextSplit\|FirstSplit` | 在分屏之间跳（默认只有 `Ctrl-W`） |
| `Alt-n` | `command-edit:open ` | 新建文件：回车后输入文件名（`open` 对不存在的文件会开一个空 buffer，保存即创建） |
| `Alt-d` | `DuplicateLine` | 复制当前行（默认只有 `Ctrl-D`） |

> 这几个键会盖掉 micro 的默认绑定（`Ctrl-P`=`FindPrevious`、`Ctrl-B`=`ShellMode`、`Ctrl-L`=`command-edit:goto`、`Alt-n`=`SpawnMultiCursor`）。
> 不想要哪个，就在 `bindings.json` 里删掉那一行；下次 `algo setup` 只会把它加回来，不会动你别的东西。

### 3.4 合并策略与还原

- 备份文件：`~/.config/micro/settings.json.bak-<时间戳>`、`bindings.json.bak-<时间戳>`；拷回去就完全还原。
- 只想撤销某一项：把该键删掉即可（比如把 `"linter": true` 改回去，报错下划线就回来了；把 `"Ctrl-B"` 那行删掉，`Ctrl-B` 就恢复成默认的 `ShellMode`）。
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

### 5.2 第三方插件（可选，默认一个都不装）

`algo setup` **不装任何第三方插件**，`~/.config/micro/plug/` 默认不存在——内置的 7 个（§5.1）已经覆盖了刷题要用的全部功能。

想加别的能力就自己装（`micro -plugin install <名字>`，名字用 `micro -plugin available` 查）：

| 插件 | 注册的命令 | 说明 |
|---|---|---|
| `snippets` | `Alt-s` 插入 / `Alt-w` 下一占位符 / `Alt-a` 接受 / `Alt-d` 取消 | 代码片段。⚠️ 它**只读自己目录下的 `*.snippets`**（`~/.config/micro/plug/snippets/snippets/`），文件名必须等于 micro 的 filetype —— C++ 是 `c++`，所以要 `c++.snippets`（插件自带的 `c.snippets` 对 C++ 不生效；`micro -plugin update` 可能覆盖这个目录） |
| `fzfinder` | `fzfinder` | 调 `fzf` 模糊找文件、`bat` 预览（**不在官方频道**，得自己 clone 到 `~/.config/micro/plug/`） |
| `recentfiles` | `recentfiles` | 从 `recent_files` 召回最近打开的文件（同上） |

> ⚠️ 冲突提醒：如果装了 `snippets`，它用 `TryBindKey(..., overwrite=false)` 注册 `Alt-d`，而 `bindings.json` 把 `Alt-d` 绑成了 `DuplicateLine`——**bindings.json 优先**，所以 `Alt-d` 是复制行，片段取消用 `> snippetcancel`。
>
> `fzfinder` / `recentfiles` 只注册命令、**不会自动绑键**。装完自己往 `bindings.json` 里加一行，例如 `{ "Alt-Tab": "command:fzfinder" }`；algo 只 merge 自己那几个键，你加的会原样保留。

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

### 5.4 按键绑定（bindings.json + init.lua）

`algo setup` 写进 `bindings.json` 的 6 个键（目的是把「刷题常用」放到顺手的位置，其余保持 micro 默认）：

| 按键 | 功能 | micro 默认 |
|---|---|---|
| `Ctrl-P` | 命令模式 | `Ctrl-E`（`Ctrl-P` 原来是 `FindPrevious`，`Ctrl-E` 仍然可用） |
| `Ctrl-B` / `Ctrl-L` | 左右 / 上下分屏 | `ShellMode` / `goto` |
| `F12` | 在分屏之间跳 | 只有 `Ctrl-W` |
| `Alt-n` | 新建文件（`command-edit:open `） | `SpawnMultiCursor` |
| `Alt-d` | 复制当前行 | 无（`Ctrl-D` 也能复制） |

`algo setup --init` 再由 `init.lua` 注册四个（见 §7）：

| 按键 | 功能 |
|---|---|
| `Alt-r` | 保存 + `make run`：编译、跑 `in.txt`，和 `out.txt` 一致就打印一行 `AC` |
| `Alt-t` | 保存 + `make check`：编译 + 静态检查 + 写法检查 + 对拍，**没问题什么都不输出** |
| `Alt-i` / `Alt-o` | 打开同目录的 `in.txt` / `out.txt`（不存在就开个空 buffer，保存即创建） |

micro 默认就有、**不用**重复写的：`Ctrl-K`/`Ctrl-X` 剪行、`Ctrl-D` 复制行、`Alt-↑`/`Alt-↓` 上下移动行、`Ctrl-S`/`F2` 保存、`Ctrl-Q`/`F4` 退出、`Ctrl-W` 切分屏、`Ctrl-/`（`CtrlUnderscore`）注释、`Tab` 缩进。

micro 默认按键大全：编辑器内 `> help defaultkeys`；当前实际绑定：按 **`Alt-g`**。

---

## 6. C++ 编辑体验细节

- **文件类型识别**：`.cpp/.cc/.cxx/.h/.hpp` → `ft:c++`（状态栏可见）。语法文件是内置的 `runtime/syntax/cpp.yaml`，可以拷到 `~/.config/micro/syntax/cpp.yaml` 覆盖。
- **缩进**：`tabstospaces: true` + `tabsize: 4` + `indentchar: " "`（默认空格）。`ftoptions` 不会覆盖 C++ 的设置，所以全局值直接生效。
- **括号**：`autoclose` 负责补全，`matchbrace` 负责高亮匹配。二者互不冲突：前者管输入，后者管显示。
- **注释**：`Ctrl+/`（comment 插件）会按 C++ 用 `//`。
- **换行缩进**：在一行末尾输入 `{` 后回车，会自动多缩进一级并把 `}` 顶格（这是 autoclose 的 `preInsertNewline` 行为）。
- **长行自动折行**：`softwrap: true` + `wordwrap: true`，超宽的行按终端宽度折到下一屏行、在空格处断开（**micro 默认是 `false`**：长行只能横向滚动，屏幕上看不到尾巴）。终端很窄时把窗口拉宽即可，折行位置会跟着变；改宽度后不用重开 micro。

  实测（40 列的小 pty + 一行 160 字符）：`softwrap: false` 时屏幕上**看不到**行尾；`softwrap: true` 时行尾正常出现在下面的屏行里。

### 与刷题工作流的配合

```bash
algo two-sum            # 生成 ./two-sum/（problem.md 题面 + solution.md 解法 + whiteboard.excalidraw 白板 + 代码 + Makefile）
algo add two-sum --problem-file p.md --solution-file s.md   # 或一次性把内容灌进去
algo in / algo out      # 直接改样例输入 / 期望输出（也在 micro 里编辑）
make p / make s         # micro 打开题面 problem.txt / 解法 solution.txt（答案在里面）
make e / make w         # micro 打开 solution.cpp（空模板）/ 打开白板（等价于 algo edit / algo board）
cd two-sum && micro .    # 开始写
# 写完：Alt-r 跑样例 / Alt-t 对拍（需 algo setup --init），或 make r / make c
```

- `make run`（简写 `make r`）编译 + 用 `in.txt` 跑一遍，和 `out.txt` 一致就打印一行 `AC`；
- `make check`（简写 `make c`）编译 + 静态检查 + 写法检查 + 对拍，**没问题什么都不输出**；
- `make debug` 带 AddressSanitizer + UBSan，专门抓越界和未定义行为；
- `make p` / `make s` / `make e` 用 micro 打开题面 / 解法 / 代码；题面和解法是纯 txt，代码是**空模板**，实现自己写（参考代码在 solution.txt 的 `[C++ 代码]` 里）。
- 以上目标跑完都会**自动删掉二进制**（只有 `make build` 会保留），目录里不留编译产物。

在 micro 里想跑 shell 命令：`> term` 开一个分屏终端，或 `> run <命令>` 后台跑（输出在新 tab）。
（`Ctrl+B` 原本是 `ShellMode`，现在被换成左右分屏了，见 §5.4；想要回来就删掉 `bindings.json` 里那一行。）

---

## 7. 进阶：`init.lua`

```bash
algo setup --init      # 只在 ~/.config/micro/init.lua 不存在时创建
```

生成的内容给你绑了四个键（都在题目目录里的 `solution.cpp` 上按）：

| 按键 | 做什么 |
|---|---|
| `Alt-r` | 保存 + `make run`：编译、跑 `in.txt`，和 `out.txt` 一致就打印一行 `AC` |
| `Alt-t` | 保存 + `make check`：编译 + 静态检查 + 写法检查 + 对拍，没问题什么都不输出 |
| `Alt-i` / `Alt-o` | 打开同目录的 `in.txt` / `out.txt`（不存在就开个空 buffer，保存即创建） |

跑命令用的是 `shell.RunInteractiveShell(..., wait=true, ...)`：micro 会暂时收起屏幕、把终端让给命令，**跑完回车返回**。
命令一律是 `make -C <当前文件所在目录> <目标>`，所以不管你从哪个目录启动 micro 都能跑对题目。

```lua
local function runMake(bp, target)
    bp:Save()
    shell.RunInteractiveShell("make -C " .. quote(currentDir(bp)) .. " " .. target, true, false)
end

function init()   -- 必须在 init() 里注册，见 §2.2
    config.MakeCommand("algo-run", algoRun, config.NoComplete)
    config.TryBindKey("Alt-r", "command:algo-run", true)
    -- ... algo-check / algo-in / algo-out 同理
end
```

打开同目录文件用的是 `micro/buffer` + `bp:OpenBuffer()`（`bp:Open()` 在 2.0.15 里**不存在**）：

```lua
local buf, err = buffer.NewBufferFromFile(filepath.Join(currentDir(bp), "in.txt"))
bp:OpenBuffer(buf)   -- 文件不存在时 NewBufferFromFile 会返回一个空 buffer
```

想自己加命令，照抄 `cli/assets/init.lua` 里的写法即可；完整的原文就是 `algo setup --init` 生成的那份。

插件 API 全表：`> help plugins`。要点：`config.MakeCommand(name, fn, completer)`、`config.TryBindKey(key, action, overwrite)`、`shell.RunInteractiveShell(cmd, wait, getOutput)`。

---

## 8. 故障排查

| 现象 | 原因 | 解决 |
|---|---|---|
| 又出现下划线报错 | `"linter"` 被改回 `true`，或装了 `lsp`/其它 diagnostic 插件 | 设 `"linter": false`；`micro -plugin list` 检查有无 `lsp` |
| 左括号不自动补全 | `"autoclose": false` | 设为 `true`（或删掉该键，默认开启） |
| 改了 settings.json 没生效 | 没重载；或写到了别的 config dir | `Ctrl+E` → `reload`；确认没设 `MICRO_CONFIG_HOME`（micro 认这个，不认 `MICRO_CONFIG_DIR`） |
| micro 启动报 JSON 错误 | settings.json 语法错（注释/多余逗号） | 用 `algo setup` 重写，或从 `.bak-` 备份恢复 |
| 出现 `assignment to entry in nil map` | `init.lua` 顶层调用了 `MakeCommand` | 挪进 `init()` / `preinit()` |
| 颜色发灰、无真彩色 | 终端不认识 `truecolor` | 确认终端支持 24-bit（如 Ghostty/iTerm2），或把 `truecolor` 设 `auto` |
| 中文/emoji 错位、折行位置怪 | 终端按「字符数」估算宽度，CJK 是双宽 | 属于终端层面，micro 无解；实在别扭可临时关掉 `softwrap`（长行就变成横向滚动） |
| `fatal error: 'bits/stdc++.h' file not found` | **与 micro 无关**：这是 GCC 专有头，Apple clang/libc++ 没有 | `make -C ~/algo/cli install` 装兼容头（脚手架已有 `-I` 指过去）；或 `brew install gcc` 后 `make CXX=g++-14` |
| 插件装了没反应 | 被 `settings.json` 里同名键设成了 `false` | 改成 `true` 或删掉该键 |
| `Alt-r` / `Alt-t` / `Alt-i` / `Alt-o` 没反应 | 没生成 `init.lua`（`algo setup` 默认不写它） | `algo setup --init`，然后在 micro 里 `Ctrl-P` → `reload` |
| `Alt-r` 报找不到 Makefile | 当前文件不在题目目录里 | 打开某个题目的 `solution.cpp` 再按（命令是 `make -C <文件所在目录>`） |
| `Ctrl-P` 不是命令模式了 | `bindings.json` 里那一行被改掉/删了 | `algo setup` 重新合并（不会动你其它键） |
| 分屏快捷键不习惯 | `Ctrl-B`/`Ctrl-L` 盖掉了默认的 `ShellMode` / `goto` | 删掉 `bindings.json` 里对应那行，或改绑别的键 |

---

## 9. 还原 / 卸载

- **恢复配置**：`cp ~/.config/micro/settings.json.bak-<时间戳> ~/.config/micro/settings.json`（`bindings.json` 同理）；
- **只撤掉某项**：编辑对应文件删键（例如删掉 `"linter": false` 就恢复保存时检查；删掉 `"Ctrl-B"` 那行就恢复默认的 `ShellMode`）；
- **撤掉 init.lua**：`rm ~/.config/micro/init.lua`（如果里面还有你自己的东西，只删 `algo-run`/`algo-check`/`algo-in`/`algo-out` 和 `init` 相关片段）；
- **卸载 CLI**：`make -C cli uninstall`（只删 `~/.local/bin/algo`，不动 micro 配置）。

---

## 10. 参考

- micro 官网 / 仓库：<https://github.com/micro-editor/micro>
- 插件频道：<https://github.com/micro-editor/plugin-channel>
- 社区插件集合：<https://github.com/micro-editor/updated-plugins>
- 官方帮助主题：`> help options`、`> help defaultkeys`、`> help keybindings`、`> help plugins`、`> help commands`、`> help linter`、`> help comment`、`> help status`
- 本项目脚手架说明：[`README.md`](./README.md)
