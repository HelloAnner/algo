# 找出游戏的获胜者（约瑟夫环） — 本地编译 / 运行 / 对拍 / 编辑
#
# run 和 check 都交给 `algo`（编译、检查、跑样例都在 CLI 里做，跑完不留文件）：
#   make run    编译 + 用 in.txt 跑一遍，和 out.txt 一致就打印一行 AC（跑样例）
#   make check  编译 + 静态检查 + 写法检查，**不跑样例**；一切正常就什么都不打印
# 其余目标由本 Makefile 自己编译，注意别和 CLI 里的编译参数走偏。
# 快捷键：make r = run，make c = check，make p / make s = micro 看题面 / 解法
# 忘了有哪些目标：`make help`

ifeq ($(origin CXX), default)
CXX := clang++
endif

# 万能头 <bits/stdc++.h> 是 GCC 专有的，本机 Apple clang + libc++ 没有：
# `make -C ~/algo install` 会装一份兼容头到 ~/.local/include/bits/stdc++.h，
# 下面这个 -I 就是指向它（换位置就 make INCLUDE_DIR=... run）。
INCLUDE_DIR ?= $(HOME)/.local/include

CXXFLAGS ?= -std=c++20 -O2 -I$(INCLUDE_DIR) -Wall -Wextra -Wno-sign-compare -Wno-unused-variable
DBGFLAGS ?= -std=c++20 -g -O0 -I$(INCLUDE_DIR) -fsanitize=address,undefined -fno-omit-frame-pointer

SRC      := solution.cpp
BIN      := solution
DBGBIN   := solution_dbg
BOARD    := whiteboard.excalidraw
TMPBIN   := .algo_bin
PROBLEM  := problem.txt
SOLUTION := solution.txt

.PHONY: all help run raw check debug build e p s r c w clean

all: build

help:
	@echo "make run    编译 + 跑 in.txt，对了打印 AC（跑样例；algo run）"
	@echo "make check  编译 + 静态检查 + 写法检查，不跑样例，没问题不输出（algo check）"
	@echo "make raw    编译 + 手动输入跑（看原始输出）"
	@echo "make debug  ASan + UBSan 跑一遍，抓越界"
	@echo "make build  只编译（唯一会留下二进制，记得 make clean）"
	@echo "make r      = make run（跑样例，顺手一个字母）"
	@echo "make c      = make check（只编译 + 检查，不跑样例）"
	@echo "make e      用 micro 打开 $(SRC)（空模板，自己写）"
	@echo "make p      用 micro 打开题面 $(PROBLEM)"
	@echo "make s      用 micro 打开解法 $(SOLUTION)（答案在里面，想不出来再看）"
	@echo "make w      用系统默认程序打开 $(BOARD)"
	@echo "make clean  清掉编译产物"

# 编译 + 用 in.txt 跑一遍，和 out.txt 一致就打印一行 AC
run:
	@command -v algo >/dev/null 2>&1 || { echo "找不到 algo 命令：先在 ~/algo 里 make install"; exit 1; }
	@algo run .

# 编译 + 静态检查 + 写法检查；没问题就什么都不打印（静默即通过；跑样例用 make r）
check:
	@command -v algo >/dev/null 2>&1 || { echo "找不到 algo 命令：先在 ~/algo 里 make install"; exit 1; }
	@algo check .

# 直接跑，标准输入接终端（手动输入测试，输出原样打出来）
raw:
	@trap 'rm -f $(BIN)' EXIT; trap 'rm -f $(BIN); exit 130' INT TERM; \
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN) && ./$(BIN)

# AddressSanitizer + UBSan，专门抓越界 / 未定义行为
debug:
	@trap 'rm -f $(DBGBIN)' EXIT; trap 'rm -f $(DBGBIN); exit 130' INT TERM; \
	$(CXX) $(DBGFLAGS) $(SRC) -o $(DBGBIN) && ./$(DBGBIN) < in.txt

# 唯一会留下二进制的目标：需要反复手动跑 ./solution 时用
build: $(BIN)

$(BIN): $(SRC)
	@$(CXX) $(CXXFLAGS) $< -o $@

# make r / make c：run 和 check 的顺手写法（一个字母，不用记全名）
r: run
c: check

# micro 打开 solution.cpp
e:
	@command -v micro >/dev/null 2>&1 || { echo "没找到 micro：brew install micro"; exit 1; }
	@micro $(SRC)

# micro 打开题面 problem.txt
p:
	@command -v micro >/dev/null 2>&1 || { echo "没找到 micro：brew install micro"; exit 1; }
	@micro $(PROBLEM)

# micro 打开解法 solution.txt（答案 + 参考代码）
s:
	@command -v micro >/dev/null 2>&1 || { echo "没找到 micro：brew install micro"; exit 1; }
	@micro $(SOLUTION)

# 用系统默认程序打开白板（macOS 用 open，Linux 用 xdg-open）
w:
	@if [ ! -f $(BOARD) ]; then echo "找不到 $(BOARD)"; exit 1; fi
	@if command -v open >/dev/null 2>&1; then open $(BOARD); \
	elif command -v xdg-open >/dev/null 2>&1; then xdg-open $(BOARD); \
	else echo "没有可用的打开方式，文件在这里：$(CURDIR)/$(BOARD)"; fi

clean:
	@rm -f $(BIN) $(DBGBIN) $(TMPBIN) .out.actual .out.diff
