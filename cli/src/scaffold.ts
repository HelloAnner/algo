import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AddOptions } from "./add";
import problemTpl from "../assets/problem.md.tmpl" with { type: "text" };
import boardTpl from "../assets/whiteboard.excalidraw.tmpl" with { type: "text" };
import solutionMdTpl from "../assets/solution.md.tmpl" with { type: "text" };
import cppTpl from "../assets/solution.cpp" with { type: "text" };
import makeTpl from "../assets/make.tmpl" with { type: "text" };
import readmeTpl from "../assets/README.tmpl" with { type: "text" };
import inTpl from "../assets/in.txt" with { type: "text" };
import outTpl from "../assets/out.txt" with { type: "text" };
import gitignoreTpl from "../assets/gitignore" with { type: "text" };
import { c, die, hint, info, ok, out, render, slugify, titleize, today, warn, writeText } from "./util";

/** 模板里留的占位标记：还在 = 这一项还没写 */
export const TODO_MARK = "algo:todo";

export function isFilled(md: string | null | undefined): boolean {
  return typeof md === "string" && !md.includes(TODO_MARK);
}

const withNewline = (s: string) => (s.endsWith("\n") ? s : s + "\n");

export function renderVars(opts: AddOptions): Record<string, string> {
  const slug = slugify(opts.name);
  const tags = opts.tags.length > 0 ? opts.tags.join("、") : "";
  return {
    SLUG: slug,
    TITLE: opts.title?.trim() || titleize(slug),
    LINK: opts.link?.trim() || `https://leetcode.cn/problems/${slug}/`,
    DIFFICULTY: opts.difficulty?.trim() ?? "",
    TAGS: tags,
    DATE: today(),
  };
}

export function problemFiles(opts: AddOptions): { name: string; content: string }[] {
  const vars = renderVars(opts);
  return [
    {
      name: "problem.md",
      content: opts.problem !== undefined ? withNewline(opts.problem) : render(problemTpl, vars),
    },
    {
      name: "solution.md",
      content: opts.solution !== undefined ? withNewline(opts.solution) : render(solutionMdTpl, vars),
    },
    { name: "solution.cpp", content: render(cppTpl, vars) },
    { name: "in.txt", content: opts.input !== undefined ? withNewline(opts.input) : inTpl },
    { name: "out.txt", content: opts.expected !== undefined ? withNewline(opts.expected) : outTpl },
    { name: "Makefile", content: render(makeTpl, vars) },
    { name: "README.md", content: render(readmeTpl, vars) },
    { name: ".gitignore", content: gitignoreTpl },
    { name: "whiteboard.excalidraw", content: boardTpl },
  ];
}

export interface CreateResult {
  dir: string;
  /** 目录是这次新建（或 --force 重写）的吗 */
  created: boolean;
}

export function createProblem(opts: AddOptions): CreateResult {
  const slug = slugify(opts.name);
  if (!slug) die(`无效的题目名：${JSON.stringify(opts.name)}`);

  const dir = resolve(process.cwd(), slug);
  const existed = existsSync(dir);
  const files = problemFiles(opts);

  // 目录已存在：不带内容参数就报错；带了内容就只更新显式给出的文件（不碰代码 / README）
  if (existed && !opts.force) {
    const watch: [string, unknown][] = [
      ["problem.md", opts.problem],
      ["solution.md", opts.solution],
      ["in.txt", opts.input],
      ["out.txt", opts.expected],
    ];
    const updates = files.filter((f) => watch.some(([n, v]) => f.name === n && v !== undefined));
    if (updates.length === 0) {
      console.error(`${c.red("error:")} 目录已存在：./${slug}`);
      hint(`只想补内容：algo add ${slug} --problem-file 题面.md --solution-file 解法.md --in-file in.txt`);
      hint(`想全部重来：algo ${slug} --force`);
      process.exit(1);
    }
    mkdirSync(dir, { recursive: true });
    for (const f of updates) writeText(join(dir, f.name), f.content);
    ok(`已更新 ./${slug} 的 ${updates.map((u) => u.name).join("、")}`);
    if (opts.title || opts.link || opts.difficulty || opts.tags.length > 0) {
      hint("README.md 的元信息保持不变——要改请直接编辑它，免得覆盖你的复盘记录");
    }
    return { dir, created: false };
  }

  mkdirSync(dir, { recursive: true });
  for (const f of files) writeText(join(dir, f.name), f.content);

  // 默认完全静默：配合 shell 集成的自动 cd，建完直接落在新目录里，不刷屏。
  // 想要原来的清单与提示：algo new <名字> --verbose
  if (opts.verbose) {
    if (existed) warn(`目录已存在，已覆盖同名文件：./${slug}`);
    ok(`已创建题目 ./${slug}`);
    out();
    for (const f of files) out("  " + c.cyan(f.name));
    out();
    info("下一步：");
    hint(`cd ${slug} && micro .        # 先看 problem.md，再写 solution.cpp`);
    hint("algo in / algo out          # 改样例输入 / 期望输出");
    hint("make run                    # 用 in.txt 跑一遍");
    hint("make check                  # 和 out.txt 比对");
  }
  return { dir, created: true };
}
