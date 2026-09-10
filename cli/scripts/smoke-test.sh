#!/bin/sh
# algo 冒烟测试：建题 → 编译/运行 → 对拍 → 清理校验 → 配置预览
# 用法：sh scripts/smoke-test.sh [dist/algo.js 路径]
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI="${1:-$ROOT/dist/algo.js}"
BUN="$(command -v bun || echo bun)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$TMP"

echo "→ algo two-sum"
"$BUN" "$CLI" two-sum > /dev/null
for f in solution.cpp in.txt out.txt Makefile README.md .gitignore; do
    [ -e "two-sum/$f" ] || { echo "✗ 缺少 two-sum/$f"; exit 1; }
done

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
    echo "✗ make run 输出不对"
    exit 1
fi

echo "→ make check"
if (cd two-sum && make check) | grep -q "✅ AC"; then
    echo "  ✓ AC"
else
    echo "✗ 对拍失败"
    exit 1
fi

echo "→ 清理校验：跑完不许留编译产物"
for f in solution solution_dbg .out.actual .out.diff; do
    if [ -e "two-sum/$f" ]; then
        echo "✗ make 之后残留了 two-sum/$f"
        exit 1
    fi
done
echo "  ✓ 无残留"

echo "→ make build / make clean"
(cd two-sum && make build > /dev/null)
if [ ! -e two-sum/solution ]; then
    echo "✗ make build 没有产出二进制"
    exit 1
fi
(cd two-sum && make clean > /dev/null)
if [ -e "two-sum/solution" ]; then
    echo "✗ make clean 没有删掉二进制"
    exit 1
fi
echo "  ✓ build 保留、clean 清理"

echo "→ 编译失败也要清理"
printf 'int main(){ 这不是合法的 C++ }\n' > two-sum/solution.cpp
(cd two-sum && make run > /dev/null 2>&1) || true
if [ -e "two-sum/solution" ]; then
    echo "✗ 编译失败后残留了二进制"
    exit 1
fi
echo "  ✓ 编译失败无残留"

echo "→ algo list"
"$BUN" "$CLI" list | grep -q "two-sum" || { echo "✗ list 没有输出 two-sum"; exit 1; }

echo "→ algo setup --dry-run（只读，不写配置）"
"$BUN" "$CLI" setup --dry-run > /dev/null

echo "✓ 冒烟测试全部通过"
