// 合并区间
// https://leetcode.cn/problems/merge-intervals/
//
// 思路：按左端点排序后扫一遍，与当前区间重叠（l <= 当前右端点）就更新右端点为 max，否则另起一段。
// 复杂度：时间 O(n log n) 空间 O(n)
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    vector<pair<long long, long long>> intervals(n);
    for (auto &seg : intervals) cin >> seg.first >> seg.second;

    sort(intervals.begin(), intervals.end());

    vector<pair<long long, long long>> res;
    for (const auto &seg : intervals) {
        if (!res.empty() && seg.first <= res.back().second) {
            res.back().second = max(res.back().second, seg.second);
        } else {
            res.push_back(seg);
        }
    }

    cout << res.size() << '\n';
    for (const auto &seg : res) cout << seg.first << ' ' << seg.second << '\n';
    return 0;
}
