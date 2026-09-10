// 手写二分查找
// https://leetcode.cn/problems/binary-search/
//
// 思路：在升序数组上用左闭右开区间 [lo, hi) 二分，找第一个 >= target 的位置，再确认是否命中。
// 复杂度：时间 O(log n) 空间 O(1)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    if (!(cin >> n) || n <= 0) {
        cout << -1 << '\n';
        return 0;
    }

    vector<long long> nums(n);
    for (auto &x : nums) cin >> x;

    long long target = 0;
    cin >> target;

    int lo = 0, hi = n;  // 左闭右开 [lo, hi)
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] < target) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    if (lo < n && nums[static_cast<size_t>(lo)] == target) cout << lo << '\n';
    else cout << -1 << '\n';
    return 0;
}
