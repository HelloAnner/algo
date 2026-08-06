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
  sort: "排序", interval: "区间", trie: "前缀树", matrix: "矩阵",
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
  stage?: number;      // 艾宾浩斯阶梯级数 0-6
  struggle?: boolean;  // 困难标记（评分≤2 打上，≥4 摘除）
  plan?: string;       // 新题学习计划日 YYYY-MM-DD（未评分前生效）
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
const effDue = (p: ProblemState) => p.reviews?.length
  ? (p.due ?? p.opened?.slice(0, 10) ?? p.updated?.slice(0, 10))
  : (p.plan ?? p.due ?? p.opened?.slice(0, 10) ?? p.updated?.slice(0, 10));

/* ── 新题排期：每天 NEW_PER_DAY 道，自动顺延 ── */
const NEW_PER_DAY = 2;
function assignPlans(db: DB) {
  const occ: Record<string, number> = {};
  const need: [string, ProblemState][] = [];
  for (const e of Object.entries(db.problems)) {
    if (e[1].reviews?.length) continue;
    if (e[1].plan) occ[e[1].plan!] = (occ[e[1].plan!] ?? 0) + 1;
    else need.push(e);   // Object.entries 保持插入序 = 官方题单顺序
  }
  if (!need.length) return;
  let d = todayStr();
  for (const [, p] of need) {
    while ((occ[d] ?? 0) >= NEW_PER_DAY) d = addDays(d, 1);
    p.plan = d;
    occ[d] = (occ[d] ?? 0) + 1;
  }
  saveDB(db);
}

/* ── 艾宾浩斯复习阶梯 ──
 * 阶梯间隔（天）：参照艾宾浩斯遗忘曲线复习点
 * 1★/2★ 打回第 0 级（明天复习，加大密度）并标 struggle
 * 3★ 原地重复当前级；4★ 升一级；5★ 跳一级
 */
const STAGES = [1, 2, 4, 7, 15, 30, 90];
function applyReview(db: DB, slug: string, rating: number) {
  const p = db.problems[slug] ?? {};
  let stage = p.stage ?? 0;
  if (rating <= 2) stage = 0;
  else if (rating >= 4) stage = Math.min(stage + (rating === 5 ? 2 : 1), STAGES.length - 1);
  // rating === 3: stage 不变
  const interval = STAGES[stage];
  const due = addDays(todayStr(), interval);
  const reviews = [...(p.reviews ?? []), { date: todayStr(), rating }];
  db.problems[slug] = {
    ...p, stage, interval, due, reviews,
    struggle: rating <= 2 ? true : rating >= 4 ? false : (p.struggle ?? false),
    updated: new Date().toISOString(),
  };
  saveDB(db);
  return { stage, interval, due, count: reviews.length, struggle: db.problems[slug].struggle };
}

/** 待复习清单（逾期在前，按 due 升序） */
function dueList(db: DB): [string, ProblemState][] {
  const today = todayStr();
  return Object.entries(db.problems)
    .filter(([, p]) => { const d = effDue(p); return d && d <= today; })
    .sort(([ , a], [, b]) => (effDue(a) ?? "").localeCompare(effDue(b) ?? ""));
}

/* ── 页面结构校验：骨架/编辑区/评分组件/左右分栏缺一不可 ── */
function validateHtml(html: string, slug: string): string[] {
  const errs: string[] = [];
  const has = (s: string) => html.includes(s);
  if ((html.match(/<main\b/g) ?? []).length !== 1 || (html.match(/<\/main>/g) ?? []).length !== 1)
    errs.push("<main> 标签不配对");
  if ((html.match(/<aside\b/g) ?? []).length !== 1 || (html.match(/<\/aside>/g) ?? []).length !== 1)
    errs.push("<aside> 标签不配对");
  if (has("</main>") && has("<aside") && html.indexOf("<aside") < html.indexOf("</main>"))
    errs.push("<aside> 必须在 </main> 之后（否则编辑区被吞进左栏）");
  for (const id of ["ed-tabs", "ed-ta", "ed-hl", "notes-ta", "stars", "mastery-info", "content"])
    if (!has(`id="${id}"`)) errs.push(`缺 #${id}`);
  if (!has(`slug: '${slug}'`)) errs.push(`PROBLEM.slug 与目录名不一致`);
  if (/\{\{[A-Z_]+\}\}/.test(html)) errs.push("存在未替换的 {{模板占位符}}");
  for (const fn of ["renderMastery", "switchVersion", "scheduleSave"])
    if (!has(fn)) errs.push(`缺基础设施函数 ${fn}`);
  return errs;
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
      if (url.pathname === "/api/review" && req.method === "POST") {
        const slug = url.searchParams.get("slug") ?? "";
        const rating = Number(url.searchParams.get("rating"));
        if (!slug || !(rating >= 1 && rating <= 5)) {
          return Response.json({ error: "need slug & rating 1-5" }, { status: 400 });
        }
        return Response.json(applyReview(loadDB(), slug, rating));
      }
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

/** 老数据没有 topic 字段 → 从文件系统路径回填 */
async function backfill(db: DB) {
  let dirty = false;
  for (const [slug, p] of Object.entries(db.problems)) {
    if (p.topic) continue;
    const rel = await findProblem(slug);
    if (rel) { p.topic = rel.split("/")[1]; dirty = true; }
  }
  if (dirty) saveDB(db);
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

      <section>
        <h2><span class="secno">02</span>白板图解</h2>
        <!-- TODO: 一张手绘白板图说清算法全貌，组件与规则见 template/viz/whiteboard.html -->
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

  const errs = validateHtml(html, slug);   // 先校验，不合格不落地
  if (errs.length) die(`模板生成页面未通过结构校验:\n  ` + errs.join("\n  "));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);

  const db = loadDB();
  db.problems[slug] = {
    ...db.problems[slug], topic, title,
    created: todayStr(), interval: 0, reviews: [],
  };
  assignPlans(db);   // 排进新题计划（每天 2 道顺延）
  saveDB(db);
  console.log(`✓ ${join("leetcode", topic, slug, "index.html")}`);
  console.log(`  下一步: 在 pi 里让它讲解这道题，或 algo open ${slug}`);
}

/* ── algo open [slug]（无参 = 最紧的待复习题，其次今日新学） ── */
async function cmdOpen(slug?: string) {
  const db = loadDB();
  assignPlans(db);
  if (!slug) {
    const list = dueList(db);
    const first = list.find(([, p]) => p.reviews?.length) ?? list[0];
    if (!first) die("没有待复习/待学的题目。algo new 创建一道？");
    slug = first[0];
    console.log(`自动选择: ${slug}`);
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
    const skel = readFileSync(join(ROOT, f), "utf8").includes("TODO 一句话题眼") ? "（骨架）" : "";
    const line = `  ${mark} ${slug}${p?.title ? `  ${p.title}` : ""}${skel}${due ? `  (${due})` : ""}`;
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
async function cmdDone(slug?: string, flags?: Record<string, string>) {
  if (!slug) die("用法: algo done <slug> --rating <1-5>");
  const rating = Number(flags?.rating);
  if (!rating || rating < 1 || rating > 5) die("--rating 必须是 1-5（5=秒答，1=完全不会）");
  const db = loadDB();
  await backfill(db);
  const r = applyReview(db, slug, rating);
  console.log(`✓ ${slug}  ${rating}★  第 ${r.count} 次复习  阶梯 ${r.stage + 1}/${STAGES.length}  ${r.interval} 天后（${r.due}）${r.struggle ? "  ⚠ 已标困难，提高复习密度" : ""}`);
  const rest = dueList(db).length;
  if (rest > 0) console.log(`  还剩 ${rest} 道待复习/待学`);
}

/* ── algo today（复习 / 今日新学 分区，新题每天 2 道顺延） ── */
function cmdToday() {
  const db = loadDB();
  assignPlans(db);
  const list = dueList(db);
  if (!list.length) return console.log("今天没有待学/待复习的题目 🎉");
  const today = todayStr();
  const fresh: string[] = [], review: string[] = [];
  for (const [slug, p] of list) {
    const head = `${p.topic ?? "?"}/${slug}${p.title ? `  ${p.title}` : ""}`;
    if (!p.reviews?.length) {
      const plan = p.plan ?? today;
      fresh.push(`${plan < today ? `逾期${daysBetween(plan, today)}天` : "今日"}  ${head}`);
    } else {
      const due = effDue(p) ?? "";
      const overdue = daysBetween(due, today);
      const last = p.reviews.at(-1)!;
      review.push(`${overdue > 0 ? `逾期${overdue}天` : "今日"}  ${head}  上次 ${last.rating}★  阶梯 ${(p.stage ?? 0) + 1}${p.struggle ? "  ⚠困难" : ""}`);
    }
  }
  if (review.length) console.log(`══ 复习 (${review.length}) ══\n${review.join("\n")}`);
  if (fresh.length) console.log(`══ 今日新学 (${fresh.length}) ══\n${fresh.join("\n")}`);
  else console.log("══ 今日新学 ══\n无（按计划今天没有新题）");
  const totalFresh = Object.values(db.problems).filter(p => !p.reviews?.length).length;
  if (totalFresh > 0 && totalFresh < NEW_PER_DAY)
    console.log(`\n⚠ 题库只剩 ${totalFresh} 道新题，不够明天学了——该补题了（algo new 或让我再搜一批）`);
  if (totalFresh === 0) console.log("\n⚠ 题库新题已清零！快去找新题（algo new / 让我再搜一批）");
  console.log(`\n开始: algo open ｜ 结束后: algo done <slug> --rating <1-5>（或在页面底部点星）`);
}

/* ── algo check [slug]：全库结构体检 ── */
async function cmdCheck(slug?: string) {
  const glob = new Bun.Glob(slug ? `leetcode/**/${slug}/index.html` : "leetcode/*/*/index.html");
  let total = 0, bad = 0;
  for await (const f of glob.scan({ cwd: ROOT })) {
    total++;
    const s = f.split("/");
    const errs = validateHtml(readFileSync(join(ROOT, f), "utf8"), s[2]);
    if (errs.length) { bad++; console.log(`✗ ${s[1]}/${s[2]}\n  ${errs.join("\n  ")}`); }
  }
  console.log(bad ? `${bad}/${total} 个页面有问题` : `✓ 全部通过 (${total} 页)`);
}

/* ── algo stats ── */
async function cmdStats() {
  const db = loadDB();
  await backfill(db);
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
  const struggles = entries.filter(([, p]) => p.struggle).length;
  const lastRatings = entries.map(([, p]) => p.reviews?.at(-1)?.rating).filter((r): r is number => !!r);
  const avg = lastRatings.length ? (lastRatings.reduce((a, b) => a + b, 0) / lastRatings.length).toFixed(1) : "-";
  console.log(`总计 ${entries.length} 题 · 复习 ${totalReviews} 次 · 连续 ${streak} 天 · 待学/复习 ${due}${overdue ? `（逾期 ${overdue}）` : ""}`);
  console.log(`掌握: 平均 ${avg}★ · 困难题 ${struggles} 道 · 未学新题 ${entries.filter(([, p]) => !p.reviews?.length).length} 道`);
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
else if (cmd === "done") await cmdDone(arg, flags);
else if (cmd === "check") await cmdCheck(arg);
else if (cmd === "today") cmdToday();
else if (cmd === "stats") await cmdStats();
else {
  console.log(`algo — LeetCode 题解 CLI

  algo new <slug> --topic <t> [--title T] [--number N]   从模板创建题目骨架
  algo open [slug]                                       打开题目（无参=最紧的待复习题；自动起服务）
  algo serve                                             本地服务，端口 ${PORT}
  algo list [--topic t]                                  按主题列出题目（●=待复习）
  algo today                                             今日任务：复习区 + 新学区（每天 2 道新题自动顺延）
  algo done <slug> --rating <1-5>                        记录一次复习
  algo stats                                             总览：题数/复习/连续天数
  algo check [slug]                                      页面结构体检（不带参数=全库）

主题: ${Object.keys(TOPICS).join(", ")}
数据: ${DB_PATH}`);
}
