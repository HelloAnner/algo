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
if (!Array.isArray(scene.elements) || scene.elements.length !== 2) throw new Error("elements 数量不对");
if (!String(scene.elements[0].text).includes("Two Sum")) throw new Error("缺少标题: " + scene.elements[0].text);
if (scene.appState === undefined || scene.files === undefined) throw new Error("缺少 appState / files");
EOF

echo "→ algo two-sum"
"$BUN" "$CLI" two-sum > /dev/null
for f in solution.cpp problem.md solution.md whiteboard.excalidraw in.txt out.txt Makefile README.md .gitignore; do
    [ -e "two-sum/$f" ] || fail "缺少 two-sum/$f"
done
grep -q "algo:todo" two-sum/problem.md || fail "problem.md 应带未填写的模板标记"
grep -q "algo:todo" two-sum/solution.md || fail "solution.md 应带未填写的模板标记"
"$BUN" check-board.ts two-sum/whiteboard.excalidraw || fail "白板不是合法的 Excalidraw 场景"
echo "  ✓ 9 个文件齐了，白板可解析"

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

echo "→ make run"
if (cd two-sum && make run) | grep -q '^0 1$'; then
    echo "  ✓ 输出正确"
else
    fail "make run 输出不对"
fi

echo "→ make check"
if (cd two-sum && make check) | grep -q "✅ AC"; then
    echo "  ✓ AC"
else
    fail "对拍失败"
fi

echo "→ 清理校验：跑完不许留编译产物"
for f in solution solution_dbg .out.actual .out.diff; do
    if [ -e "two-sum/$f" ]; then
        fail "make 之后残留了 two-sum/$f"
    fi
done
echo "  ✓ 无残留"

echo "→ make build / make clean"
(cd two-sum && make build > /dev/null)
[ -e two-sum/solution ] || fail "make build 没有产出二进制"
(cd two-sum && make clean > /dev/null)
[ -e "two-sum/solution" ] && fail "make clean 没有删掉二进制"
echo "  ✓ build 保留、clean 清理"

echo "→ 编译失败也要清理"
printf 'int main(){ 这不是合法的 C++ }\n' > two-sum/solution.cpp
(cd two-sum && make run > /dev/null 2>&1) || true
[ -e "two-sum/solution" ] && fail "编译失败后残留了二进制"
echo "  ✓ 编译失败无残留"

echo "→ add 只补题面（不碰 solution.md 和代码）"
printf '## 题目描述\n\n两数之和。\n' > only-problem.md
"$BUN" "$CLI" add two-sum --problem-file only-problem.md > /dev/null
grep -q "两数之和" two-sum/problem.md || fail "problem.md 没更新"
grep -q "algo:todo" two-sum/solution.md || fail "未指定的 solution.md 不该被改动"
echo "  ✓ 只更新目标文件"

echo "→ algo add --json（AI 用法：一次带上题面与解法）"
cat > spec.json <<'EOF'
{
  "name": "three-sum",
  "title": "三数之和",
  "link": "https://leetcode.cn/problems/3sum/",
  "difficulty": "中等",
  "tags": ["数组", "双指针"],
  "problem": "## 题目描述\n\n给你一个整数数组 nums。\n",
  "solution": "## 思路\n\n排序 + 双指针夹逼。\n"
}
EOF
"$BUN" "$CLI" add --json spec.json > /dev/null
grep -q "三数之和" three-sum/README.md || fail "README.md 没写进标题"
grep -q "中等" three-sum/README.md || fail "README.md 没写进难度"
grep -q "双指针" three-sum/README.md || fail "README.md 没写进标签"
grep -q "题目描述" three-sum/problem.md || fail "problem.md 没写进题面"
grep -q "双指针" three-sum/solution.md || fail "solution.md 没写进解法"
grep -q "algo:todo" three-sum/problem.md && fail "写过的 problem.md 不该还有模板标记"
echo "  ✓ 内容落盘"

echo "→ add 二次更新只动指定的 md"
printf '## 补充\n\n后补的题面。\n' > later.md
"$BUN" "$CLI" add three-sum --problem-file later.md > /dev/null
grep -q "后补的题面" three-sum/problem.md || fail "更新 problem.md 失败"
grep -q "排序 + 双指针夹逼" three-sum/solution.md || fail "未指定的 solution.md 被改动了"
echo "  ✓ 只更新目标文件"

echo "→ 标题里有引号 / 反斜杠也要是合法 JSON"
"$BUN" "$CLI" add quote-test --title 'a "b" \\ c' > /dev/null
"$BUN" check-board.ts quote-test/whiteboard.excalidraw 2>/dev/null || true
"$BUN" -e '
const s = JSON.parse(await Bun.file("quote-test/whiteboard.excalidraw").text());
if (s.elements[0].text !== process.argv[1]) throw new Error("标题被破坏了: " + s.elements[0].text);
' 'a "b" \\ c' || fail "特殊字符破坏了白板 JSON"
echo "  ✓ JSON 转义正确"

echo "→ algo list 进度标记"
"$BUN" "$CLI" list | grep -q "three-sum" || fail "list 没有输出 three-sum"
"$BUN" "$CLI" list | grep -q "题面✓思路✓板—" || fail "list 没有显示已填写状态"
"$BUN" "$CLI" list | grep -q "题面✓思路—板—" || fail "list 没有显示只填了题面的状态"
echo "  ✓ 进度标记正常"

echo "→ algo setup --dry-run（只读，不写配置）"
"$BUN" "$CLI" setup --dry-run > /dev/null

echo "✓ 冒烟测试全部通过"
