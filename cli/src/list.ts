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
  tags: string;
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

/** 从 README.md 的 `- **难度**：…` 这类行里取值 */
function metaField(md: string, label: string): string {
  for (const line of md.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("-")) continue;
    const norm = t.replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
    const idx = norm.search(/[：:]/);
    if (idx < 0) continue;
    if (norm.slice(0, idx).trim() === label) return norm.slice(idx + 1).trim();
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

    const readme = readText(join(dir, "README.md")) ?? "";
    rows.push({
      slug: name,
      date,
      problem: isFilled(readText(join(dir, "problem.md"))),
      solution: isFilled(readText(join(dir, "solution.md"))),
      board: boardHasDrawing(join(dir, "whiteboard.excalidraw")),
      difficulty: metaField(readme, "难度"),
      tags: metaField(readme, "标签"),
    });
  }
  return rows;
}

export function printProblems(cwd: string): void {
  const rows = listProblems(cwd);
  if (rows.length === 0) {
    console.log("当前目录还没有题目。");
    console.log(c.gray("  algo two-sum        # 新建一道题"));
    console.log(c.gray("  algo add two-sum --problem-file p.md --solution-file s.md"));
    return;
  }

  console.log(c.bold(`${rows.length} 道题（${cwd}）`));
  for (const r of rows) {
    const marks = `题面${r.problem ? "✓" : "—"}思路${r.solution ? "✓" : "—"}板${r.board ? "✓" : "—"}`;
    const extra = [r.difficulty, r.tags].filter(Boolean).join(" · ");
    console.log(`  ${pad(r.slug, 38)} ${c.gray(r.date)} ${c.cyan(marks)}${extra ? "  " + c.gray(extra) : ""}`);
  }
  console.log(c.gray("\n  ✓ 已写    — 还是空的（题面 = problem.md，思路 = solution.md，板 = 白板上画过图）"));
}
