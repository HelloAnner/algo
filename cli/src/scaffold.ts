import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import solutionTpl from "../assets/solution.cpp" with { type: "text" };
import makeTpl from "../assets/make.tmpl" with { type: "text" };
import readmeTpl from "../assets/README.tmpl" with { type: "text" };
import inTpl from "../assets/in.txt" with { type: "text" };
import outTpl from "../assets/out.txt" with { type: "text" };
import gitignoreTpl from "../assets/gitignore" with { type: "text" };
import { c, die, hint, info, ok, pad, render, slugify, titleize, today, warn, writeText } from "./util";

export function problemFiles(slug: string): { name: string; content: string }[] {
  const vars = { SLUG: slug, TITLE: titleize(slug), DATE: today() };
  return [
    { name: "solution.cpp", content: render(solutionTpl, vars) },
    { name: "in.txt", content: inTpl },
    { name: "out.txt", content: outTpl },
    { name: "Makefile", content: render(makeTpl, vars) },
    { name: "README.md", content: render(readmeTpl, vars) },
    { name: ".gitignore", content: gitignoreTpl },
  ];
}

export function createProblem(rawName: string, opts: { force: boolean }): string {
  const slug = slugify(rawName);
  if (!slug) die(`无效的题目名：${JSON.stringify(rawName)}`);

  const dir = resolve(process.cwd(), slug);
  const existed = existsSync(dir);

  if (existed) {
    const entries = readdirSync(dir);
    if (entries.length > 0 && !opts.force) {
      console.error(`${c.red("error:")} 目录已存在且非空：./${slug}`);
      hint("换一个名字，或用 algo " + slug + " --force 覆盖同名文件");
      process.exit(1);
    }
  }

  mkdirSync(dir, { recursive: true });
  const files = problemFiles(slug);
  for (const f of files) writeText(join(dir, f.name), f.content);

  if (existed) warn(`目录已存在，已覆盖同名文件：./${slug}`);
  ok(`已创建题目 ./${slug}`);
  console.log();
  for (const f of files) console.log("  " + c.cyan(f.name));
  console.log();
  info("下一步：");
  hint(`cd ${slug} && micro .        # 开始写 solution.cpp`);
  hint("make run                    # 用 in.txt 跑一遍");
  hint("make check                  # 和 out.txt 比对");
  return dir;
}
