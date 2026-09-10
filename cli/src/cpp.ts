import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { which } from "./util";

/** run / check 共用的临时二进制名，跑完立刻删掉 */
export const BIN = ".algo_bin";

/** 和题目 Makefile 里的 CXXFLAGS 保持一致 */
export const BUILD_FLAGS = ["-std=c++20", "-O2", "-Wall", "-Wextra", "-Wno-sign-compare", "-Wno-unused-variable"];

export function compiler(): string {
  const cxx = process.env.CXX;
  if (cxx) return cxx;
  return which("clang++") ?? which("g++") ?? "c++";
}

export function cleanupBin(dir: string): void {
  const p = join(dir, BIN);
  if (existsSync(p)) {
    try {
      unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

export interface BuildResult {
  ok: boolean;
  ms: number;
  output: string;
}

export function compile(dir: string, flags: string[] = BUILD_FLAGS): BuildResult {
  const t0 = Date.now();
  const r = spawnSync(compiler(), [...flags, "solution.cpp", "-o", BIN], { cwd: dir, encoding: "utf8" });
  const output = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  return { ok: r.status === 0 && existsSync(join(dir, BIN)), ms: Date.now() - t0, output };
}

export interface RunResult {
  stdout: string;
  stderr: string;
  status: number | null;
  timedOut: boolean;
}

export function runBinary(dir: string, input: string, timeoutMs: number): RunResult {
  const r = spawnSync(join(dir, BIN), [], {
    cwd: dir,
    input,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
    status: r.status,
    timedOut: Boolean(r.error && (r.error as NodeJS.ErrnoException).code === "ETIMEDOUT"),
  };
}

export function readCase(dir: string, file: string): string | null {
  const p = join(dir, file);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}

/** 有期望输出且不是空白 */
export function hasExpectedOutput(dir: string): boolean {
  const t = readCase(dir, "out.txt");
  return t !== null && t.trim() !== "";
}

export function compareLines(expectedRaw: string, actualRaw: string): { ok: boolean; diffs: string[] } {
  const norm = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "");
  const e = norm(expectedRaw) === "" ? [] : norm(expectedRaw).split("\n");
  const a = norm(actualRaw) === "" ? [] : norm(actualRaw).split("\n");

  const diffs: string[] = [];
  const max = Math.max(e.length, a.length);
  for (let i = 0; i < max && diffs.length < 4; i++) {
    if ((e[i] ?? null) !== (a[i] ?? null)) {
      diffs.push(`第 ${i + 1} 行：期望 ${JSON.stringify(e[i] ?? "(无)")}，实际 ${JSON.stringify(a[i] ?? "(无)")}`);
    }
  }
  if (e.length !== a.length) diffs.push(`行数不同：期望 ${e.length} 行，实际 ${a.length} 行`);
  return { ok: diffs.length === 0, diffs };
}
