// 接雨水
// https://leetcode.cn/problems/trapping-rain-water/
//
// 思路：双指针。每次结算较矮的一侧：该侧水位已由它自己的前缀/后缀最大值确定。
// 复杂度：时间 O(n) 空间 O(1)
#include <algorithm>
#include <iostream>
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

    vector<long long> h(n);
    for (auto &x : h) cin >> x;

    long long ans = 0;
    int left = 0, right = n - 1;
    long long leftMax = 0, rightMax = 0;  // 0 是合法下界（高度非负）

    while (left < right) {
        if (h[left] < h[right]) {
            leftMax = max(leftMax, h[left]);   // 先更新前缀最大，再结算
            ans += leftMax - h[left];
            ++left;
        } else {
            rightMax = max(rightMax, h[right]);
            ans += rightMax - h[right];
            --right;
        }
    }

    cout << ans << '\n';
    return 0;
}
