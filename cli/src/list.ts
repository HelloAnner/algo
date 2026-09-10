import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isFilled } from "./scaffold";
import { c, isDir, isFile, pad, readText } from "./util";

export interface ProblemRow {
  slug: string;
  date: string;
  problem: boolean;
  solution: boolean;
  board: boolean;
  difficulty: string;
}

/** 白板上画过东西没有：元素表非空就算画过 */
function boardHasDrawing(path: string): boolean {
  const raw = readText(path);
  if (raw === null) return false;
  try {
    const scene = JSON.parse(raw) as { elements?: unknown[] };
    return Array.isArray(scene.elements) && scene.elements.length > 0;
  } catch {
    return false;
  }
}

/** 从 problem.txt 头部的 `难度：简单` 这类行里取值 */
function headerField(txt: string | null, label: string): string {
  if (txt === null) return "";
  for (const line of txt.split("\n").slice(0, 8)) {
    const t = line.trim();
    const idx = t.search(/[：:]/);
    if (idx < 0) continue;
    if (t.slice(0, idx).trim() === label) return t.slice(idx + 1).trim();
  }
  return "";
}

export function listProblems(cwd: string): ProblemRow[] {
  const rows: ProblemRow[] = [];
  for (const name of readdirSync(cwd).sort()) {
    if (name.startsWith(".")) continue;
    const dir = join(cwd, name);
    if (!isDir(dir)) continue;
    if (!isFile(join(dir, "solution.cpp"))) continue;

    let date = "";
    try {
      date = statSync(join(dir, "solution.cpp")).mtime.toISOString().slice(0, 10);
    } catch {
      /* ignore */
    }

    const problemTxt = readText(join(dir, "problem.txt"));
    rows.push({
      slug: name,
      date,
      problem: isFilled(problemTxt),
      solution: isFilled(readText(join(dir, "solution.txt"))),
      board: boardHasDrawing(join(dir, "whiteboard.excalidraw")),
      difficulty: headerField(problemTxt, "难度"),
    });
  }
  return rows;
}

export function printProblems(cwd: string): void {
  const rows = listProblems(cwd);
  if (rows.length === 0) {
    console.log("当前目录还没有题目。");
    console.log(c.gray("  algo two-sum        # 新建一道题"));
    console.log(c.gray("  algo add two-sum --problem-file 题面.txt --solution-file 解法.txt"));
    return;
  }

  console.log(c.bold(`${rows.length} 道题（${cwd}）`));
  for (const r of rows) {
    const marks = `题面${r.problem ? "✓" : "—"}解法${r.solution ? "✓" : "—"}板${r.board ? "✓" : "—"}`;
    console.log(`  ${pad(r.slug, 38)} ${c.gray(r.date)} ${c.cyan(marks)}${r.difficulty ? "  " + c.gray(r.difficulty) : ""}`);
  }
  console.log(c.gray("\n  ✓ 已写    — 还是空的（题面 = problem.txt，解法 = solution.txt，板 = 白板上画过图）"));
  console.log(c.gray("  solution.cpp 是空模板，自己写；参考代码在 solution.txt 里"));
}
