import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import initLuaTpl from "../assets/init.lua" with { type: "text" };
import { c, hint, info, ok, readText, timestamp, versionOf, warn, which, writeText } from "./util";

/**
 * algo 管理的 micro 配置项（“LeetCode 风格”的 C++ 刷题 profile）。
 * 每个 key 都会被 merge 进 ~/.config/micro/settings.json，其它 key 原样保留。
 */
export const PROFILE: Record<string, unknown> = {
  // 保留：括号 / 引号自动补全
  autoclose: true,
  // 关闭：内置 linter 插件会在保存时跑 g++ -fsyntax-only，
  // 并把错误以下划线（终端里的“波浪线”）标在代码上
  linter: false,
  // 关闭：tab/空格混用时的高亮告警
  hltaberrors: false,
  // 关闭：行尾空格高亮（交给 rmtrailingws 自动删）
  hltrailingws: false,
  // 保留：语法高亮 + 匹配括号高亮（LeetCode 观感）
  syntax: true,
  matchbrace: true,
  matchbracestyle: "underline",
  // 编辑体验：4 空格缩进、自动缩进、粘贴智能缩进
  autoindent: true,
  tabstospaces: true,
  tabsize: 4,
  smartpaste: true,
  eofnewline: true,
  rmtrailingws: true,
  // 界面：行号高亮、状态栏、滚动条、真彩色、鼠标
  cursorline: true,
  statusline: true,
  scrollbar: true,
  truecolor: "on",
  mouse: true,
  // 会话记忆：光标位置 / 撤销历史
  savecursor: true,
  saveundo: true,
};

export function microConfigDir(): string {
  const env = process.env.MICRO_CONFIG_DIR?.trim();
  return env && env.length > 0 ? env : join(homedir(), ".config", "micro");
}

export function microSettingsPath(): string {
  return join(microConfigDir(), "settings.json");
}

export type MergeKind = "added" | "changed" | "same";
export interface MergeRow {
  key: string;
  kind: MergeKind;
  from?: unknown;
  to: unknown;
}

/** 保留 existing 的键顺序，覆盖 PROFILE 里的值，再追加 PROFILE 新增的键 */
export function mergeSettings(existing: Record<string, unknown>): {
  merged: Record<string, unknown>;
  rows: MergeRow[];
} {
  const merged: Record<string, unknown> = {};
  const rows: MergeRow[] = [];

  for (const [k, v] of Object.entries(existing)) {
    if (k in PROFILE) {
      const to = PROFILE[k];
      const same = JSON.stringify(v) === JSON.stringify(to);
      merged[k] = to;
      rows.push({ key: k, kind: same ? "same" : "changed", from: v, to });
    } else {
      merged[k] = v;
    }
  }
  for (const [k, v] of Object.entries(PROFILE)) {
    if (!(k in existing)) {
      merged[k] = v;
      rows.push({ key: k, kind: "added", to: v });
    }
  }
  return { merged, rows };
}

const fmt = (v: unknown) => (typeof v === "string" ? JSON.stringify(v) : String(v));

/** 安装 ~/.config/micro/init.lua（Alt-r 一键 make run）。已存在则绝不覆盖。 */
export function installInitLua(opts: SetupOptions = {}): void {
  const file = join(microConfigDir(), "init.lua");
  if (existsSync(file)) {
    warn(`${file} 已存在，未做改动`);
    hint("想加“Alt-r 跑 make run”，把 cli/assets/init.lua 的内容手动并进去");
    return;
  }
  if (opts.dryRun) {
    info(`将创建 ${file}`);
    return;
  }
  writeText(file, initLuaTpl);
  ok(`已创建 ${file}`);
  hint("新增快捷键：Alt-r = 保存并 make run");
}

export function initLuaPath(): string {
  return join(microConfigDir(), "init.lua");
}

export interface SetupOptions {
  dryRun?: boolean;
  force?: boolean;
}

/** 安装 / 合并 micro 的 C++ 刷题配置。幂等，会先备份原文件。 */
export function installMicroProfile(opts: SetupOptions = {}): void {
  const dir = microConfigDir();
  const file = microSettingsPath();

  const microPath = which("micro");
  if (!microPath) {
    warn("没有检测到 micro 编辑器，先配置好 settings.json 也不会生效");
    hint("安装：brew install micro     （或见 cli/micro.md 的安装章节）");
  }

  if (!existsSync(file)) {
    if (opts.dryRun) {
      info(`将创建 ${file}`);
      for (const [k, v] of Object.entries(PROFILE)) console.log(`  + ${k}: ${fmt(v)}`);
      return;
    }
    writeText(file, JSON.stringify(PROFILE, null, 4) + "\n");
    ok(`已创建 ${file}`);
    reportTail(microPath);
    return;
  }

  const raw = readText(file) ?? "";
  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    console.error(c.red("error:") + ` ${file} 不是合法 JSON，未做任何修改`);
    hint("修好 JSON 后重试，或先手动备份再删除该文件让 algo 重新生成");
    process.exit(1);
  }

  const { merged, rows } = mergeSettings(existing);
  const dirty = rows.filter((r) => r.kind !== "same");

  if (dirty.length === 0) {
    ok("micro 配置已是最新，无需改动");
    reportTail(microPath);
    return;
  }

  console.log(c.bold(`将更新 ${file}`));
  for (const r of rows) {
    if (r.kind === "added") console.log(`  ${c.green("+")} ${r.key}: ${fmt(r.to)}`);
    else if (r.kind === "changed")
      console.log(`  ${c.yellow("~")} ${r.key}: ${fmt(r.from)} ${c.gray("→")} ${fmt(r.to)}`);
  }
  console.log();

  if (opts.dryRun) {
    info("--dry-run：未写入任何文件");
    return;
  }

  const backup = `${file}.bak-${timestamp()}`;
  copyFileSync(file, backup);
  mkdirSync(dir, { recursive: true });
  writeText(file, JSON.stringify(merged, null, 4) + "\n");
  ok(`已写入 ${file}`);
  info(`原文件已备份到 ${backup}`);
  reportTail(microPath);
}

function reportTail(microPath: string | null): void {
  console.log();
  if (microPath) hint("micro 若开着，按 Ctrl+E 执行 reload 即可生效（或重开）");
  hint("检查当前状态：algo doctor");
  hint("为什么这样配：cli/micro.md");
}

export interface MicroStatus {
  configDir: string;
  settingsPath: string;
  settingsExists: boolean;
  linterOff: boolean;
  autocloseOn: boolean;
  syntaxOn: boolean;
}

export function microStatus(): MicroStatus {
  const file = microSettingsPath();
  const raw = readText(file);
  let obj: Record<string, unknown> = {};
  if (raw !== null) {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      obj = {};
    }
  }
  return {
    configDir: microConfigDir(),
    settingsPath: file,
    settingsExists: raw !== null,
    linterOff: obj.linter === false,
    autocloseOn: obj.autoclose !== false,
    syntaxOn: obj.syntax !== false,
  };
}

export function microVersion(): string | null {
  return versionOf("micro", ["-version"]);
}
