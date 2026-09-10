import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Flags, flagOn, flagStr } from "./flags";
import { die, hint } from "./util";

export interface AddOptions {
  name: string;
  title?: string;
  link?: string;
  difficulty?: string;
  tags: string[];
  /** 题面 markdown；undefined 表示用模板 */
  problem?: string;
  /** 解法 markdown；undefined 表示用模板 */
  solution?: string;
  force: boolean;
  edit: boolean;
}

interface JsonSpec {
  name?: string;
  slug?: string;
  title?: string;
  link?: string;
  url?: string;
  difficulty?: string;
  tags?: string[] | string;
  problem?: string;
  problem_file?: string;
  problemFile?: string;
  solution?: string;
  solution_file?: string;
  solutionFile?: string;
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function readSource(src: string, label: string): string {
  if (src === "-") return readStdin();
  try {
    return readFileSync(resolve(src), "utf8");
  } catch {
    die(`读不到 ${label} 指定的文件：${src}`);
  }
}

function splitTags(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  const list = Array.isArray(v) ? v : v.split(/[,，、]+/);
  return list.map((s) => String(s).trim()).filter(Boolean);
}

/** 从 JSON 规格解析，供 `algo add --json <文件|->` 使用 */
function readJsonSpec(src: string): JsonSpec {
  const text = src === "-" ? readStdin() : readSource(src, "--json");
  try {
    const obj = JSON.parse(text) as JsonSpec;
    if (obj === null || typeof obj !== "object") throw new Error("顶层不是对象");
    return obj;
  } catch (e) {
    die(`--json 解析失败：${(e as Error).message}`);
  }
}

function pickText(
  flags: Flags,
  kind: "problem" | "solution",
  json: JsonSpec,
  fromStdin: string[],
): string | undefined {
  // 优先级：--xxx-file > --xxx > json.xxx > json.xxx_file
  const fileFlag = `${kind}-file`;
  const file = flagStr(flags, fileFlag);
  if (file !== undefined) {
    if (file === "-") fromStdin.push(fileFlag);
    return readSource(file, `--${fileFlag}`);
  }

  const inline = flagStr(flags, kind);
  if (inline !== undefined) return inline;

  const j = kind === "problem" ? json.problem : json.solution;
  if (v(j)) return j;

  const jf = kind === "problem" ? (json.problem_file ?? json.problemFile) : (json.solution_file ?? json.solutionFile);
  if (v(jf)) {
    if (jf === "-") fromStdin.push(`${kind}_file`);
    return readSource(jf, `${kind}_file`);
  }
  return undefined;
}

function v(x: string | undefined): x is string {
  return typeof x === "string" && x.length > 0;
}

export function resolveAddOptions(positionals: string[], flags: Flags): AddOptions {
  const jsonSrc = flagStr(flags, "json");
  const json: JsonSpec = jsonSrc !== undefined ? readJsonSpec(jsonSrc) : {};

  const name = positionals[0] ?? json.name ?? json.slug;
  if (!name || !name.trim()) {
    die("用法：algo add <名字> [选项]    或    algo add --json <文件|->");
  }

  const fromStdin: string[] = [];
  if (jsonSrc === "-") fromStdin.push("--json");
  const problem = pickText(flags, "problem", json, fromStdin);
  const solution = pickText(flags, "solution", json, fromStdin);

  if (fromStdin.length > 1) {
    die(`${fromStdin.join(" 和 ")} 都想从 stdin 读内容，一次只能读一个；改用 --json - 把内容放进同一个 JSON`);
  }

  const tagsFlag = flagStr(flags, "tags");
  const tags = tagsFlag !== undefined ? splitTags(tagsFlag) : splitTags(json.tags);

  return {
    name: name.trim(),
    title: flagStr(flags, "title") ?? json.title,
    link: flagStr(flags, "link") ?? json.link ?? json.url,
    difficulty: flagStr(flags, "difficulty") ?? json.difficulty,
    tags,
    problem,
    solution,
    force: flagOn(flags, "force"),
    edit: flagOn(flags, "edit"),
  };
}

/** `algo add --json -` 的字段说明，供 --help 与文档引用 */
export const JSON_SPEC_HELP = [
  "{",
  '  "name": "two-sum",',
  '  "title": "两数之和",',
  '  "link": "https://leetcode.cn/problems/two-sum/",',
  '  "difficulty": "简单",',
  '  "tags": ["数组", "哈希表"],',
  '  "problem": "## 题目描述...",',
  '  "solution": "## 思路..."',
  "}",
].join("\n");
