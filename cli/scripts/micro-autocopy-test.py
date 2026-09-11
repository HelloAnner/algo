#!/usr/bin/env python3
"""端到端验证 algo 自带的 micro 插件 autocopy（划词即复制）。

    python3 scripts/micro-autocopy-test.py --config-dir <micro 配置目录> [--file <测试文件>]

流程：备份当前剪贴板（跑完还原）→ 在 pty 里启动真 micro（80x24，TERM=xterm-256color）
→ 发 SGR 鼠标序列：拖选 "world"、双击选 "hello" → 断言 pbpaste 拿到的正是选中的那段文本。

为什么这么测：micro 的鼠标事件只有真终端才会产生，插件的全部价值又只在「系统剪贴板有没有变」。
不去 grep micro 的屏幕输出 —— 它是增量重绘，原始流里的文本是残缺的（见 cli/micro.md 的环境事实）。

只依赖 Python 标准库；缺 micro / pbpaste 时由调用方（scripts/smoke-test.sh）跳过。
"""

import argparse
import fcntl
import os
import pty
import select
import shutil
import signal
import struct
import subprocess
import sys
import tempfile
import termios
import threading
import time

COLS, ROWS = 80, 24
# 文件只有一行 "hello world"：屏幕第 1 行是缓冲区第 1 行，行号占两列（"1 "），正文从第 3 列开始。
# 于是 "hello" 在第 3..7 列，"world" 在第 9..13 列（都是 1-based 的终端列）。
ROW = 1
HELLO_COL, WORLD_START, WORLD_END = 3, 9, 14


def clipboard() -> str:
    return subprocess.run(["pbpaste"], capture_output=True, text=True).stdout


def set_clipboard(text: str) -> None:
    subprocess.run(["pbcopy"], input=text, text=True)


class Micro:
    """在 pty 里跑一个真 micro，并按需喂鼠标/键盘事件。"""

    def __init__(self, config_dir: str, path: str):
        self.output = bytearray()
        pid, fd = pty.fork()
        if pid == 0:
            os.environ["TERM"] = "xterm-256color"
            os.execvp("micro", ["micro", "-config-dir", config_dir, path])
        self.pid, self.fd = pid, fd
        fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", ROWS, COLS, 0, 0))
        self.stop = False
        threading.Thread(target=self._drain, daemon=True).start()
        time.sleep(1.5)  # 等 micro 画完第一屏

    def _drain(self):
        while not self.stop:
            r, _, _ = select.select([self.fd], [], [], 0.2)
            if r:
                try:
                    data = os.read(self.fd, 65536)
                except OSError:
                    return
                if not data:
                    return
                self.output.extend(data)

    def send(self, data: bytes, wait: float = 0.4):
        os.write(self.fd, data)
        time.sleep(wait)

    def drag(self, col_from: int, col_to: int):
        """按下左键 → 拖 → 松开（SGR 鼠标：按下 0、拖动 32、松开 m 结尾）。"""
        self.send(b"\x1b[<0;%d;%dM" % (col_from, ROW), 0.3)
        self.send(b"\x1b[<32;%d;%dM" % (col_to, ROW), 0.3)
        self.send(b"\x1b[<0;%d;%dm" % (col_to, ROW), 0.8)

    def double_click(self, col: int):
        """双击选词：micro 靠「两次按下的间隔 + 位置」判断双击，
        所以必须是 按下-松开-按下-松开（间隔要短，实测 0.3 秒就不算双击了）。"""
        self.send(b"\x1b[<0;%d;%dM" % (col, ROW), 0.08)
        self.send(b"\x1b[<0;%d;%dm" % (col, ROW), 0.08)
        self.send(b"\x1b[<0;%d;%dM" % (col, ROW), 0.08)
        self.send(b"\x1b[<0;%d;%dm" % (col, ROW), 0.8)

    def close(self):
        self.stop = True
        try:
            os.kill(self.pid, signal.SIGKILL)
            os.waitpid(self.pid, 0)
        except OSError:
            pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config-dir", required=True, help="micro 配置目录（要有 plug/autocopy/）")
    ap.add_argument("--file", help="测试文件（默认自己造一个临时文件）")
    args = ap.parse_args()

    if not shutil.which("micro"):
        print("跳过：没装 micro")
        return 0
    if not shutil.which("pbpaste"):
        print("跳过：没有 pbpaste（非 macOS）")
        return 0

    plugin = os.path.join(args.config_dir, "plug", "autocopy", "autocopy.lua")
    if not os.path.exists(plugin):
        print("✗ %s 不存在：先跑 algo setup" % plugin)
        return 1

    tmpdir = tempfile.mkdtemp(prefix="algo-autocopy-")
    path = args.file or os.path.join(tmpdir, "hello.txt")
    with open(path, "w") as f:
        f.write("hello world\n")

    saved = clipboard()
    failures = []
    micro = None
    try:
        set_clipboard("algo-autocopy-test-sentinel")
        micro = Micro(args.config_dir, path)

        micro.drag(WORLD_START, WORLD_END)
        got = clipboard()
        print("  拖选 world → 剪贴板 %r" % got)
        if got != "world":
            failures.append("拖选后剪贴板应该是 'world'，实际 %r" % got)

        micro.double_click(HELLO_COL)
        got = clipboard()
        print("  双击 hello → 剪贴板 %r" % got)
        if got != "hello":
            failures.append("双击后剪贴板应该是 'hello'，实际 %r" % got)

        # 没有选区（空点一下）不该动剪贴板
        set_clipboard("algo-untouched")
        micro.send(b"\x1b[<0;%d;%dM" % (WORLD_START, ROW), 0.2)
        micro.send(b"\x1b[<0;%d;%dm" % (WORLD_START, ROW), 0.6)
        got = clipboard()
        print("  单击取消选择 → 剪贴板 %r" % got)
        if got != "algo-untouched":
            failures.append("没有选区时不该改剪贴板，实际 %r" % got)
    finally:
        if micro is not None:
            micro.close()
        set_clipboard(saved)  # 还原用户原来的剪贴板
        shutil.rmtree(tmpdir, ignore_errors=True)

    if failures:
        for msg in failures:
            print("✗ %s" % msg)
        return 1
    print("✓ autocopy：拖选 / 双击 / 无选区三种情况都符合预期")
    return 0


if __name__ == "__main__":
    sys.exit(main())
