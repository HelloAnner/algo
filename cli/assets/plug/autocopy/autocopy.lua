-- autocopy —— 划词即复制：鼠标选中文本后松开左键，自动写入系统剪贴板
--
-- 由 `algo setup` 装到 ~/.config/micro/plug/autocopy/，micro 启动时自动加载。
-- 关掉：settings.json 里写 "autocopy": false（micro 的插件级开关，见 > help options）。
-- 卸载：删掉 ~/.config/micro/plug/autocopy/ 整个目录。
--
-- 为什么需要它：micro 内置的 MouseRelease 只把选区写进 primary register（X11 的主选区），
-- 而 macOS 的剪贴板后端（clipper + pbcopy）没有 primary，划完词系统剪贴板不会变。
-- 这个插件在松开左键时改调 bp:Copy() —— 和 Ctrl-C 完全相同的那条通道，因此
-- settings.json 里的 clipboard 设置（external / terminal / internal）照常生效。

VERSION = "1.0.0"

local config = import("micro/config")
local util = import("micro/util")

-- 上一次复制过的文本：双击/三击会连发多次 MouseRelease，同一选区只写一次剪贴板
local last = ""

local function selectedText(bp)
    if bp == nil then return nil end
    local cur = bp.Cursor
    if cur == nil or not cur:HasSelection() then return nil end
    local text = util.String(cur:GetSelection())
    if text == nil or text == "" then return nil end
    return text
end

-- 松开左键：有选区就复制（拖选 / 双击选词 / 三击选行都走这里）。
-- 只认鼠标选区；键盘选区（Shift-方向键、Ctrl-A）刻意不碰，
-- 免得 Ctrl-A 把整个文件灌进剪贴板。
function onMouseRelease(bp)
    local text = selectedText(bp)
    if text == nil then
        last = ""   -- 点一下取消选择：下次选同样的内容还要能复制
        return
    end
    if text == last then return end
    last = text
    bp:Copy()
end

function init()
    -- 让 `> help autocopy` 能打开本插件的说明（文件就在这个目录的 help/ 下）
    config.AddRuntimeFile("autocopy", config.RTHelp, "help/autocopy.md")
end
