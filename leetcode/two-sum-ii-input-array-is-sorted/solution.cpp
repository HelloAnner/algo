// 和为 s 的两个数字（原文档小节：找出和为 k 的数对）
// https://leetcode.cn/problems/he-wei-sde-liang-ge-shu-zi-lcof/
//
// 思路：数组有序，双指针对撞：和大了右指针左移，和小了左指针右移，相等即答案。
// 复杂度：时间 O(n) 空间 O(1)
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n = 0;
    long long target = 0;
    if (!(cin >> n >> target)) return 0;

    vector<int> nums(n);
    for (auto &x : nums) cin >> x;

    int i = 0, j = n - 1;
    while (i < j) {
        long long sum = static_cast<long long>(nums[i]) + nums[j];
        if (sum > target) {
            --j;
        } else if (sum < target) {
            ++i;
        } else {
            cout << nums[i] << ' ' << nums[j] << '\n';
            return 0;
        }
    }

    // 题目保证有解，这里只是防御性输出
    cout << -1 << ' ' << -1 << '\n';
    return 0;
}
