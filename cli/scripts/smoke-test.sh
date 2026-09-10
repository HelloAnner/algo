#!/bin/sh
# algo 冒烟测试：建题 → 编译/运行 → 对拍 → 清理校验 → add（json/局部更新）→ 白板 → 列表进度
# 用法：sh scripts/smoke-test.sh [dist/algo.js 路径]
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${1:-$ROOT/dist/algo.js}"
BUN="$(command -v bun || echo bun)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

fail() {
    echo "✗ $1"
    exit 1
}

# 校验白板是合法的 Excalidraw 场景
cat > check-board.ts <<'EOF'
const text = await Bun.file(process.argv[2]).text();
const scene = JSON.parse(text);
if (scene.type !== "excalidraw") throw new Error("type 不是 excalidraw");
if (!Array.isArray(scene.elements) || scene.elements.length !== 0) throw new Error("白板默认应该是空的");
if (scene.appState === undefined || scene.files === undefined) throw new Error("缺少 appState / files");
EOF

echo "→ algo two-sum"
"$BUN" "$CLI" two-sum > /dev/null
for f in solution.cpp problem.txt solution.txt whiteboard.excalidraw in.txt out.txt Makefile .gitignore; do
    [ -e "two-sum/$f" ] || fail "缺少 two-sum/$f"
done
grep -q "algo:todo" two-sum/problem.txt || fail "problem.txt 应带未填写的模板标记"
grep -q "algo:todo" two-sum/solution.txt || fail "solution.txt 应带未填写的模板标记"
grep -q "TODO: 读入" two-sum/solution.cpp || fail "solution.cpp 应该是空模板（带 TODO）"
if ls two-sum/*.md > /dev/null 2>&1; then fail "题目目录里不该再有 Markdown 文件"; fi
"$BUN" check-board.ts two-sum/whiteboard.excalidraw || fail "白板不是合法的 Excalidraw 场景"
echo "  ✓ 8 个文件齐了（无 Markdown），白板可解析"

printf '4 9\n2 7 11 15\n' > two-sum/in.txt
printf '0 1\n' > two-sum/out.txt
cat > two-sum/solution.cpp <<'EOF'
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, target;
    cin >> n >> target;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    unordered_map<int, int> pos;
    for (int i = 0; i < n; ++i) {
        if (auto it = pos.find(target - a[i]); it != pos.end()) {
            cout << it->second << " " << i << "\n";
            return 0;
        }
        pos[a[i]] = i;
    }
    return 0;
}
EOF

# make run / make check 里的 algo 指向被测的这份 bundle
mkdir -p fakebin
printf '#!/bin/sh\nexec "%s" "%s" "$@"\n' "$BUN" "$CLI" > fakebin/algo
chmod +x fakebin/algo
FAKEBIN="$PWD/fakebin"

echo "→ make run：编译 + 跑 in.txt，对了只打印一行 AC"
RUN_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" make run ALGO="$BUN $CLI" 2>&1 || true)"
[ "$RUN_OUT" = "AC" ] || fail "make run 应该只输出 AC，实际：[$RUN_OUT]"
# 单独查一次：run 成功时走的是 process.exit，曾经因此漏删 .algo_bin
[ -e "two-sum/.algo_bin" ] && fail "make run 之后残留了 .algo_bin"

echo "→ make check：静默即通过"
CHK_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" make check ALGO="$BUN $CLI" 2>&1 || true)"
if [ -n "$CHK_OUT" ]; then
    fail "make check 没问题时不该有任何输出，实际：[$CHK_OUT]"
fi
echo "  ✓ run 只打印 AC，check 静默"

echo "→ 万能头：solution.cpp 只写一行 #include <bits/stdc++.h> 也能过"
if [ -e "$HOME/.local/include/bits/stdc++.h" ]; then
    cat > two-sum/solution.cpp <<'EOF'
#include <bits/stdc++.h>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, target;
    cin >> n >> target;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    unordered_map<int, int> pos;
    for (int i = 0; i < n; ++i) {
        if (auto it = pos.find(target - a[i]); it != pos.end()) {
            cout << it->second << " " << i << '\n';
            return 0;
        }
        pos[a[i]] = i;
    }
    return 0;
}
EOF
    printf '4 9\n2 7 11 15\n' > two-sum/in.txt
    printf '0 1\n' > two-sum/out.txt
    BITS_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" "$BUN" "$CLI" check 2>&1 || true)"
    if [ -n "$BITS_OUT" ]; then fail "万能头写法没通过 check：[$BITS_OUT]"; fi
    BITS_RUN="$(cd two-sum && PATH="$FAKEBIN:$PATH" make run ALGO="$BUN $CLI" 2>&1 || true)"
    [ "$BITS_RUN" = "AC" ] || fail "万能头写法 make run 应该是 AC，实际：[$BITS_RUN]"
    echo "  ✓ 一行 #include <bits/stdc++.h> 可用"
else
    echo "  - 跳过（本机还没装兼容头：make -C cli install）"
fi

echo "→ 清理校验：run / check 跑完不留任何产物"
for f in solution solution_dbg .algo_bin .out.actual .out.diff; do
    if [ -e "two-sum/$f" ]; then
        fail "run / check 之后残留了 two-sum/$f"
    fi
done
echo "  ✓ 无残留"

echo "→ make c（algo check）不跑样例：输出错的程序只报编译/检查，不报 WA"
cat > two-sum/solution.cpp <<'EOF'
#include <iostream>
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::cout << "definitely wrong\n";
}
EOF
CHK_ONLY="$(cd two-sum && PATH="$FAKEBIN:$PATH" "$BUN" "$CLI" check 2>&1 || true)"
if [ -n "$CHK_ONLY" ]; then
    fail "check 不该跑样例，却输出了：[$CHK_ONLY]"
fi
RUN_ONLY="$(cd two-sum && PATH="$FAKEBIN:$PATH" "$BUN" "$CLI" run 2>&1 || true)"
printf '%s' "$RUN_ONLY" | grep -q "WA" || fail "run 应该报 WA，实际：[$RUN_ONLY]"
echo "  ✓ check 只编译检查，run 才跑样例"

echo "→ 写法检查：endl 会被 check 抓出来"
cat > two-sum/solution.cpp <<'EOF'
#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, target;
    cin >> n >> target;
    vector<int> a(n);
    for (auto &x : a) cin >> x;
    long long s = 0;
    for (int v : a) s += v;
    cout << s << endl;   // 故意用 endl
}
EOF
ENDL_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" "$BUN" "$CLI" check 2>&1 || true)"
printf "%s" "$ENDL_OUT" | grep -q "endl" || fail "check 没有抓出 endl"
echo "  ✓ 抓出 endl"

echo "→ 编译不通过：要有清楚的报错，且不留文件"
printf 'int main(){ 这不是合法的 C++ }\n' > two-sum/solution.cpp
if (cd two-sum && PATH="$FAKEBIN:$PATH" "$BUN" "$CLI" check) > check-fail.log 2>&1; then
    fail "编译不通过时 check 应该以非 0 退出"
fi
grep -q "编译不通过" check-fail.log || fail "check 没说清是编译不通过"
[ -e "two-sum/.algo_bin" ] && fail "编译失败后残留了 .algo_bin"
echo "  ✓ 编译失败有报错且无残留"

echo "→ make build / make clean（这两条仍由 Makefile 自己编译）"
# 上一节故意写坏了代码，这里换回一份能编译的
cat > two-sum/solution.cpp <<'EOF'
#include <iostream>
int main() { std::cout << "hi\n"; }
EOF
(cd two-sum && PATH="$FAKEBIN:$PATH" make build > /dev/null)
[ -e two-sum/solution ] || fail "make build 没有产出二进制"
(cd two-sum && PATH="$FAKEBIN:$PATH" make clean > /dev/null)
[ -e "two-sum/solution" ] && fail "make clean 没有删掉二进制"
echo "  ✓ build 保留、clean 清理"

echo "→ add 只补题面（不碰 solution.txt、不动 solution.cpp）"
printf '[题目描述]\n\n两数之和。\n' > only-problem.txt
CPP_BEFORE="$(cksum two-sum/solution.cpp)"
"$BUN" "$CLI" add two-sum --problem-file only-problem.txt > /dev/null
grep -q "两数之和" two-sum/problem.txt || fail "problem.txt 没更新"
grep -q "algo:todo" two-sum/solution.txt || fail "未指定的 solution.txt 不该被改动"
[ "$(cksum two-sum/solution.cpp)" = "$CPP_BEFORE" ] || fail "algo add 不该动 solution.cpp"
echo "  ✓ 只更新目标文件"

echo "→ algo add --json（AI 用法：一次带上题面与解法）"
cat > spec.json <<'EOF'
{
  "name": "three-sum",
  "title": "三数之和",
  "link": "https://leetcode.cn/problems/3sum/",
  "difficulty": "中等",
  "problem": "[题目描述]\n\n给你一个整数数组 nums。\n",
  "solution": "[思路]\n\n排序 + 双指针夹逼。\n\n[C++ 代码]\n// 参考实现\n",
  "in": "6\n-1 0 1 2 -1 -4\n",
  "out": "[[-1,-1,2],[-1,0,1]]\n"
}
EOF
"$BUN" "$CLI" add --json spec.json > /dev/null
grep -q "^题目：三数之和$" three-sum/problem.txt || fail "problem.txt 头部没写进标题"
grep -q "^难度：中等$" three-sum/problem.txt || fail "problem.txt 头部没写进难度"
grep -q "题目描述" three-sum/problem.txt || fail "problem.txt 没写进题面"
grep -q "双指针" three-sum/solution.txt || fail "solution.txt 没写进解法"
grep -q "algo:todo" three-sum/problem.txt && fail "写过的 problem.txt 不该还有模板标记"
grep -q "^-1 0 1 2 -1 -4$" three-sum/in.txt || fail "in.txt 没写对"
grep -qF "[[-1,-1,2],[-1,0,1]]" three-sum/out.txt || fail "out.txt 没写对"
echo "  ✓ 内容落盘（含 in.txt / out.txt）"

echo "→ add 二次更新只动指定的 txt"
printf '[补充]\n\n后补的题面。\n' > later.txt
"$BUN" "$CLI" add three-sum --problem-file later.txt > /dev/null
grep -q "后补的题面" three-sum/problem.txt || fail "更新 problem.txt 失败"
grep -q "排序 + 双指针夹逼" three-sum/solution.txt || fail "未指定的 solution.txt 被改动了"

echo "→ add 只给元信息：改 problem.txt 头部那三行"
"$BUN" "$CLI" add three-sum --difficulty 困难 > /dev/null
grep -q "^难度：困难$" three-sum/problem.txt || fail "元信息没写回 problem.txt 头部"
grep -q "后补的题面" three-sum/problem.txt || fail "改元信息把题面冲掉了"
"$BUN" "$CLI" add three-sum --difficulty 中等 > /dev/null
echo "  ✓ 只更新目标文件"

echo "→ 标题里有引号也不该出问题"
"$BUN" "$CLI" add quote-test --title 'a "b" c' > /dev/null
grep -q 'a "b" c' quote-test/problem.txt || fail "problem.txt 头部的标题没写对"
"$BUN" check-board.ts quote-test/whiteboard.excalidraw || fail "白板不是合法 JSON"
"$BUN" "$CLI" list > /dev/null || fail "list 在特殊标题下报错"
echo "  ✓ 特殊字符正常"

echo "→ algo list 进度标记"
"$BUN" "$CLI" list | grep -q "three-sum" || fail "list 没有输出 three-sum"
"$BUN" "$CLI" list | grep -q "题面✓解法✓板—" || fail "list 没有显示已填写状态"
"$BUN" "$CLI" list | grep -q "题面✓解法—板—" || fail "list 没有显示只填了题面的状态"
echo "  ✓ 进度标记正常"

echo "→ algo add 只更新 in.txt"
"$BUN" "$CLI" add three-sum --in "9 9" > /dev/null
grep -q "^9 9$" three-sum/in.txt || fail "in.txt 没更新"
grep -qF "[[-1,-1,2],[-1,0,1]]" three-sum/out.txt || fail "未指定的 out.txt 被改动了"
echo "  ✓ 只更新目标文件"

echo "→ make e / p / s / w / r / c / help（用假 micro、假 open，不启动真编辑器）"
mkdir -p fakebin
printf '#!/bin/sh\necho "MOCK-MICRO $*"\n' > fakebin/micro
printf '#!/bin/sh\necho "MOCK-OPEN $*"\n' > fakebin/open
chmod +x fakebin/micro fakebin/open
PATH="$PWD/fakebin:$PATH" make -C two-sum e | grep "MOCK-MICRO solution.cpp" > /dev/null || fail "make e 没交给 micro"
PATH="$PWD/fakebin:$PATH" make -C two-sum p | grep "MOCK-MICRO problem.txt" > /dev/null || fail "make p 没打开题面"
PATH="$PWD/fakebin:$PATH" make -C two-sum s | grep "MOCK-MICRO solution.txt" > /dev/null || fail "make s 没打开解法"
PATH="$PWD/fakebin:$PATH" make -C two-sum w | grep "MOCK-OPEN whiteboard.excalidraw" > /dev/null || fail "make w 没走系统打开"
make -C two-sum help > make-help.txt || fail "make help 跑失败"
for t in e p s w r c; do
    grep -q "make $t " make-help.txt || fail "make help 没列出 make $t"
done

# make r / make c 就是 run / check 的短写法：先换一份能通过的代码
cat > two-sum/solution.cpp <<'EOF'
#include <iostream>
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::cout << "hi\n";
}
EOF
printf 'hi\n' > two-sum/out.txt
R_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" make r ALGO="$BUN $CLI" 2>&1 || true)"
[ "$R_OUT" = "AC" ] || fail "make r 应该等价于 make run（只输出 AC），实际：[$R_OUT]"
C_OUT="$(cd two-sum && PATH="$FAKEBIN:$PATH" make c ALGO="$BUN $CLI" 2>&1 || true)"
if [ -n "$C_OUT" ]; then
    fail "make c 应该等价于 make check（静默），实际：[$C_OUT]"
fi
echo "  ✓ make e / p / s / w / r / c / help 正常"

echo "→ algo remake：模板升级后重刷老题目目录的 Makefile"
sed 's/problem\.txt/problem.md/' two-sum/Makefile > remake-mk && mv remake-mk two-sum/Makefile
grep -q "problem.md" two-sum/Makefile || fail "没造出「老 Makefile」"
"$BUN" "$CLI" remake two-sum > /dev/null
grep -q "PROBLEM  := problem.txt" two-sum/Makefile || fail "remake 没把 PROBLEM 刷成 problem.txt"
grep -q "SOLUTION := solution.txt" two-sum/Makefile || fail "remake 没把 SOLUTION 刷成 solution.txt"
if grep -q "\.md" two-sum/Makefile; then fail "remake 之后 Makefile 里还有 .md"; fi
echo "  ✓ remake 正常"

echo "→ path / in / out / board（用假 micro、假 open，不启动真编辑器）"
"$BUN" "$CLI" path three-sum in | grep -q "three-sum/in.txt$" || fail "path 解析 in.txt 失败"
"$BUN" "$CLI" path three-sum | grep -q "three-sum$" || fail "path 解析目录失败"
"$BUN" "$CLI" path three-sum solution | grep -q "solution.txt$" || fail "solution 应解析到 solution.txt（答案）"
"$BUN" "$CLI" path three-sum code | grep -q "solution.cpp$" || fail "code 应解析到 solution.cpp"
"$BUN" "$CLI" path three-sum problem | grep -q "problem.txt$" || fail "problem 应解析到 problem.txt"
mkdir -p fakebin
printf '#!/bin/sh\necho "MOCK-MICRO $1"\n' > fakebin/micro
printf '#!/bin/sh\necho "MOCK-OPEN $1"\n' > fakebin/open
chmod +x fakebin/micro fakebin/open
PATH="$PWD/fakebin:$PATH" "$BUN" "$CLI" in three-sum | grep -q "MOCK-MICRO in.txt" || fail "algo in 没把 in.txt 交给 micro"
PATH="$PWD/fakebin:$PATH" "$BUN" "$CLI" out three-sum | grep -q "MOCK-MICRO out.txt" || fail "algo out 没把 out.txt 交给 micro"
PATH="$PWD/fakebin:$PATH" "$BUN" "$CLI" edit three-sum problem | grep -q "MOCK-MICRO problem.txt" || fail "edit problem 没交给 micro"
PATH="$PWD/fakebin:$PATH" "$BUN" "$CLI" edit three-sum solution | grep -q "MOCK-MICRO solution.txt" || fail "edit solution 没交给 micro"
PATH="$PWD/fakebin:$PATH" "$BUN" "$CLI" board three-sum | grep -q "MOCK-OPEN .*whiteboard.excalidraw" || fail "algo board 没走系统打开"
echo "  ✓ 路径与打开都正常"

echo "→ 静默建题 + --verbose + --print-dir"
SILENT="$("$BUN" "$CLI" new silent-test 2>&1)"
if [ -n "$SILENT" ]; then
    fail "algo new 应该完全静默，却输出了：$SILENT"
fi
[ -e silent-test/Makefile ] || fail "静默模式下没有建出目录"

VERBOSE="$("$BUN" "$CLI" new verbose-test --verbose 2>&1)"
printf '%s' "$VERBOSE" | grep -q "已创建题目" || fail "--verbose 没有打印文件清单"

PD="$("$BUN" "$CLI" new print-dir-test --print-dir 2>/dev/null)"
case "$PD" in */print-dir-test) ;; *) fail "--print-dir 没在 stdout 给出路径（得到：$PD）" ;; esac

PD_ERR="$("$BUN" "$CLI" new print-dir-test2 --print-dir 2>&1 >/dev/null)"
if [ -n "$PD_ERR" ]; then
    fail "--print-dir 模式下 stderr 也应该是空的，却得到：$PD_ERR"
fi

case "$("$BUN" "$CLI" add print-dir-test --in "1" --print-dir 2>/dev/null)" in
    "") ;;
    *) fail "只更新已有目录时不该输出路径" ;;
esac
echo "  ✓ 静默 / --verbose / --print-dir 行为正确"

echo "→ setup --shell（写进临时 HOME）"
mkdir -p fakehome
HOME="$PWD/fakehome" SHELL=/bin/zsh "$BUN" "$CLI" setup --shell | grep "已写入" > /dev/null || fail "setup --shell 没写入"
grep -q "algo shell integration" fakehome/.zshrc || fail ".zshrc 里没有集成块"
HOME="$PWD/fakehome" SHELL=/bin/zsh "$BUN" "$CLI" setup --shell | grep "已是最新" > /dev/null || fail "重复安装不幂等"

# 用真的 zsh 验证：algo 建完题目会自动 cd 进去
printf '#!/bin/sh\nexec "%s" "%s" "$@"\n' "$BUN" "$CLI" > fakebin/algo
chmod +x fakebin/algo
ZSH_PWD="$(HOME="$PWD/fakehome" SHELL=/bin/zsh PATH="$PWD/fakebin:$PATH" zsh -c 'source "$HOME/.zshrc"; cd "$HOME"; algo zsh-cd-test >/dev/null 2>&1; pwd')"
case "$ZSH_PWD" in
    */zsh-cd-test) echo "  ✓ 建完题目自动 cd 生效" ;;
    *) fail "shell 函数没有自动 cd（得到：$ZSH_PWD）" ;;
esac
[ -e fakehome/zsh-cd-test/Makefile ] || fail "自动 cd 的目录里没有 Makefile"

echo "→ micro profile（含静默 autosave；bindings 只 merge 不覆盖）"
rm -rf fakecfg
mkdir -p fakecfg
printf '{\n    "Ctrl-G": "command:my-own-thing"\n}\n' > fakecfg/bindings.json
MICRO_CONFIG_DIR="$PWD/fakecfg" "$BUN" "$CLI" setup > /dev/null
grep -q '"autosave": 2' fakecfg/settings.json || fail "profile 里没有 autosave=2"
grep -q '"linter": false' fakecfg/settings.json || fail "profile 里没有 linter=false"
grep -q '"autoclose": true' fakecfg/settings.json || fail "profile 里没有 autoclose=true"
grep -q '"Ctrl-P": "CommandMode"' fakecfg/bindings.json || fail "bindings.json 里没有 Ctrl-P 命令模式"
grep -q '"Alt-n": "command-edit:open "' fakecfg/bindings.json || fail "bindings.json 里没有 Alt-n 新建文件"
grep -q '"Ctrl-G"' fakecfg/bindings.json || fail "setup 把用户自己的绑定冲掉了"
MICRO_CONFIG_DIR="$PWD/fakecfg" "$BUN" "$CLI" setup | grep -q "已是最新" || fail "micro 配置重复安装不幂等"
echo "  ✓ profile 内容正确，且保留用户自定义绑定"

echo "→ algo setup --dry-run（只读，不写配置）"
rm -rf drycfg
mkdir -p drycfg
MICRO_CONFIG_DIR="$PWD/drycfg" "$BUN" "$CLI" setup --dry-run > /dev/null
[ -e drycfg/settings.json ] && fail "--dry-run 不该写 settings.json"
[ -e drycfg/bindings.json ] && fail "--dry-run 不该写 bindings.json"
echo "  ✓ dry-run 只打印不落盘"

echo "✓ 冒烟测试全部通过"
