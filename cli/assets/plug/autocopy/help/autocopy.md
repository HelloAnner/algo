# autocopy —— 划词即复制

用鼠标选中文本（拖选 / 双击选词 / 三击选行）后**松开左键**，
选区会自动写进**系统剪贴板**，等同于再按一次 `Ctrl-C`。

这是 algo 自带的 micro 插件（`algo setup` 安装），装在
`~/.config/micro/plug/autocopy/`。

## 为什么需要它

micro 内置的 `MouseRelease` 只把选区写进 primary register（X11 的主选区）；
macOS 的剪贴板后端（clipper → pbcopy）没有 primary，所以划完词系统剪贴板不会变，
必须再手动按一次 `Ctrl-C`。

本插件在松开左键时改调 micro 自己的 `Copy` 通道（和 `Ctrl-C` 同一条），
因此 `settings.json` 里的 `clipboard` 设置（`external` / `terminal` / `internal`）
照常生效 —— 后者在 ssh 里用 OSC 52 也能复制。

## 行为

- **只认鼠标选区**。键盘选区（`Shift-方向键`、`Ctrl-A`）刻意不自动复制，
  免得 `Ctrl-A` 把整个文件灌进剪贴板；想复制就按 `Ctrl-C`。
- 同一段文本连续复制只写一次剪贴板（双击/三击会连发多次松开事件）。
- 复制完状态栏显示 `Copied selection`（和 `Ctrl-C` 的提示一样）。
- 需要 `settings.json` 里 `"mouse": true`（algo 的 profile 默认就开着）。

## 关闭 / 卸载

- 临时关掉：`~/.config/micro/settings.json` 里写 `"autocopy": false`（改完 `Ctrl-E` → `reload`）；
- 彻底卸载：`rm -rf ~/.config/micro/plug/autocopy`（或 `micro -plugin remove autocopy`）；
- 想再加回来：`algo setup`。
