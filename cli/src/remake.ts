import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { renderMakefile } from "./scaffold";
import { c, die, hint, isDir, isFile, ok, readText, warn, writeText } from "./util";

/** 从 problem.txt 头部读题名；读不到就用目录名 */
function titleOf(dir: string): string {
  const fallback = dir.split("/").pop() ?? "题目";
  const txt = readText(join(dir, "problem.txt"));
  if (txt === null) return fallback;
  for (const line of txt.split("\n").slice(0, 5)) {
    const t = line.trim();
    if (t.startsWith("题目：") || t.startsWith("题目:")) return t.slice(3).trim() || fallback;
  }
  return fallback;
}

const isProblemDir = (dir: string) => isFile(join(dir, "solution.cpp")) && isFile(join(dir, "Makefile"));

/**
 * 用当前模板重新生成题目目录里的 Makefile。
 * 模板（cli/assets/make.tmpl）升级后，老题目目录的 Makefile 不会自己变——跑一下这个。
 */
export function remakeMakefiles(arg?: string): void {
  const base = resolve(process.cwd(), arg ?? ".");
  if (!existsSync(base)) die(`目录不存在：${base}`);

  const dirs = isProblemDir(base)
    ? [base]
    : readdirSync(base)
        .map((n) => join(base, n))
        .filter((d) => isDir(d) && isProblemDir(d));

  if (dirs.length === 0) {
    warn(`${base} 下没找到题目目录（要有 solution.cpp + Makefile）`);
    hint("用法：algo remake [目录]  —— 目录本身是题目就刷它，否则刷它下面所有题目");
    process.exit(1);
  }

  for (const d of dirs) {
    const title = titleOf(d);
    writeText(join(d, "Makefile"), renderMakefile(title));
    ok(`已刷新 ${relative(process.cwd(), join(d, "Makefile"))}${c.gray(`（${title}）`)}`);
  }
  hint(`${dirs.length} 个 Makefile 已按当前模板重新生成；只动 Makefile，题面/解法/代码都不碰`);
}
