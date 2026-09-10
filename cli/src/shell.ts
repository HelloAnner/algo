import { copyFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { c, hint, ok, out, readText, timestamp, warn, writeText } from "./util";

const BEGIN = "# >>> algo shell integration >>>";
const END = "# <<< algo shell integration <<<";

/**
 * 装进 ~/.zshrc / ~/.bash_profile 的函数。
 * 子进程没法改父 shell 的 cwd，所以只能用一层 shell 函数：
 * 让 CLI 用 --print-dir 把新建目录打到 stdout（人看的输出走 stderr），
 * 函数拿到路径后自己 cd。
 */
export const SHELL_SNIPPET = `${BEGIN}
# algo new / algo add 建完题目后自动 cd 进新目录。
# 由 \`algo setup --shell\` 写入；不要了就删掉这一段（或重跑安装覆盖）。
algo() {
  local dir rc
  case "$1" in
    ""|help|-h|--help|version|-v|--version|list|ls|run|raw|check|debug|build|clean|edit|micro|in|out|board|path|setup|doctor)
      command algo "$@"
      return $?
      ;;
  esac
  # -e / --edit 会启动 micro（全屏 TUI），不能塞进命令替换里
  case " $* " in
    *" -e "*|*" --edit "*)
      command algo "$@"
      return $?
      ;;
  esac
  dir="$(command algo --print-dir "$@")"
  rc=$?
  if [ "$rc" -eq 0 ] && [ -n "$dir" ] && [ -d "$dir" ]; then
    cd "$dir" || return $rc
  fi
  return $rc
}

# 让 algo doctor 知道当前这个终端有没有加载到这段
export ALGO_SHELL_INTEGRATION=1
${END}`;

export interface RcFile {
  path: string;
  shell: string;
}

/** 根据 $SHELL 猜要写哪个 rc 文件；fish 之类返回 null */
export function rcFile(): RcFile | null {
  const shell = (process.env.SHELL ?? "").split("/").pop() ?? "";
  const home = homedir();
  if (shell === "zsh") return { path: join(home, ".zshrc"), shell: "zsh" };
  if (shell === "bash") {
    const bashrc = join(home, ".bashrc");
    const profile = join(home, ".bash_profile");
    return { path: existsSync(bashrc) || !existsSync(profile) ? bashrc : profile, shell: "bash" };
  }
  return null;
}

export function shellIntegrationInstalled(): boolean {
  const rc = rcFile();
  if (!rc) return false;
  return (readText(rc.path) ?? "").includes(BEGIN);
}

export function installShellIntegration(opts: { dryRun?: boolean } = {}): void {
  const rc = rcFile();
  if (!rc) {
    warn(`认不出你的 shell（$SHELL=${process.env.SHELL ?? "空"}），没有自动写入`);
    hint("把下面这段加到你的 shell 配置里，就能在 algo 建完题目后自动 cd：");
    out();
    out(SHELL_SNIPPET);
    return;
  }

  const existing = readText(rc.path) ?? "";
  const hasBlock = existing.includes(BEGIN) && existing.includes(END);
  let next: string;

  if (hasBlock) {
    const re = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);
    next = existing.replace(re, SHELL_SNIPPET);
    if (next === existing) {
      ok(`shell 集成已是最新（${rc.path}）`);
      return;
    }
  } else {
    next = existing.replace(/\n*$/, "\n") + (existing.trim() ? "\n" : "") + SHELL_SNIPPET + "\n";
  }

  if (opts.dryRun) {
    out(`将写入 ${rc.path}`);
    out(SHELL_SNIPPET);
    return;
  }

  if (existsSync(rc.path)) {
    const backup = `${rc.path}.bak-${timestamp()}`;
    copyFileSync(rc.path, backup);
    hint(`原文件已备份到 ${backup}`);
  }
  writeText(rc.path, next);
  ok(`已写入 shell 集成：${rc.path}`);
  hint(`algo new <名字> 之后会自动 cd 进新目录`);
  hint(`生效：新开一个终端，或执行 source ${rc.path}`);
  hint(`不要了：删掉 ${rc.path} 里 ${BEGIN} ... ${END} 之间那一段`);
}
