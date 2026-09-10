import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Flags, flagOn, flagStr } from "./flags";
import { die } from "./util";

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
  /** 样例输入（in.txt）；undefined 表示留空 */
  input?: string;
  /** 期望输出（out.txt）；undefined 表示留空 */
  expected?: string;
  force: boolean;
  edit: boolean;
}

type JsonSpec = Record<string, string | string[] | undefined>;

interface Kind {
  /** 选项名，如 --problem / --problem-file */
  flag: string;
  jsonKey: string;
  jsonFileKey: string;
  /** JSON 里也接受 camelCase */
  jsonAltKey: string;
}

const KINDS = {
  problem: { flag: "problem", jsonKey: "problem", jsonFileKey: "problem_file", jsonAltKey: "problemFile" },
  solution: { flag: "solution", jsonKey: "solution", jsonFileKey: "solution_file", jsonAltKey: "solutionFile" },
  in: { flag: "in", jsonKey: "in", jsonFileKey: "in_file", jsonAltKey: "inFile" },
  out: { flag: "out", jsonKey: "out", jsonFileKey: "out_file", jsonAltKey: "outFile" },
} satisfies Record<string, Kind>;

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

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function splitTags(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  const list = Array.isArray(v) ? v : v.split(/[,，、]+/);
  return list.map((s) => String(s).trim()).filter(Boolean);
}

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

/** 优先级：--xxx-file > --xxx > json.xxx > json.xxx_file */
function pickText(flags: Flags, kind: Kind, json: JsonSpec, fromStdin: string[]): string | undefined {
  const fileFlag = `${kind.flag}-file`;
  const file = flagStr(flags, fileFlag);
  if (file !== undefined) {
    if (file === "-") fromStdin.push(`--${fileFlag}`);
    return readSource(file, `--${fileFlag}`);
  }

  const inline = flagStr(flags, kind.flag);
  if (inline !== undefined) return inline;

  const j = str(json[kind.jsonKey]);
  if (j !== undefined) return j;

  const jf = str(json[kind.jsonFileKey]) ?? str(json[kind.jsonAltKey]);
  if (jf !== undefined) {
    if (jf === "-") fromStdin.push(kind.jsonFileKey);
    return readSource(jf, kind.jsonFileKey);
  }
  return undefined;
}

export function resolveAddOptions(positionals: string[], flags: Flags): AddOptions {
  const jsonSrc = flagStr(flags, "json");
  const json: JsonSpec = jsonSrc !== undefined ? readJsonSpec(jsonSrc) : {};

  const name = positionals[0] ?? json.name ?? json.slug;
  if (typeof name !== "string" || !name.trim()) {
    die("用法：algo add <名字> [选项]    或    algo add --json <文件|->");
  }

  const fromStdin: string[] = [];
  if (jsonSrc === "-") fromStdin.push("--json");

  const problem = pickText(flags, KINDS.problem, json, fromStdin);
  const solution = pickText(flags, KINDS.solution, json, fromStdin);
  const input = pickText(flags, KINDS.in, json, fromStdin);
  const expected = pickText(flags, KINDS.out, json, fromStdin);

  if (fromStdin.length > 1) {
    die(`${fromStdin.join(" 和 ")} 都想从 stdin 读内容，一次只能读一个；改用 --json - 把内容放进同一个 JSON`);
  }

  const tagsFlag = flagStr(flags, "tags");
  const tags = tagsFlag !== undefined ? splitTags(tagsFlag) : splitTags(json.tags);

  return {
    name: name.trim(),
    title: flagStr(flags, "title") ?? str(json.title),
    link: flagStr(flags, "link") ?? str(json.link) ?? str(json.url),
    difficulty: flagStr(flags, "difficulty") ?? str(json.difficulty),
    tags,
    problem,
    solution,
    input,
    expected,
    force: flagOn(flags, "force"),
    edit: flagOn(flags, "edit"),
  };
}
