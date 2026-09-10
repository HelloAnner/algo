// 比较版本号
// https://leetcode.cn/problems/compare-version-numbers/
//
// 思路：双指针逐段扫描，边扫边累加出每个修订号的数值（自动忽略前导零），逐段比较，缺段视为 0。
// 复杂度：时间 O(n + m) 空间 O(1)
#include <iostream>
#include <string>

using namespace std;

// 从 s[i] 开始读一个修订号的数值，返回其值，并把 i 停在 '.' 之后（或末尾）
long long nextRevision(const string &s, size_t &i) {
    long long v = 0;
    while (i < s.size() && s[i] != '.') {
        v = v * 10 + (s[i] - '0');
        ++i;
    }
    if (i < s.size()) ++i;  // 跳过 '.'
    return v;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string v1, v2;
    if (!(cin >> v1) || !(cin >> v2)) return 0;

    size_t i = 0, j = 0;
    while (i < v1.size() || j < v2.size()) {
        // 越界的一方按补 0 处理
        long long a = (i < v1.size()) ? nextRevision(v1, i) : 0;
        long long b = (j < v2.size()) ? nextRevision(v2, j) : 0;
        if (a > b) {
            cout << 1 << '\n';
            return 0;
        }
        if (a < b) {
            cout << -1 << '\n';
            return 0;
        }
    }
    cout << 0 << '\n';
    return 0;
}
