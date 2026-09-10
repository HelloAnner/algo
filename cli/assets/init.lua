-- ~/.config/micro/init.lua — 由 `algo setup --init` 生成
-- 已经存在时不会被覆盖；删掉对应片段即可撤销。

local config = import("micro/config")
local shell = import("micro/shell")

-- Alt-r：保存并 make run 跑一遍 in.txt（在题目目录里用）
function algoRun(bp)
    bp:Save()
    shell.RunInteractiveShell("make run", true, false)
end

-- 注意：必须放在 init() 里注册。
-- micro 的启动顺序是 LoadAllPlugins() → action.InitCommands() → preinit() → init()，
-- 在顶层直接调用 config.MakeCommand 时 commands map 还没建好，
-- 会报 "assignment to entry in nil map"。
function init()
    config.MakeCommand("algo-run", algoRun, config.NoComplete)
    config.TryBindKey("Alt-r", "command:algo-run", true)
end
