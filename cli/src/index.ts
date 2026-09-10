import pkg from "../package.json";
import { resolveAddOptions, JSON_SPEC_HELP } from "./add";
import { doctor } from "./doctor";
import { flagOn, parseArgs } from "./flags";
import { printProblems } from "./list";
import { installInitLua, installMicroProfile } from "./micro";
import { make, printPath, resolveProblemDir } from "./run";
import { createProblem } from "./scaffold";
import { c, die, hint, isFile, run as exec, warn, which } from "./util";

const HELP = `${c.bold("algo")} — 面试算法练习脚手架（C++ / ACM 模式 + micro 编辑器）

${c.bold("新建题目")}
  algo <名字>                     新建题目目录（含 problem.md / solution.md 模板）
  algo add <名字>                 同上，并且可以直接带上题面、解法与元信息
      --title <标题>              题目标题（默认由名字推导）
      --link <url>                题面链接（默认 leetcode.cn 对应地址）
      --difficulty <难度>          简单 / 中等 / 困难
      --tags <a,b>                标签，逗号分隔
      --problem <文本>             直接给题面 markdown
      --problem-file <文件|->      从文件或 stdin 读题面
      --solution <文本>            直接给解法 markdown
      --solution-file <文件|->     从文件或 stdin 读解法
      --json <文件|->              一次性读入全部字段（推荐给 AI 用）

${c.bold("刷题")}
  algo list                       列出当前目录下的题目
  algo edit [目录]                用 micro 打开 solution.cpp
  algo run [目录]                 编译运行（标准输入 = in.txt，跑完删二进制）
  algo raw [目录]                 编译运行（手动输入）
  algo check [目录]               跑一遍并和 out.txt 比对
  algo debug [目录]               带 ASan/UBSan 编译运行，抓越界
  algo build [目录]               只编译（唯一会留下二进制的目标）
  algo clean [目录]               清掉编译产物
  algo path [目录]                打印题目目录绝对路径

${c.bold("环境")}
  algo setup [--dry-run] [--init] 安装 / 合并 micro 的 C++ 刷题配置
  algo doctor                     自检依赖与配置
  algo version                    版本
  algo help                       本帮助

${c.bold("选项")}
  -e, --edit                      新建后立刻用 micro 打开
  -f, --force                     目录已存在时覆盖全部文件
  -h, --help                      帮助

${c.bold("给 AI 的批量用法")}
  echo '<json>' | algo add --json -
  JSON 字段：name / title / link / difficulty / tags / problem / solution
`;

function openMicro(dir: string): never {
  const micro = which("micro");
  if (!micro) {
    warn("没找到 micro 编辑器，跳过打开");
    hint("安装：brew install micro");
    process.exit(0);
  }
  const target = isFile(`${dir}/solution.cpp`) ? "solution.cpp" : ".";
  process.exit(exec("micro", [target], dir));
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
      if (opts.edit) openMicro(dir);
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
    case "edit":
    case "micro":
      openMicro(resolveProblemDir(positionals[1]));
      return;
    case "path":
      printPath(resolveProblemDir(positionals[1]));
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
      if (opts.edit) openMicro(dir);
      return;
    }
  }
}

main(process.argv.slice(2));
