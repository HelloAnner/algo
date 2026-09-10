import pkg from "../package.json";
import { resolveAddOptions } from "./add";
import { runCheck } from "./check";
import { doctor } from "./doctor";
import { flagOn, flagStr, parseArgs } from "./flags";
import { printProblems } from "./list";
import { installInitLua, installMicroProfile } from "./micro";
import { openTarget } from "./open";
import { remakeMakefiles } from "./remake";
import { make, printPath, resolveProblemDir, runSolution } from "./run";
import { createProblem } from "./scaffold";
import { installShellIntegration } from "./shell";
import { isTargetName, resolveTarget, TARGET_HELP } from "./targets";
import { c, die, emit, hint, isFile, routeHumanToStderr, run as exec, warn, which } from "./util";

const HELP = `${c.bold("algo")} — 面试算法练习脚手架（C++ / ACM 模式 + micro 编辑器）

${c.bold("新建题目")}
  algo <名字>                     新建题目目录（problem.txt / solution.txt / solution.cpp 空模板 /
                                  in.txt / out.txt / Makefile / 白板；没有 Markdown）
                                  默认静默：不打印任何内容，配合 shell 集成直接 cd 进去
  algo add <名字>                 同上，并且可以直接带上内容与元信息
      --title --link --difficulty
      --problem <文本> / --problem-file <文件|->        -> problem.txt（题面）
      --solution <文本> / --solution-file <文件|->      -> solution.txt（解法 + 参考代码）
      --in <文本> / --in-file <文件|->                  -> in.txt（样例输入）
      --out <文本> / --out-file <文件|->                -> out.txt（期望输出）
      --json <文件|->              一次性读入全部字段（推荐给 AI 用）

${c.bold("看 / 改文件")}
  algo edit [目录] [目标]         用 micro 打开，默认 solution.cpp（空模板，自己写）
  algo in [目录]                  打开 in.txt
  algo out [目录]                 打开 out.txt
  algo board [目录]               用系统默认程序打开白板 whiteboard.excalidraw
  algo path [目录] [目标]         只打印路径，不打开
      目标：${TARGET_HELP}
  algo remake [目录]              按当前模板重新生成题目里的 Makefile（模板升级后用；
                                  目录是题目就刷它，否则刷它下面所有题目）

${c.bold("刷题")}
  algo list                       列出当前目录下的题目（题面/思路/板 进度）
  algo run [目录]                 编译 + 跑 in.txt，和 out.txt 一致就打印一行 AC（跑样例）
  algo raw [目录]                 编译运行（手动输入）
  algo check [目录]               编译 + 静态检查 + 写法检查；没问题不输出任何内容（不跑样例）
      --timeout <秒>              跑样例的超时（默认 5 秒，防死循环；algo run 用）
  algo debug [目录]               带 ASan/UBSan 编译运行，抓越界
  algo build [目录]               只编译（唯一会留下二进制的目标）
  algo clean [目录]               清掉编译产物

${c.bold("环境")}
  algo setup                      合并 micro 刷题配置：settings.json + bindings.json
  algo setup --shell              把「建完题自动 cd」写进 shell 配置（~/.zshrc 等）
  algo setup --init               额外生成 ~/.config/micro/init.lua
                                  （Alt-r 跑样例 / Alt-t 对拍 / Alt-i·Alt-o 开样例；存在则不覆盖）
  algo doctor                     自检依赖与配置
  algo version                    版本
  algo help                       本帮助

${c.bold("选项")}
  -e, --edit                      新建后立刻用 micro 打开
  -f, --force                     目录已存在时覆盖全部文件
      --verbose                   新建后打印文件清单与下一步（默认完全静默）
      --print-dir                 只把新建目录的路径打到 stdout（给 shell 集成用）
  -h, --help                      帮助
`;

/** --timeout <秒>，默认 5 */
function timeoutOf(flags: Parameters<typeof flagStr>[0]): number {
  const t = Number(flagStr(flags, "timeout") ?? "5");
  return Number.isFinite(t) && t > 0 ? t : 5;
}

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

  // 给 shell 集成：stdout 只留路径，人看的输出改到 stderr
  const printDir = has("print-dir");
  if (printDir) routeHumanToStderr(true);

  if (!cmd || has("help") || cmd === "help") {
    console.log(HELP);
    return;
  }
  if (cmd === "version" || has("version")) {
    console.log(`algo ${pkg.version}`);
    return;
  }

  const create = (args: string[]): void => {
    const opts = resolveAddOptions(args, flags);
    const res = createProblem(opts);
    if (printDir) {
      // 只有真的新建了目录才输出路径，shell 函数据此决定要不要 cd
      if (res.created) emit(res.dir);
      return;
    }
    if (opts.edit) openTarget(res.dir, resolveTarget(res.dir, "code"));
  };

  switch (cmd) {
    case "add":
    case "new":
      create(positionals.slice(1));
      return;

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
    case "remake": {
      remakeMakefiles(positionals[1]);
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
    case "run": {
      const dir = resolveProblemDir(positionals[1]);
      runSolution(dir, { timeoutSec: timeoutOf(flags) });
      return;
    }
    case "raw":
      make(resolveProblemDir(positionals[1]), "raw");
      return;
    case "check": {
      const dir = resolveProblemDir(positionals[1]);
      runCheck(dir);
      return;
    }
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
      if (has("shell")) {
        installShellIntegration({ dryRun });
        return;
      }
      installMicroProfile({ dryRun });
      if (has("init")) installInitLua({ dryRun });
      return;
    }
    case "doctor":
      doctor();
      return;

    default:
      // 兜底：第一个位置参数当作题目名，等价于 algo add <名字>
      create([cmd, ...positionals.slice(1)]);
      return;
  }
}

main(process.argv.slice(2));
