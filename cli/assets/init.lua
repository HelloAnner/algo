-- ~/.config/micro/init.lua — 由 `algo setup --init` 生成
-- 已经存在时不会被覆盖；删掉对应片段即可撤销。
--
-- 四个快捷键（在题目目录里的 solution.cpp 上按）：
--   Alt-r  保存并 make run   —— 编译 + 跑 in.txt，和 out.txt 一致就打印一行 AC
--   Alt-t  保存并 make check —— 编译 + 静态检查 + 写法检查 + 对拍；没问题不输出
--   Alt-i  打开同目录的 in.txt（样例输入）
--   Alt-o  打开同目录的 out.txt（期望输出）
-- 命令用 `make -C <当前文件所在目录>` 执行，所以在哪个目录启动 micro 都能跑。

local config = import("micro/config")
local shell = import("micro/shell")
local buffer = import("micro/buffer")
local micro = import("micro")
local filepath = import("path/filepath")

-- 当前文件所在目录（题目目录）；没保存过的新文件就是 micro 的当前目录
local function currentDir(bp)
    local path = bp.Buf.AbsPath
    if path == nil or path == "" then path = bp.Buf.Path end
    if path == nil or path == "" then return "." end
    return filepath.Dir(path)
end

-- 用单引号包住路径，避免空格 / 特殊字符被 shell 拆开
local function quote(s)
    return "'" .. s:gsub("'", "'\\''") .. "'"
end

-- 保存 + 跑一条 make 目标（把 micro 暂时收起来，跑完回车返回）
local function runMake(bp, target)
    bp:Save()
    shell.RunInteractiveShell("make -C " .. quote(currentDir(bp)) .. " " .. target, true, false)
end

function algoRun(bp)
    runMake(bp, "run")
end

function algoCheck(bp)
    runMake(bp, "check")
end

-- 打开同目录的 in.txt / out.txt；文件不存在就开一个空 buffer，保存即创建
local function openSibling(bp, name)
    local path = filepath.Join(currentDir(bp), name)
    local buf, err = buffer.NewBufferFromFile(path)
    if err ~= nil then
        micro.InfoBar():Error("打不开 " .. path)
        return
    end
    bp:OpenBuffer(buf)
end

function algoIn(bp)
    openSibling(bp, "in.txt")
end

function algoOut(bp)
    openSibling(bp, "out.txt")
end

-- 注意：命令必须放在 init() 里注册。
-- micro 的启动顺序是 LoadAllPlugins() → action.InitCommands() → preinit() → init()，
-- 在顶层直接调用 config.MakeCommand 时 commands map 还没建好，
-- 会报 "assignment to entry in nil map"。
function init()
    config.MakeCommand("algo-run", algoRun, config.NoComplete)
    config.MakeCommand("algo-check", algoCheck, config.NoComplete)
    config.MakeCommand("algo-in", algoIn, config.NoComplete)
    config.MakeCommand("algo-out", algoOut, config.NoComplete)
    config.TryBindKey("Alt-r", "command:algo-run", true)
    config.TryBindKey("Alt-t", "command:algo-check", true)
    config.TryBindKey("Alt-i", "command:algo-in", true)
    config.TryBindKey("Alt-o", "command:algo-out", true)
end
