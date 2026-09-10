import pkg from "../package.json";
import { c, hint, isDir, isFile, versionOf, which } from "./util";
import { microStatus, microVersion } from "./micro";
import { rcFile, shellIntegrationInstalled } from "./shell";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

let pass = 0;
let failCount = 0;
let warnCount = 0;

function check(label: string, detail: string, level: "ok" | "warn" | "fail" = "ok"): void {
  const mark = level === "ok" ? c.green("✓") : level === "warn" ? c.yellow("!") : c.red("✗");
  if (level === "ok") pass++;
  else if (level === "warn") warnCount++;
  else failCount++;
  console.log(`${mark} ${label}${detail ? "  " + c.gray(detail) : ""}`);
}

export function doctor(): void {
  console.log(c.bold("必要依赖"));

  const bun = which("bun");
  check("bun", bun ? versionOf("bun", ["--version"]) ?? bun : "未安装 → curl -fsSL https://bun.sh/install | bash", bun ? "ok" : "fail");

  const micro = which("micro");
  const mv = microVersion();
  check("micro", micro ? `${mv ?? ""}  ${micro}`.trim() : "未安装 → brew install micro", micro ? "ok" : "fail");

  const cxx = which("clang++") ?? which("g++");
  if (cxx) {
    const v = versionOf(cxx, ["--version"]) ?? "";
    check("c++ 编译器", `${cxx.split("/").pop()}  ${v.slice(0, 40)}`);
  } else {
    check("c++ 编译器", "没有 clang++ / g++ → 装 Xcode Command Line Tools", "fail");
  }

  const make = which("make");
  check("make", make ?? "未找到", make ? "ok" : "fail");

  // bits/stdc++.h：GCC 专有头，本机 clang 靠 algo 装的兼容头
  const shim = join(homedir(), ".local", "include", "bits", "stdc++.h");
  if (existsSync(shim)) check("bits/stdc++.h", `可用（兼容头 ${shim}）`);
  else if (detectBits()) check("bits/stdc++.h", "可用（本机装了 GCC）");
  else check("bits/stdc++.h", "不可用 → make -C cli install 会装一份兼容头", "warn");

  console.log();
  console.log(c.bold("CLI 自身"));
  const algoPath = which("algo");
  const selfVersion = algoPath ? versionOf("algo", ["version"]) : null;
  if (!algoPath) {
    check("PATH 上的 algo", "没找到 → make install（装到 ~/.local/bin）", "warn");
  } else if (selfVersion === `algo ${pkg.version}`) {
    check("PATH 上的 algo", algoPath);
  } else {
    // PATH 上可能有同名的别的工具抢在前面，那样题目 Makefile 里的 `algo run .` 会调到它
    check(
      "PATH 上的 algo",
      `${algoPath} 不是本仓库装的（它自称「${selfVersion ?? "?"}」）→ 把 ~/.local/bin 放到 PATH 前面`,
      "warn",
    );
  }

  console.log();
  console.log(c.bold("micro 刷题配置"));
  const st = microStatus();
  check("配置目录", st.configDir);
  check("settings.json", st.settingsExists ? st.settingsPath : "不存在 → algo setup", st.settingsExists ? "ok" : "warn");
  check("linter = false", st.linterOff ? "已关闭（无下划线报错）" : "仍是开启 → algo setup", st.linterOff ? "ok" : "warn");
  check("autoclose", st.autocloseOn ? "已开启（括号/引号自动补全）" : "被关闭了", st.autocloseOn ? "ok" : "warn");
  check("syntax", st.syntaxOn ? "语法高亮开启" : "语法高亮关闭", st.syntaxOn ? "ok" : "warn");
  const bindingsOk = st.bindingsExists && st.bindingsApplied === st.bindingsTotal;
  check(
    "bindings.json",
    st.bindingsExists
      ? `已写入 ${st.bindingsApplied}/${st.bindingsTotal} 项刷题快捷键`
      : "不存在 → algo setup",
    bindingsOk ? "ok" : "warn",
  );
  check(
    "init.lua",
    st.initLuaExists
      ? "已安装（Alt-r 跑样例 · Alt-t 对拍 · Alt-i/Alt-o 开样例）"
      : "未安装 → algo setup --init",
    st.initLuaExists ? "ok" : "warn",
  );

  console.log();
  console.log(c.bold("shell 集成"));
  const rc = rcFile();
  const installed = shellIntegrationInstalled();
  check(
    "建完题自动 cd",
    installed ? `已写入 ${rc?.path}` : "未安装 → algo setup --shell",
    installed ? "ok" : "warn",
  );
  const loaded = process.env.ALGO_SHELL_INTEGRATION === "1";
  if (installed) {
    check(
      "当前终端已加载",
      loaded ? "是" : "否 → 新开一个终端，或执行 source " + (rc?.path ?? "你的 rc 文件"),
      loaded ? "ok" : "warn",
    );
  }

  console.log();
  console.log(c.bold("可选依赖（micro 插件用）"));
  for (const [bin, why] of [
    ["fzf", "fzfinder / recentfiles 模糊查找"],
    ["bat", "fzfinder 预览"],
    ["fd", "模糊查找加速"],
    ["rg", "内容检索"],
  ] as const) {
    const p = which(bin);
    check(bin, p ? "ok" : `未安装（${why}）`, p ? "ok" : "warn");
  }

  console.log();
  const tail = failCount > 0 ? c.red(`${failCount} 项缺失`) : warnCount > 0 ? c.yellow(`${warnCount} 项提醒`) : c.green("全部就绪");
  console.log(`${c.bold("结果")}  ${c.green(`${pass} ✓`)}  ${tail}`);
  if (failCount > 0) hint("缺的装完再跑一次 algo doctor");
}

function detectBits(): boolean {
  for (const p of [
    "/opt/homebrew/include/c++",
    "/usr/local/include/c++",
    "/Library/Developer/CommandLineTools/usr/include/c++/v1/bits/stdc++.h",
    "/opt/homebrew/Cellar/gcc",
  ]) {
    if (existsSync(join(p, "bits", "stdc++.h")) || (isDir(p) && p.includes("gcc"))) return true;
  }
  return false;
}
