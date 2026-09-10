// 缺失的第一个正数（LeetCode 41）
// https://leetcode.cn/problems/first-missing-positive/
//
// 思路：原地哈希——把值 v (1<=v<=n) 换到下标 v-1 上，再从头找第一个 nums[i] != i+1 的位置。
// 复杂度：时间 O(n) 空间 O(1)
#include <algorithm>
#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<int> nums(n);
    for (auto &x : nums) cin >> x;

    for (int i = 0; i < n; ++i) {
        // 只处理 [1, n] 内的值；目标位置已经是对的就不再动，避免重复元素死循环
        while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
            swap(nums[i], nums[nums[i] - 1]);
        }
    }

    int ans = n + 1;  // 1..n 都出现过时的答案
    for (int i = 0; i < n; ++i) {
        if (nums[i] != i + 1) {
            ans = i + 1;
            break;
        }
    }

    cout << ans << '\n';
    return 0;
}
