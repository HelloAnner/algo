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
import { c, die, hint, info, ok, render, slugify, titleize, today, warn, writeText } from "./util";

/** 模板里留的占位标记：还在 = 这一项还没写 */
export const TODO_MARK = "algo:todo";

export function isFilled(md: string | null | undefined): boolean {
  return typeof md === "string" && !md.includes(TODO_MARK);
}

const withNewline = (s: string) => (s.endsWith("\n") ? s : s + "\n");

/** 白板模板自带的元素数（标题 + 链接），超过这个数说明已经画过东西 */
export const BOARD_BASE_ELEMENTS = 2;

/** 粗略估算文本宽度：CJK 按一个字宽，ASCII 按 0.55 字宽 */
function estimateWidth(text: string, fontSize: number): number {
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code > 0x2e80) w += fontSize;
    else if (ch === " ") w += fontSize * 0.3;
    else w += fontSize * 0.55;
  }
  return Math.max(40, Math.round(w));
}

/** 往 JSON 模板里填值：字符串做 JSON 转义（不额外加引号），数字直接写 */
function renderJson(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
    const v = vars[k];
    if (v === undefined) return "";
    return typeof v === "number" ? String(v) : JSON.stringify(v).slice(1, -1);
  });
}

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
  const title = vars.TITLE ?? "";
  const link = vars.LINK ?? "";

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
    { name: "in.txt", content: inTpl },
    { name: "out.txt", content: outTpl },
    { name: "Makefile", content: render(makeTpl, vars) },
    { name: "README.md", content: render(readmeTpl, vars) },
    { name: ".gitignore", content: gitignoreTpl },
    {
      name: "whiteboard.excalidraw",
      content: renderJson(boardTpl, {
        TITLE: title,
        LINK: link,
        TITLE_W: estimateWidth(title, 28),
        TITLE_H: 35,
        LINK_W: estimateWidth(link, 16),
        LINK_H: 20,
      }),
    },
  ];
}

export function createProblem(opts: AddOptions): string {
  const slug = slugify(opts.name);
  if (!slug) die(`无效的题目名：${JSON.stringify(opts.name)}`);

  const dir = resolve(process.cwd(), slug);
  const existed = existsSync(dir);
  const files = problemFiles(opts);

  // 目录已存在：不带内容参数就报错；带了内容就只更新对应的 md（不碰代码 /样例）
  if (existed && !opts.force) {
    const updates = files.filter(
      (f) =>
        (f.name === "problem.md" && opts.problem !== undefined) ||
        (f.name === "solution.md" && opts.solution !== undefined),
    );
    if (updates.length === 0) {
      console.error(`${c.red("error:")} 目录已存在：./${slug}`);
      hint(`只想补题面 /解法：algo add ${slug} --problem-file 题面.md --solution-file 解法.md`);
      hint(`想全部重来：algo ${slug} --force`);
      process.exit(1);
    }
    mkdirSync(dir, { recursive: true });
    for (const f of updates) writeText(join(dir, f.name), f.content);
    ok(`已更新 ./${slug} 的 ${updates.map((u) => u.name).join("、")}`);
    if (opts.title || opts.link || opts.difficulty || opts.tags.length > 0) {
      hint("README.md 的元信息保持不变——要改请直接编辑它，免得覆盖你的复盘记录");
    }
    return dir;
  }

  mkdirSync(dir, { recursive: true });
  for (const f of files) writeText(join(dir, f.name), f.content);

  if (existed) warn(`目录已存在，已覆盖同名文件：./${slug}`);
  ok(`已创建题目 ./${slug}`);
  console.log();
  for (const f of files) console.log("  " + c.cyan(f.name));
  console.log();
  info("下一步：");
  hint(`cd ${slug} && micro .        # 先看 problem.md，再写 solution.cpp`);
  hint("make run                    # 用 in.txt 跑一遍");
  hint("make check                  # 和 out.txt 比对");
  return dir;
}
