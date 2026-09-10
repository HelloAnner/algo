// 在排序数组中查找元素的第一个和最后一个位置（LeetCode 34）
// https://leetcode.cn/problems/find-first-and-last-position-of-element-in-sorted-array/
//
// 思路：两次二分——lowerBound 找第一个 >= target，upperBound 找第一个 > target，减一即右边界。
// 复杂度：时间 O(log n) 空间 O(1)（不含输入数组）
#include <iostream>
#include <vector>

using namespace std;

// 第一个 >= target 的下标，区间左闭右开 [l, r)
int lowerBound(const vector<int> &a, int target) {
    int l = 0, r = (int)a.size();
    while (l < r) {
        int mid = l + (r - l) / 2;
        if (a[mid] >= target) {
            r = mid;  // mid 可能就是答案，保留
        } else {
            l = mid + 1;
        }
    }
    return l;
}

// 第一个 > target 的下标，区间左闭右开 [l, r)
int upperBound(const vector<int> &a, int target) {
    int l = 0, r = (int)a.size();
    while (l < r) {
        int mid = l + (r - l) / 2;
        if (a[mid] > target) {
            r = mid;  // 只有严格大于时才收缩右边界
        } else {
            l = mid + 1;
        }
    }
    return l;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, target;
    cin >> n >> target;

    vector<int> nums(n);
    for (auto &x : nums) cin >> x;

    int left = lowerBound(nums, target);
    if (left == n || nums[left] != target) {
        cout << -1 << ' ' << -1 << '\n';  // 不存在
    } else {
        int right = upperBound(nums, target) - 1;  // 第一个 > target 的前一个位置
        cout << left << ' ' << right << '\n';
    }
    return 0;
}
