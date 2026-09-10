// 最长连续序列
// https://leetcode.cn/problems/longest-consecutive-sequence/
//
// 思路：所有数字入哈希集合，只从「x-1 不在集合里」的 x 出发向后数连续段，每段恰好枚举一次。
// 复杂度：时间 O(n) 空间 O(n)
#include <algorithm>
#include <iostream>
#include <unordered_set>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        cout << 0 << '\n';
        return 0;
    }

    vector<int> nums(n);
    unordered_set<int> seen;
    seen.reserve(static_cast<size_t>(n) * 2);
    for (int i = 0; i < n; ++i) {
        cin >> nums[i];
        seen.insert(nums[i]);
    }

    int best = 0;
    for (int x : nums) {
        if (seen.count(x - 1)) continue;  // x 不是起点，跳过
        int len = 1;
        while (seen.count(x + len)) ++len;  // 从起点向后数
        best = max(best, len);
    }

    cout << best << '\n';
    return 0;
}
