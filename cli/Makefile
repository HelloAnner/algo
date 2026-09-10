# algo CLI — bun + TypeScript
#
#   make install      打包 + 装到 ~/.local/bin/algo + 合并 micro 配置 + 装 shell 集成（推荐）
#   make install-cli  只装 CLI，不动 micro 配置
#   make shell        只装 shell 集成（algo new 之后自动 cd）
#   make install-bin  安装独立二进制（约 61MB，无 bun 也能跑）
#   make uninstall    移除 ~/.local/bin/algo
#   make test         冒烟测试（建题 → 编译 → 对拍）
#   make doctor       环境自检
#   make typecheck    tsc --noEmit

SHELL  := /bin/sh
ROOT   := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
BUN    ?= $(shell command -v bun 2>/dev/null || echo bun)
PREFIX ?= $(HOME)/.local
BINDIR ?= $(PREFIX)/bin
INCDIR ?= $(PREFIX)/include

DIST   := $(ROOT)/dist
BUNDLE := $(DIST)/algo.js
BINARY := $(DIST)/algo
SHIM   := $(BINDIR)/algo

.PHONY: all help deps bundle install install-cli install-shim install-bin uninstall setup shell init doctor typecheck test clean

all: bundle

help:
	@sed -n '2,9p' $(ROOT)/Makefile

deps:
	$(BUN) install --no-save

bundle:
	@mkdir -p $(DIST)
	$(BUN) build --target=bun --minify --outfile=$(BUNDLE) $(ROOT)/src/index.ts
	@echo "✓ 已打包 $(BUNDLE)"

# 轻量启动器：~/.local/bin/algo 只是 exec bun dist/algo.js，改完源码立刻生效
install-shim: bundle
	@mkdir -p $(BINDIR)
	@printf '#!/bin/sh\n# 由 ~/algo/cli 的 make install 生成\nexec "%s" "%s" "$$@"\n' '$(BUN)' '$(BUNDLE)' > '$(SHIM)'
	@chmod +x '$(SHIM)'
	@echo "✓ 已安装 $(SHIM)"
	@echo "  → $(BUN) $(BUNDLE)"

install: install-cli setup shell

install-cli: install-shim install-header

# 万能头兼容头：<bits/stdc++.h>（本机 clang 没有 GCC 那个专有头）
install-header:
	@mkdir -p '$(INCDIR)/bits'
	@install -m 644 '$(ROOT)/assets/include/bits/stdc++.h' '$(INCDIR)/bits/stdc++.h'
	@echo "✓ 已安装万能头 $(INCDIR)/bits/stdc++.h"

# 独立二进制：把 bun 运行时一起打进去，可拷到别的机器
install-bin:
	@mkdir -p $(DIST) $(BINDIR)
	$(BUN) build --compile --minify --outfile=$(BINARY) $(ROOT)/src/index.ts
	@install -m 755 $(BINARY) '$(SHIM)'
	@echo "✓ 已安装独立二进制 $(SHIM)"

uninstall:
	@rm -f '$(SHIM)'
	@rm -f '$(INCDIR)/bits/stdc++.h'
	@echo "✓ 已移除 $(SHIM) 和 $(INCDIR)/bits/stdc++.h"

setup: bundle
	@$(BUN) $(BUNDLE) setup

# 把「建完题自动 cd」的 shell 函数写进 ~/.zshrc / ~/.bash_profile
shell: bundle
	@$(BUN) $(BUNDLE) setup --shell

init: bundle
	@$(BUN) $(BUNDLE) setup --init

doctor: bundle
	@$(BUN) $(BUNDLE) doctor

typecheck:
	@$(BUN) run typecheck

test: bundle
	@sh $(ROOT)/scripts/smoke-test.sh

clean:
	@rm -rf $(DIST)
	@echo "✓ 已清理 $(DIST)"
