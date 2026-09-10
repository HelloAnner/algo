import pkg from "../package.json";
import { c, die, hint, isFile, run as exec, warn, which } from "./util";
import { createProblem } from "./scaffold";
import { printProblems } from "./list";
import { make, printPath, resolveProblemDir } from "./run";
import { installMicroProfile, installInitLua } from "./micro";
import { doctor } from "./doctor";

const HELP = `${c.bold("algo")} — 面试算法练习脚手架（C++ / ACM 模式 + micro 编辑器）

${c.bold("用法")}
  algo <名字>             在当前目录新建题目目录，例如 ${c.cyan("algo two-sum")}
  algo new <名字>         同上（名字和子命令撞车时用）

${c.bold("刷题")}
  algo list               列出当前目录下的题目
  algo edit [目录]        用 micro 打开 solution.cpp
  algo run [目录]         编译并运行（标准输入 = in.txt）
  algo raw [目录]         编译并运行（手动输入）
  algo check [目录]       跑一遍并和 out.txt 比对
  algo debug [目录]       带 ASan/UBSan 编译运行，抓越界
  algo clean [目录]       清掉编译产物
  algo path [目录]        打印题目目录绝对路径

${c.bold("环境")}
  algo setup              安装 / 合并 micro 的 C++ 刷题配置
  algo doctor             自检依赖与配置
  algo version            版本
  algo help               本帮助

${c.bold("选项")}
  -e, --edit              新建后立刻用 micro 打开
  -f, --force             目录已存在时覆盖同名文件
      --dry-run           （配合 setup）只预览改动，不写文件
  -h, --help              帮助
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
  const flags = argv.filter((a) => a.startsWith("-"));
  const pos = argv.filter((a) => !a.startsWith("-"));
  const has = (...f: string[]) => f.some((x) => flags.includes(x));

  const cmd = pos[0];

  if (!cmd) {
    console.log(HELP);
    return;
  }
  if (has("-h", "--help") || cmd === "help") {
    console.log(HELP);
    return;
  }
  if (cmd === "version" || flags.includes("--version")) {
    console.log(`algo ${pkg.version}`);
    return;
  }

  switch (cmd) {
    case "new": {
      const name = pos[1];
      if (!name) die("用法：algo new <名字>");
      const dir = createProblem(name, { force: has("-f", "--force") });
      if (has("-e", "--edit")) openMicro(dir);
      return;
    }
    case "list":
    case "ls":
      printProblems(process.cwd());
      return;
    case "run":
      make(resolveProblemDir(pos[1]), "run");
      return;
    case "raw":
      make(resolveProblemDir(pos[1]), "raw");
      return;
    case "check":
      make(resolveProblemDir(pos[1]), "check");
      return;
    case "debug":
      make(resolveProblemDir(pos[1]), "debug");
      return;
    case "clean":
      make(resolveProblemDir(pos[1]), "clean");
      return;
    case "edit":
    case "micro":
      openMicro(resolveProblemDir(pos[1]));
      return;
    case "path":
      printPath(resolveProblemDir(pos[1]));
      return;
    case "setup": {
      const dryRun = has("--dry-run");
      installMicroProfile({ dryRun });
      if (has("--init")) installInitLua({ dryRun });
      return;
    }
    case "doctor":
      doctor();
      return;
    default: {
      // 兜底：把第一个参数当作题目名
      const dir = createProblem(cmd, { force: has("-f", "--force") });
      if (has("-e", "--edit")) openMicro(dir);
      return;
    }
  }
}

main(process.argv.slice(2));
