import { existsSync, mkdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";

// ---------- 颜色 ----------
const useColor = Boolean(process.stdout.isTTY) && process.env.NO_COLOR === undefined;
const wrap = (code: string) => (s: string) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);

export const c = {
  bold: wrap("1"),
  dim: wrap("2"),
  red: wrap("31"),
  green: wrap("32"),
  yellow: wrap("33"),
  blue: wrap("34"),
  cyan: wrap("36"),
  gray: wrap("90"),
};

// ---------- 输出 ----------
// --print-dir 模式（给 shell 集成用）下，人看的输出走 stderr，
// stdout 只留给机器可读的路径，这样 $(...) 才拿得干净。
let humanToStderr = false;

export function routeHumanToStderr(on: boolean): void {
  humanToStderr = on;
}

/** 人看的输出 */
export function out(line = ""): void {
  if (humanToStderr) console.error(line);
  else console.log(line);
}

/** 机器可读的输出，永远走 stdout */
export function emit(line: string): void {
  console.log(line);
}

export function die(msg: string): never {
  console.error(`${c.red("error:")} ${msg}`);
  process.exit(1);
}
export const ok = (m: string) => out(`${c.green("✓")} ${m}`);
export const warn = (m: string) => out(`${c.yellow("!")} ${m}`);
export const bad = (m: string) => out(`${c.red("✗")} ${m}`);
export const info = (m: string) => out(`${c.blue("›")} ${m}`);
export const hint = (m: string) => out(`  ${c.gray(m)}`);

// ---------- 文件 ----------
export function readText(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export function writeText(path: string, data: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, data, "utf8");
}

export function removeIfExists(path: string): void {
  if (existsSync(path)) unlinkSync(path);
}

export const isDir = (p: string) => existsSync(p) && statSync(p).isDirectory();
export const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

// ---------- 进程 ----------
export function which(bin: string): string | null {
  const r = spawnSync("sh", ["-c", `command -v ${bin} 2>/dev/null`], { encoding: "utf8" });
  const out = (r.stdout ?? "").trim();
  return r.status === 0 && out ? out.split("\n")[0] : null;
}

export function versionOf(cmd: string, args: string[] = ["--version"]): string | null {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  const lines = `${r.stdout ?? ""}${r.stderr ?? ""}`.split("\n").map((s) => s.trim()).filter(Boolean);
  return lines.length > 0 ? lines[0] : null;
}

export function run(cmd: string, args: string[], cwd: string): number {
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
  return r.status ?? 1;
}

// ---------- 文本 ----------
export function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** two-sum / Two_Sum -> two-sum */
export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9.-]/g, "")
    .replace(/[.-]{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

/** two-sum -> Two Sum */
export function titleize(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function render(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => vars[k] ?? "");
}

export function pad(s: string, width: number): string {
  const visible = [...s].length;
  return s + " ".repeat(Math.max(1, width - visible));
}
