import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import type { AddOptions } from "./add";
import problemTpl from "../assets/problem.txt.tmpl" with { type: "text" };
import boardTpl from "../assets/whiteboard.excalidraw.tmpl" with { type: "text" };
import solutionTpl from "../assets/solution.txt.tmpl" with { type: "text" };
import cppTpl from "../assets/solution.cpp" with { type: "text" };
import makeTpl from "../assets/make.tmpl" with { type: "text" };
import inTpl from "../assets/in.txt" with { type: "text" };
import outTpl from "../assets/out.txt" with { type: "text" };
import gitignoreTpl from "../assets/gitignore" with { type: "text" };
import { c, die, hint, info, ok, out, readText, render, slugify, titleize, warn, writeText } from "./util";

/** 模板里留的占位标记：还在 = 这一项还没写 */
export const TODO_MARK = "algo:todo";

export function isFilled(txt: string | null | undefined): boolean {
  return typeof txt === "string" && !txt.includes(TODO_MARK);
}

const withNewline = (s: string) => (s.endsWith("\n") ? s : s + "\n");

interface Header {
  title: string;
  link: string;
  difficulty: string;
}

/** 从已有的 problem.txt 头部读回 题目 / 链接 / 难度（更新题面时用它兜底，免得把标题冲掉） */
export function readHeader(txt: string | null): Partial<Header> {
  if (txt === null) return {};
  const out: Partial<Header> = {};
  const map: [keyof Header, string][] = [
    ["title", "题目"],
    ["link", "链接"],
    ["difficulty", "难度"],
  ];
  for (const line of txt.split("\n").slice(0, 8)) {
    const t = line.trim();
    const idx = t.search(/[：:]/);
    if (idx < 0) continue;
    const label = t.slice(0, idx).trim();
    for (const [key, name] of map) {
      if (label === name && out[key] === undefined) out[key] = t.slice(idx + 1).trim();
    }
  }
  return out;
}

export function renderVars(opts: AddOptions, base: Partial<Header> = {}): Record<string, string> {
  const slug = slugify(opts.name);
  // 没给链接就留空（以前会自动编一个 leetcode.cn/problems/<slug>/，非 LeetCode 的题会变成 404）
  const link = opts.link !== undefined ? opts.link.trim() : (base.link ?? "");
  return {
    SLUG: slug,
    TITLE: opts.title?.trim() || base.title || titleize(slug),
    LINK: link,
    // 模板里的第二行注释：有链接就是 // <url>，没有就单独一个 //（不留尾随空格）
    LINK_LINE: link ? `// ${link}` : "//",
    DIFFICULTY: opts.difficulty !== undefined ? opts.difficulty.trim() : (base.difficulty ?? ""),
  };
}

/** 题面正文前面补上 题目 / 链接 / 难度 三行头部（正文自己已经带了就不重复加） */
function withHeader(text: string, vars: Record<string, string>): string {
  const first = text.split("\n").find((l) => l.trim() !== "")?.trim() ?? "";
  if (/^题目[：:]/.test(first)) return withNewline(text);
  const head = `题目：${vars.TITLE}\n链接：${vars.LINK}\n难度：${vars.DIFFICULTY}`;
  return `${head}\n\n${withNewline(text)}`;
}

export function problemFiles(opts: AddOptions, base: Partial<Header> = {}): { name: string; content: string }[] {
  const vars = renderVars(opts, base);
  return [
    {
      name: "problem.txt",
      content: opts.problem !== undefined ? withHeader(opts.problem, vars) : render(problemTpl, vars),
    },
    {
      name: "solution.txt",
      content: opts.solution !== undefined ? withNewline(opts.solution) : render(solutionTpl, vars),
    },
    { name: "solution.cpp", content: render(cppTpl, vars) },
    { name: "in.txt", content: opts.input !== undefined ? withNewline(opts.input) : inTpl },
    { name: "out.txt", content: opts.expected !== undefined ? withNewline(opts.expected) : outTpl },
    { name: "Makefile", content: render(makeTpl, vars) },
    { name: ".gitignore", content: gitignoreTpl },
    { name: "whiteboard.excalidraw", content: boardTpl },
  ];
}

export interface CreateResult {
  dir: string;
  /** 目录是这次新建（或 --force 重写）的吗 */
  created: boolean;
}

/** 只改 problem.txt 头部的 题目 / 链接 / 难度 三行（题目已存在时用） */
function patchProblemHeader(dir: string, opts: AddOptions): string[] {
  const path = join(dir, "problem.txt");
  const raw = readText(path);
  if (raw === null) return [];
  const vars = renderVars(opts);
  const wanted: [string, string, string | undefined][] = [
    ["题目", vars.TITLE, opts.title],
    ["链接", vars.LINK, opts.link],
    ["难度", vars.DIFFICULTY, opts.difficulty],
  ];
  let next = raw;
  const changed: string[] = [];
  for (const [label, value, given] of wanted) {
    if (given === undefined) continue;
    const re = new RegExp(`^${label}[：:].*$`, "m");
    if (!re.test(next)) continue;
    const replaced = next.replace(re, `${label}：${value}`);
    if (replaced !== next) {
      next = replaced;
      changed.push(label);
    }
  }
  if (next !== raw) writeText(path, next);
  return changed;
}

export function createProblem(opts: AddOptions): CreateResult {
  const slug = slugify(opts.name);
  if (!slug) die(`无效的题目名：${JSON.stringify(opts.name)}`);

  const dir = resolve(process.cwd(), slug);
  const existed = existsSync(dir);
  // 更新已有题目时，用现有 problem.txt 的头部兜底，避免把标题/难度冲成默认值
  const base = existed ? readHeader(readText(join(dir, "problem.txt"))) : {};
  const files = problemFiles(opts, base);

  // 目录已存在：不带内容参数就报错；带了内容就只更新显式给出的文件（不碰 solution.cpp）
  if (existed && !opts.force) {
    const watch: [string, unknown][] = [
      ["problem.txt", opts.problem],
      ["solution.txt", opts.solution],
      ["in.txt", opts.input],
      ["out.txt", opts.expected],
    ];
    const updates = files.filter((f) => watch.some(([n, v]) => f.name === n && v !== undefined));
    const patched = patchProblemHeader(dir, opts);

    if (updates.length === 0 && patched.length === 0) {
      console.error(`${c.red("error:")} 目录已存在：./${slug}`);
      hint(`只想补内容：algo add ${slug} --problem-file 题面.txt --solution-file 解法.txt --in-file in.txt`);
      hint(`想全部重来：algo ${slug} --force`);
      process.exit(1);
    }
    mkdirSync(dir, { recursive: true });
    for (const f of updates) writeText(join(dir, f.name), f.content);
    const done = [...updates.map((u) => u.name), ...patched.map((p) => `problem.txt 的 ${p}`)];
    ok(`已更新 ./${slug} 的 ${done.join("、")}`);
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
    hint(`cd ${slug} && micro .        # 先看 problem.txt 写题面，再在 solution.cpp 里写`);
    hint("algo in / algo out          # 改样例输入 / 期望输出");
    hint("make r                      # 用 in.txt 跑一遍（AC = 过了）");
    hint("make p / make s             # 看题面 / 看解法（答案在 solution.txt）");
  }
  return { dir, created: true };
}
