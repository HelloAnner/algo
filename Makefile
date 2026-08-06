SKILL_SRC := $(HOME)/algo/skills/algo-solution
SKILL_DST := $(HOME)/.agents/skills/algo-solution

.PHONY: install install-cli install-skill serve dev

install: install-cli install-skill

# 基于源码为当前系统编译独立二进制（不依赖 bun 运行时）
# 安装到 PATH 里已有的用户级 bin 目录，都没有就用 ~/.local/bin
install-cli:
	cd cli && bun build --compile --minify src/index.ts --outfile algo
	@BIN_DIR=""; \
	for d in $(HOME)/.bun/bin $(HOME)/.local/bin $(HOME)/bin; do \
		case ":$$PATH:" in *":$$d:"*) BIN_DIR=$$d; break;; esac; \
	done; \
	BIN_DIR=$${BIN_DIR:-$(HOME)/.local/bin}; \
	mkdir -p $$BIN_DIR; \
	mv -f cli/algo $$BIN_DIR/algo; \
	echo "✓ CLI 已编译安装: $$BIN_DIR/algo"; \
	case ":$$PATH:" in *":$$BIN_DIR:"*) ;; *) echo "⚠ $$BIN_DIR 不在 PATH，请加入 shell 配置";; esac

# 已有正确软链则跳过
install-skill:
	mkdir -p $(HOME)/.agents/skills
	@if [ "$$(readlink $(SKILL_DST))" = "$(SKILL_SRC)" ]; then \
		echo "✓ skill 软链已存在，跳过"; \
	else \
		ln -sfn $(SKILL_SRC) $(SKILL_DST); \
		echo "✓ skill 软链已挂载: $(SKILL_DST)"; \
	fi

serve:
	bun run cli/src/index.ts serve

# 改完 CLI 源码直接跑，不用重新编译: make dev ARGS="today"
dev:
	bun run cli/src/index.ts $(ARGS)
