# 根目录便捷入口：真实实现在 cli/Makefile
#   make install / install-bin / uninstall / setup / doctor / test

CLI := cli
TARGETS := help install install-cli install-shim install-bin uninstall setup init doctor typecheck test bundle clean deps

.PHONY: $(TARGETS)
.DEFAULT_GOAL := help

$(TARGETS):
	@$(MAKE) -C $(CLI) $@
