#!/usr/bin/env bun
// algo — LeetCode 题解 CLI
// ponytail: 文件数据库就是 ~/.algo/db.json 一个 JSON，题量小，全量读写没问题
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join } from "node:path";

const ROOT = join(homedir(), "algo");
const DB_DIR = join(homedir(), ".algo");
const DB_PATH = join(DB_DIR, "db.json");
const PORT = 7717;
const TEMPLATE = join(ROOT, "template/base.html");

const TOPICS: Record<string, string> = {
  array: "数组", "linked-list": "链表", hash: "哈希表", string: "字符串",
  "two-pointers": "双指针", "sliding-window": "滑动窗口", stack: "栈", queue: "队列",
  tree: "树", graph: "图", dp: "动态规划", greedy: "贪心", backtracking: "回溯",
  "binary-search": "二分查找", heap: "堆", bit: "位运算", math: "数学",
  sort: "排序", interval: "区间", trie: "前缀树",
};

interface Review { date: string; rating: number }
interface ProblemState {
  code?: Record<string, string>;
  order?: string[];
  notes?: string;
  marks?: unknown[];
  topic?: string;
  title?: string;
  created?: string;
  opened?: string;
  updated?: string;
  interval?: number;
  due?: string;        // 下次复习日 YYYY-MM-DD
  reviews?: Review[];
}
interface DB { version: number; problems: Record<string, ProblemState> }

function loadDB(): DB {
  if (!existsSync(DB_PATH)) {
    mkdirSync(DB_DIR, { recursive: true });
    writeFileSync(DB_PATH, JSON.stringify({ version: 1, problems: {} }, null, 2));
  }
  return JSON.parse(readFileSync(DB_PATH, "utf8"));
}
const saveDB = (db: DB) => writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

const dateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayStr = () => dateStr(new Date());
const addDays = (d: string, n: number) => {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + n);
  return dateStr(dt);
};
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
function die(msg: string): never { console.error(msg); process.exit(1); }

/** 有效复习截止日：due → opened → updated */
const effDue = (p: ProblemState) => p.due ?? p.opened?.slice(0, 10) ?? p.updated?.slice(0, 10);

/** 待复习清单（逾期在前，按 due 升序） */
function dueList(db: DB): [string, ProblemState][] {
  const today = todayStr();
  return Object.entries(db.problems)
    .filter(([, p]) => { const d = effDue(p); return d && d <= today; })
    .sort(([ , a], [, b]) => (effDue(a) ?? "").localeCompare(effDue(b) ?? ""));
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css",
  ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json",
};

/* ── algo serve ── */
function serve() {
  Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/api/health") return Response.json({ ok: true });
      if (url.pathname === "/api/state") {
        const slug = url.searchParams.get("slug") ?? "";
        if (!slug) return Response.json({ error: "missing slug" }, { status: 400 });
        const db = loadDB();
        if (req.method === "GET") return Response.json(db.problems[slug] ?? {});
        if (req.method === "PUT" || req.method === "POST") {
          const body = (await req.json()) as ProblemState;
          db.problems[slug] = { ...db.problems[slug], ...body, updated: new Date().toISOString() };
          saveDB(db);
          return Response.json({ ok: true });
        }
      }
      let p = join(ROOT, decodeURIComponent(url.pathname));
      if (url.pathname.endsWith("/")) p = join(p, "index.html");
      const f = Bun.file(p);
      if (await f.exists()) {
        return new Response(f, { headers: { "Content-Type": MIME[extname(p)] ?? "application/octet-stream" } });
      }
      return new Response("404", { status: 404 });
    },
  });
  console.log(`algo serve → http://localhost:${PORT}  (root: ${ROOT})`);
}

async function findProblem(slug: string): Promise<string | null> {
  const glob = new Bun.Glob(`leetcode/**/${slug}/index.html`);
  for await (const f of glob.scan({ cwd: ROOT })) return f;
  return null;
}

async function ensureServer() {
  try {
    await fetch(`http://localhost:${PORT}/api/health`, { signal: AbortSignal.timeout(600) });
  } catch {
    Bun.spawn([process.execPath, join(ROOT, "cli/src/index.ts"), "serve"], {
      stdio: ["ignore", "ignore", "ignore"], detached: true,
    });
    await Bun.sleep(700);
  }
}

/* ── algo new <slug> --topic <t> [--title T] [--number N] ── */
async function cmdNew(slug?: string, flags?: Record<string, string>) {
  if (!slug) die("用法: algo new <slug> --topic <主题> [--title 标题] [--number 题号]");
  const topic = flags?.topic;
  if (!topic) die("缺少 --topic，可选: " + Object.keys(TOPICS).join(", "));
  if (!/^[a-z0-9-]+$/.test(slug)) die("slug 只能用小写字母、数字、连字符");
  const dir = join(ROOT, "leetcode", topic, slug);
  if (existsSync(dir)) die(`已存在: ${dir}`);
  if (!existsSync(TEMPLATE)) die(`模板缺失: ${TEMPLATE}`);
  if (!TOPICS[topic]) console.warn(`提示: 「${topic}」不在内置主题表里，将原样使用`);

  const label = TOPICS[topic] ?? topic;
  const title = flags?.title ?? slug;
  const number = flags?.number ?? "";
  const skeleton = `      <div class="masthead">
        <span class="brand">ALGO · ${label}</span>
        <span class="no">LEETCODE ${number}</span>
      </div>

      <h1>${title}</h1>
      <p class="subtitle">${slug} — TODO 一句话题眼</p>
      <div class="meta">
        <span class="tag">TODO 难度</span>
        <span class="tag">${label}</span>
      </div>

      <section>
        <h2><span class="secno">01</span>题目</h2>
        <div class="problem-card"><p>TODO</p></div>
      </section>

      <div class="footnote">
        <span>ALGO · ${label}专题</span>
        <span>选中任意文字可高亮 / 写评论</span>
      </div>`;

  const versions = JSON.stringify({ "我的解法": "def solution():\n    pass\n" });
  let html = readFileSync(TEMPLATE, "utf8");
  html = html
    .replaceAll("{{TITLE}}", `${number ? number + ". " : ""}${title}`)
    .replaceAll("{{SLUG}}", slug)
    .replace("{{VERSIONS_JSON}}", versions)
    .replace("{{CONTENT}}", skeleton)
    .replace(/\/\* \{\{VIZ_JS\}\}[^*]*\*\//, "// 可视化步骤机（可选）：参考 template/viz/ 与 template/COMPONENTS.md");

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);

  const db = loadDB();
  db.problems[slug] = {
    ...db.problems[slug], topic, title,
    created: todayStr(), due: todayStr(), interval: 0, reviews: [],
  };
  saveDB(db);
  console.log(`✓ ${join("leetcode", topic, slug, "index.html")}`);
  console.log(`  下一步: 在 pi 里让它讲解这道题，或 algo open ${slug}`);
}

/* ── algo open [slug]（无参 = 打开最紧的一道待复习题） ── */
async function cmdOpen(slug?: string) {
  const db = loadDB();
  if (!slug) {
    const first = dueList(db)[0];
    if (!first) die("没有待复习的题目。algo new 创建一道？");
    slug = first[0];
    console.log(`自动选择待复习: ${slug}`);
  }
  const rel = await findProblem(slug);
  if (!rel) die(`找不到题目: ${slug}（先 algo new ${slug} --topic ...）`);
  await ensureServer();
  db.problems[slug] = { ...db.problems[slug], opened: new Date().toISOString() };
  saveDB(db);
  const url = `http://localhost:${PORT}/${dirname(rel)}/`;
  Bun.spawn(["open", url]);
  console.log(url);
}

/* ── algo list [--topic t]（按主题分组） ── */
async function cmdList(flags?: Record<string, string>) {
  const glob = new Bun.Glob("leetcode/*/*/index.html");
  const db = loadDB();
  const groups = new Map<string, string[]>();
  for await (const f of glob.scan({ cwd: ROOT })) {
    const [, topic, slug] = f.split("/");
    if (flags?.topic && topic !== flags.topic) continue;
    const p = db.problems[slug];
    const due = effDue(p ?? {});
    const mark = due && due <= todayStr() ? "●" : "○";
    const line = `  ${mark} ${slug}${p?.title ? `  ${p.title}` : ""}${due ? `  (${due})` : ""}`;
    groups.set(topic, [...(groups.get(topic) ?? []), line]);
  }
  if (!groups.size) return console.log("暂无题目，用 algo new 创建");
  for (const [topic, lines] of [...groups].sort()) {
    console.log(`${TOPICS[topic] ?? topic} (${topic}) · ${lines.length} 题`);
    console.log(lines.join("\n"));
  }
  console.log("\n●=待复习  ○=未到期");
}

/* ── algo done <slug> --rating <1-5> ── */
function cmdDone(slug?: string, flags?: Record<string, string>) {
  if (!slug) die("用法: algo done <slug> --rating <1-5>");
  const rating = Number(flags?.rating);
  if (!rating || rating < 1 || rating > 5) die("--rating 必须是 1-5（5=秒答，1=完全不会）");
  const db = loadDB();
  const p = db.problems[slug] ?? {};
  const prev = p.interval ?? 0;
  // ponytail: 简化 SM-2，够用；要更科学换 fsrs
  const interval = rating <= 2 ? 1 : prev <= 0 ? (rating >= 4 ? 2 : 1)
    : Math.max(1, Math.round(prev * (rating === 5 ? 2.5 : rating === 4 ? 2 : 1.3)));
  const due = addDays(todayStr(), interval);
  const reviews = [...(p.reviews ?? []), { date: todayStr(), rating }];
  db.problems[slug] = { ...p, interval, due, reviews, updated: new Date().toISOString() };
  saveDB(db);
  console.log(`✓ ${slug}  评分 ${rating}★  第 ${reviews.length} 次复习  间隔 ${interval} 天  下次 ${due}`);
  const rest = dueList(db).length;
  if (rest > 0) console.log(`  还剩 ${rest} 道待复习`);
}

/* ── algo today ── */
function cmdToday() {
  const db = loadDB();
  const list = dueList(db);
  if (!list.length) return console.log("今天没有待复习的题目 🎉");
  const today = todayStr();
  const rows = list.map(([slug, p]) => {
    const due = effDue(p) ?? "";
    const overdue = daysBetween(due, today);
    const last = p.reviews?.at(-1);
    return `${overdue > 0 ? `逾期${overdue}天` : "今日"}  ${p.topic ?? "?"}/${slug}` +
      `${p.title ? `  ${p.title}` : ""}${last ? `  上次 ${last.rating}★` : "  未复习过"}`;
  });
  console.log(`今日待复习 (${rows.length}):\n${rows.join("\n")}`);
  console.log(`\n开始: algo open ｜ 复习完: algo done <slug> --rating <1-5>`);
}

/* ── algo stats ── */
function cmdStats() {
  const db = loadDB();
  const entries = Object.entries(db.problems);
  const totalReviews = entries.reduce((n, [, p]) => n + (p.reviews?.length ?? 0), 0);
  const byTopic: Record<string, number> = {};
  entries.forEach(([, p]) => { const t = p.topic ?? "?"; byTopic[t] = (byTopic[t] ?? 0) + 1; });
  // 连续复习天数（今天或昨天结尾）
  const days = new Set(entries.flatMap(([, p]) => (p.reviews ?? []).map(r => r.date)));
  let streak = 0;
  for (let d = todayStr(); days.has(d) || (streak === 0 && days.has(d = addDays(d, -1))); d = addDays(d, -1)) {
    if (!days.has(d)) break;
    streak++;
  }
  const due = dueList(db).length;
  const overdue = dueList(db).filter(([, p]) => (effDue(p) ?? "") < todayStr()).length;
  console.log(`总计 ${entries.length} 题 · 复习 ${totalReviews} 次 · 连续 ${streak} 天 · 待复习 ${due}${overdue ? `（逾期 ${overdue}）` : ""}`);
  const topics = Object.entries(byTopic).sort((a, b) => b[1] - a[1])
    .map(([t, n]) => `${TOPICS[t] ?? t} ${n}`).join(" · ");
  if (topics) console.log(`主题: ${topics}`);
}

/* ── 入口 ── */
function parseFlags(args: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i++)
    if (args[i].startsWith("--")) flags[args[i].slice(2)] = args[++i] ?? "";
  return flags;
}

const [cmd, ...rest] = process.argv.slice(2);
const flags = parseFlags(rest);
const arg = rest.find(a => !a.startsWith("--"));

if (cmd === "serve") serve();
else if (cmd === "open") await cmdOpen(arg);
else if (cmd === "new") await cmdNew(arg, flags);
else if (cmd === "list") await cmdList(flags);
else if (cmd === "done") cmdDone(arg, flags);
else if (cmd === "today") cmdToday();
else if (cmd === "stats") cmdStats();
else {
  console.log(`algo — LeetCode 题解 CLI

  algo new <slug> --topic <t> [--title T] [--number N]   从模板创建题目骨架
  algo open [slug]                                       打开题目（无参=最紧的待复习题；自动起服务）
  algo serve                                             本地服务，端口 ${PORT}
  algo list [--topic t]                                  按主题列出题目（●=待复习）
  algo today                                             今日待复习清单（逾期在前）
  algo done <slug> --rating <1-5>                        记录一次复习
  algo stats                                             总览：题数/复习/连续天数

主题: ${Object.keys(TOPICS).join(", ")}
数据: ${DB_PATH}`);
}
