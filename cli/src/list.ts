import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { c, isDir, isFile, pad } from "./util";
import { readText } from "./util";

/** 列出当前目录下所有包含 solution.cpp 的题目目录 */
export function listProblems(cwd: string): { slug: string; solved: boolean; mtime: Date }[] {
  const out: { slug: string; solved: boolean; mtime: Date }[] = [];
  for (const name of readdirSync(cwd).sort()) {
    if (name.startsWith(".")) continue;
    const dir = join(cwd, name);
    if (!isDir(dir)) continue;
    const sol = join(dir, "solution.cpp");
    if (!isFile(sol)) continue;

    let mtime = new Date(0);
    try {
      mtime = statSync(sol).mtime;
    } catch {
      /* ignore */
    }
    const readme = readText(join(dir, "README.md")) ?? "";
    // 粗判：README 的“思路”小节里有没有内容
    const m = readme.split(/##\s*思路/)[1]?.split(/##/)[0] ?? "";
    const solved = m.replace(/[\s\-]/g, "").length > 0;
    out.push({ slug: name, solved, mtime });
  }
  return out;
}

export function printProblems(cwd: string): void {
  const rows = listProblems(cwd);
  if (rows.length === 0) {
    console.log("当前目录还没有题目。");
    console.log(c.gray("  algo two-sum        # 新建一道题"));
    return;
  }
  console.log(c.bold(`${rows.length} 道题（${cwd}）`));
  for (const r of rows) {
    const mark = r.solved ? c.green("●") : c.gray("○");
    const date = r.mtime.toISOString().slice(0, 10);
    console.log(`  ${mark} ${pad(r.slug, 42)} ${c.gray(date)}`);
  }
  console.log(c.gray("\n  ● 有笔记（README 思路非空）   ○ 待整理"));
}
