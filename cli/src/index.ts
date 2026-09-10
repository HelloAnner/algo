import pkg from "../package.json";
import { resolveAddOptions } from "./add";
import { doctor } from "./doctor";
import { flagOn, parseArgs } from "./flags";
import { printProblems } from "./list";
import { installInitLua, installMicroProfile } from "./micro";
import { openTarget } from "./open";
import { make, printPath, resolveProblemDir } from "./run";
import { createProblem } from "./scaffold";
import { isTargetName, resolveTarget, TARGET_HELP } from "./targets";
import { c, die, hint, isFile, run as exec, warn, which } from "./util";

const HELP = `${c.bold("algo")} — 面试算法练习脚手架（C++ / ACM 模式 + micro 编辑器）

${c.bold("新建题目")}
  algo <名字>                     新建题目目录（题面 / 解法 / 白板 / 代码 / 样例 / Makefile）
  algo add <名字>                 同上，并且可以直接带上内容与元信息
      --title --link --difficulty --tags <a,b>
      --problem <文本> / --problem-file <文件|->        -> problem.md
      --solution <文本> / --solution-file <文件|->      -> solution.md
      --in <文本> / --in-file <文件|->                  -> in.txt（样例输入）
      --out <文本> / --out-file <文件|->                -> out.txt（期望输出）
      --json <文件|->              一次性读入全部字段（推荐给 AI 用）

${c.bold("看 / 改文件")}
  algo edit [目录] [目标]         用 micro 打开，默认 solution.cpp
  algo in [目录]                  打开 in.txt
  algo out [目录]                 打开 out.txt
  algo board [目录]               用系统默认程序打开白板 whiteboard.excalidraw
  algo path [目录] [目标]         只打印路径，不打开
      目标：${TARGET_HELP}

${c.bold("刷题")}
  algo list                       列出当前目录下的题目（题面/思路/板 进度）
  algo run [目录]                 编译运行（标准输入 = in.txt，跑完删二进制）
  algo raw [目录]                 编译运行（手动输入）
  algo check [目录]               跑一遍并和 out.txt 比对
  algo debug [目录]               带 ASan/UBSan 编译运行，抓越界
  algo build [目录]               只编译（唯一会留下二进制的目标）
  algo clean [目录]               清掉编译产物

${c.bold("环境")}
  algo setup [--dry-run] [--init] 安装 / 合并 micro 的 C++ 刷题配置
  algo doctor                     自检依赖与配置
  algo version                    版本
  algo help                       本帮助

${c.bold("选项")}
  -e, --edit                      新建后立刻用 micro 打开
  -f, --force                     目录已存在时覆盖全部文件
  -h, --help                      帮助
`;

/** edit / path 的位置参数：可能是 [目录]、[目标] 或 [目录, 目标] */
function dirAndTarget(args: string[]): { dir: string; target: string | undefined } {
  const [a, b] = args;
  if (a && b) return { dir: resolveProblemDir(a), target: b };
  if (a) {
    if (isTargetName(a)) return { dir: resolveProblemDir(undefined), target: a };
    return { dir: resolveProblemDir(a), target: undefined };
  }
  return { dir: resolveProblemDir(undefined), target: undefined };
}

export function main(argv: string[]): void {
  const { positionals, flags } = parseArgs(argv);
  const has = (...k: string[]) => flagOn(flags, ...k);
  const cmd = positionals[0];

  if (!cmd || has("help") || cmd === "help") {
    console.log(HELP);
    return;
  }
  if (cmd === "version" || has("version")) {
    console.log(`algo ${pkg.version}`);
    return;
  }

  switch (cmd) {
    case "add":
    case "new": {
      const opts = resolveAddOptions(positionals.slice(1), flags);
      const dir = createProblem(opts);
      if (opts.edit) openTarget(dir, resolveTarget(dir, "code"));
      return;
    }

    case "edit":
    case "micro": {
      const { dir, target } = dirAndTarget(positionals.slice(1));
      openTarget(dir, resolveTarget(dir, target));
      return;
    }
    case "in":
    case "out":
    case "board": {
      const dir = resolveProblemDir(positionals[1]);
      openTarget(dir, resolveTarget(dir, cmd));
      return;
    }
    case "path": {
      const { dir, target } = dirAndTarget(positionals.slice(1));
      if (target === undefined) {
        printPath(dir);
        return;
      }
      console.log(resolveTarget(dir, target).path);
      return;
    }

    case "list":
    case "ls":
      printProblems(process.cwd());
      return;
    case "run":
      make(resolveProblemDir(positionals[1]), "run");
      return;
    case "raw":
      make(resolveProblemDir(positionals[1]), "raw");
      return;
    case "check":
      make(resolveProblemDir(positionals[1]), "check");
      return;
    case "debug":
      make(resolveProblemDir(positionals[1]), "debug");
      return;
    case "build":
      make(resolveProblemDir(positionals[1]), "build");
      return;
    case "clean":
      make(resolveProblemDir(positionals[1]), "clean");
      return;

    case "setup": {
      const dryRun = has("dry-run");
      installMicroProfile({ dryRun });
      if (has("init")) installInitLua({ dryRun });
      return;
    }
    case "doctor":
      doctor();
      return;

    default: {
      // 兜底：第一个位置参数当作题目名，等价于 algo add <名字>
      const opts = resolveAddOptions([cmd, ...positionals.slice(1)], flags);
      const dir = createProblem(opts);
      if (opts.edit) openTarget(dir, resolveTarget(dir, "code"));
      return;
    }
  }
}

main(process.argv.slice(2));
