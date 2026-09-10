import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { c, die, hint, run as exec } from "./util";
import { which } from "./util";

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

export function printPath(dir: string): void {
  console.log(dir);
  hint("cd 进去之后用 micro . 打开");
}
