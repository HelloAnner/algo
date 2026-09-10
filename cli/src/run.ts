import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { cleanupBin, compareLines, compile, hasExpectedOutput, readCase, runBinary } from "./cpp";
import { c, die, hint, out, run as exec, which } from "./util";

export function resolveProblemDir(arg: string | undefined): string {
  const dir = arg ? resolve(process.cwd(), arg) : process.cwd();
  if (!existsSync(dir)) die(`目录不存在：${dir}`);
  if (!existsSync(join(dir, "solution.cpp")) && !existsSync(join(dir, "Makefile"))) {
    die(`${dir} 看起来不是题目目录（缺少 solution.cpp / Makefile）`);
  }
  return dir;
}

export function make(dir: string, target: string): never {
  if (!which("make")) die("找不到 make 命令");
  console.log(c.gray(`make ${target}  （${dir}）`));
  const code = exec("make", [target], dir);
  process.exit(code);
}

/**
 * 编译 + 用 in.txt 跑一遍 + 和 out.txt 比对。
 * 一切正常只打印一行 AC；出问题才把细节打出来。
 */
export function runSolution(dir: string, opts: { timeoutSec?: number } = {}): never {
  const timeoutMs = Math.max(1, opts.timeoutSec ?? 5) * 1000;

  try {
    const build = compile(dir);
    if (!build.ok) {
      if (build.output) console.error(build.output);
      process.exit(1);
    }

    const r = runBinary(dir, readCase(dir, "in.txt") ?? "", timeoutMs);
    if (r.timedOut) {
      console.error(`${c.red("✗")} 运行超过 ${timeoutMs / 1000}s 还没结束（死循环？）`);
      process.exit(1);
    }

    // 还没填期望输出：把程序的真实输出打出来，方便填进 out.txt
    if (!hasExpectedOutput(dir)) {
      if (r.stdout) process.stdout.write(r.stdout);
      if (r.stderr.trim()) process.stderr.write(r.stderr);
      hint("out.txt 还是空的：核对上面的输出，填进 out.txt 就会自动对拍");
      process.exit(0);
    }

    const cmp = compareLines(readCase(dir, "out.txt") ?? "", r.stdout);
    if (cmp.ok) {
      out(c.green("AC"));
      process.exit(0);
    }
    out(c.red("WA"));
    for (const d of cmp.diffs) out("  " + d);
    process.exit(1);
  } finally {
    cleanupBin(dir);
  }
}

export function printPath(dir: string): void {
  console.log(dir);
  hint("cd 进去之后用 micro . 打开");
}
