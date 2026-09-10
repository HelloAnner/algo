// 找出重复元素
// 面试经典题：n 个 0~42 亿的正整数，找出所有恰好出现 2 次的数字
//
// 思路：先求 min/max 把位图下标平移，每个数字用 2 bit 计数（到 3 饱和），再顺序扫描位图输出恰好 2 次的数字。
// 复杂度：时间 O(n + max-min) 空间 O((max-min)/4) 字节
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n)) return 0;

    vector<long long> a(n);
    long long lo = 0, hi = 0;
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
        if (i == 0) {
            lo = hi = a[i];
        } else {
            lo = min(lo, a[i]);
            hi = max(hi, a[i]);
        }
    }

    // 位图下标平移 lo，只覆盖 [lo, hi]；每个数字 2 bit 记录出现次数（0/1/2，到 3 饱和）
    unsigned long long span = static_cast<unsigned long long>(hi - lo) + 1ULL;
    vector<unsigned char> bitmap(static_cast<size_t>((span + 3ULL) / 4ULL), 0);

    for (long long v : a) {
        size_t idx = static_cast<size_t>(v - lo);
        size_t byte = idx >> 2;
        int shift = static_cast<int>(idx & 3ULL) * 2;
        int cnt = (bitmap[byte] >> shift) & 3;
        if (cnt < 3) {
            // 0->1、1->2、2->3（3 表示出现 3 次及以上，不再是「恰好 2 次」）
            bitmap[byte] = static_cast<unsigned char>(bitmap[byte] + (1 << shift));
        }
    }

    bool any = false;
    for (unsigned long long i = 0; i < span; ++i) {
        size_t byte = static_cast<size_t>(i >> 2);
        int shift = static_cast<int>(i & 3ULL) * 2;
        if (((bitmap[byte] >> shift) & 3) == 2) {
            cout << (lo + static_cast<long long>(i)) << '\n';
            any = true;
        }
    }
    if (!any) cout << -1 << '\n';
    return 0;
}
