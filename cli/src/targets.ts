import { existsSync } from "node:fs";
import { join } from "node:path";
import { c, hint } from "./util";

export interface Target {
  /** 题目目录内的文件名 */
  name: string;
  /** 绝对路径 */
  path: string;
  /** 用系统默认程序打开（而不是 micro） */
  system: boolean;
}

/** 目标别名 -> 文件名（题目目录里只有 txt / cpp / excalidraw，没有 Markdown） */
const ALIASES: Record<string, string> = {
  code: "solution.cpp",
  cpp: "solution.cpp",
  in: "in.txt",
  input: "in.txt",
  out: "out.txt",
  output: "out.txt",
  problem: "problem.txt",
  desc: "problem.txt",
  title: "problem.txt",
  solution: "solution.txt",
  answer: "solution.txt",
  sol: "solution.txt",
  board: "whiteboard.excalidraw",
  wb: "whiteboard.excalidraw",
  whiteboard: "whiteboard.excalidraw",
  makefile: "Makefile",
};

const EXTS = [".cpp", ".txt", ".excalidraw"];

export const TARGET_HELP =
  "code/cpp（solution.cpp·空模板）· solution/answer（solution.txt·答案）· problem（problem.txt·题面）· in · out · board · makefile，也可以直接写文件名（自动补 .cpp/.txt/.excalidraw）";

/** 这个参数看起来是「目标」而不是「目录」吗 */
export function isTargetName(s: string): boolean {
  if (ALIASES[s.toLowerCase()] !== undefined) return true;
  return /\.(cpp|cc|cxx|txt|excalidraw)$/i.test(s);
}

export function resolveTarget(dir: string, name?: string): Target {
  const key = (name ?? "code").trim();

  const candidates: string[] = [];
  const alias = ALIASES[key.toLowerCase()];
  if (alias) candidates.push(alias);
  candidates.push(key);
  if (!key.includes(".")) for (const ext of EXTS) candidates.push(key + ext);

  for (const cand of candidates) {
    if (cand.includes("/")) continue;
    const path = join(dir, cand);
    if (existsSync(path)) return { name: cand, path, system: cand.endsWith(".excalidraw") };
  }

  console.error(`${c.red("error:")} ${dir} 里找不到「${key}」`);
  hint(`可用目标：${TARGET_HELP}`);
  process.exit(1);
}
