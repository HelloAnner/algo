// 和为s的连续正数序列
// https://leetcode.cn/problems/he-wei-sde-lian-xu-zheng-shu-xu-lie-lcof/
//
// 思路：滑动窗口（双指针），窗口 [l, r) 的和小于 target 就右扩、大于就左缩、相等就记录后左缩。
// 复杂度：时间 O(target) 空间 O(1)（不计输出）
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    long long target = 0;
    if (!(cin >> target)) return 0;

    vector<vector<long long>> res;
    long long l = 1, r = 1, sum = 0;  // 窗口 [l, r)
    while (l <= target / 2) {
        if (sum < target) {
            sum += r;
            ++r;
        } else if (sum > target) {
            sum -= l;
            ++l;
        } else {
            vector<long long> seq;
            seq.reserve(static_cast<size_t>(r - l));
            for (long long x = l; x < r; ++x) seq.push_back(x);
            res.push_back(seq);
            sum -= l;
            ++l;
        }
    }

    cout << res.size() << '\n';
    for (const auto &seq : res) {
        for (size_t i = 0; i < seq.size(); ++i) {
            if (i > 0) cout << ' ';
            cout << seq[i];
        }
        cout << '\n';
    }
    return 0;
}
