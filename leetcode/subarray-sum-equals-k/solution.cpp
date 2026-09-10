// 和为 K 的子数组（LeetCode 560. Subarray Sum Equals K）
// https://leetcode.cn/problems/subarray-sum-equals-k/
//
// 思路：前缀和 + 哈希表。遍历时把每个前缀和的出现次数记进 map；
//       当前前缀和为 pre 时，以当前位置结尾且和为 k 的子数组个数就是 map[pre - k]。
// 复杂度：时间 O(n) 空间 O(n)
#include <iostream>
#include <unordered_map>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long k;
    if (!(cin >> n >> k)) return 0;

    unordered_map<long long, long long> cnt;
    cnt.reserve(static_cast<size_t>(n) * 2 + 1);
    cnt[0] = 1;  // 空前缀：让从下标 0 开始的子数组也能被统计

    long long pre = 0;
    long long ans = 0;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        pre += x;
        auto it = cnt.find(pre - k);
        if (it != cnt.end()) ans += it->second;
        ++cnt[pre];
    }

    cout << ans << '\n';
    return 0;
}
