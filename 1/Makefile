# 1 — 本地编译 / 运行 / 对拍
#
# 设计原则：跑完就把二进制删掉，目录里不留编译产物。
# 每个目标都用 trap 兜底：正常结束、编译报错、程序崩溃、Ctrl-C 都会清理。
# 想保留二进制时用 `make build`（用完记得 `make clean`）。

ifeq ($(origin CXX), default)
CXX := clang++
endif
CXXFLAGS ?= -std=c++20 -O2 -Wall -Wextra -Wno-sign-compare -Wno-unused-variable
DBGFLAGS ?= -std=c++20 -g -O0 -fsanitize=address,undefined -fno-omit-frame-pointer

SRC    := solution.cpp
BIN    := solution
DBGBIN := solution_dbg

.PHONY: all run raw check debug build clean

all: build

# 用 in.txt 作为标准输入跑一遍（跑完删除二进制）
run:
	@trap 'rm -f $(BIN)' EXIT; trap 'rm -f $(BIN); exit 130' INT TERM; \
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN) && ./$(BIN) < in.txt

# 直接跑，标准输入接终端（手动输入测试）
raw:
	@trap 'rm -f $(BIN)' EXIT; trap 'rm -f $(BIN); exit 130' INT TERM; \
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN) && ./$(BIN)

# 与 out.txt 比对
check:
	@trap 'rm -f $(BIN) .out.actual .out.diff' EXIT; trap 'rm -f $(BIN) .out.actual .out.diff; exit 130' INT TERM; \
	$(CXX) $(CXXFLAGS) $(SRC) -o $(BIN) && \
	{ ./$(BIN) < in.txt > .out.actual 2>&1 || true; } && \
	if diff -u out.txt .out.actual > .out.diff; then echo "✅ AC"; else echo "❌ WA"; cat .out.diff; fi

# AddressSanitizer + UBSan，专门抓越界 / 未定义行为
debug:
	@trap 'rm -f $(DBGBIN)' EXIT; trap 'rm -f $(DBGBIN); exit 130' INT TERM; \
	$(CXX) $(DBGFLAGS) $(SRC) -o $(DBGBIN) && ./$(DBGBIN) < in.txt

# 唯一会留下二进制的目标：需要反复手动跑 ./solution 时用
build: $(BIN)

$(BIN): $(SRC)
	@$(CXX) $(CXXFLAGS) $< -o $@

clean:
	@rm -f $(BIN) $(DBGBIN) .out.actual .out.diff
