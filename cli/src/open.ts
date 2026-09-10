import type { Target } from "./targets";
import { hint, info, run as exec, warn, which } from "./util";

/** 用 micro 打开目标文件；白板这类用系统默认程序打开 */
export function openTarget(dir: string, t: Target): never {
  if (t.system) return openSystem(t.path);

  const micro = which("micro");
  if (!micro) {
    warn("没找到 micro 编辑器，跳过打开");
    hint(`文件：${t.path}`);
    process.exit(0);
  }
  process.exit(exec("micro", [t.name], dir));
}

function openSystem(path: string): never {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? null : "xdg-open";
  if (!opener || !which(opener)) {
    info("没有可用的默认打开方式，路径给你：");
    hint(path);
    hint("VS Code 装了 Excalidraw 插件的话，直接点开这个文件即可");
    process.exit(0);
  }
  process.exit(exec(opener, [path], process.cwd()));
}
