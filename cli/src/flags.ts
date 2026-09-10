import { die } from "./util";

export type FlagValue = string | boolean;
export interface Flags {
  [k: string]: FlagValue;
}
export interface Parsed {
  positionals: string[];
  flags: Flags;
}

/** 需要吃掉下一个参数作为值的选项；其余一律当布尔开关 */
const VALUE_FLAGS = new Set([
  "title",
  "link",
  "difficulty",
  "problem",
  "problem-file",
  "solution",
  "solution-file",
  "in",
  "in-file",
  "out",
  "out-file",
  "json",
  "timeout",
]);

const SHORT: Record<string, string> = {
  e: "edit",
  f: "force",
  h: "help",
  v: "version",
};

export function parseArgs(argv: string[]): Parsed {
  const positionals: string[] = [];
  const flags: Flags = {};
  let onlyPositional = false;

  for (let i = 0; i < argv.length; ) {
    const a = argv[i];
    if (onlyPositional) {
      positionals.push(a);
      i++;
      continue;
    }
    if (a === "--") {
      onlyPositional = true;
      i++;
      continue;
    }
    if (a.startsWith("--")) {
      const body = a.slice(2);
      const eq = body.indexOf("=");
      if (eq >= 0) {
        flags[body.slice(0, eq)] = body.slice(eq + 1);
        i++;
        continue;
      }
      if (VALUE_FLAGS.has(body)) {
        const next = argv[i + 1];
        if (next === undefined) die(`--${body} 需要一个值`);
        flags[body] = next;
        i += 2;
        continue;
      }
      flags[body] = true;
      i++;
      continue;
    }
    if (a.startsWith("-") && a.length > 1) {
      flags[SHORT[a.slice(1)] ?? a.slice(1)] = true;
      i++;
      continue;
    }
    positionals.push(a);
    i++;
  }

  return { positionals, flags };
}

export function flagStr(f: Flags, k: string): string | undefined {
  const v = f[k];
  return typeof v === "string" ? v : undefined;
}

export function flagOn(f: Flags, ...ks: string[]): boolean {
  return ks.some((k) => f[k] === true || typeof f[k] === "string");
}
