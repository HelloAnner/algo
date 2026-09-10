import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { BIN, BUILD_FLAGS, cleanupBin, compareLines, compiler, hasExpectedOutput, INCLUDE_FLAG, readCase, runBinary } from "./cpp";
import { c, out } from "./util";

/** 静态检查额外打开的警告（比日常编译更严） */
const LINT_FLAGS = [
  "-std=c++20",
  "-fsyntax-only",
  INCLUDE_FLAG,
  "-Wall",
  "-Wextra",
  "-Wshadow",
  "-Wsign-compare",
  "-Wuninitialized",
  "-Wvla",
  "-Wparentheses",
  "-Wreturn-type",
  "-Wunused",
  "-Wswitch",
  "-Wfloat-equal",
];

const WARN_LINE = /^(.*?):(\d+):(\d+): (?:fatal )?(warning|error): (.+)$/;

export interface CheckOptions {
  /** 跑样例的超时（秒） */
  timeoutSec?: number;
}

/** 在源码里找 ACM 常见坑 */
function styleFindings(src: string): string[] {
  const found: string[] = [];
  const push = (line: number, text: string) => found.push(`  ${c.gray(`solution.cpp:${line}`)} ${text}`);

  const hasIO = /\b(cin|cout)\b/.test(src);
  const hasCStd = /\b(scanf|printf|getchar|putchar)\s*\(/.test(src);

  src.split("\n").forEach((raw, i) => {
    const n = i + 1;
    const line = raw.replace(/\/\/.*$/, "");
    if (/\bendl\b/.test(line)) {
      push(n, "endl 会强制 flush，数据量大时明显变慢，换成 '\\n'");
    }
    if (/cin\.eof\(\)|feof\(stdin\)/.test(line)) {
      push(n, "用 eof() 当循环条件会多读一次，改成 while (cin >> x)");
    }
    if (/\bfflush\s*\(\s*stdin\s*\)/.test(line)) {
      push(n, "fflush(stdin) 是未定义行为");
    }
  });

  if (hasIO && hasCStd) {
    found.push("  " + "scanf/printf 和 cin/cout 混用：不关同步时两者顺序可能错乱，建议只用一种");
  }
  if (hasIO && !/sync_with_stdio\s*\(\s*false\s*\)/.test(src)) {
    found.push("  " + "用了 cin/cout 但没关同步，数据量大时慢：ios::sync_with_stdio(false); cin.tie(nullptr);");
  }
  return found;
}

/**
 * 编译 + 静态检查 + 写法检查 + 样例对拍。
 * 静默是设计目标：一切正常时不输出任何内容（只看退出码）；
 * 有问题才把问题打出来。
 */
export function runCheck(dir: string, opts: CheckOptions = {}): never {
  const srcPath = join(dir, "solution.cpp");
  if (!existsSync(srcPath)) {
    out(`${c.red("✗")} 找不到 solution.cpp`);
    process.exit(1);
  }
  const timeoutMs = Math.max(1, opts.timeoutSec ?? 5) * 1000;
  const report: string[] = [];
  let failed = false;

  try {
    // 1. 编译（含语法）
    const cxx = compiler();
    const build = spawnSync(cxx, [...BUILD_FLAGS, "solution.cpp", "-o", BIN], {
      cwd: dir,
      encoding: "utf8",
    });
    const buildOut = `${build.stdout ?? ""}${build.stderr ?? ""}`.trim();
    if (build.status !== 0) {
      out(`${c.red("✗")} 编译不通过`);
      out();
      for (const l of buildOut.split("\n").slice(0, 30)) out("  " + l);
      process.exit(1);
    }

    // 2. 静态检查
    const lint = spawnSync(cxx, [...LINT_FLAGS, "solution.cpp"], { cwd: dir, encoding: "utf8" });
    const lintOut = `${lint.stdout ?? ""}${lint.stderr ?? ""}`.trim();
    const lintFound: string[] = [];
    for (const line of lintOut.split("\n")) {
      const m = line.match(WARN_LINE);
      if (m) lintFound.push(`  ${c.gray(`${basename(m[1])}:${m[2]}:${m[3]}`)} ${m[5]}`);
    }
    if (lintFound.length > 0) {
      report.push(`${c.yellow("⚠")} 静态检查 ${lintFound.length} 条`, ...lintFound);
    }

    // 3. 写法检查
    const style = styleFindings(readFileSync(srcPath, "utf8"));
    if (style.length > 0) report.push(`${c.yellow("⚠")} 写法检查 ${style.length} 条`, ...style);

    // 4. 样例对拍
    if (!hasExpectedOutput(dir)) {
      report.push(`${c.yellow("!")} out.txt 还是空的，跳过对拍（把期望输出填进去）`);
    } else {
      const r = runBinary(dir, readCase(dir, "in.txt") ?? "", timeoutMs);
      if (r.timedOut) {
        report.push(`${c.red("✗")} 运行超过 ${timeoutMs / 1000}s 还没结束（死循环？）`);
        failed = true;
      } else {
        const cmp = compareLines(readCase(dir, "out.txt") ?? "", r.stdout);
        if (!cmp.ok) {
          failed = true;
          report.push(`${c.red("✗")} 样例 WA（退出码 ${r.status ?? "?"}）`);
          for (const d of cmp.diffs) report.push("  " + d);
        }
      }
    }
  } finally {
    cleanupBin(dir);
  }

  // 静默：一切正常就什么都不打印
  for (const line of report) out(line);
  process.exit(failed ? 1 : 0);
}
