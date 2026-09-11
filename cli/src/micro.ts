import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import autocopyHelp from "../assets/plug/autocopy/help/autocopy.md" with { type: "text" };
import autocopyLua from "../assets/plug/autocopy/autocopy.lua" with { type: "text" };
import initLuaTpl from "../assets/init.lua" with { type: "text" };
import { c, hint, info, ok, readText, timestamp, versionOf, warn, which, writeText } from "./util";

/**
 * algo 管理的 micro 配置项（“LeetCode 风格”的 C++ 刷题 profile）。
 * 每个 key 都会被 merge 进 ~/.config/micro/settings.json，其它 key 原样保留。
 */
export const PROFILE: Record<string, unknown> = {
  // 自动保存：每 2 秒一次（micro 的 autosave 是「秒数」，不是布尔；
  // 写 true 会被兼容转换成 8 秒）。保存过程不弹任何提示，完全静默。
  autosave: 2,
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
  // 长行按终端宽度自动换行（micro 默认 false：超宽的行会横向滚动，尾巴看不见）：
  // softwrap = 折行显示；wordwrap = 在空格处断开，不把标识符劈成两半
  softwrap: true,
  wordwrap: true,
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

/**
 * algo 管理的按键绑定，merge 进 ~/.config/micro/bindings.json。
 * 只写「micro 默认不是这样、但刷题时更顺手」的键（micro 的默认绑定见 cli/micro.md §5.4），
 * 另外四个键由 init.lua 提供（algo setup --init）：Alt-r 跑样例、Alt-t 对拍、Alt-i/Alt-o 开 in/out。
 *
 * 注意：Tab / Shift-Tab 的同类词补全（Autocomplete|IndentSelection|InsertTab）是 micro 内核默认，
 * 所以**故意不写在这里**——写进去等于把用户自定义的 Tab 也钉死。algo doctor 会检查它没被覆盖。
 */
export const BINDINGS: Record<string, string> = {
  // 命令模式：micro 默认在 Ctrl-E，挪到 Ctrl-P
  "Ctrl-P": "CommandMode",
  // 分屏：Ctrl-B 竖着分（左右），Ctrl-L 横着分（上下）
  "Ctrl-B": "command:vsplit",
  "Ctrl-L": "command:hsplit",
  // F12 在分屏之间跳（默认只有 Ctrl-W）
  F12: "NextSplit|FirstSplit",
  // 新建文件：回车后输入文件名；open 对不存在的文件会开一个空 buffer，保存即创建
  "Alt-n": "command-edit:open ",
  // 复制当前行（默认只有 Ctrl-D）
  "Alt-d": "DuplicateLine",
};

/**
 * algo 自带的 micro 插件：`algo setup` 把它们写进 ~/.config/micro/plug/<插件名>/。
 * 只放「micro 本身没有、刷题时又要用」的能力（目前就一个 autocopy：鼠标划词即复制到系统剪贴板）。
 * 这些文件归 algo 管：内容一致就跳过，被改过则先备份再覆盖（见 installPluginFile）。
 * 行为说明以 cli/micro.md 为准，改插件时两边一起改。
 */
export const PLUGIN_FILES: { path: string; content: string }[] = [
  { path: join("plug", "autocopy", "autocopy.lua"), content: autocopyLua },
  { path: join("plug", "autocopy", "help", "autocopy.md"), content: autocopyHelp },
];

/** 插件的安装目录（给 doctor / 测试用） */
export function microPluginDir(): string {
  return join(microConfigDir(), "plug", "autocopy");
}

/**
 * micro 的配置目录。
 * 优先级：MICRO_CONFIG_DIR（algo 自己的约定，给测试/多套配置用）
 *       → MICRO_CONFIG_HOME（micro 自己认的，见 internal/config/config.go）
 *       → XDG_CONFIG_HOME/micro → ~/.config/micro。
 * 注意 micro 二进制**不认** MICRO_CONFIG_DIR，别只设它却期待 micro 去读。
 */
export function microConfigDir(): string {
  const own = process.env.MICRO_CONFIG_DIR?.trim();
  if (own) return own;
  const microHome = process.env.MICRO_CONFIG_HOME?.trim();
  if (microHome) return microHome;
  const xdg = process.env.XDG_CONFIG_HOME?.trim();
  return xdg ? join(xdg, "micro") : join(homedir(), ".config", "micro");
}

export function microSettingsPath(): string {
  return join(microConfigDir(), "settings.json");
}

export function microBindingsPath(): string {
  return join(microConfigDir(), "bindings.json");
}

export function initLuaPath(): string {
  return join(microConfigDir(), "init.lua");
}

export type MergeKind = "added" | "changed" | "same";
export interface MergeRow {
  key: string;
  kind: MergeKind;
  from?: unknown;
  to: unknown;
}

/** 保留 existing 的键顺序，覆盖 profile 里的值，再追加 profile 新增的键 */
export function mergeProfile(
  existing: Record<string, unknown>,
  profile: Record<string, unknown>,
): { merged: Record<string, unknown>; rows: MergeRow[] } {
  const merged: Record<string, unknown> = {};
  const rows: MergeRow[] = [];

  for (const [k, v] of Object.entries(existing)) {
    if (k in profile) {
      const to = profile[k];
      const same = JSON.stringify(v) === JSON.stringify(to);
      merged[k] = to;
      rows.push({ key: k, kind: same ? "same" : "changed", from: v, to });
    } else {
      merged[k] = v;
    }
  }
  for (const [k, v] of Object.entries(profile)) {
    if (!(k in existing)) {
      merged[k] = v;
      rows.push({ key: k, kind: "added", to: v });
    }
  }
  return { merged, rows };
}

/** 兼容旧调用：settings.json 的 merge */
export function mergeSettings(existing: Record<string, unknown>): {
  merged: Record<string, unknown>;
  rows: MergeRow[];
} {
  return mergeProfile(existing, PROFILE);
}

const fmt = (v: unknown) => (typeof v === "string" ? JSON.stringify(v) : String(v));

interface ProfileFile {
  /** 人看的名字，例如「全局选项」 */
  label: string;
  path: string;
  profile: Record<string, unknown>;
}

/**
 * 把一个 profile merge 进目标 JSON 文件：只覆盖 profile 里的键，其余原样保留；
 * 有改动才写盘，写之前先备份成 <文件>.bak-<时间戳>。返回这次做了什么。
 */
function installJsonProfile(file: ProfileFile, opts: SetupOptions): "same" | "written" | "planned" {
  const raw = readText(file.path);

  if (raw === null) {
    if (opts.dryRun) {
      info(`将创建 ${file.path}（${file.label}）`);
      for (const [k, v] of Object.entries(file.profile)) console.log(`  + ${k}: ${fmt(v)}`);
      return "planned";
    }
    writeText(file.path, JSON.stringify(file.profile, null, 4) + "\n");
    ok(`已创建 ${file.path}`);
    return "written";
  }

  let existing: Record<string, unknown>;
  try {
    existing = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.error(c.red("error:") + ` ${file.path} 不是合法 JSON，未做任何修改`);
    hint("修好 JSON 后重试，或先手动备份再删除该文件让 algo 重新生成");
    process.exit(1);
  }

  const { merged, rows } = mergeProfile(existing, file.profile);
  const dirty = rows.filter((r) => r.kind !== "same");
  if (dirty.length === 0) return "same";

  console.log(c.bold(`将更新 ${file.path}`) + c.gray(`（${file.label}）`));
  for (const r of rows) {
    if (r.kind === "added") console.log(`  ${c.green("+")} ${r.key}: ${fmt(r.to)}`);
    else if (r.kind === "changed")
      console.log(`  ${c.yellow("~")} ${r.key}: ${fmt(r.from)} ${c.gray("→")} ${fmt(r.to)}`);
  }
  console.log();

  if (opts.dryRun) return "planned";

  const backup = `${file.path}.bak-${timestamp()}`;
  copyFileSync(file.path, backup);
  mkdirSync(dirname(file.path), { recursive: true });
  writeText(file.path, JSON.stringify(merged, null, 4) + "\n");
  ok(`已写入 ${file.path}`);
  info(`原文件已备份到 ${backup}`);
  return "written";
}

/** 安装 ~/.config/micro/init.lua（Alt-r 一键 make run 等）。已存在则绝不覆盖。 */
export function installInitLua(opts: SetupOptions = {}): void {
  const file = initLuaPath();
  if (existsSync(file)) {
    warn(`${file} 已存在，未做改动`);
    hint("想加 Alt-r / Alt-t / Alt-i / Alt-o，把 cli/assets/init.lua 的内容手动并进去");
    return;
  }
  if (opts.dryRun) {
    info(`将创建 ${file}`);
    return;
  }
  writeText(file, initLuaTpl);
  ok(`已创建 ${file}`);
  hint("新增快捷键：Alt-r 跑样例 · Alt-t 对拍 · Alt-i / Alt-o 打开 in.txt / out.txt");
}

/**
 * 装一个 algo 自带的 micro 插件文件（见 PLUGIN_FILES）。
 * 内容一致 → 什么都不做；不一致 → 备份成 <文件>.bak-<时间戳> 再覆盖。
 * 插件文件是 algo 的产物（不是用户的配置），所以这里不 merge，而是整体覆盖。
 */
function installPluginFile(
  file: { path: string; content: string },
  opts: SetupOptions,
): "same" | "written" | "planned" {
  const target = join(microConfigDir(), file.path);
  const raw = readText(target);
  if (raw === file.content) return "same";

  if (opts.dryRun) {
    info(`将写入 ${target}${raw === null ? "" : "（已存在，会被覆盖，原文件先备份）"}`);
    return "planned";
  }

  if (raw !== null) {
    const backup = `${target}.bak-${timestamp()}`;
    copyFileSync(target, backup);
    warn(`${target} 内容有变，原文件已备份到 ${backup}`);
  }
  writeText(target, file.content);
  ok(`已写入 ${target}`);
  return "written";
}

export interface SetupOptions {
  dryRun?: boolean;
  force?: boolean;
}

/** 安装 / 合并 micro 的 C++ 刷题配置（含自带插件）。幂等，会先备份原文件。 */
export function installMicroProfile(opts: SetupOptions = {}): void {
  const microPath = which("micro");
  if (!microPath) {
    warn("没有检测到 micro 编辑器，先配置好 settings.json 也不会生效");
    hint("安装：brew install micro     （或见 cli/micro.md 的安装章节）");
  }

  const results = [
    installJsonProfile({ label: "全局选项", path: microSettingsPath(), profile: PROFILE }, opts),
    installJsonProfile({ label: "按键绑定", path: microBindingsPath(), profile: BINDINGS }, opts),
    // 自带插件（autocopy）：跟 settings/bindings 一样幂等，装进 plug/<名字>/
    ...PLUGIN_FILES.map((f) => installPluginFile(f, opts)),
  ];

  if (results.every((r) => r === "same")) {
    ok("micro 配置已是最新，无需改动");
  } else if (opts.dryRun) {
    info("--dry-run：未写入任何文件");
  }

  reportTail(microPath);
}

function reportTail(microPath: string | null): void {
  console.log();
  if (microPath) hint("micro 若开着，按 Ctrl+E 执行 reload 即可生效（或重开）");
  hint("自带插件 autocopy：鼠标划词（拖选 / 双击 / 三击）松手即复制到系统剪贴板");
  if (!existsSync(initLuaPath()))
    hint("想要 Alt-r 一键 make run / Alt-t 对拍 / Alt-i·Alt-o 开样例：algo setup --init");
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
  bindingsPath: string;
  bindingsExists: boolean;
  /** BINDINGS 里已经写进 bindings.json 的键数 */
  bindingsApplied: number;
  bindingsTotal: number;
  /** Tab 是否仍走 micro 内核的同类词补全（bindings.json 没把 Tab 覆盖成别的动作） */
  tabAutocompleteOn: boolean;
  initLuaExists: boolean;
  /** 自带插件（autocopy）装在哪、装没装齐 */
  pluginDir: string;
  pluginInstalled: boolean;
}

function readJson(path: string): Record<string, unknown> {
  const raw = readText(path);
  if (raw === null) return {};
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function microStatus(): MicroStatus {
  const settingsPath = microSettingsPath();
  const bindingsPath = microBindingsPath();
  const settings = readJson(settingsPath);
  const bindings = readJson(bindingsPath);
  // micro 默认 Tab = "Autocomplete|IndentSelection|InsertTab"（同类词补全 → 缩进，见 cli/micro.md §6）。
  // bindings.json 里没写这个键就用默认；写了但不含 Autocomplete 就是被改坏了。
  const tabKey = Object.keys(bindings).find((k) => k.toLowerCase() === "tab");
  const tabAutocompleteOn = tabKey === undefined || String(bindings[tabKey]).includes("Autocomplete");
  return {
    configDir: microConfigDir(),
    settingsPath,
    settingsExists: readText(settingsPath) !== null,
    linterOff: settings.linter === false,
    autocloseOn: settings.autoclose !== false,
    syntaxOn: settings.syntax !== false,
    bindingsPath,
    bindingsExists: readText(bindingsPath) !== null,
    bindingsApplied: Object.entries(BINDINGS).filter(([k, v]) => bindings[k] === v).length,
    bindingsTotal: Object.keys(BINDINGS).length,
    tabAutocompleteOn,
    initLuaExists: existsSync(initLuaPath()),
    pluginDir: microPluginDir(),
    pluginInstalled: PLUGIN_FILES.every((f) => readText(join(microConfigDir(), f.path)) === f.content),
  };
}

export function microVersion(): string | null {
  return versionOf("micro", ["-version"]);
}
